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
    L: { name: 'Ladies', description: 'Ladies class, any PAX. Always Run 1st when present.' },
    N: { name: 'Novice', description: 'Novice drivers. Grouped with their PAX class run group.' },
    R: { name: 'Race Tire', description: 'FSAE and catch-all for rare vehicles, any PAX' },
  },

  // Worker positions for each work session
  // "specialized" positions require experience; "corner" positions are for everyone
  workerPositions: {
    specialized: [
      'Timing 1',
      'Timing 2',
      'Timing Shadow',
      'SSS',
      'SSS Shadow',
      'SSS Shadow 2',
      'Announcer',
      'Grid 1',
      'Grid 2',
      'Starter',
      'Waiver',
      'Paddock Marshal',
      'Sound',
    ],
    corner: {
      // Each corner has a captain + workers
      // Number of corners is configurable (typically 4-6)
      defaultCornerCount: 4,
      roles: ['Captain', 'Worker'],
    },
  },

  // Early/setup positions (assigned before the event day)
  earlyPositions: [
    'Event Chair',
    'Course Designer',
    'Driver TO SITE',
    'Driver Help TO SITE',
    'Course Setup 1',
    'Course Setup 2',
    'Course Setup 3',
    'Course Setup 4',
    'Course Setup 5',
    'Course Setup 6',
    'Trailer Lead Setup',
    'Trailer Setup Support',
    'SSS 1',
    'SSS 2',
    'SSS 3',
    'Tech 1',
    'Tech 2',
    'Tech 3',
    'Tech 4',
    'Reg. & Check in 1',
    'Reg. & Check in 2',
    'Waiver Lead - Early 1',
    'Waiver - Early 2',
    'Waiver - Early 3',
    'Paddock Marshal Early 1',
    'Paddock Marshal Early 2',
    'Paddock Marshal Late',
    'Novice Coach 1',
    'Novice Coach 2',
    'Novice Coach 3',
    'Worker Chief',
    'Chalk Liner 1',
    'Chalk Liner 2',
    'Novice Ambassador',
    'Lunch Waiver',
    'Late Waiver 1',
    'Late Waiver 2',
    'Other 1',
    'Other 2',
    'Other 3',
    'Driver TO STORAGE',
    'Driver Help TO STORAGE',
  ],

  // CSV column mapping
  csvColumns: ['Competitor', 'Class', 'PAX', '#', 'SCCA Member'],

  // Output spreadsheet columns
  outputColumns: [
    'Competitor',
    'Class / PAX / #',
    'Running',
    'Working',
    'Position',
    'Checkin',
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
};
