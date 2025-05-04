// Estado y configuración
let currentSeparation = 1.5;
const separationStep = 0.5;
const pixelsPerUnit = 4;
const dotSize = 1;
const numBackgroundDots = 100000;
const numCDots = 5000;

// Constantes geométricas
const hiddenCRadiusRatio = 0.25;
const hiddenCLineWidthRatio = 0.08;
const hiddenCGapSize = Math.PI / 6;
const hiddenCGapAngle = 0;
const edgeBiasWidthRatio = 0.1;

// Colores y canvas
let currentBackgroundColor, currentRedColor, currentBlueColor, currentLandoltCColor;
let currentTextColor = '#f0f0ff';
let canvas = null, ctx = null;

function getColorFromStorage(key, defaultValue) {
    const storedValue = localStorage.getItem(key);
    return storedValue ? storedValue : defaultValue;
}

function drawOuterC(x, y, radius, lineWidth, gapAngle, gapSize, color) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.arc(x, y, radius, gapAngle + gapSize / 2, gapAngle - gapSize / 2 + Math.PI * 2);
    ctx.stroke();
}

function isInsideHiddenC(px, py, centerX, centerY, radius, lineWidth, gapAngle, gapSize) {
    const dx = px - centerX;
    const dy = py - centerY;
    const distSq = dx * dx + dy * dy;
    const innerRadius = radius - lineWidth / 2;
    const outerRadius = radius + lineWidth / 2;
    if (distSq < innerRadius * innerRadius || distSq > outerRadius * outerRadius) return false;
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;
    const gapStart = (gapAngle - gapSize / 2 + 2 * Math.PI) % (2 * Math.PI);
    const gapEnd = (gapAngle + gapSize / 2 + 2 * Math.PI) % (2 * Math.PI);
    if (gapStart < gapEnd) return !(angle >= gapStart && angle <= gapEnd);
    return !(angle >= gapStart || angle <= gapEnd);
}


function draw() {
    if (!canvas || !ctx) return;
    const anaglyphShift = currentSeparation * pixelsPerUnit;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (canvas.width === 0 || canvas.height === 0) return;

    ctx.fillStyle = currentBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const fontSize = Math.min(canvas.width, canvas.height) * 0.05;
    ctx.fillStyle = currentTextColor;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Convergencia ${currentSeparation.toFixed(1)} △`, 20, 20);

    const squareSize = canvas.height * 0.6;
    const squareX = (canvas.width - squareSize) / 2;
    const squareY = (canvas.height - squareSize) / 2;
    const hiddenCRadius = squareSize * hiddenCRadiusRatio;
    const hiddenCLineWidth = squareSize * hiddenCLineWidthRatio;
    const hiddenCCenterX = squareX + squareSize / 2;
    const hiddenCCenterY = squareY + squareSize / 2;
    const edgeBiasWidth = squareSize * edgeBiasWidthRatio;

    drawBackgroundDots(squareX, squareY, squareSize, anaglyphShift);
    drawAnaglyphCDots(hiddenCCenterX, hiddenCCenterY, hiddenCRadius, hiddenCLineWidth, anaglyphShift);
}

function drawBackgroundDots(squareX, squareY, squareSize, shift) {
    const halfDots = Math.floor(numBackgroundDots / 2);

    // --- Cuadrado rojo completo (izquierda) ---
    const redX = squareX - shift;
    for (let i = 0; i < halfDots; i++) {
        const x = redX + Math.random() * squareSize;
        const y = squareY + Math.random() * squareSize;
        ctx.fillStyle = currentRedColor;
        ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
    }

    // --- Cuadrado azul completo (derecha) ---
    const blueX = squareX + shift;
    for (let i = 0; i < halfDots; i++) {
        const x = blueX + Math.random() * squareSize;
        const y = squareY + Math.random() * squareSize;
        ctx.fillStyle = currentBlueColor;
        ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
    }
}

function drawAnaglyphCDots(centerX, centerY, radius, lineWidth, shift) {
    let drawn = 0, attempts = 0, maxAttempts = numCDots * 15;
    while (drawn < numCDots && attempts < maxAttempts) {
        attempts++;
        const angle = Math.random() * Math.PI * 2;
        const dist = radius + (Math.random() - 0.5) * lineWidth;
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;
        if (isInsideHiddenC(x, y, centerX, centerY, radius, lineWidth, hiddenCGapAngle, hiddenCGapSize)) {
            ctx.fillStyle = currentRedColor;
            ctx.fillRect(x + shift - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
            ctx.fillStyle = currentBlueColor;
            ctx.fillRect(x - shift - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
            drawn++;
        }
    }
}

function handleKeyDown(event) {
    let changed = false;
    if (event.key === 'ArrowLeft') {
        currentSeparation = Math.max(0, currentSeparation - separationStep);
        changed = true;
    } else if (event.key === 'ArrowRight') {
        currentSeparation += separationStep;
        changed = true;
    }
    if (changed) draw();
}

document.addEventListener('DOMContentLoaded', () => {
    currentRedColor = getColorFromStorage('tv_redColor', 'rgb(149,0,3)');
    currentBlueColor = getColorFromStorage('tv_blueColor', 'rgb(16,127,255)');
    currentBackgroundColor = getColorFromStorage('tv_bgColor', 'rgba(110, 97, 253, 0.7)');
    currentLandoltCColor = getColorFromStorage('tv_landoltColor', currentBlueColor);
    canvas = document.getElementById('anaglyphCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', draw);
    draw();
});