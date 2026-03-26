# Blender Export Feature - Handoff Document

## Goal

Add two new export options to the AutoX Track Designer web app that bridge into a Blender → Assetto Corsa sim racing track creation pipeline. The parking lot autocross layout (2D SVG paths + cone positions) needs to become 3D geometry in Blender for eventual use with Assetto Corsa mods.

**Pipeline**: Web app export → Blender 3D modeling (AC Tools add-on) → ksEditor or KN5 exporter → Assetto Corsa

---

## Project Architecture (Current State)

- **Stack**: React 18 + Babel standalone, no build tools, script tags in HTML
- **No module system**: all components exposed via `window.ComponentName`
- **SVG-based renderer**: custom pan/zoom via viewBox manipulation
- **Coordinate system**: viewBox `0 0 431.8 279.4` (from Inkscape 17"×11" doc, units are mm)
- **No real-world scale factor exists** — SVG units don't map to meters yet

### Key Files

| File | Purpose |
|------|---------|
| `js/app.js` | Main React component, all state management, keyboard shortcuts |
| `js/components/MapView.js` | SVG renderer, track paths (lines 4-22), cone rendering, drag/pan |
| `js/components/Sidebar.js` | Controls, calibration sliders, action buttons, stats |
| `js/components/Toolbar.js` | Tool selection (select, cone types, start, finish, eraser) |
| `js/utils/svgPanZoom.js` | Pan/zoom via viewBox + getScreenCTM |
| `js/utils/storage.js` | localStorage persistence, JSON import/export |
| `js/utils/export.js` | PNG export via html-to-image (only current export) |
| `css/styles.css` | All styling |
| `index.html` | Entry point, all script tags |
| `track_clean.svg` | Clean vector track file (reference only, not used at runtime) |

### Track Geometry

17 SVG path strings are hardcoded in `MapView.js` as the `TRACK_PATHS` object (line 4):
- **1 outline** — main racing surface (complex closed path with M, h, v, c, z commands)
- **8 island pairs** — each with `-outer` and `-inner` paths (obstacles on the surface)

Colors: outline `#E5E5E5`, island outer `#D0D0D0`, island inner `#BFBFBF`

### Course Data Format (v2)

```json
{
  "id": "string",
  "version": 2,
  "name": "string",
  "cones": [
    { "id": "cone-123", "x": 150.5, "y": 120.3, "type": "standard" },
    { "id": "cone-456", "x": 200.1, "y": 90.7, "type": "pointer", "rotation": 45 },
    { "id": "cone-789", "x": 180.0, "y": 110.0, "type": "guide", "rotation": 270 }
  ],
  "startMarker": { "x": 100, "y": 200 },
  "finishMarker": { "x": 300, "y": 150 },
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

Cone types: `standard` (circle), `pointer` (circle + triangle + companion), `guide` (triangle only)

### Existing Export Pattern

Both PNG and JSON exports use the same Blob-download pattern in `export.js` and `storage.js`:
```js
const blob = new Blob([data], { type: mimeType });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.download = filename;
link.href = url;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
```

### UI Patterns

- Sidebar sections: `actions-section`, `calibration-section`, `stats-section` — each with `<h3>` header
- Slider pattern: `.slider-group` with label (`.slider-label` + `.slider-value`) and `<input type="range" className="calibration-slider">`
- Button pattern: `<button className="action-btn">` with inline SVG icon
- Props flow: `App.js` holds state → passes handler props to `Sidebar` → `Sidebar` calls them

---

## Implementation Plan

### Summary of Changes

| File | Type | What |
|------|------|------|
| `js/utils/svgPathParser.js` | **NEW** | SVG path `d` string parser → absolute coordinate segments |
| `js/utils/export.js` | MODIFY | Add `exportBlenderSVG()` and `exportBlenderPython()` |
| `js/components/MapView.js` | MODIFY | Add `window.TRACK_PATHS = TRACK_PATHS;` (1 line after line 22) |
| `js/components/Sidebar.js` | MODIFY | Add "3D Export" section with scale slider + 2 export buttons |
| `js/app.js` | MODIFY | Add `scaleMetersPerUnit` state, 2 handlers, pass props to Sidebar |
| `css/styles.css` | MODIFY | Styles for new section (reuse existing patterns) |
| `index.html` | MODIFY | Add `<script>` tag for `svgPathParser.js` before `export.js` |

### Step 1: SVG Path Parser (`js/utils/svgPathParser.js` — NEW FILE)

Parse SVG path `d` attribute strings into arrays of absolute-coordinate segments. Needed by the Blender Python export to pre-convert track paths into coordinate lists.

**Commands to support**: M/m, L/l, H/h, V/v, C/c, Z/z — these are the only commands used in `TRACK_PATHS`.

**Output format**:
```js
// SvgPathParser.parse(dString) returns array of subpaths:
[
  [
    { type: 'M', x: 178.54, y: 84.03 },
    { type: 'L', x: 183.36, y: 84.03 },
    { type: 'C', cp1x: ..., cp1y: ..., cp2x: ..., cp2y: ..., x: ..., y: ... },
    { type: 'Z' }
  ]
]
```

**Key parsing details**:
- All relative commands (lowercase) are converted to absolute coordinates during parsing
- Handle implicit command repetition (e.g., `c 1,2 3,4 5,6  7,8 9,10 11,12` = two cubic beziers)
- `h 4.8` = horizontal line (only dx), `v 2.6` = vertical line (only dy)
- `z` closes path back to the most recent `M` point
- Expose as `window.SvgPathParser`

### Step 2: Expose TRACK_PATHS Globally (`MapView.js`)

Add one line after the `TRACK_PATHS` const declaration (after line 22):
```js
window.TRACK_PATHS = TRACK_PATHS;
```

### Step 3: App State & Handlers (`app.js`)

```js
// New state — scale factor with localStorage persistence
const [scaleMetersPerUnit, setScaleMetersPerUnit] = React.useState(() => {
    const saved = localStorage.getItem('autox-blender-scale');
    return saved ? parseFloat(saved) : 0.5;
});

