/**
 * Main canvas element.
 * @type {HTMLCanvasElement}
 */
let canvas;

/**
 * The playground class.
 * @type {Playground}
 */
let playground;

/**
 * The first solution found using the least arrows. Saved as a global reference.
 * @type {ArrayMap}
 */
let firstSolution = null;

/**
 * Minimal number of arrows needed to solve the level.
 * @type {number}
 */
let solvableWith = -1;

/**
 * Available projects for loading.
 * @type {Array<string>}
 */
let projects = [];

/**
 * Function called when the load button is pressed.
 * @param {Element} loadButton Load button element.
 */
function onLoadPressed(loadButton) {
    const name = document.getElementById('load-name').selectedOptions[0].value;
    if (projects.indexOf(name) !== -1) {
        axios.get(`/projects/${encodeURIComponent(name)}`).then((response) => {
            const map = response.data;
            loadMap(map);
            document.dispatchEvent(new Event('mousedown'));
            loadButton.classList.remove('bad');
        }, (error) => {
            console.error(error);
            loadButton.classList.add('bad');
        });
    }
}

/**
 * Function called when the import button is pressed.
 */
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

/**
 * Reads the uploaded json file.
 * @param {Blob} file Uploaded json file
 */
function readFile(file) {
    const fReader = new FileReader();

    fReader.onloadend = (event) => {
        const contents = event.target.result;
        loadMap(JSON.parse(contents));
    }

    fReader.readAsText(file);
}

/**
 * Loads the map as a new playground.
 * @param {Object} map Saved map object.
 */
function loadMap(map) {
    playground.createPlayground(map.rows, map.columns, map.tiles);
    playground.robot.changeDirection(map.robot.direction);
    playground.robot.moveTo(map.robot.row, map.robot.column);
    solvableWith = map.solvableWith;
    document.getElementById('solvable-in').innerText = solvableWith;
}

/**
 * Performs an AJAX request and fetches all available projects from the server.
 */
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

/**
 * Resizes the current canvas element to fit the requried size.
 * @param {number} width Width of the canvas in pixels.
 * @param {number} height Height of the canvas in pixels.
 */
function resizeCanvas(width, height) {
    canvas.width = width;
    canvas.style.width = width + 'px';
    canvas.height = height;
    canvas.style.height = height + 'px';
}

/**
 * Sets the status displayed in the footer.
 * @param {string} status Status to set.
 */
function setStatus(status) {
    const footer = document.querySelector('footer');
    if (status) {
        footer.querySelector('#status').innerText = status;
        footer.classList.remove('hidden');
    } else {
        footer.classList.add('hidden');
    }
}

/**
 * Tries to find the solution with the least amount of arrows used.
 * @returns {boolean} Solution found.
 */
function solve() {
    // Delete the previous solution.
    firstSolution = null;
    // The robot and finish must both be placed won into the playground.
    if (playground.robot.row !== -1 && playground.robot.column !== -1 && playground.finish) {
        // Create a playground sandbox to perform the solving.
        const sandbox = new PlaygroundSandbox();
        let arrowAmount = 0;
        let solved = false;
        // Incrementaly try to solve the level with the samllest number of arrows.
        while (!solved && arrowAmount < 50) {
            sandbox.reset();
            solved = sandbox.solveWithAttempts(arrowAmount);
            arrowAmount++;
        }
        if (solved) {
            return true;
        } else {
            console.warn('Could not solve');
        }
    } else {
        console.warn('Both a robot and a finish must be defined.');
    }

    return false;
}

/**
 * Transforms coordinates into a string representation.
 * @param {{row: number, column: number}} param0 Coordinates object.
 * @returns {string} Coordinate key.
 */
function toCoord({ row, column }) {
    return `${row},${column}`;
}

/**
 * Return a direction opposite to the provided one.
 * @param {string} dir Direction to find the opposite to.
 * @returns {string} Opposite direction.
 */
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

/**
 * Sandbox playground for solving the levels without visualization.
 */
class PlaygroundSandbox {
    constructor() {
        this.robot = new Robot(null, true);
        this.robot.row = playground.robot.row;
        this.robot.column = playground.robot.column;
        this.robot.direction = playground.robot.direction;
        this.previousTile = '';
        this.tiles = new ArrayMap(playground.tiles.valuesArray().map((tile) => [tile.coord, { steppedOn: 0, arrow: null }]));
    }

    /**
     * Resets the sandbox to the initial position.
     */
    reset() {
        this.robot.row = playground.robot.row;
        this.robot.column = playground.robot.column;
        this.robot.direction = playground.robot.direction;
        this.previousTile = '';
        this.tiles.forEach((value, key) => this.tiles.set(key, { steppedOn: 0, arrow: null }));
    }

