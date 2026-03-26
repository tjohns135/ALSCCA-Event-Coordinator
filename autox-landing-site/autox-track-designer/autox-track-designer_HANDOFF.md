# AutoX Track Designer — Project Handoff

## Summary
Web-based autocross course designer using React 18 + custom SVG canvas (no map library). Users place three cone types (circle, circle+triangle, triangle), set start/finish timing gates, add numbered corner markers (1-6), and position a car marker on a clean vector track surface. Visual rotation handles let users drag-to-rotate any directional element. Infinite zoom, smooth pan, all client-side with localStorage persistence. **Status:** Development — core features working, selection/rotation system functional.

---

## Progress

### Completed
1. **v2 SVG Canvas** — Replaced Leaflet with custom SVG pan/zoom. Track rendered as inline path data with grayscale fills. Infinite crisp zoom via `viewBox` manipulation.
2. **Three Cone Types** — Standard (filled circle), Pointer (circle + triangle + companion), Guide (triangle only). All rendered as SVG elements in dark gray (#333).
3. **Cone Rotation System** — Pointer/guide cones use 0-360° rotation. Companion cones positioned via simple trig (`x + offset * cos(angle)`).
4. **Pan/Zoom** — Custom `svgPanZoom.js` (~90 lines): wheel zoom toward cursor, drag to pan, `getScreenCTM().inverse()` for coordinate conversion.
5. **Start/Finish Lines** — Green line + "START" text, checkered line + "FINISH" text. Rotatable.
6. **Data Format v2** — Coordinates in SVG units (`x`/`y`). Old `lat`/`lng` format detected and rejected on load/import.
7. **Selection System** — Click elements to select (glow filter). Supports cones, start/finish, corner numbers, car.
8. **Rotation Handles** — Visual dashed-line + draggable circle handle appears on selected rotatable elements. Drag to rotate in real-time. Color-coded: magenta (cones), green (start), gray (finish/car). Handle size proportional to element.
9. **Corner Numbers** — Numbered circle markers (1-6) for labeling course sections. Auto-incrementing, editable via sidebar slider, max 6.
10. **Car Marker** — Rounded rectangle (dark fill). Single instance, rotatable. `REAL_LIFE_CAR_WIDTH = 1.63`, `REAL_LIFE_CAR_HEIGHT = 0.82`.
11. **Click-Deselect Fix** — `justDraggedRef` set unconditionally in `handlePointerUpDrag` to prevent `click` event from deselecting after `pointerup` selects.
12. **Export/Import** — PNG via html-to-image, JSON save/load with format validation.

### Removed in v2
- Leaflet, ESRI satellite tiles, leaflet-rotate
- Path drawing feature (pathPoints)
- Custom image overlay (imageBounds, dataUrl)
- Haversine distance calculation

### Upcoming
- Test PNG export quality with SVG canvas
- Mobile/touch device testing
- Consider scale bar

---

## Files

```
autox-track-designer/
├── index.html                  # Entry point, CDN deps (React, Babel, html-to-image)
├── track_outline.svg           # Original SVG with embedded raster (1.3MB, reference)
├── track_clean.svg             # Clean vector track, 17 paths, grayscale (12KB)
├── css/styles.css              # All styling
└── js/
    ├── app.js                  # Main React component, state mgmt, all handlers
    ├── components/
    │   ├── MapView.js          # SVG canvas, track + cones + markers + rotation handles + corner numbers + car
    │   ├── Sidebar.js          # Controls, sliders, stats, corner number editor
    │   └── Toolbar.js          # Tool buttons (select, 3 cones, start, finish, corner #, car, eraser)
    └── utils/
        ├── svgPanZoom.js       # Pan/zoom via viewBox + getScreenCTM (~90 lines)
        ├── storage.js          # localStorage, JSON import/export, data migration
        └── export.js           # PNG export
```

---

## Stack

| Tech | Version | Docs |
|------|---------|------|
| React | 18 | https://react.dev |
| Babel | standalone | https://babeljs.io/docs/babel-standalone |
| html-to-image | 1.11.11 | https://github.com/bubkoo/html-to-image |

All loaded via unpkg CDN — no npm/build required. No map library (Leaflet removed in v2).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App.js                               │
│  State: course, activeTool, selectedConeId, coneRadius, etc │
├─────────────────────────────────────────────────────────────┤
│                           │                                 │
│         ┌─────────────────┴─────────────────┐               │
│         ▼                                   ▼               │
│   ┌───────────┐                      ┌────────────┐        │
│   │  Sidebar  │                      │  MapView   │        │
│   │ - Toolbar │                      │ - SVG el   │        │
│   │ - Sliders │                      │ - viewBox  │        │
│   │ - Stats   │                      │ - Cones    │        │
│   └───────────┘                      └────────────┘        │
└─────────────────────────────────────────────────────────────┘

SVG Canvas Layers:
  <svg viewBox="x y w h">        ← viewport controlled by pan/zoom
    <defs> filter:cone-glow      ← selection highlight
    <g> track-surface            ← 17 inline paths (outline + 8 islands)
    <g> cones-layer              ← circles, polygons per cone
    <g> corner-numbers-layer     ← numbered white circles (1-6)
    <g> markers-layer            ← start/finish lines + text + car rectangle
    <g> rotation-handles-layer   ← dashed lines + draggable circles

Data Models (v2):
  Cone: { id, x, y, type: 'standard'|'pointer'|'guide', rotation?: 0-360 }
  Corner Number: { id, x, y, number: 1-6 }
  Car Marker: { x, y, rotation: 0-360 } | null
  Start/Finish: { x, y, rotation: 0-360 } | null

Selection State:
  selectedConeId         → pointer/guide cone selection
  selectedCornerNumberId → corner number selection
  selectedMarker         → 'start' | 'finish' | 'car'
  (selecting one type deselects others)

Cone Visuals (top-down):
  Standard: ● (filled circle, r=coneRadius)
  Pointer:  ●▶ + ◄○ (circle+triangle + companion circle+triangle at offset)
  Guide:    ▶ (triangle only, direction = rotation°)
```

**Key Decisions:**
- SVG `viewBox` replaces tile-based zoom — infinite resolution, no external tile dependencies
- `getScreenCTM().inverse()` for click → SVG coordinate conversion (replaces Leaflet's `containerPointToLatLng`)
- `justDraggedRef` set unconditionally in `handlePointerUpDrag` — prevents both click-after-drag placement AND click-deselect race
- `data-interactive` attribute on cone/marker SVG elements prevents pan when clicking them
- Companion positioning: `x + offset * cos(rotation)`, `y + offset * sin(rotation)` (replaces 20-line haversine function)
- Minimum 4px screen size enforced for cones via `getDisplayRadius()` so they don't vanish at full zoom-out
- Track path data embedded directly in `MapView.js` as a JS object (not loaded from file)
- Rotation handles sized proportionally to element (not fixed pixels) — look correct at any zoom
- Corner numbers auto-increment with gap-filling (deleted number becomes available again)

---

## TODOs

- [ ] Test PNG export with SVG canvas (html-to-image should work on SVG elements)
- [ ] Mobile/touch device testing
- [ ] Consider scale bar (SVG units → real-world feet/meters)
- [ ] Consider undo/redo system

---

## Run Commands

```bash
# No build step required — just serve index.html

# VS Code Live Server (recommended)
# Install "Live Server" extension → right-click index.html → "Open with Live Server"

# Python
python -m http.server 8000
# → http://localhost:8000

# Node (npx)
npx serve .
```

---

## Resume Guide + Working Agreement

### For Next Session
1. **Read this handoff** — contains all context needed
2. **Verify understanding** — summarize state to user
3. **Ask focus** — "What should we work on this session?"

### Working Agreement
- **Edit style:** Minimal, targeted changes — modify only what's needed
- **Communication:** Concise, high-signal. Clarify misconceptions, push back when challenged but stay open
- **Verification:** Cite sources for technical claims when relevant
- **User skill:** Beginner — use concrete examples, explain design decisions

### Quick Context
- Coordinates are SVG units (viewBox 0 0 431.8 279.4), NOT lat/lng
- Pan/zoom via `viewBox` manipulation in `svgPanZoom.js`
- All components exposed globally via `window.ComponentName` (no module system)
- Cone rendering: standard=circle, pointer=circle+triangle+companion, guide=triangle
- `justDraggedRef` set unconditionally in `handlePointerUpDrag` — prevents click-after-drag AND click-deselect race
- `data-interactive` prevents pan-on-cone
- Rotation handles: `renderRotationHandle()` in MapView, drag uses `Math.atan2()` for angle
- Corner numbers: `course.cornerNumbers` array, max 6, auto-increment with gap-fill
- Car marker: `course.carMarker` object or null, single instance
- Selection is mutually exclusive across types (cone vs corner number vs marker)

---

## Updated
**2026-03-15** — Added rotation handles, corner numbers, car marker; fixed click-deselect race condition that prevented selection/rotation handles from appearing
