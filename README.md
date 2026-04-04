# ALSCCA Event Coordinator

Digital tools to improve the process of creating and hosting AutoX events for the ALSCCA.

Live at [cone.ninja](https://cone.ninja/)
<br><img src="cone-ninja-logo.png" alt="Cone Ninja Logo" width="200" />

The project has 2 tools:
1. [**Worker Assignment Tool**](#worker-assignment-tool) -- Split run groups and assign worker positions for autocross events
2. [**Track Designer**](#track-designer) -- Create unique autocross courses on the Barber Proving Grounds layout

---

## Worker Assignment Tool

Upload an entry list CSV, balance run groups, assign manual and algorithm-based worker positions, and generate PDFs for event day.

### Workflow

1. Load entry list (CSV from MotorsportReg or manual format)
2. Load memory (JSON with participant history -- used for experience-based assignments)
3. Configure PAX/class mappings if needed
4. Assign manual positions (early workers)
5. Set max allowable difference between run groups
6. Balance run groups -- auto balance, manual changes, lock-in group option
7. Set number of corners that need workers
8. Assign workers (algorithm)
9. Manual edits in spreadsheet as needed
10. Generate PDFs
11. Save memory

---

### Rules for Splitting Run Groups

1. All entries in a specific PAX stay in the same run group
2. Novices are in the same run group as other entries with the same PAX (follow mode) or treated as their own class (separate mode)
3. Ladies follow their PAX class (follow mode) or are treated as their own class (separate mode)
4. Classes can be locked to a specific run group during balancing
5. The balance algorithm generates all possible ways to split classes into two run groups, keeping only those where the difference between run group 1 and run group 2 is within the max threshold set by the user
6. Each press of "Balance Run Groups" cycles to the next valid combination

---

### PAX & Class Configuration

#### Default ALSCCA Class Groupings

| Class | Name | PAX Codes |
|---|---|---|
| S1 | Street 1 | SS, AS, BS, FS |
| S2 | Street 2 | CS, ES |
| S3 | Street 3 | DS, GS, HS, SSC, HCS |
| ST | Street Touring | SST, AST, BST, CST, DST, EST, GST |
| CAM | Classic American Muscle | CAMS, CAMC, CAMT |
| XS | Xtreme Street | XA, XB |

#### Special Classes

| Class | Name | Notes |
|---|---|---|
| X | Pro | Self-designated experienced drivers, any PAX |
| L | Ladies | Any PAX. Follow mode groups with PAX class; separate mode is own run group |
| N | Novice | Any PAX. Follow mode groups with PAX class; separate mode is own run group |
| R | Race Tire | Primarily FSAE cars, catch-all for rare vehicles, any PAX |

#### Changing a PAX Class for an Event

The PAX-to-Class configuration grid lets you reassign any PAX code to a different class for the current event. For example, if you want to move CST from ST to S2 for one event, select S2 from the dropdown next to CST. This immediately updates class numbers and rebalances groups accordingly. Changes reset on page reload.

#### Unmapped SCCA PAX Classes

Rarely seen at ALSCCA events. If an entrant registers with one of these, they are manually assigned to a run group.

| Category | PAX Codes |
|---|---|
| Street Prepared | SSP, CSP, DSP, ESP, FSP |
| Street Modified | SSM, SM, SMF |
| Prepared | XP, CP, DP, EP, FP |
| Modified | AM, BM, CM, DM, EM, FM |

---

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

#### Session-Based Manual Positions

These are manually assigned but tied to a specific work session:

| Category | Positions |
|---|---|
| Timing & Safety | Timing 1, Timing 2, Safety Steward 1, Safety Steward 2 |
| Announcer & Sound | Announcer 1, Announcer 2, Sound 1, Sound 2 |

#### Shadow Positions

Optional training positions for participants learning a role. Filled manually if needed, not by the algorithm.

| Shadow Positions |
|---|
| Timing Shadow 1, Timing Shadow 2 |
| Safety Steward Shadow 1, Safety Steward Shadow 2 |

---

### Auto-Fill Manual Workers

The auto-fill feature iterates through each empty manual position in order and suggests a person based on their history. For each position, available entrants are categorized into three groups:

- **Eligible** -- has worked this specific position before
- **Experienced** -- has attended 5+ lifetime events but has no history for this position
- **Inexperienced** -- fewer than 5 lifetime events

Selection priority: eligible first, then experienced. Inexperienced workers are skipped. Each person can only fill one manual position.

The same categories (eligible, experienced, inexperienced) appear as groups in the manual position dropdowns so you can see each person's qualification level when assigning by hand.

---

### Worker Assignment Algorithm

The algorithm assigns positions to entrants who were not given a manual position.

**Worker pool:** only entrants marked "Work 1st" or "Work 2nd" with no existing position assignment.

**Excluded from the pool:** all manually assigned positions (early workers, session positions, shadows). Novices are excluded from non-corner positions.

**Ranking:** workers are ranked by position-specific experience count, then total event count, then alphabetically.

| Phase | Positions | Selection |
|---|---|---|
| 1 -- Experienced | Starter 1/2, Spotter 1/2, Grid 1/2 | Most experienced for this position |
| 2 -- Corner Captains | 1 per corner per run group | Most experienced remaining |
| 3 -- Corner Workers | All remaining entrants | Round-robin across corners |

- No duplicate assignments -- each person gets exactly one position
- Novices are excluded from experienced positions and can only be corner workers
- Experience threshold: 5+ events = experienced

---

### Participant Memory

The memory system tracks participant history across events. For each participant it stores:

- **Event count** -- total number of events attended
- **Position history** -- which positions a person has worked and how many times
- **Captain capable** -- flagged if they've been a Corner Captain before

#### Loading a Memory File

Upload the JSON file saved from a previous event. This populates the tool with each participant's history, enabling experience-based rankings in the manual position dropdowns and the worker assignment algorithm. Without a memory file, all participants are treated as new.

#### When to Save

After all positions are assigned for the current event, download the memory file. The file is named `alscca_memory_YYYY-MM-DD.json`.

#### What's New in the Saved File

The current event's data is added to each participant's history:
- Date and event name
- Position assigned
- Class and PAX

#### Using the Memory File for the Next Event

Load the saved JSON at the start of the next event. The tool reads each participant's history to rank workers by experience -- participants who have worked a position before appear as "eligible" in dropdowns, and those with 5+ events appear as "experienced."

#### Position Aliases

Historical position names are aliased for backward compatibility. For example, "SSS" maps to "Safety Steward." Numbered variants like "Safety Steward 1" are recognized as matching the base "Safety Steward" position for experience tracking.

---

### CSV Input Formats

Two formats are supported:

**MotorsportReg format:**
```
"Event Name","Full Name (First/Last)","Class","Modifier/PAX","No.","Vehicle Year/Make/Model","Mobile Phone","Member #","Trailer?","Preference 1","Event Preference"
```

**Simple format:**
```
Competitor,Class,PAX,#,SCCA Member
```

#### Parser Flexibility

The CSV parser is flexible with input variations:

- **Case-insensitive** header matching
- **Column name aliases** -- the parser recognizes multiple names for the same column:
  - Name: "Competitor", "Name", "Full Name"
  - PAX: "PAX", "Modifier PAX"
  - Number: "#", "Number", "Car No", "Car Num", "No"
  - Member: "SCCA Member", "Member"
- **Quoted fields** -- handles commas inside quoted values and escaped quotes
- **Whitespace** -- trims all values and skips empty rows
- **Fallback** -- if headers don't match, falls back to positional column mapping

---

## Track Designer

Design autocross courses on the Barber Proving Grounds lot map. Place cones, markers, and corner numbers on an interactive SVG canvas, then export the layout as a PNG or JSON.

### Placeable Elements

#### Cones

| Cone | Description |
|---|---|
| Standard Cone | Basic circular course-marking cone |
| Pointer Cone | Cone with a directional triangle arrow (rotatable) |
| Guide Cone | Triangle-based directional guide marker (rotatable) |

#### Course Markers

| Marker | Description |
|---|---|
| Start Line | 2 cones connected by a green line. Rotatable. Displays "START" label |
| Timing Start | 4 cones (2x2 grid) with an orange timing line. Rotatable. Displays "TIMING START" label |
| Finish Line | 10 cones (2 rows of 5) with a red finish line. Rotatable. Displays "FINISH" label |
| Car | Vehicle position and heading indicator. Rotatable. Max 1 per course |
| Corner Number | Numbered circle marker (1–6). Max 6 per course. Number adjustable via sidebar slider |

### Selection & Rotation

- Click an element with the **Select** tool to select it
- Selected elements show a highlight glow and a **rotation handle** — a dashed line extending from the center with a draggable circle at the end
- Drag the rotation handle to rotate the element
- Rotatable elements: pointer cones, guide cones, start line, timing start, finish line, car
- Standard cones and corner numbers are **not** rotatable
- Click empty space or press **Esc** to deselect

### Deleting Elements

- **Right-click** any cone to delete it
- **Eraser tool** — click any element (cones, markers, car, corner numbers) to delete it

### Track Info

The sidebar displays a live count of elements on the course:

- Total cones, with breakdown by type (standard, pointer, guide)
- Start line, timing start, finish line, car — placed or not set
- Corner numbers — count out of 6

### Controls — Browser

| Action | Control |
|---|---|
| Pan | Drag empty space with the Select tool |
| Zoom | Scroll wheel (zooms toward cursor) |
| Select | Click an element with the Select tool |
| Move | Drag a selected element to reposition |
| Rotate | Drag the rotation handle on a selected element |
| Delete | Right-click a cone, or use the Eraser tool |
| Deselect | Click empty space or press Esc |

### Controls — Mobile

| Action | Control |
|---|---|
| Pan | Single-finger drag on empty space |
| Zoom | Pinch with two fingers (zooms toward midpoint) |
| Place | Tap with a placement tool selected |
| Move | Drag an element with the Select tool |

The layout adapts at 768px — the sidebar moves to the top as a horizontal scrollable bar and tools display in a 4-column grid.

### Keyboard Shortcuts

| Key | Action |
|---|---|
| S | Select tool |
| C | Standard Cone tool |
| 1 | Start Line tool |
| 2 | Timing Start tool |
| 3 | Finish Line tool |
| D | Driving Line tool |
| E | Eraser tool |
| Esc | Deselect all and switch to Select tool |

Shortcuts are disabled while typing in input fields.

### Track Library

A built-in library of predefined tracks that can be loaded from a dropdown in the sidebar (below the course name input) or from the welcome modal on first visit.

- **Welcome modal** — on first load (no saved course), a popup offers the choice to load a predefined track or start with a blank canvas
- **Sidebar dropdown** — select a track from the "Load a track..." dropdown at any time. A confirmation modal appears before replacing the current course
- **Adding tracks** — drop a course JSON file in the `tracks/` folder and add an entry to `TRACK_LIBRARY` in `js/config/trackIndex.js`

### Car Modes

After placing a car, a toggle in the sidebar switches between two modes:

| Mode | Description |
|---|---|
| Edit | Default mode. All tools are available. Drag the car's rotation handle to reposition and steer |
| Drive | Keyboard-driven mode (WASD / Arrow keys). Tools are disabled. A canvas notification indicates drive mode is active |

**Drive mode features:**
- **Car profiles** — select from predefined car handling profiles (acceleration, top speed, turn rate)
- **Trace Path** — toggle to record the car's path as a driving line while driving or editing
- **Manually Draw Driving Line** — click points to draw a smooth driving line by hand

### Export & Save

- **Export PNG** — renders the course as a 2x resolution image
- **Export SVG** — exports the course as a scalable vector graphic
- **Save JSON** — downloads the course as a JSON file for backup
- **Load JSON** — upload a previously saved JSON file to restore a course
- **Auto-save** — course state saves to browser localStorage automatically after every change
- **New Course / Clear Course** — confirmation prompt before clearing

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