    /**
     * Solves the level by placing arrows and tries to find the least amount of arrows needed.
     * @param {number} arrowsLeft Number of arrows left to use.
     * @returns {boolean} Successful solution.
     */
    solveWithAttempts(arrowsLeft) {
        // TODO: catch spinning in place
        // If the robot steps on the same tile 3 times, he's in a loop.
        while (this.tiles.get(this.robot.coord).steppedOn < 3) {
            const currentTile = this.tiles.get(this.robot.coord);
            const next = this.robot.nextCoord;
            const nextTile = playground.tiles.get(toCoord(next));
            // If the robot is currently on an arrow, move him accordingly.
            if (currentTile.arrow) {
                this.robot.direction = currentTile.arrow;
                this.previousTile = this.robot.coord;
                this.robot.moveTo(this.robot.nextCoord.row, this.robot.nextCoord.column);
                this.tiles.get(this.robot.coord).steppedOn++;
            // If the robot is facing a wall, turn right.
            } else if (!nextTile || nextTile.type === 'wall') {
                this.robot.turnRight();
            } else {
                // If any arrows are left, try using them when applicable.
                if (arrowsLeft) {
                    // Get a list of possible directions to go. Do not go back.
                    let possibilities = this.robot.possibleDirections.filter((poss) => poss !== this.previousTile);
                    // When it's not possible to move, exit the loop.
                    if (possibilities.length === 0) {
                        break;
                    } else if (possibilities.length === 1) {
                        // If only a single possibility is available, move accordingly.
                        const possibility = possibilities[0];
                        // When not facing the possibility, use an arrow.
                        if (toCoord(this.robot.nextCoord) !== possibility) {
                            while (toCoord(this.robot.nextCoord) !== possibility) {
                                this.robot.turnRight();
                            }
                            arrowsLeft--;
                            this.tiles.get(this.robot.coord).arrow = this.robot.direction;
                        }
                        this.previousTile = this.robot.coord;
                        this.robot.moveTo(this.robot.nextCoord.row, this.robot.nextCoord.column);
                        this.tiles.get(this.robot.coord).steppedOn++;
                    } else {
                        // In case of multiple possibilities, traverse each one. It's not very well optimised.
                        for (let possibility of possibilities) {
                            // Spawn a copy of the current playground.
                            const copy = this.spawnCopy();
                            let solved = false;
                            // If going forward, just solve the copy. Otherwise use an arrow and solve the copy.
                            if (toCoord(copy.robot.nextCoord) === possibility) {
                                copy.previousTile = copy.robot.coord;
                                copy.robot.moveTo(copy.robot.nextCoord.row, copy.robot.nextCoord.column);
                                solved = copy.solveWithAttempts(arrowsLeft);
                            } else {
                                while (toCoord(copy.robot.nextCoord) !== possibility) {
                                    copy.robot.turnRight();
                                }
                                copy.tiles.get(copy.robot.coord).arrow = copy.robot.direction;
                                solved = copy.solveWithAttempts(arrowsLeft - 1);
                            }
                            // If the copy solved the level, escape the function.
                            if (solved) {
                                return true;
                            }
                        }

                        // If none of the spawned copies were successfult, exit the recursion.
                        return false;
                    }
                // No arrows are left, try to walk to the finish.
                } else {
                    // If the robot is standing on the finish, the solution is found. Return successfully.
                    if (this.robot.isOn(playground.finish)) {
                        firstSolution = this.tiles;
                        return true;
                    }
                    // When not, just move the robot forward.
                    this.previousTile = this.robot.coord;
                    this.robot.moveTo(next.row, next.column);
                    this.tiles.get(this.robot.coord).steppedOn++;
                }
            }
        }

        // When arriving at the same tile for the third time, exit the function.
        return false;
    }

