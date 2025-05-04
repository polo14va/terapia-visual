// Estado y configuración
let currentSeparation = 1.5;
const separationStep = 0.5;
const pixelsPerUnit = 4;
const dotSize = 1;
const numBackgroundDots = 50000;
const numCDots = 25000;

// Constantes geométricas
const hiddenCRadiusRatio = 0.25;
const hiddenCLineWidthRatio = 0.08;
const hiddenCGapSize = Math.PI / 2.5;
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

    drawBackgroundDots(squareX, squareY, squareSize, hiddenCCenterX, hiddenCCenterY, hiddenCRadius, hiddenCLineWidth, edgeBiasWidth);
    drawAnaglyphCDots(hiddenCCenterX, hiddenCCenterY, hiddenCRadius, hiddenCLineWidth, anaglyphShift);
    drawOuterCs(squareSize);
}

function drawBackgroundDots(squareX, squareY, squareSize, cX, cY, cRadius, cLineWidth, edgeBiasWidth) {
    const colors = [currentRedColor, currentBlueColor, '#000000'];
    let drawn = 0, attempts = 0, maxAttempts = numBackgroundDots * 10;
    while (drawn < numBackgroundDots && attempts < maxAttempts) {
        attempts++;
        const x = squareX + Math.random() * squareSize;
        const y = squareY + Math.random() * squareSize;
        if (!isInsideHiddenC(x, y, cX, cY, cRadius, cLineWidth, hiddenCGapAngle, hiddenCGapSize)) {
            let color, r = Math.random();
            if (x < squareX + edgeBiasWidth) color = r < 0.7 ? currentBlueColor : (r < 0.85 ? currentRedColor : colors[2]);
            else if (x > squareX + squareSize - edgeBiasWidth) color = r < 0.7 ? currentRedColor : (r < 0.85 ? currentBlueColor : colors[2]);
            else color = colors[Math.floor(Math.random() * colors.length)];
            ctx.fillStyle = color;
            ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
            drawn++;
        }
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

function drawOuterCs(squareSize) {
    const radius = squareSize * 0.075;
    const lineWidth = radius * 0.35;
    const gapSize = Math.PI / 2.5;
    const vertOffset = squareSize * 0.6;
    const horizSpacing = squareSize * 0.2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const topY = centerY - vertOffset;
    const bottomY = centerY + vertOffset;
    const leftX = centerX - horizSpacing;
    const rightX = centerX + horizSpacing;
    const gapDown = Math.PI / 2;
    const gapUp = (3 * Math.PI) / 2;
    drawOuterC(leftX, topY, radius, lineWidth, gapDown, gapSize, currentLandoltCColor);
    drawOuterC(rightX, topY, radius, lineWidth, gapUp, gapSize, currentLandoltCColor);
    drawOuterC(leftX, bottomY, radius, lineWidth, gapDown, gapSize, currentLandoltCColor);
    drawOuterC(rightX, bottomY, radius, lineWidth, gapUp, gapSize, currentLandoltCColor);
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