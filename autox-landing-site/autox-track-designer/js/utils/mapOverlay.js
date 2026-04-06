// Map Overlay Utilities — load PNG images and compute initial fit for tracing

window.MapOverlayUtils = {
    // Load an image file and return its object URL and natural dimensions
    // Returns Promise<{ src, naturalW, naturalH }>
    loadImage: function(file) {
        return new Promise(function(resolve, reject) {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            var validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                reject(new Error('Please select a PNG or JPEG image'));
                return;
            }

            var objectUrl = URL.createObjectURL(file);
            var img = new Image();

            img.onload = function() {
                resolve({
                    src: objectUrl,
                    naturalW: img.naturalWidth,
                    naturalH: img.naturalHeight
                });
            };

            img.onerror = function() {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image'));
            };

            img.src = objectUrl;
        });
    },

    // Compute initial transform to fit image within SVG viewBox
    // viewBox: { x, y, w, h }
    // Returns { x, y, scale, rotation }
    computeInitialFit: function(naturalW, naturalH, viewBox) {
        // Scale to fit 80% of viewBox width, preserving aspect ratio
        var targetW = viewBox.w * 0.8;
        var targetH = viewBox.h * 0.8;

        var scaleX = targetW / naturalW;
        var scaleY = targetH / naturalH;
        var scale = Math.min(scaleX, scaleY);

        // Center in viewBox
        var scaledW = naturalW * scale;
        var scaledH = naturalH * scale;
        var x = viewBox.x + (viewBox.w - scaledW) / 2;
        var y = viewBox.y + (viewBox.h - scaledH) / 2;

        return {
            x: x,
            y: y,
            scale: scale,
            rotation: 0
        };
    }
};
