window.addEventListener('load', main);

let draggedArrow = null;

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
}

function drag(event) {
    draggedArrow = event.target.id.replace('robot-', '');
}

function dragEnd(event) {
    draggedArrow = null;
}

function handleDrop(event) {
    if (playground.tiles.size > 0) {
        const targetTile = playground.tiles.valuesArray().find((tile) => tile.sprite.isIn(event.offsetX, event.offsetY));
        if (targetTile && targetTile.type === 'tile') {
            playground.addArrow(targetTile.row, targetTile.column, draggedArrow);
            setStatus('b');
        }
    }
}

Playground.prototype.spriteClicked = function (tile) {
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
    }
}
