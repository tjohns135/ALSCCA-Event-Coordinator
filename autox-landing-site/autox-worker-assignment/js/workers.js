/**
 * Worker assignment logic
 * Assigns worker positions based on experience, history, and fairness
 */

const Workers = {
  /**
   * Auto-assign worker positions to entrants who don't already have one.
   * @param {Array} entrants - array of entrant objects (already have running/working set)
   * @param {number} cornerCount - number of corners (default 4)
   */
  assign(entrants, cornerCount) {
    cornerCount = cornerCount || CONFIG.workerPositions.corner.defaultCornerCount;

    // Separate by work session
    const work1st = entrants.filter((e) => e.working === 'Work 1st' && !e.position);
    const work2nd = entrants.filter((e) => e.working === 'Work 2nd' && !e.position);

    // Assign specialized positions first, then fill corners
    this._assignSession(work1st, cornerCount);
    this._assignSession(work2nd, cornerCount);
  },

  /**
   * Assign positions for a single work session
   */
  _assignSession(workers, cornerCount) {
    if (workers.length === 0) return;

    const unassigned = [...workers];
    const specialized = [...CONFIG.workerPositions.specialized];

    // Assign specialized positions to experienced workers
    for (const position of specialized) {
      if (unassigned.length === 0) break;

      const best = this._findBestForPosition(unassigned, position);
      if (best) {
        best.position = position;
        unassigned.splice(unassigned.indexOf(best), 1);
      }
    }

    // Assign corner captains
    for (let c = 1; c <= cornerCount; c++) {
      if (unassigned.length === 0) break;
      const captain = this._findBestForPosition(unassigned, 'Captain');
      if (captain) {
        captain.position = `Corner ${c} Captain`;
        unassigned.splice(unassigned.indexOf(captain), 1);
      }
    }

    // Remaining workers go to corners, distributed evenly
    let cornerIdx = 0;
    for (const worker of unassigned) {
      const corner = (cornerIdx % cornerCount) + 1;
      worker.position = `Corner ${corner} Worker`;
      cornerIdx++;
    }
  },

  /**
   * Find the best candidate for a specialized position.
   * Prefers workers with experience in that position.
   * Falls back to most experienced worker overall.
   * Novices only get corner worker positions.
   */
  _findBestForPosition(candidates, position) {
    // For specialized positions, skip novices
    const eligible = position === 'Captain'
      ? candidates.filter((c) => c.class !== 'N')
      : candidates.filter((c) => c.class !== 'N');

    if (eligible.length === 0) return null;

    // Sort by: has done this position before > most events > alphabetical
    eligible.sort((a, b) => {
      const aCount = Memory.getPositionCount(a.competitor, position);
      const bCount = Memory.getPositionCount(b.competitor, position);
      if (aCount !== bCount) return bCount - aCount;

      const aEvents = Memory.getEventCount(a.competitor);
      const bEvents = Memory.getEventCount(b.competitor);
      if (aEvents !== bEvents) return bEvents - aEvents;

      return a.competitor.localeCompare(b.competitor);
    });

    return eligible[0];
  },

  /**
   * Get summary of assignments for display
   */
  getSummary(entrants) {
    const summary = {
      work1st: { specialized: {}, corners: {} },
      work2nd: { specialized: {}, corners: {} },
      early: [],
      unassigned: [],
    };

    for (const e of entrants) {
      if (!e.position) {
        summary.unassigned.push(e);
        continue;
      }

      if (e.working === 'Early' || e.working === 'Lunch') {
        summary.early.push(e);
        continue;
      }

      const session = e.working === 'Work 1st' ? summary.work1st : summary.work2nd;

      if (e.position.startsWith('Corner')) {
        const match = e.position.match(/Corner (\d+)/);
        if (match) {
          const corner = match[1];
          if (!session.corners[corner]) session.corners[corner] = [];
          session.corners[corner].push(e);
        }
      } else {
        session.specialized[e.position] = e;
      }
    }

    return summary;
  },
};
