# AutoX Track Designer — Study Guide

## Project Overview
A web-based autocross course designer that allows users to place cones, set start/finish lines, and design racing courses on a clean SVG vector track surface. Built for autocross event organizers to design and visualize course layouts before physical setup.

**Target Users:** Autocross event organizers, course designers, racing enthusiasts

## Requirements

### Tools Needed
- Modern web browser (Chrome, Firefox, Edge)
- Text/code editor (VS Code recommended)
- Local web server (Live Server extension, Python http.server, or similar)

### No Installation Required
All dependencies loaded via CDN:
- React 18
- Babel (for JSX transpilation)
- html-to-image (for PNG export)

### Running the App
```bash
# Option 1: VS Code Live Server
# Right-click index.html → "Open with Live Server"

# Option 2: Python
cd autox-track-designer
python -m http.server 8000
# Open http://localhost:8000
```

---

## Revision History

| Date | Summary |
|------|---------|
| 2026-03-15 | **Bug Fix:** Click-deselect race condition — selection now works, rotation handles appear |
| 2026-03-15 | **Corner Numbers:** Placeable numbered markers (1-6) for labeling course sections |
| 2026-03-15 | **Car Marker:** Rotatable car rectangle for visualizing vehicle position |
| 2026-03-15 | **Rotation Handles:** Visual drag-to-rotate handles for cones, markers, and car |
| 2026-02-11 | **v2 Redesign:** Replaced Leaflet with custom SVG canvas, infinite zoom, distinct cone visuals |
| 2026-02-04 | Pointer/guide cone rotation system with companion markers |
| 2026-02-04 | Added leaflet-rotate plugin for 39° map rotation |
| 2026-02-04 | Start/finish changed from flags to rotatable lines |
| 2026-02-04 | Added three cone types: Standard, Pointer, Guide |
| 2026-02-04 | Added size calibration sliders |
| 2026-02-04 | Fixed maxZoom (20→19) |

---

## Outline / Syllabus

