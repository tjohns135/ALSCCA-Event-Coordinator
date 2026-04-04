// Storage utility functions for AutoX Track Designer

const STORAGE_KEY = 'autox-track-designer-course';

const StorageUtils = {
    // Generate unique ID
    generateId: function(prefix = 'item') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    // Save course to localStorage
    saveCourse: function(course) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(course));
            return true;
        } catch (e) {
            console.error('Failed to save course:', e);
            return false;
        }
    },

    // Ensure marker rotation defaults
    _ensureMarkerRotation: function(course) {
        if (course.startMarker && course.startMarker.rotation === undefined) {
            course.startMarker.rotation = 0;
        }
        if (course.timingStartMarker && course.timingStartMarker.rotation === undefined) {
            course.timingStartMarker.rotation = 0;
        }
        if (course.finishMarker && course.finishMarker.rotation === undefined) {
            course.finishMarker.rotation = 0;
        }
    },

    // Load course from localStorage
    loadCourse: function() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const course = JSON.parse(data);
                // Detect old lat/lng format (v1) and migrate
                if (course.cones && course.cones.length > 0 && course.cones[0].lat !== undefined) {
                    console.warn('Old lat/lng course format detected. Starting fresh.');
                    return null;
                }
                // Ensure new fields exist
                if (course.carMarker === undefined) course.carMarker = null;
                if (course.timingStartMarker === undefined) course.timingStartMarker = null;
                if (!Array.isArray(course.cornerNumbers)) course.cornerNumbers = [];
                if (!Array.isArray(course.drivingLine)) course.drivingLine = [];
                this._ensureMarkerRotation(course);
                return course;
            }
            return null;
        } catch (e) {
            console.error('Failed to load course:', e);
            return null;
        }
    },

    // Create a new empty course
    createNewCourse: function() {
        return {
            id: this.generateId('course'),
            version: 2,
            name: 'New Course',
            cones: [],
            startMarker: null,
            timingStartMarker: null,
            finishMarker: null,
            carMarker: null,
            cornerNumbers: [],
            drivingLine: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    // Export course as JSON file
    exportCourseJSON: function(course) {
        const dataStr = JSON.stringify(course, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${course.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-course.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Import course from JSON file
    importCourseJSON: function(file) {
        const self = this;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const course = JSON.parse(e.target.result);
                    // Validate basic structure
                    if (!course.id || !Array.isArray(course.cones)) {
                        throw new Error('Invalid course file format');
                    }
                    // Detect old lat/lng format
                    if (course.cones.length > 0 && course.cones[0].lat !== undefined) {
                        throw new Error('This course uses the old lat/lng format and is not compatible with the SVG-based designer. Please recreate it.');
                    }
                    // Ensure new fields exist
                    if (course.carMarker === undefined) course.carMarker = null;
                    if (course.timingStartMarker === undefined) course.timingStartMarker = null;
                    if (!Array.isArray(course.cornerNumbers)) course.cornerNumbers = [];
                    if (!Array.isArray(course.drivingLine)) course.drivingLine = [];
                    self._ensureMarkerRotation(course);
                    resolve(course);
                } catch (err) {
                    reject(new Error('Failed to parse course file: ' + err.message));
                }
            };
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        });
    },

    // Clear saved course
    clearCourse: function() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Failed to clear course:', e);
            return false;
        }
    }
};

// Make available globally
window.StorageUtils = StorageUtils;
