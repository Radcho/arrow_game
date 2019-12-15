window.addEventListener('load', main);

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

function attachButtonHandlers() {
    const loadButton = document.getElementById('load');
    loadButton.addEventListener('click', () => onLoadPressed(loadButton));
    document.getElementById('import').addEventListener('click', () => onImportPressed());
}

function attachToolbarHandlers() {

}


Playground.prototype.spriteClicked = function (tile) {
    // play override
}
