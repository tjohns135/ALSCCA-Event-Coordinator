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
    const [showHelpModal, setShowHelpModal] = React.useState(false);

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
            id: StorageUtils.generateId('cone'),
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
            cornerNumbers: []
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

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
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
    }, []);

    return (
        <div className="app-container">
            <Sidebar
                course={course}
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onNameChange={handleNameChange}
                onNewCourse={handleNewCourse}
                onClearCourse={handleClearCourse}
                onExportJSON={handleExportJSON}
                onImportJSON={handleImportJSON}
                onExportPNG={handleExportPNG}
                selectedCone={selectedCone}
                onConeDeselect={handleConeDeselect}
                selectedCornerNumber={selectedCornerNumber}
                onCornerNumberChange={handleCornerNumberChange}
                onCornerNumberDeselect={handleCornerNumberDeselect}
                onShowHelp={() => setShowHelpModal(true)}
            />

            <div className="main-content">
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
                />
            </div>

            {/* Toast notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
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
            {/* Help Modal */}
            {showHelpModal && (
                <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
                    <div className="modal help-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>How to Use</h2>
                        <div className="help-content">
                            <h4>Placing Elements</h4>
                            <p>Select a tool from the sidebar, then click on the map to place it.</p>
                            <ul>
                                <li><strong>Standard Cone</strong> — basic course marker</li>
                                <li><strong>Pointer Cone</strong> — directional cone (click to select, drag handle to rotate)</li>
                                <li><strong>Guide Cone</strong> — guide marker with rotation</li>
                                <li><strong>Start / Timing Start / Finish</strong> — lane markers with rotation handles</li>
                                <li><strong>Car</strong> — show vehicle position and heading</li>
                                <li><strong>Corner #</strong> — numbered corner markers (max 6)</li>
                            </ul>
                            <h4>Editing</h4>
                            <ul>
                                <li><strong>Select tool</strong> — drag items to reposition</li>
                                <li><strong>Rotate</strong> — click a pointer/guide cone or marker, then drag its rotation handle</li>
                                <li><strong>Eraser</strong> — click any element to delete it</li>
                                <li><strong>Right-click</strong> a cone to delete it</li>
                            </ul>
                            <h4>Navigation</h4>
                            <ul>
                                <li><strong>Pan</strong> — click and drag empty space (with Select tool)</li>
                                <li><strong>Zoom</strong> — scroll wheel</li>
                            </ul>
                            <h4>Keyboard Shortcuts</h4>
                            <ul>
                                <li><strong>S</strong> — Select tool</li>
                                <li><strong>C</strong> — Standard Cone</li>
                                <li><strong>1 / 2 / 3</strong> — Start / Timing Start / Finish</li>
                                <li><strong>E</strong> — Eraser</li>
                                <li><strong>Esc</strong> — Deselect all</li>
                            </ul>
                            <h4>Export</h4>
                            <p>Use <strong>Export PNG</strong> to save an image or <strong>Save/Load JSON</strong> to back up and restore courses. Your work auto-saves to the browser.</p>
                        </div>
                        <div className="modal-buttons">
                            <button className="modal-btn confirm" onClick={() => setShowHelpModal(false)}>
                                Got it
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
