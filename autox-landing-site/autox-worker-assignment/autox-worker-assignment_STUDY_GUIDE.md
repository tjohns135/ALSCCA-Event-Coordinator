# autox-worker-assignment — Study Guide

## 1. Project Overview

**What:** A browser-based tool for ALSCCA (Alabama region SCCA) autocross events that automates two time-consuming tasks: splitting participants into balanced run groups and assigning worker positions. The tool takes a CSV of registered entrants, applies SCCA class rules, and produces two printable PDFs — a check-in list and a staffing grid.

**Why:** Previously done manually in spreadsheets. The tool ensures fair, experience-informed assignments with historical tracking across events.

**Who uses it:** Event organizers (1-2 people per event) at the ALSCCA club.

**State:** Development

---

## 2. Requirements

**Tools Needed:**
- Web browser (Chrome recommended — jsPDF works best there)
- Text editor / IDE (VS Code)
- Node.js (only for running `generate_history.js` utility script)
- Hostinger account (for deployment as static files)

**No installation required for the app itself** — it's pure HTML/JS/CSS with CDN-loaded libraries. Open `index.html` in a browser.

---

## 3. Revision History

| Date | Summary |
|------|---------|
| 2026-03-23 | Added memory source indicator (shows localStorage/file/sample file origin), sample data buttons for demo, deployed to Hostinger as subdirectory |
| 2026-03-16 | Generated historical memory.json (262 participants) and 10 entry list CSVs from past event PDFs |
| 2026-03-16 | Fixed sorting/filtering (custom sort replacing broken jspreadsheet built-in), separated Class/PAX/# columns, removed novice listings from PDF headers, fixed corner worker PDF layout |
| 2026-03-15 | Built complete app: CSV parsing, run group splitting, worker assignment, PDF generation, memory system, editable spreadsheet UI |
| 2026-03-15 | Architecture decision: pure static HTML/JS, no backend, JSON memory files + localStorage |
| 2026-03-14 | Project scoping, class/PAX reference document created from SCCA 2026 rules |

---

## 4. Outline / Syllabus

