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
    }
};

// Make available globally
window.ExportUtils = ExportUtils;
