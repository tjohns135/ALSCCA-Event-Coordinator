/**
 * Save Point — point-in-time snapshot of the current event's in-progress state.
 * Distinct from Memory (cross-event participation history). Auto-saves to
 * localStorage on meaningful state changes; downloadable as JSON for backup or
 * cross-device resume.
 *
 * Mental model: localStorage IS the live save point (always reflects current
 * work). Downloaded JSON files are checkpoints / shareable artifacts.
 */

const SavePoint = {
  STORAGE_KEY: 'alscca_save_point',
  CURRENT_SCHEMA: 1,

  /**
   * Build a save-point payload from the current App state. Caller passes the
   * App so we don't import a circular reference; relevant fields are copied.
   */
  build(app) {
    const eventNameInput = document.getElementById('event-name');
    const eventDateInput = document.getElementById('event-date');
    return {
      schemaVersion: this.CURRENT_SCHEMA,
      savedAt: new Date().toISOString(),
      event: {
        name: eventNameInput ? eventNameInput.value : '',
        date: eventDateInput ? eventDateInput.value : '',
        title: app.eventTitle || '',
      },
      settings: {
        cornerCount: app.cornerCount,
        maxGroupDiff: app.maxGroupDiff,
        noviceMode: app.noviceMode,
        ladiesMode: app.ladiesMode,
      },
      rawCsvText: app.rawCsvText || '',
      memorySnapshot: Memory.data ? JSON.parse(JSON.stringify(Memory.data)) : null,
      customClasses: this._classOverrides(),
      groupAssignments: { ...(app.groupAssignments || {}) },
      lockedClasses: app.lockedClasses ? [...app.lockedClasses] : [],
      manualAssignments: Object.fromEntries(app.manualAssignments || []),
      entrants: (app.entrants || []).map((e) => ({ ...e, positions: [...e.positions] })),
    };
  },

  /** Serialize a payload to a pretty-printed JSON string. */
  toJSON(payload) {
    return JSON.stringify(payload, null, 2);
  },

  /** Parse a JSON string into a payload. Returns null on parse failure. */
  parse(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch (e) {
      console.warn('Failed to parse save point JSON:', e);
      return null;
    }
  },

  /** Save current payload to localStorage. */
  saveToLocalStorage(payload) {
    try {
      localStorage.setItem(this.STORAGE_KEY, this.toJSON(payload));
      return true;
    } catch (e) {
      console.warn('Failed to write save point to localStorage:', e);
      return false;
    }
  },

  /** Load payload from localStorage. Returns null if none or parse fails. */
  loadFromLocalStorage() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;
    return this.parse(stored);
  },

  /** Wipe localStorage save point. */
  clearLocalStorage() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  /** Trigger a browser download of the payload as a JSON file. */
  download(payload) {
    const json = this.toJSON(payload);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (payload.event.title || 'progress').replace(/[^\w-]+/g, '_');
    const date = payload.event.date || new Date().toISOString().split('T')[0];
    a.download = `progress_${safeTitle}_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Restore a payload into App state. Best-effort — recognized fields are
   * applied; unknown fields ignored. Returns a {warnings: string[]} report.
   */
  restore(payload, app) {
    const warnings = [];
    if (!payload) {
      warnings.push('Empty save payload.');
      return { warnings };
    }
    if (payload.schemaVersion !== this.CURRENT_SCHEMA) {
      warnings.push(`Schema mismatch: file v${payload.schemaVersion ?? '?'} vs app v${this.CURRENT_SCHEMA}. Loading best-effort.`);
    }

    // Event metadata
    if (payload.event) {
      const nameInput = document.getElementById('event-name');
      const dateInput = document.getElementById('event-date');
      if (nameInput) nameInput.value = payload.event.name || '';
      if (dateInput) dateInput.value = payload.event.date || '';
      app.eventTitle = payload.event.title || '';
    }

    // Settings
    if (payload.settings) {
      const s = payload.settings;
      if (typeof s.cornerCount === 'number') {
        app.cornerCount = s.cornerCount;
        const cornerInput = document.getElementById('corner-count');
        if (cornerInput) cornerInput.value = s.cornerCount;
      }
      if (typeof s.maxGroupDiff === 'number') app.maxGroupDiff = s.maxGroupDiff;
      if (s.noviceMode) app.noviceMode = s.noviceMode;
      if (s.ladiesMode) app.ladiesMode = s.ladiesMode;
    }

    // CSV text + entrants
    if (payload.rawCsvText) app.rawCsvText = payload.rawCsvText;
    if (Array.isArray(payload.entrants)) {
      app.entrants = payload.entrants.map((e) => ({
        ...e,
        positions: Array.isArray(e.positions) ? [...e.positions] : [],
      }));
      app.hasLadies = app.entrants.some((e) => e.class === 'L');
    }

    // Memory snapshot
    if (payload.memorySnapshot) {
      Memory.data = payload.memorySnapshot;
      Memory.source = 'save point';
      Memory._save();
      Memory.updateIndicator(true);
    }

    // Custom class overrides
    if (payload.customClasses) {
      this._applyClassOverrides(payload.customClasses);
    }

    // Group assignments
    app.groupAssignments = { ...(payload.groupAssignments || {}) };
    app.lockedClasses = new Set(payload.lockedClasses || []);

    // Manual assignments
    app.manualAssignments = new Map(Object.entries(payload.manualAssignments || {}));

    return { warnings };
  },

  /**
   * Build a human-readable summary of a save payload for the View popup.
   * Returns { rows: [{ label, value }], assignments: [{ section, items }] }.
   */
  summary(payload) {
    if (!payload) return null;
    const rows = [];
    rows.push({ label: 'Saved at', value: payload.savedAt || '—' });
    rows.push({ label: 'Schema', value: `v${payload.schemaVersion ?? '?'}` });
    rows.push({ label: 'Event title', value: payload.event?.title || '—' });
    rows.push({ label: 'Event date', value: payload.event?.date || '—' });

    const entrants = Array.isArray(payload.entrants) ? payload.entrants : [];
    rows.push({ label: 'Entrants loaded', value: String(entrants.length) });

    const manual = payload.manualAssignments || {};
    const earlySet = new Set((CONFIG.earlyPositionGroups || []).flatMap((g) => g.positions));
    const sessionSet = new Set((CONFIG.sessionPositionGroups || []).flatMap((g) => g.positions.map((p) => p.name)));
    let earlyCount = 0;
    let sessionCount = 0;
    for (const pos of Object.keys(manual)) {
      if (earlySet.has(pos)) earlyCount++;
      else if (sessionSet.has(pos)) sessionCount++;
    }
    rows.push({ label: 'Early manual assignments', value: String(earlyCount) });
    rows.push({ label: 'Session manual assignments', value: String(sessionCount) });

    let algoCount = 0;
    for (const e of entrants) {
      if (!e.positions) continue;
      if (e.positions.some((p) => !earlySet.has(p) && !sessionSet.has(p))) algoCount++;
    }
    rows.push({ label: 'Algorithm-assigned entrants', value: String(algoCount) });

    rows.push({ label: 'Settings', value: payload.settings
      ? `corners ${payload.settings.cornerCount}, maxDiff ${payload.settings.maxGroupDiff}, novice ${payload.settings.noviceMode}, ladies ${payload.settings.ladiesMode}`
      : '—' });

    rows.push({ label: 'Memory snapshot',
      value: payload.memorySnapshot?.participants
        ? `${Object.keys(payload.memorySnapshot.participants).length} participants`
        : 'none' });

    // Flat list of every position in the order they appear in the app:
    // Early → Session → Shadow → Algorithm (Working 1st) → Algorithm (Working 2nd).
    // Unassigned positions show "—". Algorithm rows are prefixed with the work
    // session since the same position name (e.g. "Corner 1 Captain") appears in
    // both sessions.
    const items = [];
    const cornerCount = payload.settings?.cornerCount || CONFIG.workerPositions.corner.defaultCornerCount;

    // Early manual positions, in CONFIG.earlyPositionGroups order
    for (const group of (CONFIG.earlyPositionGroups || [])) {
      for (const pos of group.positions) {
        const worker = manual[pos];
        items.push(`${pos}: ${worker || '—'}`);
      }
    }

    // Session manual positions, in CONFIG.sessionPositionGroups order
    for (const group of (CONFIG.sessionPositionGroups || [])) {
      for (const pos of group.positions) {
        const worker = manual[pos.name];
        items.push(`${pos.name}: ${worker || '—'}`);
      }
    }

    // Shadow positions
    for (const shadow of (CONFIG.workerPositions.shadow || [])) {
      const worker = manual[shadow.name];
      items.push(`${shadow.name}: ${worker || '—'}`);
    }

    // Algorithm positions per session (Working 1st then Working 2nd), each
    // session showing specialized rows then per-corner Captain + Worker rows.
    for (const sessionNum of [1, 2]) {
      const sessionLabel = sessionNum === 1 ? 'Work 1st' : 'Work 2nd';
      const working = sessionLabel;
      const findInSession = (positionName) =>
        entrants.find((e) => e.working === working && (e.positions || []).includes(positionName));
      const filterInSession = (positionName) =>
        entrants.filter((e) => e.working === working && (e.positions || []).includes(positionName));

      const specs = [
        ...(CONFIG.workerPositions.essential || []),
        ...(CONFIG.workerPositions.experienced || []),
      ].filter((p) => p.session === sessionNum);
      for (const sp of specs) {
        const e = findInSession(sp.name);
        items.push(`(${sessionLabel}) ${sp.name}: ${e ? e.competitor : '—'}`);
      }

      for (let c = 1; c <= cornerCount; c++) {
        const captainPos = `Corner ${c} Captain`;
        const captain = findInSession(captainPos);
        items.push(`(${sessionLabel}) ${captainPos}: ${captain ? captain.competitor : '—'}`);

        const workerPos = `Corner ${c} Worker`;
        const workers = filterInSession(workerPos);
        if (workers.length === 0) {
          items.push(`(${sessionLabel}) ${workerPos}: —`);
        } else {
          for (const w of workers) {
            items.push(`(${sessionLabel}) ${workerPos}: ${w.competitor}`);
          }
        }
      }
    }

    const assignments = [{ section: 'All Positions', items }];

    return { rows, assignments };
  },

  /** Snapshot any user edits to CONFIG.classes vs the saved defaults. */
  _classOverrides() {
    if (!CONFIG._defaultClasses) return null;
    const overrides = {};
    for (const [k, v] of Object.entries(CONFIG.classes)) {
      const defaultPax = CONFIG._defaultClasses[k]?.pax || [];
      if (v.pax.length !== defaultPax.length || v.pax.some((p, i) => p !== defaultPax[i])) {
        overrides[k] = { pax: [...v.pax] };
      }
    }
    return Object.keys(overrides).length ? overrides : null;
  },

  /** Apply a class-overrides object back into CONFIG.classes. */
  _applyClassOverrides(overrides) {
    for (const [k, v] of Object.entries(overrides || {})) {
      if (CONFIG.classes[k] && Array.isArray(v.pax)) {
        CONFIG.classes[k].pax = [...v.pax];
      }
    }
  },
};
