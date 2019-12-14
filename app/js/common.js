/**
 * @type {HTMLCanvasElement}
 */
let canvas;

/**
 * @type {Playground}
 */
let playground;

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
}

windowResize = function () {} // Override resize function, it's not needed.
