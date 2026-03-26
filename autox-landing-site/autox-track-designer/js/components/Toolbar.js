// Toolbar component for tool selection

function Toolbar({ activeTool, onToolChange }) {
    const tools = [
        {
            id: 'select',
            name: 'Select',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                    <path d="M13 13l6 6"/>
                </svg>
            )
        }
    ];

    // Cone tools group
    const coneTools = [
        {
            id: 'cone-standard',
            name: 'Standard',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>
            )
        },
        {
            id: 'cone-pointer',
            name: 'Pointer',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="9" cy="12" r="2" fill="currentColor"/>
                    <polygon points="16,12 22,8 22,16" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
            )
        },
        {
            id: 'cone-guide',
            name: 'Guide',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6,12 18,6 18,18" fill="none" stroke="currentColor" strokeWidth="2"/>
                </svg>
            )
        }
    ];

    const otherTools = [
        {
            id: 'car',
            name: 'Car',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="5" y="8" width="14" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/>
                </svg>
            )
        },
        {
            id: 'corner-number',
            name: 'Corner #',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="8"/>
                    <text x="12" y="16" fontSize="10" fill="currentColor" textAnchor="middle" stroke="none">1</text>
                </svg>
            )
        },
        {
            id: 'start',
            name: 'Start',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="10" width="18" height="4" fill="#22C55E" stroke="#22C55E" rx="1"/>
                    <text x="12" y="21" fontSize="6" fill="currentColor" textAnchor="middle">START</text>
                </svg>
            )
        },
        {
            id: 'finish',
            name: 'Finish',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="10" width="18" height="4" fill="white" stroke="currentColor"/>
                    <rect x="3" y="10" width="3" height="2" fill="black"/>
                    <rect x="9" y="10" width="3" height="2" fill="black"/>
                    <rect x="15" y="10" width="3" height="2" fill="black"/>
                    <rect x="6" y="12" width="3" height="2" fill="black"/>
                    <rect x="12" y="12" width="3" height="2" fill="black"/>
                    <rect x="18" y="12" width="3" height="2" fill="black"/>
                    <text x="12" y="21" fontSize="6" fill="currentColor" textAnchor="middle">FINISH</text>
                </svg>
            )
        },
        {
            id: 'eraser',
            name: 'Eraser',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 21h10"/>
                    <path d="M5.5 13.5L13.5 5.5a2.12 2.12 0 013 3l-8 8a2.12 2.12 0 01-3 0v0a2.12 2.12 0 010-3z"/>
                </svg>
            )
        }
    ];

    return (
        <div className="toolbar-section">
            <h3>Tools</h3>
            <div className="tool-buttons">
                {/* Select tool */}
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
                        onClick={() => onToolChange(tool.id)}
                        title={tool.name}
                    >
                        {tool.icon}
                        <span>{tool.name}</span>
                    </button>
                ))}

                {/* Cone tools section */}
                <div className="tool-group">
                    <span className="tool-group-label">Cones</span>
                    {coneTools.map(tool => (
                        <button
                            key={tool.id}
                            className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
                            onClick={() => onToolChange(tool.id)}
                            title={tool.name}
                        >
                            {tool.icon}
                            <span>{tool.name}</span>
                        </button>
                    ))}
                </div>

                {/* Other tools */}
                {otherTools.map(tool => (
                    <button
                        key={tool.id}
                        className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
                        onClick={() => onToolChange(tool.id)}
                        title={tool.name}
                    >
                        {tool.icon}
                        <span>{tool.name}</span>
                    </button>
                ))}
            </div>
            <p className="help-text">
                {activeTool === 'select' && 'Click cones to select, drag to move'}
                {activeTool === 'cone-standard' && 'Click to place standard cone'}
                {activeTool === 'cone-pointer' && 'Click to place pointer (cone + guide)'}
                {activeTool === 'cone-guide' && 'Click to place guide cone'}
                {activeTool === 'start' && 'Click to place start line'}
                {activeTool === 'finish' && 'Click to place finish line'}
                {activeTool === 'car' && 'Click to place car (max 1)'}
                {activeTool === 'corner-number' && 'Click to place corner number (max 6)'}
                {activeTool === 'eraser' && 'Click items to delete them'}
            </p>
        </div>
    );
}

window.Toolbar = Toolbar;
