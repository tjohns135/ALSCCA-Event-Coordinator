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

    document.getElementById('event-name').addEventListener('input', () => this._buildEventTitle());
    document.getElementById('event-date').addEventListener('change', () => this._buildEventTitle());

    document.getElementById('corner-count').addEventListener('change', (e) => {
      this.cornerCount = parseInt(e.target.value) || 4;
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
      e.running, e.working, e.position, e.comments,
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
    // Count by position + work session; corner workers are allowed multiples
    const counts = {};
    const seen = new Set();

    for (const e of this.entrants) {
      if (!e.position || !e.working) continue;
      if (e.position.endsWith('Worker')) continue;
      const key = `${e.position}::${e.working}`;
      counts[key] = (counts[key] || 0) + 1;
      seen.add(`${e.competitor}::${key}`);
    }
    // Count manual assignments not yet synced to entrants
    for (const [pos, worker] of this.manualAssignments) {
      if (pos.endsWith('Worker')) continue;
      const working = document.querySelector(`#manual-assignments-table select[data-position="${pos}"]`)?.dataset.working || '';
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
        working: '', position: '', comments: '',
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
      e.position = row[6] || '';
      e.comments = row[7] || '';
      e.classPaxNum = `${e.class}_${e.pax}_${e.number}`;
    }
  },

  _updateTable() {
    if (!this.table) return;
    const data = this.entrants.map((e) => [
      e.competitor, e.class, e.pax, e.number,
      e.running, e.working, e.position, e.comments,
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
    // Recompute diffs using per-entrant counting (source of truth) and re-filter
    const validCombos = this._recomputeAndFilter(result.allValid, opts);
    if (validCombos.length > 0) {
      this.groupAssignments = validCombos[0].assignment;
      this.validCombos = validCombos;
      this.comboIndex = 0;
    } else {
      // No valid combos — use best overall but recompute its diff too
      const best = Groups.computeGroupCounts(this.entrants, result.assignments, opts);
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
    const section = document.getElementById('manual-assignment-section');
    const tableContainer = document.getElementById('manual-assignments-table');
    const wasOpen = section.classList.contains('open');
    const wasVisible = section.style.display !== 'none';
    tableContainer.innerHTML = '';

    const sorted = [...this.entrants]
      .filter((e) => e.competitor)
      .sort((a, b) => a.competitor.localeCompare(b.competitor));

    // Auto-fill button
    const autoFillBtn = document.createElement('button');
    autoFillBtn.textContent = 'Auto-Fill Unassigned Positions';
    autoFillBtn.className = 'sample-btn';
    autoFillBtn.style.marginBottom = 'var(--space-sm)';
    autoFillBtn.addEventListener('click', () => this._autoFillManualAssignments());
    tableContainer.appendChild(autoFillBtn);

    const table = document.createElement('table');
    table.className = 'manual-table';

    // Early position groups
    for (const group of CONFIG.earlyPositionGroups) {
      const headerRow = document.createElement('tr');
      headerRow.className = 'manual-category-header';
      const th = document.createElement('td');
      th.colSpan = 2;
      th.textContent = group.name;
      headerRow.appendChild(th);
      table.appendChild(headerRow);

      for (const position of group.positions) {
        table.appendChild(this._buildManualTableRow(position, sorted, 'Early'));
      }
    }

    // Session-based manual positions (Timing, Safety Steward, Announcer, Sound)
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
        table.appendChild(this._buildManualTableRow(pos.name, sorted, working));
      }
    }

    // Shadow positions group
    const shadowHeader = document.createElement('tr');
    shadowHeader.className = 'manual-category-header';
    const shadowTh = document.createElement('td');
    shadowTh.colSpan = 2;
    shadowTh.textContent = 'Shadow Positions (optional)';
    shadowHeader.appendChild(shadowTh);
    table.appendChild(shadowHeader);

    for (const shadow of CONFIG.workerPositions.shadow) {
      const working = shadow.session === 1 ? 'Work 1st' : 'Work 2nd';
      table.appendChild(this._buildManualTableRow(shadow.name, sorted, working));
    }

    tableContainer.appendChild(table);

    // Show section but preserve collapse state on rebuild
    section.style.display = 'block';
    if (wasVisible) {
      if (wasOpen) {
        section.classList.add('open');
        section.querySelector('.collapsible-body').style.display = 'block';
      } else {
        section.classList.remove('open');
        section.querySelector('.collapsible-body').style.display = 'none';
      }
    } else {
      section.classList.add('open');
      section.querySelector('.collapsible-body').style.display = 'block';
    }
    this._updateManualDropdowns();
  },

  /**
   * Build a table row for manual assignment with optgroup dropdown (#3)
   */
  _buildManualTableRow(position, sortedEntrants, workingValue) {
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

    // Split entrants into optgroups: Eligible, Experienced, Inexperienced
    const eligible = [];
    const experienced = [];
    const inexperienced = [];

    for (const e of sortedEntrants) {
      const posCount = Memory.getPositionCount(e.competitor, position);
      const eventCount = Memory.getEventCount(e.competitor);
      if (posCount > 0) {
        eligible.push(e);
      } else if (eventCount >= 5) {
        experienced.push(e);
      } else {
        inexperienced.push(e);
      }
    }

    const addOptgroup = (label, entrants) => {
      if (entrants.length === 0) return;
      const og = document.createElement('optgroup');
      og.label = label;
      for (const e of entrants) {
        const opt = document.createElement('option');
        opt.value = e.competitor;
        opt.textContent = `${e.competitor} (${e.class}/${e.pax})`;
        og.appendChild(opt);
      }
      select.appendChild(og);
    };

    addOptgroup('Eligible', eligible);
    addOptgroup('Experienced', experienced);
    addOptgroup('Inexperienced', inexperienced);

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

      // Check if this worker is already assigned elsewhere
      let existingPosition = null;
      for (const [pos, worker] of this.manualAssignments) {
        if (worker === selectedWorker && pos !== position) {
          existingPosition = pos;
          break;
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

  _updateManualDropdowns() {
    const assigned = new Set(this.manualAssignments.values());
    const selects = document.querySelectorAll('#manual-assignments-table select');

    for (const select of selects) {
      const currentVal = select.value;
      for (const opt of select.options) {
        if (!opt.value) continue;
        const isElsewhere = assigned.has(opt.value) && opt.value !== currentVal;
        opt.disabled = false;
        opt.classList.toggle('assigned-elsewhere', isElsewhere);
      }

      // Toggle unassigned highlight on the row
      const row = select.closest('.manual-table-row');
      if (row) row.classList.toggle('unassigned', !select.value);
    }
    this._checkDuplicatePositions();
  },

  _showReassignModal(workerName, fromPosition, toPosition) {
    const existing = document.getElementById('reassign-modal');
    if (existing) existing.remove();

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

    modal.innerHTML = `
      <h3>Reassign Worker</h3>
      <p class="reassign-modal-text">
        <strong>${workerName}</strong> is currently assigned to <strong>${fromPosition}</strong>.<br>
        Reassign to <strong>${toPosition}</strong>?
      </p>
      <div class="reassign-backfill">
        <label>
          <input type="checkbox" id="reassign-backfill-cb">
          Fill <strong>${fromPosition}</strong>
        </label>
        <select id="reassign-backfill-select" style="display:none">
          ${backfillOptions}
        </select>
      </div>
      <div class="reassign-modal-buttons">
        <button class="btn-cancel">No</button>
        <button class="btn-confirm">Yes, Reassign</button>
      </div>
    `;

    // Backfill checkbox toggles dropdown
    const backfillCb = modal.querySelector('#reassign-backfill-cb');
    const backfillSelect = modal.querySelector('#reassign-backfill-select');
    backfillCb.addEventListener('change', () => {
      backfillSelect.style.display = backfillCb.checked ? '' : 'none';
    });

    // Cancel
    modal.querySelector('.btn-cancel').addEventListener('click', () => {
      overlay.remove();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // Confirm reassignment
    modal.querySelector('.btn-confirm').addEventListener('click', () => {
      // Remove worker from old position
      this.manualAssignments.delete(fromPosition);

      // Assign worker to new position
      this.manualAssignments.set(toPosition, workerName);

      // Backfill old position if checked and a worker was selected
      if (backfillCb.checked && backfillSelect.value) {
        this.manualAssignments.set(fromPosition, backfillSelect.value);
      }

      // Sync all dropdown values with manualAssignments
      const selects = document.querySelectorAll('#manual-assignments-table select');
      for (const sel of selects) {
        const pos = sel.dataset.position;
        sel.value = this.manualAssignments.get(pos) || '';
      }

      this._updateManualDropdowns();
      overlay.remove();
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  },

  _autoFillManualAssignments() {
    const sorted = [...this.entrants]
      .filter((e) => e.competitor)
      .sort((a, b) => a.competitor.localeCompare(b.competitor));
    const assigned = new Set(this.manualAssignments.values());

    // Collect all manual positions in order (early + session + shadow)
    const positions = [];
    for (const group of CONFIG.earlyPositionGroups) {
      for (const pos of group.positions) {
        positions.push(pos);
      }
    }
    for (const group of CONFIG.sessionPositionGroups) {
      for (const pos of group.positions) {
        positions.push(pos.name);
      }
    }
    for (const shadow of CONFIG.workerPositions.shadow) {
      positions.push(shadow.name);
    }

    for (const position of positions) {
      // Skip already assigned positions
      if (this.manualAssignments.has(position)) continue;

      // Categorize available entrants
      const eligible = [];
      const experienced = [];
      for (const e of sorted) {
        if (assigned.has(e.competitor)) continue;
        const posCount = Memory.getPositionCount(e.competitor, position);
        const eventCount = Memory.getEventCount(e.competitor);
        if (posCount > 0) {
          eligible.push(e);
        } else if (eventCount >= 5) {
          experienced.push(e);
        }
      }

      // Pick best available: eligible first, then experienced, skip if only inexperienced
      const pick = eligible[0] || experienced[0] || null;
      if (pick) {
        this.manualAssignments.set(position, pick.competitor);
        assigned.add(pick.competitor);
      }
    }

    // Rebuild UI to reflect selections
    this._buildManualAssignmentUI();
  },

  _syncManualAssignments() {
    for (const e of this.entrants) {
      if (e.position && CONFIG.isManualPosition(e.position)) {
        e.position = '';
        if (e.running === 'Run 1st') e.working = 'Work 2nd';
        else if (e.running === 'Run 2nd') e.working = 'Work 1st';
      }
    }

    const selects = document.querySelectorAll('#manual-assignments-table select');
    for (const select of selects) {
      if (!select.value) continue;
      const position = select.dataset.position;
      const working = select.dataset.working;
      const entrant = this.entrants.find((e) => e.competitor === select.value);
      if (entrant) {
        entrant.position = position;
        entrant.working = working;
        entrant.chalkLiner = false;
        if (position.startsWith('Course Setup')) {
          const cb = document.querySelector(`#chalk-liner-${position.replace(/\s+/g, '-')}`);
          if (cb && cb.checked) {
            entrant.chalkLiner = true;
          }
        }
      }
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

  /**
   * Recompute diffs for allValid combos using per-entrant counting and re-filter by maxGroupDiff.
   * autoAssign uses class-based totals which can miss entrants that don't map to any class.
   */
  _recomputeAndFilter(allValid, opts) {
    const groupOpts = { noviceMode: opts.noviceMode || this.noviceMode, ladiesMode: opts.ladiesMode || this.ladiesMode };
    const maxDiff = opts.maxGroupDiff !== undefined ? opts.maxGroupDiff : this.maxGroupDiff;
    const result = [];
    for (const combo of allValid) {
      const counts = Groups.computeGroupCounts(this.entrants, combo.assignment, groupOpts);
      combo.diff = counts.diff;
      combo.g1 = counts.g1;
      combo.g2 = counts.g2;
      if (counts.diff <= maxDiff) {
        result.push(combo);
      }
    }
    result.sort((a, b) => a.diff - b.diff);
    return result;
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
      this.validCombos = this._recomputeAndFilter(result.allValid, opts);
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
      e.position = '';
    }
    this._updateTable();
    this._updateGroupCounts();
  },

  /** Combined split + assign */
  assignWorkers() {
    if (this.entrants.length === 0) return;
    this._syncFromTable();

    // Check for existing algorithm assignments before modifying anything
    const hasAlgoAssigned = this.entrants.some(
      (e) => e.position && !CONFIG.isManualPosition(e.position)
    );
    if (hasAlgoAssigned) {
      const choice = confirm(
        'Algorithm positions are already assigned. Click OK to clear and reassign, or Cancel to only fill unassigned positions.'
      );
      if (choice) {
        for (const e of this.entrants) {
          if (e.position && !CONFIG.isManualPosition(e.position)) {
            e.position = '';
          }
        }
      }
    }

    this._syncManualAssignments();

    const preserved = new Map();
    for (const e of this.entrants) {
      if (e.position && CONFIG.isManualPosition(e.position)) {
        preserved.set(e.competitor, { position: e.position, working: e.working });
      }
    }

    const groupOpts = { noviceMode: this.noviceMode, ladiesMode: this.ladiesMode };
    Groups.split(this.entrants, this.groupAssignments, groupOpts);

    for (const e of this.entrants) {
      const saved = preserved.get(e.competitor);
      if (saved) {
        e.position = saved.position;
        e.working = saved.working;
      }
    }

    Workers.assign(this.entrants, this.cornerCount);
    this._updateTable();
    this._updateGroupCounts();
    this._checkDuplicatePositions();

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
      if (e.competitor && e.position) {
        Memory.updateParticipant(e.competitor, {
          date: document.getElementById('event-date').value || new Date().toISOString().split('T')[0],
          eventName: this.eventTitle,
          position: e.position,
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
<title>ALSCCA Entry List</title>
<script src="https://bossanova.uk/jspreadsheet/v4/jexcel.js"><\/script>
<link rel="stylesheet" href="https://bossanova.uk/jspreadsheet/v4/jexcel.css" />
<script src="https://jsuites.net/v4/jsuites.js"><\/script>
<link rel="stylesheet" href="https://jsuites.net/v4/jsuites.css" />
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
};

document.addEventListener('DOMContentLoaded', () => App.init());
