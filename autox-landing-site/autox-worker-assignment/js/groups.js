/**
 * Run group splitting logic
 *
 * Rules:
 * 1. All PAX within a class stay in the same run group
 * 2. Novices follow their PAX class's run group
 * 3. Ladies always Run 1st (when present)
 */

const Groups = {
  /**
   * Split entrants into run groups.
   */
  split(entrants, classAssignments) {
    const assignments = classAssignments || this.autoAssign(entrants);

    for (const entrant of entrants) {
      const group = this._getGroup(entrant, assignments);
      if (group === 1) {
        entrant.running = 'Run 1st';
        entrant.working = 'Work 2nd';
      } else {
        entrant.running = 'Run 2nd';
        entrant.working = 'Work 1st';
      }
    }

    return {
      group1: entrants.filter((e) => this._getGroup(e, assignments) === 1),
      group2: entrants.filter((e) => this._getGroup(e, assignments) === 2),
      assignments,
    };
  },

  _getGroup(entrant, assignments) {
    const cls = entrant.class;
    if (cls === 'L') return 1;
    if (cls === 'N') return this._getNoviceGroupNum(entrant.pax, assignments);
    if (assignments[cls] !== undefined) return assignments[cls];
    return 1;
  },

  _getNoviceGroupNum(pax, assignments) {
    const cls = CONFIG.getClassForPax(pax);
    if (cls && assignments[cls]) return assignments[cls];
    if (['CAMS', 'CAMC', 'CAMT'].includes(pax)) return assignments['CAM'] || 1;
    if (['XA', 'XB'].includes(pax)) return assignments['XS'] || 1;
    if (['SST', 'AST', 'BST', 'CST', 'DST', 'EST', 'GST'].includes(pax)) return assignments['ST'] || 1;
    return 1;
  },

  /**
   * Auto-assign classes to run groups trying all combinations for best balance.
   */
  autoAssign(entrants) {
    const assignable = this._getActiveClasses(entrants);
    const classTotals = {};
    for (const cls of assignable) {
      classTotals[cls] = this._countClassTotal(entrants, cls);
    }

    const ladiesCount = entrants.filter((e) => e.class === 'L').length;
    const n = assignable.length;
    let bestAssignment = {};
    let bestDiff = Infinity;

    const totalCombos = 1 << n;
    for (let mask = 0; mask < totalCombos; mask++) {
      let g1 = ladiesCount;
      let g2 = 0;
      const assignment = {};

      for (let i = 0; i < n; i++) {
        const cls = assignable[i];
        if (mask & (1 << i)) {
          assignment[cls] = 1;
          g1 += classTotals[cls];
        } else {
          assignment[cls] = 2;
          g2 += classTotals[cls];
        }
      }

      const diff = Math.abs(g1 - g2);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestAssignment = { ...assignment };
      }
    }

    return bestAssignment;
  },

  _getActiveClasses(entrants) {
    const assignable = CONFIG.getAssignableClasses();
    for (const e of entrants) {
      if (e.class !== 'N' && e.class !== 'L' && !assignable.includes(e.class)) {
        assignable.push(e.class);
      }
    }
    return assignable.filter((cls) => this._countClassTotal(entrants, cls) > 0);
  },

  _countClassTotal(entrants, cls) {
    let count = entrants.filter((e) => e.class === cls).length;
    if (CONFIG.classes[cls]) {
      count += entrants.filter(
        (e) => e.class === 'N' && CONFIG.classes[cls].pax.includes(e.pax)
      ).length;
    }
    if (cls === 'CAM') {
      count += entrants.filter(
        (e) => e.class === 'N' && ['CAMS', 'CAMC', 'CAMT'].includes(e.pax)
      ).length;
    }
    if (cls === 'ST') {
      count += entrants.filter(
        (e) => e.class === 'N' && ['SST', 'AST', 'BST', 'CST', 'DST', 'EST', 'GST'].includes(e.pax)
      ).length;
    }
    if (cls === 'XS') {
      count += entrants.filter(
        (e) => e.class === 'N' && ['XA', 'XB'].includes(e.pax)
      ).length;
    }
    return count;
  },

  _getNoviceClass(pax) {
    const cls = CONFIG.getClassForPax(pax);
    if (cls) return cls;
    if (['CAMS', 'CAMC', 'CAMT'].includes(pax)) return 'CAM';
    if (['XA', 'XB'].includes(pax)) return 'XS';
    if (['SST', 'AST', 'BST', 'CST', 'DST', 'EST', 'GST'].includes(pax)) return 'ST';
    return null;
  },

  /**
   * Build group header text showing only PAX codes that have actual entrants.
   * @param {Object} assignments - class-to-group mapping
   * @param {number} groupNum - 1 or 2
   * @param {boolean} hasLadies - whether ladies class exists
   * @param {Array} entrants - the entrant list (to filter to active PAX only)
   */
  buildGroupHeader(assignments, groupNum, hasLadies, entrants) {
    const parts = [];

    // Collect all PAX codes present in the entrant data
    const activePax = new Set();
    if (entrants) {
      for (const e of entrants) {
        activePax.add(e.pax);
      }
    }

    if (groupNum === 1 && hasLadies) {
      parts.push('Ladies');
    }

    for (const [cls, group] of Object.entries(assignments)) {
      if (group !== groupNum) continue;

      if (cls === 'X') {
        // Only show Pro if there are X-class entrants
        if (!entrants || entrants.some((e) => e.class === 'X')) {
          parts.push('Pro');
        }
      } else if (cls === 'R') {
        if (!entrants || entrants.some((e) => e.class === 'R')) {
          parts.push('Race Tire');
        }
      } else if (CONFIG.classes[cls]) {
        const info = CONFIG.classes[cls];
        // Filter to only PAX codes with entrants
        const activePaxInClass = entrants
          ? info.pax.filter((p) => activePax.has(p))
          : info.pax;

        if (activePaxInClass.length === 0) continue;

        if (cls === 'XS') {
          parts.push('Xtreme Street');
        } else {
          parts.push(`(${cls}: ${activePaxInClass.join(', ')})`);
        }

        // No novice PAX listing in headers
      }
    }

    return {
      classes: parts.join(', '),
    };
  },
};
