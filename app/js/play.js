window.addEventListener('load', main);

let draggedArrow = null;
let solving = null;

function main() {
    getSavedLevels();
    canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.font = "48px Arial";
    context.fillText('No level', 13, 56);
    playground = new Playground();

    attachButtonHandlers();
    attachToolbarHandlers();

    canvas.addEventListener('drop', handleDrop, false);
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        return false;
    }, false);
}

function attachButtonHandlers() {
    const loadButton = document.getElementById('load');
    loadButton.addEventListener('click', () => {
        onLoadPressed(loadButton);
        setStatus('x');
    });
    document.getElementById('import').addEventListener('click', () => onImportPressed());
}

function attachToolbarHandlers() {
    document.querySelectorAll('.controls-robot .control').forEach((control) => {
        control.addEventListener('dragstart', drag);
        control.addEventListener('dragend', dragEnd);
    });
    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');
    startButton.addEventListener('click', () => {
        startButton.classList.add('hidden');
        stopButton.classList.remove('hidden');
        playground.playSolution();
    });
    stopButton.addEventListener('click', () => {
        stopButton.classList.add('hidden');
        startButton.classList.remove('hidden');
        playground.stopSolution();
    });
}

function drag(event) {
    draggedArrow = event.target.id.replace('robot-', '');
}

function dragEnd(event) {
    draggedArrow = null;
}

function handleDrop(event) {
    if (!solving && playground.tiles.size > 0) {
        const targetTile = playground.tiles.valuesArray().find((tile) => tile.sprite.isIn(event.offsetX, event.offsetY));
        if (targetTile && targetTile.type === 'tile') {
            playground.addArrow(targetTile.row, targetTile.column, draggedArrow);
            const solvable = playground.arrows.size === solvableWith ? new PlaygroundSandbox().solveWithArrows(playground.arrows) : false;
            setStatus(solvable ? 'a' : 'b');
        }
    }
}

Playground.prototype.spriteClicked = function (tile) {
    if (!solving) {
        if (!(tile instanceof Tile)) {
            tile = this.tiles.valuesArray().find((t) => t.sprite.isIn(tile.x, tile.y));
            if (!tile) {
                console.warn('Could not find tile');
                return;
            }
        }
        playground.removeArrow(tile.row, tile.column);
        if (playground.arrows.size === 0) {
            setStatus('x');
        } else {
            const solvable = new PlaygroundSandbox().solveWithArrows(playground.arrows);
            setStatus(solvable ? 'a' : 'b');
        }
    }
}

Playground.prototype.playSolution = function () {
    if (!solving) {
        this.robotSnapshot = this.robot.toObject();
        solving = setInterval(() => this.robot.move(), 300);
    }
}

Playground.prototype.stopSolution = function () {
    if (solving) {
        clearInterval(solving);
        solving = null;
        this.robot.changeDirection(this.robotSnapshot.direction);
        this.robot.moveTo(this.robotSnapshot.row, this.robotSnapshot.column);
        this.activity.animate();
    }
}

Robot.prototype.move = function () {
    if (this.isOn(playground.finish)) {
        return true;
    }
    const currentTile = playground.tiles.get(this.coord);
    if (playground.arrows.has(currentTile.coord)) {
        this.changeDirection(playground.arrows.get(currentTile.coord).direction);
        let targetTile = playground.tiles.get(toCoord(this.nextCoord));
        while (!targetTile || targetTile.type === 'wall') {
            this.turnRight();
            targetTile = playground.tiles.get(toCoord(this.nextCoord));
        }
        this.moveTo(this.nextCoord.row, this.nextCoord.column);
    } else  {
        const next = this.nextCoord;
        const nextTile = playground.tiles.get(toCoord(next));
        if (!nextTile || nextTile.type === 'wall') {
            this.turnRight();
        } else {
            this.moveTo(next.row, next.column);
        }
    }
    playground.activity.animate();
}
