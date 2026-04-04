// Export utility functions for AutoX Track Designer

const ExportUtils = {
    // Export map as PNG image
    exportToPNG: async function(mapElementId, courseName) {
        const mapElement = document.getElementById(mapElementId);
        if (!mapElement) {
            throw new Error('Map element not found');
        }

        try {
            // Use html-to-image library
            const dataUrl = await htmlToImage.toPng(mapElement, {
                quality: 1.0,
                backgroundColor: '#1a1a2e',
                pixelRatio: 2
            });

            // Create download link
            const link = document.createElement('a');
            link.download = `${courseName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-track.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return true;
        } catch (error) {
            console.error('Failed to export PNG:', error);
            throw error;
        }
    },

    // Export map as SVG file
    exportToSVG: function(mapElementId, courseName) {
        const svgEl = document.getElementById(mapElementId);
        if (!svgEl) {
            throw new Error('Map element not found');
        }

        const clone = svgEl.cloneNode(true);
        clone.removeAttribute('style');
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width', '1920');
        clone.setAttribute('height', '1080');

        const svgData = '<?xml version="1.0" encoding="UTF-8"?>\n' + clone.outerHTML;
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `${courseName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-track.svg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// Make available globally
window.ExportUtils = ExportUtils;
