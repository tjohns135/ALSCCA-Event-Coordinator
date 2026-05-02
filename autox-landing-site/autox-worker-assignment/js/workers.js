/**
 * Worker assignment logic
 * Assigns worker positions based on experience tiers:
 *   1. Essential (Timing, Safety Steward) — most experienced, session-specific
 *   2. Experienced (Starter, Spotter, Grid, Corner Captains) — most experienced
 *   3. Corner Workers — most experienced first, round-robin across corners
 *
 * Manual/early assignments are excluded from the algorithm pool.
 */

const Workers = {
  /**
   * Auto-assign worker positions to entrants who don't already have one.
   * Entrants with positions already set (manual assignments) are skipped.
   * @param {Array} entrants - array of entrant objects (already have running/working set)
   * @param {number} cornerCount - number of corners (default from config)
   */
  assign(entrants, cornerCount) {
    cornerCount = cornerCount || CONFIG.workerPositions.corner.defaultCornerCount;

    // Build sorting pool: only work session entrants without a position
    const work1st = entrants.filter((e) => e.working === 'Work 1st' && !e.positions.length);
    const work2nd = entrants.filter((e) => e.working === 'Work 2nd' && !e.positions.length);

    // Phase 1: Essential positions (most experienced wins)
    for (const pos of CONFIG.workerPositions.essential) {
      const pool = pos.session === 1 ? work1st : work2nd;
      const best = this._findMostExperienced(pool, pos.name);
      if (best) {
        best.positions = [pos.name];
      }
    }

    // Phase 2: Experienced positions (most experienced wins)
    for (const pos of CONFIG.workerPositions.experienced) {
      const pool = pos.session === 1 ? work1st : work2nd;
      const best = this._findMostExperienced(pool, pos.name);
      if (best) {
        best.positions = [pos.name];
      }
    }

    // Phase 3: Corner Captains (most experienced wins)
    for (const pool of [work1st, work2nd]) {
      for (let c = 1; c <= cornerCount; c++) {
        const best = this._findMostExperienced(pool, 'Captain');
        if (best) {
          best.positions = [`Corner ${c} Captain`];
        }
      }
    }

    // Phase 4: Corner Workers — most experienced first, round-robin, no cap
    for (const pool of [work1st, work2nd]) {
      const remaining = pool.filter((e) => !e.positions.length);

      // Sort by most experienced first: event count desc, then alphabetical
      remaining.sort((a, b) => {
        const aEvents = Memory.getEventCount(a.competitor);
        const bEvents = Memory.getEventCount(b.competitor);
        if (aEvents !== bEvents) return bEvents - aEvents;
        return a.competitor.localeCompare(b.competitor);
      });

      // Round-robin across corners until pool is empty
      for (let i = 0; i < remaining.length; i++) {
        const corner = (i % cornerCount) + 1;
        remaining[i].positions = [`Corner ${corner} Worker`];
      }
    }
  },

  /**
   * Find the most experienced unassigned candidate for a position.
   * Excludes novices (class N) from specialized/captain positions.
   * Ranks by: position-specific experience → total events → alphabetical.
   */
  _findMostExperienced(pool, positionName) {
    const eligible = pool.filter((e) => !e.positions.length && e.class !== 'N');
    if (eligible.length === 0) return null;

    eligible.sort((a, b) => {
      const aCount = Memory.getPositionCount(a.competitor, positionName);
      const bCount = Memory.getPositionCount(b.competitor, positionName);
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
      if (!e.positions.length) {
        summary.unassigned.push(e);
        continue;
      }

      if (e.working === 'Early' || e.working === 'Lunch') {
        summary.early.push(e);
        continue;
      }

      const session = e.working === 'Work 1st' ? summary.work1st : summary.work2nd;

      for (const pos of e.positions) {
        if (pos.startsWith('Corner')) {
          const match = pos.match(/Corner (\d+)/);
          if (match) {
            const corner = match[1];
            if (!session.corners[corner]) session.corners[corner] = [];
            session.corners[corner].push(e);
          }
        } else {
          session.specialized[pos] = e;
        }
      }
    }

    return summary;
  },
};
