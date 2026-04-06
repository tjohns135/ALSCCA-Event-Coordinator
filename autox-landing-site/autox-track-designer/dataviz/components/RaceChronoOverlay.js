// RaceChronoOverlay — SVG overlay rendering GPS traces colored by data channel

function RaceChronoOverlay({
    session,
    transform,
    selectedLaps,
    vizMode,
    visible
}) {
    if (!visible || !session || !transform || selectedLaps.length === 0) return null;

    // Color schemes
    const colorSchemes = {
        speed: function(value, min, max) {
            // Green (slow) -> Yellow -> Red (fast)
            var t = max > min ? (value - min) / (max - min) : 0;
            var hue = 120 - t * 120; // 120=green, 60=yellow, 0=red
            return 'hsl(' + hue + ', 85%, 50%)';
        },
        lonG: function(value) {
            // Positive (accel) = green, negative (braking) = red, neutral = gray
            if (value > 0.05) {
                var t = Math.min(value / 0.8, 1);
                return 'hsl(120, ' + (40 + t * 50) + '%, ' + (50 - t * 10) + '%)';
            } else if (value < -0.05) {
                var t = Math.min(Math.abs(value) / 0.8, 1);
                return 'hsl(0, ' + (40 + t * 50) + '%, ' + (50 - t * 10) + '%)';
            }
            return 'hsl(0, 0%, 55%)';
        },
        latG: function(value) {
            // Left (negative) = blue, right (positive) = orange, intensity by magnitude
            var mag = Math.min(Math.abs(value) / 1.0, 1);
            if (value < -0.05) {
                return 'hsl(210, ' + (40 + mag * 50) + '%, ' + (55 - mag * 15) + '%)';
            } else if (value > 0.05) {
                return 'hsl(30, ' + (40 + mag * 50) + '%, ' + (55 - mag * 15) + '%)';
            }
            return 'hsl(0, 0%, 55%)';
        },
        combined: function(value) {
            // Green (low grip) -> Yellow -> Red (at limit)
            var t = Math.min(value / 1.2, 1);
            var hue = 120 - t * 120;
            return 'hsl(' + hue + ', 85%, 50%)';
        }
    };

    // Downsample points to reduce SVG complexity
    const downsample = React.useCallback(function(points, maxPoints) {
        if (points.length <= maxPoints) return points;
        var step = points.length / maxPoints;
        var result = [];
        for (var i = 0; i < maxPoints; i++) {
            result.push(points[Math.floor(i * step)]);
        }
        // Always include last point
        result.push(points[points.length - 1]);
        return result;
    }, []);

    // Build SVG paths grouped by color bucket for performance
    const renderLap = React.useCallback(function(lap, lapIndex) {
        var projected = GeoTransform.projectLap(lap.points, transform);
        var sampled = downsample(projected, 400);

        if (sampled.length < 2) return null;

        // Determine value range for speed mode
        var minSpeed = Infinity, maxSpeed = -Infinity;
        if (vizMode === 'speed') {
            for (var i = 0; i < sampled.length; i++) {
                if (sampled[i].speed < minSpeed) minSpeed = sampled[i].speed;
                if (sampled[i].speed > maxSpeed) maxSpeed = sampled[i].speed;
            }
        }

        // Group segments by color bucket
        var NUM_BUCKETS = 16;
        var buckets = {};

        for (var i = 0; i < sampled.length - 1; i++) {
            var pt = sampled[i];
            var next = sampled[i + 1];

            var color;
            switch (vizMode) {
                case 'speed':
                    color = colorSchemes.speed(pt.speed, minSpeed, maxSpeed);
                    break;
                case 'lonG':
                    color = colorSchemes.lonG(pt.lonG);
                    break;
                case 'latG':
                    color = colorSchemes.latG(pt.latG);
                    break;
                case 'combined':
                    color = colorSchemes.combined(pt.combG);
                    break;
                default:
                    color = colorSchemes.speed(pt.speed, minSpeed, maxSpeed);
            }

            if (!buckets[color]) {
                buckets[color] = '';
            }
            buckets[color] += 'M' + pt.x.toFixed(2) + ',' + pt.y.toFixed(2) +
                              'L' + next.x.toFixed(2) + ',' + next.y.toFixed(2);
        }

        // Render one <path> per color bucket
        var opacity = selectedLaps.length > 1 ? 0.7 + 0.3 * (lapIndex === 0 ? 1 : 0) : 1;
        var elements = [];
        var colorKeys = Object.keys(buckets);
        for (var c = 0; c < colorKeys.length; c++) {
            elements.push(
                React.createElement('path', {
                    key: 'lap-' + lap.lapNumber + '-c-' + c,
                    d: buckets[colorKeys[c]],
                    stroke: colorKeys[c],
                    strokeWidth: 0.4,
                    fill: 'none',
                    strokeLinecap: 'round',
                    opacity: opacity
                })
            );
        }

        return React.createElement('g', {
            key: 'racechrono-lap-' + lap.lapNumber,
            'data-lap': lap.lapNumber
        }, ...elements);
    }, [transform, vizMode, selectedLaps, downsample]);

    // Render selected laps
    var lapElements = [];
    for (var i = 0; i < session.laps.length; i++) {
        var lap = session.laps[i];
        if (selectedLaps.includes(lap.lapNumber)) {
            var el = renderLap(lap, lapElements.length);
            if (el) lapElements.push(el);
        }
    }

    return React.createElement('g', {
        id: 'racechrono-overlay-layer',
        'data-racechrono-drag': 'true'
    }, ...lapElements);
}

window.RaceChronoOverlay = RaceChronoOverlay;
