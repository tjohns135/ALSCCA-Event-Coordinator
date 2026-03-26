# autox-worker-assignment — Project Handoff

## 1. Summary

A pure static HTML/JS/CSS web app for ALSCCA (Alabama SCCA) autocross events. Takes a CSV of registered entrants, splits them into two balanced run groups following SCCA class rules, assigns worker positions based on participant history, and generates two printable PDFs (check-in list + staffing grid). Participant memory is stored as a JSON file (uploaded/downloaded manually, cached in localStorage). Aimed at 1-2 event organizers. Deployed to Hostinger as a subdirectory. Includes sample data buttons for demo/preview.

## 2. Progress

### Completed
- **Architecture:** Pure client-side app, no backend. JSON files + localStorage for persistence. CDN-loaded libraries (jspreadsheet CE v4, jsPDF + autoTable).
- **Class/PAX system:** 6 standard classes (S1, S2, S3, ST, CAM, XS) with defined PAX codes, plus 4 special classes (X=Pro, L=Ladies, N=Novice, R=Race Tire). Config in `js/config.js`. Reference doc: `class_pax_reference.md`.
- **CSV parsing:** Flexible column mapping, quote handling. (`js/csv.js`)
- **Run group splitting:** 3 rules (class cohesion, novice follows PAX, Ladies first). Brute-force optimal balancing across all 2^n class combinations. Manual override via dropdowns. (`js/groups.js`)
- **Worker assignment:** Specialized positions filled by experience → captains → corner workers round-robin. Novices restricted to corner worker only. Confirm dialog for reassignment. (`js/workers.js`)
- **PDF generation:** Two PDFs — Worker Assignments (check-in table sorted by name) and Groups Page (early positions grid + working sections with corners). Only lists PAX with actual entrants. (`js/pdf.js`)
- **Memory system:** JSON upload/download, localStorage cache, green/yellow/red status indicator with source label (shows "from localStorage" / "from file" / "from sample file"), viewer opens in new tab with searchable jspreadsheet. File upload replaces (not appends) memory. (`js/memory.js`)
- **Sample data buttons:** "Load Sample Entry List" and "Load Sample Memory" fetch from `./examples/`, wrap as `File` objects, pass through existing load methods. Styled as secondary buttons. (`js/app.js`, `index.html`)
- **Spreadsheet UI:** Editable table with separate Class/PAX/# columns. Custom sort (by dropdown + buttons) and highlight-based filter. jspreadsheet built-in sort disabled (breaks data sync). (`js/app.js`)
- **Historical data:** 262 participants across 10 events (2025 season + 2026 Pts 1) extracted from event PDFs. `examples/memory.json` + 10 entry list CSVs. Generator script: `generate_history.js`.
- **Deployment:** Live on Hostinger as a subdirectory (`domain.com/worker-assignment/`). All paths are relative — no config changes needed.

### Current Focus
- Gathering feedback from live deployment, PDF layout refinement

### Upcoming
- PDF layout polish to more closely match original hand-made versions
- Edge case handling (empty CSV, 0 entrants in a class, duplicate names)
- Potential: drag-and-drop worker assignment, undo/redo, print-friendly CSS

## 3. Files

```
autox-worker-assignment/
├── index.html                  # Single-page app (CDN: jspreadsheet v4, jsPDF 2.5.2, autoTable 3.8.2)
├── css/style.css               # All styles (~320 lines)
├── js/
│   ├── config.js               # Class/PAX mappings, worker positions, early positions
│   ├── memory.js               # JSON memory: load/save/localStorage/viewer
│   ├── csv.js                  # CSV parser with flexible column mapping
│   ├── groups.js               # Run group split: rules + brute-force balance
│   ├── workers.js              # Worker assignment: specialized → captain → corner
│   ├── pdf.js                  # PDF gen: Worker Assignments + Groups Page
│   └── app.js                  # UI orchestration, table sync, button state, sample data loaders
├── generate_history.js         # Node.js utility: builds memory.json + CSVs from event data
├── class_pax_reference.md      # Class/PAX reference (verified by user)
├── autox-worker-assignment_STUDY_GUIDE.md
├── autox-worker-assignment_PROJECT_HANDOFF.md
└── examples/
    ├── memory.json             # 262 participants, 10 events
    ├── entry_list_2025-1.csv   # through entry_list_2026-1.csv (10 files)
    └── [.examples/ has original PDFs when Google Drive is synced]
```

## 4. Stack

| Tech | Version | Purpose | Docs |
|------|---------|---------|------|
| HTML/JS/CSS | ES6+ | App framework | — |
| jspreadsheet CE | v4 | Editable table | https://bossanova.uk/jspreadsheet/v4 |
| jsuites | v4 | jspreadsheet dependency | https://jsuites.net/v4 |
| jsPDF | 2.5.2 | PDF creation | https://github.com/parallax/jsPDF |
| jspdf-autotable | 3.8.2 | Table plugin for jsPDF | https://github.com/simonbengtsson/jsPDF-AutoTable |
| Node.js | any | generate_history.js only | — |

