// MapView component - SVG-based canvas with pan/zoom, cone placement, and track rendering

// Track path data (extracted from track_clean_satellite.svg)
// Outer transform: matrix(1.1175606,0,0,1.1175606,-18.419061,-12.905316) then translate(11.549076,-0.962423)
const TRACK_SURFACE_TRANSFORM = 'matrix(1.1175606,0,0,1.1175606,-18.419061,-12.905316) translate(11.549076,-0.962423)';
const TRACK_PATHS = {
    outline: { d: "m 176.2687,91.482754 h 4.31086 c 0,0 0.13795,0.94445 0.15625,1.808453 0.0196,0.921826 1.76391,1.478046 3.00743,1.478046 1.08089,0 97.30903,-3.671395 97.30903,-3.671395 0,0 12.33143,-1.049771 25.32375,3.788768 10.49616,3.90893 16.663,7.282004 20.63418,11.025314 2.60854,2.45884 6.7999,4.81173 6.7999,4.81173 l 5.23672,3.10679 -2.42297,3.56145 -4.99854,-2.63339 c 0,0 -2.48558,-1.01021 -4.77554,-0.48612 -3.23938,0.74138 -4.1821,2.10567 -5.64672,3.89598 -1.46837,1.79487 -13.89895,21.25498 -13.89895,21.25498 0,0 -1.55603,1.52166 -1.33969,4.21516 0.15789,1.96567 0.66113,2.99504 1.49324,3.98012 0.84334,0.99834 8.61019,9.32798 8.61019,9.32798 l -2.03215,6.1378 -5.68507,-8.51046 c 0,0 -4.18263,-6.19138 -7.35739,-8.31165 -3.27354,-2.18624 -12.32209,-4.37096 -18.57499,-5.08976 -5.57522,-0.6409 -11.13594,-1.12387 -11.13594,-1.12387 0,0 -1.68496,0.45307 -2.61836,2.95524 -0.86185,2.31042 -0.93792,5.56949 -0.93792,5.56949 l -4.57234,0.0378 c 0,0 0.0118,-1.9906 -0.96803,-4.24277 -0.67547,-1.55273 -1.61142,-2.90178 -1.61142,-2.90178 0,0 -2.25539,1.28501 -6.82035,2.85299 -2.34019,0.80381 -83.14497,41.94549 -83.14497,41.94549 0,0 -3.78714,1.2946 -5.2331,3.90885 -1.44595,2.61425 -2.1103,3.82666 -4.33786,5.26639 -2.22755,1.43974 -6.20059,4.45774 -8.85801,4.38196 -2.65744,-0.0758 -8.12862,-0.9472 -10.27801,-3.18256 -2.1494,-2.23537 -4.42379,-5.11125 -4.50195,-8.48326 -0.0782,-3.372 -0.85123,-5.6897 -1.67191,-6.9021 -0.82068,-1.2124 -8.48619,-13.04782 -8.48619,-13.04782 0,0 -5.74999,-7.43614 -12.23102,-8.88505 -4.82286,-1.07821 -25.840811,-6.58058 -25.840811,-6.58058 0,0 -5.705662,-1.47762 -7.307937,-3.44777 -1.602276,-1.97015 -3.829829,-5.75894 -5.236705,-9.77502 -1.406876,-4.01609 -9.613651,-26.33194 -9.613651,-26.33194 0,0 -0.625277,-2.72791 -0.195399,-6.36512 0.442492,-3.74395 3.549708,-12.23723 7.10598,-14.889366 3.556268,-2.652137 6.878059,-4.243419 10.825125,-4.357084 3.947069,-0.113663 12.678071,1.003466 16.976848,3.88293 4.2988,2.879462 7.38611,7.42599 7.38611,7.42599 0,0 1.27344,1.87599 2.36768,2.55797 1.09423,0.68198 1.87584,0.75775 2.81376,0.34098 0.9379,-0.41675 7.38609,-4.35707 7.38609,-4.35707 0,0 1.48504,-1.401849 4.14247,-1.667061 2.65743,-0.265215 47.91338,-0.650689 47.91338,-0.650689 0,0 2.26402,0.382225 2.45934,-1.663708 0.13327,-1.396025 0.0755,-1.961379 0.0755,-1.961379 z" },
    "island1-outer": { d: "m 88.422181,86.388251 c -5.386514,0.02295 -9.468885,2.049486 -12.242767,3.622569 -2.809898,1.593503 -7.133286,5.703463 -8.50649,10.47451 -1.180891,4.10288 -1.469437,10.11276 -0.899997,12.98704 0.715402,3.61107 4.128702,14.27691 4.128702,14.27691 0,0 1.536461,3.79588 3.153512,5.22408 2.486614,2.19621 4.268256,2.65012 9.742518,2.53651 l 34.202211,-1.7022 c 0,0 1.77926,0.37854 2.89267,-0.3788 1.11341,-0.7573 1.33823,-1.78101 0.70731,-2.86018 -0.63094,-1.07916 -3.74831,-5.28093 -4.49058,-8.53735 -0.74227,-3.25643 -1.33732,-8.17924 -0.81775,-10.8677 0.5196,-2.68846 1.71958,-4.68567 -0.58982,-6.05121 -2.30943,-1.36553 -4.67127,-2.48941 -6.71825,-5.461419 -2.04697,-2.972016 -5.64806,-7.482413 -8.68508,-9.772053 -2.994375,-2.257496 -6.822489,-3.512244 -11.876189,-3.490707 z", transform: "matrix(0.72607961,0,0,0.72607961,26.007974,30.365156)" },
    "island1-inner": { d: "m 101.05467,121.87571 c 1.79967,-0.0412 3.3551,-0.10441 3.98256,-0.23935 0.40881,-0.088 0.67637,-0.75511 0.27045,-1.46226 -0.51411,-0.89564 -2.73633,-3.15661 -2.7721,-5.76777 -0.0357,-2.61114 0.2325,-4.25651 0.42923,-5.06131 0.19673,-0.80481 -0.39346,-1.21615 -1.21615,-1.71693 -0.82269,-0.50075 -2.378645,-1.60959 -3.272867,-2.98671 -0.894224,-1.37711 -3.248321,-4.21896 -6.270806,-5.309908 -3.022488,-1.090951 -6.86088,-0.569532 -8.570287,0.412607 -2.072871,1.190971 -4.983231,2.992161 -5.79766,6.703641 -0.752946,3.43129 -0.190594,5.80686 -0.190594,5.80686 0,0 1.863824,6.44644 2.609347,7.77184 0.469511,0.8347 1.146614,1.86521 2.502034,2.3743 0.723844,0.27186 3.442885,0.30171 4.546692,0.24229 3.332868,-0.17945 9.280021,-0.66497 13.750151,-0.7673 z", transform: "matrix(0.72607961,0,0,0.72607961,26.007974,30.365156)" },
    "island2-outer": { d: "m 146.28339,99.892928 c -4.94599,-0.0553 -11.08881,0.398322 -13.51555,0.577352 -3.01155,0.22217 -6.24795,1.3418 -8.91814,3.71851 -2.67018,2.37669 -4.72539,6.18428 -4.69844,10.21856 0.0298,4.46728 3.12203,9.13434 6.55921,10.94526 3.42043,1.80212 5.65657,2.18225 8.13761,2.10216 4.728,-0.15263 7.80103,-0.32321 12.23399,-0.58918 2.74751,-0.16483 5.74976,-0.27849 8.91576,-2.35301 3.11735,-2.04264 6.10503,-6.40295 5.96529,-11.28055 -0.10178,-5.1157 -3.32595,-9.81591 -6.33537,-11.5162 -3.05174,-1.724208 -5.82531,-1.794666 -8.34436,-1.822902 z" },
    "island2-inner": { d: "m 133.77357,109.20722 c 1.76472,-0.13019 7.97156,-0.43975 11.96023,-0.39509 1.6233,0.0182 5.53117,0.96977 5.53117,4.38183 0.17963,3.62758 -3.46542,4.85069 -5.67484,4.88466 -4.16992,0.0641 -7.03181,0.22325 -11.24189,0.35916 -2.20879,0.0713 -5.2917,-0.79176 -5.31566,-4.38182 -0.0208,-3.10685 2.45288,-4.67995 4.74099,-4.84874 z" },
    "island3-outer": { d: "m 192.40626,98.34079 c -4.90295,-0.05486 -11.04774,0.450319 -13.45337,0.62779 -2.98534,0.220222 -6.19357,1.33012 -8.8405,3.68612 -2.64694,2.35603 -4.68426,6.13047 -4.65755,10.12964 0.0296,4.42839 3.09484,9.05481 6.50211,10.84998 3.39066,1.78643 5.60735,2.16325 8.06678,2.08386 4.68685,-0.1513 7.73313,-0.48676 12.12751,-0.75041 2.7236,-0.16341 5.64425,-0.33152 8.78269,-2.38799 3.09022,-2.02485 5.99643,-6.51357 5.8579,-11.34874 -0.10088,-5.07116 -3.18608,-9.34228 -6.1693,-11.02776 -3.02518,-1.709193 -5.71915,-1.834498 -8.21627,-1.86249 z" },
    "island3-inner": { d: "m 180.06997,107.32768 c 1.77151,-0.15473 8.01072,-0.41546 12.0193,-0.39704 3.97936,0.0183 5.60952,3.06738 5.50743,4.30138 0.18051,3.64549 -3.22805,4.43355 -5.44763,4.50042 -3.8332,0.11549 -7.52544,0.39404 -11.75681,0.51406 -2.52596,0.0717 -4.7588,-1.3061 -4.8825,-4.3524 -0.14119,-3.47671 2.61812,-4.3968 4.56021,-4.56642 z" },
    "island4-outer": { d: "m 89.256933,133.67358 c -3.847029,0.2415 -7.982737,-0.0739 -8.507026,2.27993 -0.470306,2.11142 0.619805,4.46856 1.115592,5.28677 2.386081,3.79559 4.516425,4.81839 7.710154,5.97517 3.015843,1.09235 12.582107,3.75574 15.294137,4.28883 2.76618,0.54375 6.09434,1.7794 9.26952,-2.64936 1.88517,-2.62947 1.68691,-4.29223 1.73569,-7.97228 0.0502,-3.78768 -0.45379,-5.53186 -1.92314,-6.96721 -2.01982,-1.97303 -5.24616,-1.40555 -7.94955,-1.23875 -5.44821,0.33616 -9.597269,0.54818 -16.745377,0.9969 z" },
    "island4-inner": { d: "m 93.00634,138.44298 c 3.347667,-0.2204 8.47847,-0.46048 12.59215,-0.71117 1.17071,-0.0713 3.01459,-0.17219 3.68912,0.51737 0.78983,0.80742 1.08719,1.7075 1.18713,3.30651 0.0999,1.599 -0.36619,3.85706 -0.77881,4.43259 -0.50091,0.69869 -2.02574,0.86794 -3.53617,0.63193 -1.59901,-0.24983 -11.954168,-2.78058 -13.428249,-3.38021 -1.538613,-0.62589 -3.472837,-1.59901 -4.322307,-2.59838 -0.84947,-0.99938 -0.429176,-1.56059 0.699564,-1.79888 1.1243,-0.23735 2.608652,-0.31489 3.897572,-0.39976 z" },
    "island5-outer": { d: "m 152.64029,132.03366 c -2.58524,0.11243 -5.16992,0.23751 -7.75519,0.34924 -5.36354,0.2318 -11.82203,0.6578 -16.09188,0.6663 -2.18673,0.005 -4.43916,0.1419 -6.46712,1.10143 -2.36271,1.11792 -4.22168,3.31753 -4.30317,6.55534 -0.0646,2.56968 0.0393,5.16068 0.44809,7.69845 0.3944,2.44833 0.62124,5.07571 1.92192,7.18713 0.85407,1.3864 2.06525,2.86405 3.64724,3.24988 1.67518,0.40856 3.62504,-0.25344 5.01277,-1.27684 3.31723,-2.44631 6.73338,-5.22891 10.09665,-7.55473 1.54623,-1.06929 6.68193,-3.52377 11.99295,-5.37875 5.26324,-1.83828 10.44907,-2.54816 15.80714,-2.91385 1.46375,-0.0345 4.59049,-0.007 5.46148,-1.47854 0.65132,-1.10001 0.58205,-3.16985 0.48707,-4.52223 -0.11642,-1.65751 -0.84922,-4.1191 -1.70963,-4.46094 -0.97501,-0.38738 -12.36594,0.50923 -18.54832,0.77811 z", transform: "translate(2.25,-1)" },
    "island5-inner": { d: "m 148.33971,135.58814 c -6.99812,0.2306 -14.81265,0.78317 -18.53285,1.00519 -4.31247,0.25737 -7.1311,1.2987 -7.37788,4.56855 -0.24678,3.26985 0.37455,9.99903 1.85524,11.60311 1.48069,1.60408 1.72837,1.34981 3.51754,1.28811 0.89458,-0.0308 3.94207,-3.17911 7.9297,-5.82467 4.53985,-3.01194 7.28955,-4.28999 10.4277,-5.90412 2.73259,-1.40553 5.31079,-2.3489 7.18634,-2.95975 1.87555,-0.61086 3.07026,-0.80194 3.0795,-1.31363 0.0152,-0.84383 -0.60774,-2.94927 -1.39291,-2.86975 -1.51867,0.15382 -5.1096,0.35481 -6.69238,0.40696 z", transform: "translate(2.25,-1)" },
    "island6-outer": { d: "m 192.73209,129.69379 c -1.16586,0.0481 -5.34946,0.10363 -6.4342,1.3193 -1.5342,1.71934 -1.45302,5.03625 -0.84172,7.02818 0.55088,1.79504 1.81187,3.00948 6.3833,2.57236 6.52899,-0.6243 8.41084,-0.50761 10.17096,1.10881 2.81982,2.58961 1.84437,6.43468 2.15252,11.87964 0.22171,3.91769 -0.18125,9.81612 5.05489,9.53073 5.91311,-0.3223 4.61471,-5.68659 4.4797,-9.76766 -0.12977,-3.92221 -0.7088,-12.83105 -0.82427,-13.90113 -0.4205,-3.89737 0.53641,-7.03872 -1.72723,-9.17371 -1.66834,-1.57352 -5.70883,-1.16429 -7.97604,-1.09251 -4.06917,0.1288 -7.91654,0.39196 -10.43791,0.49599 z", transform: "translate(-5.5,0.5)" },
    "island6-inner": { d: "m 193.3458,132.59033 c 2.49693,-0.0825 5.92697,-0.11938 9.93252,-0.50817 1.31664,-0.1278 4.30995,0.0294 5.1558,0.53153 2.0955,1.24401 1.582,5.20428 1.67431,7.99945 0.08,2.42256 1.06305,15.46741 0.74414,16.68991 -0.31892,1.22252 -0.61125,2.28557 -1.78061,2.23241 -1.16935,-0.0532 -1.64773,-1.35539 -1.86034,-2.15268 -0.21262,-0.79729 -0.53814,-13.02181 -0.75569,-13.89438 -0.82464,-3.3074 -3.24609,-4.89694 -5.23932,-5.72081 -2.0707,-0.85588 -5.42045,-0.62171 -7.44025,-0.3028 -2.01979,0.31892 -4.64447,0.46617 -4.99579,-0.67863 -0.37422,-1.21938 -0.17459,-2.46146 0.67542,-3.31693 0.88911,-0.89481 2.62907,-0.83728 3.88981,-0.8789 z", transform: "translate(-5.5,0.5)" },
    "island7-outer": { d: "m 198.13508,144.74568 c -0.1235,-2.4056 -1.51401,-2.47878 -7.59444,-2.21865 -7.81343,0.33426 -23.55344,1.47084 -26.64643,1.78678 -7.80446,0.7972 -20.29776,7.28004 -25.97372,11.7838 -2.69995,2.14236 -8.88412,6.60139 -8.63734,9.37768 0.24678,2.77628 2.40457,5.80789 5.12071,6.29291 3.45493,0.61696 24.14892,-3.26344 29.49033,-3.8868 5.02028,-0.58588 9.66169,0.84007 12.33907,5.42918 2.40498,4.12223 5.30578,4.75054 9.19259,2.89969 3.16377,-1.50656 12.09227,-5.73766 13.0177,-8.32887 0.92543,-2.59119 0.18509,-10.61159 1e-5,-12.95601 -0.18509,-2.34442 -0.17258,-7.53251 -0.30848,-10.17971 z", transform: "matrix(0.90593274,0,0,0.90593274,13.806695,15.696596)" },
    "island7-inner": { d: "m 145.24935,157.09493 c 3.11144,-1.86466 5.36749,-3.26986 9.03836,-5.18241 3.45049,-1.79772 7.90706,-1.24717 8.4831,1.17221 0.61695,2.5912 0.0925,6.47801 -0.83289,8.32886 -0.43955,0.87909 -3.25198,1.33736 -6.72478,1.85086 -2.35527,0.34826 -17.11226,2.76942 -18.9096,2.43696 -2.13361,-0.39466 -0.18509,-2.09763 1.26475,-3.39323 1.24294,-1.11072 5.16596,-3.70598 7.68106,-5.21325 z", transform: "matrix(0.90593274,0,0,0.90593274,13.806695,15.696596)" },
    "island8-outer": { d: "m 154.16992,173.25911 c -2.93309,0.45833 -6.98415,0.99978 -8.96135,1.25487 -2.00183,0.25826 -4.88813,0.47203 -6.09379,1.70339 -0.86178,0.88016 -0.70141,2.16507 0.336,4.08975 1.03736,1.92466 6.02952,8.06215 7.83322,9.79329 1.90565,1.82898 4.41512,1.10145 7.47698,-0.55471 2.31476,-1.25205 7.886,-4.34217 10.15328,-5.37332 1.85609,-0.84413 3.71841,-2.33044 4.49715,-3.95286 0.49719,-1.03582 0.81866,-2.99263 0.0665,-4.4668 -0.78632,-1.54116 -2.18845,-3.29027 -3.61565,-3.49141 -2.89781,-0.40841 -8.32428,0.47152 -11.69229,0.9978 z" },
    "island8-inner": { d: "m 153.28258,185.64976 c 2.77834,-1.46412 8.63298,-4.07259 10.94223,-5.12283 0.95701,-0.43523 2.61362,-1.4615 2.17069,-2.32963 -0.39733,-0.77874 -1.62304,-1.41375 -4.2156,-1.39057 -1.96664,0.0175 -6.90047,0.91248 -8.82482,1.17867 -1.8933,0.26191 -5.90739,0.74568 -7.52472,1.04825 -1.29016,0.24136 -1.65767,0.48127 -0.76499,1.60838 0.86747,1.09527 3.24608,4.02646 4.50826,5.3354 0.95615,0.99158 1.34503,0.91804 3.70895,-0.32767 z" }
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
    carMode = 'edit',
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
    onCurveCancel,
    racechronoSession,
    racechronoSelectedLaps = [],
    racechronoVizMode = 'speed',
    racechronoOverlayVisible = false,
    racechronoTransform,
    onRacechronoTransformChange,
    racechronoFrictionCircle = false,
    mapOverlay,
    onMapOverlayChange,
    onMapOverlayClear
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

    // Map overlay toolbar drag state
    const [mapOverlayToolbarOffset, setMapOverlayToolbarOffset] = React.useState({ x: 0, y: 0 });
    const mapOverlayToolbarDragRef = React.useRef(null);

    // Reset overlay offset when starting a new curve
    React.useEffect(() => {
        if (curvePoints.length <= 1) setCurveOverlayOffset({ x: 0, y: 0 });
    }, [curvePoints.length]);

    // Drive mode refs
    const keysHeldRef = React.useRef({});
    const joystickRef = React.useRef({ dx: 0, dy: 0 });
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

            // Joystick input (leash-style: instant orient + proportional speed)
            const joy = joystickRef.current;
            const joyMag = Math.hypot(joy.dx, joy.dy);
            const joyActive = joyMag > 0.15;

            // Keyboard input (WASD / arrow keys)
            const left = keys['a'] || keys['arrowleft'];
            const right = keys['d'] || keys['arrowright'];
            let rotation = car.rotation || 0;

            if (joyActive) {
                // Leash mode: instant orient toward joystick direction, speed proportional to magnitude
                const joyAngle = Math.atan2(joy.dy, joy.dx) * (180 / Math.PI);
                rotation = ((joyAngle % 360) + 360) % 360;
                ds.speed = Math.min(joyMag, 1) * settings.maxSpeed;
            } else {
                // Keyboard mode: gradual turn + acceleration
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
            }

            if (ds.speed !== 0 || left || right || joyActive) {
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

                // Auto-pan: push viewBox when car nears edges
                const vb = viewBoxRef.current;
                if (vb) {
                    const marginX = vb.w * 0.15;
                    const marginY = vb.h * 0.15;
                    const panSpeed = 0.3;
                    let panX = 0, panY = 0;

                    const leftOverflow  = (vb.x + marginX) - newX;
                    const rightOverflow = newX - (vb.x + vb.w - marginX);
                    const topOverflow   = (vb.y + marginY) - newY;
                    const bottomOverflow = newY - (vb.y + vb.h - marginY);

                    if (leftOverflow > 0)   panX = -leftOverflow * panSpeed;
                    if (rightOverflow > 0)  panX = rightOverflow * panSpeed;
                    if (topOverflow > 0)    panY = -topOverflow * panSpeed;
                    if (bottomOverflow > 0) panY = bottomOverflow * panSpeed;

                    if (panX !== 0 || panY !== 0) {
                        setViewBox({ x: vb.x + panX, y: vb.y + panY, w: vb.w, h: vb.h });
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

        // Map overlay drag
        if (drag.type === 'mapOverlay') {
            const dx = x - drag.startX;
            const dy = y - drag.startY;
            if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
                drag.moved = true;
            }
            if (onMapOverlayChange) {
                onMapOverlayChange({ x: drag.origX + dx, y: drag.origY + dy });
            }
            return;
        }

        // RaceChrono overlay drag
        if (drag.type === 'racechrono') {
            const dx = x - drag.startX;
            const dy = y - drag.startY;
            if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
                drag.moved = true;
            }
            if (onRacechronoTransformChange && racechronoTransform) {
                onRacechronoTransformChange(Object.assign({}, racechronoTransform, {
                    translateX: drag.origTranslateX + dx,
                    translateY: drag.origTranslateY + dy
                }));
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
        onConeRotationChange, onStartRotationChange, onTimingStartRotationChange, onFinishRotationChange, onCarRotationChange, onDrivingLineMovePoint,
        onRacechronoTransformChange, racechronoTransform]);

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
    // Render map overlay image element
    const renderMapOverlayImage = () => {
        if (!mapOverlay || !mapOverlay.visible) return null;
        const s = mapOverlay.scale;
        const imgW = mapOverlay.naturalW * s;
        const imgH = mapOverlay.naturalH * s;
        // Rotation center = center of scaled image, relative to translate origin
        const cx = imgW / 2;
        const cy = imgH / 2;
        // Build transform: translate to position, then rotate around image center
        let groupTransform = `translate(${mapOverlay.x},${mapOverlay.y}) rotate(${mapOverlay.rotation},${cx},${cy})`;
        // Flip handled via scale on the inner image
        const flipSx = mapOverlay.flipH ? -1 : 1;
        const flipSy = mapOverlay.flipV ? -1 : 1;
        // When flipped, offset image so it stays in place
        const imgX = mapOverlay.flipH ? imgW : 0;
        const imgY = mapOverlay.flipV ? imgH : 0;
        return React.createElement('g', {
            transform: groupTransform,
            opacity: mapOverlay.opacity,
            'data-map-overlay-drag': mapOverlay.locked ? undefined : 'true',
            style: { pointerEvents: mapOverlay.locked ? 'none' : 'auto', cursor: mapOverlay.locked ? 'default' : 'move' }
        },
            React.createElement('image', {
                href: mapOverlay.src,
                x: imgX,
                y: imgY,
                width: imgW,
                height: imgH,
                transform: `scale(${flipSx},${flipSy})`,
                preserveAspectRatio: 'none'
            })
        );
    };

    // Render map overlay floating toolbar
    const renderMapOverlayToolbar = () => {
        if (!mapOverlay) return [];

        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return [];

        const svgUnitsPerPx = viewBox.w / rect.width;
        const scaleFactor = 1.4;
        const overlayW = 200 * svgUnitsPerPx * scaleFactor;
        const overlayH = 320 * svgUnitsPerPx * scaleFactor;

        // Position at top-right of visible area
        const toolbarX = viewBox.x + viewBox.w - overlayW - 10 * svgUnitsPerPx + mapOverlayToolbarOffset.x;
        const toolbarY = viewBox.y + 10 * svgUnitsPerPx + mapOverlayToolbarOffset.y;

        return [React.createElement('foreignObject', {
            key: 'map-overlay-toolbar',
            x: toolbarX,
            y: toolbarY,
            width: overlayW,
            height: overlayH,
            style: { overflow: 'visible' }
        },
            React.createElement('div', {
                className: 'map-overlay-toolbar',
                'data-interactive': 'true',
                onClick: (e) => e.stopPropagation(),
                onPointerDown: (e) => {
                    e.stopPropagation();
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
                    mapOverlayToolbarDragRef.current = { startX: e.clientX, startY: e.clientY, origOffset: { ...mapOverlayToolbarOffset } };
                    e.currentTarget.setPointerCapture(e.pointerId);
                },
                onPointerMove: (e) => {
                    if (!mapOverlayToolbarDragRef.current) return;
                    const d = mapOverlayToolbarDragRef.current;
                    const r = svgRef.current.getBoundingClientRect();
                    const uPerPx = viewBox.w / r.width;
                    setMapOverlayToolbarOffset({
                        x: d.origOffset.x + (e.clientX - d.startX) * uPerPx,
                        y: d.origOffset.y + (e.clientY - d.startY) * uPerPx
                    });
                },
                onPointerUp: () => { mapOverlayToolbarDragRef.current = null; },
                style: {
                    transform: `scale(${svgUnitsPerPx * scaleFactor})`,
                    transformOrigin: 'top left',
                    width: '200px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    cursor: 'grab'
                }
            },
                // Title bar
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                    React.createElement('span', { style: { fontSize: '10px', fontWeight: 'bold', color: '#ddd' } }, 'Map Overlay'),
                    React.createElement('button', {
                        onClick: (e) => { e.stopPropagation(); onMapOverlayClear(); },
                        style: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }
                    }, '\u2715')
                ),

                // Image visible toggle
                React.createElement('label', { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#aaa', cursor: 'pointer' } },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: mapOverlay.visible,
                        onChange: (e) => onMapOverlayChange({ visible: e.target.checked }),
                        style: { width: '10px', height: '10px', margin: 0 }
                    }),
                    'Image visible'
                ),

                // Image opacity
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
                    React.createElement('span', { style: { fontSize: '8px', color: '#888', width: '52px' } }, 'Image ' + Math.round(mapOverlay.opacity * 100) + '%'),
                    React.createElement('input', {
                        type: 'range', min: '0', max: '1', step: '0.05',
                        value: mapOverlay.opacity,
                        onChange: (e) => onMapOverlayChange({ opacity: parseFloat(e.target.value) }),
                        style: { flex: 1, height: '8px', margin: 0 }
                    })
                ),

                // Track/cones opacity
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
                    React.createElement('span', { style: { fontSize: '8px', color: '#888', width: '52px' } }, 'Track ' + Math.round(mapOverlay.trackOpacity * 100) + '%'),
                    React.createElement('input', {
                        type: 'range', min: '0', max: '1', step: '0.05',
                        value: mapOverlay.trackOpacity,
                        onChange: (e) => onMapOverlayChange({ trackOpacity: parseFloat(e.target.value) }),
                        style: { flex: 1, height: '8px', margin: 0 }
                    })
                ),

                // Rotation
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
                    React.createElement('span', { style: { fontSize: '8px', color: '#888', width: '52px' } }, 'Rot ' + Math.round(mapOverlay.rotation) + '\u00B0'),
                    React.createElement('input', {
                        type: 'range', min: '-180', max: '180', step: '1',
                        value: mapOverlay.rotation,
                        onChange: (e) => onMapOverlayChange({ rotation: parseFloat(e.target.value) }),
                        style: { flex: 1, height: '8px', margin: 0 }
                    })
                ),

                // Quick rotate buttons
                React.createElement('div', { style: { display: 'flex', gap: '3px' } },
                    [-90, -45, 45, 90].map(deg =>
                        React.createElement('button', {
                            key: deg,
                            onClick: (e) => {
                                e.stopPropagation();
                                var newRot = ((mapOverlay.rotation + deg) % 360 + 360) % 360;
                                if (newRot > 180) newRot -= 360;
                                onMapOverlayChange({ rotation: newRot });
                            },
                            style: {
                                flex: 1, padding: '2px', fontSize: '8px', cursor: 'pointer',
                                background: 'var(--bg-tertiary, #2a2a2e)', border: '1px solid #444',
                                borderRadius: '2px', color: '#aaa'
                            }
                        }, (deg > 0 ? '+' : '') + deg + '\u00B0')
                    )
                ),

                // Scale
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
                    React.createElement('span', { style: { fontSize: '8px', color: '#888', width: '52px' } }, 'Scale ' + mapOverlay.scale.toFixed(3)),
                    React.createElement('input', {
                        type: 'range', min: '0.01', max: '2', step: '0.005',
                        value: mapOverlay.scale,
                        onChange: (e) => onMapOverlayChange({ scale: parseFloat(e.target.value) }),
                        style: { flex: 1, height: '8px', margin: 0 }
                    })
                ),

                // Flip + Lock + Layer row
                React.createElement('div', { style: { display: 'flex', gap: '3px', flexWrap: 'wrap' } },
                    React.createElement('button', {
                        onClick: (e) => { e.stopPropagation(); onMapOverlayChange({ flipH: !mapOverlay.flipH }); },
                        style: {
                            padding: '2px 4px', fontSize: '8px', cursor: 'pointer',
                            background: mapOverlay.flipH ? '#e94560' : 'var(--bg-tertiary, #2a2a2e)',
                            border: '1px solid #444', borderRadius: '2px',
                            color: mapOverlay.flipH ? '#fff' : '#aaa'
                        }
                    }, 'Flip H'),
                    React.createElement('button', {
                        onClick: (e) => { e.stopPropagation(); onMapOverlayChange({ flipV: !mapOverlay.flipV }); },
                        style: {
                            padding: '2px 4px', fontSize: '8px', cursor: 'pointer',
                            background: mapOverlay.flipV ? '#e94560' : 'var(--bg-tertiary, #2a2a2e)',
                            border: '1px solid #444', borderRadius: '2px',
                            color: mapOverlay.flipV ? '#fff' : '#aaa'
                        }
                    }, 'Flip V'),
                    React.createElement('button', {
                        onClick: (e) => { e.stopPropagation(); onMapOverlayChange({ locked: !mapOverlay.locked }); },
                        style: {
                            padding: '2px 4px', fontSize: '8px', cursor: 'pointer',
                            background: mapOverlay.locked ? '#22C55E' : 'var(--bg-tertiary, #2a2a2e)',
                            border: '1px solid #444', borderRadius: '2px',
                            color: mapOverlay.locked ? '#fff' : '#aaa'
                        }
                    }, mapOverlay.locked ? 'Locked' : 'Lock'),
                    React.createElement('button', {
                        onClick: (e) => { e.stopPropagation(); onMapOverlayChange({ onTop: !mapOverlay.onTop }); },
                        style: {
                            padding: '2px 4px', fontSize: '8px', cursor: 'pointer',
                            background: 'var(--bg-tertiary, #2a2a2e)',
                            border: '1px solid #444', borderRadius: '2px',
                            color: '#aaa'
                        }
                    }, mapOverlay.onTop ? 'Img on top' : 'Cones on top')
                )
            )
        )];
    };

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

    return React.createElement('div', {
        style: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }
    },
    React.createElement('svg', {
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
            // Map overlay drag-to-reposition
            if (e.button === 0 && e.target.closest('[data-map-overlay-drag]') && mapOverlay && !mapOverlay.locked) {
                const svgEl = svgRef.current;
                if (!svgEl) return;
                const { x, y } = SvgPanZoom.screenToSVG(svgEl, e.clientX, e.clientY);
                draggingRef.current = {
                    type: 'mapOverlay',
                    startX: x,
                    startY: y,
                    origX: mapOverlay.x,
                    origY: mapOverlay.y,
                    moved: false
                };
                svgEl.setPointerCapture(e.pointerId);
                return;
            }
            // RaceChrono overlay drag-to-reposition
            if (e.button === 0 && e.target.closest('[data-racechrono-drag]') && racechronoTransform) {
                const svgEl = svgRef.current;
                if (!svgEl) return;
                const { x, y } = SvgPanZoom.screenToSVG(svgEl, e.clientX, e.clientY);
                draggingRef.current = {
                    type: 'racechrono',
                    startX: x,
                    startY: y,
                    origTranslateX: racechronoTransform.translateX,
                    origTranslateY: racechronoTransform.translateY,
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
        React.createElement('g', { id: 'track-surface', transform: TRACK_SURFACE_TRANSFORM, style: { opacity: mapOverlay ? mapOverlay.trackOpacity : 1 } },
            React.createElement('path', {
                id: 'outline',
                d: TRACK_PATHS.outline.d,
                fill: '#E5E5E5',
                stroke: '#999999',
                strokeWidth: 0.5
            }),
            ...Object.entries(TRACK_PATHS).filter(([k]) => k !== 'outline').map(([key, entry]) => {
                const isInner = key.includes('inner');
                const pathEl = React.createElement('path', {
                    key: key,
                    id: key,
                    d: entry.d,
                    fill: isInner ? '#BFBFBF' : '#D0D0D0',
                    stroke: 'none'
                });
                if (entry.transform) {
                    return React.createElement('g', { key: key + '-g', transform: entry.transform }, pathEl);
                }
                return pathEl;
            })
        ),

        // Map overlay image (below cones when not onTop)
        mapOverlay && mapOverlay.visible && !mapOverlay.onTop && renderMapOverlayImage(),

        // Cones layer
        React.createElement('g', { id: 'cones-layer', style: { opacity: mapOverlay ? mapOverlay.trackOpacity : 1 } },
            ...course.cones.flatMap(cone => renderCone(cone))
        ),

        // Markers layer (start/timing-start/finish)
        React.createElement('g', { id: 'markers-layer', style: { opacity: mapOverlay ? mapOverlay.trackOpacity : 1 } },
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

        // RaceChrono overlay layer
        racechronoOverlayVisible && racechronoSession && racechronoTransform && React.createElement(RaceChronoOverlay, {
            session: racechronoSession,
            transform: racechronoTransform,
            selectedLaps: racechronoSelectedLaps,
            vizMode: racechronoVizMode,
            visible: racechronoOverlayVisible
        }),

        // Map overlay image (above cones when onTop)
        mapOverlay && mapOverlay.visible && mapOverlay.onTop && renderMapOverlayImage(),

        // Curve preview layer
        React.createElement('g', { id: 'curve-preview-layer' },
            ...renderCurvePreview()
        ),

        // Map overlay toolbar
        ...renderMapOverlayToolbar(),

        // Rotation handles layer (on top of everything)
        React.createElement('g', { id: 'rotation-handles-layer' },
            ...renderRotationHandles()
        )
    ),
    React.createElement(Joystick, {
        joystickRef: joystickRef,
        visible: carMode === 'drive' && !!course.carMarker
    }),
    racechronoFrictionCircle && racechronoSession && React.createElement(FrictionCircle, {
        session: racechronoSession,
        selectedLaps: racechronoSelectedLaps,
        visible: racechronoOverlayVisible && racechronoFrictionCircle
    })
    );
}

window.MapView = MapView;