    /**
     * Tries to solve the level with the defined arrows. No recursion needed.
     * @param {ArrayMap} arrows Arrows placed on the playground to solve the level.
     * @returns {boolean} Successful solution.
     */
    solveWithArrows(arrows) {
        // Place the arrows on the playground sandbox.
        arrows.forEach((arrow) => {
            this.tiles.get(toCoord({row: arrow.row, column: arrow.column})).arrow = arrow.direction;
        });
        // Use a similar algorithm to the recursive one, except we act like there are no arrows leftr.
        while (this.tiles.get(this.robot.coord).steppedOn < 3) {
            const currentTile = this.tiles.get(this.robot.coord);
            const next = this.robot.nextCoord;
            const nextTile = playground.tiles.get(toCoord(next));
            if (currentTile.arrow) {
                this.robot.direction = currentTile.arrow;
                let targetTile = this.tiles.get(toCoord(this.robot.nextCoord));
                while (!targetTile || targetTile.type === 'wall') {
                    this.robot.turnRight();
                    targetTile = this.tiles.get(toCoord(this.robot.nextCoord));
                }
                this.robot.moveTo(this.robot.nextCoord.row, this.robot.nextCoord.column);
                this.tiles.get(this.robot.coord).steppedOn++;
            } else if (!nextTile || nextTile.type === 'wall') {
                this.robot.turnRight();
            } else {
                if (this.robot.isOn(playground.finish)) {
                    return true;
                }
                this.robot.moveTo(next.row, next.column);
                this.tiles.get(this.robot.coord).steppedOn++;
            }
        }
        return false;
    }

    /**
     * Returns a copy of the playground sandbox.
     * @returns {PlaygroundSandbox} Deep playground sandbox copy.
     */
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

/**
 * The real playground for playing and editing.
 */
class Playground {
    constructor() {
        this.activity = null;
        this.robot = null;
        this.rows = 0;
        this.columns = 0;
        this.tiles = new ArrayMap();
        this.arrows = new ArrayMap();
    }

    /**
     *
     * @param {number} rows Number of rows the playground should have.
     * @param {number} columns Number of columns the playground should have.
     * @param {Array<object>} tiles Optional array of saved tiles to populate.
     */
    createPlayground(rows, columns, tiles) {
        this.rows = rows;
        this.columns = columns;
        this.tiles.clear();
        this.arrows.clear();
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        // If an activity was already defined, disable it.
        if (this.activity) {
            this.activity.onClick = null;
            this.activity.enabled = false;
            this.activity.animating = false;
        }
        this.activity = new Activity(canvas, true);
        this.activity.onClick = (sprite) => this.spriteClicked(this.tiles.valuesArray().find((tile) => tile.sprite === sprite) || sprite);
        this.robot = new Robot(this.activity);
        resizeCanvas(columns * 50, rows * 50);
        // If tiles were provided, populate the playground. Otherwise just spawn in empty tiles.
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

    /**
     * Finish tile if it exists.
     * @returns {Tile} Finish tile.
     */
    get finish() {
        return this.tiles.valuesArray().find((tile) => tile.type === 'finish');
    }

    /**
     * Add an arrow to the specified position.
     * @param {number} row Row to add the arrow to.
     * @param {number} column Column to add the arrow to.
     * @param {string} dir Direction of the arrow
     */
    addArrow(row, column, dir) {
        const coord = toCoord({row, column});
        if (this.arrows.has(coord)) {
            this.arrows.get(coord).erase();
        }
        this.arrows.set(coord, new Arrow(this.activity, row, column, dir));
    }

    /**
     * Removes the arrow from the specified position.
     * @param {number} row Row to remove the arrow from.
     * @param {number} column Column to remove the arrow from.
     */
    removeArrow(row, column) {
        const coord = toCoord({row, column});
        if (this.arrows.has(coord)) {
            this.arrows.get(coord).erase();
            this.arrows.delete(coord);
        }
        this.activity.paint();
    }

    /**
     * Clears all placed arrows.
     */
    clearArrows() {
        this.arrows.forEach((arrow) => arrow.erase());
        this.arrows.clear();
        this.activity.paint();
    }

    /**
     * Handler for playground click events.
     * @param {Tile | Sprite} tile Tile or sprite of the clicked object.
     */
    spriteClicked(tile) {
        // overriden in other scripts
    }
}

/**
 * Tile object located on the playground. These make up the level.
 */
class Tile {
    /**
     * Tile object located on the playground.
     * @param {Activity} activity Playground activity.
     * @param {number} row Row the tile is located on
     * @param {number} column Column the tile is located on.
     * @param {string} type Type of the wall.
     */
    constructor(activity, row, column, type = 'tile') {
        this.row = row;
        this.column = column;
        this.activity = activity;
        this.type = 'tile';
        const images = ['tile', 'wall', 'finish'].map((type) => `/images/${type}.png`);
        this.sprite = new Sprite(activity, images, 25 + (50 * column), 25 + (50 * row), clickSprite);
        this.changeType(type);
    }

    /**
     * Tile coordinate key
     * @returns {string} Coordinate key.
     */
    get coord() {
        return `${this.row},${this.column}`;
    }

