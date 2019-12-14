window.addEventListener('load', main);

/**
 * @type {HTMLCanvasElement}
 */
let canvas;

/**
 * @type {Playground}
 */
let playground;

let direction = 'right';
let tool = 'walls';

function main() {
    canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.font = "48px Arial";
    context.fillText('No level', 13, 56);
    playground = new Playground();

    attachButtonHandlers();
    attachToolbarHandlers();
}

function getValidatedInput(input) {
    const value = parseInt(input.value);
    if (value && !isNaN(value) && value > 0 && value <= 15) {
        return value;
    }

    return 0;
}

function attachButtonHandlers() {
    document.getElementById('create').addEventListener('click', () => {
        const rows = getValidatedInput(document.getElementById('rows'));
        const columns = getValidatedInput(document.getElementById('columns'));
        if (rows && columns) {
            playground.createPlayground(rows, columns);
        }
    });
    document.getElementById('load').addEventListener('click', () => {})
    document.getElementById('save').addEventListener('click', () => {})
    document.getElementById('import').addEventListener('click', () => {})
    document.getElementById('export').addEventListener('click', () => {})
}

function attachToolbarHandlers() {
    document.getElementById('walls').addEventListener('click', () => changeTool('walls'));
    document.getElementById('finish').addEventListener('click', () => changeTool('finish'));
    document.getElementById('robot').addEventListener('click', () => changeTool('robot'));
    document.getElementById('robot-left').addEventListener('click', () => changeDirection('left'));
    document.getElementById('robot-right').addEventListener('click', () => changeDirection('right'));
    document.getElementById('robot-up').addEventListener('click', () => changeDirection('up'));
    document.getElementById('robot-down').addEventListener('click', () => changeDirection('down'));
}

function changeTool(chosenTool) {
    tool = chosenTool;
    document.querySelectorAll('.control').forEach((el) => el.classList.remove('active'));
    document.getElementById(chosenTool).classList.add('active');
}

function changeDirection(chosenDirection) {
    direction = chosenDirection;
    const robot = document.getElementById('robot');
    robot.classList.remove('left', 'right', 'up', 'down');
    robot.classList.add(chosenDirection);
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
        this.robot = null;
    }

    createPlayground(rows, columns) {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        if (this.activity) {
            this.activity.enabled = false;
            this.activity.animating = false;
        }
        this.activity = new Activity(canvas, true);
        this.activity.onClick = (sprite) => this.spriteClicked(this.tiles.find((tile) => tile.sprite === sprite) || sprite);
        this.robot = new Robot(this.activity);
        resizeCanvas(columns * 50, rows * 50);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                this.tiles.push(new Tile(this.activity, row, col));
            }
        }
    }

    spriteClicked(tile) {
        if (!(tile instanceof Tile)) {
            tile = this.tiles.find((t) => t.sprite.isIn(tile.x, tile.y));
            if (!tile) {
                return;
            }
        }
        switch (tool) {
            case 'walls':
                tile.changeType(tile.type === 'tile' ? 'wall' : 'tile');
                break;
            case 'robot':
                if (tile instanceof Tile) {
                    this.robot.moveTo(tile.row, tile.column);
                    if (this.robot.direction !== direction) {
                        this.robot.changeDirection(direction);
                    }
                }
                break;
            case 'finish':
                const existingFinish = this.tiles.find((t) => t.type === 'finish');
                if (existingFinish) {
                    existingFinish.changeType('tile');
                }
                tile.changeType('finish');
                break;
        }
    }
}

class Tile {
    constructor(activity, row, column) {
        this.row = row;
        this.column = column;
        this.activity = activity;
        this.type = 'tile';
        const images = ['tile', 'wall', 'finish'].map((type) => `http://localhost:3000/images/${type}.png`);
        this.sprite = new Sprite(activity, images, 25 + (50 * column), 25 + (50 * row), clickSprite);
    }

    changeType(type) {
        this.type = type;
        this.sprite.image = this.sprite.images.find((im) => im.src.indexOf(`${type}.png`) !== -1);
    }
}

class Robot {
    constructor(activity) {
        this.row = -1;
        this.column = -1;
        this.activity = activity;
        const images = ['r', 'l', 'u', 'd'].map((dir) => `http://localhost:3000/images/robot_${dir}.png`);
        this.sprite = new Sprite(activity, images, -100, -100, clickSprite);
        this.direction = 'right';
    }

    changeDirection(dir) {
        this.direction = dir;
        const dirChar = dir.charAt(0);
        this.sprite.image = this.sprite.images.find((im) => im.src.indexOf(`robot_${dirChar}.png`) !== -1);
    }

    moveTo(row, column) {
        this.row = row;
        this.column = column;
        this.sprite.setHome(25 + (50 * column), 25 + (50 * row));
        this.sprite.bringToFront();
    }
}

windowResize = function () {} // Override resize function, it's not needed.
