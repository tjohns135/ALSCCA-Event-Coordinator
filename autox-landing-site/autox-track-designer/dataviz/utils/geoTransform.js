// GPS ↔ SVG Coordinate Projection with manual adjustment
// Uses equirectangular projection (accurate for small areas like an autocross course)

window.GeoTransform = {
    // Compute initial auto-fit transform from GPS bounds to SVG track bounds
    // gpsBounds: { minLat, maxLat, minLng, maxLng }
    // trackBounds: { x, y, w, h } — SVG bounding box of the track surface
    computeAutoFit: function(gpsBounds, trackBounds) {
        var refLat = (gpsBounds.minLat + gpsBounds.maxLat) / 2;
        var refLng = (gpsBounds.minLng + gpsBounds.maxLng) / 2;
        var cosLat = Math.cos(refLat * Math.PI / 180);

        // Convert GPS bounds to meters
        var metersPerDegLng = 111320 * cosLat;
        var metersPerDegLat = 111320;

        var gpsWidthM = (gpsBounds.maxLng - gpsBounds.minLng) * metersPerDegLng;
        var gpsHeightM = (gpsBounds.maxLat - gpsBounds.minLat) * metersPerDegLat;

        // Avoid division by zero
        if (gpsWidthM < 1) gpsWidthM = 1;
        if (gpsHeightM < 1) gpsHeightM = 1;

        // Scale to fit track bounds, preserving aspect ratio
        var scaleX = trackBounds.w / gpsWidthM;
        var scaleY = trackBounds.h / gpsHeightM;
        var scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

        // Center of track bounds in SVG
        var trackCenterX = trackBounds.x + trackBounds.w / 2;
        var trackCenterY = trackBounds.y + trackBounds.h / 2;

        return {
            refLat: refLat,
            refLng: refLng,
            cosLat: cosLat,
            metersPerDegLng: metersPerDegLng,
            metersPerDegLat: metersPerDegLat,
            scale: scale,
            rotation: 0,        // degrees
            translateX: trackCenterX,  // SVG x offset (center of projection)
            translateY: trackCenterY,  // SVG y offset (center of projection)
        };
    },

    // Project a single GPS point to SVG coordinates
    projectPoint: function(lat, lng, transform) {
        // Convert to meters relative to reference point
        var xM = (lng - transform.refLng) * transform.metersPerDegLng;
        var yM = (lat - transform.refLat) * transform.metersPerDegLat;

        // Apply scale
        var xScaled = xM * transform.scale;
        var yScaled = yM * transform.scale;

        // Apply rotation (around origin, before translation)
        var rad = transform.rotation * Math.PI / 180;
        var cosR = Math.cos(rad);
        var sinR = Math.sin(rad);
        var xRot = xScaled * cosR - yScaled * sinR;
        var yRot = xScaled * sinR + yScaled * cosR;

        // Translate to SVG position (invert Y: lat increases up, SVG y increases down)
        return {
            x: transform.translateX + xRot,
            y: transform.translateY - yRot
        };
    },

    // Batch-project an entire lap's points
    projectLap: function(lapPoints, transform) {
        var projected = new Array(lapPoints.length);
        for (var i = 0; i < lapPoints.length; i++) {
            var pt = lapPoints[i];
            var svgPt = GeoTransform.projectPoint(pt.lat, pt.lng, transform);
            projected[i] = {
                x: svgPt.x,
                y: svgPt.y,
                speed: pt.speed,
                latG: pt.latG,
                lonG: pt.lonG,
                combG: pt.combG
            };
        }
        return projected;
    },

    // Manual adjustments — return new transform (immutable)
    applyDrag: function(transform, dxSVG, dySVG) {
        return Object.assign({}, transform, {
            translateX: transform.translateX + dxSVG,
            translateY: transform.translateY + dySVG
        });
    },

    applyRotation: function(transform, angleDeg) {
        return Object.assign({}, transform, {
            rotation: angleDeg
        });
    },

    applyScale: function(transform, newScale) {
        return Object.assign({}, transform, {
            scale: newScale
        });
    }
};
