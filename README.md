# Arrow Game

Project for the class *Webove Programovanie*.

## Installation

Make sure the latest version of Node.js is installed.
Run the following commands:
```bash
npm install     # Installs dependencies
npm run build   # Builds the application
npm run start   # Starts the server
```

## Controls

### Editor

The top navbar contains buttons for saving, loading and creating new levels. Each level has to be smaller or equal to 15x15 squares.

In the middle of the screen is the playground. The playground is a grid containing tiles for the robot movement.

Next to the playground is a toolbar with a selection of tools:
- **Wall tool** - This tool changes tiles to walls and vice versa.
- **Finish tool** - This tool places the finish tile on the playground.
- **Robot tool** - This tool places the robot down into the playground.
- **Directional arrows** - This tool changes the direction the robot is facing. To change the direction of an already placed robot, choose a direction, select the robot tool and press a tile in the playgorund.

After creating a level, the level can be tested using the **Solve** button on the navbar. Keep in mind that the solving algorithm is unoptimized and will not handle large and open levels very well.

Only solvable levels can be saved onto the server. If saving an incomplete level is needed, the Export button will export a json file importable at a later date.

The lower left corner contains a footer that displays if the current level is solved.

## Player

The top navbar contains buttons needed to load the level.

In the middle of the screen is the playground. The playground is a grid containing the level to solve.

Next to the playground is a toolbar with directional arrows and a play button:
- **Directional arrows** - Drag these onto the playground to place arrows. These arrows will dictate how the robot moves through the level.
- **Play button** - After pressing play, the robot will move throught the level the only way it can. When stepping on an arrow, it will move in its direction. When facing a wall, it will turn to the right.

The lower left corner contains a footer that displays the number of arrows needed for the solution and the current status.

The status has three possible values:
- **x** - The level is in its initial state.
- **a** - The level is solved correctly.
- **b** - The level is not solved or it's solved with the incorrect amount of arrows.

## Supported browsers

Use the latest Google Chrome and Firefox versions.

Specific versions are not currently available.

Latest tested versions are:
- Google Chrome 78
- Mozzila Firefox 71

## Changelog

### 1.0.0
- Initial release
