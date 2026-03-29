# ALSCCA Event Coordinator

Digital tools to improve the process of creating and hosting AutoX events for the ALSCCA.

Live at [cone.ninja](https://cone.ninja/)

The project has 2 tools:
1. **Track Designer** -- Create unique autocross courses on the Barber Proving Grounds layout
2. **Worker Assignment Tool** -- Split run groups and assign worker positions for autocross events

---

## Track Designer

Design autocross courses on the Barber Proving Grounds lot map. Place cones, markers, and corner numbers on an interactive SVG canvas, then export the layout as a PNG or JSON.

### Tools

| Tool | Shortcut | Description |
|---|---|---|
| Select | S | Click to select elements, drag to reposition |
| Standard Cone | C | Basic course-marking cone |
| Pointer Cone | — | Cone with a directional arrow (rotatable) |
| Guide Cone | — | Directional guide marker (rotatable) |
| Car | — | Vehicle position and heading indicator (max 1) |
| Corner # | — | Numbered corner marker, 1–6 |
| Start | 1 | Start line — 2 cones connected by a green line |
| Timing Start | 2 | Timing start — 2 rows of 2 cones with a yellow timing line |
| Finish | 3 | Finish line — 2 rows of 5 cones with a red finish line |
| Eraser | E | Click any element to delete it |

### Controls

- **Pan** — drag empty space with the Select tool
- **Zoom** — scroll wheel
- **Rotate** — select a pointer/guide cone or marker, then drag its rotation handle
- **Delete** — right-click a cone, or use the Eraser tool
- **Esc** — deselect all

### Export & Save

- **Export PNG** — renders the course as an image
- **Save JSON / Load JSON** — back up and restore course files
- Courses auto-save to browser localStorage

---

## Worker Assignment Tool

Upload an entry list CSV, balance run groups, assign manual and algorithm-based worker positions, and generate PDFs for event day.

### Workflow

1. **Load entry list** (CSV from MotorsportReg or manual format)
2. **Load memory** (JSON with participant history -- used for experience-based assignments)
3. **Balance run groups** -- cycles through valid class-to-group combinations within a configurable max difference threshold
4. **Assign manual positions** -- Event Chair, Tech, Waivers, Coaching, Setup, etc.
5. **Assign Workers** -- algorithm fills Timing, Safety Steward, Starter, Spotter, Grid, Corner Captains, and Corner Workers
6. **Generate PDFs** -- Worker Assignments check-in sheet and Groups Page position grid

### Rules for Splitting Run Groups

1. All entries in a specific PAX stay in the same run group
2. Novices are in the same run group as other entries with the same PAX (follow mode) or treated as their own class (separate mode)
3. Ladies follow their PAX class (follow mode) or are treated as their own class (separate mode)
4. Classes can be locked to a specific run group during balancing
5. Balance algorithm uses brute-force 2^n bitmask over unlocked classes, filtered by a max group difference threshold
6. Each press of "Balance Run Groups" cycles to the next valid combination

### Worker Assignment Algorithm

The algorithm assigns positions in 4 phases. Workers are ranked by position-specific experience, then total event count, then alphabetically.

| Phase | Positions | Selection |
|---|---|---|
| 1 -- Essential | Timing 1/2, Safety Steward 1/2 | Most experienced for this position |
| 2 -- Experienced | Starter 1/2, Spotter 1/2, Grid 1/2 | Most experienced for this position |
| 3 -- Corner Captains | 1 per corner per run group | Most experienced remaining |
| 4 -- Corner Workers | All remaining entrants | Round-robin across corners |

- Manual positions (Early Workers) are excluded from the algorithm pool
- No duplicate assignments -- each person gets exactly one algorithm position
- Novices are excluded from non-corner positions
- Experience threshold: 5+ events = experienced

### Manual Positions (Early Workers)

Assigned by the organizer before the algorithm runs. Grouped by category:

| Category | Positions |
|---|---|
| Event Leadership | Event Chair, Event Chair Shadow, Course Designer |
| Tech | Tech 1, Tech 2, Tech 3 |
| Waivers | Waiver, Early Waiver 1-3, Late Waiver 1, Lunch Waiver |
| Coaching & Outreach | Novice Coach 1-3, Intermediate Coach, Worker Chief |
| Setup & Teardown | Course Setup 1-6, Trailer Setup Support, Truck & Trailer drivers/helpers |
| Paddock Marshal | Paddock Marshal, Paddock Marshal Early, Paddock Marshal Late |
| Announcer & Sound | Announcer, Sound |
| Shadow Positions | Timing Shadow 1/2, Safety Steward Shadow 1/2 (optional) |

### Participant Memory

The memory system tracks participant history across events:
- **Event count** -- total number of events attended
- **Position history** -- which positions a person has worked
- **Captain capable** -- flagged if they've been a Corner Captain before

Memory is stored as JSON and persists in localStorage between sessions. Can be exported/imported as files.

Historical position names are aliased for backward compatibility (e.g., "SSS" maps to "Safety Steward").

### CSV Formats

Two formats are supported:

**MotorsportReg format:**
```
"Event Name","Full Name (First/Last)","Class","Modifier/PAX","No.","Vehicle Year/Make/Model","Mobile Phone","Member #","Trailer?","Preference 1","Event Preference"
```

**Simple format:**
```
Competitor,Class,PAX,#,SCCA Member
```

---

## ALSCCA Class & PAX Reference

Based on 2026 SCCA National Solo Rules + ALSCCA event data.

### Local Class Groupings

| Class | Name | PAX Codes |
|---|---|---|
| S1 | Street 1 | SS, AS, BS, FS |
| S2 | Street 2 | CS, ES |
| S3 | Street 3 | DS, GS, HS, SSC, HCS |
| ST | Street Touring | SST, AST, BST, CST, DST, EST, GST |
| CAM | Classic American Muscle | CAMS, CAMC, CAMT |
| XS | Xtreme Street | XA, XB |

### Special Classes

| Class | Name | Notes |
|---|---|---|
| X | Pro | Self-designated experienced drivers, any PAX |
| L | Ladies | Any PAX. Follow mode groups with PAX class; separate mode is own run group |
| N | Novice | Any PAX. Follow mode groups with PAX class; separate mode is own run group |
| R | Race Tire | Primarily FSAE cars, catch-all for rare vehicles, any PAX |

### Unmapped SCCA PAX Classes

Rarely seen at ALSCCA events. If an entrant registers with one of these, they are manually assigned to a run group.

| Category | PAX Codes |
|---|---|
| Street Prepared | SSP, CSP, DSP, ESP, FSP |
| Street Modified | SSM, SM, SMF |
| Prepared | XP, CP, DP, EP, FP |
| Modified | AM, BM, CM, DM, EM, FM |

---

## Tech Stack

- **No build tools, no npm, no frameworks** -- plain HTML/CSS/JS served as static files
- [jspreadsheet CE v4](https://bossanova.uk/jspreadsheet/v4) -- editable spreadsheet
- [jsPDF](https://github.com/parallax/jsPDF) + [autoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) -- PDF generation
- Shared CSS variables for dark theme across all tools
- Deployed on Hostinger as static site

## Running Locally

```bash
cd autox-landing-site
python -m http.server 8000
# Open http://localhost:8000
```
