// Sidebar component with course info, actions, and stats

function Sidebar({
    course,
    activeTool,
    onToolChange,
    onNameChange,
    onNewCourse,
    onClearCourse,
    onExportJSON,
    onImportJSON,
    onExportPNG,
    onExportSVG,
    selectedCone,
    onConeDeselect,
    selectedCornerNumber,
    onCornerNumberChange,
    onCornerNumberDeselect,
    onDrivingLineClear,
    selectedMarker,
    carMode,
    onCarModeChange,
    carDriveTrace,
    onCarDriveTraceChange,
    carProfile,
    onCarProfileChange,
    carProfiles,
    onCarDeselect,
    trackLibrary,
    onLoadTrack,
    racechronoSession,
    racechronoSelectedLaps,
    racechronoVizMode,
    racechronoOverlayVisible,
    racechronoTransform,
    racechronoImportProgress,
    racechronoFrictionCircle,
    onRacechronoImport,
    onRacechronoClear,
    onRacechronoLapToggle,
    onRacechronoVizModeChange,
    onRacechronoOverlayVisibleChange,
    onRacechronoTransformChange,
    onRacechronoFrictionCircleChange,
    onMapOverlayLoad
}) {
    const importInputRef = React.useRef(null);
    const overlayInputRef = React.useRef(null);

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleImportChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onImportJSON(file);
            e.target.value = '';
        }
    };

    const handleOverlayClick = () => {
        overlayInputRef.current?.click();
    };

    const handleOverlayChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onMapOverlayLoad(file);
            e.target.value = '';
        }
    };

    // Calculate stats
    const coneCount = course.cones?.length || 0;
    const standardCount = course.cones?.filter(c => c.type === 'standard').length || 0;
    const pointerCount = course.cones?.filter(c => c.type === 'pointer').length || 0;
    const guideCount = course.cones?.filter(c => c.type === 'guide').length || 0;
    const hasStart = !!course.startMarker;
    const hasTimingStart = !!course.timingStartMarker;
    const hasFinish = !!course.finishMarker;
    const hasCar = !!course.carMarker;
    const cornerNumberCount = (course.cornerNumbers || []).length;
    const drivingLinePointCount = (course.drivingLine || []).length;

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-title-row">
                    <img src="../cone-ninja-logo.svg" alt="Cone Ninja" className="sidebar-logo" />
                </div>
                <h1>CONE NINJA</h1>
                <input
                    type="text"
                    className="course-name-input"
                    value={course.name || ''}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Course name..."
                />
                {trackLibrary && trackLibrary.length > 0 && (
                    <select
                        className="track-library-select"
                        value=""
                        onChange={(e) => {
                            if (e.target.value) onLoadTrack(e.target.value);
                        }}
                    >
                        <option value="" disabled>Load a track...</option>
                        {trackLibrary.map(t =>
                            <option key={t.id} value={t.id}>{t.name}</option>
                        )}
                    </select>
                )}
            </div>

            {/* Car section — always visible */}
            <div className="toolbar-section">
                <h3>Car</h3>
                <div className="tool-buttons">
                    <button
                        className={`tool-btn ${activeTool === 'car' ? 'active' : ''}`}
                        onClick={() => onToolChange('car')}
                        title="Place Car"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <rect x="5" y="8" width="14" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>Place Car</span>
                    </button>
                </div>
                {/* Car-only controls: Edit/Drive, profile, Trace Path */}
                {!!course.carMarker && React.createElement(React.Fragment, null,
                    React.createElement('div', { className: 'car-mode-selector', style: { marginTop: '8px' } },
                        React.createElement('button', { className: carMode === 'edit' ? 'active' : '', onClick: () => onCarModeChange('edit') }, 'Edit'),
                        React.createElement('button', { className: carMode === 'drive' ? 'active' : '', onClick: () => onCarModeChange('drive') }, 'Drive')
                    ),
                    carMode === 'drive' && React.createElement('select', {
                        className: 'car-profile-select',
                        style: { marginTop: '8px' },
                        value: carProfile,
                        onChange: (e) => onCarProfileChange(e.target.value)
                    }, carProfiles.map(p =>
                        React.createElement('option', { key: p.id, value: p.id }, p.name)
                    )),
                    React.createElement('label', { className: 'trace-toggle', style: { marginTop: '8px' } },
                        React.createElement('input', {
                            type: 'checkbox',
                            checked: carDriveTrace,
                            onChange: (e) => onCarDriveTraceChange(e.target.checked)
                        }),
                        React.createElement('span', null, 'Trace Path')
                    )
                )}

                {/* Always visible: manual driving-line drawing + reset */}
                {React.createElement('div', { className: 'tool-buttons', style: { marginTop: '8px' } },
                    React.createElement('button', {
                        className: `tool-btn ${activeTool === 'driving-line' ? 'active' : ''}`,
                        onClick: () => onToolChange('driving-line'),
                        title: 'Manually Draw Driving Line'
                    },
                        React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
                            React.createElement('path', { d: 'M3 17c3-6 6 6 9 0s6 6 9 0', strokeLinecap: 'round' })
                        ),
                        React.createElement('span', null, 'Manually Draw Driving Line')
                    )
                )}
                {React.createElement('button', {
                    className: 'action-btn danger',
                    onClick: onDrivingLineClear,
                    style: { fontSize: '0.75rem', padding: '4px 8px', marginTop: '4px' }
                }, 'Reset Path')}
            </div>

            <Toolbar
                activeTool={activeTool}
                onToolChange={onToolChange}
                disabled={carMode === 'drive'}
            />

            {/* Selected Cone Controls */}
            {selectedCone && (selectedCone.type === 'pointer' || selectedCone.type === 'guide') && (
                <div className="selected-cone-section">
                    <h3>Selected {selectedCone.type === 'pointer' ? 'Pointer' : 'Guide'} Cone</h3>
                    <button className="deselect-btn" onClick={onConeDeselect}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Deselect
                    </button>
                </div>
            )}

            {/* Selected Corner Number Controls */}
            {selectedCornerNumber && (
                <div className="selected-cone-section">
                    <h3>Selected Corner Number</h3>
                    <div className="slider-group">
                        <label>
                            <span className="slider-label">Number</span>
                            <span className="slider-value">{selectedCornerNumber.number}</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="6"
                            step="1"
                            value={selectedCornerNumber.number}
                            onChange={(e) => onCornerNumberChange(selectedCornerNumber.id, parseInt(e.target.value, 10))}
                            className="calibration-slider"
                        />
                    </div>
                    <button className="deselect-btn" onClick={onCornerNumberDeselect}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Deselect
                    </button>
                </div>
            )}

            <div className="actions-section">
                <h3>Actions</h3>
                <div className="action-buttons">
                    <button className="action-btn primary" onClick={onExportPNG}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export PNG
                    </button>
                    <button className="action-btn primary" onClick={onExportSVG}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export SVG
                    </button>
                    <button className="action-btn" onClick={onExportJSON}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Save JSON
                    </button>
                    <button className="action-btn" onClick={handleImportClick}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Load JSON
                    </button>
                    <input
                        ref={importInputRef}
                        type="file"
                        accept=".json"
                        className="hidden-input"
                        onChange={handleImportChange}
                    />
                    <button className="action-btn" onClick={handleOverlayClick}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        Trace Map
                    </button>
                    <input
                        ref={overlayInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        className="hidden-input"
                        onChange={handleOverlayChange}
                    />
                    <button className="action-btn danger" onClick={onClearCourse}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                        Clear Course
                    </button>
                    <button className="action-btn" onClick={onNewCourse}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        New Course
                    </button>
                </div>
            </div>

            <div className="stats-section">
                <h3>Course Stats</h3>
                <div className="stat-item">
                    <span className="stat-label">Total Cones</span>
                    <span className="stat-value">{coneCount}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Standard</span>
                    <span className="stat-value">{standardCount}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Pointer</span>
                    <span className="stat-value">{pointerCount}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Guide</span>
                    <span className="stat-value">{guideCount}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Start Line</span>
                    <span className="stat-value">{hasStart ? 'Placed' : 'Not set'}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Timing Start</span>
                    <span className="stat-value">{hasTimingStart ? 'Placed' : 'Not set'}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Finish Line</span>
                    <span className="stat-value">{hasFinish ? 'Placed' : 'Not set'}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Car</span>
                    <span className="stat-value">{hasCar ? 'Placed' : 'Not set'}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Corner Numbers</span>
                    <span className="stat-value">{cornerNumberCount}/6</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Driving Line</span>
                    <span className="stat-value">{drivingLinePointCount} pts</span>
                </div>
            </div>

            {React.createElement(RaceChronoPanel, {
                session: racechronoSession,
                onImportCSV: onRacechronoImport,
                onSessionClear: onRacechronoClear,
                selectedLaps: racechronoSelectedLaps,
                onLapToggle: onRacechronoLapToggle,
                vizMode: racechronoVizMode,
                onVizModeChange: onRacechronoVizModeChange,
                overlayVisible: racechronoOverlayVisible,
                onOverlayVisibleChange: onRacechronoOverlayVisibleChange,
                transform: racechronoTransform,
                onTransformChange: onRacechronoTransformChange,
                importProgress: racechronoImportProgress,
                showFrictionCircle: racechronoFrictionCircle,
                onFrictionCircleChange: onRacechronoFrictionCircleChange
            })}
        </div>
    );
}

window.Sidebar = Sidebar;
