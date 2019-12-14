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

let projects = [];

function main() {
    getSavedLevels();
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
    document.getElementById('load').addEventListener('click', () => {
        const name = document.getElementById('load-name').selectedOptions[0].value;
        if (projects.indexOf(name) !== -1) {
            axios.get(`/projects/${encodeURIComponent(name)}`).then((response) => {
                const map = response.data;
                loadMap(map);
            });
        }
    });
    document.getElementById('save').addEventListener('click', () => {
        const name = document.getElementById('save-name').value;
        if (name && playground.tiles.length > 0) {
            // TODO: Check if project exists
            const map = playground.toObject();
            axios.post(`/projects/save`, {
                name: encodeURIComponent(name),
                project: map
            }).then(() => {
                getSavedLevels();
            });
        }
    });
    document.getElementById('import').addEventListener('click', () => {
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
    });
    document.getElementById('export').addEventListener('click', () => {
        const dl = document.createElement('a');
        const json = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(playground.toObject()))}`;
        dl.href = json;
        dl.download = 'level.json';
        document.body.appendChild(dl);
        dl.click();
        document.body.removeChild(dl);
    });
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
        this.rows = 0;
        this.columns = 0;
    }

    createPlayground(rows, columns, tiles) {
        this.rows = rows;
        this.columns = columns;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        if (this.activity) {
            this.activity.enabled = false;
            this.activity.animating = false;
        }
        this.activity = new Activity(canvas, true);
        this.activity.onClick = (sprite) => this.spriteClicked(this.tiles.find((tile) => tile.sprite === sprite) || sprite);
        this.robot = new Robot(this.activity);
        this.tiles = [];
        resizeCanvas(columns * 50, rows * 50);
        if (tiles) {
            tiles.forEach((tile) => this.tiles.push(new Tile(this.activity, tile.row, tile.column, tile.type)));
        } else {
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < columns; col++) {
                    this.tiles.push(new Tile(this.activity, row, col));
                }
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

    toObject() {
        return {
            rows: this.rows,
            columns: this.columns,
            robot: this.robot.toObject(),
            tiles: this.tiles.map((tile) => tile.toObject())
        }
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

    changeType(type) {
        this.type = type;
        this.sprite.image = this.sprite.images.find((im) => im.src.indexOf(`${type}.png`) !== -1);
    }

    toObject() {
        return {
            row: this.row,
            column: this.column,
            type: this.type
        };
    }
}

class Robot {
    constructor(activity) {
        this.row = -1;
        this.column = -1;
        this.activity = activity;
        const images = ['r', 'l', 'u', 'd'].map((dir) => `/images/robot_${dir}.png`);
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

    toObject() {
        return {
            row: this.row,
            column: this.column,
            direction: this.direction
        }
    }
}

windowResize = function () {} // Override resize function, it's not needed.
