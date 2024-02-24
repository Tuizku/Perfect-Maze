// MAP VARIABLES
let Grid = null;
let Start = null;
let Goal = null;

// USER CHOICES
let mazeSize = 50;
let searchFrameWait = 0;


var canvas, ctx;
window.onload = function() {
    // Setup the canvas
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    // Setup the UI variables
    document.getElementById("maze_size").value = mazeSize;
    UpdateSearchSpeed();

    GenerateMaze();
}

// Draws the Grid
function Draw() {
    canvas.width = Grid.length;
    canvas.height = Grid.length;

    // Draw the grid
    for (let y = 0; y < Grid.length; y++) {
        for (let x = 0; x < Grid.length; x++) {
            // Choose pixel's color based on cell's info
            if (Grid[x][y] == "") ctx.fillStyle = "#FFFFFF";
            else if (Grid[x][y] == "W") ctx.fillStyle = "#000000";
            else if (Grid[x][y] == "P") ctx.fillStyle = "#32CD32";
            else if (Grid[x][y] == "G") ctx.fillStyle = "#EE4B2B";
            else if (Grid[x][y] == "S") ctx.fillStyle = "#FFAC1C";

            // Draw the cell
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

// Update maze size when user changes it. It also updates the search speed.
function UpdateMazeSize() {
    mazeSize = document.getElementById("maze_size").value;
    UpdateSearchSpeed();
}

// Changes search speed by user's choice, and it's dynamic to maze's size
function UpdateSearchSpeed() {
    let checkedValue = document.querySelector( 'input[name="search_speed"]:checked').value;
    
    // Instant = No sleeps or draws between search frames, Fast = 1ms sleep and drawing
    // Normal and Slow speeds are dynamic to maze size.
    if (checkedValue <= 1) searchFrameWait = checkedValue;
    else if (checkedValue == 2) searchFrameWait = 100 / (mazeSize * 0.1);
    else if (checkedValue == 3) searchFrameWait = 500 / (mazeSize * 0.1);
}



//#region Helping Functions
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

function Create2dArray(size, fill = "") {
    let result = [];
    for (let x = 0; x < size; x++) {
        result[x] = [];
        for (let y = 0; y < size; y++) {
            result[x][y] = fill;
        }
    }
    return result;
}

// This only works on removing basic variables. Removing dictionaries from a list does not work.
function RemoveFromList(list, element) {
    for (let i = 0; i < list.length; i++) {
        if (list[i] == element) list.splice(i, 1);
    }
}

// This also works only with basic variables
function IsInList(list, element) {
    for (let i = 0; i < list.length; i++) {
        if (list[i] == element) return true;
    }
    return false;
}

function Random(min, max) {
    return min + Math.round(Math.random() * max);
}

//#endregion Helping Functions

//#region Maze Generating


function GenerateMaze() {
    let mazeSize = document.getElementById("maze_size").value;
    let pathsAmount = 1000000; // This many times the code tries to create a new path to the maze
    let pathMaxLength = 300;

    Grid = Create2dArray(mazeSize, "W");

    let pathPoses = []; // Holds all positions that are path in the maze
    let endPoses = []; // Holds all path ending positions that there are. Used for start and goal

    // Values used in generating a path
    let pos = {x: Random(1, mazeSize - 2), y: Random(1, mazeSize - 2)};
    let dir = 3;

    // Create paths to the map
    for (let paths = pathsAmount; paths > 0; paths--) {

        // Find the starting pos of the new path. It basically tries max 500 times
        // to find a pos, that has a possible direction to create path to.
        for (let attempts = 500; attempts > 0; attempts--) {
            let randomPathPos = pathPoses[Random(0, pathPoses.length - 1)];

            // Breaks when the pos is found, or when there aren't pathPoses yet
            if (randomPathPos == null) break;
            if (GetPossibleDirs(randomPathPos).length > 0) {
                pos = {x: randomPathPos.x, y: randomPathPos.y};
                break;
            }
        }

        // Make sure that the starting position was valid
        if (GetPossibleDirs(pos).length == 0) break;

        // Create the single path. Moves to random possible dirs, until can't anymore or max length is reached
        for (let pathLeft = pathMaxLength; pathLeft > 0; pathLeft--) {
            
            // Get all the possible directions from position, and choose one of them randomly
            let possibleDirs = GetPossibleDirs(pos);
            dir = possibleDirs[Random(0, possibleDirs.length - 1)];

            // Break the path if it doesn't have any possible directions to move into
            if (dir == null) {
                endPoses.push({x: pos.x, y: pos.y});
                break;
            }

            pos = GetDirPos(pos, dir);
            pathPoses.push({x: pos.x, y: pos.y});
            SetCell(pos, "");
        }
    }

    // Find a start and a goal to the maze
    Start = endPoses[Random(0, endPoses.length - 1)];
    RemoveFromList(endPoses, Start);
    Goal = endPoses[Random(0, endPoses.length - 1)];
    SetCell(Start, "P");
    SetCell(Goal, "G");

    // Maze has finally been created, now just draw it :)
    Draw();
}


// Checks all possible directions of a position. And every direction checks for cells
// in a U style. More details in Powerpoint
function GetPossibleDirs(pos) {
    let possibleDirs = [];

    // Go through all the dirPoses
    for (let i = 1; i <= 4; i++) {
        let dirPos = GetDirPos(pos, i);

        // Checks these 5 cells in this dir, and if any are air, then dir is impossible
        // |      +   + |
        // |      - - - |
        // | j = -1 0 1 |
        let isPossibleDir = true;
        for (let j = -1; j <= 1; j++) { // Loops through 3 cells that are in a row
            // detPos is dirPos when j = 0
            let detPos = {x: dirPos.x, y: dirPos.y};

            // detPos is next to dirPos otherwise.
            if (j != 0) {
                detPos = GetDirPos(dirPos, ChangeDir(i, j));

                // This checks the "+" cells
                if (GetCell(GetDirPos(detPos, i)) != "W") isPossibleDir = false;
            }
            // This checks the "-" cells
            if (GetCell(detPos) != "W") isPossibleDir = false;
        }
        if (isPossibleDir) possibleDirs.push(i);
    }

    return possibleDirs;
}

function GetDirPos(pos, dir) {
    if (dir == 1) return {x: pos.x, y: pos.y - 1};
    else if (dir == 2) return {x: pos.x + 1, y: pos.y};
    else if (dir == 3) return {x: pos.x, y: pos.y + 1};
    else if (dir == 4) return {x: pos.x - 1, y: pos.y};
}

// Changes the sent direction, and it always needs to return a value between 1 and 4
function ChangeDir(dir, amount) {
    if (dir + amount > 0) return (dir + amount - 1) % 4 + 1;
    else return 4 - (Math.abs(dir + amount) % 4);
}

function SetCell(pos, type) {
    Grid[pos.x][pos.y] = type;
}

function GetCell(pos) {
    try {
        return Grid[pos.x][pos.y];
    }
    catch { return null };
}
//#endregion Maze Generating

//#region Search

// remember the public variables: Grid, Start, Goal
// Grid cells are either "", "W", "P", "G", "S" ("P" is kinda like the Player, but it means the Start)

async function BreadthFirstSearch() {
    // Remove search cells and make sure the start and goal is showing up
    ClearSearchCells();
    SetCell(Start, "P");
    SetCell(Goal, "G");

    // Declare the winningpath and paths list. Also adds the first path that starts
    let winningPath = null;
    let paths = [];
    paths.push([Start]);

    // Searches until a winningPath is found
    let searching = true;
    let frameCount = 0;
    let framesUntilDraw = 1 + Math.floor(mazeSize * 0.03);
    while (searching) {
        let newPaths = [];
        for (let pathID = 0; pathID < paths.length; pathID++) {
            // Get the path's basic values
            let path = paths[pathID];
            let pos = path[path.length - 1];
            let dirs = GetFreeDirs(pos);

            // Check if the path can't continue
            if (dirs.length == 0) {
                paths = paths.filter(item => item !== path);
                continue;
            }


            // Start new paths if the cell in the pos is a CROSSING
            for (let i = 1; i < dirs.length;) {
                // Copy the current path and declare the dir's pos
                let newPath = [...path];
                let newPos = GetDirPos(pos, dirs[i]);

                // Checks if the goal is reached
                if (GetCell(newPos) == "G") {
                    winningPath = newPath;
                    searching = false;
                    break;
                }

                // Set the cell and push the dir's pos to the newPath
                SetCell(newPos, "S");
                newPath.push(newPos);
                newPaths.push(newPath);
                
                // Remove the dir from the dirs, because it's new path is already been calculated
                RemoveFromList(dirs, dirs[i]); 
            }

            // Continue the og path
            let pathNextPos = GetDirPos(pos, dirs[0]);
            if (GetCell(pathNextPos) == "G") {
                winningPath = path;
                searching = false;
                break;
            }
            SetCell(pathNextPos, "S");
            path.push(pathNextPos);

        }
        // Add the frame's new paths to the paths list
        paths = paths.concat(newPaths);

        
        // Draws or not the frame. Depends on the speed input value
        if (searchFrameWait > 0) {
            if (frameCount % framesUntilDraw == 0) Draw();
            await sleep(searchFrameWait);
        }
        frameCount++;
    }

    // Shows the winningPath
    if (winningPath) {

        // Shows all the searched cells for 0.5s, and then clear the maze from search cells.
        Draw();
        await sleep(500);
        ClearSearchCells();

        // Draws the winningPath cell by cell
        for (let i = 0; i < winningPath.length; i++) {
            SetCell(winningPath[i], "S");
            SetCell(Start, "P");
            SetCell(Goal, "G");

            // Draws and sleeps if user has so selected. It uses dynamic sleep time (bigger maze -> smaller wait)
            if (searchFrameWait > 0) {
                if (i % framesUntilDraw == 0) Draw();
                await sleep(searchFrameWait);
            }
        }
        Draw(); // Final draw call -> so that the path will be drawn even when there wasn't a sleep
    }
    else console.log(`SEARCH FAILED`);
}


// Finds all possible directions to continue in a path
function GetFreeDirs(pos) {
    let result = [];

    // Checks all 4 directions
    for (let i = 1; i <= 4; i++) {
        let detPos = GetDirPos(pos, i);
        let cell = GetCell(detPos);
        if (cell != "W" && cell != "S" && cell != "P") result.push(i);
    }
    return result;
}

// Used after the search is complete, before it starts to show the winning path
function ClearSearchCells() {
    // Goes through every cell in the grid, and changes search ("S") cells into empty cells ("")
    for (let y = 0; y < Grid.length; y++) {
        for (let x = 0; x < Grid.length; x++) {
            if (Grid[x][y] == "S") Grid[x][y] = "";
        }
    }
}

//#endregion Search