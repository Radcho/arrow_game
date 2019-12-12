window.addEventListener('load', main);

/**
 * @type {HTMLCanvasElement}
 */
let canvas;

/**
 * @type {Playground}
 */
let playground;

function main() {
    canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.font = "48px Arial";
    context.fillText('No level', 13, 56);
    playground = new Playground();

    attachButtonHandlers();
}

function getValidatedInput(input) {
    let value = parseInt(input.value);
    if (value && !isNaN(value) && value > 0 && value <= 15) {
        return value;
    }

    return 0;
}

function attachButtonHandlers() {
    document.getElementById('create').addEventListener('click', () => {
        let rows = getValidatedInput(document.getElementById('rows'));
        let columns = getValidatedInput(document.getElementById('columns'));
        if (rows && columns) {
            playground.createPlayground(rows, columns);
        }
    });
    document.getElementById('load').addEventListener('click', () => {})
    document.getElementById('save').addEventListener('click', () => {})
    document.getElementById('import').addEventListener('click', () => {})
    document.getElementById('export').addEventListener('click', () => {})
}

function resizeCanvas(width, height) {
    canvas.width = width;
    canvas.style.width = width + 'px';
    canvas.height = height;
    canvas.style.height = height + 'px';
}

class Playground {
    constructor() {
        this.tiles = [];
        this.activity = null;
    }

    createPlayground(rows, columns) {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        if (this.activity) {
            this.activity.enabled = false;
            this.activity.animating = false;
        }
        this.activity = new Activity(canvas, true);
        this.activity.onClick = (sprite) => this.spriteClicked(this.tiles.find((tile) => tile.sprite === sprite));
        resizeCanvas(columns * 50, rows * 50);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                this.tiles.push(new Tile(this.activity, row, col));
            }
        }
    }

    spriteClicked(tile) {
        tile.changeType();
    }
}

class Tile {
    constructor(activity, row, column) {
        this.row = row;
        this.column = column;
        this.activity = activity;
        this.isWall = false;
        this.sprite = new Sprite(activity, ['http://localhost:3000/images/tile.png', 'http://localhost:3000/images/wall.png'], 25 + (50 * column), 25 + (50 * row), clickSprite);
    }

    changeType() {
        this.sprite.images.reverse();
        this.sprite.image = this.sprite.images[0];
        this.isWall = !this.isWall;
    }
}

windowResize = function () {} // Override resize function, it's not needed.
