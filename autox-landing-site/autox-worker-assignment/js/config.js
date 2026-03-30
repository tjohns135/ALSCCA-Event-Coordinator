/**
 * Class/PAX configuration and worker position definitions
 * Based on 2026 SCCA National Solo Rules + ALSCCA event data
 */

const CONFIG = {
  // Local class -> PAX mappings
  // Each class groups specific PAX codes together for run group assignment
  classes: {
    S1: { name: 'Street 1', pax: ['SS', 'AS', 'BS', 'FS'] },
    S2: { name: 'Street 2', pax: ['CS', 'ES'] },
    S3: { name: 'Street 3', pax: ['DS', 'GS', 'HS', 'SSC', 'HCS'] },
    ST: { name: 'Street Touring', pax: ['SST', 'AST', 'BST', 'CST', 'DST', 'EST', 'GST'] },
    CAM: { name: 'Classic American Muscle', pax: ['CAMS', 'CAMC', 'CAMT'] },
    XS: { name: 'Xtreme Street', pax: ['XA', 'XB'] },
  },

  // Special classes (open PAX — any PAX allowed)
  specialClasses: {
    X: { name: 'Pro', description: 'Self-designated experienced drivers, any PAX' },
    L: { name: 'Ladies', description: 'Ladies class, any PAX. Run group determined by Ladies mode setting.' },
    N: { name: 'Novice', description: 'Novice drivers, any PAX. Run group determined by Novice mode setting.' },
    R: { name: 'Race Tire', description: 'FSAE and catch-all for rare vehicles, any PAX' },
  },

  // Work session positions — assigned by the algorithm into run groups
  // session: 1 = works 1st (Run Group 2), 2 = works 2nd (Run Group 1)
  workerPositions: {
    essential: [],
    // Experienced workers; one per run group per session
    experienced: [
      { name: 'Starter 1', session: 1, perGroup: 1 },
      { name: 'Starter 2', session: 2, perGroup: 1 },
      { name: 'Spotter 1', session: 1, perGroup: 1 },
      { name: 'Spotter 2', session: 2, perGroup: 1 },
      { name: 'Grid 1', session: 1, perGroup: 1 },
      { name: 'Grid 2', session: 2, perGroup: 1 },
    ],
    // Optional shadow positions — filled manually if needed, not by the algorithm
    shadow: [
      { name: 'Timing Shadow 1', session: 1, perGroup: 1 },
      { name: 'Timing Shadow 2', session: 2, perGroup: 1 },
      { name: 'Safety Steward Shadow 1', session: 1, perGroup: 1 },
      { name: 'Safety Steward Shadow 2', session: 2, perGroup: 1 },
    ],
    // Corner positions per run group
    corner: {
      defaultCornerCount: 4,
      captain: { assignment: 'experienced', perGroup: 1 },
      worker: { assignment: 'mostExperiencedFirst', perGroup: 4 },
    },
  },

  // Early/manual positions — assigned by the organizer, not part of the algorithm pool
  // Grouped by category for the manual assignment UI
  earlyPositionGroups: [
    { name: 'Event Leadership', positions: ['Event Chair', 'Event Chair Shadow', 'Course Designer'] },
    { name: 'Tech', positions: ['Tech 1', 'Tech 2', 'Tech 3'] },
    { name: 'Waivers', positions: ['Waiver', 'Early Waiver 1', 'Early Waiver 2', 'Early Waiver 3', 'Late Waiver 1', 'Lunch Waiver'] },
    { name: 'Coaching & Outreach', positions: ['Novice Coach 1', 'Novice Coach 2', 'Novice Coach 3', 'Intermediate Coach', 'Worker Chief'] },
    { name: 'Setup & Teardown', positions: ['Course Setup 1', 'Course Setup 2', 'Course Setup 3', 'Course Setup 4', 'Course Setup 5', 'Course Setup 6', 'Trailer Setup Support', 'Truck & Trailer To Site Driver', 'Truck & Trailer To Storage Driver', 'Truck & Trailer To Storage Helper'] },
    { name: 'Paddock Marshal', positions: ['Paddock Marshal', 'Paddock Marshal Early', 'Paddock Marshal Late'] },
  ],

  // Session-based manual positions — manually assigned, not early, work specific sessions
  sessionPositionGroups: [
    { name: 'Timing & Safety', positions: [
      { name: 'Timing 1', session: 1 },
      { name: 'Timing 2', session: 2 },
      { name: 'Safety Steward 1', session: 1 },
      { name: 'Safety Steward 2', session: 2 },
    ]},
    { name: 'Announcer & Sound', positions: [
      { name: 'Announcer 1', session: 1 },
      { name: 'Announcer 2', session: 2 },
      { name: 'Sound 1', session: 1 },
      { name: 'Sound 2', session: 2 },
    ]},
  ],

  // Flat list for backward compat
  get earlyPositions() {
    return this.earlyPositionGroups.flatMap((g) => g.positions);
  },

  // Flat list of session-based manual position names
  get sessionPositions() {
    return this.sessionPositionGroups.flatMap((g) => g.positions.map((p) => p.name));
  },

  // CSV column mapping
  csvColumns: ['Competitor', 'Class', 'PAX', '#', 'SCCA Member'],

  // Output spreadsheet columns
  outputColumns: [
    'Competitor',
    'Class / PAX / #',
    'Running',
    'Working',
    'Position',
    'Comments / Changes',
  ],

  /**
   * Determine which local class a PAX belongs to.
   * Returns the class key (S1, S2, etc.) or null if not found.
   */
  getClassForPax(pax) {
    for (const [classKey, classInfo] of Object.entries(this.classes)) {
      if (classInfo.pax.includes(pax)) {
        return classKey;
      }
    }
    return null;
  },

  /**
   * For a novice entrant, determine which class group they belong to
   * based on their PAX. E.g., N_CST -> ST group.
   */
  getNoviceGroup(pax) {
    // First check if the PAX directly maps to a class
    const directClass = this.getClassForPax(pax);
    if (directClass) return directClass;

    // Check if the PAX matches a Street Touring variant
    // (novice PAX is the same as the SCCA PAX code)
    return null;
  },

  /**
   * Get all assignable classes for run group splitting.
   * Returns array of class keys that need to be assigned to a run group.
   */
  getAssignableClasses() {
    return [...Object.keys(this.classes), 'X', 'R'];
  },

  /**
   * Get flat list of all algorithm-assigned position names.
   */
  getAlgorithmPositionNames() {
    const names = [];
    for (const p of this.workerPositions.essential) names.push(p.name);
    for (const p of this.workerPositions.experienced) names.push(p.name);
    const cc = this.workerPositions.corner.defaultCornerCount;
    for (let c = 1; c <= cc; c++) {
      names.push(`Corner ${c} Captain`);
      names.push(`Corner ${c} Worker`);
    }
    return names;
  },

  /**
   * Check if a position is a manual/early position (not algorithm-assigned).
   */
  isManualPosition(position) {
    if (this.earlyPositions.includes(position)) return true;
    if (this.sessionPositions.includes(position)) return true;
    if (this.workerPositions.shadow.some(s => s.name === position)) return true;
    return false;
  },

  /** Deep-copy snapshot of original class definitions for reset */
  _defaultClasses: null,

  _saveDefaults() {
    this._defaultClasses = {};
    for (const [k, v] of Object.entries(this.classes)) {
      this._defaultClasses[k] = { name: v.name, pax: [...v.pax] };
    }
  },

  resetClasses() {
    if (!this._defaultClasses) return;
    for (const [k, v] of Object.entries(this._defaultClasses)) {
      this.classes[k].pax = [...v.pax];
    }
  },
};

CONFIG._saveDefaults();
