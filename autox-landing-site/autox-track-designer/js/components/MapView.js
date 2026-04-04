// MapView component - SVG-based canvas with pan/zoom, cone placement, and track rendering

// Track path data (extracted from track_outline.svg, cleaned)
const TRACK_PATHS = {
    outline: "m 178.54612,84.028962 h 4.81223 c 0,0 -0.0205,1.627206 0,2.622049 0.0218,1.061422 1.48069,2.313573 2.86884,2.313573 1.20661,0 109.28956,-5.378805 109.28956,-5.378805 0,0 13.76566,-1.208741 28.26908,4.362516 11.71694,4.500875 18.60102,8.384747 23.03408,12.694915 2.91193,2.8312 7.59078,5.5404 7.59078,5.5404 l 5.84578,3.57726 -2.70478,4.10076 -6.36925,-4.25345 c 0,0 -2.47866,-1.62117 -5.03497,-1.01771 -3.61613,0.85365 -5.45785,2.72986 -7.09282,4.79129 -1.63914,2.06668 -15.26882,24.4737 -15.26882,24.4737 0,0 -1.53966,2.15918 -1.29816,5.26057 0.17624,2.26334 1.5767,4.41544 2.5056,5.54969 0.94141,1.14953 9.61161,10.74056 9.61161,10.74056 l -2.26851,7.06728 -6.34629,-9.79925 c 0,0 -4.73675,-7.17753 -8.31177,-9.57032 -3.45693,-2.31375 -13.2619,-6.15236 -20.24206,-6.98002 -6.22365,-0.73796 -12.82579,-0.17455 -12.82579,-0.17455 0,0 -1.88094,0.52167 -2.92289,3.40276 -0.96209,2.6603 -1.047,6.4129 -1.047,6.4129 l -5.10415,0.0436 c 0,0 0.0131,-2.29205 -1.08061,-4.88527 -0.75403,-1.78788 -1.79884,-3.34122 -1.79884,-3.34122 0,0 -3.70173,0.56365 -8.79764,2.36907 -2.61236,0.92553 -92.71664,48.90809 -92.71664,48.90809 0,0 -3.14225,1.79598 -4.75638,4.80612 -1.61413,3.01013 -2.35576,4.40614 -4.84239,6.06389 -2.48663,1.65776 -5.5404,2.79201 -8.50691,2.70476 -2.96651,-0.0873 -9.07403,-1.09063 -11.47341,-3.66451 -2.39938,-2.57388 -4.79876,-6.89277 -4.88602,-10.77541 -0.0873,-3.88264 -0.30537,-4.27527 -1.2215,-5.67127 -0.91613,-1.396 -11.08079,-14.52717 -11.08079,-14.52717 0,0 -6.97692,-7.98651 -14.21175,-9.65484 -5.38379,-1.24149 -28.846267,-7.5771 -28.846267,-7.5771 0,0 -6.369272,-1.70138 -8.157903,-3.96988 -1.788631,-2.26851 -4.275264,-6.63103 -5.84577,-11.25529 -1.570506,-4.62427 -10.731786,-30.31948 -10.731786,-30.31948 0,0 -0.698001,-3.14101 -0.218126,-7.32902 0.493957,-4.310909 3.271886,-11.037166 7.241777,-14.090926 3.969887,-3.05376 7.678025,-4.886015 12.084163,-5.016892 4.406141,-0.130876 14.152618,1.155424 18.951384,4.470936 4.798766,3.31551 8.245158,8.550529 8.245158,8.550529 0,0 1.42156,2.160086 2.64306,2.945338 1.2215,0.785254 2.09401,0.872503 3.14101,0.392628 1.047,-0.479877 8.24515,-5.016894 8.24515,-5.016894 0,0 1.65776,-1.61413 4.62427,-1.919504 2.96651,-0.305377 54.22605,-2.530258 54.22605,-2.530258 0,0 2.70477,-0.436255 2.74839,-2.792012 0.0299,-1.614442 0.032,-2.654203 0.032,-2.654203 z",
    "island1-outer": "m 82.396484,89.140625 c -4.477091,0.0187 -7.870221,1.669641 -10.175781,2.951172 -2.335494,1.29817 -5.92895,4.646403 -7.070312,8.533203 -0.981519,3.34247 -1.221347,8.2385 -0.748047,10.58008 0.594618,2.94178 3.43164,11.63086 3.43164,11.63086 0,0 1.277055,3.09236 2.621094,4.25586 2.06679,1.78917 3.547632,2.15895 8.097656,2.0664 l 28.427736,-1.38672 c 0,0 1.47887,0.30837 2.4043,-0.30859 0.92543,-0.61695 1.11229,-1.45092 0.58789,-2.33008 -0.52441,-0.87916 -3.11548,-4.30219 -3.73243,-6.95508 -0.61695,-2.6529 -1.11154,-6.66332 -0.67968,-8.85351 0.43187,-2.19018 1.42926,-3.81724 -0.49024,-4.92969 -1.91951,-1.11244 -3.8826,-2.02802 -5.583982,-4.449218 -1.701382,-2.421193 -4.694487,-6.095651 -7.21875,-7.960937 -2.488825,-1.839099 -5.670626,-2.861293 -9.871094,-2.84375 z",
    "island1-inner": "m 93.980339,118.85051 c 1.552061,-0.0355 2.893486,-0.09 3.434613,-0.20642 0.352562,-0.0759 0.583312,-0.65122 0.233243,-1.26107 -0.443378,-0.77241 -2.359845,-2.7223 -2.390693,-4.97418 -0.03085,-2.25188 0.20051,-3.67087 0.370174,-4.36494 0.169661,-0.69407 -0.339326,-1.04882 -1.048822,-1.48069 -0.709496,-0.43186 -2.051367,-1.38814 -2.822559,-2.57578 -0.771189,-1.18763 -2.801387,-3.63847 -5.408012,-4.579319 -2.606627,-0.940853 -5.916898,-0.49117 -7.391109,0.355843 -1.787667,1.027106 -4.297594,2.580466 -4.999966,5.781286 -0.649349,2.95918 -0.16437,5.0079 -0.16437,5.0079 0,0 1.607382,5.55948 2.250329,6.70252 0.404912,0.71986 0.988853,1.60858 2.157782,2.04762 0.624251,0.23446 2.969181,0.2602 3.921117,0.20895 2.874302,-0.15475 8.003191,-0.57347 11.858273,-0.66172 z",
    "island2-outer": "m 145.59766,95.912109 c -5.45467,-0.06107 -12.22923,0.439294 -14.90555,0.636735 -3.32128,0.24501 -6.89052,1.479787 -9.83531,4.100926 -2.94479,2.62114 -5.21137,6.82031 -5.18166,11.26949 0.0329,4.92671 3.44311,10.07374 7.23379,12.07092 3.7722,1.98745 6.23833,2.40667 8.97452,2.31835 5.21425,-0.16833 8.60333,-0.35645 13.49219,-0.64977 3.03008,-0.18179 6.34109,-0.30713 9.8327,-2.59501 3.43795,-2.25271 6.73289,-7.06145 6.57877,-12.4407 -0.1123,-5.6418 -3.66799,-10.825411 -6.98692,-12.700567 -3.36559,-1.901524 -6.42441,-1.979235 -9.20253,-2.010374 z",
    "island2-inner": "m 130.96269,106.00911 c 2.14347,-0.15813 9.68244,-0.53412 14.52717,-0.47988 1.9717,0.0221 6.71828,1.1779 6.71828,5.32227 0.21818,4.40614 -4.20917,5.89176 -6.89278,5.93302 -5.06488,0.0779 -8.541,0.27116 -13.65466,0.43624 -2.68284,0.0866 -6.42742,-0.96169 -6.45652,-5.32225 -0.0252,-3.77366 2.97932,-5.68438 5.75851,-5.8894 z",
    "island3-outer": "m 196.91371,93.529739 c -5.45467,-0.06107 -12.29093,0.500989 -14.96725,0.69843 -3.32128,0.24501 -6.89052,1.479787 -9.83531,4.100926 -2.94479,2.621135 -5.21137,6.820315 -5.18166,11.269495 0.0329,4.92671 3.44311,10.07374 7.23379,12.07092 3.7722,1.98745 6.23833,2.40667 8.97452,2.31835 5.21425,-0.16833 8.60333,-0.54154 13.49219,-0.83486 3.03008,-0.18179 6.27939,-0.36882 9.771,-2.6567 3.43795,-2.25271 6.6712,-7.24654 6.51708,-12.62579 -0.1123,-5.64181 -3.5446,-10.393546 -6.86353,-12.268702 -3.36559,-1.901524 -6.36271,-2.04093 -9.14083,-2.072069 z",
    "island3-inner": "m 182.21704,103.68844 c 2.14114,-0.18701 9.68219,-0.50214 14.52717,-0.47988 4.80968,0.0221 6.77998,3.70741 6.65658,5.19888 0.21818,4.40614 -3.90159,5.35863 -6.5843,5.43946 -4.63301,0.13959 -9.09565,0.47625 -14.20992,0.62132 -3.05301,0.0866 -5.75174,-1.57862 -5.90126,-5.26055 -0.17064,-4.20214 3.16441,-5.31421 5.51173,-5.51923 z",
    "island4-outer": "m 82.559247,134.36286 c -4.289681,0.26928 -8.901259,-0.0824 -9.485875,2.54226 -0.524422,2.35437 0.691123,4.98273 1.243956,5.89509 2.660632,4.23233 5.036101,5.3728 8.597313,6.66269 3.362856,1.21805 14.029854,4.18789 17.053932,4.78232 3.084477,0.60631 6.795587,1.98414 10.336117,-2.95421 2.10207,-2.93202 1.88101,-4.7861 1.9354,-8.8896 0.056,-4.2235 -0.506,-6.16837 -2.14443,-7.76887 -2.25221,-2.20006 -5.8498,-1.56728 -8.86425,-1.38129 -6.075107,0.37484 -10.701567,0.61126 -18.672163,1.11161 z",
    "island4-inner": "m 85.63304,139.06114 c 4.133278,-0.27213 10.468148,-0.56855 15.54721,-0.87806 1.44545,-0.0881 3.72204,-0.2126 4.55486,0.63878 0.97518,0.9969 1.34233,2.10821 1.46572,4.08246 0.12339,1.97425 -0.45212,4.76222 -0.96157,5.47281 -0.61847,0.86265 -2.50114,1.07162 -4.36603,0.78023 -1.974251,-0.30847 -14.759504,-3.43312 -16.579515,-4.17347 -1.899685,-0.77276 -4.287822,-1.97425 -5.336641,-3.20815 -1.048819,-1.23391 -0.529893,-1.92682 0.863733,-2.22103 1.388145,-0.29305 3.220836,-0.38879 4.812233,-0.49357 z",
    "island5-outer": "m 155.81008,130.61994 c -2.84823,0.12387 -5.69584,0.26167 -8.5441,0.38477 -5.90917,0.25539 -13.02466,0.72472 -17.72887,0.73409 -2.40919,0.005 -4.89075,0.15633 -7.125,1.21347 -2.60307,1.23165 -4.65115,3.65501 -4.74092,7.2222 -0.0712,2.83109 0.0433,5.68566 0.49367,8.4816 0.43452,2.69738 0.68443,5.59205 2.11743,7.91825 0.94095,1.52744 2.27534,3.1554 4.01826,3.58048 1.84559,0.45012 3.99381,-0.27922 5.52271,-1.40672 3.65469,-2.69518 7.41835,-5.76084 11.12375,-8.32326 1.70353,-1.17806 7.36167,-3.88223 13.21297,-5.92591 5.79866,-2.02529 11.51203,-2.80739 17.41516,-3.21027 1.61266,-0.038 5.05747,-0.008 6.01707,-1.62895 0.71758,-1.21192 0.64126,-3.49231 0.53661,-4.98227 -0.12826,-1.82612 -0.93561,-4.53812 -1.88354,-4.91474 -1.0742,-0.42679 -13.62391,0.56103 -20.4352,0.85726 z",
    "island5-inner": "m 148.33971,135.58814 c -6.99812,0.2306 -14.81265,0.78317 -18.53285,1.00519 -4.31247,0.25737 -7.1311,1.2987 -7.37788,4.56855 -0.24678,3.26985 0.37455,9.99903 1.85524,11.60311 1.48069,1.60408 1.72837,1.34981 3.51754,1.28811 0.89458,-0.0308 3.94207,-3.17911 7.9297,-5.82467 4.53985,-3.01194 7.28955,-4.28999 10.4277,-5.90412 2.73259,-1.40553 5.31079,-2.3489 7.18634,-2.95975 1.87555,-0.61086 3.07026,-0.80194 3.0795,-1.31363 0.0152,-0.84383 -0.60774,-2.94927 -1.39291,-2.86975 -1.51867,0.15382 -5.1096,0.35481 -6.69238,0.40696 z",
    "island6-outer": "m 191.51725,128.34308 c -1.28996,0.0532 -5.91887,0.11467 -7.11908,1.45974 -1.69749,1.90235 -1.60769,5.57232 -0.93132,7.77628 0.60952,1.98611 2.00474,3.32981 7.06277,2.84616 7.22394,-0.69074 9.30611,-0.56163 11.25357,1.22684 3.11998,2.86526 2.04069,7.1196 2.38164,13.14414 0.24532,4.3347 -0.20054,10.86098 5.59295,10.54521 6.54252,-0.3566 5.10593,-6.29189 4.95654,-10.80736 -0.14358,-4.3397 -0.78425,-14.19682 -0.912,-15.38081 -0.46527,-4.3122 0.5935,-7.78793 -1.91109,-10.15017 -1.84593,-1.74101 -6.31649,-1.28822 -8.82503,-1.20881 -4.50231,0.14252 -8.75921,0.43368 -11.54895,0.54878 z",
    "island6-inner": "m 191.63365,131.35298 c 2.89823,-0.0957 6.87956,-0.13857 11.52888,-0.58985 1.52825,-0.14834 5.00265,0.0341 5.98444,0.61696 2.43229,1.44395 1.83626,6.04072 1.94341,9.28513 0.0929,2.81191 1.2339,17.95333 0.86373,19.37232 -0.37017,1.419 -0.70949,2.6529 -2.06679,2.5912 -1.35729,-0.0617 -1.91255,-1.57323 -2.15934,-2.49866 -0.24678,-0.92543 -0.62462,-15.11468 -0.87714,-16.12749 -0.95717,-3.83897 -3.7678,-5.68398 -6.08138,-6.64026 -2.40351,-0.99344 -6.29163,-0.72163 -8.63605,-0.35146 -2.34442,0.37017 -5.39093,0.54108 -5.79872,-0.78771 -0.43436,-1.41536 -0.20265,-2.85706 0.78398,-3.85002 1.03201,-1.03863 3.05161,-0.97185 4.51498,-1.02016 z",
    "island7-outer": "m 198.72048,147.5751 c -0.1235,-2.4056 -1.51401,-2.47878 -7.59444,-2.21865 -7.81343,0.33426 -23.55344,1.47084 -26.64643,1.78678 -7.80446,0.7972 -20.29776,7.28004 -25.97372,11.7838 -2.69995,2.14236 -8.88412,6.60139 -8.63734,9.37768 0.24678,2.77628 2.40457,5.80789 5.12071,6.29291 3.45493,0.61696 24.14892,-3.26344 29.49033,-3.8868 5.02028,-0.58588 9.66169,0.84007 12.33907,5.42918 2.40498,4.12223 5.30578,4.75054 9.19259,2.89969 3.16377,-1.50656 12.09227,-5.73766 13.0177,-8.32887 0.92543,-2.59119 0.18509,-10.61159 1e-5,-12.95601 -0.18509,-2.34442 -0.17258,-7.53251 -0.30848,-10.17971 z",
    "island7-inner": "m 145.26152,160.77789 c 3.11144,-1.86466 5.36749,-3.26986 9.03836,-5.18241 3.45049,-1.79772 7.90706,-1.24717 8.4831,1.17221 0.61695,2.5912 0.0925,6.47801 -0.83289,8.32886 -0.43955,0.87909 -3.25198,1.33736 -6.72478,1.85086 -2.35527,0.34826 -17.11226,2.76942 -18.9096,2.43696 -2.13361,-0.39466 -0.18509,-2.09763 1.26475,-3.39323 1.24294,-1.11072 5.16596,-3.70598 7.68106,-5.21325 z",
    "island8-outer": "m 156.4681,177.34322 c -3.08306,0.48176 -7.34124,1.05089 -9.41953,1.31902 -2.10417,0.27147 -5.13804,0.49617 -6.40535,1.79049 -0.90584,0.92516 -0.73727,2.27576 0.35318,4.29884 1.0904,2.02307 6.3378,8.47435 8.23372,10.294 2.00308,1.92249 4.64085,1.15776 7.85925,-0.58307 2.43311,-1.31606 8.2892,-4.56418 10.6724,-5.64805 1.95098,-0.88728 3.90852,-2.44959 4.72708,-4.15495 0.52261,-1.08878 0.86051,-3.14564 0.0699,-4.69518 -0.82653,-1.61996 -2.30034,-3.45849 -3.80051,-3.66992 -3.04597,-0.42929 -8.74988,0.49563 -12.29009,1.04882 z",
    "island8-inner": "m 154.86069,189.8907 c 2.80327,-1.47725 8.71042,-4.10912 11.04039,-5.16878 0.96559,-0.43914 2.63706,-1.47461 2.19016,-2.35053 -0.40089,-0.78572 -1.6376,-1.42643 -4.25341,-1.40304 -1.98429,0.0177 -6.96238,0.92066 -8.90399,1.18924 -1.91028,0.26426 -5.96038,0.75237 -7.59222,1.05765 -1.30173,0.24353 -1.67254,0.48559 -0.77185,1.62281 0.87525,1.1051 3.2752,4.06258 4.5487,5.38326 0.96473,1.00048 1.3571,0.92628 3.74222,-0.33061 z"
};

