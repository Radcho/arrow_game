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
    document.getElementById('load').addEventListener('click', () => onLoadPressed());
    document.getElementById('import').addEventListener('click', () => onImportPressed());
    document.getElementById('create').addEventListener('click', () => {
        const rows = getValidatedInput(document.getElementById('rows'));
        const columns = getValidatedInput(document.getElementById('columns'));
        if (rows && columns) {
            playground.createPlayground(rows, columns);
        }
    });
    document.getElementById('save').addEventListener('click', () => {
        const name = document.getElementById('save-name').value;
        if (name && playground.tiles.size > 0) {
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
    document.getElementById('export').addEventListener('click', () => {
        solve();
        // const dl = document.createElement('a');
        // const json = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(playground.toObject()))}`;
        // dl.href = json;
        // dl.download = 'level.json';
        // document.body.appendChild(dl);
        // dl.click();
        // document.body.removeChild(dl);
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
            const existingFinish = this.tiles.valuesArray().find((t) => t.type === 'finish');
            if (existingFinish) {
                existingFinish.changeType('tile');
            }
            tile.changeType('finish');
            break;
    }
}

Playground.prototype.toObject = function () {
    return {
        rows: this.rows,
        columns: this.columns,
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

Robot.prototype.toObject = function () {
    return {
        row: this.row,
        column: this.column,
        direction: this.direction
    }
}
