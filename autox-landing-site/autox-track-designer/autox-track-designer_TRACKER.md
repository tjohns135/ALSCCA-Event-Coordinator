# AutoX Track Designer - Project Tracker

---

## Project Summary

| Field | Value |
|-------|-------|
| **Project Name** | autox-track-designer |
| **Description** | Web-based autocross course designer with cone placement on clean SVG vector track surface |
| **Category** | Digital |
| **Stage** | Active |
| **Created** | 2026-02-04 |
| **Last Activity** | 2026-03-15 |
| **Next Action** | Test PNG export quality with SVG canvas; mobile/touch testing |
| **Blockers** | None |

---

## Detailed Description

A browser-based tool for designing autocross courses. Users can place different types of cones (standard, pointer, guide) on a clean SVG vector track surface, and set start/finish timing gate lines. The track is rendered from vector paths extracted from `track_outline.svg`, providing infinite zoom with perfect crispness. Designed for autocross event organizers to plan course layouts before physical setup.

Key capabilities:
- Three visually distinct cone types (circle, circle+triangle, triangle)
- Rotatable start/finish timing gate lines
- Custom SVG pan/zoom with infinite resolution
- PNG and JSON export
- Real-time size calibration
- Clean grayscale track surface (no satellite imagery clutter)

---

## Goals & Success Criteria

- [x] Place standard cones on map
- [x] ~~Draw racing path with distance display~~ (removed in v2 — course defined by cones)
- [x] Set start/finish markers
- [x] Export course as PNG image
- [x] Save/load course as JSON
- [x] Add pointer cones (upright + directional)
- [x] Add guide cones (directional only)
- [x] ~~Rotate map to match venue orientation~~ (removed in v2 — SVG track is pre-oriented)
- [x] Adjust cone sizes via slider
- [x] Select and rotate pointer/guide cones
- [x] Replace Leaflet with SVG-based canvas for infinite zoom
- [x] Visually distinct cone types (top-down view)
- [x] Clean vector track surface (no satellite imagery)
- [x] Cone count by type in stats
- [x] Add corner number labels (1-6)
- [x] Add car marker placement
- [x] Visual rotation handles (drag-to-rotate)
- [x] Fix click-deselect race condition (selection now works properly)
- [ ] Test PNG export with SVG canvas
- [ ] Mobile/touch testing
- [ ] Add scale bar

---

## Tech Stack / Materials

- React 18 (via CDN)
- Babel standalone (JSX transpilation)
- html-to-image (PNG export)
- Custom SVG pan/zoom utility (`svgPanZoom.js`)
- CSS3 animations (selection effects)

**Removed in v2:**
- ~~Leaflet 1.9.4~~
- ~~leaflet-rotate 0.2.8~~
- ~~ESRI World Imagery (satellite tiles)~~

---

## Work Sessions

### 2026-02-04 - Cone Types, Rotation System, Map Rotation

**Duration:** Extended session
**Focus:** Implementing three cone types, size calibration, map rotation, and cone rotation system

**Outcome:**
- Added Standard, Pointer, Guide cone types
- Changed start/finish from flags to rotatable lines
- Integrated leaflet-rotate plugin for 39° map rotation
- Built selection system with rotation slider for pointer/guide cones
- Added pulsing animation for selected cones

**Challenges:**
- maxBounds conflicted with map rotation causing jump/zoom issues
- Pointer cone SVG composition was complex, switched to separate companion markers
- Start/finish line clickable area was too large

**Decisions Made:**
- Removed maxBounds to fix rotation conflicts
- Pointer cones render as two separate markers (main + companion)
- Used CSS pointer-events to limit line click area
- Default rotation 45° places companion at lower-right

### 2026-02-11 - v2 Redesign: SVG-Based Canvas

**Duration:** Extended session
**Focus:** Complete replacement of Leaflet tile map with custom SVG canvas

**Outcome:**
- Created `track_clean.svg` by extracting 17 vector paths from `track_outline.svg`, stripping the 1.3MB embedded raster image
- Built `svgPanZoom.js` utility (~90 lines) for pan/zoom via viewBox manipulation
- Full rewrite of `MapView.js` — SVG renderer with inline track paths, 3 distinct cone visuals
- Migrated coordinate system from lat/lng to SVG units (x/y)
- Removed path drawing feature, custom image overlay, haversine distance calculation
- Removed Leaflet, leaflet-rotate, and ESRI tile dependencies from index.html
- Updated all supporting files: Sidebar, Toolbar, storage, export, CSS
- Added v2 format detection — old lat/lng courses rejected gracefully on load/import
- Added `justDraggedRef` pattern to prevent click-after-drag/pan placing unwanted cones

