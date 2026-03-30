// SVG Pan/Zoom utility for AutoX Track Designer

const SvgPanZoom = {
    // Convert screen (client) coordinates to SVG coordinates
    screenToSVG: function(svgEl, clientX, clientY) {
        const pt = svgEl.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const ctm = svgEl.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };
        const svgPt = pt.matrixTransform(ctm.inverse());
        return { x: svgPt.x, y: svgPt.y };
    },

    // Min/max zoom limits (viewBox width)
    MIN_VB_WIDTH: 20,    // max zoom in
    MAX_VB_WIDTH: 500,   // max zoom out (slightly larger than full track 431.8)

    // Handle mouse wheel zoom toward cursor
    handleWheel: function(e, viewBox, setViewBox) {
        e.preventDefault();
        const svgEl = e.currentTarget;
        const { x: svgX, y: svgY } = this.screenToSVG(svgEl, e.clientX, e.clientY);

        const zoomFactor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
        const newW = Math.max(this.MIN_VB_WIDTH, Math.min(this.MAX_VB_WIDTH, viewBox.w * zoomFactor));
        const newH = newW * (viewBox.h / viewBox.w);

        // Zoom toward cursor: keep svgX/svgY at same screen position
        const scale = newW / viewBox.w;
        const newX = svgX - (svgX - viewBox.x) * scale;
        const newY = svgY - (svgY - viewBox.y) * scale;

        setViewBox({ x: newX, y: newY, w: newW, h: newH });
    },

    // Create pointer event handlers for panning and pinch-to-zoom
    // onPanEnd(didMove) is called when panning ends, with true if the view actually moved
    createPanHandlers: function(viewBox, setViewBox, viewBoxRef, onPanEnd) {
        let isPanning = false;
        let startPt = null;
        let startVB = null;
        let hasMoved = false;

        // Multi-touch pinch-to-zoom state
        const activePointers = new Map();
        let pinchState = null; // { initialDist, initialMidSVG, initialVB }

        const getPointerDist = (p1, p2) => {
            const dx = p1.clientX - p2.clientX;
            const dy = p1.clientY - p2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const getPointerMid = (p1, p2) => ({
            clientX: (p1.clientX + p2.clientX) / 2,
            clientY: (p1.clientY + p2.clientY) / 2,
        });

        const onPointerDown = (e) => {
            // Track all pointers
            activePointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

            // If two pointers down, start pinch — cancel any active pan
            if (activePointers.size === 2) {
                isPanning = false;
                startPt = null;
                const [p1, p2] = [...activePointers.values()];
                const mid = getPointerMid(p1, p2);
                const svgEl = e.currentTarget;
                pinchState = {
                    initialDist: getPointerDist(p1, p2),
                    initialMidClient: mid,
                    initialMidSVG: SvgPanZoom.screenToSVG(svgEl, mid.clientX, mid.clientY),
                    initialVB: { ...viewBoxRef.current },
                };
                return;
            }

            // Single pointer — normal pan logic
            if (e.button !== 0) return;
            if (e.target.closest('[data-interactive]')) return;
            isPanning = true;
            hasMoved = false;
            startPt = { x: e.clientX, y: e.clientY };
            startVB = { ...viewBoxRef.current };
            e.currentTarget.setPointerCapture(e.pointerId);
        };

        const onPointerMove = (e) => {
            // Update tracked pointer position
            if (activePointers.has(e.pointerId)) {
                activePointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
            }

            // Pinch-to-zoom with two pointers
            if (activePointers.size === 2 && pinchState) {
                const [p1, p2] = [...activePointers.values()];
                const currentDist = getPointerDist(p1, p2);
                const currentMid = getPointerMid(p1, p2);

                // Zoom: scale viewBox based on pinch distance change
                const zoomScale = pinchState.initialDist / currentDist;
                const newW = Math.max(SvgPanZoom.MIN_VB_WIDTH, Math.min(SvgPanZoom.MAX_VB_WIDTH, pinchState.initialVB.w * zoomScale));
                const newH = newW * (pinchState.initialVB.h / pinchState.initialVB.w);

                // Zoom toward initial midpoint
                const s = newW / pinchState.initialVB.w;
                let newX = pinchState.initialMidSVG.x - (pinchState.initialMidSVG.x - pinchState.initialVB.x) * s;
                let newY = pinchState.initialMidSVG.y - (pinchState.initialMidSVG.y - pinchState.initialVB.y) * s;

                // Pan: track midpoint movement
                const svgEl = e.currentTarget;
                const rect = svgEl.getBoundingClientRect();
                const scaleX = newW / rect.width;
                const scaleY = newH / rect.height;
                const midDx = (currentMid.clientX - pinchState.initialMidClient.clientX) * scaleX;
                const midDy = (currentMid.clientY - pinchState.initialMidClient.clientY) * scaleY;
                newX -= midDx;
                newY -= midDy;

                setViewBox({ x: newX, y: newY, w: newW, h: newH });
                hasMoved = true;
                return;
            }

            // Single pointer pan
            if (!isPanning || !startPt) return;
            const svgEl = e.currentTarget;
            const rect = svgEl.getBoundingClientRect();
            const vb = startVB;
            const scaleX = vb.w / rect.width;
            const scaleY = vb.h / rect.height;
            const dx = (e.clientX - startPt.x) * scaleX;
            const dy = (e.clientY - startPt.y) * scaleY;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                hasMoved = true;
            }
            setViewBox({ x: vb.x - dx, y: vb.y - dy, w: vb.w, h: vb.h });
        };

        const onPointerUp = (e) => {
            activePointers.delete(e.pointerId);

            // End pinch when fewer than 2 pointers
            if (pinchState && activePointers.size < 2) {
                pinchState = null;
                if (hasMoved && onPanEnd) {
                    onPanEnd(true);
                }
                hasMoved = false;
                return;
            }

            if (isPanning && hasMoved && onPanEnd) {
                onPanEnd(true);
            }
            isPanning = false;
            startPt = null;
            startVB = null;
            hasMoved = false;
        };

        return { onPointerDown, onPointerMove, onPointerUp };
    },

    // Get initial viewBox that shows the full track with some padding
    getInitialViewBox: function(aspectRatio) {
        const padding = 10;
        return {
            x: 0 - padding,
            y: 0 - padding,
            w: 431.8 + padding * 2,
            h: 279.4 + padding * 2
        };
    }
};

window.SvgPanZoom = SvgPanZoom;
