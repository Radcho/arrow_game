window.addEventListener('load', main);

/**
 * Currently dragged arrow.
 */
let draggedArrow = null;

/**
 * Current solving in progress.
 */
let solving = null;

/**
 * Main function kickstarting the application.
 */
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
        // Necessary for drag and drop to work.
        e.preventDefault();
        return false;
    }, false);
}

/**
 * Attaches handlers to navbar buttons.
 */
function attachButtonHandlers() {
    const loadButton = document.getElementById('load');
    loadButton.addEventListener('click', () => {
        onLoadPressed(loadButton);
        setStatus('x');
    });
    document.getElementById('import').addEventListener('click', () => onImportPressed());
}

/**
 * Attaches handlers to toolbar buttons.
 */
function attachToolbarHandlers() {
    document.querySelectorAll('.controls-robot .control').forEach((control) => {
        control.addEventListener('dragstart', drag);
        control.addEventListener('dragend', dragEnd);
    });
    // Toggle between start and stop buttons.
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

/**
 * Handles arrows being dragged.
 * @param {DragEvent} event Drag event object.
 */
function drag(event) {
    draggedArrow = event.target.id.replace('robot-', '');
}

/**
 * Handles arrows being dropped without a target.
 * @param {DragEvent} event Drag event object.
 */
function dragEnd(event) {
    draggedArrow = null;
}

/**
 * Handles arrows being dropped onto the playground.
 * @param {DragEvent} event Drag event object.
 */
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
    // If the clicked object was a different sprite, find the tile it was on.
    if (!solving) {
        if (!(tile instanceof Tile)) {
            tile = this.tiles.valuesArray().find((t) => t.sprite.isIn(tile.x, tile.y));
            if (!tile) {
                console.warn('Could not find tile');
                return;
            }
        }
        // Remove an arrow from the position and set the status accordingly.
        playground.removeArrow(tile.row, tile.column);
        if (playground.arrows.size === 0) {
            setStatus('x');
        } else {
            const solvable = new PlaygroundSandbox().solveWithArrows(playground.arrows);
            setStatus(solvable ? 'a' : 'b');
        }
    }
}

/**
 * Start the solution replay.
 */
Playground.prototype.playSolution = function () {
    if (!solving) {
        // Save a snapshot for the robot's return.
        this.robotSnapshot = this.robot.toObject();
        solving = setInterval(() => this.robot.move(), 300);
    }
}

/**
 * Stop the solution replay
 */
Playground.prototype.stopSolution = function () {
    if (solving) {
        clearInterval(solving);
        solving = null;
        // After stopping the replay, return the robot to the base position.
        this.robot.changeDirection(this.robotSnapshot.direction);
        this.robot.moveTo(this.robotSnapshot.row, this.robotSnapshot.column);
        this.activity.animate();
    }
}

/**
 * Move the robot on the playground.
 */
Robot.prototype.move = function () {
    // If the robot is on the finish tile, stay there.
    if (this.isOn(playground.finish)) {
        return true;
    }
    const currentTile = playground.tiles.get(this.coord);
    // If the robot is standing on an arrow, move accordingly.
    if (playground.arrows.has(currentTile.coord)) {
        this.changeDirection(playground.arrows.get(currentTile.coord).direction);
        let targetTile = playground.tiles.get(toCoord(this.nextCoord));
        // When facing a wall, turn to the right until a tile is available.
        while (!targetTile || targetTile.type === 'wall') {
            this.turnRight();
            targetTile = playground.tiles.get(toCoord(this.nextCoord));
        }
        this.moveTo(this.nextCoord.row, this.nextCoord.column);
    } else  {
        const next = this.nextCoord;
        const nextTile = playground.tiles.get(toCoord(next));
        // Turn the robot to the right wqhen facing a wall.
        if (!nextTile || nextTile.type === 'wall') {
            this.turnRight();
        // Otherwise move forward.
        } else {
            this.moveTo(next.row, next.column);
        }
    }
    playground.activity.animate();
}