1. [Session 1: Core Features — Cone Types & Calibration](#session-1-core-features--cone-types--calibration)
2. [Session 2: Map Rotation & Interaction Fixes](#session-2-map-rotation--interaction-fixes)
3. [Session 3: Pointer/Guide Cone Rotation System](#session-3-pointerguide-cone-rotation-system)
4. [Session 4: v2 Redesign — SVG-Based Canvas](#session-4-v2-redesign--svg-based-canvas)
5. [Session 5: Rotation Handles, Corner Numbers & Car Marker](#session-5-rotation-handles-corner-numbers--car-marker)
6. [Session 6: Click-Deselect Race Condition Fix](#session-6-click-deselect-race-condition-fix)

---

## Session 1: Core Features — Cone Types & Calibration
**Date:** 2026-02-04

**Topics Covered:**
- Three cone types: Standard (upright), Pointer (upright + sideways), Guide (sideways)
- Size calibration sliders for real-time adjustment
- Start/finish lines replacing flag markers
- Zoom-based cone scaling

**Decisions Made:**

| Decision | Choice |
|----------|--------|
| Cone types | Standard, Pointer, Guide (3 separate tools) |
| Start/finish visual | Horizontal lines (green/checkered) instead of flags |
| Size sliders | Base Cone Size, Line Length, Rotation per line |
| Max zoom | Reduced from 20 to 19 (tile availability) |

**Key Learnings:**
- Leaflet `L.divIcon` allows custom SVG markers
- Zoom scaling: `size = baseSize * 2^(zoom - BASE_ZOOM)`
- SVG transforms can flip/rotate cone directions

**Files Created:** None (modifications only)

**Files Modified:**
- `js/components/MapView.js` — New cone icon functions, line markers
- `js/components/Toolbar.js` — Three cone buttons + swap button
- `js/components/Sidebar.js` — Calibration sliders section
- `js/app.js` — New state variables for cone direction and sizes
- `css/styles.css` — Calibration slider styles

**State:** Development

**What's Working:**
- Three cone type buttons in toolbar
- Size sliders adjust markers in real-time
- Start/finish lines with rotation

---

## Session 2: Map Rotation & Interaction Fixes
**Date:** 2026-02-04

**Topics Covered:**
- leaflet-rotate plugin integration
- Fixing map interaction issues with rotation
- Sidebar scrolling fix

**Decisions Made:**

| Decision | Choice |
|----------|--------|
| Rotation plugin | leaflet-rotate@0.2.8 via CDN |
| Default bearing | 39° clockwise |
| maxBounds | Removed (conflicts with rotation) |
| Marker rotation | `rotateWithView: false` (screen-aligned) |

**Key Learnings:**
- `maxBounds` causes jumping/zoom issues with rotated maps
- Markers need `rotateWithView: false` to stay screen-aligned
- Rotation options: `rotate: true`, `bearing: 39`, `touchRotate: true`

**Questions Asked & Answered:**
1. **Why does the map jump when clicking?** → `maxBounds` constraint conflicts with rotation calculations. Solution: Remove maxBounds.

**Files Modified:**
- `index.html` — Added leaflet-rotate CSS/JS
- `js/components/MapView.js` — Rotation options, removed maxBounds
- `css/styles.css` — Sidebar `overflow-y: auto`

**State:** Development

**What's Working:**
- Map rotated 39° clockwise
- Smooth pan/zoom with rotation
- Sidebar scrolls when content overflows

---

## Session 3: Pointer/Guide Cone Rotation System
**Date:** 2026-02-04

**Topics Covered:**
- Refactoring pointer/guide cones to use rotation angle instead of left/right
- Companion markers for pointer cones
- Cone selection and rotation adjustment via slider
- Pulsing animation for selected cones

**Decisions Made:**

| Decision | Choice |
|----------|--------|
| Data model | `rotation: 0-360` replaces `direction: 'left'\|'right'` |
| Default rotation | 45° (lower-right, pointing up-left) |
| Companion offset | 0.75x cone width |
| Selection visual | Pulsing glow animation |
| Cone size range | 4-24px base (slider), ~6px default |

**Key Learnings:**
- Pointer cones render as TWO markers: main (upright) + companion (sideways orbiting)
- Guide cones use CSS `transform: rotate()` for direction
- Geographic offset calculation: convert pixel offset to lat/lng degrees
- Selection state enables per-cone rotation editing

**Architecture:**
```
Pointer Cone:
┌─────────────────────────────────────┐
│  Main Marker (upright cone)         │
│  at stored lat/lng                  │
│           ↑                         │
│           │ 0.75x offset            │
│           │ at rotation angle       │
│           ↓                         │
│  Companion Marker (sideways cone)   │
│  points back at main                │
└─────────────────────────────────────┘

Guide Cone:
┌─────────────────────────────────────┐
│  Single sideways cone               │
│  CSS rotation = angle + 180°        │
│  (0° = pointing right)              │
└─────────────────────────────────────┘
```

**Interaction Flow:**
1. Select Pointer/Guide tool → click to place (default 45°)
2. Switch to Select tool
3. Click pointer/guide cone → cone pulses, slider appears
4. Drag rotation slider (0-360°) → updates in real-time
5. Click "Deselect" to finish

**Files Modified:**
- `js/app.js` — `selectedConeId` state, rotation handlers, removed `coneDirection`
- `js/components/Toolbar.js` — Removed swap button
- `js/components/Sidebar.js` — Selected cone section with rotation slider
- `js/components/MapView.js` — Companion markers, `getCompanionPosition()`, selection logic
- `css/styles.css` — Pulsing animation, selected cone section

**State:** Development (superseded by v2)

**What's Working:**
- Pointer cones place upright + orbiting sideways cone
- Guide cones rotate to point in any direction
- Click to select, slider to adjust rotation
- Selected cones pulse with glow effect
- Companion markers follow main cone when dragged

---

## Session 4: v2 Redesign — SVG-Based Canvas
**Date:** 2026-02-11

**Topics Covered:**
- Replacing Leaflet tile map with custom SVG pan/zoom canvas
- Extracting vector paths from `track_outline.svg` (stripping embedded raster)
- Top-down cone visuals (circle, circle+triangle, triangle)
- SVG `viewBox` manipulation for pan/zoom
- `getScreenCTM().inverse()` for screen-to-SVG coordinate conversion
- Coordinate migration from `lat`/`lng` to `x`/`y` (SVG units)
- Removing path drawing and custom image overlay features

**Decisions Made:**

| Decision | Choice |
|----------|--------|
| Map technology | Custom SVG canvas replaces Leaflet entirely |
| Coordinate system | SVG units (viewBox 0 0 431.8 279.4) replaces lat/lng |
| Zoom method | `viewBox` width/height scaling — infinite, crisp at any level |
| Cone visuals | Top-down: filled circle, circle+triangle, triangle only |
| Pan/zoom library | None — ~90 lines of custom code (`svgPanZoom.js`) |
| Track surface | Grayscale fills (pavement #E5E5E5, islands #D0D0D0/#BFBFBF) |
| Path feature | Removed (course defined by cones, not drawn lines) |
| Image overlay | Removed (SVG track replaces satellite imagery) |
| Data format | v2 with `x`/`y` coordinates; old `lat`/`lng` rejected on load |

**Key Learnings:**

1. **Why not keep Leaflet?** Even with `L.CRS.Simple`, Leaflet's tile/geographic model is an impedance mismatch for a fixed SVG canvas. Zoom is discrete (blurry between levels), the rotate plugin is buggy with bounds, and every API call expects lat/lng. Clean start is simpler.

2. **SVG viewBox as viewport** — The `viewBox` attribute controls what portion of the SVG is visible. Changing `x,y` pans, changing `width,height` zooms. The browser handles all rendering — no tiles, no blurriness.

3. **`getScreenCTM().inverse()`** — This is the key to converting mouse clicks (screen pixels) to SVG coordinates. `getScreenCTM()` returns the Current Transformation Matrix that maps SVG units to screen pixels. Inverting it maps screen pixels back to SVG units. This replaces Leaflet's `containerPointToLatLng()`.

4. **Zoom toward cursor** — When zooming, you want the point under the cursor to stay fixed. The math:
   ```
   scale = newWidth / oldWidth
   newX = cursorSVG_X - (cursorSVG_X - oldViewBox.x) * scale
   newY = cursorSVG_Y - (cursorSVG_Y - oldViewBox.y) * scale
   ```

5. **`justDraggedRef` pattern** — After a drag/pan ends, the browser fires a `click` event. Without guarding against this, dragging a cone would place a new cone at the drop point. Setting `justDraggedRef = true` on drag end and checking/clearing it in the click handler prevents this.

6. **`data-interactive` attribute** — SVG elements that should be clickable (cones, markers) get `data-interactive="true"`. The pan handler checks `e.target.closest('[data-interactive]')` and skips pan start if true. This prevents pan from stealing clicks on cones.

7. **Minimum screen-size cones** — At full zoom-out, cones in SVG units might render as sub-pixel dots. The `getDisplayRadius()` function enforces a minimum of 4 screen pixels by comparing the SVG-to-pixel ratio.

8. **Companion positioning simplification** — v1 used a 20-line haversine-based function to position companion cones. v2 uses 2 lines of simple trig: `x + offset * cos(angle)`, `y + offset * sin(angle)`.

**Architecture:**
```
SVG Canvas Structure:
┌──────────────────────────────────────────────────────────┐
│ <svg viewBox="x y w h">                                  │
│   <defs>                                                 │
│     <filter id="cone-glow">  (selection highlight)       │
│   </defs>                                                │
│                                                          │
│   <g id="track-surface">                                 │
│     <path id="outline" fill="#E5E5E5" />  (pavement)     │
│     <path id="island1-outer" fill="#D0D0D0" />           │
│     <path id="island1-inner" fill="#BFBFBF" />           │
│     ... (17 paths total: 1 outline + 8×2 islands)        │
│   </g>                                                   │
│                                                          │
│   <g id="cones-layer">                                   │
│     <circle /> (standard cone)                           │
│     <circle /><polygon /> (pointer: circle + triangle)   │
│     <polygon /> (guide: triangle only)                   │
│   </g>                                                   │
│                                                          │
│   <g id="markers-layer">                                 │
│     <line /> + <text>START</text>                        │
│     <line /> + <text>FINISH</text>                       │
│   </g>                                                   │
│ </svg>                                                   │
└──────────────────────────────────────────────────────────┘

Pan/Zoom Flow:
  Mouse wheel → scale viewBox w/h → zoom toward cursor
  Mouse drag (background) → shift viewBox x/y → pan
  Mouse drag (cone) → update cone x/y → move

Coordinate Conversion:
  screenToSVG(svgEl, clientX, clientY)
    → svgEl.createSVGPoint()
    → pt.matrixTransform(svgEl.getScreenCTM().inverse())
    → { x, y } in SVG units
```

**Files Created:**
- `track_clean.svg` — Clean vector track (12KB), 17 paths, grayscale fills
- `js/utils/svgPanZoom.js` — Custom pan/zoom utility (~90 lines)

**Files Modified (full rewrite):**
- `js/components/MapView.js` — SVG renderer with inline track paths, cone rendering, drag/pan
- `js/app.js` — lat/lng → x/y, removed path/image features, simplified calibration
- `js/components/Sidebar.js` — Removed image upload, path stats; added per-type cone counts
- `js/components/Toolbar.js` — Removed path tool, updated cone icons to top-down style
- `js/utils/storage.js` — v2 format, old format detection/rejection
- `js/utils/export.js` — Removed haversine, distance calc, imageToDataUrl
- `index.html` — Removed Leaflet/leaflet-rotate CDN deps, added svgPanZoom.js
- `css/styles.css` — Removed Leaflet styles, added SVG canvas styles

**State:** Development

**What's Working:**
- Clean SVG track surface renders with pavement and islands
- Infinite smooth zoom, track stays crisp at any level
- Pan by dragging background, zoom toward cursor with scroll wheel
- Three visually distinct cone types (circle, circle+triangle, triangle)
- Drag cones to move, right-click to delete, eraser tool
- Pointer cone rotation with companion at offset
- Start/finish timing gate lines with text labels
- Selection with glow filter, rotation slider
- PNG export via html-to-image
- JSON save/load with v2 format validation
- Old v1 lat/lng courses detected and rejected gracefully

**Next Steps:**
- Rotation handles, corner numbers, car marker (→ Session 5)

---

## Session 5: Rotation Handles, Corner Numbers & Car Marker
**Date:** 2026-03-15

**Topics Covered:**
- Visual rotation handles (dashed line + draggable circle) for cones, start/finish, car
- Corner number markers (numbered circles, max 6)
- Car marker (rounded rectangle, single instance)
- Extending the selection system to new element types

**Decisions Made:**

| Decision | Choice |
|----------|--------|
| Rotation UI | Dashed line extending from element center to a draggable circle handle |
| Handle colors | Magenta (cones), green (start), gray (finish), dark gray (car) |
| Handle sizing | Proportional to element — 10× cone radius for arm, 0.7× line length for markers |
| Corner numbers | White circles with bold number text, max 6, auto-incrementing |
| Corner number size | `REAL_LIFE_CORNER_RADIUS = 3.5` SVG units, minimum 15px on screen |
| Car shape | Rounded rectangle, `REAL_LIFE_CAR_WIDTH = 1.63`, `REAL_LIFE_CAR_HEIGHT = 0.82` |
| Car max | Single car only (enforced by UI) |
| Car fill | Dark (#111) with stroke (#555 default, red when selected) |
| Selection state | `selectedMarker` shared between 'start', 'finish', 'car' |

**Key Learnings:**

1. **Rotation via `Math.atan2()`** — When dragging a rotation handle, the angle is computed from the element center to the mouse position: `Math.atan2(dy, dx)`. This gives the angle in radians, converted to degrees and normalized to 0-360.

2. **Proportional handle sizing** — Handles scale with element size so they look natural at any zoom level. The arm length is a fixed multiple of the element's display size, not a pixel constant.

3. **Shared selection model** — Rather than separate selection states for each element type, start/finish/car share `selectedMarker` while cones use `selectedConeId` and corner numbers use `selectedCornerNumberId`. Selecting one type deselects others.

4. **Auto-increment corner numbers** — The add handler scans existing numbers 1-6 and assigns the first unused one, so gaps get filled when corners are deleted and re-added.

5. **Data migration in storage** — `storage.js` auto-adds `cornerNumbers: []` and `carMarker: null` to saved courses that don't have them, preventing crashes when loading older saves.

**Architecture:**
```
Rotation Handle Structure:
┌───────────────────────────────────────┐
│  Element center (cone/marker/car)     │
│         │                             │
│         │ dashed line (arm)           │
│         │ length = f(element size)    │
│         │                             │
│         ○ draggable circle (handle)   │
│           ↑ user drags this           │
│           angle = atan2(dy, dx)       │
└───────────────────────────────────────┘

Corner Number Data:
{ id: string, x: number, y: number, number: 1-6 }

Car Marker Data:
{ x: number, y: number, rotation: 0-360 }
```

**Files Modified:**
- `js/app.js` — Corner number handlers, car marker handlers, rotation change handlers
- `js/components/MapView.js` — `renderRotationHandle()`, `renderCornerNumbers()`, `renderCarMarker()`, drag handlers for each
- `js/components/Sidebar.js` — Corner number editing slider, car stats
- `js/components/Toolbar.js` — "Corner #" and "Car" tools
- `js/utils/storage.js` — Data migration for `cornerNumbers` and `carMarker`

**State:** Development

**What's Working:**
- Rotation handles appear on selected pointer/guide cones, start/finish lines, and car
- Drag handle circle to rotate element in real-time
- Corner numbers auto-increment, max 6, editable via sidebar slider
- Car marker placed, moved, rotated, deleted like other elements
- Right-click delete on corner numbers and car
- All new elements persist in localStorage and JSON export

**Next Steps:**
- Fix click-deselect race condition preventing selection from working (→ Session 6)

---

## Session 6: Click-Deselect Race Condition Fix
**Date:** 2026-03-15

**Topics Covered:**
- Diagnosing why clicking cones in Select mode didn't produce selection glow or rotation handles
- Understanding the pointer event lifecycle: `pointerdown` → `pointerup` → `click`
- `setPointerCapture` and its effect on event targets
- The `justDraggedRef` pattern and when it should be set

**Decisions Made:**

| Decision | Choice |
|----------|--------|
| Fix approach | Remove `if (drag.moved)` guard — set `justDraggedRef = true` unconditionally in `handlePointerUpDrag` |

**Key Learnings:**

1. **The race condition** — When clicking a cone (not dragging), three events fire in sequence:
   - `pointerdown` on cone → sets `draggingRef`, calls `setPointerCapture()`
   - `pointerup` (captured to SVG) → `handlePointerUpDrag` selects the cone via `onConeSelect(id)`, clears `draggingRef`
   - `click` fires on SVG → `handleSvgClick` checks: `justDraggedRef` is `false` (wasn't a drag), `draggingRef` is `null` (already cleared), `e.target` is SVG (pointer capture) → calls `onDeselectAll()` ❌

   Result: cone selected and immediately deselected in the same event loop tick.

2. **Why `drag.moved` was the wrong guard** — The original code only set `justDraggedRef = true` when the user actually moved the pointer (a real drag). But for a simple click (no movement), `drag.moved` stays `false`, so the click handler wasn't suppressed.

3. **The fix** — Set `justDraggedRef.current = true` unconditionally at the end of `handlePointerUpDrag`. This is safe because that handler only runs when `draggingRef.current` is set, meaning the user interacted with a specific element — the generic click handler should never also run in that case.

4. **`setPointerCapture` side effect** — When pointer capture is set, subsequent events (including `click`) target the capturing element (the SVG root), not the element under the cursor. This means `e.target.closest('[data-interactive]')` fails in the click handler, bypassing the "clicked on a cone" check.

**Misconceptions Addressed:**
1. **"The rotation handles are broken"** → The handles were fine — the issue was that selection itself was being immediately undone by the click-deselect race, so handles never appeared.

**Files Modified:**
- `js/components/MapView.js` — Removed `if (drag.moved)` guard around `justDraggedRef.current = true` (~line 405)

**State:** Development

**What's Working:**
- Clicking a pointer/guide cone in Select mode now shows pink glow + rotation handle
- Clicking start/finish/car shows selection highlight + rotation handle
- Dragging elements still works without accidental placement
- Click on empty space still deselects correctly
- Click in placement mode still places cones correctly

---

## Glossary

| Term | Definition |
|------|------------|
| **Standard Cone** | Filled circle — a cone seen from above (top-down view) |
| **Pointer Cone** | Circle with directional triangle + companion cone at offset |
| **Guide Cone** | Triangle/arrow only — directional indicator without standing cone |
| **Companion Marker** | Secondary smaller circle+triangle for pointer cones, orbits the main cone |
| **viewBox** | SVG attribute defining the visible rectangle: `x y width height` |
| **getScreenCTM** | SVG method returning the matrix that maps SVG coordinates to screen pixels |
| **justDraggedRef** | React ref used to prevent click events from firing after a drag operation |
| **data-interactive** | Custom HTML attribute marking SVG elements that should intercept clicks (not pan) |
| **SVG units** | Coordinate space of the track SVG (431.8 × 279.4, derived from Inkscape 17in × 11in) |
| **Rotation Handle** | Visual UI: dashed line + draggable circle extending from element center; drag to rotate |
| **Corner Number** | White circle with number (1-6) placed on track to label course sections |
| **Car Marker** | Rounded rectangle representing a vehicle; single instance, rotatable |
| **setPointerCapture** | DOM API that redirects all pointer events to a specific element until released |
| **Click-deselect race** | Bug where `pointerup` selects and subsequent `click` deselects in the same interaction |