CDN sources: jspreadsheet/jsuites from bossanova.uk, jsPDF/autoTable from unpkg.com.

## 5. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     index.html                          │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────────┐│
│  │  Setup   │ │  Run Group   │ │  Spreadsheet (edit)  ││
│  │  CSV ↑   │ │  Assignment  │ │  Sort/Filter toolbar ││
│  │  Memory ↑│ │  dropdowns   │ │                      ││
│  │  Title   │ │  counts      │ │  [jspreadsheet CE]   ││
│  └──────────┘ └──────────────┘ └──────────────────────┘│
│  ┌──────────────────────────────────────────────────────┐│
│  │  Output: [PDF Workers] [PDF Groups] [Memory] [View] ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘

Data Flow:
  CSV file ──parse──→ entrants[]
                        │
  Memory.json ────→ Memory.data ←──→ localStorage
                        │
  User adjusts ──→ groupAssignments{} ──→ Groups.split() ──→ entrants[].running/working
                                                                    │
                                          Workers.assign() ←───────┘
                                                │
                                          entrants[].position
                                                │
                              ┌─────────────────┼─────────────────┐
                              ↓                 ↓                 ↓
                        PDF.generate*()   table.setData()   Memory.update()
```

**Key Design Decisions:**
- **No backend** — user preference, simpler hosting. All state in browser + JSON files. ([Source: user feedback, session 1](https://jspreadsheet.com/))
- **Brute-force balancing** — with ≤8 assignable classes, 2^8=256 is trivial. Guarantees optimal split.
- **Custom sort over library sort** — jspreadsheet CE v4's columnSorting modifies DOM order without updating the backing data store, causing data corruption when syncing back. ([Known limitation of jspreadsheet CE v4](https://bossanova.uk/jspreadsheet/v4))
- **Highlight filter over data filter** — replacing table data with filtered subset breaks entrant↔row index mapping.

## 6. TODOs

- [ ] Test full workflow with `examples/memory.json` + each entry list CSV
- [ ] Refine PDF layouts to better match original hand-made versions (spacing, fonts, borders)
- [x] ~~Deploy to Hostinger as subdirectory~~
- [ ] Handle edge cases: empty CSV, 0 entrants in a class, duplicate entrant names
- [ ] Consider: undo/redo for spreadsheet edits
- [ ] Consider: drag-and-drop reordering for worker assignments
- [ ] Consider: print-friendly CSS view as alternative to PDF

**Open Questions:**
- Should the Groups Page PDF match the original layout exactly, or is the current version acceptable?
- How should unmapped SCCA classes (Street Prepared, Modified, etc.) be handled if they appear?
- Should the app support multiple events in one session (batch mode)?

## 7. Run Commands

```bash
# Run the app (no build step)
# Just open index.html in a browser

# Generate test data (one-time, requires Node.js)
cd "G:/My Drive/ClaudeProjectsDrive/autox-worker-assignment"
node generate_history.js

# Deploy to Hostinger (subdirectory)
# Upload these files/folders to public_html/worker-assignment/:
#   index.html, css/, js/, examples/
# (generate_history.js, .examples/, *.md files are NOT needed on server)
# examples/ IS needed — sample data buttons fetch from it
```

## 8. Resume Guide + Working Agreement

### For the next Claude session:

1. **Read this handoff** — it contains all project context. You do NOT need STUDY_GUIDE.md.
2. **Verify** the current file structure matches Section 3 above.
3. **Summarize** the project state to the user and confirm understanding.
4. **Ask** what to focus on this session.

### Working Agreement:
- **No backend.** Pure static HTML/JS/CSS. JSON files for persistence. No PHP, no database. Deployed as subdirectory on Hostinger.
- **Functional over flashy.** Simple UI, no unnecessary features.
- **Edit, don't rewrite.** Modify only what changes. The user dislikes unnecessary refactoring.
- **jspreadsheet sort is broken.** Do NOT re-enable `columnSorting: true`. Use the custom sort in app.js.
- **Run group rules are law:** (1) All PAX in a class stay together, (2) Novices follow their PAX class, (3) Ladies always Run 1st.
- **No novice PAX in PDF headers.** Only show class groupings like "(S1: SS, AS, BS, FS)".
- **Memory files** at `C:\Users\tjohn\.claude\projects\G--My-Drive-ClaudeProjectsDrive-autox-worker-assignment\memory\` contain persistent context (run group rules, architecture decisions, user preferences).

## 9. Updated

**2026-03-23** — Added memory source indicator, sample data buttons, deployed to Hostinger subdirectory. App is live.
**2026-03-16** — Created handoff. App functional with full historical test data (262 participants, 10 events). Core workflow complete.
