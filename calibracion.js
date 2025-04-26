document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const calibRectRed = document.getElementById('calibRectRed');
    const calibRectBlue = document.getElementById('calibRectBlue');
    const calibRectBg = document.getElementById('calibRectBg');
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
    }
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
    drawCalibRects();
    updateBodyBg();

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
    // Botón guardar
    saveColorsBtn.addEventListener('click', () => {
        localStorage.setItem('tv_calibRectRed', rgbToHex(calibRed.r, calibRed.g, calibRed.b));
        localStorage.setItem('tv_calibRectBlue', rgbToHex(calibBlue.r, calibBlue.g, calibBlue.b));
        localStorage.setItem('tv_calibBg', rgbToHex(calibBg.r, calibBg.g, calibBg.b));
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