React.useEffect(() => {
    localStorage.setItem('autox-blender-scale', String(scaleMetersPerUnit));
}, [scaleMetersPerUnit]);

// Handler functions
const handleExportBlenderSVG = () => {
    ExportUtils.exportBlenderSVG(course, scaleMetersPerUnit, startRotation, finishRotation, lineLength);
};

const handleExportBlenderPython = () => {
    ExportUtils.exportBlenderPython(course, scaleMetersPerUnit, startRotation, finishRotation, lineLength);
};
```

Pass to `<Sidebar>`: `scaleMetersPerUnit`, `onScaleChange={setScaleMetersPerUnit}`, `onExportBlenderSVG`, `onExportBlenderPython`

### Step 4: Sidebar "3D Export" Section (`Sidebar.js`)

Add after the existing "Actions" section (after line 134), before "Size Calibration":

- Accept new props: `scaleMetersPerUnit`, `onScaleChange`, `onExportBlenderSVG`, `onExportBlenderPython`
- **Scale slider**: range 0.1–2.0, step 0.05, default 0.5, label "Scale (m/unit)"
- **Lot size readout**: `{(431.8 * scale).toFixed(0)}m × {(279.4 * scale).toFixed(0)}m` — gives instant feedback on reasonableness
- **"Export SVG (Blender)"** button (`.action-btn`)
- **"Export Blender Script"** button (`.action-btn`)

### Step 5: Export Functions (`export.js`)

#### `ExportUtils.exportBlenderSVG(course, scale, startRotation, finishRotation, lineLength)`

Builds a standalone SVG string containing:
1. XML declaration and comment header with coordinate system docs
2. `<desc>` element with scale metadata and course name
3. `<g id="track-surface">` — all 17 paths from `window.TRACK_PATHS` with semantic IDs and correct fills
4. `<g id="cones">` — each cone as `<circle>` with `data-type` and `data-rotation` attributes
5. `<g id="markers">` — start/finish as `<line>` elements with rotation transforms

Downloads as `{courseName}-blender.svg`

#### `ExportUtils.exportBlenderPython(course, scale, startRotation, finishRotation, lineLength)`

Generates a Python script for Blender's text editor. The JS code:

1. **Parses all SVG paths** using `SvgPathParser.parse()` for each path in `TRACK_PATHS`
2. **Converts to Python data literals** — arrays of `(x, y)` tuples and bezier control points, pre-scaled and axis-swapped
3. **Embeds into a Python script template** that uses `bpy` to:

**Coordinate mapping** (SVG → Blender):
- SVG X → Blender X (multiply by scale)
- SVG Y → Blender -Y (negate, multiply by scale) — SVG is Y-down, Blender is Y-up
- Z = 0 (flat parking lot)

**Python script structure**:
```python
"""
AutoX Track Designer - Blender Import Script
Course: {name} | Scale: 1 SVG unit = {scale}m
Lot: {w}m × {h}m | Usage: Run in Blender Text Editor
"""
import bpy
import mathutils

SCALE = 0.5
COURSE_NAME = "My Course"

# --- Pre-parsed track path data (generated by JS) ---
TRACK_PATHS = {
    "outline": {
        "subpaths": [
            [
                {"type": "M", "x": 89.27, "y": -42.01},
                {"type": "C", "cp1": (89.27, -42.01), "cp2": (89.26, -41.20), "end": (89.27, -40.70)},
                ...
            ]
        ]
    },
    ...
}

CONES = [
    {"id": "cone-123", "x": 75.25, "y": -60.15, "type": "standard", "rotation": 0},
    ...
]

START_MARKER = {"x": 50.0, "y": -100.0, "rotation": 0}
FINISH_MARKER = {"x": 150.0, "y": -75.0, "rotation": 90}

# --- Create collection ---
collection = bpy.data.collections.new(COURSE_NAME)
bpy.context.scene.collection.children.link(collection)

