# autox-worker-assignment - Project Tracker

---

## Project Summary

| Field | Value |
|-------|-------|
| **Project Name** | autox-worker-assignment |
| **Description** | ALSCCA autocross tool: assigns run groups and worker positions from CSV entry lists, generates PDFs |
| **Category** | Digital |
| **Stage** | Deployed |
| **Created** | 2026-03-14 |
| **Last Activity** | 2026-03-23 |
| **Next Action** | PDF layout polish, gather user feedback from live deployment |
| **Blockers** | None |

---

## Detailed Description

A pure static HTML/JS/CSS web app for ALSCCA (Alabama SCCA) autocross events. Event organizers upload a CSV of registered participants, the tool splits them into two balanced run groups following SCCA class rules (class cohesion, novices follow PAX, Ladies first), assigns worker positions based on participant history, and generates two printable PDFs — a check-in list sorted by name and a staffing grid with corner/specialty assignments. Participant memory is stored as a JSON file for tracking experience across events. Designed to be hosted on Hostinger as static files with no backend.

---

## Goals & Success Criteria

- [x] CSV upload and parsing with flexible column mapping
- [x] Run group splitting with SCCA class rules and optimal auto-balancing
- [x] Worker position assignment informed by participant history
- [x] Editable spreadsheet UI with sort and filter
- [x] Worker Assignments PDF generation (check-in list)
- [x] Groups Page PDF generation (staffing grid)
- [x] Memory system (JSON file + localStorage + viewer)
- [x] Historical data: 262 participants across 10 events
- [ ] PDF layouts refined to closely match original hand-made versions
- [x] Deploy to Hostinger as static site (subdirectory)
- [ ] Test with real upcoming event data
- [ ] User acceptance from event organizer

---

## Tech Stack / Materials

- HTML/JS/CSS (ES6+, no build step)
- jspreadsheet CE v4 (editable table, CDN)
- jsuites v4 (jspreadsheet dependency, CDN)
- jsPDF 2.5.2 (PDF creation, CDN via unpkg)
- jspdf-autotable 3.8.2 (table plugin for jsPDF, CDN via unpkg)
- Node.js (generate_history.js utility only)
- Hostinger (static file hosting, deployed as subdirectory)

---

## Work Sessions

### 2026-03-14 - Project Scoping & Requirements

**Focus:** Understanding SCCA autocross event structure, reviewing example PDFs, defining requirements
**Outcome:** Clear picture of inputs (CSV), outputs (2 PDFs), rules (class/PAX system, run group splitting, worker positions). Created class_pax_reference.md.
**Challenges:** Needed to extract class/PAX mappings from SCCA rules image and cross-reference with 10 historical event PDFs.
**Decisions Made:** Documented all local class groupings (S1-S3, ST, CAM, XS) and special classes (X, L, N, R).

### 2026-03-15 - Architecture Decision & Core Build

**Focus:** Chose tech stack, built entire app from scratch
**Outcome:** Complete working app — CSV parsing, run group splitting, worker assignment, PDF generation, memory system, editable spreadsheet UI. All 9 source files created.
**Challenges:** Evaluated 4 architecture options (PHP+MySQL, Node+MySQL, SPA+PHP API, Python). User wanted no backend complexity.
**Decisions Made:** Pure static HTML/JS with JSON memory files. No PHP, no database. CDN-loaded libraries. Hostinger static hosting.

### 2026-03-15/16 - Bug Fixes & Refinements

**Focus:** Fixing 8 user-reported issues
**Outcome:** Fixed PDF generation (CDN issues), added Auto-Balance button, worker reassign confirmation, separated Class/PAX/# columns, fixed sorting (custom sort replacing broken jspreadsheet built-in), fixed filtering, removed novice PAX from PDF headers, added memory viewer, fixed corner worker PDF layout.
**Challenges:** jspreadsheet CE v4's built-in columnSorting broke data↔row mapping. Required complete custom sort/filter implementation.
**Decisions Made:** Disabled jspreadsheet sort, custom sort on entrants array. Highlight-based filter instead of data replacement.

### 2026-03-16 - Historical Data Generation

**Focus:** Extracting participant data from 10 historical event PDFs, generating memory.json and entry list CSVs
**Outcome:** memory.json with 262 participants, 10 entry list CSVs. Node.js generator script (generate_history.js).
**Challenges:** PDF reading agents failed due to missing pdftoppm on Windows. Solved by using Read tool directly + compiling data into a Node.js script.
**Decisions Made:** All historical data hardcoded in generate_history.js for reproducibility.

### 2026-03-16 - Documentation

**Focus:** Study guide, handoff document, and project tracker
**Outcome:** Three documentation files created covering architecture, decisions, learnings, and session handoff.

### 2026-03-23 - Memory Source Indicator, Sample Data & Deployment