**Challenges:**
- Extracting SVG paths from 1.3MB file (embedded base64 raster made file too large to read directly)
- Preventing click events after drag/pan operations

**Decisions Made:**
- Replace Leaflet entirely (impedance mismatch with fixed SVG canvas)
- Embed track path data directly in MapView.js (avoids async file loading)
- Use `getScreenCTM().inverse()` for coordinate conversion
- Enforce minimum 4px screen size for cones at full zoom-out
- Simplify companion positioning to 2 lines of trig (was 20-line haversine function)

### 2026-03-15 - Rotation Handles, Corner Numbers, Car Marker & Selection Fix

**Duration:** Extended session
**Focus:** Adding visual rotation handles, corner number markers, car marker, and fixing click-deselect race condition

**Outcome:**
- Added visual rotation handles (dashed line + draggable circle) for pointer/guide cones, start/finish lines, and car
- Added corner number markers (white circles with numbers 1-6, auto-incrementing, max 6)
- Added car marker (rounded rectangle, single instance, rotatable)
- Fixed click-deselect race condition that prevented selection from working — rotation handles now appear correctly
- Updated data persistence with auto-migration for new fields (`cornerNumbers`, `carMarker`)

**Challenges:**
- Click-deselect race: `pointerup` selected the cone, then `click` event immediately deselected it
- `setPointerCapture` caused `click` event target to be SVG root instead of the cone element

**Decisions Made:**
- Set `justDraggedRef = true` unconditionally in `handlePointerUpDrag` (not just when `drag.moved`)
- Rotation handle sizing proportional to element size (not fixed pixels)
- Corner numbers auto-increment with gap-filling
- Car marker uses shared `selectedMarker` state with start/finish
- Handle colors: magenta (cones), green (start), gray (finish/car)

---

## Decisions Log

| Date | Decision | Reasoning | Impact |
|------|----------|-----------|--------|
| 2026-02-04 | Reduce maxZoom from 20 to 19 | Tile availability issues at zoom 20 | Slightly less zoom range |
| 2026-02-04 | Remove maxBounds constraint | Conflicts with leaflet-rotate, causes jumping | Map can pan beyond Barber Motorsports area |
| 2026-02-04 | Use two markers for pointer cones | Single composite SVG was complex and buggy | Cleaner code, easier rotation |
| 2026-02-04 | Set rotateWithView: false on markers | Keep cones screen-aligned, not map-aligned | Cones always appear upright on screen |
| 2026-02-04 | Default cone rotation 45° | Lower-right position feels natural | Consistent starting point for new cones |
| 2026-02-04 | Base cone size 6px | Gives ~6px at zoom 18, ~12px at zoom 19 | Appropriate for detailed course design |
| 2026-02-11 | Replace Leaflet with custom SVG canvas | Leaflet's tile/geographic model is impedance mismatch for fixed SVG; discrete zoom is blurry; rotate plugin buggy with bounds | Infinite crisp zoom, zero external map deps, clean rendering |
| 2026-02-11 | Use SVG viewBox for pan/zoom | Native SVG viewport control, no library needed | ~90 lines of code replaces entire map library |
| 2026-02-11 | Migrate lat/lng to x/y coordinates | SVG units are the natural coordinate system for the track | Simpler math, no geographic projections needed |
| 2026-02-11 | Remove path drawing feature | Course defined by cones, not drawn lines; path was rarely used | Cleaner UI, less code to maintain |
| 2026-02-11 | Remove custom image overlay | SVG track replaces satellite imagery entirely | No more cluttered satellite photos |
| 2026-02-11 | Embed path data in MapView.js | Avoids async file loading, keeps app single-page with no fetch | Slightly larger JS file but simpler architecture |
| 2026-02-11 | Top-down cone visuals (circle/triangle) | Matches reference TrackExample.png; cleaner than 3D perspective cones | All 3 cone types visually distinct at any zoom |
| 2026-03-15 | Visual rotation handles (drag-to-rotate) | More intuitive than slider-only rotation; direct manipulation | Users can rotate any directional element by dragging |
| 2026-03-15 | Handle sizing proportional to element | Fixed-pixel handles would look wrong at different zoom levels | Handles scale naturally with zoom |
| 2026-03-15 | Corner numbers max 6 with auto-increment | Typical autocross courses have 4-6 numbered corners | Prevents clutter, auto-fills gaps |
| 2026-03-15 | Single car marker | Only one car position needs visualization at a time | Simple state: object or null |
| 2026-03-15 | Unconditional `justDraggedRef = true` in `handlePointerUpDrag` | `setPointerCapture` causes click target to be SVG root, bypassing interactive check → deselect race | Selection works correctly for all element types |

