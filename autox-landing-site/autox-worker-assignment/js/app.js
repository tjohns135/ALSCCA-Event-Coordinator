/**
 * Main application — UI orchestration and table management
 *
 * Sorting/filtering approach:
 * - jspreadsheet CE v4's built-in columnSorting modifies DOM row order but
 *   breaks our entrants<->row index mapping. So we disable it and implement
 *   our own sort that reorders the entrants array then re-renders.
 * - Filter highlights matching rows rather than hiding/replacing data,
 *   so the entrants array stays intact.
 */

const App = {
  entrants: [],
  groupAssignments: null,
  cornerCount: 4,
  eventTitle: '',
  table: null,
  hasLadies: false,

  init() {
    Memory.init();
    this._setDefaultTitle();
    this._bindEvents();
    this._updateButtonStates();
  },

  _setDefaultTitle() {
    const now = new Date();
    const months = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];
    const dateStr = `${months[now.getMonth()]} ${now.getDate()}`;
    this.eventTitle = `ALSCCA Autocross Pts. # - ${dateStr}`;
    document.getElementById('event-title').value = this.eventTitle;
  },

  _bindEvents() {
    document.getElementById('csv-file').addEventListener('change', (e) => {
      if (e.target.files[0]) this.loadCSV(e.target.files[0]);
    });

    document.getElementById('memory-file').addEventListener('change', async (e) => {
      if (e.target.files[0]) {
        const success = await Memory.loadFromFile(e.target.files[0]);
        this._showStatus(
          success ? 'Memory loaded successfully.' : 'Failed to load memory file.',
          success ? 'success' : 'error'
        );
      }
    });

    document.getElementById('btn-split').addEventListener('click', () => this.splitGroups());
    document.getElementById('btn-auto-balance').addEventListener('click', () => this.autoBalance());
    document.getElementById('btn-assign').addEventListener('click', () => this.assignWorkers());
    document.getElementById('btn-pdf-workers').addEventListener('click', () => this.generateWorkerPDF());
    document.getElementById('btn-pdf-groups').addEventListener('click', () => this.generateGroupsPDF());
    document.getElementById('btn-download-memory').addEventListener('click', () => this.downloadMemory());
    document.getElementById('btn-view-memory').addEventListener('click', () => Memory.openViewer());
    document.getElementById('btn-clear-memory').addEventListener('click', () => this.clearMemory());

    document.getElementById('btn-sample-csv').addEventListener('click', () => this.loadSampleCSV());
    document.getElementById('btn-sample-memory').addEventListener('click', () => this.loadSampleMemory());

    document.getElementById('event-title').addEventListener('input', (e) => {
      this.eventTitle = e.target.value;
    });

    document.getElementById('corner-count').addEventListener('change', (e) => {
      this.cornerCount = parseInt(e.target.value) || 4;
    });

    // Sort controls
    document.getElementById('btn-sort-asc').addEventListener('click', () => this._sortEntrants(true));
    document.getElementById('btn-sort-desc').addEventListener('click', () => this._sortEntrants(false));

    // Filter (highlight, not remove)
    document.getElementById('table-filter').addEventListener('input', (e) => {
      this._highlightFilter(e.target.value);
    });
  },

  async loadCSV(file) {
    try {
      this.entrants = await CSV.parse(file);
      this.hasLadies = this.entrants.some((e) => e.class === 'L');
      this._showStatus(`Loaded ${this.entrants.length} entrants.`, 'success');
      this._renderTable();
      this._buildGroupAssignmentUI();
      this._updateButtonStates();
    } catch (err) {
      this._showStatus(`Error loading CSV: ${err.message}`, 'error');
    }
  },

  async loadSampleCSV() {
    try {
      const response = await fetch('./examples/entry_list_2026-1.csv');
      if (!response.ok) throw new Error('Failed to fetch sample CSV');
      const blob = await response.blob();
      const file = new File([blob], 'entry_list_2026-1.csv', { type: 'text/csv' });
      await this.loadCSV(file);
    } catch (err) {
      this._showStatus(`Error loading sample CSV: ${err.message}`, 'error');
    }
  },

  async loadSampleMemory() {
    try {
      const response = await fetch('./examples/memory.json');
      if (!response.ok) throw new Error('Failed to fetch sample memory');
      const blob = await response.blob();
      const file = new File([blob], 'memory.json', { type: 'application/json' });
      const success = await Memory.loadFromFile(file, 'sample file');
      this._showStatus(
        success ? 'Sample memory loaded successfully.' : 'Failed to load sample memory.',
        success ? 'success' : 'error'
      );
    } catch (err) {
      this._showStatus(`Error loading sample memory: ${err.message}`, 'error');
    }
  },

  /**
   * Render the editable spreadsheet — no built-in sorting
   */
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
        { title: 'Working', width: 75 },
        { title: 'Position', width: 130 },
        { title: 'Checkin', width: 55 },
        { title: 'Comments', width: 140 },
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

  /**
   * Sort entrants array by selected column, then re-render table
   */
  _sortEntrants(ascending) {
    this._syncFromTable();
    const colIdx = parseInt(document.getElementById('sort-column').value);
    if (isNaN(colIdx)) return;

    // Map column index to entrant field
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

  /**
   * Highlight rows matching filter text — does NOT modify data
   */
  _highlightFilter(query) {
    if (!this.table) return;
    const tbody = document.querySelector('#spreadsheet .jexcel tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let matchCount = 0;

    for (const row of rows) {
      if (!query) {
        row.classList.remove('filter-match');
        continue;
      }
      const text = row.textContent.toLowerCase();
      if (text.includes(query.toLowerCase())) {
        row.classList.add('filter-match');
        matchCount++;
      } else {
        row.classList.remove('filter-match');
      }
    }

    const countEl = document.getElementById('filter-count');
    if (query) {
      countEl.textContent = `${matchCount} match${matchCount !== 1 ? 'es' : ''}`;
    } else {
      countEl.textContent = '';
    }
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
    document.getElementById('table-filter').value = '';
    document.getElementById('filter-count').textContent = '';
    const data = this.entrants.map((e) => [
      e.competitor, e.class, e.pax, e.number,
      e.running, e.working, e.position, e.checkin, e.comments,
    ]);
    this.table.setData(data);
  },

  _buildGroupAssignmentUI() {
    const container = document.getElementById('group-assignment');
    container.innerHTML = '';

    const classCounts = {};
    for (const e of this.entrants) {
      classCounts[e.class] = (classCounts[e.class] || 0) + 1;
    }

    this.groupAssignments = Groups.autoAssign(this.entrants);

    const heading = document.createElement('h3');
    heading.textContent = 'Run Group Assignment';
    container.appendChild(heading);

    const desc = document.createElement('p');
    desc.className = 'help-text';
    desc.textContent = 'Assign each class to Run 1st or Run 2nd. Ladies always Run 1st. Novices follow their PAX class. Use Auto-Balance to find optimal split.';
    container.appendChild(desc);

    const grid = document.createElement('div');
    grid.className = 'group-grid';

    const assignableClasses = CONFIG.getAssignableClasses();
    for (const cls of Object.keys(classCounts)) {
      if (cls !== 'N' && cls !== 'L' && !assignableClasses.includes(cls)) {
        assignableClasses.push(cls);
      }
    }

    for (const cls of assignableClasses) {
      const count = classCounts[cls] || 0;
      const noviceCount = this._countNovicesForClass(cls);
      if (count === 0 && noviceCount === 0) continue;

      const row = document.createElement('div');
      row.className = 'group-row';

      const label = document.createElement('span');
      label.className = 'group-label';
      const classInfo = CONFIG.classes[cls] || CONFIG.specialClasses[cls] || { name: cls };
      let labelText = `${cls} (${classInfo.name || cls}) — ${count}`;
      if (noviceCount > 0) labelText += ` +${noviceCount}N`;
      label.textContent = labelText;

      const select = document.createElement('select');
      select.dataset.class = cls;
      select.id = `group-select-${cls}`;
      select.innerHTML = `
        <option value="1" ${this.groupAssignments[cls] === 1 ? 'selected' : ''}>Run 1st</option>
        <option value="2" ${this.groupAssignments[cls] === 2 ? 'selected' : ''}>Run 2nd</option>
      `;
      select.addEventListener('change', () => {
        this.groupAssignments[cls] = parseInt(select.value);
        this._updateGroupCounts();
      });

      row.appendChild(label);
      row.appendChild(select);
      grid.appendChild(row);
    }

    container.appendChild(grid);

    if (this.hasLadies) {
      const note = document.createElement('div');
      note.className = 'ladies-note';
      note.textContent = `Ladies class: ${classCounts['L'] || 0} entrants (always Run 1st)`;
      container.appendChild(note);
    }

    const noviceCount = classCounts['N'] || 0;
    if (noviceCount > 0) {
      const note = document.createElement('div');
      note.className = 'novice-note';
      note.textContent = `Novice class: ${noviceCount} entrants (follow their PAX class)`;
      container.appendChild(note);
    }

    const countsDiv = document.createElement('div');
    countsDiv.id = 'group-counts';
    countsDiv.className = 'group-counts';
    container.appendChild(countsDiv);
    this._updateGroupCounts();

    container.style.display = 'block';
  },

  _countNovicesForClass(cls) {
    if (CONFIG.classes[cls]) {
      return this.entrants.filter(
        (e) => e.class === 'N' && CONFIG.classes[cls].pax.includes(e.pax)
      ).length;
    }
    if (cls === 'CAM') {
      return this.entrants.filter(
        (e) => e.class === 'N' && ['CAMS', 'CAMC', 'CAMT'].includes(e.pax)
      ).length;
    }
    if (cls === 'ST') {
      return this.entrants.filter(
        (e) => e.class === 'N' && ['SST', 'AST', 'BST', 'CST', 'DST', 'EST', 'GST'].includes(e.pax)
      ).length;
    }
    if (cls === 'XS') {
      return this.entrants.filter(
        (e) => e.class === 'N' && ['XA', 'XB'].includes(e.pax)
      ).length;
    }
    return 0;
  },

  _updateGroupCounts() {
    const countsDiv = document.getElementById('group-counts');
    if (!countsDiv) return;

    let g1 = 0, g2 = 0;
    for (const e of this.entrants) {
      const group = this._getEntrantGroup(e);
      if (group === 1) g1++;
      else g2++;
    }

    countsDiv.innerHTML = `
      <strong>Run 1st:</strong> ${g1} entrants &nbsp; | &nbsp;
      <strong>Run 2nd:</strong> ${g2} entrants &nbsp; | &nbsp;
      <strong>Difference:</strong> ${Math.abs(g1 - g2)}
    `;
  },

  _getEntrantGroup(entrant) {
    if (entrant.class === 'L') return 1;
    if (entrant.class === 'N') {
      const cls = CONFIG.getClassForPax(entrant.pax);
      if (cls && this.groupAssignments[cls]) return this.groupAssignments[cls];
      if (['CAMS', 'CAMC', 'CAMT'].includes(entrant.pax)) return this.groupAssignments['CAM'] || 1;
      if (['XA', 'XB'].includes(entrant.pax)) return this.groupAssignments['XS'] || 1;
      if (['SST', 'AST', 'BST', 'CST', 'DST', 'EST', 'GST'].includes(entrant.pax)) return this.groupAssignments['ST'] || 1;
      return 1;
    }
    return this.groupAssignments[entrant.class] || 1;
  },

  autoBalance() {
    if (this.entrants.length === 0) return;
    this.groupAssignments = Groups.autoAssign(this.entrants);
    for (const [cls, group] of Object.entries(this.groupAssignments)) {
      const select = document.getElementById(`group-select-${cls}`);
      if (select) select.value = group;
    }
    this._updateGroupCounts();
    this._showStatus('Run groups auto-balanced.', 'success');
  },

  splitGroups() {
    if (this.entrants.length === 0) return;
    this._syncFromTable();
    Groups.split(this.entrants, this.groupAssignments);
    this._updateTable();
    this._showStatus('Run groups assigned.', 'success');
    this._updateButtonStates();
  },

  assignWorkers() {
    if (this.entrants.length === 0) return;
    this._syncFromTable();

    const hasAssigned = this.entrants.some((e) => e.position);
    if (hasAssigned) {
      const choice = confirm(
        'Workers are already assigned. Click OK to clear all positions and reassign, or Cancel to only fill unassigned positions.'
      );
      if (choice) {
        for (const e of this.entrants) e.position = '';
      }
    }

    Workers.assign(this.entrants, this.cornerCount);
    this._updateTable();
    this._showStatus('Worker positions assigned.', 'success');
    this._updateButtonStates();
  },

  generateWorkerPDF() {
    this._syncFromTable();
    try {
      const doc = PDF.generateWorkerAssignments(this.entrants, this.groupAssignments || {}, this.eventTitle, this.hasLadies);
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
      const doc = PDF.generateGroupsPage(this.entrants, this.groupAssignments || {}, this.eventTitle, this.cornerCount, this.hasLadies);
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
          date: new Date().toISOString().split('T')[0],
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
      this._showStatus('Memory cleared.', 'success');
    }
  },

  _fileDate() {
    return new Date().toISOString().split('T')[0];
  },

  _showStatus(message, type) {
    const el = document.getElementById('status');
    el.textContent = message;
    el.className = `status ${type}`;
    setTimeout(() => { el.className = 'status'; el.textContent = ''; }, 5000);
  },

  _updateButtonStates() {
    const hasData = this.entrants.length > 0;
    const hasSplit = hasData && this.entrants.some((e) => e.running);
    document.getElementById('btn-split').disabled = !hasData;
    document.getElementById('btn-auto-balance').disabled = !hasData;
    document.getElementById('btn-assign').disabled = !hasSplit;
    document.getElementById('btn-pdf-workers').disabled = !hasData;
    document.getElementById('btn-pdf-groups').disabled = !hasData;
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
