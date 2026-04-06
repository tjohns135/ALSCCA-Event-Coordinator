// RaceChronoPanel — Sidebar panel for RaceChrono data import and visualization controls

function RaceChronoPanel({
    session,
    onImportCSV,
    onSessionClear,
    selectedLaps,
    onLapToggle,
    vizMode,
    onVizModeChange,
    overlayVisible,
    onOverlayVisibleChange,
    transform,
    onTransformChange,
    importProgress,
    showFrictionCircle,
    onFrictionCircleChange
}) {
    const csvInputRef = React.useRef(null);

    const handleFileSelect = () => {
        csvInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onImportCSV(file);
            e.target.value = '';
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '--';
        return seconds.toFixed(2) + 's';
    };

    const formatSpeed = (mps) => {
        // Convert m/s to mph
        return (mps * 2.237).toFixed(1) + ' mph';
    };

    // Find best (shortest) lap time
    const bestLapTime = session ? Math.min(...session.laps.map(l => l.stats.lapTime)) : null;

    const handleRotationChange = (e) => {
        if (transform && onTransformChange) {
            onTransformChange(GeoTransform.applyRotation(transform, parseFloat(e.target.value)));
        }
    };

    const handleScaleChange = (e) => {
        if (transform && onTransformChange) {
            const baseScale = transform.scale / (transform._userScale || 1);
            const userScale = parseFloat(e.target.value);
            onTransformChange(Object.assign({}, GeoTransform.applyScale(transform, baseScale * userScale), { _userScale: userScale }));
        }
    };

    const handleQuickRotate = (degrees) => {
        if (transform && onTransformChange) {
            const newRotation = ((transform.rotation + degrees) % 360 + 360) % 360;
            onTransformChange(GeoTransform.applyRotation(transform, newRotation > 180 ? newRotation - 360 : newRotation));
        }
    };

    const handleAutoFit = () => {
        if (session && onTransformChange) {
            const trackBounds = { x: 20, y: 82, w: 350, h: 120 };
            const newTransform = GeoTransform.computeAutoFit(session.bounds, trackBounds);
            onTransformChange(Object.assign({}, newTransform, { _userScale: 1 }));
        }
    };

    return React.createElement('div', { className: 'toolbar-section racechrono-section' },
        React.createElement('h3', null, 'RaceChrono Data'),

        // Import button
        React.createElement('div', { className: 'action-buttons' },
            React.createElement('button', {
                className: 'action-btn primary',
                onClick: handleFileSelect,
                disabled: importProgress !== null
            },
                React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
                    React.createElement('path', { d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' }),
                    React.createElement('polyline', { points: '17 8 12 3 7 8' }),
                    React.createElement('line', { x1: '12', y1: '3', x2: '12', y2: '15' })
                ),
                importProgress !== null ? 'Importing... ' + importProgress + '%' : 'Import RaceChrono CSV'
            ),
            React.createElement('input', {
                ref: csvInputRef,
                type: 'file',
                accept: '.csv',
                className: 'hidden-input',
                onChange: handleFileChange
            })
        ),

        // Progress bar
        importProgress !== null && React.createElement('div', { className: 'racechrono-progress' },
            React.createElement('div', {
                className: 'racechrono-progress-bar',
                style: { width: importProgress + '%' }
            })
        ),

        // Session info and controls (only when data is loaded)
        session && React.createElement(React.Fragment, null,
            // Session summary
            React.createElement('div', { className: 'racechrono-session-info' },
                React.createElement('span', { className: 'stat-label' }, session.title || session.fileName),
                React.createElement('span', { className: 'stat-value' }, session.laps.length + ' runs')
            ),
            React.createElement('button', {
                className: 'action-btn danger',
                onClick: onSessionClear,
                style: { fontSize: '0.75rem', padding: '4px 8px', marginTop: '4px' }
            }, 'Clear Data'),

            // Layer toggle
            React.createElement('div', { className: 'racechrono-toggle', style: { marginTop: '8px' } },
                React.createElement('label', null,
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: overlayVisible,
                        onChange: (e) => onOverlayVisibleChange(e.target.checked)
                    }),
                    React.createElement('span', null, ' Show Overlay')
                )
            ),

            // Lap selection
            React.createElement('h4', { style: { margin: '8px 0 4px' } }, 'Runs'),
            React.createElement('div', { className: 'racechrono-lap-list' },
                session.laps.map(lap =>
                    React.createElement('label', {
                        key: 'lap-' + lap.lapNumber,
                        className: 'racechrono-lap-item' + (lap.stats.lapTime === bestLapTime ? ' best' : '')
                    },
                        React.createElement('input', {
                            type: 'checkbox',
                            checked: selectedLaps.includes(lap.lapNumber),
                            onChange: () => onLapToggle(lap.lapNumber)
                        }),
                        React.createElement('span', { className: 'racechrono-lap-label' },
                            'Run ' + lap.lapNumber
                        ),
                        React.createElement('span', { className: 'racechrono-lap-time' },
                            formatTime(lap.stats.lapTime)
                        ),
                        React.createElement('span', { className: 'racechrono-lap-speed' },
                            formatSpeed(lap.stats.maxSpeed)
                        )
                    )
                )
            ),

            // Visualization mode
            React.createElement('h4', { style: { margin: '8px 0 4px' } }, 'Visualization'),
            React.createElement('div', { className: 'racechrono-viz-radios' },
                ['speed', 'lonG', 'latG', 'combined'].map(mode =>
                    React.createElement('label', { key: mode, className: 'racechrono-radio-label' },
                        React.createElement('input', {
                            type: 'radio',
                            name: 'racechrono-viz',
                            value: mode,
                            checked: vizMode === mode,
                            onChange: () => onVizModeChange(mode)
                        }),
                        React.createElement('span', null,
                            mode === 'speed' ? 'Speed' :
                            mode === 'lonG' ? 'Brake / Accel' :
                            mode === 'latG' ? 'Lateral G' :
                            'Combined G'
                        )
                    )
                )
            ),

            // Friction circle toggle
            React.createElement('div', { className: 'racechrono-toggle', style: { marginTop: '6px' } },
                React.createElement('label', null,
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: showFrictionCircle,
                        onChange: (e) => onFrictionCircleChange(e.target.checked)
                    }),
                    React.createElement('span', null, ' Friction Circle')
                )
            ),

            // Alignment controls
            React.createElement('h4', { style: { margin: '8px 0 4px' } }, 'Alignment'),
            React.createElement('p', { className: 'racechrono-hint' }, 'Drag trace on map to reposition'),

            // Rotation slider
            React.createElement('div', { className: 'slider-group' },
                React.createElement('label', null,
                    React.createElement('span', { className: 'slider-label' }, 'Rotation'),
                    React.createElement('span', { className: 'slider-value' },
                        (transform ? Math.round(transform.rotation) : 0) + '\u00B0'
                    )
                ),
                React.createElement('input', {
                    type: 'range',
                    min: '-180',
                    max: '180',
                    step: '1',
                    value: transform ? Math.round(transform.rotation) : 0,
                    onChange: handleRotationChange,
                    className: 'calibration-slider'
                })
            ),

            // Quick rotate buttons
            React.createElement('div', { className: 'racechrono-quick-rotate' },
                [-90, -45, 45, 90].map(deg =>
                    React.createElement('button', {
                        key: deg,
                        className: 'racechrono-rotate-btn',
                        onClick: () => handleQuickRotate(deg),
                        title: (deg > 0 ? '+' : '') + deg + '\u00B0'
                    }, (deg > 0 ? '+' : '') + deg + '\u00B0')
                )
            ),

            // Scale slider
            React.createElement('div', { className: 'slider-group', style: { marginTop: '4px' } },
                React.createElement('label', null,
                    React.createElement('span', { className: 'slider-label' }, 'Scale'),
                    React.createElement('span', { className: 'slider-value' },
                        ((transform && transform._userScale) || 1).toFixed(2) + 'x'
                    )
                ),
                React.createElement('input', {
                    type: 'range',
                    min: '0.3',
                    max: '3.0',
                    step: '0.05',
                    value: (transform && transform._userScale) || 1,
                    onChange: handleScaleChange,
                    className: 'calibration-slider'
                })
            ),

            // Auto-fit button
            React.createElement('button', {
                className: 'action-btn',
                onClick: handleAutoFit,
                style: { fontSize: '0.75rem', padding: '4px 8px', marginTop: '4px' }
            }, 'Auto-fit')
        )
    );
}

window.RaceChronoPanel = RaceChronoPanel;
