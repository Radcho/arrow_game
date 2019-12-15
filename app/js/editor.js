window.addEventListener('load', main);
let direction = 'right';
let tool = 'walls';

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
    const loadButton = document.getElementById('load');
    loadButton.addEventListener('click', () => onLoadPressed(loadButton));
    document.getElementById('import').addEventListener('click', () => onImportPressed());
    const createButton = document.getElementById('create');
    createButton.addEventListener('click', () => {
        const rows = getValidatedInput(document.getElementById('rows'));
        const columns = getValidatedInput(document.getElementById('columns'));
        if (rows && columns) {
            playground.createPlayground(rows, columns);
            document.dispatchEvent(new Event('mousedown'));
            createButton.classList.remove('bad');
        } else {
            createButton.classList.add('bad');
        }
    });
    const saveButton = document.getElementById('save');
    saveButton.addEventListener('click', () => {
        const name = document.getElementById('save-name').value;
        if (name && playground.tiles.size > 0 && playground.isComplete()) {
            // TODO: Check if project exists
            const map = playground.toObject();
            axios.post(`/projects/save`, {
                name: encodeURIComponent(name),
                project: map
            }).then(() => {
                getSavedLevels();
                document.dispatchEvent(new Event('mousedown'));
                saveButton.classList.remove('bad');
            }, (error) => {
                console.error(error);
                saveButton.classList.add('bad');
            });
        } else {
            saveButton.classList.add('bad');
        }
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
    const solveButton = document.getElementById('solve');
    solveButton.addEventListener('click', () => {
        if (playground.tiles.size > 0) {
            solve();
            playground.clearArrows();
            if (firstSolution) {
                setStatus('✔');
                displaySolution();
                solveButton.classList.remove('bad');
            } else {
                setStatus();
                solveButton.classList.add('bad');
            }
        } else {
            setStatus();
            solveButton.classList.add('bad');
        }
    });
}

function displaySolution() {
    firstSolution.forEach((tileInfo, key) => {
        if (tileInfo.arrow) {
            let [row, col] = key.split(',');
            playground.addArrow(row, col, tileInfo.arrow);
        }
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

Playground.prototype.spriteClicked = function (tile) {
    if (!(tile instanceof Tile)) {
        tile = this.tiles.valuesArray().find((t) => t.sprite.isIn(tile.x, tile.y));
        if (!tile) {
            console.warn('Could not find tile');
            return;
        }
    }
    switch (tool) {
        case 'walls':
            tile.changeType(tile.type === 'tile' ? 'wall' : 'tile');
            if (this.robot.isOn(tile)) {
                this.robot.moveTo(-1, -1);
            }
            break;
        case 'robot':
            if (tile instanceof Tile && tile.type === 'tile') {
                this.robot.moveTo(tile.row, tile.column);
                if (this.robot.direction !== direction) {
                    this.robot.changeDirection(direction);
                }
            }
            break;
        case 'finish':
            const existingFinish = this.tiles.valuesArray().find((t) => t.type === 'finish');
            if (existingFinish) {
                existingFinish.changeType('tile');
            }
            tile.changeType('finish');
            break;
    }
}

Playground.prototype.isComplete = function () {
    return solve();
}

Playground.prototype.toObject = function () {
    return {
        rows: this.rows,
        columns: this.columns,
        solvableWith: firstSolution.valuesArray().filter((tileInfo) => tileInfo.arrow !== null).length,
        robot: this.robot.toObject(),
        tiles: this.tiles.valuesArray().map((tile) => tile.toObject())
    }
}

Tile.prototype.toObject = function () {
    return {
        row: this.row,
        column: this.column,
        type: this.type
    };
}