# --- Create track curves ---
for name, path_data in TRACK_PATHS.items():
    curve_data = bpy.data.curves.new(name, 'CURVE')
    curve_data.dimensions = '2D'
    for subpath in path_data["subpaths"]:
        spline = curve_data.splines.new('BEZIER')
        # ... add bezier points from pre-parsed data
        # M → first point
        # C → bezier point with left/right handles from cp1/cp2
        # L/H/V → bezier point with aligned handles (straight)
        # Z → spline.use_cyclic_u = True
    obj = bpy.data.objects.new(name, curve_data)
    collection.objects.link(obj)

# --- Create cones ---
for cone in CONES:
    bpy.ops.mesh.primitive_cone_add(
        radius1=0.15, radius2=0, depth=0.45,
        location=(cone["x"], cone["y"], 0.225)
    )
    obj = bpy.context.active_object
    obj.name = f"Cone_{cone['type']}_{cone['id'][-6:]}"
    collection.objects.link(obj)
    bpy.context.scene.collection.objects.unlink(obj)

# --- Create start/finish empties ---
# ... add empty objects with rotation at marker positions

print(f"Imported '{COURSE_NAME}': {len(TRACK_PATHS)} paths, {len(CONES)} cones")
```

### Step 6: HTML & CSS

**`index.html`** — add before the `export.js` script tag:
```html
<script type="text/babel" src="js/utils/svgPathParser.js"></script>
```

**`css/styles.css`** — add `.blender-export-section` matching existing `.calibration-section` (same padding, border, h3 styles). The lot-size readout uses existing `.stat-item` / `.stat-value` patterns.

---

## Blender/Assetto Corsa Pipeline Reference

### After Export — Blender Workflow

1. **Run the .py script** in Blender's Text Editor → creates collection with track curves + cones
2. **Install AC Tools add-on** (`extensions.blender.org/add-ons/ac-tools/`) — provides:
   - `AC_road`: converts curves to road mesh, shrinkwraps onto terrain
   - `AC_terrain`: generates terrain geometry
3. **Install AC Track Tools** (`github.com/nendotools/ac-track-tools`) — provides:
   - Surface/material assignment
   - Track node placement (AC_START_0, pit boxes, timing gates)
   - Map generation, reverb zones, layout variants
4. Select track curves → use AC_road to generate road mesh with width
5. Assign materials/surfaces per the AC workflow
6. Export as FBX2012 (scale 0.01 for AC compatibility)

### Assetto Corsa Integration

- **ksEditor**: imports FBX, configures shaders/materials, exports KN5 (AC's native format)
- **Alternative**: Blender KN5 exporter (`site.hagn.io/assettocorsa/blender-kn5-exporter`)
- **KN5 format**: contains textures, materials (shader defs), and geometry nodes
- **Special naming**: `AC_START_0` = start position, `1ROAD` = road surface
- **Config files**: `surfaces.ini` defines grip/friction per material

### Key Resources

- [AC Track Building Guide](https://assettocorsamods.net/threads/build-your-first-track-basic-guide.12/)
- [AC Tools Blender Extension](https://extensions.blender.org/add-ons/ac-tools/)
- [AC Track Tools](https://github.com/nendotools/ac-track-tools)
- [SVG Import in Blender](https://docs.blender.org/manual/en/latest/addons/import_export/curve_svg.html)
- [Race Track Builder (alternative tool)](https://store.steampowered.com/app/388980/Race_Track_Builder/)
- [TreCorsa (browser-based AC track builder)](https://trecorsa.com/)

---

## Design Decisions & Notes

1. **Pre-parse paths in JS, not Python** — The generated .py file gets clean coordinate arrays instead of raw SVG path strings. Avoids embedding an SVG parser in Python, and the JS parser is reusable for future features (e.g., track length calculation).

2. **Scale default 0.5 m/unit** — Makes the lot ~216m × 140m, reasonable for an autocross venue. The viewBox (431.8 × 279.4) came from Inkscape's 17"×11" document size in mm.

3. **Coordinate mapping SVG→Blender** — `(x * scale, -y * scale, 0)`. Negate Y because SVG is Y-down, Blender is Y-up. Z=0 for flat surface.

4. **Flat surface assumption** — Autocross tracks are on parking lots. No elevation data needed for initial implementation. Elevation can be added later via Blender's sculpt tools or terrain add-ons.

5. **Cones as mesh objects** — Using `primitive_cone_add` in Blender (not cylinders). Small enough to be visual markers. Type stored in object name for easy filtering.

6. **No existing source code changes beyond what's listed** — The plan only touches the files in the table above. No refactoring, no changes to existing functionality.

---

## Verification Steps

1. Open app in browser → verify "3D Export" section appears in sidebar
2. Adjust scale slider → verify lot-size readout updates (e.g., 0.5 → "216m × 140m")
3. Place cones, set start/finish markers
4. Click "Export SVG (Blender)" → verify `.svg` downloads, contains track paths + cone data
5. Click "Export Blender Script" → verify `.py` downloads, contains valid Python
6. In Blender: `File > Import > SVG` with the exported SVG → track curves appear
7. In Blender: open `.py` in Text Editor → Run Script → collection created with curves, cones, markers
