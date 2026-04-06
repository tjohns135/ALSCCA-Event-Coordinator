// RaceChrono CSV Parser — Web Worker (plain JS, no Babel)
// Parses Format 3 CSV off the main thread

self.onmessage = function(e) {
    var text = e.data;
    try {
        var result = parseCSV(text);
        self.postMessage({ type: 'result', data: result });
    } catch (err) {
        self.postMessage({ type: 'error', message: err.message });
    }
};

function parseCSV(text) {
    var lines = text.split('\n');
    var totalLines = lines.length;

    // Find the header row (field names) — starts with "timestamp,"
    var headerIdx = -1;
    for (var i = 0; i < Math.min(20, lines.length); i++) {
        if (lines[i].indexOf('timestamp,') === 0) {
            headerIdx = i;
            break;
        }
    }
    if (headerIdx === -1) {
        throw new Error('Could not find RaceChrono Format 3 header (expected "timestamp," row)');
    }

    // Parse column names from header row
    var colNames = lines[headerIdx].split(',');

    // Build column index map for the fields we need
    var cols = {};
    var needed = [
        'timestamp', 'fragment_id', 'lap_number', 'elapsed_time',
        'latitude', 'longitude', 'speed', 'lateral_acc',
        'longitudinal_acc', 'combined_acc', 'distance_traveled', 'bearing'
    ];

    // Some columns appear twice (e.g., speed from GPS and speed from calc).
    // We want the GPS speed first, then calculated. For acc channels, we want calc.
    // The source row (headerIdx+2) tells us: "100: gps", "calc", "101: acc", etc.
    var sourceRow = headerIdx + 2 < lines.length ? lines[headerIdx + 2].split(',') : [];

    for (var n = 0; n < needed.length; n++) {
        var field = needed[n];
        var bestIdx = -1;
        // Prefer GPS source for position/speed, calc for accelerations
        var preferCalc = (field === 'lateral_acc' || field === 'longitudinal_acc' ||
                         field === 'combined_acc' || field === 'lean_angle');
        for (var c = 0; c < colNames.length; c++) {
            if (colNames[c] === field) {
                if (bestIdx === -1) {
                    bestIdx = c;
                }
                // If we prefer calc and this source is calc, pick it
                if (preferCalc && sourceRow[c] && sourceRow[c].trim() === 'calc') {
                    bestIdx = c;
                }
                // If we prefer GPS and this source is GPS, pick it
                if (!preferCalc && sourceRow[c] && sourceRow[c].trim().indexOf('gps') >= 0) {
                    bestIdx = c;
                }
            }
        }
        if (bestIdx >= 0) {
            cols[field] = bestIdx;
        }
    }

    // Validate required columns
    var required = ['timestamp', 'latitude', 'longitude', 'speed'];
    for (var r = 0; r < required.length; r++) {
        if (cols[required[r]] === undefined) {
            throw new Error('Missing required column: ' + required[r]);
        }
    }

    // Parse data rows (skip header + units + source rows)
    var dataStart = headerIdx + 3;
    var lapsMap = {}; // lapKey -> array of points
    var globalMinLat = Infinity, globalMaxLat = -Infinity;
    var globalMinLng = Infinity, globalMaxLng = -Infinity;

    var progressInterval = Math.floor(totalLines / 20); // report ~20 times

    for (var i = dataStart; i < totalLines; i++) {
        // Progress reporting
        if (progressInterval > 0 && (i - dataStart) % progressInterval === 0) {
            self.postMessage({
                type: 'progress',
                percent: Math.round(((i - dataStart) / (totalLines - dataStart)) * 100)
            });
        }

        var line = lines[i];
        if (!line || line.length < 5) continue;

        var fields = line.split(',');

        var lat = parseFloat(fields[cols.latitude]);
        var lng = parseFloat(fields[cols.longitude]);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) continue;

        var lapNum = cols.lap_number !== undefined ? fields[cols.lap_number].trim() : '';
        var speed = cols.speed !== undefined ? parseFloat(fields[cols.speed]) : 0;
        var elapsed = cols.elapsed_time !== undefined ? parseFloat(fields[cols.elapsed_time]) : 0;
        var latAcc = cols.lateral_acc !== undefined ? parseFloat(fields[cols.lateral_acc]) : 0;
        var lonAcc = cols.longitudinal_acc !== undefined ? parseFloat(fields[cols.longitudinal_acc]) : 0;
        var combAcc = cols.combined_acc !== undefined ? parseFloat(fields[cols.combined_acc]) : 0;
        var dist = cols.distance_traveled !== undefined ? parseFloat(fields[cols.distance_traveled]) : 0;
        var bearing = cols.bearing !== undefined ? parseFloat(fields[cols.bearing]) : 0;
        var timestamp = parseFloat(fields[cols.timestamp]);

        // Only include rows that have a lap number (skip between-run data)
        if (lapNum === '') continue;

        var lapKey = lapNum;
        if (!lapsMap[lapKey]) {
            lapsMap[lapKey] = [];
        }

        lapsMap[lapKey].push({
            t: timestamp,
            elapsed: elapsed,
            lat: lat,
            lng: lng,
            speed: isNaN(speed) ? 0 : speed,
            latG: isNaN(latAcc) ? 0 : latAcc,
            lonG: isNaN(lonAcc) ? 0 : lonAcc,
            combG: isNaN(combAcc) ? 0 : combAcc,
            dist: isNaN(dist) ? 0 : dist,
            bearing: isNaN(bearing) ? 0 : bearing
        });

        // Track bounds
        if (lat < globalMinLat) globalMinLat = lat;
        if (lat > globalMaxLat) globalMaxLat = lat;
        if (lng < globalMinLng) globalMinLng = lng;
        if (lng > globalMaxLng) globalMaxLng = lng;
    }

    // Convert lapsMap to sorted array, filter stationary start/end, compute stats
    var lapKeys = Object.keys(lapsMap).sort(function(a, b) {
        return parseInt(a) - parseInt(b);
    });

    var laps = [];
    var SPEED_THRESHOLD = 0.5; // m/s — filter stationary data

    for (var k = 0; k < lapKeys.length; k++) {
        var points = lapsMap[lapKeys[k]];
        if (points.length < 10) continue; // skip tiny fragments

        // Trim stationary data from start
        var startIdx = 0;
        for (var s = 0; s < points.length; s++) {
            if (points[s].speed >= SPEED_THRESHOLD) {
                startIdx = s;
                break;
            }
        }

        // Trim stationary data from end
        var endIdx = points.length - 1;
        for (var e = points.length - 1; e >= startIdx; e--) {
            if (points[e].speed >= SPEED_THRESHOLD) {
                endIdx = e;
                break;
            }
        }

        var trimmed = points.slice(startIdx, endIdx + 1);
        if (trimmed.length < 10) continue;

        // Compute stats
        var maxSpeed = 0, sumSpeed = 0;
        var maxLatG = 0, maxLonG = 0, maxCombG = 0;
        for (var p = 0; p < trimmed.length; p++) {
            var pt = trimmed[p];
            if (pt.speed > maxSpeed) maxSpeed = pt.speed;
            sumSpeed += pt.speed;
            var absLatG = Math.abs(pt.latG);
            var absLonG = Math.abs(pt.lonG);
            if (absLatG > maxLatG) maxLatG = absLatG;
            if (absLonG > maxLonG) maxLonG = absLonG;
            if (pt.combG > maxCombG) maxCombG = pt.combG;
        }

        var lapTime = trimmed[trimmed.length - 1].elapsed - trimmed[0].elapsed;

        laps.push({
            lapNumber: parseInt(lapKeys[k]),
            points: trimmed,
            stats: {
                lapTime: lapTime,
                pointCount: trimmed.length,
                maxSpeed: maxSpeed,
                avgSpeed: sumSpeed / trimmed.length,
                maxLatG: maxLatG,
                maxLonG: maxLonG,
                maxCombG: maxCombG
            }
        });
    }

    self.postMessage({ type: 'progress', percent: 100 });

    return {
        laps: laps,
        bounds: {
            minLat: globalMinLat,
            maxLat: globalMaxLat,
            minLng: globalMinLng,
            maxLng: globalMaxLng
        }
    };
}