// Real-life car dimensions in SVG units
const REAL_LIFE_CAR_WIDTH = 1.63;
const REAL_LIFE_CAR_HEIGHT = 0.82;

// Corner number real-life radius
const REAL_LIFE_CORNER_RADIUS = 3.5;

function MapView({
    course,
    activeTool,
    onConeAdd,
    onConeMove,
    onConeDelete,
    onStartMarkerSet,
    onTimingStartMarkerSet,
    onFinishMarkerSet,
    onStartMarkerMove,
    onTimingStartMarkerMove,
    onFinishMarkerMove,
    onCarMarkerSet,
    onCarMarkerMove,
    onCarMarkerDelete,
    onCornerNumberAdd,
    onCornerNumberMove,
    onCornerNumberDelete,
    onCornerNumberSelect,
    coneRadius,
    lineLength,
    selectedConeId = null,
    onConeSelect,
    selectedCornerNumberId = null,
    selectedMarker = null,
    onMarkerSelect,
    onDeselectAll,
    onConeRotationChange,
    onStartRotationChange,
    onTimingStartRotationChange,
    onFinishRotationChange,
    onCarRotationChange,
    onDrivingLineAddPoint,
    onDrivingLineRemovePoint,
    onDrivingLineMovePoint,
    onDrivingLineClear,
    carMode = 'drag',
    driveSettings,
    carDriveTrace,
    curvePoints = [],
    curveDensity = 5,
    onCurveDensityChange,
    onCurveAddPoint,
    onCurveApply,
    onCurveUndoPoint,
    curveReverse = false,
    onCurveReverseChange,
    onCurveCancel
}) {
    const svgRef = React.useRef(null);
    const activeToolRef = React.useRef(activeTool);
    const viewBoxRef = React.useRef(null);
    const draggingRef = React.useRef(null);
    const justDraggedRef = React.useRef(false);
    const [mounted, setMounted] = React.useState(false);

    // Curve overlay drag state
    const [curveOverlayOffset, setCurveOverlayOffset] = React.useState({ x: 0, y: 0 });
    const curveOverlayDragRef = React.useRef(null);

    // Reset overlay offset when starting a new curve
    React.useEffect(() => {
        if (curvePoints.length <= 1) setCurveOverlayOffset({ x: 0, y: 0 });
    }, [curvePoints.length]);

    // Drive mode refs
    const keysHeldRef = React.useRef({});
    const driveStateRef = React.useRef({ speed: 0, distanceSinceLastPoint: 0, traceStarted: false });
    const animFrameRef = React.useRef(null);
    const carMarkerRef = React.useRef(course.carMarker);
    const driveSettingsRef = React.useRef(driveSettings);
    const carDriveTraceRef = React.useRef(carDriveTrace);
    const carModeRef = React.useRef(carMode);

    const [viewBox, setViewBox] = React.useState(() => SvgPanZoom.getInitialViewBox());

    // Keep viewBoxRef in sync for pan handlers
    React.useEffect(() => {
        viewBoxRef.current = viewBox;
    }, [viewBox]);

    // Keep activeToolRef in sync
    React.useEffect(() => {
        activeToolRef.current = activeTool;
    }, [activeTool]);

    // Keep drive mode refs in sync
    React.useEffect(() => { carMarkerRef.current = course.carMarker; }, [course.carMarker]);
    React.useEffect(() => { driveSettingsRef.current = driveSettings; }, [driveSettings]);
    React.useEffect(() => { carDriveTraceRef.current = carDriveTrace; }, [carDriveTrace]);
    React.useEffect(() => { carModeRef.current = carMode; }, [carMode]);

    // Flip mounted after first render so display size memos recompute with svgRef available
    React.useEffect(() => { setMounted(true); }, []);

    // Compute min display size: returns max(realSize, minPixels in SVG units)
    const getMinDisplaySize = (realSize, minPixels) => {
        const svgEl = svgRef.current;
        if (!svgEl) return realSize;
        const rect = svgEl.getBoundingClientRect();
        const svgUnitsPerPx = viewBox.w / rect.width;
        const minSize = minPixels * svgUnitsPerPx;
        return Math.max(realSize, minSize);
    };

    const displayRadius = coneRadius * 2.5;
    const displayLineLength = lineLength * 2.5;
    const displayCarWidth = REAL_LIFE_CAR_WIDTH * 2.5;
    const displayCarHeight = REAL_LIFE_CAR_HEIGHT * 2.5;
    const displayCornerRadius = REAL_LIFE_CORNER_RADIUS * 2.5;

    // (handle sizes now computed proportionally per element in renderRotationHandles)

    // Selected cone lookup
    const selectedCone = selectedConeId ? course.cones.find(c => c.id === selectedConeId) : null;

    // Triangle points for pointer/guide cones
    const getTrianglePoints = (cx, cy, rotation, r, mode) => {
        const rad = (rotation * Math.PI) / 180;
        const perpX = -Math.sin(rad);
        const perpY = Math.cos(rad);

        if (mode === 'pointer') {
            const tipX = cx + r * Math.cos(rad);
            const tipY = cy + r * Math.sin(rad);
            const baseDist = r * 2.5;
            const spread = r * 0.7;
            const baseX = cx + baseDist * Math.cos(rad);
            const baseY = cy + baseDist * Math.sin(rad);
            return `${tipX},${tipY} ${baseX + spread * perpX},${baseY + spread * perpY} ${baseX - spread * perpX},${baseY - spread * perpY}`;
        } else {
            const totalLength = r * 2.5;
            const spread = r * 0.8;
            const tipX = cx;
            const tipY = cy;
            const baseX = cx - totalLength * Math.cos(rad);
            const baseY = cy - totalLength * Math.sin(rad);
            return `${tipX},${tipY} ${baseX + spread * perpX},${baseY + spread * perpY} ${baseX - spread * perpX},${baseY - spread * perpY}`;
        }
    };

    // Pan handlers (created once, reference viewBoxRef)
    const panHandlers = React.useMemo(() => {
        return SvgPanZoom.createPanHandlers(viewBox, setViewBox, viewBoxRef, () => {
            justDraggedRef.current = true;
        });
    }, []);

    // Wheel handler
    const handleWheel = React.useCallback((e) => {
        SvgPanZoom.handleWheel(e, viewBoxRef.current, setViewBox);
    }, []);

    // Drive mode — key listeners
    React.useEffect(() => {
        if (carMode !== 'drive' || !course.carMarker) return;
        const driveKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
        const onKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (driveKeys.includes(e.key.toLowerCase())) e.preventDefault();
            keysHeldRef.current[e.key.toLowerCase()] = true;
        };
        const onKeyUp = (e) => {
            keysHeldRef.current[e.key.toLowerCase()] = false;
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            keysHeldRef.current = {};
        };
    }, [carMode, !!course.carMarker]);

    // Drive mode — animation loop
    React.useEffect(() => {
        if (carMode !== 'drive' || !course.carMarker) {
            driveStateRef.current.speed = 0;
            return;
        }

        const tick = () => {
            const keys = keysHeldRef.current;
            const ds = driveStateRef.current;
            const settings = driveSettingsRef.current;
            const car = carMarkerRef.current;
            if (!car) { animFrameRef.current = requestAnimationFrame(tick); return; }

            const left = keys['a'] || keys['arrowleft'];
            const right = keys['d'] || keys['arrowright'];
            let rotation = car.rotation || 0;
            if (left) rotation = ((rotation - settings.turnRate) % 360 + 360) % 360;
            if (right) rotation = ((rotation + settings.turnRate) % 360 + 360) % 360;

            const forward = keys['w'] || keys['arrowup'];
            const backward = keys['s'] || keys['arrowdown'];
            if (forward) {
                ds.speed = Math.min(ds.speed + settings.acceleration, settings.maxSpeed);
            } else if (backward) {
                ds.speed = Math.max(ds.speed - settings.acceleration, -settings.maxSpeed * 0.5);
            } else {
                if (ds.speed > 0) ds.speed = Math.max(0, ds.speed - settings.deceleration);
                else if (ds.speed < 0) ds.speed = Math.min(0, ds.speed + settings.deceleration);
            }

            if (ds.speed !== 0 || left || right) {
                const rad = rotation * Math.PI / 180;
                const newX = car.x + Math.cos(rad) * ds.speed;
                const newY = car.y + Math.sin(rad) * ds.speed;
                onCarMarkerMove({ x: newX, y: newY });
                if (rotation !== (car.rotation || 0)) onCarRotationChange(Math.round(rotation));

                if (carDriveTraceRef.current && ds.speed !== 0) {
                    const dist = Math.abs(ds.speed);
                    ds.distanceSinceLastPoint += dist;
                    if (!ds.traceStarted) {
                        onDrivingLineClear();
                        onDrivingLineAddPoint({ x: newX, y: newY });
                        ds.traceStarted = true;
                        ds.distanceSinceLastPoint = 0;
                    } else if (ds.distanceSinceLastPoint >= 5) {
                        onDrivingLineAddPoint({ x: newX, y: newY });
                        ds.distanceSinceLastPoint = 0;
                    }
                }
            }

            animFrameRef.current = requestAnimationFrame(tick);
        };

        driveStateRef.current = { speed: 0, distanceSinceLastPoint: 0, traceStarted: false };
        animFrameRef.current = requestAnimationFrame(tick);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            driveStateRef.current.speed = 0;
        };
    }, [carMode, !!course.carMarker]);

    // Click on SVG background to place or deselect
    const handleSvgClick = React.useCallback((e) => {
        if (justDraggedRef.current) {
            justDraggedRef.current = false;
            return;
        }
        if (draggingRef.current) return;
        if (carModeRef.current === 'drive') return;

        const svgEl = svgRef.current;
        if (!svgEl) return;

        const target = e.target;
        if (target.closest('[data-interactive]')) return;

        const tool = activeToolRef.current;

        // Deselect all when clicking empty space
        onDeselectAll();
        if (tool === 'select') return;

        const { x, y } = SvgPanZoom.screenToSVG(svgEl, e.clientX, e.clientY);

        switch (tool) {
            case 'cone-standard':
                onConeAdd({ x, y });
                break;
            case 'cone-pointer':
            case 'cone-guide':
                break;
            case 'start':
            case 'timing-start':
            case 'finish':
                break;
            case 'car':
                break;
            case 'corner-number':
                onCornerNumberAdd({ x, y });
                break;
            case 'driving-line':
                onDrivingLineAddPoint({ x, y });
                break;
            case 'cone-standard-curve':
            case 'cone-pointer-curve':
            case 'cone-guide-curve':
                onCurveAddPoint({ x, y });
                break;
        }
    }, [onConeAdd, onStartMarkerSet, onTimingStartMarkerSet, onFinishMarkerSet, onCarMarkerSet, onCornerNumberAdd, onDeselectAll, onDrivingLineAddPoint, onCurveAddPoint]);

    // Cone pointer events
    const handleConePointerDown = React.useCallback((e, coneId) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        if (carModeRef.current === 'drive') return;

        const tool = activeToolRef.current;
        if (tool === 'eraser') {
            onConeDelete(coneId);
            return;
        }

        onDeselectAll();
        const svgEl = svgRef.current;
        if (!svgEl) return;
        const { x, y } = SvgPanZoom.screenToSVG(svgEl, e.clientX, e.clientY);
        const cone = course.cones.find(c => c.id === coneId);
        if (!cone) return;

        draggingRef.current = {
            type: 'cone',
            id: coneId,
            startX: x,
            startY: y,
            origX: cone.x,
            origY: cone.y,
            moved: false
        };
        e.currentTarget.closest('svg').setPointerCapture(e.pointerId);
    }, [course.cones, onConeDelete]);

    // Marker pointer events (start/finish)
    const handleMarkerPointerDown = React.useCallback((e, markerId) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        if (carModeRef.current === 'drive') return;

        const tool = activeToolRef.current;
        if (tool === 'eraser') {
            if (markerId === 'start') onStartMarkerSet(null);
            if (markerId === 'timing-start') onTimingStartMarkerSet(null);
            if (markerId === 'finish') onFinishMarkerSet(null);
            return;
        }

        onDeselectAll();
        const svgEl = svgRef.current;
        if (!svgEl) return;
        const { x, y } = SvgPanZoom.screenToSVG(svgEl, e.clientX, e.clientY);
        const marker = markerId === 'start' ? course.startMarker
            : markerId === 'timing-start' ? course.timingStartMarker
            : course.finishMarker;
        if (!marker) return;

        draggingRef.current = {
            type: 'marker',
            id: markerId,
            startX: x,
            startY: y,
            origX: marker.x,
            origY: marker.y,
            moved: false
        };
        e.currentTarget.closest('svg').setPointerCapture(e.pointerId);
    }, [course.startMarker, course.timingStartMarker, course.finishMarker, onStartMarkerSet, onTimingStartMarkerSet, onFinishMarkerSet]);

    // Car pointer events
    const handleCarPointerDown = React.useCallback((e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        if (carModeRef.current === 'drive') return;

        const tool = activeToolRef.current;
        if (tool === 'eraser') {
            onCarMarkerDelete();
            return;
        }

        onDeselectAll();
        const svgEl = svgRef.current;
        if (!svgEl) return;
        const { x, y } = SvgPanZoom.screenToSVG(svgEl, e.clientX, e.clientY);
        const car = course.carMarker;
        if (!car) return;

        draggingRef.current = {
            type: 'car',
            startX: x,
            startY: y,
            origX: car.x,
            origY: car.y,
            moved: false
        };
        e.currentTarget.closest('svg').setPointerCapture(e.pointerId);
    }, [course.carMarker, onCarMarkerDelete]);

    // Corner number pointer events
    const handleCornerNumberPointerDown = React.useCallback((e, cnId) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        if (carModeRef.current === 'drive') return;

        const tool = activeToolRef.current;
        if (tool === 'eraser') {
            onCornerNumberDelete(cnId);
            return;
        }

        onDeselectAll();
        const svgEl = svgRef.current;
        if (!svgEl) return;
        const { x, y } = SvgPanZoom.screenToSVG(svgEl, e.clientX, e.clientY);
        const cn = (course.cornerNumbers || []).find(c => c.id === cnId);
        if (!cn) return;

        draggingRef.current = {
            type: 'cornerNumber',
            id: cnId,
            startX: x,
            startY: y,
            origX: cn.x,
            origY: cn.y,
            moved: false
        };
        e.currentTarget.closest('svg').setPointerCapture(e.pointerId);
    }, [course.cornerNumbers, onCornerNumberDelete]);

    // Rotation handle pointer down
    const handleRotationPointerDown = React.useCallback((e, target, id, centerX, centerY) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();

        draggingRef.current = {
            type: 'rotation',
            target: target,
            id: id,
            centerX: centerX,
            centerY: centerY,
            moved: false
        };
        svgRef.current.setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMoveDrag = React.useCallback((e) => {
        if (!draggingRef.current) return;
        const svgEl = svgRef.current;
        if (!svgEl) return;

        const { x, y } = SvgPanZoom.screenToSVG(svgEl, e.clientX, e.clientY);
        const drag = draggingRef.current;

        if (drag.type === 'rotation') {
            drag.moved = true;
            const angle = Math.atan2(y - drag.centerY, x - drag.centerX) * (180 / Math.PI);
            const normalized = ((angle % 360) + 360) % 360;
            const rotation = Math.round(normalized);

            if (drag.target === 'cone') {
                onConeRotationChange(drag.id, rotation);
            } else if (drag.target === 'start') {
                onStartRotationChange(((rotation + 90) % 360 + 360) % 360);
            } else if (drag.target === 'timing-start') {
                onTimingStartRotationChange(((rotation + 90) % 360 + 360) % 360);
            } else if (drag.target === 'finish') {
                onFinishRotationChange(((rotation + 90) % 360 + 360) % 360);
            } else if (drag.target === 'car') {
                onCarRotationChange(rotation);
                const armLength = displayCarWidth * 1.5;
                const distFromCenter = Math.sqrt(
                    Math.pow(x - drag.centerX, 2) + Math.pow(y - drag.centerY, 2)
                );
                const moveDistance = distFromCenter - armLength;
                if (Math.abs(moveDistance) > 0.3) {
                    const rad = rotation * Math.PI / 180;
                    const newX = drag.centerX + Math.cos(rad) * moveDistance;
                    const newY = drag.centerY + Math.sin(rad) * moveDistance;
                    onCarMarkerMove({ x: newX, y: newY });
                    if (carDriveTraceRef.current) {
                        const ds = driveStateRef.current;
                        const dist = Math.abs(moveDistance);
                        ds.distanceSinceLastPoint += dist;
                        if (!ds.traceStarted) {
                            onDrivingLineClear();
                            onDrivingLineAddPoint({ x: newX, y: newY });
                            ds.traceStarted = true;
                            ds.distanceSinceLastPoint = 0;
                        } else if (ds.distanceSinceLastPoint >= 5) {
                            onDrivingLineAddPoint({ x: newX, y: newY });
                            ds.distanceSinceLastPoint = 0;
                        }
                    }
                    drag.centerX = newX;
                    drag.centerY = newY;
                }
            }
            return;
        }

        if (drag.type === 'orient-new-cone') {
            const dx = x - drag.centerX;
            const dy = y - drag.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.5) {
                drag.moved = true;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                const normalized = ((angle % 360) + 360) % 360;
                onConeRotationChange(drag.id, Math.round(normalized));
            }
            return;
        }

        if (drag.type === 'orient-new-marker') {
            const dx = x - drag.centerX;
            const dy = y - drag.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.5) {
                drag.moved = true;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                const normalized = ((angle % 360) + 360) % 360;
                const rotation = Math.round(normalized);
                if (drag.markerType === 'start') {
                    onStartRotationChange(((rotation + 90) % 360 + 360) % 360);
                } else if (drag.markerType === 'timing-start') {
                    onTimingStartRotationChange(((rotation + 90) % 360 + 360) % 360);
                } else if (drag.markerType === 'finish') {
                    onFinishRotationChange(((rotation + 90) % 360 + 360) % 360);
                }
            }
            return;
        }

        if (drag.type === 'orient-new-car') {
            const dx = x - drag.centerX;
            const dy = y - drag.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.5) {
                drag.moved = true;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                const normalized = ((angle % 360) + 360) % 360;
                onCarRotationChange(Math.round(normalized));
            }
            return;
        }

        const dx = x - drag.startX;
        const dy = y - drag.startY;

        if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
            drag.moved = true;
        }

        const newX = drag.origX + dx;
        const newY = drag.origY + dy;

        if (drag.type === 'cone') {
            onConeMove(drag.id, { x: newX, y: newY });
        } else if (drag.type === 'marker') {
            if (drag.id === 'start') onStartMarkerMove({ x: newX, y: newY });
            if (drag.id === 'timing-start') onTimingStartMarkerMove({ x: newX, y: newY });
            if (drag.id === 'finish') onFinishMarkerMove({ x: newX, y: newY });
        } else if (drag.type === 'car') {
            onCarMarkerMove({ x: newX, y: newY });
        } else if (drag.type === 'cornerNumber') {
            onCornerNumberMove(drag.id, { x: newX, y: newY });
        } else if (drag.type === 'drivingLinePoint') {
            onDrivingLineMovePoint(drag.id, { x: newX, y: newY });
        }
    }, [onConeMove, onStartMarkerMove, onTimingStartMarkerMove, onFinishMarkerMove, onCarMarkerMove, onCornerNumberMove,
        onConeRotationChange, onStartRotationChange, onTimingStartRotationChange, onFinishRotationChange, onCarRotationChange, onDrivingLineMovePoint]);

    const handlePointerUpDrag = React.useCallback((e) => {
        const drag = draggingRef.current;
        if (!drag) return;

        // If we didn't move, treat as a click (select) — works in any tool
        if (!drag.moved) {
            if (drag.type === 'cone') {
                const cone = course.cones.find(c => c.id === drag.id);
                if (cone && (cone.type === 'pointer' || cone.type === 'guide')) {
                    onConeSelect(drag.id);
                }
            } else if (drag.type === 'cornerNumber') {
                onCornerNumberSelect(drag.id);
            } else if (drag.type === 'marker') {
                onMarkerSelect(drag.id);
            } else if (drag.type === 'car') {
                onMarkerSelect('car');
            }
        }

        justDraggedRef.current = true;
        draggingRef.current = null;
    }, [course.cones, onConeSelect, onCornerNumberSelect, onMarkerSelect]);

    // Right-click delete
    const handleConeContextMenu = React.useCallback((e, coneId) => {
        e.preventDefault();
        e.stopPropagation();
        if (carModeRef.current === 'drive') return;
        onConeDelete(coneId);
    }, [onConeDelete]);

    const handleCarContextMenu = React.useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (carModeRef.current === 'drive') return;
        onCarMarkerDelete();
    }, [onCarMarkerDelete]);

    const handleCornerNumberContextMenu = React.useCallback((e, cnId) => {
        e.preventDefault();
        e.stopPropagation();
        if (carModeRef.current === 'drive') return;
        onCornerNumberDelete(cnId);
    }, [onCornerNumberDelete]);

    // Driving line point pointer events
    const handleDrivingLinePointPointerDown = React.useCallback((e, pointId) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        if (carModeRef.current === 'drive') return;

        const tool = activeToolRef.current;
        if (tool === 'eraser') {
            onDrivingLineRemovePoint(pointId);
            return;
        }

        onDeselectAll();
        const svgEl = svgRef.current;
        if (!svgEl) return;
        const { x, y } = SvgPanZoom.screenToSVG(svgEl, e.clientX, e.clientY);
        const pt = (course.drivingLine || []).find(p => p.id === pointId);
        if (!pt) return;

        draggingRef.current = {
            type: 'drivingLinePoint',
            id: pointId,
            startX: x,
            startY: y,
            origX: pt.x,
            origY: pt.y,
            moved: false
        };
        e.currentTarget.closest('svg').setPointerCapture(e.pointerId);
    }, [course.drivingLine, onDrivingLineRemovePoint]);

    const handleDrivingLinePointContextMenu = React.useCallback((e, pointId) => {
        e.preventDefault();
        if (carModeRef.current === 'drive') return;
        e.stopPropagation();
        onDrivingLineRemovePoint(pointId);
    }, [onDrivingLineRemovePoint]);

    // Cursor style based on tool
    const getCursorStyle = () => {
        switch (activeTool) {
            case 'cone-standard':
            case 'cone-pointer':
            case 'cone-guide':
            case 'start':
            case 'timing-start':
            case 'finish':
            case 'car':
            case 'corner-number':
            case 'driving-line':
                return 'crosshair';
            case 'eraser':
                return 'pointer';
            case 'select':
            default:
                return draggingRef.current ? 'grabbing' : 'grab';
        }
    };

    // Render start/timing-start/finish marker
    const renderMarkerLine = (marker, type, color) => {
        if (!marker) return null;
        const rotation = marker.rotation || 0;
        const halfLen = displayLineLength / 2;
        const rad = (rotation * Math.PI) / 180;
        const dx = halfLen * Math.cos(rad);
        const dy = halfLen * Math.sin(rad);
        const perpRad = rad + Math.PI / 2;
        const isMarkerSelected = selectedMarker === type;

        const strokeWidth = Math.max(0.5, displayRadius * 0.5);
        const fontSize = Math.max(2, displayRadius * 1.5);
        const coneR = displayRadius * 1.2;
        const markerId = type;

        const elements = [];
        let label, textColor = color;
        let rowGap = 0;

        // Configure per type — all share the same construction
        let lineColor, numRows;
        if (type === 'start') {
            label = 'START'; lineColor = '#22C55E'; numRows = 1;
        } else if (type === 'timing-start') {
            label = 'TIMING START'; lineColor = '#F59E0B'; numRows = 2;
        } else if (type === 'finish') {
            label = 'FINISH'; lineColor = '#EF4444'; numRows = 10;
        }
        textColor = lineColor;

        const rowSpacing = displayLineLength * 0.25;
        const rowGapTotal = (numRows - 1) * rowSpacing;
        const perpDxUnit = Math.cos(perpRad);
        const perpDyUnit = Math.sin(perpRad);

        for (let row = 0; row < numRows; row++) {
            const rowOffset = (rowGapTotal / 2) - row * rowSpacing;
            const rpx = rowOffset * perpDxUnit;
            const rpy = rowOffset * perpDyUnit;

            if (row === 0) {
                elements.push(
                    React.createElement('line', {
                        key: `${type}-line`,
                        x1: marker.x - dx + rpx, y1: marker.y - dy + rpy,
                        x2: marker.x + dx + rpx, y2: marker.y + dy + rpy,
                        stroke: lineColor,
                        strokeWidth: strokeWidth,
                        strokeLinecap: 'round'
                    })
                );
            }

            elements.push(
                React.createElement('circle', {
                    key: `${type}-r${row}-c0`,
                    cx: marker.x - dx + rpx, cy: marker.y - dy + rpy,
                    r: coneR, fill: '#333'
                }),
                React.createElement('circle', {
                    key: `${type}-r${row}-c1`,
                    cx: marker.x + dx + rpx, cy: marker.y + dy + rpy,
                    r: coneR, fill: '#333'
                })
            );
        }

        rowGap = rowGapTotal / 2;

        // Text offset: clear the row gap + base offset
        const baseTextOffset = getMinDisplaySize(0.5, 8);
        const textOffset = rowGap + baseTextOffset;
        const textX = marker.x + textOffset * Math.cos(perpRad);
        const textY = marker.y + textOffset * Math.sin(perpRad);

        // Selection highlight radius accounts for row gap
        const highlightR = displayLineLength * 0.4 + rowGap;

        return React.createElement('g', {
            key: `marker-${type}`,
            'data-interactive': 'true',
            style: { cursor: 'move' },
            onPointerDown: (e) => handleMarkerPointerDown(e, markerId),
        },
            isMarkerSelected && React.createElement('circle', {
                cx: marker.x, cy: marker.y,
                r: highlightR,
                fill: textColor, opacity: 0.15
            }),
            ...elements,
            React.createElement('text', {
                x: textX, y: textY,
                fontSize: fontSize,
                fill: textColor,
                textAnchor: 'middle',
                dominantBaseline: 'hanging',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif',
                transform: `rotate(${rotation} ${textX} ${textY})`
            }, label)
        );
    };

    // Render a single cone
    const renderCone = (cone) => {
        const isSelected = cone.id === selectedConeId;
        const r = displayRadius;
        const selectedFilter = isSelected ? 'url(#cone-glow)' : undefined;

        const elements = [];

        if (cone.type === 'standard' || cone.type === 'pointer') {
            elements.push(
                React.createElement('circle', {
                    key: `cone-${cone.id}`,
                    cx: cone.x,
                    cy: cone.y,
                    r: r,
                    fill: '#333',
                    stroke: isSelected ? '#e94560' : 'none',
                    strokeWidth: isSelected ? 0.4 : 0,
                    filter: selectedFilter,
                    'data-interactive': 'true',
                    style: { cursor: activeTool === 'eraser' ? 'pointer' : 'move' },
                    onPointerDown: (e) => handleConePointerDown(e, cone.id),
                    onContextMenu: (e) => handleConeContextMenu(e, cone.id)
                })
            );
        }

        if (cone.type === 'pointer') {
            const rotation = cone.rotation || 45;
            elements.push(
                React.createElement('polygon', {
                    key: `tri-${cone.id}`,
                    points: getTrianglePoints(cone.x, cone.y, rotation, r, 'pointer'),
                    fill: '#333',
                    filter: selectedFilter,
                    'data-interactive': 'true',
                    style: { cursor: activeTool === 'eraser' ? 'pointer' : 'move', pointerEvents: 'all' },
                    onPointerDown: (e) => handleConePointerDown(e, cone.id),
                    onContextMenu: (e) => handleConeContextMenu(e, cone.id)
                })
            );
        }

        if (cone.type === 'guide') {
            const rotation = cone.rotation || 45;
            elements.push(
                React.createElement('polygon', {
                    key: `guide-tri-${cone.id}`,
                    points: getTrianglePoints(cone.x, cone.y, rotation, r, 'guide'),
                    fill: '#333',
                    filter: selectedFilter,
                    'data-interactive': 'true',
                    style: { cursor: activeTool === 'eraser' ? 'pointer' : 'move', pointerEvents: 'all' },
                    onPointerDown: (e) => handleConePointerDown(e, cone.id),
                    onContextMenu: (e) => handleConeContextMenu(e, cone.id)
                })
            );
        }

        return elements;
    };

    // Render car marker
    const renderCarMarker = () => {
        const car = course.carMarker;
        if (!car) return null;

        const w = displayCarWidth;
        const h = displayCarHeight;
        const rotation = car.rotation || 0;
        const isCarSelected = selectedMarker === 'car';

        return React.createElement('g', {
            key: 'car-marker',
            'data-interactive': 'true',
            style: { cursor: activeTool === 'eraser' ? 'pointer' : 'move' },
            onPointerDown: handleCarPointerDown,
            onContextMenu: handleCarContextMenu
        },
            // Selection highlight
            isCarSelected && React.createElement('circle', {
                cx: car.x, cy: car.y,
                r: w * 0.6,
                fill: '#888', opacity: 0.15
            }),
            React.createElement('rect', {
                x: car.x - w / 2,
                y: car.y - h / 2,
                width: w,
                height: h,
                fill: '#111',
                stroke: isCarSelected ? '#e94560' : '#555',
                strokeWidth: isCarSelected ? Math.max(0.15, w * 0.04) : Math.max(0.1, w * 0.03),
                rx: Math.max(0.05, w * 0.05),
                transform: `rotate(${rotation} ${car.x} ${car.y})`,
                filter: isCarSelected ? 'url(#cone-glow)' : undefined
            })
        );
    };

    // Render corner numbers
    const renderCornerNumbers = () => {
        const numbers = course.cornerNumbers || [];
        return numbers.map(cn => {
            const isSelected = cn.id === selectedCornerNumberId;
            const r = displayCornerRadius;
            const fontSize = r * 1.2;

            return React.createElement('g', {
                key: `corner-${cn.id}`,
                'data-interactive': 'true',
                style: { cursor: activeTool === 'eraser' ? 'pointer' : 'move' },
                onPointerDown: (e) => handleCornerNumberPointerDown(e, cn.id),
                onContextMenu: (e) => handleCornerNumberContextMenu(e, cn.id)
            },
                React.createElement('circle', {
                    cx: cn.x,
                    cy: cn.y,
                    r: r,
                    fill: 'white',
                    stroke: isSelected ? '#e94560' : '#333',
                    strokeWidth: isSelected ? 0.5 : 0.3
                }),
                React.createElement('text', {
                    x: cn.x,
                    y: cn.y,
                    fontSize: fontSize,
                    fill: '#333',
                    textAnchor: 'middle',
                    dominantBaseline: 'central',
                    fontWeight: 'bold',
                    fontFamily: 'Arial, sans-serif',
                    style: { pointerEvents: 'none' }
                }, String(cn.number))
            );
        });
    };

    // Render a rotation handle (line + draggable circle)
    const renderRotationHandle = (centerX, centerY, rotation, color, target, id, arm, r) => {
        const rad = (rotation * Math.PI) / 180;
        const endX = centerX + arm * Math.cos(rad);
        const endY = centerY + arm * Math.sin(rad);

        return React.createElement('g', { key: `rot-handle-${target}-${id || ''}` },
            // Dashed line from center to handle
            React.createElement('line', {
                x1: centerX, y1: centerY,
                x2: endX, y2: endY,
                stroke: color,
                strokeWidth: Math.max(0.15, r * 0.15),
                strokeDasharray: `${r * 0.4} ${r * 0.3}`,
                opacity: 0.6,
                style: { pointerEvents: 'none' }
            }),
            // Draggable circle
            React.createElement('circle', {
                cx: endX,
                cy: endY,
                r: r,
                fill: color,
                stroke: '#fff',
                strokeWidth: Math.max(0.1, r * 0.15),
                'data-interactive': 'true',
                style: { cursor: 'grab' },
                onPointerDown: (e) => handleRotationPointerDown(e, target, id, centerX, centerY)
            })
        );
    };

    // Render rotation handles layer
    const renderRotationHandles = () => {
        const handles = [];

        // Selected cone rotation handle — proportional to displayRadius
        if (selectedCone && (selectedCone.type === 'pointer' || selectedCone.type === 'guide')) {
            handles.push(renderRotationHandle(
                selectedCone.x, selectedCone.y,
                selectedCone.rotation || 45,
                '#e94560', 'cone', selectedCone.id,
                displayRadius * 10, displayRadius * 2.5
            ));
        }

        // Selected start marker rotation handle — rotated 90° CCW
        if (selectedMarker === 'start' && course.startMarker) {
            handles.push(renderRotationHandle(
                course.startMarker.x, course.startMarker.y,
                (course.startMarker.rotation || 0) - 90,
                '#22C55E', 'start', null,
                displayLineLength * 1.25, displayLineLength * 0.15
            ));
        }

        // Selected timing start marker rotation handle — rotated 90° CCW
        if (selectedMarker === 'timing-start' && course.timingStartMarker) {
            handles.push(renderRotationHandle(
                course.timingStartMarker.x, course.timingStartMarker.y,
                (course.timingStartMarker.rotation || 0) - 90,
                '#F59E0B', 'timing-start', null,
                displayLineLength * 1.25, displayLineLength * 0.15
            ));
        }

        // Selected finish marker rotation handle — rotated 90° CCW (same as start/timing)
        if (selectedMarker === 'finish' && course.finishMarker) {
            handles.push(renderRotationHandle(
                course.finishMarker.x, course.finishMarker.y,
                (course.finishMarker.rotation || 0) - 90,
                '#666', 'finish', null,
                displayLineLength * 1.25, displayLineLength * 0.15
            ));
        }

        // Selected car rotation handle — proportional to displayCarWidth (hidden in drive mode)
        if (selectedMarker === 'car' && course.carMarker && carMode !== 'drive') {
            handles.push(renderRotationHandle(
                course.carMarker.x, course.carMarker.y,
                course.carMarker.rotation || 0,
                '#888', 'car', null,
                displayCarWidth * 1.5, displayCarWidth * 0.25
            ));
        }

        return handles;
    };

    // Render driving line path and control points
    const renderDrivingLine = () => {
        const points = course.drivingLine || [];
        const elements = [];
        const strokeWidth = Math.max(0.3, displayRadius * 0.8);
        const pointRadius = Math.max(displayRadius * 1.2, 0.5);

        // Smooth curve path (always visible when points exist)
        if (points.length >= 2) {
            elements.push(
                React.createElement('path', {
                    key: 'dl-path',
                    d: CatmullRomUtils.toSVGPath(points),
                    fill: 'none',
                    stroke: '#FF6B35',
                    strokeWidth: strokeWidth,
                    strokeDasharray: `${strokeWidth * 2.5},${strokeWidth * 1.5}`,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    opacity: 0.8,
                    style: { pointerEvents: 'none' }
                })
            );
        }

        // Control point circles (visible when driving-line or select tool is active)
        if (activeTool === 'driving-line' || activeTool === 'select' || activeTool === 'eraser') {
            points.forEach((pt, index) => {
                const isEndpoint = index === 0 || index === points.length - 1;
                elements.push(
                    React.createElement('circle', {
                        key: `dl-pt-${pt.id}`,
                        cx: pt.x,
                        cy: pt.y,
                        r: pointRadius,
                        fill: isEndpoint ? '#FF6B35' : '#FFA56B',
                        stroke: '#fff',
                        strokeWidth: Math.max(0.15, strokeWidth * 0.3),
                        opacity: 0.9,
                        'data-interactive': 'true',
                        style: { cursor: activeTool === 'eraser' ? 'pointer' : 'move' },
                        onPointerDown: (e) => handleDrivingLinePointPointerDown(e, pt.id),
                        onContextMenu: (e) => handleDrivingLinePointContextMenu(e, pt.id)
                    })
                );
            });
        }

        return elements;
    };

    // Render curve cone preview
    const renderCurvePreview = () => {
        if (!curvePoints || curvePoints.length === 0 || !activeTool.endsWith('-curve')) return [];

        const elements = [];
        const coneType = activeTool.replace('cone-', '').replace('-curve', '');

        // Render control point markers
        curvePoints.forEach((pt, i) => {
            elements.push(
                React.createElement('circle', {
                    key: `curve-cp-${i}`,
                    cx: pt.x, cy: pt.y,
                    r: Math.max(displayRadius * 0.8, 0.3),
                    fill: 'rgba(255, 255, 255, 0.6)',
                    stroke: '#fff',
                    strokeWidth: Math.max(0.1, displayRadius * 0.2),
                    style: { pointerEvents: 'none' }
                })
            );
        });

        // Render preview cones along the curve
        if (curvePoints.length >= 1) {
            const samples = curvePoints.length >= 2
                ? CatmullRomUtils.samplePoints(curvePoints, curveDensity)
                : [{ x: curvePoints[0].x, y: curvePoints[0].y, angle: 0 }];

            samples.forEach((s, i) => {
                if (coneType === 'standard') {
                    elements.push(
                        React.createElement('circle', {
                            key: `curve-preview-${i}`,
                            cx: s.x, cy: s.y,
                            r: displayRadius,
                            fill: '#333',
                            opacity: 0.5,
                            stroke: '#666',
                            strokeWidth: Math.max(0.1, displayRadius * 0.15),
                            style: { pointerEvents: 'none' }
                        })
                    );
                } else {
                    const r = displayRadius;
                    const rotation = curveReverse ? (s.angle + 180) % 360 : s.angle;
                    const rad = (rotation * Math.PI) / 180;
                    const perpX = -Math.sin(rad);
                    const perpY = Math.cos(rad);

                    if (coneType === 'pointer') {
                        const tipX = s.x + r * Math.cos(rad);
                        const tipY = s.y + r * Math.sin(rad);
                        const baseDist = r * 2.5;
                        const spread = r * 0.7;
                        const baseX = s.x + baseDist * Math.cos(rad);
                        const baseY = s.y + baseDist * Math.sin(rad);
                        const triPoints = `${tipX},${tipY} ${baseX + spread * perpX},${baseY + spread * perpY} ${baseX - spread * perpX},${baseY - spread * perpY}`;
                        elements.push(
                            React.createElement('circle', {
                                key: `curve-preview-c-${i}`,
                                cx: s.x, cy: s.y, r: r,
                                fill: '#333', opacity: 0.5,
                                style: { pointerEvents: 'none' }
                            }),
                            React.createElement('polygon', {
                                key: `curve-preview-t-${i}`,
                                points: triPoints,
                                fill: '#333', opacity: 0.4,
                                style: { pointerEvents: 'none' }
                            })
                        );
                    } else {
                        const totalLength = r * 2.5;
                        const spread = r * 0.8;
                        const baseX = s.x - totalLength * Math.cos(rad);
                        const baseY = s.y - totalLength * Math.sin(rad);
                        const triPoints = `${s.x},${s.y} ${baseX + spread * perpX},${baseY + spread * perpY} ${baseX - spread * perpX},${baseY - spread * perpY}`;
                        elements.push(
                            React.createElement('polygon', {
                                key: `curve-preview-t-${i}`,
                                points: triPoints,
                                fill: '#333', opacity: 0.4,
                                style: { pointerEvents: 'none' }
                            })
                        );
                    }
                }
            });
        }

        // Floating slider + apply button near the first control point
        if (curvePoints.length >= 1) {
            const lastPt = curvePoints[0];
            const svgEl = svgRef.current;
            if (svgEl) {
                const rect = svgEl.getBoundingClientRect();
                const svgUnitsPerPx = viewBox.w / rect.width;
                const scaleFactor = 1.5;
                const overlayW = 120 * svgUnitsPerPx * scaleFactor;
                const overlayH = 50 * svgUnitsPerPx * scaleFactor;
                const offsetX = 20 * svgUnitsPerPx;
                const offsetY = 10 * svgUnitsPerPx;

                elements.push(
                    React.createElement('foreignObject', {
                        key: 'curve-overlay',
                        x: lastPt.x + offsetX + curveOverlayOffset.x,
                        y: lastPt.y + offsetY + curveOverlayOffset.y,
                        width: overlayW,
                        height: overlayH,
                        style: { overflow: 'visible' }
                    },
                        React.createElement('div', {
                            className: 'curve-overlay',
                            'data-interactive': 'true',
                            onClick: (e) => e.stopPropagation(),
                            onPointerDown: (e) => {
                                e.stopPropagation();
                                if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
                                curveOverlayDragRef.current = { startX: e.clientX, startY: e.clientY, origOffset: { ...curveOverlayOffset } };
                                e.currentTarget.setPointerCapture(e.pointerId);
                            },
                            onPointerMove: (e) => {
                                if (!curveOverlayDragRef.current) return;
                                const d = curveOverlayDragRef.current;
                                const rect = svgRef.current.getBoundingClientRect();
                                const uPerPx = viewBox.w / rect.width;
                                setCurveOverlayOffset({
                                    x: d.origOffset.x + (e.clientX - d.startX) * uPerPx,
                                    y: d.origOffset.y + (e.clientY - d.startY) * uPerPx
                                });
                            },
                            onPointerUp: () => { curveOverlayDragRef.current = null; },
                            style: {
                                transform: `scale(${svgUnitsPerPx * scaleFactor})`,
                                transformOrigin: 'top left',
                                width: '120px',
                                padding: '4px 5px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                                cursor: 'grab'
                            }
                        },
                            React.createElement('input', {
                                type: 'range',
                                min: '1',
                                max: '15',
                                step: '0.5',
                                value: curveDensity,
                                onChange: (e) => onCurveDensityChange(parseFloat(e.target.value)),
                                className: 'curve-density-slider',
                                style: { width: '100%', height: '10px', margin: 0 }
                            }),
                            React.createElement('label', {
                                style: { display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8px', color: '#aaa', cursor: 'pointer' }
                            },
                                React.createElement('input', {
                                    type: 'checkbox',
                                    checked: curveReverse,
                                    onChange: (e) => onCurveReverseChange(e.target.checked),
                                    style: { width: '8px', height: '8px', margin: 0 }
                                }),
                                'Reverse'
                            ),
                            React.createElement('div', { style: { display: 'flex', gap: '3px' } },
                                React.createElement('button', {
                                    onClick: (e) => { e.stopPropagation(); onCurveApply(); },
                                    style: {
                                        padding: '2px 6px', fontSize: '9px', cursor: 'pointer',
                                        background: '#e94560', border: 'none', borderRadius: '2px',
                                        color: '#fff'
                                    }
                                }, 'Apply'),
                                React.createElement('button', {
                                    onClick: (e) => { e.stopPropagation(); onCurveCancel(); },
                                    style: {
                                        padding: '2px 6px', fontSize: '9px', cursor: 'pointer',
                                        background: 'transparent', border: '1px solid #666', borderRadius: '2px',
                                        color: '#aaa'
                                    }
                                }, 'Cancel')
                            )
                        )
                    )
                );
            }
        }

        return elements;
    };

    // Build the viewBox string
    const vbStr = `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`;

    return React.createElement('svg', {
        ref: svgRef,
        id: 'map',
        viewBox: vbStr,
        style: {
            width: '100%',
            height: '100%',
            display: 'block',
            background: '#1a1a2e',
            cursor: getCursorStyle(),
            touchAction: 'none'
        },
        onWheel: handleWheel,
        onPointerDown: (e) => {
            const tool = activeToolRef.current;
            if ((tool === 'cone-pointer' || tool === 'cone-guide') && e.button === 0) {
                const svgEl = svgRef.current;
                if (!svgEl) return;
                const target = e.target;
                if (target.closest('[data-interactive]')) return;
                onDeselectAll();
                const { x, y } = SvgPanZoom.screenToSVG(svgEl, e.clientX, e.clientY);
                const id = StorageUtils.generateId('cone');
                onConeAdd({ x, y, id });
                draggingRef.current = {
                    type: 'orient-new-cone',
                    id,
                    centerX: x,
                    centerY: y,
                    moved: false
                };
                svgEl.setPointerCapture(e.pointerId);
                return;
            }
            if ((tool === 'start' || tool === 'timing-start' || tool === 'finish') && e.button === 0) {
                const svgEl = svgRef.current;
                if (!svgEl) return;
                const target = e.target;
                if (target.closest('[data-interactive]')) return;
                onDeselectAll();
                const { x, y } = SvgPanZoom.screenToSVG(svgEl, e.clientX, e.clientY);
                if (tool === 'start') onStartMarkerSet({ x, y });
                else if (tool === 'timing-start') onTimingStartMarkerSet({ x, y });
                else if (tool === 'finish') onFinishMarkerSet({ x, y });
                draggingRef.current = {
                    type: 'orient-new-marker',
                    markerType: tool,
                    centerX: x,
                    centerY: y,
                    moved: false
                };
                svgEl.setPointerCapture(e.pointerId);
                return;
            }
            if (tool === 'car' && e.button === 0) {
                const svgEl = svgRef.current;
                if (!svgEl) return;
                const target = e.target;
                if (target.closest('[data-interactive]')) return;
                onDeselectAll();
                const { x, y } = SvgPanZoom.screenToSVG(svgEl, e.clientX, e.clientY);
                onCarMarkerSet({ x, y });
                draggingRef.current = {
                    type: 'orient-new-car',
                    centerX: x,
                    centerY: y,
                    moved: false
                };
                svgEl.setPointerCapture(e.pointerId);
                return;
            }
            if (!draggingRef.current) {
                panHandlers.onPointerDown(e);
            }
        },
        onPointerMove: (e) => {
            if (draggingRef.current) {
                handlePointerMoveDrag(e);
            } else {
                panHandlers.onPointerMove(e);
            }
        },
        onPointerUp: (e) => {
            if (draggingRef.current) {
                handlePointerUpDrag(e);
            } else {
                panHandlers.onPointerUp(e);
            }
        },
        onClick: handleSvgClick,
        onPointerCancel: (e) => {
            if (draggingRef.current) {
                handlePointerUpDrag(e);
            } else {
                panHandlers.onPointerUp(e);
            }
        },
        onContextMenu: (e) => {
            e.preventDefault();
            if (activeTool.endsWith('-curve') && curvePoints.length > 0) {
                onCurveUndoPoint();
            }
        }
    },
        // Defs
        React.createElement('defs', null,
            React.createElement('filter', { id: 'cone-glow', x: '-50%', y: '-50%', width: '200%', height: '200%' },
                React.createElement('feGaussianBlur', { stdDeviation: '1', result: 'blur' }),
                React.createElement('feFlood', { floodColor: '#e94560', floodOpacity: '0.8', result: 'color' }),
                React.createElement('feComposite', { in: 'color', in2: 'blur', operator: 'in', result: 'glow' }),
                React.createElement('feMerge', null,
                    React.createElement('feMergeNode', { in: 'glow' }),
                    React.createElement('feMergeNode', { in: 'SourceGraphic' })
                )
            )
        ),

        // Track surface
        React.createElement('g', { id: 'track-surface' },
            React.createElement('path', {
                id: 'outline',
                d: TRACK_PATHS.outline,
                fill: '#E5E5E5',
                stroke: '#999999',
                strokeWidth: 0.5
            }),
            ...Object.entries(TRACK_PATHS).filter(([k]) => k !== 'outline').map(([key, d]) => {
                const isInner = key.includes('inner');
                return React.createElement('path', {
                    key: key,
                    id: key,
                    d: d,
                    fill: isInner ? '#BFBFBF' : '#D0D0D0',
                    stroke: 'none'
                });
            })
        ),

        // Cones layer
        React.createElement('g', { id: 'cones-layer' },
            ...course.cones.flatMap(cone => renderCone(cone))
        ),

        // Markers layer (start/timing-start/finish)
        React.createElement('g', { id: 'markers-layer' },
            renderMarkerLine(course.startMarker, 'start', '#22C55E'),
            renderMarkerLine(course.timingStartMarker, 'timing-start', '#F59E0B'),
            renderMarkerLine(course.finishMarker, 'finish', '#333')
        ),

        // Car layer
        React.createElement('g', { id: 'car-layer' },
            renderCarMarker()
        ),

        // Corner numbers layer
        React.createElement('g', { id: 'corner-numbers-layer' },
            ...renderCornerNumbers()
        ),

        // Driving line layer
        React.createElement('g', { id: 'driving-line-layer' },
            ...renderDrivingLine()
        ),

        // Curve preview layer
        React.createElement('g', { id: 'curve-preview-layer' },
            ...renderCurvePreview()
        ),

        // Rotation handles layer (on top of everything)
        React.createElement('g', { id: 'rotation-handles-layer' },
            ...renderRotationHandles()
        )
    );
}

window.MapView = MapView;
