/**
 * @type {HTMLCanvasElement}
 */
let canvas;

/**
 * @type {Playground}
 */
let playground;

let firstSolution = null;

let projects = [];

function onLoadPressed() {
    const name = document.getElementById('load-name').selectedOptions[0].value;
    if (projects.indexOf(name) !== -1) {
        axios.get(`/projects/${encodeURIComponent(name)}`).then((response) => {
            const map = response.data;
            loadMap(map);
        });
    }
}

function onImportPressed() {
    const input = document.getElementById('import-file');
    if (input.onchange === null) {
        input.onchange = () => {
            if (input.files.length > 0) {
                const file = input.files[0];
                readFile(file)
            }
        };
    }
    input.click();
}

function readFile(file) {
    const fReader = new FileReader();

    fReader.onloadend = (event) => {
        const contents = event.target.result;
        loadMap(JSON.parse(contents));
    }

    fReader.readAsText(file);
}

function loadMap(map) {
    playground.createPlayground(map.rows, map.columns, map.tiles);
    playground.robot.changeDirection(map.robot.direction);
    playground.robot.moveTo(map.robot.row, map.robot.column);
}

function getSavedLevels() {
    axios.get(`/projects`).then((response) => {
        projects = [];
        const select = document.getElementById('load-name');
        select.innerHTML = '';
        response.data.forEach((projectName) => {
            const option = document.createElement('option');
            const name = decodeURIComponent(projectName);
            option.value = name;
            option.innerText = name;
            select.appendChild(option);
            projects.push(name);
        });
    });
}

function resizeCanvas(width, height) {
    canvas.width = width;
    canvas.style.width = width + 'px';
    canvas.height = height;
    canvas.style.height = height + 'px';
}

function solve() {
    if (playground.robot.row !== -1 && playground.robot.column !== -1 && playground.finish) {
        // Try to solve without arrows
        const sandbox = new PlaygroundSandbox();
    }
}

function toCoord({ row, column }) {
    return `${row},${column}`;
}

function oppositeDirection(dir) {
    switch (dir) {
        case 'up':
            return 'down';
        case 'down':
            return 'up';
        case 'left':
            return 'right';
        case 'right':
            return 'left';
    }
}

class PlaygroundSandbox {
    constructor() {
        this.robot = new Robot(null, true);
        this.robot.row = playground.robot.row;
        this.robot.column = playground.robot.column;
        this.tiles = new ArrayMap(playground.tiles.valuesArray().map((tile) => [tile.coord, 0]));
    }

    reset() {
        this.robot.row = playground.robot.row;
        this.robot.column = playground.robot.column;
        this.tiles.forEach((value, key) => this.tiles.set(key, 0));
    }

    solveWithArrows(arrowsLeft) {
        // TODO: catch spinning in place
        while (this.tiles.get(this.robot.coord) < 3) {
            if (arrowsLeft) {
                // has arrows to spare
            } else {
                console.warn(`robot on ${this.robot.row}-${this.robot.column}`);
                if (this.robot.isOn(playground.finish)) {
                    firstSolution = this.tiles;
                    return true;
                }
                const next = this.robot.nextCoord;
                const nextTile = playground.tiles.get(toCoord(this.robot.nextCoord));
                if (!nextTile || nextTile.type === 'wall') {
                    this.robot.turnRight();
                } else {
                    this.robot.moveTo(next.row, next.column);
                    this.tiles.set(this.robot.coord, this.tiles.get(this.robot.coord) + 1)
                }
            }
        }

        return false;
    }

    spawnCopy() {
        const sandbox = new PlaygroundSandbox();
        sandbox.robot.row = this.robot.row;
        sandbox.robot.column = this.robot.column;
        sandbox.tiles = this.tiles.clone();
        return sandbox;
    }
}

class Playground {
    constructor() {
        this.activity = null;
        this.robot = null;
        this.rows = 0;
        this.columns = 0;
        this.tiles = new ArrayMap();
    }

