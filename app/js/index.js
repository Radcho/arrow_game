window.addEventListener('load', main);

/**
 * @type {HTMLCanvasElement}
 */
let canvas;

function main() {
    canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.font = "48px Arial";
    context.fillText('No level', 13, 56);
}

function resizeCanvas(width, height) {
    canvas.width = width;
    canvas.style.width = width + 'px';
    canvas.height = height;
    canvas.style.height = height + 'px';
}