**Focus:** UX improvements for memory transparency, demo capability, and Hostinger deployment
**Outcome:** Memory indicator now shows where data was loaded from (localStorage/file/sample file). Two "Load Sample" buttons let anyone preview the tool without their own data. App deployed to Hostinger as a subdirectory.
**Challenges:** Considered changing CSV parser to accept raw text from fetch, but found cleaner approach using fetch→Blob→File wrapping.
**Decisions Made:** Memory source tracked as property on Memory object. Sample files fetched from ./examples/ and wrapped as File objects to reuse existing load methods. Deployed as subdirectory (not subdomain) for simplicity.

---

## Decisions Log

| Date | Decision | Reasoning | Impact |
|------|----------|-----------|--------|
| 2026-03-15 | Pure static HTML/JS, no backend | User doesn't want to manage databases on Hostinger; wants it to work locally too | No PHP, no MySQL, JSON files for persistence |
| 2026-03-15 | jspreadsheet CE v4 for editable table | MIT licensed, lightweight, spreadsheet-like UX | CDN-loaded, no build step needed |
| 2026-03-15 | jsPDF + autoTable for PDFs | Client-side generation, no server needed | Two PDF types generated in browser |
| 2026-03-15 | Brute-force 2^n for group balancing | With ≤8 classes, 256 combos is trivial; guarantees optimal | Always finds best possible balance |
| 2026-03-16 | Custom sort replacing jspreadsheet built-in | Built-in sort broke entrants↔row data mapping | Reliable sorting, slightly more code |
| 2026-03-16 | Highlight filter instead of data replacement | Replacing table data broke sync between entrants array and table | Safe filtering, match count shown |
| 2026-03-16 | No novice PAX in PDF headers | User request; cleaner headers showing only class groupings | Simpler, less cluttered PDF output |
| 2026-03-23 | Memory source indicator | localStorage auto-load was confusing without labeling the source | Indicator now shows "from localStorage" / "from file" / "from sample file" |
| 2026-03-23 | fetch→Blob→File for sample loading | Avoids duplicating parse logic; reuses existing loadCSV/loadFromFile methods unchanged | Clean separation, no parser changes needed |
| 2026-03-23 | Subdirectory deployment over subdomain | Simpler — just a folder in public_html, no DNS config | All relative paths work without code changes |

---

## Challenges & Solutions

| Date | Challenge | Status | Solution/Notes |
|------|-----------|--------|----------------|
| 2026-03-15 | PDF buttons not working | Resolved | CDN URL issue — switched from cdnjs to unpkg; added namespace detection for jsPDF UMD build |
| 2026-03-16 | jspreadsheet sort scrambles data | Resolved | Disabled built-in columnSorting; implemented custom sort that reorders entrants array then re-renders |
| 2026-03-16 | Filter replacing data breaks sync | Resolved | Changed to highlight-based filter (CSS class on matching rows) instead of replacing table data |
| 2026-03-16 | PDF agents couldn't read PDFs | Resolved | pdftoppm not available on Windows; used Read tool directly + compiled extracted data into Node.js script |
| 2026-03-16 | Google Drive sync dropped files | Resolved | Examples directory went empty mid-session; had already extracted all data via research agent |
| Open | PDF layouts don't perfectly match originals | Open | Current layouts are functional but spacing/formatting differs from hand-made originals |
| 2026-03-16 | Hostinger deployment not yet done | Resolved | Deployed 2026-03-23 as subdirectory on existing Hostinger site |

---

## Changelog

2026-03-23: Deployed to Hostinger as subdirectory
2026-03-23: Added sample data buttons (Load Sample Entry List, Load Sample Memory) fetching from ./examples/
2026-03-23: Added memory source indicator showing localStorage/file/sample file origin
2026-03-23: Updated study guide, handoff, and tracker documentation
2026-03-16: Created study guide, handoff document, and project tracker
2026-03-16: Generated memory.json (262 participants) and 10 entry list CSVs from historical event PDFs
2026-03-16: Removed novice PAX listings from PDF headers, fixed corner worker layout in Groups Page PDF
2026-03-16: Fixed sorting (custom sort), filtering (highlight-based), separated Class/PAX/# columns
2026-03-15: Fixed PDF generation, added Auto-Balance, worker reassign confirmation, memory viewer
2026-03-15: Built complete app: 9 source files, full workflow functional
2026-03-15: Architecture decision: pure static HTML/JS, JSON memory, Hostinger static hosting
2026-03-14: Project scoping, class/PAX reference document created

---

## Notes & Ideas

- **Deployment:** Upload `index.html`, `css/`, `js/`, and `examples/` to Hostinger. `examples/` is needed for sample data buttons. `generate_history.js`, `.examples/`, and `*.md` files are dev-only.
- **Future: Drag-and-drop worker assignment** — could let organizers visually drag names between positions instead of editing cells.
- **Future: Print-friendly CSS** — an alternative to PDF generation; just style the page for printing directly.
- **Future: Undo/redo** — track spreadsheet changes for easy reversal.
- **Participant class changes:** Some drivers change class/PAX between events (e.g., Nick Lindsay: X_AS_72 → X_GS_12). Memory handles this per-event.
- **Dual roles:** Many participants have both Early and Working positions. Each is a separate entry in memory.
- **SCCA rules update annually** — config.js PAX mappings may need updating each year when new Solo Rules are published.
