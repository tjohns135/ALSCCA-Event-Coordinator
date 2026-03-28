/**
 * Run group splitting logic
 *
 * Rules:
 * 1. All PAX within a class stay in the same run group
 * 2. Novices: "follow" mode = follow their PAX class; "separate" mode = own class
 * 3. Ladies: "follow" mode = follow their PAX class; "separate" mode = own class
 */

const Groups = {
  /**
   * Split entrants into run groups.
   * @param {Array} entrants
   * @param {Object} classAssignments - class → group (1 or 2)
   * @param {Object} [options] - { noviceMode, ladiesMode }
   */
  split(entrants, classAssignments, options) {
    const opts = options || {};
    const assignments = classAssignments || this.autoAssign(entrants, opts).assignments;

    for (const entrant of entrants) {
      const group = this._getGroup(entrant, assignments, opts);
      if (group === 1) {
        entrant.running = 'Run 1st';
        entrant.working = 'Work 2nd';
      } else {
        entrant.running = 'Run 2nd';
        entrant.working = 'Work 1st';
      }
    }

    return {
      group1: entrants.filter((e) => this._getGroup(e, assignments, opts) === 1),
      group2: entrants.filter((e) => this._getGroup(e, assignments, opts) === 2),
      assignments,
    };
  },

  /**
   * Determine which group an entrant belongs to.
   */
  _getGroup(entrant, assignments, options) {
    const opts = options || {};
    const cls = entrant.class;

    // Ladies handling
    if (cls === 'L') {
      if (opts.ladiesMode === 'separate') {
        // Own class — use the L assignment
        return assignments['L'] !== undefined ? assignments['L'] : 1;
      }
      // Follow PAX class — find class for their PAX
      const paxClass = this._getPaxParentClass(entrant.pax);
      if (paxClass && assignments[paxClass] !== undefined) return assignments[paxClass];
      return assignments['L'] !== undefined ? assignments['L'] : 1;
    }

    // Novice handling
    if (cls === 'N') {
      if (opts.noviceMode === 'separate') {
        // Own class — use the N assignment
        return assignments['N'] !== undefined ? assignments['N'] : 1;
      }
      // Follow PAX class
      return this._getNoviceGroupNum(entrant.pax, assignments);
    }

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
   * Find the parent class for a PAX code.
   */
  _getPaxParentClass(pax) {
    const cls = CONFIG.getClassForPax(pax);
    if (cls) return cls;
    if (['CAMS', 'CAMC', 'CAMT'].includes(pax)) return 'CAM';
    if (['XA', 'XB'].includes(pax)) return 'XS';
    if (['SST', 'AST', 'BST', 'CST', 'DST', 'EST', 'GST'].includes(pax)) return 'ST';
    return null;
  },

  /**
   * Auto-assign classes to run groups trying all combinations for best balance.
   * @param {Array} entrants
   * @param {Object} [options] - { locked, maxGroupDiff, noviceMode, ladiesMode }
   * @returns {{ assignments, bestDiff, validCount, totalCombos }}
   */
  autoAssign(entrants, options) {
    const opts = options || {};
    const locked = opts.locked || {};
    const maxGroupDiff = opts.maxGroupDiff !== undefined ? opts.maxGroupDiff : Infinity;
    const noviceMode = opts.noviceMode || 'follow';
    const ladiesMode = opts.ladiesMode || 'follow';

    const assignable = this._getActiveClasses(entrants, noviceMode, ladiesMode);
    const classTotals = {};
    for (const cls of assignable) {
      classTotals[cls] = this._countClassTotal(entrants, cls, noviceMode, ladiesMode);
    }

    // Separate locked vs unlocked classes
    const unlocked = assignable.filter((cls) => locked[cls] === undefined);
    const n = unlocked.length;

    // Pre-calculate locked class contributions
    let lockedG1 = 0, lockedG2 = 0;

    // Ladies in follow mode: count under their PAX class (already included)
    // Ladies in separate mode: counted as class 'L' in assignable
    // Ladies NOT in assignable and ladiesMode=follow: count them under PAX classes
    if (ladiesMode === 'follow') {
      // Ladies are counted under their PAX parent classes in _countClassTotal
      // Nothing extra needed
    }

    for (const [cls, group] of Object.entries(locked)) {
      if (!classTotals[cls]) continue;
      if (group === 1) lockedG1 += classTotals[cls];
      else lockedG2 += classTotals[cls];
    }

    // Count entrants not covered by any assignable class
    // (ladies in follow mode who don't map to any class)
    if (ladiesMode === 'follow') {
      const ladiesEntrants = entrants.filter((e) => e.class === 'L');
      for (const e of ladiesEntrants) {
        const paxClass = this._getPaxParentClass(e.pax);
        if (!paxClass || !assignable.includes(paxClass)) {
          // Unmapped lady — default to group 1
          lockedG1++;
        }
      }
    }

    let bestAssignment = {};
    let bestDiff = Infinity;
    let validCount = 0;
    const allValid = [];

    const totalCombos = 1 << n;
    for (let mask = 0; mask < totalCombos; mask++) {
      let g1 = lockedG1;
      let g2 = lockedG2;
      const assignment = {};

      // Apply locked assignments
      for (const [cls, group] of Object.entries(locked)) {
        assignment[cls] = group;
      }

      // Apply unlocked permutation
      for (let i = 0; i < n; i++) {
        const cls = unlocked[i];
        if (mask & (1 << i)) {
          assignment[cls] = 1;
          g1 += classTotals[cls];
        } else {
          assignment[cls] = 2;
          g2 += classTotals[cls];
        }
      }

      const diff = Math.abs(g1 - g2);
      if (diff <= maxGroupDiff) {
        validCount++;
        allValid.push({ assignment: { ...assignment }, diff });
      }
      if (diff < bestDiff) {
        bestDiff = diff;
        bestAssignment = { ...assignment };
      }
    }

    // Sort valid combos: smallest diff first
    allValid.sort((a, b) => a.diff - b.diff);

    return {
      assignments: bestAssignment,
      bestDiff,
      validCount,
      totalCombos,
      allValid,
    };
  },

  /**
   * Get active classes that have entrants.
   */
  _getActiveClasses(entrants, noviceMode, ladiesMode) {
    const assignable = CONFIG.getAssignableClasses();

    // Add N as assignable if separate mode
    if (noviceMode === 'separate' && !assignable.includes('N')) {
      assignable.push('N');
    }

    // Add L as assignable if separate mode
    if (ladiesMode === 'separate' && !assignable.includes('L')) {
      assignable.push('L');
    }

    for (const e of entrants) {
      if (e.class !== 'N' && e.class !== 'L' && !assignable.includes(e.class)) {
        assignable.push(e.class);
      }
    }

    return assignable.filter((cls) => this._countClassTotal(entrants, cls, noviceMode, ladiesMode) > 0);
  },

  /**
   * Count total entrants for a class (including novices/ladies in follow mode).
   */
  _countClassTotal(entrants, cls, noviceMode, ladiesMode) {
    let count = entrants.filter((e) => e.class === cls).length;

    // In novice follow mode, count novices under their PAX parent class
    if (noviceMode !== 'separate' && cls !== 'N') {
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
    }

    // In novice separate mode, N class is just the direct count (already handled above)

    // In ladies follow mode, count ladies under their PAX parent class
    if (ladiesMode !== 'separate' && cls !== 'L') {
      if (CONFIG.classes[cls]) {
        count += entrants.filter(
          (e) => e.class === 'L' && CONFIG.classes[cls].pax.includes(e.pax)
        ).length;
      }
      if (cls === 'CAM') {
        count += entrants.filter(
          (e) => e.class === 'L' && ['CAMS', 'CAMC', 'CAMT'].includes(e.pax)
        ).length;
      }
      if (cls === 'ST') {
        count += entrants.filter(
          (e) => e.class === 'L' && ['SST', 'AST', 'BST', 'CST', 'DST', 'EST', 'GST'].includes(e.pax)
        ).length;
      }
      if (cls === 'XS') {
        count += entrants.filter(
          (e) => e.class === 'L' && ['XA', 'XB'].includes(e.pax)
        ).length;
      }
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
   */
  buildGroupHeader(assignments, groupNum, hasLadies, entrants, options) {
    const opts = options || {};
    const parts = [];
    const activePax = new Set();
    if (entrants) {
      for (const e of entrants) activePax.add(e.pax);
    }

    // Show Ladies in header if they're their own class and assigned to this group
    if (hasLadies && opts.ladiesMode === 'separate' && assignments['L'] === groupNum) {
      parts.push('Ladies');
    }

    // Show Novice in header if they're their own class
    if (opts.noviceMode === 'separate' && assignments['N'] === groupNum) {
      parts.push('Novice');
    }

    for (const [cls, group] of Object.entries(assignments)) {
      if (group !== groupNum) continue;
      if (cls === 'L' || cls === 'N') continue; // handled above

      if (cls === 'X') {
        if (!entrants || entrants.some((e) => e.class === 'X')) {
          parts.push('Pro');
        }
      } else if (cls === 'R') {
        if (!entrants || entrants.some((e) => e.class === 'R')) {
          parts.push('Race Tire');
        }
      } else if (CONFIG.classes[cls]) {
        const info = CONFIG.classes[cls];
        const activePaxInClass = entrants
          ? info.pax.filter((p) => activePax.has(p))
          : info.pax;

        if (activePaxInClass.length === 0) continue;

        if (cls === 'XS') {
          parts.push('Xtreme Street');
        } else {
          parts.push(`(${cls}: ${activePaxInClass.join(', ')})`);
        }
      }
    }

    return { classes: parts.join(', ') };
  },

  /**
   * Compute accurate group counts using per-entrant mapping.
   * This is the source of truth — matches what split() actually does.
   */
  computeGroupCounts(entrants, assignment, options) {
    let g1 = 0, g2 = 0;
    for (const e of entrants) {
      if (this._getGroup(e, assignment, options) === 1) g1++;
      else g2++;
    }
    return { g1, g2, diff: Math.abs(g1 - g2) };
  },
};