    createPlayground(rows, columns, tiles) {
        this.rows = rows;
        this.columns = columns;
        this.tiles = new ArrayMap();
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        if (this.activity) {
            this.activity.enabled = false;
            this.activity.animating = false;
        }
        this.activity = new Activity(canvas, true);
        this.activity.onClick = (sprite) => this.spriteClicked(this.tiles.valuesArray().find((tile) => tile.sprite === sprite) || sprite);
        this.robot = new Robot(this.activity);
        resizeCanvas(columns * 50, rows * 50);
        if (tiles) {
            tiles.forEach((tile) => this.tiles.set(`${tile.row},${tile.column}`, new Tile(this.activity, tile.row, tile.column, tile.type)));
        } else {
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < columns; col++) {
                    this.tiles.set(`${row},${col}`, new Tile(this.activity, row, col));
                }
            }
        }
    }

    get finish() {
        return this.tiles.valuesArray().find((tile) => tile.type === 'finish');
    }

    spriteClicked(tile) {
        // overriden in other scripts
    }
}

class Tile {
    constructor(activity, row, column, type = 'tile') {
        this.row = row;
        this.column = column;
        this.activity = activity;
        this.type = 'tile';
        const images = ['tile', 'wall', 'finish'].map((type) => `/images/${type}.png`);
        this.sprite = new Sprite(activity, images, 25 + (50 * column), 25 + (50 * row), clickSprite);
        this.changeType(type);
    }

    get coord() {
        return `${this.row},${this.column}`;
    }

    changeType(type) {
        this.type = type;
        this.sprite.image = this.sprite.images.find((im) => im.src.indexOf(`${type}.png`) !== -1);
    }
}

class Robot {
    constructor(activity, shadow = false) {
        this.row = -1;
        this.column = -1;
        this.activity = activity;
        this.shadow = shadow;
        if (!shadow) {
            const images = ['r', 'l', 'u', 'd'].map((dir) => `/images/robot_${dir}.png`);
            this.sprite = new Sprite(activity, images, -100, -100, clickSprite);
        }
        this.direction = 'right';
    }

    get coord() {
        return `${this.row},${this.column}`;
    }

    isOn(tile) {
        return this.row === tile.row && this.column === tile.column;
    }

    changeDirection(dir) {
        this.direction = dir;
        if (!this.shadow) {
            const dirChar = dir.charAt(0);
            this.sprite.image = this.sprite.images.find((im) => im.src.indexOf(`robot_${dirChar}.png`) !== -1);
        }
    }

    moveTo(row, column) {
        this.row = row;
        this.column = column;
        if (!this.shadow) {
            this.sprite.setHome(25 + (50 * column), 25 + (50 * row));
            this.sprite.bringToFront();
        }
    }

    turnRight() {
        switch (this.direction) {
            case 'up':
                this.direction = 'right';
                break;
            case 'down':
                this.direction = 'left';
                break;
            case 'left':
                this.direction = 'up';
                break;
            case 'right':
                this.direction = 'down';
                break;
        }
    }

    getCoordFromDirection(dir) {
        const column = this.column + (dir === 'right') - (dir === 'left');
        const row = this.row + (dir === 'down') - (dir === 'up');
        return {
            row,
            column
        };
    }

    get possibleDirections() {
        return ['left', 'right', 'up', 'down']
            .filter((dir) => dir !== oppositeDirection(this.direction))
            .map((dir) => toCoord(this.getCoordFromDirection(dir)))
            .filter((coord) => playground.tiles.get(coord) && playground.tiles.get(coord).type !== 'wall');
    }

    get nextCoord() {
        return this.getCoordFromDirection(this.direction)
    }
}

class ArrayMap extends Map {
    valuesArray() {
        return Array.from(super.values());
    }

    clone() {
        const newMap = new Map();
        this.forEach((value, key) => newMap.set(key, value));
        return newMap;
    }
}

windowResize = function () {} // Override resize function, it's not needed.
