/**
 * Memory management — participant history tracking
 * Stores/retrieves from JSON file upload/download + localStorage cache
 */

const Memory = {
  STORAGE_KEY: 'alscca_worker_memory',
  data: null,
  source: null,

  init() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.data = JSON.parse(stored);
        this.source = 'localStorage';
        this.updateIndicator(true);
        return true;
      } catch (e) {
        console.warn('Failed to parse stored memory:', e);
      }
    }
    this.data = this._empty();
    this.source = null;
    this.updateIndicator(false);
    return false;
  },

  _empty() {
    return { participants: {}, lastUpdated: null, events: [] };
  },

  _key(name) {
    return name.trim().toLowerCase();
  },

  getParticipant(name) {
    return this.data.participants[this._key(name)] || null;
  },

  updateParticipant(name, eventInfo) {
    const key = this._key(name);
    if (!this.data.participants[key]) {
      this.data.participants[key] = {
        name: name.trim(),
        events: [],
        positions: [],
        captainCapable: false,
      };
    }
    const p = this.data.participants[key];

    if (eventInfo) {
      p.events.push({
        date: eventInfo.date || new Date().toISOString().split('T')[0],
        eventName: eventInfo.eventName || '',
        position: eventInfo.position || '',
        class: eventInfo.class || '',
        pax: eventInfo.pax || '',
      });

      if (eventInfo.position && !p.positions.includes(eventInfo.position)) {
        p.positions.push(eventInfo.position);
      }

      if (eventInfo.position && eventInfo.position.includes('Captain')) {
        p.captainCapable = true;
      }
    }
  },

  loadFromJSON(jsonString, source) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.participants) {
        this.data = parsed;
        this.source = source || 'file';
        this._save();
        this.updateIndicator(true);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to parse memory JSON:', e);
      return false;
    }
  },

  loadFromFile(file, source) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const success = this.loadFromJSON(e.target.result, source || 'file');
        resolve(success);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  exportJSON() {
    this.data.lastUpdated = new Date().toISOString();
    return JSON.stringify(this.data, null, 2);
  },

  download() {
    const json = this.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alscca_memory_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  _save() {
    this.data.lastUpdated = new Date().toISOString();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
  },

  save() {
    this._save();
    this.updateIndicator(true);
  },

  clear() {
    this.data = this._empty();
    this.source = null;
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateIndicator(false);
  },

  updateIndicator(loaded) {
    const indicator = document.getElementById('memory-indicator');
    if (!indicator) return;

    const count = this.data ? Object.keys(this.data.participants).length : 0;

    if (loaded && count > 0) {
      indicator.className = 'memory-indicator loaded';
      const from = this.source ? ` from ${this.source}` : '';
      indicator.textContent = `Memory: ${count} participants loaded${from}`;
    } else if (loaded) {
      indicator.className = 'memory-indicator empty';
      const from = this.source ? ` from ${this.source}` : '';
      indicator.textContent = `Memory: loaded (empty)${from}`;
    } else {
      indicator.className = 'memory-indicator none';
      indicator.textContent = 'Memory: not loaded';
    }
  },

  // Alias map: new name base → old name patterns to also count
  _positionAliases: {
    'Safety Steward': ['SSS'],
    'Safety Steward Shadow': ['SSS Shadow'],
  },

  // Eligibility groups: positions with different base names that share eligibility
  _eligibilityGroups: [
    ['Tech'],
    ['Waiver', 'Early Waiver', 'Late Waiver', 'Lunch Waiver'],
    ['Novice Coach'],
    ['Course Setup'],
    ['Paddock Marshal', 'Paddock Marshal Early', 'Paddock Marshal Late'],
  ],

  /**
   * Check if a historical position matches a query position.
   * Handles renamed positions (SSS → Safety Steward),
   * numbered variants (Starter 1/2 match old "Starter"),
   * and eligibility groups (Waiver matches Early Waiver, etc.).
   */
  _matchesPosition(historicalPosition, queryPosition) {
    if (historicalPosition === queryPosition) return true;

    // Strip trailing number to get base name (e.g., "Safety Steward 1" → "Safety Steward")
    const queryBase = queryPosition.replace(/\s+\d+$/, '');
    const histBase = historicalPosition.replace(/\s+\d+$/, '');

    // Same base name matches (e.g., "Timing 1" query matches "Timing 1" history)
    if (histBase === queryBase) return true;

    // Check aliases: does the query base have old names that match?
    const oldNames = this._positionAliases[queryBase];
    if (oldNames) {
      for (const oldName of oldNames) {
        if (historicalPosition === oldName || histBase === oldName) return true;
      }
    }

    // Check eligibility groups: positions in the same group cross-match
    for (const group of this._eligibilityGroups) {
      const queryInGroup = group.some((g) => queryBase === g);
      const histInGroup = group.some((g) => histBase === g);
      if (queryInGroup && histInGroup) return true;
    }

    return false;
  },

  getPositionCount(name, positionType) {
    const p = this.getParticipant(name);
    if (!p) return 0;
    return p.events.filter(
      (e) => e.position && this._matchesPosition(e.position, positionType)
    ).length;
  },

  getEventCount(name) {
    const p = this.getParticipant(name);
    return p ? p.events.length : 0;
  },

  /**
   * Open memory viewer in a new browser tab with spreadsheet display
   */
  openViewer() {
    const participants = this.data ? this.data.participants : {};
    const rows = [];

    for (const [key, p] of Object.entries(participants)) {
      const eventCount = p.events ? p.events.length : 0;
      const positionsList = p.positions ? p.positions.join(', ') : '';
      const lastEvent = p.events && p.events.length > 0
        ? p.events[p.events.length - 1]
        : null;

      rows.push({
        name: p.name,
        eventCount,
        positions: positionsList,
        captainCapable: p.captainCapable ? 'Yes' : 'No',
        lastEventDate: lastEvent ? lastEvent.date : '',
        lastEventName: lastEvent ? lastEvent.eventName : '',
        lastPosition: lastEvent ? lastEvent.position : '',
      });
    }

    // Sort by name
    rows.sort((a, b) => a.name.localeCompare(b.name));

    // Build HTML for new tab
    const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>ALSCCA Memory Viewer</title>
<script src="https://bossanova.uk/jspreadsheet/v4/jexcel.js"></script>
<link rel="stylesheet" href="https://bossanova.uk/jspreadsheet/v4/jexcel.css" />
<script src="https://jsuites.net/v4/jsuites.js"></script>
<link rel="stylesheet" href="https://jsuites.net/v4/jsuites.css" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; }
  h1 { font-size: 1.2rem; margin-bottom: 4px; }
  .info { font-size: 0.85rem; color: #666; margin-bottom: 12px; }

</style>
</head><body>
<h1>ALSCCA Participant Memory</h1>
<p class="info">Last updated: ${this.data.lastUpdated || 'never'} | ${rows.length} participants</p>
<div id="spreadsheet"></div>
<script>
var allData = ${JSON.stringify(rows.map((r) => [
      r.name, r.eventCount, r.positions, r.captainCapable,
      r.lastEventDate, r.lastEventName, r.lastPosition,
    ]))};

var table = jspreadsheet(document.getElementById('spreadsheet'), {
  data: allData,
  columns: [
    { title: 'Name', width: 180, readOnly: true },
    { title: 'Events', width: 60, readOnly: true },
    { title: 'Positions Worked', width: 250, readOnly: true },
    { title: 'Captain Capable', width: 100, readOnly: true },
    { title: 'Last Event Date', width: 110, readOnly: true },
    { title: 'Last Event Name', width: 200, readOnly: true },
    { title: 'Last Position', width: 140, readOnly: true },
  ],
  columnSorting: true,
  tableOverflow: true,
  tableWidth: '100%',
  tableHeight: (window.innerHeight - 120) + 'px',
  search: true,
});
</script>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  },
};
