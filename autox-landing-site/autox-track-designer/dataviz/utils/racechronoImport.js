// RaceChrono CSV Import Orchestrator
// Reads file, validates format, delegates parsing to Web Worker

window.RaceChronoImport = {
    importCSV: function(file, onProgress) {
        return new Promise(function(resolve, reject) {
            if (!file || !file.name.endsWith('.csv')) {
                reject(new Error('Please select a .csv file'));
                return;
            }

            var reader = new FileReader();

            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };

            reader.onload = function(e) {
                var text = e.target.result;

                // Quick validation: check for Format 3 header
                var firstLines = text.substring(0, 500);
                if (firstLines.indexOf('Format,3') === -1 && firstLines.indexOf('Format, 3') === -1) {
                    // Check if it's Format 2 or 1
                    if (firstLines.indexOf('Format,2') >= 0) {
                        reject(new Error('This is RaceChrono Format 2. Please re-export using Format 3.'));
                        return;
                    }
                    if (firstLines.indexOf('Lap #,') >= 0) {
                        reject(new Error('This is RaceChrono Format 1 (legacy). Please re-export using Format 3.'));
                        return;
                    }
                    reject(new Error('Unrecognized file format. Expected RaceChrono Format 3 CSV.'));
                    return;
                }

                // Parse session metadata from header
                var metadata = RaceChronoImport._parseMetadata(firstLines);

                // Launch Web Worker for heavy parsing
                var worker;
                try {
                    worker = new Worker('dataviz/workers/racechronoParser.worker.js');
                } catch (err) {
                    reject(new Error('Failed to start parser worker: ' + err.message));
                    return;
                }

                worker.onmessage = function(msg) {
                    var data = msg.data;
                    if (data.type === 'progress') {
                        if (onProgress) onProgress(data.percent);
                    } else if (data.type === 'result') {
                        worker.terminate();
                        resolve({
                            sessionId: 'rc-' + Date.now(),
                            importedAt: new Date().toISOString(),
                            title: metadata.title || file.name,
                            trackName: metadata.trackName || '',
                            created: metadata.created || '',
                            fileName: file.name,
                            laps: data.data.laps,
                            bounds: data.data.bounds
                        });
                    } else if (data.type === 'error') {
                        worker.terminate();
                        reject(new Error(data.message));
                    }
                };

                worker.onerror = function(err) {
                    worker.terminate();
                    reject(new Error('Parser worker error: ' + (err.message || 'Unknown error')));
                };

                worker.postMessage(text);
            };

            reader.readAsText(file);
        });
    },

    _parseMetadata: function(headerText) {
        var lines = headerText.split('\n');
        var metadata = {};
        for (var i = 0; i < Math.min(10, lines.length); i++) {
            var line = lines[i];
            if (line.indexOf('Session title,') === 0) {
                metadata.title = line.split(',').slice(1).join(',').replace(/"/g, '').trim();
            } else if (line.indexOf('Track name,') === 0) {
                metadata.trackName = line.split(',').slice(1).join(',').replace(/"/g, '').trim();
            } else if (line.indexOf('Created,') === 0) {
                metadata.created = line.split(',').slice(1).join(',').trim();
            }
        }
        return metadata;
    }
};
