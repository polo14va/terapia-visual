document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const calibRectRed = document.getElementById('calibRectRed');
    const calibRectBlue = document.getElementById('calibRectBlue');
    const calibRectBg = document.getElementById('calibRectBg');
    const calibrationMenu = document.getElementById('calibrationMenu');
    // Sliders y labels rojo
    const redR = document.getElementById('redR');
    const redG = document.getElementById('redG');
    const redB = document.getElementById('redB');
    const redRVal = document.getElementById('redRVal');
    const redGVal = document.getElementById('redGVal');
    const redBVal = document.getElementById('redBVal');
    // Sliders y labels azul
    const blueR = document.getElementById('blueR');
    const blueG = document.getElementById('blueG');
    const blueB = document.getElementById('blueB');
    const blueRVal = document.getElementById('blueRVal');
    const blueGVal = document.getElementById('blueGVal');
    const blueBVal = document.getElementById('blueBVal');
    // Sliders y labels fondo
    const bgR = document.getElementById('bgR');
    const bgG = document.getElementById('bgG');
    const bgB = document.getElementById('bgB');
    const bgRVal = document.getElementById('bgRVal');
    const bgGVal = document.getElementById('bgGVal');
    const bgBVal = document.getElementById('bgBVal');
    // Botones
    const saveColorsBtn = document.getElementById('saveColorsBtn');
    const defaultColorsBtn = document.getElementById('defaultColorsBtn');
    const startBtn = document.getElementById('startBtn');

    // Estado
    let calibRed = { r: 255, g: 0, b: 0 };
    let calibBlue = { r: 0, g: 236, b: 255 };
    let calibBg = { r: 255, g: 255, b: 255 };

    // Función para actualizar los canvas
    function drawCalibRects() {
        // Rojo
        const ctxR = calibRectRed.getContext('2d');
        ctxR.clearRect(0,0,calibRectRed.width,calibRectRed.height);
        ctxR.fillStyle = `rgb(${calibRed.r},${calibRed.g},${calibRed.b})`;
        ctxR.fillRect(0,0,calibRectRed.width,calibRectRed.height);
        // Azul
        const ctxB = calibRectBlue.getContext('2d');
        ctxB.clearRect(0,0,calibRectBlue.width,calibRectBlue.height);
        ctxB.fillStyle = `rgb(${calibBlue.r},${calibBlue.g},${calibBlue.b})`;
        ctxB.fillRect(0,0,calibRectBlue.width,calibRectBlue.height);
        // Fondo
        const ctxBg = calibRectBg.getContext('2d');
        ctxBg.clearRect(0,0,calibRectBg.width,calibRectBg.height);
        ctxBg.fillStyle = `rgb(${calibBg.r},${calibBg.g},${calibBg.b})`;
        ctxBg.fillRect(0,0,calibRectBg.width,calibRectBg.height);
    }
    // Actualizar fondo de la página en tiempo real
    function updateBodyBg() {
        document.body.style.background = `rgb(${calibBg.r},${calibBg.g},${calibBg.b})`;
        
        // Actualizar también el fondo del contenedor para que coincida
        if (calibrationMenu) {
            calibrationMenu.style.background = 'transparent';
        }
    }

    // Función para cargar colores guardados
    function loadSavedColors() {
        const savedRedColor = localStorage.getItem('tv_redColor');
        const savedBlueColor = localStorage.getItem('tv_blueColor');
        const savedBgColor = localStorage.getItem('tv_bgColor');
        
        if (savedRedColor) {
            const rgb = hexToRgb(savedRedColor);
            if (rgb) {
                calibRed = rgb;
                redR.value = rgb.r;
                redG.value = rgb.g;
                redB.value = rgb.b;
                redRVal.textContent = rgb.r;
                redGVal.textContent = rgb.g;
                redBVal.textContent = rgb.b;
            }
        }
        
        if (savedBlueColor) {
            const rgb = hexToRgb(savedBlueColor);
            if (rgb) {
                calibBlue = rgb;
                blueR.value = rgb.r;
                blueG.value = rgb.g;
                blueB.value = rgb.b;
                blueRVal.textContent = rgb.r;
                blueGVal.textContent = rgb.g;
                blueBVal.textContent = rgb.b;
            }
        }
        
        if (savedBgColor) {
            const rgb = hexToRgb(savedBgColor);
            if (rgb) {
                calibBg = rgb;
                bgR.value = rgb.r;
                bgG.value = rgb.g;
                bgB.value = rgb.b;
                bgRVal.textContent = rgb.r;
                bgGVal.textContent = rgb.g;
                bgBVal.textContent = rgb.b;
            }
        }
        
        drawCalibRects();
        updateBodyBg();
    }
    
    // Función para convertir hex a rgb
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Cargar colores guardados al iniciar
    loadSavedColors();

    // Sliders rojo
    [redR, redG, redB].forEach((slider, idx) => {
        slider.addEventListener('input', () => {
            calibRed.r = parseInt(redR.value);
            calibRed.g = parseInt(redG.value);
            calibRed.b = parseInt(redB.value);
            redRVal.textContent = redR.value;
            redGVal.textContent = redG.value;
            redBVal.textContent = redB.value;
            drawCalibRects();
        });
    });
    // Sliders azul
    [blueR, blueG, blueB].forEach((slider, idx) => {
        slider.addEventListener('input', () => {
            calibBlue.r = parseInt(blueR.value);
            calibBlue.g = parseInt(blueG.value);
            calibBlue.b = parseInt(blueB.value);
            blueRVal.textContent = blueR.value;
            blueGVal.textContent = blueG.value;
            blueBVal.textContent = blueB.value;
            drawCalibRects();
        });
    });
    // Sliders fondo
    [bgR, bgG, bgB].forEach((slider, idx) => {
        slider.addEventListener('input', () => {
            calibBg.r = parseInt(bgR.value);
            calibBg.g = parseInt(bgG.value);
            calibBg.b = parseInt(bgB.value);
            bgRVal.textContent = bgR.value;
            bgGVal.textContent = bgG.value;
            bgBVal.textContent = bgB.value;
            drawCalibRects();
            updateBodyBg();
        });
    });

    // Botón valores por defecto
    defaultColorsBtn.addEventListener('click', () => {
        redR.value = 255; redG.value = 0; redB.value = 0;
        blueR.value = 0; blueG.value = 236; blueB.value = 255;
        bgR.value = 255; bgG.value = 255; bgB.value = 255;
        redRVal.textContent = '255'; redGVal.textContent = '0'; redBVal.textContent = '0';
        blueRVal.textContent = '0'; blueGVal.textContent = '236'; blueBVal.textContent = '255';
        bgRVal.textContent = '255'; bgGVal.textContent = '255'; bgBVal.textContent = '255';
        calibRed = { r: 255, g: 0, b: 0 };
        calibBlue = { r: 0, g: 236, b: 255 };
        calibBg = { r: 255, g: 255, b: 255 };
        drawCalibRects();
        updateBodyBg();
    });
    // Botón guardar - simplificado para guardar solo los 3 valores hexadecimales
    saveColorsBtn.addEventListener('click', () => {
        // Solo guardamos los tres valores hexadecimales
        const redHex = rgbToHex(calibRed.r, calibRed.g, calibRed.b);
        const blueHex = rgbToHex(calibBlue.r, calibBlue.g, calibBlue.b);
        const bgHex = rgbToHex(calibBg.r, calibBg.g, calibBg.b);
        
        localStorage.setItem('tv_redColor', redHex);
        localStorage.setItem('tv_blueColor', blueHex);
        localStorage.setItem('tv_bgColor', bgHex);
        
        alert('Colores guardados correctamente.');
    });
    function rgbToHex(r,g,b) {
        return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
    }
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
});
