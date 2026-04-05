# Worker Positions

All worker positions observed across 10 ALSCCA events (2025-1 through 2026-1), plus positions defined in config.js.

## Assignment Types

- **Manual (Early)** — assigned by the organizer before the algorithm runs; not in the algorithm's sorting pool. Workers marked as "Early".
- **Manual (Session)** — assigned by the organizer to specific work sessions (Work 1st / Work 2nd); not in the algorithm's sorting pool.
- **Manual (Shadow)** — optional positions filled manually at the event when needed; not in the algorithm's sorting pool.
- **Experienced** — requires experienced workers; algorithm assigns one per run group per session.
- **Most Experienced First** — filled by the algorithm, prioritizing workers with more event history.

## Algorithm Rules

- The algorithm **never assigns duplicates** within its sorting pool. A person gets exactly one position.
- **Manually assigned workers are excluded** from the algorithm's sorting pool entirely. They can hold a manual position alongside being in a run group without conflict.
- **Novices (class N) are excluded** from all specialized/captain positions and can only be assigned as corner workers.

## Work Phases

- **Early Workers** — assigned before the event starts (setup, tech, waivers, coaching, leadership). These are all manually assigned.
- **Session Workers (Manual)** — manually assigned to specific work sessions (Timing, Safety Steward, Announcer, Sound).
- **Work Session Workers (Algorithm)** — assigned by the algorithm into run groups. Work 1st = Run Group 2, Work 2nd = Run Group 1.

---

# Early Worker Positions (all Manual)

These are all assigned before the event. Not part of the algorithm's sorting pool.

## Event Leadership

- Event Chair
- Event Chair Shadow
- Course Designer

## Tech

- Tech 1
- Tech 2
- Tech 3

## Waivers

- Waiver
- Early Waiver 1
- Early Waiver 2
- Early Waiver 3
- Late Waiver 1
- Lunch Waiver

## Coaching & Outreach

- Novice Coach 1
- Novice Coach 2
- Novice Coach 3
- Intermediate Coach
- Worker Chief

## Setup & Teardown

- Course Setup 1
- Course Setup 2
- Course Setup 3
- Course Setup 4
- Course Setup 5
- Course Setup 6
- Trailer Setup Support
- Truck & Trailer To Site Driver
- Truck & Trailer To Storage Driver
- Truck & Trailer To Storage Helper

## Paddock Marshal

- Paddock Marshal
- Paddock Marshal Early
- Paddock Marshal Late

---

# Session Worker Positions (Manual, session-based)

These are manually assigned to specific work sessions. Not early workers, not algorithm-assigned.

## Timing & Safety

- Timing 1 (Work 1st)
- Timing 2 (Work 2nd)
- Safety Steward 1 (Work 1st)
- Safety Steward 2 (Work 2nd)

## Announcer & Sound

- Announcer 1 (Work 1st)
- Announcer 2 (Work 2nd)
- Sound 1 (Work 1st)
- Sound 2 (Work 2nd)

---

# Work Session Positions (Algorithm-Assigned)

These positions are filled by the algorithm and assigned into run groups.

## Starter & Spotter (Experienced)

Experienced workers required. One per work session.

- Starter 1
- Starter 2
- Spotter 1
- Spotter 2

## Grid (Experienced)

- Grid 1
- Grid 2

## Corner Workers

Each run group needs corner captains (experienced) and corner workers (most experienced first). Default: 4 corners.

- Corner 1 Captain (Experienced) + Corner 1 Workers (4, Most Experienced First)
- Corner 2 Captain (Experienced) + Corner 2 Workers (4, Most Experienced First)
- Corner 3 Captain (Experienced) + Corner 3 Workers (4, Most Experienced First)
- Corner 4 Captain (Experienced) + Corner 4 Workers (4, Most Experienced First)

---

# Shadow Positions (Manual, optional)

Filled manually by the organizer only when necessary at the event. Not part of the algorithm.

- Timing Shadow 1 (Work 1st)
- Timing Shadow 2 (Work 2nd)
- Safety Steward Shadow 1 (Work 1st)
- Safety Steward Shadow 2 (Work 2nd)

---

## Participant Memory

The memory system tracks each participant's history across events, stored as a JSON file that is loaded at the start of each event and saved at the end.

### What memory stores per participant

- **Name** — case-insensitive key for matching across events
- **Event list** — each event records: date, event name, position worked, class, PAX
- **Positions list** — unique positions this person has ever worked
- **Captain capable** — flagged true if they've ever been a Corner Captain

### How memory affects assignments

**Algorithm ranking** — for each position, candidates are sorted by:
1. Position-specific experience count (how many times they've worked this position or a related one)
2. Total event count (lifetime events attended)
3. Alphabetical (tiebreaker)

**Auto-fill manual positions** — when auto-filling early/session positions, entrants are grouped into:
- **Eligible** — has worked this specific position before
- **Experienced** — 5+ lifetime events but no history for this position
- **Inexperienced** — fewer than 5 lifetime events (skipped by auto-fill)

These same groups appear in the manual position dropdowns.

### Position matching

Memory uses flexible matching so renamed or numbered positions still count:
- **Numbered variants** — "Timing 1" and "Timing 2" both match a query for either
- **Aliases** — historical names map to current names (e.g., "SSS" counts as "Safety Steward")
- **Eligibility groups** — related positions cross-match (e.g., "Waiver" experience counts for "Early Waiver", "Late Waiver", and "Lunch Waiver"; all Tech positions share eligibility; all Paddock Marshal variants share eligibility)

### Memory workflow

1. **Load** — upload the JSON file saved from the previous event at the start of the new event
2. **Use** — memory informs all manual and algorithm-based assignments throughout the event
3. **Save** — after all positions are assigned, download the updated memory file (named `alscca_memory_YYYY-MM-DD.json`). The current event's data is appended to each participant's history.
4. **Cache** — memory is also cached in localStorage so it persists between page refreshes during the same session