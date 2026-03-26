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

    // Create pointer event handlers for panning
    // onPanEnd(didMove) is called when panning ends, with true if the view actually moved
    createPanHandlers: function(viewBox, setViewBox, viewBoxRef, onPanEnd) {
        let isPanning = false;
        let startPt = null;
        let startVB = null;
        let hasMoved = false;

        const onPointerDown = (e) => {
            // Only pan on primary button (left click) on the SVG background
            if (e.button !== 0) return;
            // Don't start pan if clicking on a cone or marker element
            if (e.target.closest('[data-interactive]')) return;
            isPanning = true;
            hasMoved = false;
            startPt = { x: e.clientX, y: e.clientY };
            startVB = { ...viewBoxRef.current };
            e.currentTarget.setPointerCapture(e.pointerId);
        };

        const onPointerMove = (e) => {
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
