document.addEventListener('DOMContentLoaded', () => {
    // Helper to safely get color from localStorage
    function getStoredColor(key, defaultValue) {
        const storedValue = localStorage.getItem(key);
        if (typeof storedValue === 'string' && storedValue.startsWith('#') && (storedValue.length === 7 || storedValue.length === 4)) {
            const hexColorRegex = /^#([0-9A-F]{3}){1,2}$/i;
            if (hexColorRegex.test(storedValue)) {
                 return storedValue;
            }
        }
        if (storedValue !== null) {
            console.warn(`Invalid color value found in localStorage for ${key}: ${storedValue}. Using default: ${defaultValue}`);
        }
        return defaultValue;
        
    }

    // Obtener colores calibrados de forma segura
    const colorRed = getStoredColor('tv_redColor', '#ff0000');
    const colorCyan = getStoredColor('tv_blueColor', '#00FFFF');
    const bgColor = getStoredColor('tv_bgColor', '#FFFFFF'); // Pure white background
    const blackColor = '#000000'; // Pure black for dots
    
    // Apply calibrated background color to body
    document.body.style.backgroundColor = bgColor;

    // *** ADDED: Log the colors being used ***
    console.log('Using colors:', { colorRed, colorCyan, bgColor });

    // Canvas y contexto
    const canvasBlue = document.getElementById('canvasBlue');
    const canvasRed = document.getElementById('canvasRed');

    // *** ADDED: Check if canvases are found ***
    if (!canvasBlue || !canvasRed) {
        console.error('Error: Could not find canvas elements!');
        return; // Stop execution if canvases are missing
    }

    const ctxBlue = canvasBlue.getContext('2d');
    const ctxRed = canvasRed.getContext('2d');

    // *** ADDED: Check if contexts are obtained ***
    if (!ctxBlue || !ctxRed) {
        console.error('Error: Could not get canvas contexts!');
        return; // Stop execution if contexts are missing
    }
    console.log('Canvas contexts obtained successfully.'); // Add success log

    const width = canvasBlue.width;
    const height = canvasBlue.height;

    // Parámetros de puntos
    const DOT_RADIUS = 1.2;  // Unchanged
    const MM_TO_PX = 3.78;
    const STEP_MM = 1;
    const MIN_DIST_MM = 1.5;  // Increase for proper spacing with larger dots
    const MIN_DIST_PX = MIN_DIST_MM * MM_TO_PX;
    const GRID_SIZE = Math.floor(width / MIN_DIST_PX);
    const DOT_COUNT_X = GRID_SIZE;
    const DOT_COUNT_Y = GRID_SIZE;
    const BACKGROUND_DOT_COUNT = 25000; // Keep the same for black dots
    const C_DOT_COUNT = 2400; // Increased from 800 to 2400 (3x more)
    const C_SIZE = 350;
    const C_THICKNESS = 60;
    const C_HOLE_ANGLE = Math.PI / 8;
    
    // Elementos DOM para separación y título
    const panelRow = document.querySelector('.panel-row'); // This might not be needed anymore if using absolute positioning
    const panelCols = document.querySelectorAll('.panel-col'); // This might not be needed anymore
    const stepTitle = document.getElementById('stepTitle');
    const canvasContainer = document.querySelector('.canvas-center-container'); // Needed for positioning

    // Estado
    let aciertos = 0;
    let fallos = 0;
    let cOrientation = 0;
    let step = 1;
    let backgroundDots = []; // Store background dot coordinates
    let cPoints = []; // Store current C dot coordinates

    function randomOrientation() {
        return Math.floor(Math.random() * 4);
    }
    function getDeviationPx() {
        return step * STEP_MM * MM_TO_PX / 2; // Divide by 2 as each canvas moves half the total distance
    }
    // Mostrar contadores y orientación en la interfaz
    const infoDiv = document.getElementById('infoDiv');
    function getOrientationText(ori) {
        return ['Derecha →','Abajo ↓','Izquierda ←','Arriba ↑'][ori];
    }
    function updateInfo() {
        infoDiv.innerHTML = `✔️ ${aciertos} &nbsp; ❌ ${fallos} &nbsp; | &nbsp; C: <b>${getOrientationText(cOrientation)}</b>`;
    }

    // *** ADDED: Function to update canvas separation ***
    function updateCanvasSeparation() {
        const deviation = getDeviationPx();
        // Assumes the container is centered and canvases are positioned relative to it
        canvasBlue.style.left = `calc(50% - ${deviation}px)`;
        canvasRed.style.left = `calc(50% + ${deviation}px)`;
        // Ensure transform is still applied to center them horizontally initially
        canvasBlue.style.transform = 'translateX(-50%)';
        canvasRed.style.transform = 'translateX(-50%)';
    }

    // *** ADDED: Function to update step title ***
    function updateStepTitle() {
        stepTitle.textContent = step * STEP_MM; // Show total separation in mm
    }

    // Sonidos de feedback
    function beep(frequency, duration, type) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = frequency;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.stop(ctx.currentTime + duration/1000);
        osc.onended = () => ctx.close();
    }
    function playSuccess() { beep(880, 120, 'triangle'); }
    function playError() { beep(220, 250, 'square'); }

    // *** MODIFIED: Generate background dots (now called only once) ***
    function generateBackgroundDots(excludePoints = []) {
        const dots = [];
        let count = 0;
        const drawnDots = [...excludePoints];
        const maxAttempts = BACKGROUND_DOT_COUNT * 10;
        let attempts = 0;

        while (count < BACKGROUND_DOT_COUNT && attempts < maxAttempts) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            let tooClose = false;

            // Check distance against C points and already added background points
            for (const pt of drawnDots) {
                // Use MIN_DIST_PX for spacing between background dots too
                if (Math.hypot(pt.x - x, pt.y - y) < MIN_DIST_PX) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                const newDot = { x, y };
                dots.push(newDot);
                drawnDots.push(newDot); // Add to check list for subsequent dots
                count++;
            }
            attempts++;
        }
        if (attempts >= maxAttempts) {
            console.warn('Could not place all background dots due to density/distance constraints.');
        }
        return dots;
    }

    // Generate C points (called when orientation changes)
    function generateCPoints(orientation) {
        const centerX = width / 2;
        const centerY = height / 2;
        const r = 175; // Base radius
        // const thickness = C_THICKNESS; // Use the constant
        // const holeAngle = C_HOLE_ANGLE; // Use the constant
        const points = [];
        const startAngles = [
            -C_HOLE_ANGLE / 2,                   // Right (0)
            Math.PI / 2 - C_HOLE_ANGLE / 2,     // Down (1)
            Math.PI - C_HOLE_ANGLE / 2,         // Left (2)
            3 * Math.PI / 2 - C_HOLE_ANGLE / 2  // Up (3)
        ];
        const startAngle = startAngles[orientation];
        const endAngle = startAngle + (2 * Math.PI - C_HOLE_ANGLE);

        for (let i = 0; i < C_DOT_COUNT; i++) {
            // Distribute points more evenly across angle and radius
            const angleProgress = Math.random(); // Random angle within the arc
            const radiusProgress = Math.random(); // Random radius within the thickness

            let angle = startAngle + angleProgress * (endAngle - startAngle);
            // Ensure angle wraps correctly if it crosses 2*PI
            angle = angle % (2 * Math.PI);

            const radius = (r - C_THICKNESS / 2) + radiusProgress * C_THICKNESS;

            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push({ x, y });
        }
        return points;
    }

    // If you're using DOM elements for dots, change the styling from border-radius to square
    function createDot(x, y, color) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        dot.style.backgroundColor = color;
        // Remove any border-radius property or set it to 0
        dot.style.borderRadius = '0';
        dot.style.width = `${DOT_RADIUS * 2}px`;
        dot.style.height = `${DOT_RADIUS * 2}px`;
        canvasContainer.appendChild(dot);
    }

    // Modified function to draw square pixels instead of circles
    function drawDot(ctx, x, y, color) {
        ctx.fillStyle = color;
        // Using fillRect to draw a square instead of arc for circles
        // Center the square on the point by subtracting half the size
        ctx.fillRect(x - DOT_RADIUS, y - DOT_RADIUS, DOT_RADIUS * 2, DOT_RADIUS * 2);
    }

    function drawAll() {
        // Limpiar canvas
        ctxBlue.clearRect(0, 0, width, height);
        ctxRed.clearRect(0, 0, width, height);

        // Remove corner calibration marks - no longer needed

        // Dibujar puntos de fondo en NEGRO en ambos canvas
        backgroundDots.forEach(dot => {
            drawDot(ctxBlue, dot.x, dot.y, blackColor);
            drawDot(ctxRed, dot.x, dot.y, blackColor);
        });

        // Dibujar puntos de la C con sus respectivos colores para efecto 3D
        cPoints.forEach(dot => {
            drawDot(ctxBlue, dot.x, dot.y, colorCyan);
            drawDot(ctxRed, dot.x, dot.y, colorRed);
        });

        updateCanvasSeparation();
        updateStepTitle();
        updateInfo();
    }

    // *** MODIFIED: Initial setup ***
    function initialize() {
        cOrientation = randomOrientation();
        // Generate C points for the initial orientation
        cPoints = generateCPoints(cOrientation);
        // Generate background dots ONCE, avoiding initial C points
        backgroundDots = generateBackgroundDots(cPoints);
        // Initial draw (calibration marks created within drawAll)
        drawAll();
    }

    // *** MODIFIED: Advance step ***
    function nextStep() {
        step++;
        cOrientation = randomOrientation();
        // Regenerate C points for the new orientation
        cPoints = generateCPoints(cOrientation);
        // Redraw everything (background is reused, C is new)
        drawAll();
    }

    // Manejar flechas
    document.addEventListener('keydown', (e) => {
        const keyMap = {
            ArrowRight: 0,
            ArrowDown: 1,
            ArrowLeft: 2,
            ArrowUp: 3
        };
        if (keyMap.hasOwnProperty(e.key)) {
            if (keyMap[e.key] === cOrientation) {
                aciertos++;
                playSuccess();
                nextStep(); // Advances step, regenerates C, redraws
            } else {
                fallos++;
                playError();
                updateInfo(); // Only update info, don't redraw or change step
            }
        }
    });

    // Start the application
    initialize();

});