    /**
     * Change the tile to a different type.
     * @param {string} type Type of the tile.
     */
    changeType(type) {
        this.type = type;
        this.sprite.image = this.sprite.images.find((im) => im.src.indexOf(`${type}.png`) !== -1);
    }
}

/**
 * Arrow placed on the playground specifying robot movement.
 */
class Arrow {
    /**
     * Arrow placed on the playground specifying robot movement.
     * @param {Activity} activity Playground activity.
     * @param {number} row Row to add the arrow to.
     * @param {number} column Column to add the arrow to.
     * @param {string} dir Direction of the arrow
     */
    constructor(activity, row, column, dir) {
        this.row = row;
        this.column = column;
        this.direction = dir;
        const dirChar = dir.charAt(0);
        this.sprite = new Sprite(activity, `/images/arrow_${dirChar}.png`, 25 + (50 * column), 25 + (50 * row), clickSprite);
    }

    /**
     * Erases the arrow.
     */
    erase() {
        this.sprite.erase();
    }
}

/**
 * Robot moving on the playground.
 */
class Robot {
    /**
     * Create a new Robot instance.
     * @param {Activity} activity Playground activity.
     * @param {boolean} shadow Create the robot as a shadow. Shadows do not get displayed on the canvas.
     */
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

    /**
     * Robot coordinate key.
     * @returns {string} Coordinate key.
     */
    get coord() {
        return `${this.row},${this.column}`;
    }

    /**
     * Finds if the robot is located on the specified tile.
     * @param {Tile} tile Tile in question.
     * @returns {boolean} Robot is located on the tile.
     */
    isOn(tile) {
        return this.row === tile.row && this.column === tile.column;
    }

    /**
     * Rotates the robot to face a new direction.
     * @param {string} dir Direction to rotate to.
     */
    changeDirection(dir) {
        this.direction = dir;
        if (!this.shadow) {
            const dirChar = dir.charAt(0);
            this.sprite.image = this.sprite.images.find((im) => im.src.indexOf(`robot_${dirChar}.png`) !== -1);
        }
    }

    /**
     * Moves the robot to the specified position.
     * @param {number} row Row the robot should move to.
     * @param {number} column Column the robot should move to.
     */
    moveTo(row, column) {
        this.row = row;
        this.column = column;
        if (!this.shadow) {
            this.sprite.setHome(25 + (50 * column), 25 + (50 * row));
            this.sprite.bringToFront();
        }
    }

    /**
     * Turns the robot to the right of his current orientation.
     */
    turnRight() {
        let dir;
        switch (this.direction) {
            case 'up':
                dir = 'right';
                break;
            case 'down':
                dir = 'left';
                break;
            case 'left':
                dir = 'up';
                break;
            case 'right':
                dir = 'down';
                break;
        }
        this.changeDirection(dir);
    }

    /**
     * Gets a neighbouring coordinate from a specific direction.
     * @param {string} dir Direction for the neighbouring coordinate.
     * @returns {{row: number, column: number}} Neighbouring coordinates.
     */
    getCoordFromDirection(dir) {
        const column = this.column + (dir === 'right') - (dir === 'left');
        const row = this.row + (dir === 'down') - (dir === 'up');
        return {
            row,
            column
        };
    }

    /**
     * Returns a serialized robot object.
     * @returns {Object} Serialized robot.
     */
    toObject() {
        return {
            row: this.row,
            column: this.column,
            direction: this.direction
        }
    }

    /**
     * List of all viable direction for the robot to go.
     * @returns {Array<string>} Array of possilbe directions.
     */
    get possibleDirections() {
        return ['left', 'right', 'up', 'down']
            .map((dir) => toCoord(this.getCoordFromDirection(dir)))
            .filter((coord) => playground.tiles.get(coord) && playground.tiles.get(coord).type !== 'wall');
    }

    /**
     * Next coordinate in the direction the robot is facing.
     * @returns {{row: number, column: number}} Next coordinate.
     */
    get nextCoord() {
        return this.getCoordFromDirection(this.direction)
    }
}

/**
 * Native Map object extended for this specific use case.
 */
class ArrayMap extends Map {
    /**
     * Returns the values collection as an array instead of an iterator.
     * @returns {Array<any>} Values array.
     */
    valuesArray() {
        return Array.from(super.values());
    }

    /**
     * Clones the map. Object get cloned deeply with a single layer.
     * @returns {ArrayMap} Copy.
     */
    clone() {
        const newMap = new ArrayMap();
        this.forEach((value, key) => newMap.set(key, typeof value === 'object' ? Object.assign({}, value) : value));
        return newMap;
    }
}

// Override resize function, it's not needed.
windowResize = function () {}
