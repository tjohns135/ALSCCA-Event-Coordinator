// Catmull-Rom spline to SVG cubic bezier path conversion

const CatmullRomUtils = {
    // Convert ordered points to a smooth SVG path string
    // points: [{x, y}, ...] — minimum 2 to draw anything
    toSVGPath: function(points) {
        if (!points || points.length < 2) return '';

        if (points.length === 2) {
            return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
        }

        // Pad by duplicating first and last points as virtual neighbors
        const pts = [points[0], ...points, points[points.length - 1]];

        let d = `M ${points[0].x},${points[0].y}`;

        for (let i = 0; i < pts.length - 3; i++) {
            const p0 = pts[i], p1 = pts[i + 1], p2 = pts[i + 2], p3 = pts[i + 3];

            // Catmull-Rom to cubic bezier control points
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
        }

        return d;
    },

    // Sample evenly-spaced points along a Catmull-Rom curve
    // Returns [{x, y, angle}, ...] where angle is tangent direction in degrees
    samplePoints: function(points, spacing) {
        if (!points || points.length < 2 || spacing <= 0) return [];

        // Build bezier segments
        const segments = [];
        if (points.length === 2) {
            // Straight line as a single segment
            segments.push({ p0: points[0], p1: points[0], p2: points[1], p3: points[1], isLine: true });
        } else {
            const pts = [points[0], ...points, points[points.length - 1]];
            for (let i = 0; i < pts.length - 3; i++) {
                const p0 = pts[i], p1 = pts[i + 1], p2 = pts[i + 2], p3 = pts[i + 3];
                const cp1x = p1.x + (p2.x - p0.x) / 6;
                const cp1y = p1.y + (p2.y - p0.y) / 6;
                const cp2x = p2.x - (p3.x - p1.x) / 6;
                const cp2y = p2.y - (p3.y - p1.y) / 6;
                segments.push({
                    start: p1, cp1: { x: cp1x, y: cp1y },
                    cp2: { x: cp2x, y: cp2y }, end: p2
                });
            }
        }

        // Evaluate cubic bezier at t
        const evalBezier = (seg, t) => {
            if (seg.isLine) {
                return {
                    x: seg.p0.x + (seg.p2.x - seg.p0.x) * t,
                    y: seg.p0.y + (seg.p2.y - seg.p0.y) * t
                };
            }
            const u = 1 - t;
            return {
                x: u*u*u*seg.start.x + 3*u*u*t*seg.cp1.x + 3*u*t*t*seg.cp2.x + t*t*t*seg.end.x,
                y: u*u*u*seg.start.y + 3*u*u*t*seg.cp1.y + 3*u*t*t*seg.cp2.y + t*t*t*seg.end.y
            };
        };

        const result = [];
        let accumulated = 0;
        let prevPt = evalBezier(segments[0], 0);
        // Always include the first point
        result.push({ x: prevPt.x, y: prevPt.y, angle: 0 });

        const dt = 0.005;
        for (let s = 0; s < segments.length; s++) {
            const seg = segments[s];
            for (let t = dt; t <= 1.0001; t += dt) {
                const pt = evalBezier(seg, Math.min(t, 1));
                const dx = pt.x - prevPt.x;
                const dy = pt.y - prevPt.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                accumulated += dist;

                if (accumulated >= spacing) {
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    const normalized = ((angle % 360) + 360) % 360;
                    result.push({ x: pt.x, y: pt.y, angle: normalized });
                    accumulated = 0;
                }
                prevPt = pt;
            }
        }

        // Update the first point's angle from the second point if available
        if (result.length >= 2) {
            const a = Math.atan2(result[1].y - result[0].y, result[1].x - result[0].x) * (180 / Math.PI);
            result[0].angle = ((a % 360) + 360) % 360;
        }

        return result;
    }
};

window.CatmullRomUtils = CatmullRomUtils;
