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

## Work Phases

- **Early Workers** — assigned before the event starts (setup, tech, waivers, coaching, leadership). These are all manually assigned.
- **Session Workers (Manual)** — manually assigned to specific work sessions (Timing, Safety Steward, Announcer, Sound).
- **Work Session Workers (Algorithm)** — assigned by the algorithm into run groups. Work 1st = Run Group 2, Work 2nd = Run Group 1.

---

# Early Worker Positions (all Manual)

These are all assigned before the event. Not part of the algorithm's sorting pool.

## Event Leadership

| Position |
|---|
| Event Chair |
| Event Chair Shadow |
| Course Designer |

## Tech

| Position |
|---|
| Tech 1 |
| Tech 2 |
| Tech 3 |

## Waivers

| Position |
|---|
| Waiver |
| Early Waiver 1 |
| Early Waiver 2 |
| Early Waiver 3 |
| Late Waiver 1 |
| Lunch Waiver |

## Coaching & Outreach

| Position |
|---|
| Novice Coach 1 |
| Novice Coach 2 |
| Novice Coach 3 |
| Intermediate Coach |
| Worker Chief |

## Setup & Teardown

| Position |
|---|
| Course Setup 1 |
| Course Setup 2 |
| Course Setup 3 |
| Course Setup 4 |
| Course Setup 5 |
| Course Setup 6 |
| Trailer Setup Support |
| Truck & Trailer To Site Driver |
| Truck & Trailer To Storage Driver |
| Truck & Trailer To Storage Helper |

## Paddock Marshal

| Position |
|---|
| Paddock Marshal |
| Paddock Marshal Early |
| Paddock Marshal Late |

---

# Session Worker Positions (Manual, session-based)

These are manually assigned to specific work sessions. Not early workers, not algorithm-assigned.

## Timing & Safety

| Position | Session |
|---|---|
| Timing 1 | Work 1st |
| Timing 2 | Work 2nd |
| Safety Steward 1 | Work 1st |
| Safety Steward 2 | Work 2nd |

## Announcer & Sound

| Position | Session |
|---|---|
| Announcer 1 | Work 1st |
| Announcer 2 | Work 2nd |
| Sound 1 | Work 1st |
| Sound 2 | Work 2nd |

---

# Work Session Positions (Algorithm-Assigned)

These positions are filled by the algorithm and assigned into run groups.

## Starter & Spotter (Experienced)

Experienced workers required. One per work session.

| Position | Assignment | Per Run Group |
|---|---|---|
| Starter 1 | Experienced | 1 |
| Starter 2 | Experienced | 1 |
| Spotter 1 | Experienced | 1 |
| Spotter 2 | Experienced | 1 |

## Grid (Experienced)

| Position | Assignment | Per Run Group |
|---|---|---|
| Grid 1 | Experienced | 1 |
| Grid 2 | Experienced | 1 |

## Corner Workers

Each run group needs corner captains (experienced) and corner workers (most experienced first). Default: 4 corners.

| Position | Assignment | Per Run Group |
|---|---|---|
| Corner 1 Captain | Experienced | 1 |
| Corner 1 Worker | Most Experienced First | 4 |
| Corner 2 Captain | Experienced | 1 |
| Corner 2 Worker | Most Experienced First | 4 |
| Corner 3 Captain | Experienced | 1 |
| Corner 3 Worker | Most Experienced First | 4 |
| Corner 4 Captain | Experienced | 1 |
| Corner 4 Worker | Most Experienced First | 4 |

---

# Shadow Positions (Manual, optional)

These are filled manually by the organizer only when necessary at the event. Not part of the algorithm.

| Position | Session |
|---|---|
| Timing Shadow 1 | Work 1st |
| Timing Shadow 2 | Work 2nd |
| Safety Steward Shadow 1 | Work 1st |
| Safety Steward Shadow 2 | Work 2nd |

---

# Excluded

| Position | Reason |
|---|---|
| Money Bags | Not a real work position (seen in memory_2025-8.json and memory_2025-9.json, both Lane Downs) |
| Other | Generic placeholder, excluded from assignment |
| Other 1 | Generic placeholder, excluded from assignment |
