// FrictionCircle — HTML-positioned overlay showing lateral vs longitudinal G scatter plot

function FrictionCircle({
    session,
    selectedLaps,
    visible
}) {
    if (!visible || !session || selectedLaps.length === 0) return null;

    var SIZE = 160;
    var RADIUS = 65;
    var CENTER = SIZE / 2;
    var MAX_G = 1.2;
    var scale = RADIUS / MAX_G;

    // Lap colors for multi-lap differentiation
    var lapColors = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#A855F7', '#EC4899', '#14B8A6'];

    var dotElements = [];

    for (var i = 0; i < session.laps.length; i++) {
        var lap = session.laps[i];
        if (!selectedLaps.includes(lap.lapNumber)) continue;

        var color = lapColors[i % lapColors.length];
        var points = lap.points;
        // Downsample to max ~200 dots per lap
        var step = Math.max(1, Math.floor(points.length / 200));

        for (var p = 0; p < points.length; p += step) {
            var pt = points[p];
            // Lateral G on X axis, Longitudinal G on Y axis (braking up)
            var cx = CENTER + pt.latG * scale;
            var cy = CENTER - pt.lonG * scale; // negative lonG (braking) goes up

            dotElements.push(
                React.createElement('circle', {
                    key: 'fc-' + lap.lapNumber + '-' + p,
                    cx: cx,
                    cy: cy,
                    r: 1,
                    fill: color,
                    opacity: 0.5
                })
            );
        }
    }

    return React.createElement('div', { className: 'friction-circle-container' },
        React.createElement('svg', {
            width: SIZE,
            height: SIZE,
            viewBox: '0 0 ' + SIZE + ' ' + SIZE
        },
            // Background
            React.createElement('rect', {
                x: 0, y: 0, width: SIZE, height: SIZE,
                fill: 'rgba(20, 20, 25, 0.85)',
                rx: 8
            }),

            // Max G circle
            React.createElement('circle', {
                cx: CENTER, cy: CENTER, r: RADIUS,
                fill: 'none',
                stroke: 'rgba(255,255,255,0.15)',
                strokeWidth: 1
            }),

            // 0.5G circle
            React.createElement('circle', {
                cx: CENTER, cy: CENTER, r: 0.5 * scale,
                fill: 'none',
                stroke: 'rgba(255,255,255,0.08)',
                strokeWidth: 0.5
            }),

            // 1.0G circle
            React.createElement('circle', {
                cx: CENTER, cy: CENTER, r: 1.0 * scale,
                fill: 'none',
                stroke: 'rgba(255,255,255,0.1)',
                strokeWidth: 0.5
            }),

            // Crosshair axes
            React.createElement('line', {
                x1: CENTER - RADIUS, y1: CENTER, x2: CENTER + RADIUS, y2: CENTER,
                stroke: 'rgba(255,255,255,0.2)', strokeWidth: 0.5
            }),
            React.createElement('line', {
                x1: CENTER, y1: CENTER - RADIUS, x2: CENTER, y2: CENTER + RADIUS,
                stroke: 'rgba(255,255,255,0.2)', strokeWidth: 0.5
            }),

            // Data dots
            ...dotElements,

            // Labels
            React.createElement('text', {
                x: CENTER, y: CENTER - RADIUS - 5,
                textAnchor: 'middle', fill: 'rgba(255,255,255,0.5)',
                fontSize: 8, fontFamily: 'system-ui'
            }, 'Brake'),
            React.createElement('text', {
                x: CENTER, y: CENTER + RADIUS + 12,
                textAnchor: 'middle', fill: 'rgba(255,255,255,0.5)',
                fontSize: 8, fontFamily: 'system-ui'
            }, 'Accel'),
            React.createElement('text', {
                x: CENTER - RADIUS - 5, y: CENTER + 3,
                textAnchor: 'end', fill: 'rgba(255,255,255,0.5)',
                fontSize: 8, fontFamily: 'system-ui'
            }, 'L'),
            React.createElement('text', {
                x: CENTER + RADIUS + 5, y: CENTER + 3,
                textAnchor: 'start', fill: 'rgba(255,255,255,0.5)',
                fontSize: 8, fontFamily: 'system-ui'
            }, 'R'),

            // Title
            React.createElement('text', {
                x: SIZE - 6, y: 14,
                textAnchor: 'end', fill: 'rgba(255,255,255,0.4)',
                fontSize: 8, fontFamily: 'system-ui'
            }, 'G-Force')
        )
    );
}

window.FrictionCircle = FrictionCircle;
