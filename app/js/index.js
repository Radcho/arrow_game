window.addEventListener('load', main);

/**
 * @type {HTMLCanvasElement}
 */
let canvas;

function main() {
    canvas = document.querySelector('canvas');
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

function resizeCanvas() {
    let section = document.querySelector('.main');
    canvas.width = section.clientWidth;
    canvas.style.width = section.clientWidth + 'px';
    canvas.height = section.height;
    canvas.style.height = section.clientHeight + 'px';
}


