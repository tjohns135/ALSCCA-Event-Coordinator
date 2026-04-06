// Track library index — add entries here to include new predefined tracks
// Each track needs: id, name, description, file (JSON filename in tracks/ folder)

const TRACK_LIBRARY = [
    { id: 'alscca-2026-pts1', name: 'ALSCCA 2026 Pts 1', description: 'Autox course for ALSCCA 2026 Points Event 1', file: 'alscca-2026-pts1-course.json' },
    { id: 'alscca-2026-pts2', name: 'ALSCCA 2026 Pts 2', description: 'Autox course for ALSCCA 2026 Points Event 2', file: 'alscca-2026-pts2-course.json' },
    { id: 'alscca-2026-pts3', name: 'ALSCCA 2026 Pts 3', description: 'Autox course for ALSCCA 2026 Points Event 3', file: 'alscca-2026-pts3-course.json' },
];

window.TRACK_LIBRARY = TRACK_LIBRARY;
