// Main App component for AutoX Track Designer

// Real-life scale constants (from track_clean.svg reference elements)
const REAL_LIFE_CONE_RADIUS = 0.21447;
const REAL_LIFE_LINE_LENGTH = 2.84;


function App() {
    // State
    const [course, setCourse] = React.useState(() => {
        const saved = StorageUtils.loadCourse();
        return saved || StorageUtils.createNewCourse();
    });
    const [activeTool, setActiveTool] = React.useState('cone-standard');
    const [toast, setToast] = React.useState(null);
    const [showNewCourseModal, setShowNewCourseModal] = React.useState(false);
    const [showLoadTrackModal, setShowLoadTrackModal] = React.useState(null); // track id to load
    const [showWelcomeModal, setShowWelcomeModal] = React.useState(() => {
        return StorageUtils.loadCourse() === null;
    });
    const [welcomeTrackId, setWelcomeTrackId] = React.useState('');
    const [showHelp, setShowHelp] = React.useState(false);

    // Car mode state
    const [carMode, setCarMode] = React.useState('edit');
    const [carDriveTrace, setCarDriveTrace] = React.useState(false);
    const [carProfile, setCarProfile] = React.useState('car1');
    const driveSettings = CAR_PROFILES.find(p => p.id === carProfile) || CAR_PROFILES[0];

    // Curve cone placement state
    const [curvePoints, setCurvePoints] = React.useState([]);
    const [curveDensity, setCurveDensity] = React.useState(5);
    const [curveReverse, setCurveReverse] = React.useState(false);

    // RaceChrono state
    const [racechronoSession, setRacechronoSession] = React.useState(null);
    const [racechronoSelectedLaps, setRacechronoSelectedLaps] = React.useState([]);
    const [racechronoVizMode, setRacechronoVizMode] = React.useState('speed');
    const [racechronoOverlayVisible, setRacechronoOverlayVisible] = React.useState(true);
    const [racechronoTransform, setRacechronoTransform] = React.useState(null);
    const [racechronoImportProgress, setRacechronoImportProgress] = React.useState(null);
    const [racechronoFrictionCircle, setRacechronoFrictionCircle] = React.useState(false);

    // Map overlay state
    const [mapOverlay, setMapOverlay] = React.useState(null);

    // Selection state
    const [selectedConeId, setSelectedConeId] = React.useState(null);
    const [selectedCornerNumberId, setSelectedCornerNumberId] = React.useState(null);
    const [selectedMarker, setSelectedMarker] = React.useState(null); // 'start' | 'finish' | 'car' | null

    // Auto-save on course changes
    React.useEffect(() => {
        const updatedCourse = {
            ...course,
            updatedAt: new Date().toISOString()
        };
        StorageUtils.saveCourse(updatedCourse);
    }, [course]);

    // Drive mode entry — lock selection and tool
    React.useEffect(() => {
        if (carMode === 'drive') {
            setSelectedMarker('car');
            setSelectedConeId(null);
            setSelectedCornerNumberId(null);
            setActiveTool('select');
        }
    }, [carMode]);

    // Guard tool changes — block in drive mode
    const handleToolChange = (tool) => {
        if (carMode === 'drive') return;
        setActiveTool(tool);
    };

    // Toast helper
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Deselect all
    const handleDeselectAll = () => {
        setSelectedConeId(null);
        setSelectedCornerNumberId(null);
        setSelectedMarker(null);
    };

    // Course name change
    const handleNameChange = (name) => {
        setCourse(prev => ({ ...prev, name }));
    };

    // Cone operations
    const handleConeAdd = (position) => {
        const coneType = activeTool.replace('cone-', '');
        const newCone = {
            id: position.id || StorageUtils.generateId('cone'),
            x: position.x,
            y: position.y,
            type: coneType,
            ...((coneType === 'pointer' || coneType === 'guide') && { rotation: 45 })
        };
        setCourse(prev => ({
            ...prev,
            cones: [...prev.cones, newCone]
        }));
    };

    const handleConeSelect = (coneId) => {
        setSelectedConeId(coneId);
        setSelectedCornerNumberId(null);
        setSelectedMarker(null);
    };

    const handleConeDeselect = () => {
        setSelectedConeId(null);
    };

    const handleConeRotationChange = (coneId, rotation) => {
        setCourse(prev => ({
            ...prev,
            cones: prev.cones.map(cone =>
                cone.id === coneId
                    ? { ...cone, rotation }
                    : cone
            )
        }));
    };

    // Get selected cone data
    const selectedCone = selectedConeId
        ? course.cones.find(c => c.id === selectedConeId)
        : null;

    const handleConeMove = (coneId, newPosition) => {
        setCourse(prev => ({
            ...prev,
            cones: prev.cones.map(cone =>
                cone.id === coneId
                    ? { ...cone, x: newPosition.x, y: newPosition.y }
                    : cone
            )
        }));
    };

    const handleConeDelete = (coneId) => {
        if (coneId === selectedConeId) {
            setSelectedConeId(null);
        }
        setCourse(prev => ({
            ...prev,
            cones: prev.cones.filter(cone => cone.id !== coneId)
        }));
    };

    // Start/Finish markers - rotation stored in course data
    const handleStartMarkerSet = (position) => {
        setCourse(prev => ({
            ...prev,
            startMarker: position ? { x: position.x, y: position.y, rotation: prev.startMarker?.rotation || 0 } : null
        }));
    };

    const handleTimingStartMarkerSet = (position) => {
        setCourse(prev => ({
            ...prev,
            timingStartMarker: position ? { x: position.x, y: position.y, rotation: prev.timingStartMarker?.rotation || 0 } : null
        }));
    };

    const handleFinishMarkerSet = (position) => {
        setCourse(prev => ({
            ...prev,
            finishMarker: position ? { x: position.x, y: position.y, rotation: prev.finishMarker?.rotation || 0 } : null
        }));
    };

    const handleStartMarkerMove = (position) => {
        setCourse(prev => ({
            ...prev,
            startMarker: prev.startMarker ? { ...prev.startMarker, x: position.x, y: position.y } : null
        }));
    };

    const handleTimingStartMarkerMove = (position) => {
        setCourse(prev => ({
            ...prev,
            timingStartMarker: prev.timingStartMarker ? { ...prev.timingStartMarker, x: position.x, y: position.y } : null
        }));
    };

    const handleFinishMarkerMove = (position) => {
        setCourse(prev => ({
            ...prev,
            finishMarker: prev.finishMarker ? { ...prev.finishMarker, x: position.x, y: position.y } : null
        }));
    };

    const handleStartRotationChange = (rotation) => {
        setCourse(prev => ({
            ...prev,
            startMarker: prev.startMarker ? { ...prev.startMarker, rotation } : null
        }));
    };

    const handleTimingStartRotationChange = (rotation) => {
        setCourse(prev => ({
            ...prev,
            timingStartMarker: prev.timingStartMarker ? { ...prev.timingStartMarker, rotation } : null
        }));
    };

    const handleFinishRotationChange = (rotation) => {
        setCourse(prev => ({
            ...prev,
            finishMarker: prev.finishMarker ? { ...prev.finishMarker, rotation } : null
        }));
    };

    // Car marker
    const handleCarMarkerSet = (position) => {
        setCourse(prev => ({
            ...prev,
            carMarker: { x: position.x, y: position.y, rotation: prev.carMarker?.rotation || 0 }
        }));
    };

    const handleCarMarkerMove = (position) => {
        setCourse(prev => ({
            ...prev,
            carMarker: prev.carMarker ? { ...prev.carMarker, x: position.x, y: position.y } : null
        }));
    };

    const handleCarMarkerDelete = () => {
        if (selectedMarker === 'car') setSelectedMarker(null);
        setCourse(prev => ({
            ...prev,
            carMarker: null
        }));
    };

    const handleCarRotationChange = (rotation) => {
        setCourse(prev => ({
            ...prev,
            carMarker: prev.carMarker ? { ...prev.carMarker, rotation } : null
        }));
    };

    // Marker selection
    const handleMarkerSelect = (marker) => {
        setSelectedMarker(marker);
        setSelectedConeId(null);
        setSelectedCornerNumberId(null);
    };

    // Corner numbers
    const handleCornerNumberAdd = (position) => {
        const existing = course.cornerNumbers || [];
        if (existing.length >= 6) {
            showToast('Maximum 6 corner numbers allowed', 'error');
            return;
        }
        const usedNumbers = existing.map(cn => cn.number);
        let nextNumber = 1;
        for (let i = 1; i <= 6; i++) {
            if (!usedNumbers.includes(i)) {
                nextNumber = i;
                break;
            }
        }
        const newCornerNumber = {
            id: StorageUtils.generateId('corner'),
            x: position.x,
            y: position.y,
            number: nextNumber
        };
        setCourse(prev => ({
            ...prev,
            cornerNumbers: [...(prev.cornerNumbers || []), newCornerNumber]
        }));
    };

    const handleCornerNumberMove = (id, newPosition) => {
        setCourse(prev => ({
            ...prev,
            cornerNumbers: (prev.cornerNumbers || []).map(cn =>
                cn.id === id ? { ...cn, x: newPosition.x, y: newPosition.y } : cn
            )
        }));
    };

    const handleCornerNumberDelete = (id) => {
        if (id === selectedCornerNumberId) {
            setSelectedCornerNumberId(null);
        }
        setCourse(prev => ({
            ...prev,
            cornerNumbers: (prev.cornerNumbers || []).filter(cn => cn.id !== id)
        }));
    };

    const handleCornerNumberSelect = (id) => {
        setSelectedCornerNumberId(id);
        setSelectedConeId(null);
        setSelectedMarker(null);
    };

    const handleCornerNumberChange = (id, number) => {
        setCourse(prev => ({
            ...prev,
            cornerNumbers: (prev.cornerNumbers || []).map(cn =>
                cn.id === id ? { ...cn, number } : cn
            )
        }));
    };

    const handleCornerNumberDeselect = () => {
        setSelectedCornerNumberId(null);
    };

    const selectedCornerNumber = selectedCornerNumberId
        ? (course.cornerNumbers || []).find(cn => cn.id === selectedCornerNumberId)
        : null;

    // Driving line operations
    const handleDrivingLineAddPoint = (position) => {
        const newPoint = {
            id: StorageUtils.generateId('dlpt'),
            x: position.x,
            y: position.y
        };
        setCourse(prev => ({
            ...prev,
            drivingLine: [...(prev.drivingLine || []), newPoint]
        }));
    };

    const handleDrivingLineRemovePoint = (pointId) => {
        setCourse(prev => ({
            ...prev,
            drivingLine: (prev.drivingLine || []).filter(pt => pt.id !== pointId)
        }));
    };

    const handleDrivingLineMovePoint = (pointId, newPosition) => {
        setCourse(prev => ({
            ...prev,
            drivingLine: (prev.drivingLine || []).map(pt =>
                pt.id === pointId ? { ...pt, x: newPosition.x, y: newPosition.y } : pt
            )
        }));
    };

    const handleDrivingLineClear = () => {
        setCourse(prev => ({ ...prev, drivingLine: [] }));
    };

    // RaceChrono handlers
    const handleRacechronoImport = async (file) => {
        try {
            setRacechronoImportProgress(0);
            const session = await RaceChronoImport.importCSV(file, (pct) => {
                setRacechronoImportProgress(pct);
            });
            setRacechronoSession(session);
            if (session.laps.length > 0) {
                setRacechronoSelectedLaps([session.laps[0].lapNumber]);
            }
            const trackBounds = { x: 20, y: 82, w: 350, h: 120 };
            const newTransform = GeoTransform.computeAutoFit(session.bounds, trackBounds);
            setRacechronoTransform(Object.assign({}, newTransform, { _userScale: 1 }));
            setRacechronoImportProgress(null);
            showToast('Imported ' + session.laps.length + ' runs from RaceChrono');
        } catch (error) {
            setRacechronoImportProgress(null);
            showToast('Import failed: ' + error.message, 'error');
        }
    };

    const handleRacechronoClear = () => {
        setRacechronoSession(null);
        setRacechronoSelectedLaps([]);
        setRacechronoTransform(null);
        setRacechronoFrictionCircle(false);
    };

    const handleRacechronoLapToggle = (lapNumber) => {
        setRacechronoSelectedLaps(prev =>
            prev.includes(lapNumber)
                ? prev.filter(n => n !== lapNumber)
                : [...prev, lapNumber]
        );
    };

    // Map overlay handlers
    const handleMapOverlayLoad = async (file) => {
        try {
            const { src, naturalW, naturalH } = await MapOverlayUtils.loadImage(file);
            const viewBox = { x: 0, y: 0, w: 431.8, h: 279.4 };
            const fit = MapOverlayUtils.computeInitialFit(naturalW, naturalH, viewBox);
            setMapOverlay({
                src,
                naturalW,
                naturalH,
                x: fit.x,
                y: fit.y,
                scale: fit.scale,
                rotation: fit.rotation,
                flipH: false,
                flipV: false,
                opacity: 0.4,
                trackOpacity: 1.0,
                locked: false,
                visible: true,
                onTop: false
            });
            showToast('Map overlay loaded');
        } catch (error) {
            showToast('Failed to load image: ' + error.message, 'error');
        }
    };

    const handleMapOverlayChange = (updates) => {
        setMapOverlay(prev => prev ? { ...prev, ...updates } : null);
    };

    const handleMapOverlayClear = () => {
        if (mapOverlay && mapOverlay.src) {
            URL.revokeObjectURL(mapOverlay.src);
        }
        setMapOverlay(null);
    };

    // Curve cone placement
    const handleCurveAddPoint = (position) => {
        setCurvePoints(prev => [...prev, { x: position.x, y: position.y }]);
    };

    const handleCurveUndoPoint = () => {
        setCurvePoints(prev => prev.slice(0, -1));
    };

    const handleCurveApply = () => {
        const coneType = activeTool.replace('cone-', '').replace('-curve', '');
        const samples = CatmullRomUtils.samplePoints(curvePoints, curveDensity);
        const newCones = samples.map(s => ({
            id: StorageUtils.generateId('cone'),
            x: s.x,
            y: s.y,
            type: coneType,
            ...((coneType === 'pointer' || coneType === 'guide') && { rotation: Math.round(curveReverse ? (s.angle + 180) % 360 : s.angle) })
        }));
        setCourse(prev => ({
            ...prev,
            cones: [...prev.cones, ...newCones]
        }));
        setCurvePoints([]);
        handleDeselectAll();
        setActiveTool('select');
    };

    const handleCurveCancel = () => {
        setCurvePoints([]);
        setActiveTool('select');
    };

    // Clear curve points when switching away from curve tools
    React.useEffect(() => {
        if (!activeTool.endsWith('-curve')) {
            setCurvePoints([]);
        }
    }, [activeTool]);

    // Clear course (keep name)
    const handleClearCourse = () => {
        if (!window.confirm('Clear all cones, markers, and corner numbers from this course?')) return;
        setCourse(prev => ({
            ...prev,
            cones: [],
            startMarker: null,
            timingStartMarker: null,
            finishMarker: null,
            carMarker: null,
            cornerNumbers: [],
            drivingLine: []
        }));
        handleDeselectAll();
        showToast('Course cleared');
    };

    // New course
    const handleNewCourse = () => {
        setShowNewCourseModal(true);
    };

    const confirmNewCourse = () => {
        setCourse(StorageUtils.createNewCourse());
        handleDeselectAll();
        setShowNewCourseModal(false);
        showToast('New course created');
    };

    // Export/Import
    const handleExportJSON = () => {
        StorageUtils.exportCourseJSON(course);
        showToast('Course exported as JSON');
    };

    const handleImportJSON = async (file) => {
        try {
            const importedCourse = await StorageUtils.importCourseJSON(file);
            setCourse(importedCourse);
            handleDeselectAll();
            showToast('Course imported successfully');
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const handleExportPNG = async () => {
        try {
            showToast('Generating image...');
            await ExportUtils.exportToPNG('map', course.name);
            showToast('Course exported as PNG');
        } catch (error) {
            showToast('Failed to export PNG: ' + error.message, 'error');
        }
    };

    const handleExportSVG = () => {
        try {
            ExportUtils.exportToSVG('map', course.name);
            showToast('Course exported as SVG');
        } catch (error) {
            showToast('Failed to export SVG: ' + error.message, 'error');
        }
    };

    // Track library
    const handleLoadTrackRequest = (trackId) => {
        if (!trackId) return;
        setShowLoadTrackModal(trackId);
    };

    const fetchAndLoadTrack = async (trackId) => {
        const track = TRACK_LIBRARY.find(t => t.id === trackId);
        if (!track) {
            showToast('Track not found', 'error');
            return;
        }
        try {
            const response = await fetch('tracks/' + track.file);
            if (!response.ok) throw new Error('Failed to fetch track file');
            const courseData = JSON.parse(await response.text());
            if (!courseData.id || !Array.isArray(courseData.cones)) {
                throw new Error('Invalid course file format');
            }
            if (courseData.carMarker === undefined) courseData.carMarker = null;
            if (courseData.timingStartMarker === undefined) courseData.timingStartMarker = null;
            if (!Array.isArray(courseData.cornerNumbers)) courseData.cornerNumbers = [];
            if (!Array.isArray(courseData.drivingLine)) courseData.drivingLine = [];
            StorageUtils._ensureMarkerRotation(courseData);
            setCourse(courseData);
            handleDeselectAll();
            showToast('Loaded: ' + track.name);
        } catch (error) {
            showToast('Failed to load track: ' + error.message, 'error');
        }
    };

    const confirmLoadTrack = async () => {
        const trackId = showLoadTrackModal;
        setShowLoadTrackModal(null);
        await fetchAndLoadTrack(trackId);
    };

    const handleWelcomeLoadTrack = async () => {
        if (!welcomeTrackId) return;
        setShowWelcomeModal(false);
        await fetchAndLoadTrack(welcomeTrackId);
        setWelcomeTrackId('');
    };

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Suppress shortcuts that conflict with drive mode
            if (carMode === 'drive' && course.carMarker) {
                const driveKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
                if (driveKeys.includes(e.key.toLowerCase())) return;
            }

            switch (e.key.toLowerCase()) {
                case 's':
                    setActiveTool('select');
                    break;
                case 'c':
                    setActiveTool('cone-standard');
                    break;
                case '1':
                    setActiveTool('start');
                    break;
                case '2':
                    setActiveTool('timing-start');
                    break;
                case '3':
                    setActiveTool('finish');
                    break;
                case 'd':
                    setActiveTool('driving-line');
                    break;
                case 'e':
                    setActiveTool('eraser');
                    break;
                case 'escape':
                    setActiveTool('select');
                    handleDeselectAll();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [carMode, course.carMarker]);

    return (
        <div className="app-container">
            <Sidebar
                course={course}
                activeTool={activeTool}
                onToolChange={handleToolChange}
                onNameChange={handleNameChange}
                onNewCourse={handleNewCourse}
                onClearCourse={handleClearCourse}
                onExportJSON={handleExportJSON}
                onImportJSON={handleImportJSON}
                onExportPNG={handleExportPNG}
                onExportSVG={handleExportSVG}
                selectedCone={selectedCone}
                onConeDeselect={handleConeDeselect}
                selectedCornerNumber={selectedCornerNumber}
                onCornerNumberChange={handleCornerNumberChange}
                onCornerNumberDeselect={handleCornerNumberDeselect}
                onDrivingLineClear={handleDrivingLineClear}
                selectedMarker={selectedMarker}
                carMode={carMode}
                onCarModeChange={setCarMode}
                carDriveTrace={carDriveTrace}
                onCarDriveTraceChange={setCarDriveTrace}
                carProfile={carProfile}
                onCarProfileChange={setCarProfile}
                carProfiles={CAR_PROFILES}
                onCarDeselect={() => setSelectedMarker(null)}
                trackLibrary={TRACK_LIBRARY}
                onLoadTrack={handleLoadTrackRequest}
                racechronoSession={racechronoSession}
                racechronoSelectedLaps={racechronoSelectedLaps}
                racechronoVizMode={racechronoVizMode}
                racechronoOverlayVisible={racechronoOverlayVisible}
                racechronoTransform={racechronoTransform}
                racechronoImportProgress={racechronoImportProgress}
                racechronoFrictionCircle={racechronoFrictionCircle}
                onRacechronoImport={handleRacechronoImport}
                onRacechronoClear={handleRacechronoClear}
                onRacechronoLapToggle={handleRacechronoLapToggle}
                onRacechronoVizModeChange={setRacechronoVizMode}
                onRacechronoOverlayVisibleChange={setRacechronoOverlayVisible}
                onRacechronoTransformChange={setRacechronoTransform}
                onRacechronoFrictionCircleChange={setRacechronoFrictionCircle}
                onMapOverlayLoad={handleMapOverlayLoad}
            />

            <div className="main-content">
                <div className="canvas-help-overlay">
                    <button className="help-btn" onClick={() => setShowHelp(!showHelp)} title="Help">
                        <svg viewBox="0 0 24 24" width="37" height="37" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <text x="12" y="17.5" textAnchor="middle" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif" fill="currentColor" stroke="none">?</text>
                        </svg>
                    </button>
                    {carMode === 'drive' && (
                        <span className="drive-mode-notice">Drive mode — other tools disabled</span>
                    )}
                    {showHelp && (
                        <div className="canvas-help-panel">
                            <div className="help-content">
                                <h4>Car</h4>
                                <div className="help-tool-row">
                                    <button className="tool-btn" disabled>
                                        <svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="8" width="14" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                                        <span>Place Car</span>
                                    </button>
                                    <span className="help-desc">Click-drag to place and orient</span>
                                </div>
                                <div className="help-tool-row">
                                    <span className="help-mode-label">Edit</span>
                                    <span className="help-desc">Drag rotation handle to steer and move car</span>
                                </div>
                                <div className="help-tool-row">
                                    <span className="help-mode-label">Drive</span>
                                    <span className="help-desc">WASD / Arrow keys to drive with momentum. On mobile, use the on-screen joystick. Select car profile for handling</span>
                                </div>
                                <div className="help-tool-row">
                                    <span className="help-mode-label">Trace Path</span>
                                    <span className="help-desc">Record car path as driving line while driving or editing</span>
                                </div>
                                <div className="help-tool-row">
                                    <button className="tool-btn" disabled>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17c3-6 6 6 9 0s6 6 9 0" strokeLinecap="round"/></svg>
                                        <span>Manually Draw Driving Line</span>
                                    </button>
                                    <span className="help-desc">Click points to manually draw a smooth driving line</span>
                                </div>

                                <h4>Tools</h4>
                                <div className="help-tool-row">
                                    <button className="tool-btn" disabled>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>
                                        <span>Select</span>
                                    </button>
                                    <span className="help-desc">Click to select, drag to move. Works in any tool mode. <strong>[S]</strong></span>
                                </div>
                                <div className="help-tool-row">
                                    <button className="tool-btn" disabled>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 21h10"/><path d="M5.5 13.5L13.5 5.5a2.12 2.12 0 013 3l-8 8a2.12 2.12 0 01-3 0v0a2.12 2.12 0 010-3z"/></svg>
                                        <span>Eraser</span>
                                    </button>
                                    <span className="help-desc">Click any element to delete. Right-click also deletes. <strong>[E]</strong></span>
                                </div>

                                <h4>Track Features</h4>
                                <div className="help-tool-row">
                                    <div className="help-tool-pair">
                                        <button className="tool-btn" disabled>
                                            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
                                            <span>Standard</span>
                                        </button>
                                        <button className="tool-btn" disabled>
                                            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="6" cy="12" r="1.5" fill="currentColor"/><path d="M10 12 Q14 4 18 12" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/></svg>
                                            <span>Regular Curve</span>
                                        </button>
                                    </div>
                                    <span className="help-desc">Basic course marker. Curve: click control points, adjust density, Apply. <strong>[C]</strong></span>
                                </div>
                                <div className="help-tool-row">
                                    <div className="help-tool-pair">
                                        <button className="tool-btn" disabled>
                                            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="12" r="2" fill="currentColor"/><polygon points="16,12 22,8 22,16" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
                                            <span>Pointer</span>
                                        </button>
                                        <button className="tool-btn" disabled>
                                            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="14" r="2" fill="none" stroke="currentColor" strokeWidth="1"/><polygon points="9,14 12,12 12,16" fill="none" stroke="currentColor" strokeWidth="1"/><path d="M8 14 Q12 6 16 10" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="16" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1"/><polygon points="20,10 23,8 23,12" fill="none" stroke="currentColor" strokeWidth="1"/></svg>
                                            <span>Pointer Curve</span>
                                        </button>
                                    </div>
                                    <span className="help-desc">Directional cone. Click-drag to orient. Curve auto-orients along path</span>
                                </div>
                                <div className="help-tool-row">
                                    <div className="help-tool-pair">
                                        <button className="tool-btn" disabled>
                                            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6,12 18,6 18,18" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                                            <span>Guide</span>
                                        </button>
                                        <button className="tool-btn" disabled>
                                            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="3,14 9,10 9,18" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M8 14 Q12 6 16 10" fill="none" stroke="currentColor" strokeWidth="1.5"/><polygon points="14,10 20,6 20,14" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
                                            <span>Guide Curve</span>
                                        </button>
                                    </div>
                                    <span className="help-desc">Guide marker with rotation. Click-drag to orient</span>
                                </div>
                                <div className="help-tool-row">
                                    <button className="tool-btn" disabled>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="12" r="3" fill="#22C55E" stroke="none"/><line x1="5" y1="12" x2="19" y2="12" stroke="#22C55E" strokeWidth="2"/><circle cx="19" cy="12" r="3" fill="#22C55E" stroke="none"/><text x="12" y="21" fontSize="6" fill="currentColor" textAnchor="middle" stroke="none">START</text></svg>
                                        <span>Start</span>
                                    </button>
                                    <span className="help-desc">Start lane marker. Click-drag to orient. <strong>[1]</strong></span>
                                </div>
                                <div className="help-tool-row">
                                    <button className="tool-btn" disabled>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="9" r="2.5" fill="currentColor" stroke="none"/><circle cx="18" cy="9" r="2.5" fill="currentColor" stroke="none"/><circle cx="6" cy="15" r="2.5" fill="currentColor" stroke="none"/><circle cx="18" cy="15" r="2.5" fill="currentColor" stroke="none"/><text x="12" y="22" fontSize="5" fill="currentColor" textAnchor="middle" stroke="none">TIMING</text></svg>
                                        <span>Timing</span>
                                    </button>
                                    <span className="help-desc">Timing start marker. Click-drag to orient. <strong>[2]</strong></span>
                                </div>
                                <div className="help-tool-row">
                                    <button className="tool-btn" disabled>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="4" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="8" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="20" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="15" r="1.5" fill="currentColor" stroke="none"/><circle cx="8" cy="15" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="15" r="1.5" fill="currentColor" stroke="none"/><circle cx="20" cy="15" r="1.5" fill="currentColor" stroke="none"/><text x="12" y="22" fontSize="5" fill="currentColor" textAnchor="middle" stroke="none">FINISH</text></svg>
                                        <span>Finish</span>
                                    </button>
                                    <span className="help-desc">Finish lane marker. Click-drag to orient. <strong>[3]</strong></span>
                                </div>
                                <div className="help-tool-row">
                                    <button className="tool-btn" disabled>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/><text x="12" y="16" fontSize="10" fill="currentColor" textAnchor="middle" stroke="none">1</text></svg>
                                        <span>Corner #</span>
                                    </button>
                                    <span className="help-desc">Numbered corner markers (max 6)</span>
                                </div>

                                <h4>Navigation</h4>
                                <ul>
                                    <li><strong>Pan</strong> — click and drag empty space</li>
                                    <li><strong>Zoom</strong> — scroll wheel</li>
                                    <li><strong>Esc</strong> — deselect all</li>
                                </ul>

                                <h4>Mobile</h4>
                                <ul>
                                    <li><strong>Pan</strong> — drag empty space with one finger</li>
                                    <li><strong>Zoom</strong> — pinch with two fingers</li>
                                    <li><strong>Drive</strong> — use the on-screen joystick (appears in drive mode). Push direction to steer, push further for more speed</li>
                                    <li><strong>Auto-pan</strong> — canvas follows the car near edges while driving</li>
                                </ul>

                                <h4>Export</h4>
                                <p>Use <strong>Export PNG</strong> or <strong>Export SVG</strong> to save images. <strong>Save/Load JSON</strong> to back up and restore. Auto-saves to browser.</p>
                            </div>
                        </div>
                    )}
                </div>
                <MapView
                    course={course}
                    activeTool={activeTool}
                    onConeAdd={handleConeAdd}
                    onConeMove={handleConeMove}
                    onConeDelete={handleConeDelete}
                    onStartMarkerSet={handleStartMarkerSet}
                    onTimingStartMarkerSet={handleTimingStartMarkerSet}
                    onFinishMarkerSet={handleFinishMarkerSet}
                    onStartMarkerMove={handleStartMarkerMove}
                    onTimingStartMarkerMove={handleTimingStartMarkerMove}
                    onFinishMarkerMove={handleFinishMarkerMove}
                    onCarMarkerSet={handleCarMarkerSet}
                    onCarMarkerMove={handleCarMarkerMove}
                    onCarMarkerDelete={handleCarMarkerDelete}
                    onCornerNumberAdd={handleCornerNumberAdd}
                    onCornerNumberMove={handleCornerNumberMove}
                    onCornerNumberDelete={handleCornerNumberDelete}
                    onCornerNumberSelect={handleCornerNumberSelect}
                    coneRadius={REAL_LIFE_CONE_RADIUS}
                    lineLength={REAL_LIFE_LINE_LENGTH}
                    selectedConeId={selectedConeId}
                    onConeSelect={handleConeSelect}
                    selectedCornerNumberId={selectedCornerNumberId}
                    selectedMarker={selectedMarker}
                    onMarkerSelect={handleMarkerSelect}
                    onDeselectAll={handleDeselectAll}
                    onConeRotationChange={handleConeRotationChange}
                    onStartRotationChange={handleStartRotationChange}
                    onTimingStartRotationChange={handleTimingStartRotationChange}
                    onFinishRotationChange={handleFinishRotationChange}
                    onCarRotationChange={handleCarRotationChange}
                    onDrivingLineAddPoint={handleDrivingLineAddPoint}
                    onDrivingLineRemovePoint={handleDrivingLineRemovePoint}
                    onDrivingLineMovePoint={handleDrivingLineMovePoint}
                    onDrivingLineClear={handleDrivingLineClear}
                    carMode={carMode}
                    driveSettings={driveSettings}
                    carDriveTrace={carDriveTrace}
                    curvePoints={curvePoints}
                    curveDensity={curveDensity}
                    onCurveDensityChange={setCurveDensity}
                    curveReverse={curveReverse}
                    onCurveReverseChange={setCurveReverse}
                    onCurveAddPoint={handleCurveAddPoint}
                    onCurveApply={handleCurveApply}
                    onCurveUndoPoint={handleCurveUndoPoint}
                    onCurveCancel={handleCurveCancel}
                    racechronoSession={racechronoSession}
                    racechronoSelectedLaps={racechronoSelectedLaps}
                    racechronoVizMode={racechronoVizMode}
                    racechronoOverlayVisible={racechronoOverlayVisible}
                    racechronoTransform={racechronoTransform}
                    onRacechronoTransformChange={setRacechronoTransform}
                    racechronoFrictionCircle={racechronoFrictionCircle}
                    mapOverlay={mapOverlay}
                    onMapOverlayChange={handleMapOverlayChange}
                    onMapOverlayClear={handleMapOverlayClear}
                />
            </div>

            {/* Welcome Modal */}
            {showWelcomeModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Welcome to Cone Ninja</h2>
                        <p>Load a predefined track or start with a blank canvas.</p>
                        <select
                            className="welcome-select"
                            value={welcomeTrackId}
                            onChange={(e) => setWelcomeTrackId(e.target.value)}
                        >
                            <option value="" disabled>Select a track...</option>
                            {TRACK_LIBRARY.map(t =>
                                <option key={t.id} value={t.id}>{t.name}</option>
                            )}
                        </select>
                        <div className="modal-buttons">
                            <button
                                className="modal-btn cancel"
                                onClick={() => setShowWelcomeModal(false)}
                            >
                                Start Fresh
                            </button>
                            <button
                                className="modal-btn confirm"
                                disabled={!welcomeTrackId}
                                onClick={handleWelcomeLoadTrack}
                            >
                                Load Track
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}

            {/* Load Track Confirmation Modal */}
            {showLoadTrackModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Load Track</h2>
                        <p>Loading a track will replace your current course. Are you sure?</p>
                        <div className="modal-buttons">
                            <button
                                className="modal-btn cancel"
                                onClick={() => setShowLoadTrackModal(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-btn confirm"
                                onClick={confirmLoadTrack}
                            >
                                Load Track
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Course Confirmation Modal */}
            {showNewCourseModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>New Course</h2>
                        <p>Are you sure you want to create a new course? This will clear all current cones and markers.</p>
                        <div className="modal-buttons">
                            <button
                                className="modal-btn cancel"
                                onClick={() => setShowNewCourseModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-btn confirm"
                                onClick={confirmNewCourse}
                            >
                                Create New
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