---

## Challenges & Solutions

| Date | Challenge | Status | Solution/Notes |
|------|-----------|--------|----------------|
| 2026-02-04 | Map jumping/zooming on click | Resolved | Removed maxBounds constraint |
| 2026-02-04 | Pointer cone SVG rendering incorrectly | Resolved | Split into two separate markers |
| 2026-02-04 | Start/finish line large click area | Resolved | CSS pointer-events on specific elements |
| 2026-02-04 | Sidebar content overflow | Resolved | Added overflow-y: auto |
| 2026-02-11 | 1.3MB SVG file too large to read directly | Resolved | Used Python script to extract path data, stripped base64 raster image |
| 2026-02-11 | Click fires after drag/pan ends | Resolved | `justDraggedRef` pattern — set flag on drag end, check/clear in click handler |
| 2026-03-15 | Click-deselect race: selection immediately undone | Resolved | Set `justDraggedRef = true` unconditionally in `handlePointerUpDrag`, not just when `drag.moved` |
| 2026-03-15 | `setPointerCapture` changes click event target | Resolved | Understood as root cause of deselect race — captured click targets SVG root, bypassing `data-interactive` check |

---

## Changelog

2026-03-15: Fixed click-deselect race — `justDraggedRef` now set unconditionally in `handlePointerUpDrag`
2026-03-15: Selection and rotation handles now work correctly for all element types
2026-03-15: Added corner number markers (1-6) with auto-increment and gap-filling
2026-03-15: Added car marker (rounded rectangle, single instance, rotatable)
2026-03-15: Added visual rotation handles (dashed line + draggable circle) for cones, markers, and car
2026-03-15: Added data migration in storage.js for `cornerNumbers` and `carMarker` fields
2026-02-11: v2 complete — replaced Leaflet with custom SVG canvas, infinite zoom, distinct cone visuals
2026-02-11: Created track_clean.svg (12KB) from track_outline.svg (1.3MB)
2026-02-11: Built svgPanZoom.js utility for pan/zoom via viewBox
2026-02-11: Full rewrite of MapView.js as SVG renderer
2026-02-11: Migrated coordinates from lat/lng to x/y (SVG units)
2026-02-11: Removed Leaflet, leaflet-rotate, ESRI tile dependencies
2026-02-11: Removed path drawing and custom image overlay features
2026-02-11: Added v2 format detection in storage.js
2026-02-11: Added per-type cone counts in sidebar stats
2026-02-04: Implemented pointer/guide cone rotation system with companion markers
2026-02-04: Added leaflet-rotate plugin, set 39° bearing
2026-02-04: Fixed sidebar scrolling
2026-02-04: Reduced start/finish line clickable area
2026-02-04: Added size calibration sliders
2026-02-04: Changed start/finish from flags to rotatable lines
2026-02-04: Added three cone types (Standard, Pointer, Guide)
2026-02-04: Fixed maxZoom (20→19)

---

## Notes & Ideas

### Future Enhancements
- Undo/redo functionality
- Course templates
- Scale bar (SVG units → real-world feet/meters)
- Multiple course layers
- Share courses via URL
- ~~Drag handle for direct cone rotation (instead of slider only)~~ (done — rotation handles)

### Technical Notes
- SVG viewBox: `0 0 431.8 279.4` (derived from Inkscape 17in × 11in at 25.4 units/inch)
- Zoom: scale viewBox width/height; pan: shift viewBox x/y
- `getScreenCTM().inverse()` converts screen pixels → SVG coordinates
- `justDraggedRef` prevents click-after-drag/pan
- `data-interactive` attribute prevents pan when clicking cones
- Companion position: `x + offset * cos(angle)`, `y + offset * sin(angle)`
- Minimum cone display size: 4 screen pixels (prevents vanishing at full zoom-out)
- Rotation handles: `renderRotationHandle()` in MapView, angle via `Math.atan2(dy, dx)`
- Corner numbers: `REAL_LIFE_CORNER_RADIUS = 3.5`, min 15px display, stored in `course.cornerNumbers`
- Car marker: `REAL_LIFE_CAR_WIDTH = 1.63`, `REAL_LIFE_CAR_HEIGHT = 0.82`, stored in `course.carMarker`
- `justDraggedRef` must be set unconditionally (not just on `drag.moved`) due to `setPointerCapture` retargeting click events

### References
- SVG viewBox: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox
- getScreenCTM: https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM
- html-to-image: https://github.com/bubkoo/html-to-image

### Venue Info
- Track: Barber Motorsports Park NW autocross area
- SVG dimensions: 431.8 × 279.4 units
- 17 paths: 1 outline + 8 islands (outer + inner each)
