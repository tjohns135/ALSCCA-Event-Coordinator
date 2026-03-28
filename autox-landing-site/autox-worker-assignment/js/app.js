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
      }
    });

    document.getElementById('btn-auto-balance').addEventListener('click', () => this.autoBalance());
    document.getElementById('btn-assign').addEventListener('click', () => this.assignWorkers());
    document.getElementById('btn-pdf-workers').addEventListener('click', () => this.generateWorkerPDF());
    document.getElementById('btn-pdf-groups').addEventListener('click', () => this.generateGroupsPDF());
    document.getElementById('btn-download-memory').addEventListener('click', () => this.downloadMemory());
    document.getElementById('btn-view-memory').addEventListener('click', () => Memory.openViewer());
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
      this._invalidateCombos();
      this._buildPaxClassUI();
      if (this.entrants.length > 0) this._buildGroupAssignmentUI();
    });
  },

  // ── CSV Loading ──────────────────────────────────────────────

  async loadCSV(file) {
    try {
      this.entrants = await CSV.parse(file);
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
      const response = await fetch('./examples/actual_entry_list_2026-2.csv');
      if (!response.ok) throw new Error('Failed to fetch sample CSV');
      const blob = await response.blob();
      const file = new File([blob], 'actual_entry_list_2026-2.csv', { type: 'text/csv' });
      await this.loadCSV(file);
      document.getElementById('csv-file-label').textContent = 'actual_entry_list_2026-2.csv';
    } catch (err) {
      this._showStatus(`Error loading sample CSV: ${err.message}`, 'error');
    }
  },

  async loadSampleMemory() {
    try {
      const response = await fetch('./examples/master_memory.json');
      if (!response.ok) throw new Error('Failed to fetch sample memory');
      const blob = await response.blob();
      const file = new File([blob], 'memory.json', { type: 'application/json' });
      const success = await Memory.loadFromFile(file, 'sample file');
      this._showStatus(
        success ? 'Sample memory loaded successfully.' : 'Failed to load sample memory.',
        success ? 'success' : 'error'
      );
      if (success) {
        document.getElementById('memory-file-label').textContent = 'master_memory.json';
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
    for (const [clsKey, clsInfo] of Object.entries(CONFIG.classes)) {
      for (const pax of clsInfo.pax) {
        const row = document.createElement('div');
        row.className = 'pax-row';

        const label = document.createElement('span');
        label.className = 'pax-label';
        label.textContent = pax;
        row.appendChild(label);

        const sel = document.createElement('select');
        sel.dataset.pax = pax;
        for (const [k, info] of Object.entries(CONFIG.classes)) {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = k;
          if (k === clsKey) opt.selected = true;
          sel.appendChild(opt);
        }
        sel.addEventListener('change', () => {
          this._invalidateCombos();
          if (this.entrants.length > 0) this._buildGroupAssignmentUI();
        });
        row.appendChild(sel);
        grid.appendChild(row);
      }
    }
  },

  // ── Spreadsheet ──────────────────────────────────────────────

  _renderTable() {
    const container = document.getElementById('spreadsheet');
    container.innerHTML = '';

    const data = this.entrants.map((e) => [
      e.competitor, e.class, e.pax, e.number,
      e.running, e.working, e.position, e.checkin, e.comments,
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
        { title: 'Checkin', width: 60 },
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
      onchange: () => this._syncFromTable(),
    });
  },

  /** Auto-size columns to fit content (#7) */
  _autoSizeColumns() {
    if (!this.table) return;
    const data = this.table.getData();
    const headers = ['Competitor', 'Class', 'PAX', '#', 'Running', 'Working', 'Position', 'Checkin', 'Comments'];
    const minWidths = [120, 45, 45, 35, 75, 75, 120, 55, 120];

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

    const fields = ['competitor', 'class', 'pax', 'number', 'running', 'working', 'position', 'checkin', 'comments'];
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
        working: '', position: '', checkin: '', comments: '',
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
      e.checkin = row[7] || '';
      e.comments = row[8] || '';
      e.classPaxNum = `${e.class}_${e.pax}_${e.number}`;
    }
  },

  _updateTable() {
    if (!this.table) return;
    const data = this.entrants.map((e) => [
      e.competitor, e.class, e.pax, e.number,
      e.running, e.working, e.position, e.checkin, e.comments,
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

    const grid = document.createElement('div');
    grid.className = 'group-grid';

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
      grid.appendChild(row);
    }

    container.appendChild(grid);

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
    tableContainer.innerHTML = '';

    const sorted = [...this.entrants]
      .filter((e) => e.competitor)
      .sort((a, b) => a.competitor.localeCompare(b.competitor));

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
    section.style.display = 'block';
    section.classList.add('open');
    section.querySelector('.collapsible-body').style.display = 'block';
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
      if (select.value) {
        this.manualAssignments.set(position, select.value);
      } else {
        this.manualAssignments.delete(position);
      }
      this._updateManualDropdowns();
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
        opt.disabled = assigned.has(opt.value) && opt.value !== currentVal;
      }
    }
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
        let finalPosition = position;
        if (position.startsWith('Course Setup')) {
          const cb = document.querySelector(`#chalk-liner-${position.replace(/\s+/g, '-')}`);
          if (cb && cb.checked) {
            finalPosition = `${position} (Chalk Liner)`;
          }
        }
        entrant.position = finalPosition;
        entrant.working = working;
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

    // Update dropdowns
    for (const [cls, group] of Object.entries(this.groupAssignments)) {
      const select = document.getElementById(`group-select-${cls}`);
      if (select) select.value = group;
    }

    this._updateGroupCounts();
  },

  /** Combined split + assign */
  assignWorkers() {
    if (this.entrants.length === 0) return;
    this._syncFromTable();
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

    Workers.assign(this.entrants, this.cornerCount);
    this._updateTable();
    this._updateGroupCounts();

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
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
