/**
 * Main application — UI orchestration and table management
 */

const App = {
  entrants: [],
  groupAssignments: null,
  cornerCount: 4,
  eventTitle: '',
  table: null,
  hasLadies: false,
  manualAssignments: new Map(),
  maxGroupDiff: 4,
  lockedClasses: new Set(),
  noviceMode: 'follow',
  ladiesMode: 'follow',
  validCombos: null,
  comboIndex: 0,

  init() {
    Memory.init();
    this._setDefaultTitle();
    this._bindEvents();
    this._buildPaxClassUI();
    this._updateButtonStates();
    // Clear stale file inputs on page reload (browser keeps display but not data)
    document.getElementById('csv-file').value = '';
    document.getElementById('memory-file').value = '';
    document.getElementById('savepoint-file').value = '';
    // Offer to resume from localStorage save point if one exists
    this._tryResumeFromLocalStorage();
  },

  // ── Event Title ──────────────────────────────────────────────

  _setDefaultTitle() {
    const now = new Date();
    document.getElementById('event-name').value = 'ALSCCA Autocross Pts. #';
    document.getElementById('event-date').value = now.toISOString().split('T')[0];
    this._buildEventTitle();
  },

  _buildEventTitle() {
    const name = document.getElementById('event-name').value;
    const dateVal = document.getElementById('event-date').value;
    if (dateVal) {
      const [y, m, d] = dateVal.split('-').map(Number);
      const months = ['January','February','March','April','May','June',
        'July','August','September','October','November','December'];
      this.eventTitle = `${name} - ${months[m - 1]} ${d}`;
    } else {
      this.eventTitle = name;
    }
  },

  // ��─ Event Binding ────────────────────────────────────────────

  _bindEvents() {
    document.getElementById('csv-file').addEventListener('change', (e) => {
      if (e.target.files[0]) {
        document.getElementById('csv-file-label').textContent = '';
        this.loadCSV(e.target.files[0]);
      }
    });

    document.getElementById('memory-file').addEventListener('change', async (e) => {
      if (e.target.files[0]) {
        document.getElementById('memory-file-label').textContent = '';
        const success = await Memory.loadFromFile(e.target.files[0]);
        this._showStatus(
          success ? 'Memory loaded successfully.' : 'Failed to load memory file.',
          success ? 'success' : 'error'
        );
        if (success && this.entrants.length > 0) {
          this._buildManualAssignmentUI();
        }
      }
    });

    document.getElementById('btn-auto-balance').addEventListener('click', () => this.autoBalance());
    document.getElementById('btn-assign').addEventListener('click', () => this.assignWorkers());
    document.getElementById('btn-pdf-workers').addEventListener('click', () => this.generateWorkerPDF());
    document.getElementById('btn-pdf-groups').addEventListener('click', () => this.generateGroupsPDF());
    document.getElementById('btn-download-memory').addEventListener('click', () => this.downloadMemory());
    document.getElementById('btn-view-memory').addEventListener('click', () => Memory.openViewer());
    document.getElementById('btn-view-entries').addEventListener('click', () => this.openEntryListViewer());
    document.getElementById('btn-clear-memory').addEventListener('click', () => this.clearMemory());

    document.getElementById('btn-sample-csv').addEventListener('click', () => this.loadSampleCSV());
    document.getElementById('btn-sample-memory').addEventListener('click', () => this.loadSampleMemory());

    document.getElementById('savepoint-file').addEventListener('change', async (e) => {
      if (e.target.files[0]) {
        document.getElementById('savepoint-file-label').textContent = '';
        await this._loadProgressFromFile(e.target.files[0]);
      }
    });
    document.getElementById('btn-save-progress').addEventListener('click', () => this._saveProgress());
    document.getElementById('btn-view-savepoint').addEventListener('click', () => this._viewSavePoint());
    document.getElementById('btn-reset-app').addEventListener('click', () => this._resetApp());

    document.getElementById('event-name').addEventListener('input', () => {
      this._buildEventTitle();
      this._scheduleAutoSave();
    });
    document.getElementById('event-date').addEventListener('change', () => {
      this._buildEventTitle();
      this._scheduleAutoSave();
    });

    document.getElementById('corner-count').addEventListener('change', (e) => {
      this.cornerCount = parseInt(e.target.value) || 4;
      this._scheduleAutoSave();
    });

    // Sort: auto-sort A-Z on category selection
    document.getElementById('sort-column').addEventListener('change', () => this._sortEntrants(true));
    document.getElementById('btn-sort-asc').addEventListener('click', () => this._sortEntrants(true));
    document.getElementById('btn-sort-desc').addEventListener('click', () => this._sortEntrants(false));

    // Collapsible sections
    for (const header of document.querySelectorAll('.collapsible-header')) {
      header.addEventListener('click', () => {
        const section = header.closest('.collapsible');
        const body = section.querySelector('.collapsible-body');
        section.classList.toggle('open');
        body.style.display = section.classList.contains('open') ? 'block' : 'none';
      });
    }

    document.getElementById('btn-reset-pax').addEventListener('click', () => {
      this.noviceMode = 'follow';
      this.ladiesMode = 'follow';
      CONFIG.resetClasses();
      // Re-assign entrant classes from restored defaults
      for (const e of this.entrants) {
        if (['N', 'L', 'X', 'R'].includes(e.class)) continue;
        const cls = CONFIG.getClassForPax(e.pax);
        if (cls) e.class = cls;
      }
      if (this.entrants.length > 0) this._updateTable();
      this._invalidateCombos();
      this._buildPaxClassUI();
      if (this.entrants.length > 0) {
        this._buildGroupAssignmentUI();
        this._buildManualAssignmentUI();
        this._buildAlgorithmAssignmentUI();
      }
    });

    document.getElementById('btn-view-defaults').addEventListener('click', () => this._showDefaultClassesModal());
  },

  // ── CSV Loading ──────────────────────────────────────────────

  async loadCSV(file) {
    try {
      this.rawCsvText = await file.text();
      this.entrants = CSV.parseText(this.rawCsvText);
      this.hasLadies = this.entrants.some((e) => e.class === 'L');
      this._showStatus(`Loaded ${this.entrants.length} entrants.`, 'success');
      this._renderTable();
      this._autoSizeColumns();
      this._buildGroupAssignmentUI();
      this._buildManualAssignmentUI();
      this._buildAlgorithmAssignmentUI();
      this._updateButtonStates();
    } catch (err) {
      this._showStatus(`Error loading CSV: ${err.message}`, 'error');
    }
  },

  async loadSampleCSV() {
    try {
      const response = await fetch('./examples/entry_list-ALSCCA_2026_Event2.csv');
      if (!response.ok) throw new Error('Failed to fetch sample CSV');
      const blob = await response.blob();
      const file = new File([blob], 'entry_list-ALSCCA_2026_Event2.csv', { type: 'text/csv' });
      await this.loadCSV(file);
      document.getElementById('csv-file-label').textContent = 'entry_list-ALSCCA_2026_Event2.csv';
    } catch (err) {
      this._showStatus(`Error loading sample CSV: ${err.message}`, 'error');
    }
  },

  async loadSampleMemory() {
    try {
      const response = await fetch('./examples/2025%20full%20season%20ALSCCA%20workers%20memory.json');
      if (!response.ok) throw new Error('Failed to fetch sample memory');
      const blob = await response.blob();
      const file = new File([blob], 'memory.json', { type: 'application/json' });
      const success = await Memory.loadFromFile(file, 'sample file');
      this._showStatus(
        success ? 'Sample memory loaded successfully.' : 'Failed to load sample memory.',
        success ? 'success' : 'error'
      );
      if (success) {
        document.getElementById('memory-file-label').textContent = '2025 full season ALSCCA workers memory.json';
        if (this.entrants.length > 0) {
          this._buildManualAssignmentUI();
        }
      }
    } catch (err) {
      this._showStatus(`Error loading sample memory: ${err.message}`, 'error');
    }
  },

  // ── PAX / Class Configuration ────────────────────────────────

  _buildPaxClassUI() {
    const toggles = document.getElementById('class-mode-toggles');
    const grid = document.getElementById('pax-class-grid');
    toggles.innerHTML = '';
    grid.innerHTML = '';

    // Novice mode toggle
    const novDiv = document.createElement('div');
    novDiv.className = 'mode-toggle';
    novDiv.innerHTML = `
      <span class="toggle-label">Novice Mode</span>
      <label><input type="radio" name="novice-mode" value="follow" ${this.noviceMode === 'follow' ? 'checked' : ''}> Follow PAX class</label>
      <label><input type="radio" name="novice-mode" value="separate" ${this.noviceMode === 'separate' ? 'checked' : ''}> Own class</label>
    `;
    novDiv.querySelectorAll('input').forEach((r) => {
      r.addEventListener('change', () => {
        this.noviceMode = r.value;
        this._invalidateCombos();
        if (this.entrants.length > 0) this._buildGroupAssignmentUI();
        this._scheduleAutoSave();
      });
    });
    toggles.appendChild(novDiv);

    // Ladies mode toggle
    const ladDiv = document.createElement('div');
    ladDiv.className = 'mode-toggle';
    ladDiv.innerHTML = `
      <span class="toggle-label">Ladies Mode</span>
      <label><input type="radio" name="ladies-mode" value="follow" ${this.ladiesMode === 'follow' ? 'checked' : ''}> Follow PAX class</label>
      <label><input type="radio" name="ladies-mode" value="separate" ${this.ladiesMode === 'separate' ? 'checked' : ''}> Own class</label>
    `;
    ladDiv.querySelectorAll('input').forEach((r) => {
      r.addEventListener('change', () => {
        this.ladiesMode = r.value;
        this._invalidateCombos();
        if (this.entrants.length > 0) this._buildGroupAssignmentUI();
        this._scheduleAutoSave();
      });
    });
    toggles.appendChild(ladDiv);

    // PAX-to-class grid (#8: proper formatting, #9: live update)
    // Collect all PAX entries and sort by length then alphabetically
    const allPaxEntries = [];
    for (const [clsKey, clsInfo] of Object.entries(CONFIG.classes)) {
      for (const pax of clsInfo.pax) {
        allPaxEntries.push({ pax, clsKey });
      }
    }
    allPaxEntries.sort((a, b) => {
      if (a.pax.length !== b.pax.length) return a.pax.length - b.pax.length;
      return a.pax.localeCompare(b.pax);
    });

    for (const entry of allPaxEntries) {
      const row = document.createElement('div');
      row.className = 'pax-row';

      const label = document.createElement('span');
      label.className = 'pax-label';
      label.textContent = entry.pax;
      row.appendChild(label);

      const sel = document.createElement('select');
      sel.dataset.pax = entry.pax;
      for (const [k, info] of Object.entries(CONFIG.classes)) {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k;
        if (k === entry.clsKey) opt.selected = true;
        sel.appendChild(opt);
      }
      sel.addEventListener('change', () => {
        const pax = sel.dataset.pax;
        const newCls = sel.value;
        // Update CONFIG: move PAX from old class to new class
        for (const [k, info] of Object.entries(CONFIG.classes)) {
          const idx = info.pax.indexOf(pax);
          if (idx !== -1) { info.pax.splice(idx, 1); break; }
        }
        CONFIG.classes[newCls].pax.push(pax);
        // Update entrants with this PAX (skip special classes)
        for (const e of this.entrants) {
          if (e.pax === pax && !['N', 'L', 'X', 'R'].includes(e.class)) {
            e.class = newCls;
          }
        }
        if (this.entrants.length > 0) this._updateTable();
        this._invalidateCombos();
        if (this.entrants.length > 0) {
          this._buildGroupAssignmentUI();
          this._buildManualAssignmentUI();
        }
      });
      row.appendChild(sel);
      grid.appendChild(row);
    }
  },

  // ── Spreadsheet ──────────────────────────────────────────────

  _renderTable() {
    const container = document.getElementById('spreadsheet');
    container.innerHTML = '';

    const data = this.entrants.map((e) => [
      e.competitor, e.class, e.pax, e.number,
      e.running, e.working, e.positions.join(', '), e.comments,
    ]);

    this.table = jspreadsheet(container, {
      data: data,
      columns: [
        { title: 'Competitor', width: 160 },
        { title: 'Class', width: 50 },
        { title: 'PAX', width: 55 },
        { title: '#', width: 40 },
        { title: 'Running', width: 85 },
        { title: 'Working', width: 85 },
        { title: 'Position', width: 160 },
        { title: 'Comments', width: 160 },
      ],
      defaultColWidth: 80,
      tableOverflow: true,
      tableWidth: '100%',
      tableHeight: '500px',
      columnSorting: false,
      allowInsertRow: true,
      allowDeleteRow: true,
      allowInsertColumn: false,
      allowDeleteColumn: false,
      contextMenu: true,
      onchange: () => { this._syncFromTable(); this._checkDuplicatePositions(); },
    });
  },

  _checkDuplicatePositions() {
    // Count by position + work session; corner workers are allowed multiples.
    // Each entrant.positions[] piece is counted independently so that one entrant
    // holding multiple early roles never warns, but two entrants sharing a session
    // role does.
    const counts = {};
    const seen = new Set();

    for (const e of this.entrants) {
      if (!e.positions.length || !e.working) continue;
      for (const pos of e.positions) {
        if (pos.endsWith('Worker')) continue;
        const key = `${pos}::${e.working}`;
        counts[key] = (counts[key] || 0) + 1;
        seen.add(`${e.competitor}::${key}`);
      }
    }
    // Count manual assignments not yet synced to entrants
    for (const [pos, worker] of this.manualAssignments) {
      if (pos.endsWith('Worker')) continue;
      const working = document.querySelector(`.manual-table select[data-position="${pos}"]`)?.dataset.working || '';
      const key = `${pos}::${working}`;
      if (seen.has(`${worker}::${key}`)) continue;
      counts[key] = (counts[key] || 0) + 1;
    }

    const dupes = Object.keys(counts)
      .filter((k) => counts[k] > 1)
      .map((k) => k.split('::')[0]);
    const warning = document.getElementById('duplicate-warning');
    if (dupes.length > 0) {
      warning.textContent = `Duplicate positions: ${dupes.join(', ')}`;
      warning.style.display = '';
    } else {
      warning.style.display = 'none';
    }
  },

  /** Auto-size columns to fit content (#7) */
  _autoSizeColumns() {
    if (!this.table) return;
    const data = this.table.getData();
    const headers = ['Competitor', 'Class', 'PAX', '#', 'Running', 'Working', 'Position', 'Comments'];
    const minWidths = [120, 45, 45, 35, 75, 75, 120, 120];

    for (let col = 0; col < headers.length; col++) {
      let maxLen = headers[col].length;
      for (const row of data) {
        const cellLen = (row[col] || '').toString().length;
        if (cellLen > maxLen) maxLen = cellLen;
      }
      const width = Math.max(minWidths[col], maxLen * 8 + 20);
      this.table.setWidth(col, width);
    }
  },

  _sortEntrants(ascending) {
    this._syncFromTable();
    const colIdx = parseInt(document.getElementById('sort-column').value);
    if (isNaN(colIdx)) return;

    const fields = ['competitor', 'class', 'pax', 'number', 'running', 'working', 'position', 'comments'];
    const field = fields[colIdx];
    if (!field) return;

    this.entrants.sort((a, b) => {
      const va = (a[field] || '').toString().toLowerCase();
      const vb = (b[field] || '').toString().toLowerCase();
      const cmp = va.localeCompare(vb, undefined, { numeric: true });
      return ascending ? cmp : -cmp;
    });

    this._updateTable();
    this._showStatus(`Sorted by ${fields[colIdx]}${ascending ? ' (A-Z)' : ' (Z-A)'}.`, 'success');
  },

  _syncFromTable() {
    if (!this.table) return;
    const data = this.table.getData();

    while (this.entrants.length < data.length) {
      this.entrants.push({
        competitor: '', class: '', pax: '', number: '',
        sccaMember: '', classPaxNum: '', running: '',
        working: '', positions: [], comments: '',
      });
    }
    this.entrants.length = data.length;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const e = this.entrants[i];
      e.competitor = row[0] || '';
      e.class = (row[1] || '').toUpperCase();
      e.pax = (row[2] || '').toUpperCase();
      e.number = row[3] || '';
      e.running = row[4] || '';
      e.working = row[5] || '';
      e.positions = (row[6] || '').split(',').map((s) => s.trim()).filter(Boolean);
      e.comments = row[7] || '';
      e.classPaxNum = `${e.class}_${e.pax}_${e.number}`;
    }
  },

  _updateTable() {
    if (!this.table) return;
    const data = this.entrants.map((e) => [
      e.competitor, e.class, e.pax, e.number,
      e.running, e.working, e.positions.join(', '), e.comments,
    ]);
    this.table.setData(data);
    this._autoSizeColumns();
  },

  // ── Run Group Assignment UI ──────────────────────────────────

  _buildGroupAssignmentUI() {
    const container = document.getElementById('group-assignment');
    container.innerHTML = '';

    const classCounts = {};
    for (const e of this.entrants) {
      classCounts[e.class] = (classCounts[e.class] || 0) + 1;
    }

    const opts = this._getGroupOptions();
    const result = Groups.autoAssign(this.entrants, opts);
    if (result.allValid.length > 0) {
      this.groupAssignments = result.allValid[0].assignment;
      this.validCombos = result.allValid;
      this.comboIndex = 0;
    } else {
      this.groupAssignments = result.assignments;
      this.validCombos = null;
    }

    const heading = document.createElement('h3');
    heading.textContent = 'Run Group Assignment';
    container.appendChild(heading);

    const desc = document.createElement('p');
    desc.className = 'help-text';
    desc.textContent = 'Assign each class to Run 1st or Run 2nd. Lock classes to keep them fixed during balancing.';
    container.appendChild(desc);

    // Two stacked sections for Run 1st / Run 2nd
    const section1 = document.createElement('div');
    section1.className = 'group-section';
    section1.id = 'group-section-1';
    const header1 = document.createElement('div');
    header1.className = 'group-section-header';
    header1.innerHTML = 'Run 1st';
    section1.appendChild(header1);
    const grid1 = document.createElement('div');
    grid1.className = 'group-grid';
    grid1.id = 'group-grid-1';
    section1.appendChild(grid1);

    const section2 = document.createElement('div');
    section2.className = 'group-section';
    section2.id = 'group-section-2';
    const header2 = document.createElement('div');
    header2.className = 'group-section-header';
    header2.innerHTML = 'Run 2nd';
    section2.appendChild(header2);
    const grid2 = document.createElement('div');
    grid2.className = 'group-grid';
    grid2.id = 'group-grid-2';
    section2.appendChild(grid2);

    const assignableClasses = CONFIG.getAssignableClasses();
    if (this.noviceMode === 'separate' && !assignableClasses.includes('N')) assignableClasses.push('N');
    if (this.ladiesMode === 'separate' && !assignableClasses.includes('L')) assignableClasses.push('L');
    for (const cls of Object.keys(classCounts)) {
      if (cls !== 'N' && cls !== 'L' && !assignableClasses.includes(cls)) {
        assignableClasses.push(cls);
      }
    }

    for (const cls of assignableClasses) {
      if (cls === 'N' && this.noviceMode !== 'separate') continue;
      if (cls === 'L' && this.ladiesMode !== 'separate') continue;

      const count = classCounts[cls] || 0;
      const noviceCount = (this.noviceMode === 'follow' && cls !== 'N') ? this._countNovicesForClass(cls) : 0;
      const ladiesCount = (this.ladiesMode === 'follow' && cls !== 'L') ? this._countLadiesForClass(cls) : 0;
      if (count === 0 && noviceCount === 0 && ladiesCount === 0) continue;

      const row = document.createElement('div');
      row.className = 'group-row';
      row.dataset.class = cls;

      const label = document.createElement('span');
      label.className = 'group-label';
      const classInfo = CONFIG.classes[cls] || CONFIG.specialClasses[cls] || { name: cls };
      let labelText = `${cls} (${classInfo.name || cls}) — ${count}`;
      if (noviceCount > 0) labelText += ` +${noviceCount}N`;
      if (ladiesCount > 0) labelText += ` +${ladiesCount}L`;
      label.textContent = labelText;

      const select = document.createElement('select');
      select.dataset.class = cls;
      select.id = `group-select-${cls}`;
      const assigned = this.groupAssignments[cls] || 1;
      select.innerHTML = `
        <option value="1" ${assigned === 1 ? 'selected' : ''}>Run 1st</option>
        <option value="2" ${assigned === 2 ? 'selected' : ''}>Run 2nd</option>
      `;
      select.addEventListener('change', () => {
        this.groupAssignments[cls] = parseInt(select.value);
        this._invalidateCombos();
        this._moveClassRows();
        this._updateGroupCounts();
        this._buildManualAssignmentUI();
      });

      const lockCb = document.createElement('input');
      lockCb.type = 'checkbox';
      lockCb.className = 'lock-check';
      lockCb.title = 'Lock this class';
      lockCb.dataset.class = cls;
      lockCb.checked = this.lockedClasses.has(cls);
      lockCb.addEventListener('change', () => {
        if (lockCb.checked) this.lockedClasses.add(cls);
        else this.lockedClasses.delete(cls);
        this._invalidateCombos();
      });

      row.appendChild(label);
      row.appendChild(select);
      row.appendChild(lockCb);

      // Place in correct section
      if (assigned === 2) {
        grid2.appendChild(row);
      } else {
        grid1.appendChild(row);
      }
    }

    container.appendChild(section1);
    container.appendChild(section2);

    if (this.noviceMode === 'follow') {
      const noviceCount = classCounts['N'] || 0;
      if (noviceCount > 0) {
        const note = document.createElement('div');
        note.className = 'novice-note';
        note.textContent = `Novice class: ${noviceCount} entrants (following their PAX class)`;
        container.appendChild(note);
      }
    }

    if (this.ladiesMode === 'follow' && this.hasLadies) {
      const note = document.createElement('div');
      note.className = 'ladies-note';
      note.textContent = `Ladies class: ${classCounts['L'] || 0} entrants (following their PAX class)`;
      container.appendChild(note);
    }

    // Group counts with inline max diff input (#5)
    const countsDiv = document.createElement('div');
    countsDiv.id = 'group-counts';
    countsDiv.className = 'group-counts';
    container.appendChild(countsDiv);
    this._updateGroupCounts();

    container.style.display = 'block';
  },

  _moveClassRows() {
    const grid1 = document.getElementById('group-grid-1');
    const grid2 = document.getElementById('group-grid-2');
    if (!grid1 || !grid2) return;

    for (const [cls, group] of Object.entries(this.groupAssignments)) {
      const row = document.querySelector(`.group-row[data-class="${cls}"]`);
      const targetGrid = group === 2 ? grid2 : grid1;
      if (row && row.parentElement !== targetGrid) {
        targetGrid.appendChild(row);
      }
    }
  },

  _countNovicesForClass(cls) {
    if (CONFIG.classes[cls]) {
      return this.entrants.filter((e) => e.class === 'N' && CONFIG.classes[cls].pax.includes(e.pax)).length;
    }
    if (cls === 'CAM') return this.entrants.filter((e) => e.class === 'N' && ['CAMS', 'CAMC', 'CAMT'].includes(e.pax)).length;
    if (cls === 'ST') return this.entrants.filter((e) => e.class === 'N' && ['SST', 'AST', 'BST', 'CST', 'DST', 'EST', 'GST'].includes(e.pax)).length;
    if (cls === 'XS') return this.entrants.filter((e) => e.class === 'N' && ['XA', 'XB'].includes(e.pax)).length;
    return 0;
  },

  _countLadiesForClass(cls) {
    if (CONFIG.classes[cls]) {
      return this.entrants.filter((e) => e.class === 'L' && CONFIG.classes[cls].pax.includes(e.pax)).length;
    }
    if (cls === 'CAM') return this.entrants.filter((e) => e.class === 'L' && ['CAMS', 'CAMC', 'CAMT'].includes(e.pax)).length;
    if (cls === 'ST') return this.entrants.filter((e) => e.class === 'L' && ['SST', 'AST', 'BST', 'CST', 'DST', 'EST', 'GST'].includes(e.pax)).length;
    if (cls === 'XS') return this.entrants.filter((e) => e.class === 'L' && ['XA', 'XB'].includes(e.pax)).length;
    return 0;
  },

  // ── Manual Assignments (#1, #2, #3) ──────────────────────────

  _buildManualAssignmentUI() {
    const sorted = [...this.entrants]
      .filter((e) => e.competitor)
      .sort((a, b) => a.competitor.localeCompare(b.competitor));

    this._buildEarlyManualUI(sorted);
    this._buildSessionManualUI(sorted);
    this._updateManualDropdowns();
  },

  /** Show a section, preserving the user's collapse choice on rebuild. */
  _restoreSectionVisibility(section, wasOpen, wasVisible) {
    section.style.display = 'block';
    const body = section.querySelector('.collapsible-body');
    if (wasVisible) {
      if (wasOpen) {
        section.classList.add('open');
        body.style.display = 'block';
      } else {
        section.classList.remove('open');
        body.style.display = 'none';
      }
    } else {
      // First render: open by default.
      section.classList.add('open');
      body.style.display = 'block';
    }
  },

  _buildEarlyManualUI(sorted) {
    const section = document.getElementById('manual-assignment-section');
    const tableContainer = document.getElementById('manual-assignments-table');
    const wasOpen = section.classList.contains('open');
    const wasVisible = section.style.display !== 'none';
    tableContainer.innerHTML = '';

    const autoFillBtn = document.createElement('button');
    autoFillBtn.textContent = 'Auto-Fill Early Positions';
    autoFillBtn.className = 'sample-btn';
    autoFillBtn.style.marginRight = 'var(--space-sm)';
    autoFillBtn.style.marginBottom = 'var(--space-sm)';
    autoFillBtn.addEventListener('click', () => this._autoFillEarlyAssignments());
    tableContainer.appendChild(autoFillBtn);

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear Assignments';
    clearBtn.className = 'danger';
    clearBtn.style.marginBottom = 'var(--space-sm)';
    clearBtn.addEventListener('click', () => this._clearEarlyAssignments());
    tableContainer.appendChild(clearBtn);

    const table = document.createElement('table');
    table.className = 'manual-table';

    for (const group of CONFIG.earlyPositionGroups) {
      const headerRow = document.createElement('tr');
      headerRow.className = 'manual-category-header';
      const th = document.createElement('td');
      th.colSpan = 2;
      th.textContent = group.name;
      headerRow.appendChild(th);
      table.appendChild(headerRow);

      for (const position of group.positions) {
        table.appendChild(this._buildManualTableRow(position, sorted, 'Early', null));
      }
    }

    tableContainer.appendChild(table);
    this._restoreSectionVisibility(section, wasOpen, wasVisible);
  },

  _buildSessionManualUI(sorted) {
    const section = document.getElementById('session-manual-section');
    const tableContainer = document.getElementById('session-manual-table');
    const wasOpen = section.classList.contains('open');
    const wasVisible = section.style.display !== 'none';
    tableContainer.innerHTML = '';

    const autoFillBtn = document.createElement('button');
    autoFillBtn.textContent = 'Auto-Fill Session-Based Positions';
    autoFillBtn.className = 'sample-btn';
    autoFillBtn.style.marginRight = 'var(--space-sm)';
    autoFillBtn.style.marginBottom = 'var(--space-sm)';
    autoFillBtn.addEventListener('click', () => this._autoFillSessionAssignments());
    tableContainer.appendChild(autoFillBtn);

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear Assignments';
    clearBtn.className = 'danger';
    clearBtn.style.marginBottom = 'var(--space-sm)';
    clearBtn.addEventListener('click', () => this._clearSessionAssignments());
    tableContainer.appendChild(clearBtn);

    const table = document.createElement('table');
    table.className = 'manual-table';

    // Timing/Safety/Announcer/Sound/Grid groups
    for (const group of CONFIG.sessionPositionGroups) {
      const groupHeader = document.createElement('tr');
      groupHeader.className = 'manual-category-header';
      const groupTh = document.createElement('td');
      groupTh.colSpan = 2;
      groupTh.textContent = group.name;
      groupHeader.appendChild(groupTh);
      table.appendChild(groupHeader);

      for (const pos of group.positions) {
        const working = pos.session === 1 ? 'Work 1st' : 'Work 2nd';
        table.appendChild(this._buildManualTableRow(pos.name, sorted, working, pos.session));
      }
    }

    // Shadow group (session-aware, user-filled only — never auto-filled)
    const shadowHeader = document.createElement('tr');
    shadowHeader.className = 'manual-category-header';
    const shadowTh = document.createElement('td');
    shadowTh.colSpan = 2;
    shadowTh.textContent = 'Shadow Positions (optional)';
    shadowHeader.appendChild(shadowTh);
    table.appendChild(shadowHeader);

    for (const shadow of CONFIG.workerPositions.shadow) {
      const working = shadow.session === 1 ? 'Work 1st' : 'Work 2nd';
      table.appendChild(this._buildManualTableRow(shadow.name, sorted, working, shadow.session));
    }

    tableContainer.appendChild(table);
    this._restoreSectionVisibility(section, wasOpen, wasVisible);
  },

  /**
   * Set of competitor names currently holding any early role. Sourced from
   * BOTH manualAssignments (mid-edit picks) and entrant.positions[] (post-sync
   * state). Used to deprioritize early-already-assigned workers in the
   * session/algorithm dropdowns.
   */
  _buildEarlyAssignedSet() {
    const earlySet = new Set(CONFIG.earlyPositions);
    const out = new Set();
    for (const [pos, worker] of this.manualAssignments) {
      if (earlySet.has(pos)) out.add(worker);
    }
    for (const e of this.entrants) {
      if (!e.competitor) continue;
      if (e.positions.some((p) => earlySet.has(p))) out.add(e.competitor);
    }
    return out;
  },

  /**
   * Build the Algorithm-Assigned Positions card. Rendered from Workers.getSummary
   * so each row reflects the current entrant.positions[] state. Each row's
   * dropdown supports per-slot swaps via _swapAlgorithmPosition.
   */
  _buildAlgorithmAssignmentUI() {
    const section = document.getElementById('algorithm-assignment-section');
    const tableContainer = document.getElementById('algorithm-assignments-table');
    if (!section || !tableContainer) return;
    const wasOpen = section.classList.contains('open');
    const wasVisible = section.style.display !== 'none';
    tableContainer.innerHTML = '';

    const sorted = [...this.entrants]
      .filter((e) => e.competitor)
      .sort((a, b) => a.competitor.localeCompare(b.competitor));
    const summary = Workers.getSummary(this.entrants);

    for (const sessionNum of [1, 2]) {
      const sessionKey = sessionNum === 1 ? 'work1st' : 'work2nd';
      const working = sessionNum === 1 ? 'Work 1st' : 'Work 2nd';

      const block = document.createElement('div');
      block.className = 'algorithm-session-block';

      const blockHeader = document.createElement('h3');
      blockHeader.className = 'algorithm-session-header';
      blockHeader.textContent = `Working ${sessionNum === 1 ? '1st' : '2nd'}`;
      block.appendChild(blockHeader);

      const table = document.createElement('table');
      table.className = 'manual-table algorithm-table';

      const addCategoryHeader = (text, extraClass) => {
        const tr = document.createElement('tr');
        tr.className = 'manual-category-header' + (extraClass ? ' ' + extraClass : '');
        const td = document.createElement('td');
        td.colSpan = 2;
        td.textContent = text;
        tr.appendChild(td);
        table.appendChild(tr);
      };
      const addSpacer = () => {
        const tr = document.createElement('tr');
        tr.className = 'algorithm-corner-spacer';
        const td = document.createElement('td');
        td.colSpan = 2;
        tr.appendChild(td);
        table.appendChild(tr);
      };

      // Specialized positions (Starter, Spotter; future: anything in essential)
      const specPositions = [
        ...CONFIG.workerPositions.essential,
        ...CONFIG.workerPositions.experienced,
      ].filter((p) => p.session === sessionNum);
      for (const sp of specPositions) {
        const occupant = summary[sessionKey].specialized[sp.name];
        const occupantName = occupant ? occupant.competitor : '';
        table.appendChild(this._buildAlgorithmTableRow(sp.name, occupantName, sorted, working, sessionNum));
      }

      // Corner groups — Captain on top, Workers below, spacer between corners
      for (let c = 1; c <= this.cornerCount; c++) {
        addCategoryHeader(`Corner ${c}`, 'corner-header');

        const cornerArr = summary[sessionKey].corners[String(c)] || [];
        const captainPos = `Corner ${c} Captain`;
        const workerPos = `Corner ${c} Worker`;
        const captain = cornerArr.find((e) => e.positions.includes(captainPos));
        const captainName = captain ? captain.competitor : '';
        table.appendChild(this._buildAlgorithmTableRow(captainPos, captainName, sorted, working, sessionNum));

        const workers = cornerArr.filter((e) => e.positions.includes(workerPos));
        for (const w of workers) {
          table.appendChild(this._buildAlgorithmTableRow(workerPos, w.competitor, sorted, working, sessionNum));
        }

        if (c < this.cornerCount) addSpacer();
      }

      block.appendChild(table);
      tableContainer.appendChild(block);
    }

    this._restoreSectionVisibility(section, wasOpen, wasVisible);
    this._updateManualDropdowns();
  },

  /**
   * Build a single algorithm-assignment row. Mirrors _buildManualTableRow but
   * the source of truth is entrant.positions[]; the previous occupant's name
   * is stashed on the select so _swapAlgorithmPosition knows which slot to
   * vacate when the user picks someone different.
   */
  _buildAlgorithmTableRow(position, occupantName, sortedEntrants, workingValue, session) {
    const tr = document.createElement('tr');
    tr.className = 'manual-table-row algorithm-table-row';

    const tdPos = document.createElement('td');
    tdPos.className = 'manual-pos-cell';
    tdPos.textContent = position;
    tr.appendChild(tdPos);

    const tdSel = document.createElement('td');
    tdSel.className = 'manual-sel-cell';

    const select = document.createElement('select');
    select.dataset.position = position;
    select.dataset.working = workingValue;
    select.dataset.previousOccupant = occupantName || '';
    select.dataset.algorithmRow = '1';

    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '— Unassigned —';
    select.appendChild(blank);

    const requiredRunGroup = session === 1 ? 2 : 1;
    const groupOpts = { noviceMode: this.noviceMode, ladiesMode: this.ladiesMode };
    const earlyAssignedSet = this._buildEarlyAssignedSet();
    const buckets = {};
    for (const e of sortedEntrants) {
      const posCount = Memory.getPositionCount(e.competitor, position);
      const eventCount = Memory.getEventCount(e.competitor);
      const tier = earlyAssignedSet.has(e.competitor)
        ? 'early'
        : (posCount > 0 ? 'eligible' : (eventCount >= 5 ? 'experienced' : 'inexperienced'));
      const rg = Groups._getGroup(e, this.groupAssignments || {}, groupOpts);
      const key = `RG${rg}-${tier}`;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(e);
    }

    const tierLabel = { eligible: 'Eligible', experienced: 'Experienced', inexperienced: 'Inexperienced' };
    const addOptgroup = (label, entrants, ineligible) => {
      if (!entrants || entrants.length === 0) return;
      const og = document.createElement('optgroup');
      og.label = label;
      for (const e of entrants) {
        const opt = document.createElement('option');
        opt.value = e.competitor;
        opt.textContent = `${e.competitor} (${e.class}/${e.pax})`;
        if (ineligible) {
          opt.disabled = true;
          opt.classList.add('wrong-run-group');
        }
        og.appendChild(opt);
      }
      select.appendChild(og);
    };

    const workLabel = (rg) => rg === 1 ? 'Work 2nd Group' : 'Work 1st Group';
    const wrongRunGroup = requiredRunGroup === 1 ? 2 : 1;
    // Correct group: 4 optgroups, with early-assigned workers deprioritized at the bottom
    for (const tier of ['eligible', 'experienced', 'inexperienced']) {
      addOptgroup(`${workLabel(requiredRunGroup)} — ${tierLabel[tier]}`, buckets[`RG${requiredRunGroup}-${tier}`], false);
    }
    addOptgroup(`${workLabel(requiredRunGroup)} — Has Early Role`, buckets[`RG${requiredRunGroup}-early`], false);
    // Wrong group: single flat alphabetized optgroup, all disabled
    const wrongAll = []
      .concat(buckets[`RG${wrongRunGroup}-eligible`] || [])
      .concat(buckets[`RG${wrongRunGroup}-experienced`] || [])
      .concat(buckets[`RG${wrongRunGroup}-inexperienced`] || [])
      .concat(buckets[`RG${wrongRunGroup}-early`] || []);
    wrongAll.sort((a, b) => a.competitor.localeCompare(b.competitor));
    addOptgroup(workLabel(wrongRunGroup), wrongAll, true);

    if (occupantName) select.value = occupantName;

    select.addEventListener('change', () => {
      const newName = select.value;
      const prevName = select.dataset.previousOccupant || '';
      this._swapAlgorithmPosition(prevName, newName, position, workingValue);
    });

    tdSel.appendChild(select);

    const rwLabel = document.createElement('span');
    rwLabel.className = 'manual-rw-label';
    tdSel.appendChild(rwLabel);

    const updateLabel = () => {
      const labelGroupOpts = { noviceMode: this.noviceMode, ladiesMode: this.ladiesMode };
      const workerName = select.value;
      const entrant = workerName ? this.entrants.find((e) => e.competitor === workerName) : null;
      const runGroup = entrant
        ? Groups._getGroup(entrant, this.groupAssignments || {}, labelGroupOpts)
        : (session === 1 ? 2 : 1);
      const classPax = entrant ? `${entrant.class}(${entrant.pax})` : '—';
      rwLabel.textContent = `R${runGroup}, W${session}; ${classPax}`;
      const conflict = entrant && runGroup !== requiredRunGroup;
      rwLabel.classList.toggle('manual-rw-label-conflict', !!conflict);
    };
    updateLabel();
    tr._updateRwLabel = updateLabel;

    tr.appendChild(tdSel);
    return tr;
  },

  /**
   * Swap a worker into an algorithm-assigned position slot. The previous occupant
   * loses the position; if the new pick already had a session manual or algorithm
   * position, that one is cleared (early roles stack and are preserved).
   */
  _swapAlgorithmPosition(prevName, newName, position, working) {
    if (prevName) {
      const prev = this.entrants.find((e) => e.competitor === prevName);
      if (prev) {
        prev.positions = prev.positions.filter((p) => p !== position);
        if (!prev.positions.length) {
          if (prev.running === 'Run 1st') prev.working = 'Work 2nd';
          else if (prev.running === 'Run 2nd') prev.working = 'Work 1st';
        }
      }
    }

    if (newName) {
      const next = this.entrants.find((e) => e.competitor === newName);
      if (next) {
        // Clear any non-early position the new pick currently holds (only one
        // session/algorithm role per worker). Early roles stack and stay.
        const toClear = next.positions.filter((p) => !CONFIG.earlyPositions.includes(p));
        next.positions = next.positions.filter((p) => CONFIG.earlyPositions.includes(p));
        for (const oldPos of toClear) {
          if (this.manualAssignments.get(oldPos) === newName) {
            this.manualAssignments.delete(oldPos);
          }
        }
        next.positions.push(position);
        next.working = working;
      }
    }

    this._buildAlgorithmAssignmentUI();
    this._buildManualAssignmentUI();
  },

  /**
   * Build a table row for manual assignment with optgroup dropdown (#3).
   * @param {string} position - position name
   * @param {Array} sortedEntrants - alphabetized entrants for the dropdown
   * @param {string} workingValue - 'Early', 'Work 1st', or 'Work 2nd'
   * @param {number|null} session - 1, 2, or null for Early positions (drives the inline R/W label)
   */
  _buildManualTableRow(position, sortedEntrants, workingValue, session) {
    const tr = document.createElement('tr');
    tr.className = 'manual-table-row';

    // Position cell
    const tdPos = document.createElement('td');
    tdPos.className = 'manual-pos-cell';
    tdPos.textContent = position;
    tr.appendChild(tdPos);

    // Dropdown cell
    const tdSel = document.createElement('td');
    tdSel.className = 'manual-sel-cell';

    const select = document.createElement('select');
    select.dataset.position = position;
    select.dataset.working = workingValue;

    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '— Unassigned —';
    select.appendChild(blank);

    // Bucket entrants by experience tier; for session/shadow rows, also by current run group.
    // For session positions, the "required" run group sits on top so the user can pick from it easily.
    // Workers already in an early role get a separate 'early' tier (session/shadow rows only)
    // so they're deprioritized at the bottom of the correct work-group section.
    const requiredRunGroup = session === null ? null : (session === 1 ? 2 : 1);
    const groupOpts = { noviceMode: this.noviceMode, ladiesMode: this.ladiesMode };
    const earlyAssignedSet = session === null ? null : this._buildEarlyAssignedSet();
    const buckets = {};  // bucketKey -> entrants[]
    const bucketKey = (rg, tier) => session === null ? tier : `RG${rg}-${tier}`;

    for (const e of sortedEntrants) {
      const posCount = Memory.getPositionCount(e.competitor, position);
      const eventCount = Memory.getEventCount(e.competitor);
      const baseTier = posCount > 0 ? 'eligible' : (eventCount >= 5 ? 'experienced' : 'inexperienced');
      const tier = (earlyAssignedSet && earlyAssignedSet.has(e.competitor)) ? 'early' : baseTier;
      const rg = session === null ? null : Groups._getGroup(e, this.groupAssignments || {}, groupOpts);
      const key = bucketKey(rg, tier);
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(e);
    }

    const tierLabel = { eligible: 'Eligible', experienced: 'Experienced', inexperienced: 'Inexperienced' };

    const addOptgroup = (label, entrants, { ineligible = false } = {}) => {
      if (!entrants || entrants.length === 0) return;
      const og = document.createElement('optgroup');
      og.label = label;
      for (const e of entrants) {
        const opt = document.createElement('option');
        opt.value = e.competitor;
        opt.textContent = `${e.competitor} (${e.class}/${e.pax})`;
        if (ineligible) {
          opt.disabled = true;
          opt.classList.add('wrong-run-group');
        }
        og.appendChild(opt);
      }
      select.appendChild(og);
    };

    if (session === null) {
      addOptgroup('Eligible', buckets['eligible']);
      addOptgroup('Experienced', buckets['experienced']);
      addOptgroup('Inexperienced', buckets['inexperienced']);
    } else {
      // Run Group 1 entrants run 1st → work 2nd; Run Group 2 entrants run 2nd → work 1st.
      // Correct work group: 4 optgroups, with early-already-assigned workers
      // deprioritized into a separate "Has Early Role" optgroup at the bottom
      // (still selectable per the stacking rule). Wrong work group: a single
      // flat alphabetized optgroup, all disabled.
      const workLabel = (rg) => rg === 1 ? 'Work 2nd Group' : 'Work 1st Group';
      const wrongRunGroup = requiredRunGroup === 1 ? 2 : 1;
      for (const tier of ['eligible', 'experienced', 'inexperienced']) {
        addOptgroup(`${workLabel(requiredRunGroup)} — ${tierLabel[tier]}`,
                    buckets[`RG${requiredRunGroup}-${tier}`]);
      }
      addOptgroup(`${workLabel(requiredRunGroup)} — Has Early Role`,
                  buckets[`RG${requiredRunGroup}-early`]);
      const wrongAll = []
        .concat(buckets[`RG${wrongRunGroup}-eligible`] || [])
        .concat(buckets[`RG${wrongRunGroup}-experienced`] || [])
        .concat(buckets[`RG${wrongRunGroup}-inexperienced`] || [])
        .concat(buckets[`RG${wrongRunGroup}-early`] || []);
      wrongAll.sort((a, b) => a.competitor.localeCompare(b.competitor));
      addOptgroup(workLabel(wrongRunGroup), wrongAll, { ineligible: true });
    }

    // Restore previous selection
    const prev = this.manualAssignments.get(position);
    if (prev) select.value = prev;

    select.addEventListener('change', () => {
      const selectedWorker = select.value;
      if (!selectedWorker) {
        this.manualAssignments.delete(position);
        this._updateManualDropdowns();
        return;
      }

      // For session/shadow positions, reject picks whose run group doesn't match the position
      if (requiredRunGroup !== null) {
        const entrant = this.entrants.find((e) => e.competitor === selectedWorker);
        if (entrant) {
          const entrantRg = Groups._getGroup(entrant, this.groupAssignments || {}, groupOpts);
          if (entrantRg !== requiredRunGroup) {
            const prevValue = this.manualAssignments.get(position) || '';
            select.value = prevValue;
            alert(
              `${entrant.competitor} is in ${entrant.class}(${entrant.pax}), run group ${entrantRg}. ` +
              `Please select a person from run group ${requiredRunGroup}.`
            );
            return;
          }
        }
      }

      // Check if this worker is already assigned elsewhere. Stacking rule:
      // any number of early roles plus at most ONE non-early role (session
      // manual, shadow, or algorithm) per worker. Algorithm positions live on
      // entrant.positions[] (not in manualAssignments) so we have to check both.
      const targetIsEarly = CONFIG.earlyPositions.includes(position);
      let existingPosition = null;
      if (!targetIsEarly) {
        // Pending manual assignments not yet synced to entrants
        for (const [pos, worker] of this.manualAssignments) {
          if (worker !== selectedWorker || pos === position) continue;
          if (!CONFIG.earlyPositions.includes(pos)) {
            existingPosition = pos;
            break;
          }
        }
        // Algorithm positions and synced manual positions on the entrant itself
        if (!existingPosition) {
          const entrant = this.entrants.find((e) => e.competitor === selectedWorker);
          if (entrant) {
            for (const p of entrant.positions) {
              if (p === position) continue;
              if (!CONFIG.earlyPositions.includes(p)) {
                existingPosition = p;
                break;
              }
            }
          }
        }
      }

      if (existingPosition) {
        // Revert dropdown while modal is open
        const prevValue = this.manualAssignments.get(position) || '';
        select.value = prevValue;
        this._showReassignModal(selectedWorker, existingPosition, position);
      } else {
        this.manualAssignments.set(position, selectedWorker);
        this._updateManualDropdowns();
      }
    });

    tdSel.appendChild(select);

    // Inline R#, W#; class(PAX) badge — always visible, refreshed on selection or split change
    const rwLabel = document.createElement('span');
    rwLabel.className = 'manual-rw-label';
    tdSel.appendChild(rwLabel);

    const updateLabel = () => {
      const labelGroupOpts = { noviceMode: this.noviceMode, ladiesMode: this.ladiesMode };
      const workerName = select.value;
      const entrant = workerName ? this.entrants.find((e) => e.competitor === workerName) : null;

      let runGroup;
      if (entrant) {
        runGroup = Groups._getGroup(entrant, this.groupAssignments || {}, labelGroupOpts);
      } else if (session !== null) {
        runGroup = session === 1 ? 2 : 1;
      } else {
        runGroup = '—';
      }

      const workGroup = session === null ? 'E' : String(session);
      const classPax = entrant ? `${entrant.class}(${entrant.pax})` : '—';
      rwLabel.textContent = `R${runGroup}, W${workGroup}; ${classPax}`;

      // Flag rows where the assigned entrant's run group disagrees with the position session
      const required = session === null ? null : (session === 1 ? 2 : 1);
      const conflict = entrant && required !== null && runGroup !== required;
      rwLabel.classList.toggle('manual-rw-label-conflict', !!conflict);
    };
    updateLabel();
    select.addEventListener('change', updateLabel);
    tr._updateRwLabel = updateLabel;

    // Chalk liner checkbox for Course Setup positions
    if (position.startsWith('Course Setup')) {
      const flagLabel = document.createElement('label');
      flagLabel.className = 'chalk-liner-flag';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.position = position;
      cb.id = `chalk-liner-${position.replace(/\s+/g, '-')}`;
      flagLabel.appendChild(cb);
      flagLabel.appendChild(document.createTextNode('Chalk Liner'));
      tdSel.appendChild(flagLabel);
    }

    tr.appendChild(tdSel);
    return tr;
  },

  /**
   * Refresh every manual row's inline R/W badge — call after the run-group split changes.
   */
  _refreshManualLabels() {
    const rows = document.querySelectorAll('.manual-table tr.manual-table-row');
    for (const row of rows) {
      if (typeof row._updateRwLabel === 'function') row._updateRwLabel();
    }
  },

  _updateManualDropdowns() {
    // Stacking rule means an early-position worker can still take a session role
    // (and vice versa). Only mark workers as "assigned elsewhere" when picking
    // them would collide — i.e. they hold a session role and the current select
    // is also a session/shadow position.
    const sessionAssigned = new Set();
    for (const [pos, worker] of this.manualAssignments) {
      if (!CONFIG.earlyPositions.includes(pos)) sessionAssigned.add(worker);
    }
    // Algorithm-assigned positions live on entrant.positions[] (not in
    // manualAssignments). Include their holders so they show up grayed across
    // every non-early dropdown, mirroring the session-manual gray-out.
    for (const e of this.entrants) {
      if (!e.competitor) continue;
      for (const p of e.positions) {
        if (!CONFIG.earlyPositions.includes(p)) {
          sessionAssigned.add(e.competitor);
          break;
        }
      }
    }
    const selects = document.querySelectorAll('.manual-table select');

    for (const select of selects) {
      const currentVal = select.value;
      const selectIsEarly = select.dataset.working === 'Early';
      for (const opt of select.options) {
        if (!opt.value) continue;
        const isElsewhere = !selectIsEarly && sessionAssigned.has(opt.value) && opt.value !== currentVal;
        opt.disabled = false;
        opt.classList.toggle('assigned-elsewhere', isElsewhere);
      }

      // Toggle unassigned highlight on the row
      const row = select.closest('.manual-table-row');
      if (row) row.classList.toggle('unassigned', !select.value);
    }
    this._checkDuplicatePositions();
    this._scheduleAutoSave();
  },

  _showReassignModal(workerName, fromPosition, toPosition) {
    const existing = document.getElementById('reassign-modal');
    if (existing) existing.remove();

    // fromPosition can be a manual (early/session/shadow) position OR an
    // algorithm position (Starter, Spotter, Corner Captain/Worker). Algorithm
    // positions live on entrant.positions[] and don't support backfill from
    // this modal; the user can re-run Assign Workers to refill the slot.
    const fromIsManual = CONFIG.isManualPosition(fromPosition);

    const overlay = document.createElement('div');
    overlay.id = 'reassign-modal';
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal-content';

    // Build backfill dropdown with only unassigned workers
    const assigned = new Set(this.manualAssignments.values());
    const sortedEntrants = [...this.entrants]
      .filter((e) => e.competitor)
      .sort((a, b) => a.competitor.localeCompare(b.competitor));

    // Categorize unassigned workers by experience for the vacated position
    const eligible = [];
    const experienced = [];
    const inexperienced = [];
    for (const e of sortedEntrants) {
      if (assigned.has(e.competitor)) continue;
      const posCount = Memory.getPositionCount(e.competitor, fromPosition);
      const eventCount = Memory.getEventCount(e.competitor);
      if (posCount > 0) {
        eligible.push(e);
      } else if (eventCount >= 5) {
        experienced.push(e);
      } else {
        inexperienced.push(e);
      }
    }

    const buildOptgroup = (label, entrants) => {
      if (entrants.length === 0) return '';
      let html = `<optgroup label="${label}">`;
      for (const e of entrants) {
        html += `<option value="${e.competitor}">${e.competitor} (${e.class}/${e.pax})</option>`;
      }
      html += '</optgroup>';
      return html;
    };

    let backfillOptions = '<option value="">— Unassigned —</option>';
    backfillOptions += buildOptgroup('Eligible', eligible);
    backfillOptions += buildOptgroup('Experienced', experienced);
    backfillOptions += buildOptgroup('Inexperienced', inexperienced);

    const backfillBlock = fromIsManual ? `
      <div class="reassign-backfill">
        <label>
          <input type="checkbox" id="reassign-backfill-cb">
          Fill <strong>${fromPosition}</strong>
        </label>
        <select id="reassign-backfill-select" style="display:none">
          ${backfillOptions}
        </select>
      </div>` : `
      <p class="reassign-modal-note"><em>${fromPosition} will be left empty; click Assign Workers to refill.</em></p>`;

    modal.innerHTML = `
      <h3>Reassign Worker</h3>
      <p class="reassign-modal-text">
        <strong>${workerName}</strong> is currently assigned to <strong>${fromPosition}</strong>.<br>
        Reassign to <strong>${toPosition}</strong>?
      </p>
      ${backfillBlock}
      <div class="reassign-modal-buttons">
        <button class="btn-cancel">No</button>
        <button class="btn-confirm">Yes, Reassign</button>
      </div>
    `;

    // Backfill checkbox toggles dropdown (only present when fromPosition is manual)
    const backfillCb = modal.querySelector('#reassign-backfill-cb');
    const backfillSelect = modal.querySelector('#reassign-backfill-select');
    if (backfillCb && backfillSelect) {
      backfillCb.addEventListener('change', () => {
        backfillSelect.style.display = backfillCb.checked ? '' : 'none';
      });
    }

    // Cancel
    modal.querySelector('.btn-cancel').addEventListener('click', () => {
      overlay.remove();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // Confirm reassignment
    modal.querySelector('.btn-confirm').addEventListener('click', () => {
      // Remove worker from old position — manual map vs algorithm positions[]
      if (fromIsManual) {
        this.manualAssignments.delete(fromPosition);
      } else {
        const entrant = this.entrants.find((e) => e.competitor === workerName);
        if (entrant) {
          entrant.positions = entrant.positions.filter((p) => p !== fromPosition);
          if (!entrant.positions.length) {
            if (entrant.running === 'Run 1st') entrant.working = 'Work 2nd';
            else if (entrant.running === 'Run 2nd') entrant.working = 'Work 1st';
          }
        }
      }

      // Assign worker to new manual position
      this.manualAssignments.set(toPosition, workerName);

      // Backfill old manual position if requested
      if (fromIsManual && backfillCb && backfillCb.checked && backfillSelect && backfillSelect.value) {
        this.manualAssignments.set(fromPosition, backfillSelect.value);
      }

      // Sync manual-only dropdown values with manualAssignments. Algorithm rows
      // are driven directly from entrant.positions and rebuilt elsewhere.
      const selects = document.querySelectorAll('#manual-assignments-table select, #session-manual-table select');
      for (const sel of selects) {
        const pos = sel.dataset.position;
        sel.value = this.manualAssignments.get(pos) || '';
      }

      // Flush manualAssignments into entrant.positions so the spreadsheet and
      // R/W badges reflect the swap immediately. Programmatic select.value
      // assignments above don't fire 'change', so the per-row updateLabel
      // closures are stale until _refreshManualLabels runs.
      this._syncManualAssignments();
      this._updateTable();
      this._refreshManualLabels();

      // Algorithm UI must rebuild if we cleared an algorithm slot
      if (!fromIsManual) this._buildAlgorithmAssignmentUI();

      this._updateManualDropdowns();
      overlay.remove();
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  },

  /** Pool of entrants alphabetized for the auto-fill picker. */
  _autoFillCandidates() {
    return [...this.entrants]
      .filter((e) => e.competitor)
      .sort((a, b) => a.competitor.localeCompare(b.competitor));
  },

  /**
   * Pick the best available entrant for a position.
   * Tier order: eligible (prior history) > experienced (>=5 events). No
   * inexperienced fallback. For session/shadow positions, requiredRunGroup
   * is the work-group filter (no wrong-group fallback).
   */
  _pickAutoFillCandidate(sorted, assigned, position, requiredRunGroup) {
    const groupOpts = { noviceMode: this.noviceMode, ladiesMode: this.ladiesMode };
    const eligible = [];
    const experienced = [];
    for (const e of sorted) {
      if (assigned.has(e.competitor)) continue;
      if (requiredRunGroup !== null) {
        const rg = Groups._getGroup(e, this.groupAssignments || {}, groupOpts);
        if (rg !== requiredRunGroup) continue;
      }
      const posCount = Memory.getPositionCount(e.competitor, position);
      const eventCount = Memory.getEventCount(e.competitor);
      if (posCount > 0) eligible.push(e);
      else if (eventCount >= 5) experienced.push(e);
    }
    return eligible[0] || experienced[0] || null;
  },

  _autoFillEarlyAssignments() {
    const sorted = this._autoFillCandidates();
    const assigned = new Set(this.manualAssignments.values());
    for (const group of CONFIG.earlyPositionGroups) {
      for (const position of group.positions) {
        if (this.manualAssignments.has(position)) continue;
        const pick = this._pickAutoFillCandidate(sorted, assigned, position, null);
        if (pick) {
          this.manualAssignments.set(position, pick.competitor);
          assigned.add(pick.competitor);
        }
      }
    }
    this._buildManualAssignmentUI();
  },

  _autoFillSessionAssignments() {
    const sorted = this._autoFillCandidates();
    const assigned = new Set(this.manualAssignments.values());
    const groupOpts = { noviceMode: this.noviceMode, ladiesMode: this.ladiesMode };
    // Shadow positions are user-fill only and intentionally skipped here.
    for (const group of CONFIG.sessionPositionGroups) {
      for (const pos of group.positions) {
        const requiredRunGroup = pos.session === 1 ? 2 : 1;
        const currentWorker = this.manualAssignments.get(pos.name);
        if (currentWorker) {
          // Keep the existing pick only if the worker exists AND their current
          // run group matches the position. Otherwise clear and refill.
          const entrant = this.entrants.find((e) => e.competitor === currentWorker);
          const rg = entrant ? Groups._getGroup(entrant, this.groupAssignments || {}, groupOpts) : null;
          if (rg === requiredRunGroup) continue;
          this.manualAssignments.delete(pos.name);
          assigned.delete(currentWorker);
        }
        const pick = this._pickAutoFillCandidate(sorted, assigned, pos.name, requiredRunGroup);
        if (pick) {
          this.manualAssignments.set(pos.name, pick.competitor);
          assigned.add(pick.competitor);
        }
      }
    }
    this._buildManualAssignmentUI();
  },

  _clearEarlyAssignments() {
    if (!confirm('Clear all early-position assignments? This cannot be undone.')) return;
    for (const pos of CONFIG.earlyPositions) {
      this.manualAssignments.delete(pos);
    }
    this._buildManualAssignmentUI();
    this._showStatus('Early-position assignments cleared.', 'success');
  },

  _clearSessionAssignments() {
    if (!confirm('Clear all session-based assignments (including shadows)? This cannot be undone.')) return;
    for (const group of CONFIG.sessionPositionGroups) {
      for (const pos of group.positions) {
        this.manualAssignments.delete(pos.name);
      }
    }
    for (const shadow of CONFIG.workerPositions.shadow) {
      this.manualAssignments.delete(shadow.name);
    }
    this._buildManualAssignmentUI();
    this._showStatus('Session-based assignments cleared.', 'success');
  },

  _syncManualAssignments() {
    // Phase 1: drop any previously assigned manual roles. If an entrant has no
    // remaining roles, restore their working session from their running session.
    for (const e of this.entrants) {
      if (!e.positions.length) continue;
      e.positions = e.positions.filter((p) => !CONFIG.isManualPosition(p));
      if (!e.positions.length) {
        if (e.running === 'Run 1st') e.working = 'Work 2nd';
        else if (e.running === 'Run 2nd') e.working = 'Work 1st';
      }
    }

    // Phase 2: collect every manual selection per worker so a single entrant can
    // hold multiple early roles plus at most one session/shadow role.
    const workerRoles = new Map();
    // Manual-section selects only — algorithm rows write to entrant.positions
    // directly via _swapAlgorithmPosition and must not be re-read here.
    const selects = document.querySelectorAll('#manual-assignments-table select, #session-manual-table select');
    for (const select of selects) {
      if (!select.value) continue;
      const position = select.dataset.position;
      const working = select.dataset.working;
      const roles = workerRoles.get(select.value) ?? { early: [], session: null, sessionWorking: null, chalk: false };
      if (working === 'Early') {
        roles.early.push(position);
      } else {
        roles.session = position;
        roles.sessionWorking = working;
      }
      if (position.startsWith('Course Setup')) {
        const cb = document.querySelector(`#chalk-liner-${position.replace(/\s+/g, '-')}`);
        if (cb && cb.checked) roles.chalk = true;
      }
      workerRoles.set(select.value, roles);
    }
    for (const [name, roles] of workerRoles) {
      const entrant = this.entrants.find((e) => e.competitor === name);
      if (!entrant) continue;
      entrant.positions = [...roles.early, ...(roles.session ? [roles.session] : [])];
      entrant.working = roles.sessionWorking ?? 'Early';
      entrant.chalkLiner = roles.chalk;
    }
  },

  // ── Group Counts & Balance ───────────────────────────────────

  /** Render group counts with inline max diff input (#5) */
  _updateGroupCounts() {
    const countsDiv = document.getElementById('group-counts');
    if (!countsDiv) return;

    // Use stored combo counts if available, otherwise compute per-entrant
    let g1, g2, diff;
    if (this.validCombos && this.validCombos.length > 0 && this.validCombos[this.comboIndex]) {
      const combo = this.validCombos[this.comboIndex];
      g1 = combo.g1;
      g2 = combo.g2;
      diff = combo.diff;
    } else {
      const counts = Groups.computeGroupCounts(this.entrants, this.groupAssignments || {}, { noviceMode: this.noviceMode, ladiesMode: this.ladiesMode });
      g1 = counts.g1;
      g2 = counts.g2;
      diff = counts.diff;
    }
    const balanced = diff <= this.maxGroupDiff;

    let w1 = 0, w2 = 0, early = 0;
    for (const e of this.entrants) {
      if (e.working === 'Work 1st') w1++;
      else if (e.working === 'Work 2nd') w2++;
      else if (e.working === 'Early' || e.working === 'Lunch') early++;
    }
    const hasWorkData = w1 > 0 || w2 > 0;

    let html = `
      <strong>Run 1st:</strong> ${g1} &nbsp; | &nbsp;
      <strong>Run 2nd:</strong> ${g2} &nbsp; | &nbsp;
      <strong>Difference:</strong> <span class="${balanced ? 'balance-ok' : 'balance-warn'}">${diff}</span>
      / max <input type="number" id="max-group-diff" value="${this.maxGroupDiff}" min="0" max="20" class="inline-max-diff-input" />
      <span class="${balanced ? 'balance-ok' : 'balance-warn'}">${balanced ? '(balanced)' : '(exceeds max)'}</span>
    `;

    if (hasWorkData) {
      html += `<br><strong>Work 1st:</strong> ${w1} &nbsp; | &nbsp;
        <strong>Work 2nd:</strong> ${w2}`;
      if (early > 0) html += ` &nbsp; | &nbsp; <strong>Early:</strong> ${early}`;
    }

    // Persistent combo info
    if (this.validCombos) {
      html += `<br><strong>Valid combinations:</strong> ${this.validCombos.length}`;
      if (this.validCombos.length > 0) {
        html += ` &nbsp; | &nbsp; <strong>Showing:</strong> ${this.comboIndex + 1} of ${this.validCombos.length} (difference: ${this.validCombos[this.comboIndex].diff})`;
      }
    }

    countsDiv.innerHTML = html;

    // Rebind max diff input
    const maxDiffInput = document.getElementById('max-group-diff');
    if (maxDiffInput) {
      maxDiffInput.addEventListener('change', (e) => {
        this.maxGroupDiff = parseInt(e.target.value) || 4;
        this._invalidateCombos();
        this._updateGroupCounts();
      });
    }
  },

  _getGroupOptions() {
    return {
      noviceMode: this.noviceMode,
      ladiesMode: this.ladiesMode,
      maxGroupDiff: this.maxGroupDiff,
    };
  },

  /**
   * Resolve session number for a manual position, or null for Early positions.
   */
  _getPositionSession(position) {
    for (const group of CONFIG.sessionPositionGroups) {
      for (const p of group.positions) {
        if (p.name === position) return p.session;
      }
    }
    for (const s of CONFIG.workerPositions.shadow) {
      if (s.name === position) return s.session;
    }
    return null;
  },

  /**
   * Determine the class that the run-group split actually assigns for this entrant,
   * mirroring Groups._getGroup's bucketing for novices/ladies in follow mode.
   */
  _effectiveClassForLock(entrant) {
    const cls = entrant.class;
    if (cls === 'L' && this.ladiesMode !== 'separate') {
      const paxClass = Groups._getPaxParentClass(entrant.pax);
      return paxClass || 'L';
    }
    if (cls === 'N' && this.noviceMode !== 'separate') {
      const paxClass = Groups._getPaxParentClass(entrant.pax);
      return paxClass || 'N';
    }
    return cls;
  },

  /**
   * Build implicit class locks from manual session-based assignments.
   * Each session-based manual position forces its assigned worker's class to a specific run group.
   * Returns { locks, conflicts } where conflicts lists same-class manual picks pulling opposite groups.
   */
  _getManualClassLocks() {
    const locks = {};
    const lockSources = {};
    const conflicts = [];
    for (const [position, workerName] of this.manualAssignments) {
      const session = this._getPositionSession(position);
      if (session === null) continue;
      const group = session === 1 ? 2 : 1;
      const entrant = this.entrants.find((e) => e.competitor === workerName);
      if (!entrant) continue;
      const effectiveClass = this._effectiveClassForLock(entrant);
      if (locks[effectiveClass] !== undefined && locks[effectiveClass] !== group) {
        conflicts.push({
          class: effectiveClass,
          workerA: lockSources[effectiveClass].worker,
          positionA: lockSources[effectiveClass].position,
          groupA: locks[effectiveClass],
          workerB: workerName,
          positionB: position,
          groupB: group,
        });
      } else {
        locks[effectiveClass] = group;
        lockSources[effectiveClass] = { worker: workerName, position };
      }
    }
    return { locks, conflicts, lockSources };
  },

  /**
   * Merge explicit user locks with implicit manual-worker locks.
   * Explicit locks win; disagreements are appended to conflicts.
   */
  _mergeLocks(explicit, manual) {
    const merged = { ...manual.locks };
    const conflicts = [...manual.conflicts];
    for (const [cls, group] of Object.entries(explicit)) {
      if (merged[cls] !== undefined && merged[cls] !== group) {
        const src = manual.lockSources[cls];
        conflicts.push({
          class: cls,
          explicit: group,
          implicit: merged[cls],
          worker: src ? src.worker : null,
          position: src ? src.position : null,
        });
      }
      merged[cls] = group;
    }
    return { merged, conflicts };
  },

  _formatLockConflicts(conflicts) {
    return conflicts.map((c) => {
      if (c.workerA && c.workerB) {
        return `${c.class}: ${c.workerA} (${c.positionA} → R${c.groupA}) vs ${c.workerB} (${c.positionB} → R${c.groupB})`;
      }
      if (c.worker) {
        return `${c.class}: explicit lock R${c.explicit} overrides ${c.worker} (${c.position} → R${c.implicit})`;
      }
      return `${c.class}: lock conflict`;
    }).join('; ');
  },

  _getGroupDifference() {
    const groupOpts = { noviceMode: this.noviceMode, ladiesMode: this.ladiesMode };
    let g1 = 0, g2 = 0;
    for (const e of this.entrants) {
      const group = Groups._getGroup(e, this.groupAssignments || {}, groupOpts);
      if (group === 1) g1++;
      else g2++;
    }
    return Math.abs(g1 - g2);
  },

  _invalidateCombos() {
    this.validCombos = null;
    this.comboIndex = 0;
  },

  // ── Balance & Assign ────────────────────────────��────────────

  /** Cycle through valid combinations (#4) */
  autoBalance() {
    if (this.entrants.length === 0) return;

    const locked = {};
    for (const cls of this.lockedClasses) {
      const sel = document.getElementById(`group-select-${cls}`);
      if (sel) locked[cls] = parseInt(sel.value);
    }

    if (!this.validCombos) {
      const opts = { ...this._getGroupOptions(), locked };
      const result = Groups.autoAssign(this.entrants, opts);
      this.validCombos = result.allValid;
      this.comboIndex = 0;
    } else {
      this.comboIndex = (this.comboIndex + 1) % this.validCombos.length;
    }

    if (this.validCombos.length === 0) {
      this._showStatus('No valid combinations found within max difference. Increase max diff or unlock classes.', 'error');
      return;
    }

    const combo = this.validCombos[this.comboIndex];
    this.groupAssignments = combo.assignment;

    // Update dropdowns and move rows to correct sections
    for (const [cls, group] of Object.entries(this.groupAssignments)) {
      const select = document.getElementById(`group-select-${cls}`);
      if (select) select.value = group;
    }
    this._moveClassRows();

    // Clear all worker assignments — groups changed so they're invalid
    // Manual assignment selections are preserved in this.manualAssignments Map
    // and will be re-applied when Assign Workers is clicked
    for (const e of this.entrants) {
      e.running = '';
      e.working = '';
      e.positions = [];
    }
    this._updateTable();
    this._updateGroupCounts();
    this._buildManualAssignmentUI();
    this._buildAlgorithmAssignmentUI();
  },

  /** Combined split + assign */
  assignWorkers() {
    if (this.entrants.length === 0) return;
    this._syncFromTable();

    // Check for existing algorithm assignments before modifying anything
    const hasAlgoAssigned = this.entrants.some(
      (e) => e.positions.some((p) => !CONFIG.isManualPosition(p))
    );
    if (hasAlgoAssigned) {
      const choice = confirm(
        'Algorithm positions are already assigned. Click OK to clear and reassign, or Cancel to only fill unassigned positions.'
      );
      if (choice) {
        for (const e of this.entrants) {
          e.positions = e.positions.filter((p) => CONFIG.isManualPosition(p));
        }
      }
    }

    this._syncManualAssignments();

    const preserved = new Map();
    for (const e of this.entrants) {
      if (e.positions.length && e.positions.every((p) => CONFIG.isManualPosition(p))) {
        preserved.set(e.competitor, { positions: [...e.positions], working: e.working });
      }
    }

    const groupOpts = { noviceMode: this.noviceMode, ladiesMode: this.ladiesMode };
    Groups.split(this.entrants, this.groupAssignments, groupOpts);

    for (const e of this.entrants) {
      const saved = preserved.get(e.competitor);
      if (saved) {
        e.positions = saved.positions;
        e.working = saved.working;
      }
    }

    Workers.assign(this.entrants, this.cornerCount);
    this._updateTable();
    this._updateGroupCounts();
    this._checkDuplicatePositions();
    this._buildManualAssignmentUI();
    this._buildAlgorithmAssignmentUI();

    const diff = this._getGroupDifference();
    if (diff > this.maxGroupDiff) {
      this._showStatus(
        `Workers assigned. Warning: groups differ by ${diff} (max ${this.maxGroupDiff}). Use Balance Run Groups to improve.`,
        'error'
      );
    } else {
      this._showStatus(`Workers assigned. Groups balanced (difference: ${diff}).`, 'success');
    }
    this._updateButtonStates();
  },

  // ── PDF & Memory ─────────────────────────────────────────────

  generateWorkerPDF() {
    this._syncFromTable();
    this._syncManualAssignments();
    try {
      const opts = { noviceMode: this.noviceMode, ladiesMode: this.ladiesMode };
      const doc = PDF.generateWorkerAssignments(this.entrants, this.groupAssignments || {}, this.eventTitle, this.hasLadies, opts);
      PDF.save(doc, `Worker Assignments-${this._fileDate()}.pdf`);
      this._showStatus('Worker Assignments PDF generated.', 'success');
    } catch (err) {
      this._showStatus(`PDF error: ${err.message}`, 'error');
      console.error(err);
    }
  },

  generateGroupsPDF() {
    this._syncFromTable();
    this._syncManualAssignments();
    try {
      const opts = { noviceMode: this.noviceMode, ladiesMode: this.ladiesMode };
      const doc = PDF.generateGroupsPage(this.entrants, this.groupAssignments || {}, this.eventTitle, this.cornerCount, this.hasLadies, opts);
      PDF.save(doc, `Groups Page-${this._fileDate()}.pdf`);
      this._showStatus('Groups Page PDF generated.', 'success');
    } catch (err) {
      this._showStatus(`PDF error: ${err.message}`, 'error');
      console.error(err);
    }
  },

  downloadMemory() {
    this._syncFromTable();
    for (const e of this.entrants) {
      if (e.competitor && e.positions.length) {
        Memory.updateParticipant(e.competitor, {
          date: document.getElementById('event-date').value || new Date().toISOString().split('T')[0],
          eventName: this.eventTitle,
          positions: [...e.positions],
          class: e.class,
          pax: e.pax,
        });
      }
    }
    Memory.save();
    Memory.download();
    this._showStatus('Memory saved and downloaded.', 'success');
  },

  clearMemory() {
    if (confirm('Clear all participant memory? This cannot be undone.')) {
      Memory.clear();
      document.getElementById('memory-file').value = '';
      document.getElementById('memory-file-label').textContent = '';
      this._showStatus('Memory cleared.', 'success');
    }
  },

  _fileDate() {
    return document.getElementById('event-date').value || new Date().toISOString().split('T')[0];
  },

  _showStatus(message, type) {
    const el = document.getElementById('status');
    el.textContent = message;
    el.className = `status ${type}`;
    setTimeout(() => { el.className = 'status'; el.textContent = ''; }, 8000);
  },

  _updateButtonStates() {
    const hasData = this.entrants.length > 0;
    document.getElementById('btn-auto-balance').disabled = !hasData;
    document.getElementById('btn-assign').disabled = !hasData;
    document.getElementById('btn-pdf-workers').disabled = !hasData;
    document.getElementById('btn-pdf-groups').disabled = !hasData;
    document.getElementById('btn-view-entries').disabled = !hasData;
  },

  _showDefaultClassesModal() {
    const existing = document.getElementById('defaults-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'defaults-modal';
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    const modal = document.createElement('div');
    modal.className = 'modal-content';

    let html = '<h3>Default PAX Classes</h3>';
    for (const [key, info] of Object.entries(CONFIG.classes)) {
      html += `<div class="default-class-row"><strong>${key} (${info.name}):</strong> ${info.pax.join(', ')}</div>`;
    }
    html += '<h3 style="margin-top: var(--space-md);">Special Classes</h3>';
    for (const [key, info] of Object.entries(CONFIG.specialClasses)) {
      html += `<div class="default-class-row"><strong>${key} (${info.name}):</strong> ${info.description}</div>`;
    }
    html += '<button class="modal-close">Close</button>';

    modal.innerHTML = html;
    modal.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  },

  openEntryListViewer() {
    if (!this.rawCsvText) return;

    const lines = this.rawCsvText.trim().split('\n');
    const header = CSV._parseLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      rows.push(CSV._parseLine(line));
    }

    const columns = header.map((h) => {
      const title = h.trim() || '(empty)';
      return `{ title: ${JSON.stringify(title)}, width: 140, readOnly: true }`;
    });

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<base href="${location.href}">
<title>ALSCCA Entry List</title>
<script src="lib/jexcel.js"><\/script>
<link rel="stylesheet" href="lib/jexcel.css" />
<script src="lib/jsuites.js"><\/script>
<link rel="stylesheet" href="lib/jsuites.css" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; }
  h1 { font-size: 1.2rem; margin-bottom: 4px; }
  .info { font-size: 0.85rem; color: #666; margin-bottom: 12px; }
</style>
</head><body>
<h1>ALSCCA Entry List</h1>
<p class="info">${rows.length} entrants | ${header.length} columns</p>
<div id="spreadsheet"></div>
<script>
var allData = ${JSON.stringify(rows)};
var table = jspreadsheet(document.getElementById('spreadsheet'), {
  data: allData,
  columns: [${columns.join(', ')}],
  columnSorting: true,
  tableOverflow: true,
  tableWidth: '100%',
  tableHeight: (window.innerHeight - 120) + 'px',
  search: true,
});
<\/script>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  },

  // ── Save Point (auto-saved snapshot of current event work) ───

  _autoSaveTimer: null,
  _suppressAutoSave: false,

  /** Debounced auto-save to localStorage. Called from every state-mutation site. */
  _scheduleAutoSave() {
    if (this._suppressAutoSave) {
      this._suppressAutoSave = false;
      return;
    }
    if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
    this._autoSaveTimer = setTimeout(() => {
      this._autoSaveTimer = null;
      if (!this.entrants || this.entrants.length === 0) return;
      const payload = SavePoint.build(this);
      SavePoint.saveToLocalStorage(payload);
    }, 500);
  },

  _saveProgress() {
    if (this.entrants.length === 0) {
      this._showStatus('Load a CSV first.', 'error');
      return;
    }
    const payload = SavePoint.build(this);
    SavePoint.saveToLocalStorage(payload);
    SavePoint.download(payload);
    this._showStatus('Progress saved and downloaded.', 'success');
  },

  async _loadProgressFromFile(file) {
    try {
      const text = await file.text();
      const payload = SavePoint.parse(text);
      if (!payload) {
        this._showStatus('Failed to parse save point file.', 'error');
        return;
      }
      this._applySavePoint(payload, 'file');
    } catch (err) {
      this._showStatus(`Error loading save point: ${err.message}`, 'error');
    }
  },

  /** Apply a payload, rebuild every UI section, and write it to localStorage. */
  _applySavePoint(payload, source) {
    const { warnings } = SavePoint.restore(payload, this);
    this._buildEventTitle();
    this._buildPaxClassUI();
    if (this.entrants.length > 0) {
      this._renderTable();
      this._autoSizeColumns();
      this._buildGroupAssignmentUI();
      this._buildManualAssignmentUI();
      this._buildAlgorithmAssignmentUI();
      this._updateGroupCounts();
    }
    this._updateButtonStates();
    SavePoint.saveToLocalStorage(payload);
    this._updateSavePointIndicator(payload);
    const entrantCount = this.entrants?.length || 0;
    const warnSuffix = warnings.length ? ` Warnings: ${warnings.join(' ')}` : '';
    this._showStatus(`Save point restored from ${source}: ${entrantCount} entrants.${warnSuffix}`, 'success');
  },

  _viewSavePoint() {
    if (!this.entrants || this.entrants.length === 0) {
      this._showStatus('Nothing to view yet — load a CSV or save point first.', 'error');
      return;
    }
    const payload = SavePoint.build(this);
    this._showSavePointSummaryModal(payload);
  },

  _showSavePointSummaryModal(payload) {
    const summary = SavePoint.summary(payload);
    if (!summary) return;
    const existing = document.getElementById('savepoint-summary-modal');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'savepoint-summary-modal';
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    const modal = document.createElement('div');
    modal.className = 'modal-content savepoint-summary';
    let html = '<h3>Save Point Summary</h3>';
    html += '<table class="savepoint-summary-table">';
    for (const r of summary.rows) {
      html += `<tr><th>${r.label}</th><td>${this._escapeHtml(r.value)}</td></tr>`;
    }
    html += '</table>';
    for (const sec of summary.assignments) {
      html += `<h4>${this._escapeHtml(sec.section)} (${sec.items.length})</h4>`;
      html += '<ul class="savepoint-summary-list">';
      for (const item of sec.items) html += `<li>${this._escapeHtml(item)}</li>`;
      html += '</ul>';
    }
    html += '<button class="modal-close">Close</button>';
    modal.innerHTML = html;
    modal.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  },

  _escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  _resetApp() {
    if (!confirm('This will clear all current work and reset the app. Continue?')) return;
    this._suppressAutoSave = true;
    if (this._autoSaveTimer) {
      clearTimeout(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
    SavePoint.clearLocalStorage();

    // Reset App state
    this.entrants = [];
    this.rawCsvText = '';
    this.manualAssignments = new Map();
    this.groupAssignments = null;
    this.lockedClasses = new Set();
    this.validCombos = null;
    this.comboIndex = 0;
    this.cornerCount = 4;
    this.maxGroupDiff = 4;
    this.noviceMode = 'follow';
    this.ladiesMode = 'follow';
    this.eventTitle = '';
    this.hasLadies = false;

    // Reset DOM
    document.getElementById('csv-file').value = '';
    document.getElementById('csv-file-label').textContent = '';
    document.getElementById('memory-file').value = '';
    document.getElementById('memory-file-label').textContent = '';
    document.getElementById('savepoint-file').value = '';
    document.getElementById('savepoint-file-label').textContent = '';
    const cornerInput = document.getElementById('corner-count');
    if (cornerInput) cornerInput.value = 4;
    document.getElementById('group-assignment').innerHTML = '';
    if (this.table) {
      document.getElementById('spreadsheet').innerHTML = '';
      this.table = null;
    }
    for (const id of ['manual-assignment-section', 'session-manual-section', 'algorithm-assignment-section']) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    }

    CONFIG.resetClasses();
    this._setDefaultTitle();
    this._buildPaxClassUI();
    this._updateButtonStates();
    this._updateSavePointIndicator(null);
    this._showStatus('App reset. Save point cleared.', 'success');
  },

  _tryResumeFromLocalStorage() {
    const payload = SavePoint.loadFromLocalStorage();
    if (!payload) return;
    this._applySavePoint(payload, 'localStorage');
  },

  /** Update the savepoint indicator label after a restore or auto-save tick. */
  _updateSavePointIndicator(payload) {
    const el = document.getElementById('savepoint-indicator');
    if (!el) return;
    const baseLive = 'Save point: live (auto-saved as you work)';
    if (!payload || !payload.savedAt) {
      el.textContent = baseLive;
      el.className = 'memory-indicator none';
      return;
    }
    const ts = new Date(payload.savedAt).toLocaleString();
    el.textContent = `${baseLive} — restored from ${ts}`;
    el.className = 'memory-indicator loaded';
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