1. [Session 1: Scoping & Architecture](#session-1-scoping--architecture)
2. [Session 2: Core App Build](#session-2-core-app-build)
3. [Session 3: Bug Fixes & Refinements](#session-3-bug-fixes--refinements)
4. [Session 4: Historical Data Generation](#session-4-historical-data-generation)
5. [Session 5: Memory Source Indicator, Sample Data & Deployment](#session-5-memory-source-indicator-sample-data--deployment)

---

## Session 1: Scoping & Architecture
**Date:** 2026-03-14 / 2026-03-15

**Topics Covered:**
- SCCA autocross event structure (run groups, worker positions, class/PAX system)
- Compared 4 tech approaches: PHP+MySQL, Node+MySQL, Static SPA + PHP API, Python Flask
- Defined run group splitting rules
- Reviewed 10 historical event PDFs to understand input/output formats

**Decisions Made:**

| Decision | Choice |
|----------|--------|
| Architecture | Pure static HTML/JS/CSS — no backend, no database |
| Hosting | Hostinger static file hosting (cheapest plan works) |
| Data persistence | JSON file upload/download + localStorage cache |
| Spreadsheet library | jspreadsheet CE v4 (MIT, lightweight) |
| PDF library | jsPDF 2.5.2 + jspdf-autotable 3.8.2 |
| Class/PAX source of truth | js/config.js (editable, based on 2026 SCCA National Solo Rules) |

**Key Learnings:**
- SCCA classes are hierarchical: Categories → Classes → PAX codes. Local clubs add their own groupings (S1, S2, S3, etc.) on top.
- Two run groups alternate between running and working. "Run 1st / Work 2nd" and "Run 2nd / Work 1st."
- Novice drivers (N class) follow their PAX class's run group — e.g., N_CST goes with ST.
- Ladies class always Runs 1st when present.
- Worker positions range from specialized (Timing, SSS, Announcer) to general (Corner Workers). Experience matters for specialized roles.

**Questions Asked & Answered:**
1. **Does PHP/MySQL require Hostinger database setup?** → Yes, you'd need to configure MySQL through Hostinger's panel. User preferred no database management.
2. **What is HCS?** → Unknown full name, but it's grouped under S3. Keep as-is.
3. **What is "Pro" class?** → The X class — self-designated experienced drivers, any PAX allowed.
4. **What is Race Tire?** → Primarily FSAE cars, catch-all for unusual vehicles.
5. **Do unmapped SCCA classes (Street Prepared, Modified, etc.) need support?** → Rarely seen at local events. Manual assignment if they appear.

**Misconceptions Addressed:**
1. **"See Groups Pg" for novices** → Initially novices were assigned "See Groups Pg 1" as their running value. Corrected: novices should get "Run 1st" or "Run 2nd" matching their PAX class.

**Files Created:**
- `class_pax_reference.md` — Reference document mapping all classes to PAX codes

**State:** Planning → Development

**What's Working:** Clear requirements, architecture decided, class/PAX reference verified by user.

**Next Steps:** Build the app.

---

## Session 2: Core App Build
**Date:** 2026-03-15

**Topics Covered:**
- Full app implementation from scratch
- CSV parsing with flexible column mapping
- Run group splitting algorithm (brute-force optimal balancing)
- Worker assignment pipeline (specialized → captains → corner workers)
- PDF generation for two document types
- Memory system with localStorage + JSON file support

**Decisions Made:**

| Decision | Choice |
|----------|--------|
| Table columns | Separate Class, PAX, # columns (not combined) for sorting/filtering |
| Sort approach | Custom sort (sorts entrants array, re-renders) — jspreadsheet's built-in sort breaks data mapping |
| Filter approach | Highlight matching rows (yellow) instead of hiding — prevents data sync issues |
| Auto-balance algorithm | Brute-force all 2^n combinations of class→group assignments (n ≤ ~8 classes, so ≤ 256 combos) |
| Worker assignment priority | Experience at specific position > total events > alphabetical |
| Novice worker restriction | Novices only get Corner Worker positions, never specialized roles |
| Event title default | "ALSCCA Autocross Pts. # - [current month day]" — user edits as needed |

**Key Learnings:**
- **jspreadsheet CE v4 limitation:** Built-in `columnSorting` reorders DOM rows but breaks the 1:1 mapping between row indices and the backing data array. Solution: disable it entirely and implement custom sort that operates on the data array directly.
- **jsPDF UMD namespace:** The CDN build puts the constructor at `window.jspdf.jsPDF`, not `window.jsPDF`. Need to check both locations.
- **PDF corner layout:** The example PDFs show corner workers distributed in 2 columns under each captain name. Workers fill left-to-right, then down — not one per row.
- **Run group headers:** Should only show PAX codes that have actual entrants, not all possible PAX in a class.

**Questions Asked & Answered:**
1. **Should novice classes be listed in PDF headers?** → No. Only show class groupings like "(S1: SS, AS, BS, FS)" — not "NSS, NAS, NBS, NFS".

**Files Created:**
- `index.html` — Single page app
- `css/style.css` — All styles
- `js/config.js` — Class/PAX configuration
- `js/memory.js` — Memory management + viewer
- `js/csv.js` — CSV parser
- `js/groups.js` — Run group splitting
- `js/workers.js` — Worker assignment
- `js/pdf.js` — PDF generation
- `js/app.js` — Main UI orchestration

**State:** Development

**What's Working:** Full workflow — CSV upload, group splitting, worker assignment, spreadsheet editing, PDF generation, memory save/load.

**Next Steps:** Fix PDF buttons, sorting, filtering, and other UX issues.

---

## Session 3: Bug Fixes & Refinements
**Date:** 2026-03-15 / 2026-03-16

**Topics Covered:**
- Fixed PDF generation (CDN URL issues, namespace detection)
- Added Auto-Balance button for run groups
- Added confirm dialog before reassigning workers
- Fixed sorting scrambling data (replaced jspreadsheet built-in with custom sort)
- Separated Class/PAX/# into 3 columns
- Removed novice PAX listings from PDF headers
- Fixed corner worker layout in Groups Page PDF
- Removed Event # input (redundant with editable title)

**Decisions Made:**

| Decision | Choice |
|----------|--------|
| CDN source | Switched from cdnjs to unpkg for jsPDF (more reliable) |
| Reassign workers | Confirm dialog: OK = clear all & reassign, Cancel = fill only empty |
| PDF header content | Classes with entrants only, no novice PAX codes listed |

**Key Learnings:**
- **CDN reliability matters:** cdnjs URLs for jspdf-autotable didn't load reliably. unpkg is more dependable for specific version pinning.
- **Two-way data binding is hard with jspreadsheet CE:** The library wasn't designed for external state management. Every interaction that modifies table order (sort, filter, insert/delete rows) must go through our own code that keeps the entrants array in sync.

**Files Modified:**
- All JS files refined, index.html updated, style.css updated

**State:** Development

**What's Working:** All core features functional. PDFs generate. Sort/filter work correctly. Memory viewer opens in new tab.

**Next Steps:** Generate historical test data, further PDF polish, deployment to Hostinger.

---

## Session 4: Historical Data Generation
**Date:** 2026-03-16

**Topics Covered:**
- Extracted participant data from 10 historical event PDFs (2025 season + first 2026 event)
- Generated memory.json with 262 unique participants
- Generated 10 entry list CSVs for testing

**Decisions Made:**

| Decision | Choice |
|----------|--------|
| Data extraction method | Research agent read all 20 PDFs, then Node.js script compiled the data |
| Memory format | Same JSON format the app uses — directly uploadable |
| CSV format | Matches app's expected input: Competitor, Class, PAX, #, SCCA Member |

**Key Learnings:**
- **Google Drive sync can drop files:** The examples directory became empty mid-session due to Drive stream mount issues. Always have data extracted/saved before relying on file access.
- **Some participants change class/PAX between events.** E.g., Nick Lindsay ran as X_AS_72 in one event and X_GS_12 in another. The memory system handles this correctly since it tracks per-event class/pax.
- **Dual roles are common.** Many participants have both an Early position (e.g., Course Setup) and a Working position (e.g., Corner Worker). Each role is stored as a separate event entry in memory.

**Files Created:**
- `generate_history.js` — Node.js script to generate all test data
- `examples/memory.json` — 262 participants, 10 events
- `examples/entry_list_2025-1.csv` through `examples/entry_list_2026-1.csv` — 10 CSV files

**State:** Development

**What's Working:** Full test dataset available. App can load memory + any CSV and run the complete workflow.

**Next Steps:** Test with real data, refine PDF layouts to match originals more closely, deploy to Hostinger.

---

## Session 5: Memory Source Indicator, Sample Data & Deployment
**Date:** 2026-03-23

**Topics Covered:**
- Memory source tracking — indicator now shows where data was loaded from (localStorage, uploaded file, or sample file)
- Sample data buttons — "Load Sample Entry List" and "Load Sample Memory" for demo/preview
- Deploying as a subdirectory on an existing Hostinger site

**Decisions Made:**

| Decision | Choice |
|----------|--------|
| Memory source display | Indicator text shows origin: "83 participants loaded from localStorage" / "from file" / "from sample file" |
| Sample data approach | Fetch files from `./examples/` via `fetch()`, wrap as `File` objects, pass through existing load methods — no parsing changes needed |
| Sample button styling | Dashed border, smaller font — visually secondary to primary actions |
| Deployment model | Subdirectory (`domain.com/worker-assignment/`) not subdomain — simpler, no DNS changes |
| examples/ folder on server | Must be deployed — sample buttons fetch from it |

**Key Learnings:**
- **`fetch()` → `Blob` → `File` pattern:** You can convert any fetched resource into a `File` object that's indistinguishable from a user file picker selection. This avoids duplicating parsing logic for "load from URL" vs "load from upload."
- **Subdirectory vs subdomain:** A subdirectory just needs a folder in `public_html/` — no DNS, no Hostinger subdomain config. All relative paths (`css/style.css`, `./examples/...`) resolve correctly from the subdirectory.
- **localStorage persists across sessions:** Memory auto-loaded from localStorage on page init was confusing since it showed participants without the user uploading anything. Adding the source label ("from localStorage") makes this transparent.

**Questions Asked & Answered:**
1. **Should localStorage auto-load be removed?** → No. Keep it, but label the source so the user understands where the data came from.
2. **Does file upload append or replace memory?** → Replace. Users are expected to upload a complete memory file, not incremental updates.
3. **Can sample files be served from the site itself?** → Yes. `fetch('./examples/file')` works for any file in the site's directory. No backend needed.

**Misconceptions Addressed:**
1. **"Need to change CSV parser for fetch"** → Not true. `fetch()` can produce a `Blob` which wraps into a `File` object — existing `loadCSV(file)` and `Memory.loadFromFile(file)` work unchanged.

**Files Modified:**
- `js/memory.js` — Added `source` property, updated `init()`, `loadFromJSON()`, `loadFromFile()`, `clear()`, `updateIndicator()` to track and display source
- `js/app.js` — Added `loadSampleCSV()`, `loadSampleMemory()` methods and button bindings
- `index.html` — Added two "Load Sample" buttons
- `css/style.css` — Added `.sample-btn` styles

**State:** Deployed

**What's Working:** Full workflow deployed to Hostinger subdirectory. Memory source indicator shows origin. Sample data buttons let anyone preview the tool without their own data.

**Next Steps:** PDF layout polish, edge case handling, gather user feedback from live deployment.

---
