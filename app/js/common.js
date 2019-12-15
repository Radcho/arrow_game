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
    firstSolution = null;
    if (playground.robot.row !== -1 && playground.robot.column !== -1 && playground.finish) {
        const sandbox = new PlaygroundSandbox();
        let arrowAmount = 0;
        let solved = false;
        while (!solved && arrowAmount < 50) {
            sandbox.reset();
            solved = sandbox.solveWithArrows(arrowAmount);
            arrowAmount++;
        }
        if (solved) {
            // console.warn(firstSolution);
        } else {
            console.warn('Could not solve');
        }
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
        this.robot.direction = playground.robot.direction;
        this.previousTile = '';
        this.tiles = new ArrayMap(playground.tiles.valuesArray().map((tile) => [tile.coord, { steppedOn: 0, arrow: null }]));
    }

    reset() {
        this.robot.row = playground.robot.row;
        this.robot.column = playground.robot.column;
        this.robot.direction = playground.robot.direction;
        this.previousTile = '';
        this.tiles.forEach((value, key) => this.tiles.set(key, { steppedOn: 0, arrow: null }));
    }

    solveWithArrows(arrowsLeft) {
        // console.warn(`Solving with ${arrowsLeft}`);
        // TODO: catch spinning in place
        while (this.tiles.get(this.robot.coord).steppedOn < 3) {
            const currentTile = this.tiles.get(this.robot.coord);
            const next = this.robot.nextCoord;
            const nextTile = playground.tiles.get(toCoord(next));
            // console.warn(`Currently on ${this.robot.coord} standing on ${JSON.stringify(currentTile)}`);
            if (currentTile.arrow) {
                this.robot.direction = currentTile.arrow;
                this.previousTile = this.robot.coord;
                this.robot.moveTo(this.robot.nextCoord.row, this.robot.nextCoord.column);
                this.tiles.get(this.robot.coord).steppedOn++;
                // console.warn(`Stepped on an arrow, moved to ${this.robot.coord}`);
            } else if (!nextTile || nextTile.type === 'wall') {
                this.robot.turnRight();
                // console.warn('Wall ahead. Turning right.');
            } else {
                if (arrowsLeft) {
                    let possibilities = this.robot.possibleDirections.filter((poss) => poss !== this.previousTile);
                    // console.warn(`Found ${possibilities.length} possible directions. These are ${possibilities.join(', ')}`);
                    if (possibilities.length === 0) {
                        // console.warn(`No possible places to move.`);
                        break;
                    } else if (possibilities.length === 1) {
                        const possibility = possibilities[0]
                        if (toCoord(this.robot.nextCoord) !== possibility) {
                            while (toCoord(this.robot.nextCoord) !== possibility) {
                                this.robot.turnRight();
                            }
                            arrowsLeft--;
                            // console.warn(`Used an arrow.`);
                            this.tiles.get(this.robot.coord).arrow = this.robot.direction;
                        }
                        this.previousTile = this.robot.coord;
                        this.robot.moveTo(this.robot.nextCoord.row, this.robot.nextCoord.column);
                        this.tiles.get(this.robot.coord).steppedOn++;
                        // console.warn(`Moved to only place possible: ${this.robot.coord}`);
                    } else {
                        for (let possibility of possibilities) {
                            const copy = this.spawnCopy();
                            let solved = false;
                            if (toCoord(copy.robot.nextCoord) === possibility) {
                                // console.warn(`Going forward.`);
                                copy.previousTile = copy.robot.coord;
                                copy.robot.moveTo(copy.robot.nextCoord.row, copy.robot.nextCoord.column);
                                solved = copy.solveWithArrows(arrowsLeft);
                            } else {
                                while (toCoord(copy.robot.nextCoord) !== possibility) {
                                    copy.robot.turnRight();
                                }
                                copy.tiles.get(copy.robot.coord).arrow = copy.robot.direction;
                                // console.warn(`Going ${copy.tiles.get(copy.robot.coord).arrow}`);
                                // console.warn(`Used an arrow.`);
                                solved = copy.solveWithArrows(arrowsLeft - 1);
                            }
                            if (solved) {
                                return true;
                            }
                        }

                        return false;
                    }
                } else {
                    if (this.robot.isOn(playground.finish)) {
                        firstSolution = this.tiles;
                        return true;
                    }
                    this.previousTile = this.robot.coord;
                    this.robot.moveTo(next.row, next.column);
                    this.tiles.get(this.robot.coord).steppedOn++;
                }
            }
        }
        // console.warn('No solutions found, exiting');
        return false;
    }

    spawnCopy() {
        const sandbox = new PlaygroundSandbox();
        sandbox.robot.row = this.robot.row;
        sandbox.robot.column = this.robot.column;
        sandbox.robot.direction = this.robot.direction;
        sandbox.previousTile = this.previousTile;
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
            this.activity.onClick = null;
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

class Arrow {
    constructor(activity, row, column, dir) {
        this.row = row;
        this.column = column;
        this.direction = dir;
        const dirChar = dir.charAt(0);
        this.sprite = new Sprite(activity, `/images/arrow_${dirChar}.png`, 25 + (50 * column), 25 + (50 * row), clickSprite);
    }

    erase() {
        this.sprite.erase();
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
            //.filter((dir) => dir !== oppositeDirection(this.direction)) lets try it without this for now
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
        const newMap = new ArrayMap();
        this.forEach((value, key) => newMap.set(key, typeof value === 'object' ? Object.assign({}, value) : value));
        return newMap;
    }
}

windowResize = function () {} // Override resize function, it's not needed.
