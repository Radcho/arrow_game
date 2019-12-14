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
    document.getElementById('load').addEventListener('click', onLoadPressed);
    document.getElementById('import').addEventListener('click', onImportPressed);
}

function attachToolbarHandlers() {

}


Playground.prototype.spriteClicked = function (tile) {
    // play override
}
