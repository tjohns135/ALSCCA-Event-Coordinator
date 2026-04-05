function Joystick({ joystickRef, visible }) {
    const isMobile = React.useMemo(() =>
        window.matchMedia('(hover: none) and (pointer: coarse)').matches
    , []);

    const padRef = React.useRef(null);
    const knobRef = React.useRef(null);
    const activeRef = React.useRef(false);
    const centerRef = React.useRef({ x: 0, y: 0 });

    const PAD_RADIUS = 60;
    const KNOB_RADIUS = 24;

    // Reset joystick output on unmount or when hidden
    React.useEffect(() => {
        return () => {
            joystickRef.current = { dx: 0, dy: 0 };
        };
    }, [visible]);

    if (!isMobile || !visible) return null;

    const updateVector = (clampedX, clampedY) => {
        joystickRef.current = {
            dx: clampedX / PAD_RADIUS,
            dy: clampedY / PAD_RADIUS
        };
    };

    const resetKnob = () => {
        if (knobRef.current) {
            knobRef.current.style.transform = 'translate(-50%, -50%)';
        }
        joystickRef.current = { dx: 0, dy: 0 };
    };

    const clampToRadius = (dx, dy) => {
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, PAD_RADIUS - KNOB_RADIUS);
        const scale = dist > 0 ? clampedDist / dist : 0;
        return { x: dx * scale, y: dy * scale };
    };

    const onPointerDown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const pad = padRef.current;
        if (!pad) return;
        pad.setPointerCapture(e.pointerId);
        const rect = pad.getBoundingClientRect();
        centerRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        activeRef.current = true;

        const { x, y } = clampToRadius(
            e.clientX - centerRef.current.x,
            e.clientY - centerRef.current.y
        );
        if (knobRef.current) {
            knobRef.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        }
        updateVector(x, y);
    };

    const onPointerMove = (e) => {
        if (!activeRef.current) return;
        e.stopPropagation();
        e.preventDefault();

        const { x, y } = clampToRadius(
            e.clientX - centerRef.current.x,
            e.clientY - centerRef.current.y
        );
        if (knobRef.current) {
            knobRef.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        }
        updateVector(x, y);
    };

    const onPointerUp = (e) => {
        e.stopPropagation();
        activeRef.current = false;
        if (padRef.current) {
            padRef.current.releasePointerCapture(e.pointerId);
        }
        resetKnob();
    };

    const onPointerCancel = (e) => {
        e.stopPropagation();
        activeRef.current = false;
        resetKnob();
    };

    return React.createElement('div', {
        className: 'joystick-container',
        style: {
            position: 'absolute',
            bottom: '96px',
            right: '24px',
            zIndex: 1000,
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none'
        }
    },
        React.createElement('div', {
            ref: padRef,
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel,
            style: {
                width: PAD_RADIUS * 2 + 'px',
                height: PAD_RADIUS * 2 + 'px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                position: 'relative',
                touchAction: 'none'
            }
        },
            React.createElement('div', {
                ref: knobRef,
                style: {
                    width: KNOB_RADIUS * 2 + 'px',
                    height: KNOB_RADIUS * 2 + 'px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.4)',
                    border: '2px solid rgba(255, 255, 255, 0.6)',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none'
                }
            })
        )
    );
}

window.Joystick = Joystick;
