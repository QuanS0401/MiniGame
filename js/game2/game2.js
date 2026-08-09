const levels = [
    {
        id: 'Easy 1',
        baseScore: 100,
        targetSteps: 7,
        map: [
            '   === ',
            ' ===E= ',
            ' =EBB=',
            '===PBE=',
            '=EBB===',
            '==BE=  ',
            ' =E==  ',
            ' ===   '
        ]
    },
    {
        id: 'Easy 2',
        baseScore: 100,
        targetSteps: 22,
        map: [
            '  ====',
            '=== P=',
            '=  BE=',
            '=  BE=',
            '=  BE=',
            '===  =',
            '  ===='
        ]
    },
    {
        id: 'Medium 1',
        baseScore: 200,
        targetSteps: 18,
        map: [
            ' ===== ',
            '==E E==',
            '=EBBBE=',
            '= BPB =',
            '=EBBBE=',
            '==E E==',
            ' ===== '
        ]
    },
    {
        id: 'Medium 2',
        baseScore: 200,
        targetSteps: 22,
        map: [
            '====  ',
            '=P ===',
            '=EB  =',
            '=BEB =',
            '= BE =',
            '=   E=',
            '======'
        ]
    },
    {
        id: 'Hard 1',
        baseScore: 300,
        targetSteps: 26,
        map: [
            ' =====',
            ' =   =',
            ' = = =',
            '==  E=',
            '=EBB =',
            '=PBE =',
            '======'
        ]
    },
    {
        id: 'Hard 2',
        baseScore: 300,
        targetSteps: 25,
        map: [
            '   ====',
            ' === P=',
            '==EBBE=',
            '=  B ==',
            '= = E= ',
            '= B E= ',
            '====== '
        ]
    }
];

const CELL_TYPES = {
    WALL: '=',
    FLOOR: ' ',
    PLAYER: 'P',
    BOX: 'B',
    TARGET: 'E',
    START: 'S'
};

const boardElement = document.getElementById('gameBoard');
const levelNameElement = document.getElementById('levelName');
const moveCountElement = document.getElementById('moveCount');
const restartButton = document.getElementById('restartButton');
const quitButton = document.getElementById('quitButton');
const quitConfirmOverlay = document.getElementById('quitConfirmOverlay');
const cancelQuitButton = document.getElementById('cancelQuitButton');
const rulesOverlay = document.getElementById('rulesOverlay');
const confirmRulesButton = document.getElementById('btnConfirmRules');
const levelBanner = document.getElementById('levelBanner');
const scoreBadge = document.getElementById('scoreBadge');
const targetStepsBadge = document.getElementById('targetStepsBadge');

let currentLevelIndex = 0;
let moveCount = 0;
let playerPosition = { x: 0, y: 0 };
let playerDirection = 'right';
let tiles = [];
let boxes = [];
let totalScore = 0;
let gameLocked = false;
let gameCompleted = false;
let totalMoves = 0;

// Answer helper variables
let answerModeActive = false;
let solutionStepIndex = 0;
let usedAnswerThisLevel = false;

// Movement cooldown (shared by keyboard and swipe input)
let lastMoveTime = 0;
const MOVE_COOLDOWN_MS = 100;

const DIRECTION_MAP = {
    'up': { dx: 0, dy: -1 },
    'down': { dx: 0, dy: 1 },
    'left': { dx: -1, dy: 0 },
    'right': { dx: 1, dy: 0 }
};

const levelSolutions = [
    // Level 0 (Easy 1)
    ['right', 'up', 'left', 'down', 'down', 'left', 'down'],
    // Level 1 (Easy 2)
    ['down', 'down', 'left', 'right', 'down', 'down', 'left', 'up', 'left', 'left', 'up', 'up', 'right', 'right', 'left', 'down', 'right', 'left', 'left', 'down', 'right', 'right'],
    // Level 2 (Medium 1)
    ['up', 'left', 'up', 'right', 'down', 'down', 'down', 'right', 'down', 'left', 'up', 'left', 'up', 'up', 'right', 'right', 'down', 'down'],
    // Level 3 (Medium 2)
    ['down', 'down', 'right', 'right', 'left', 'left', 'up', 'up', 'right', 'down', 'right', 'right', 'down', 'down', 'left', 'down', 'left', 'left', 'up', 'right', 'left', 'up'],
    // Level 4 (Hard 1)
    ['right', 'up', 'up', 'right', 'right', 'down', 'down', 'left', 'up', 'left', 'left', 'down', 'right', 'up', 'right', 'right', 'up', 'up', 'up', 'left', 'left', 'down', 'down', 'right', 'down', 'left'],
    // Level 5 (Hard 2)
    ['left', 'down', 'left', 'down', 'left', 'left', 'down', 'down', 'right', 'right', 'up', 'right', 'up', 'down', 'left', 'down', 'left', 'left', 'up', 'up', 'right', 'right', 'up', 'right', 'down']
];

function cloneMap(mapArray) {
    return mapArray.map(row => row.split(''));
}

function initializeLevel(mapArray) {
    tiles = [];
    boxes = [];
    playerPosition = { x: 0, y: 0 };
    playerDirection = 'right';

    mapArray.forEach((row, y) => {
        const tileRow = [];
        row.split('').forEach((char, x) => {
            if (char === CELL_TYPES.WALL) {
                tileRow.push(CELL_TYPES.WALL);
            } else if (char === CELL_TYPES.TARGET) {
                tileRow.push(CELL_TYPES.TARGET);
            } else {
                tileRow.push(CELL_TYPES.FLOOR);
            }

            if (char === CELL_TYPES.PLAYER || char === CELL_TYPES.START) {
                playerPosition = { x, y };
            }

            if (char === CELL_TYPES.BOX) {
                boxes.push({ x, y });
            }
        });
        tiles.push(tileRow);
    });
}

function tileTypeAt(x, y) {
    return tiles[y] && tiles[y][x];
}

function boxAt(x, y) {
    return boxes.some(box => box.x === x && box.y === y);
}

function renderBoard() {
    boardElement.innerHTML = '';
    const rows = tiles.length;
    const cols = tiles[0].length;

    boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    boardElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    let arrowCellX = -1;
    let arrowCellY = -1;
    let arrowDirection = '';

    if (answerModeActive) {
        const solution = levelSolutions[currentLevelIndex];
        if (solution && solutionStepIndex < solution.length) {
            const nextMove = solution[solutionStepIndex];
            const dir = DIRECTION_MAP[nextMove];
            if (dir) {
                arrowCellX = playerPosition.x + dir.dx;
                arrowCellY = playerPosition.y + dir.dy;
                arrowDirection = nextMove;
            }
        }
    }

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            const tile = tileTypeAt(x, y);
            const hasBox = boxAt(x, y);
            const isPlayer = playerPosition.x === x && playerPosition.y === y;

            let imageSrc = '../images/SPACE.png';

            if (tile === CELL_TYPES.WALL) {
                cell.classList.add('wall');
                imageSrc = '../images/WALL.png';
            } else if (hasBox && tile === CELL_TYPES.TARGET) {
                cell.classList.add('box-on-target');
                imageSrc = '../images/BOXfinished.png';
            } else if (hasBox) {
                cell.classList.add('box');
                imageSrc = '../images/BOXunfinished%20.png';
            } else if (isPlayer) {
                cell.classList.add('player');
                cell.dataset.direction = playerDirection;
                if (tile === CELL_TYPES.TARGET) {
                    cell.classList.add('target');
                    cell.classList.add('player-on-end');
                    imageSrc = '../images/PLAYER ON END.png';
                } else {
                    cell.classList.add('floor');
                    imageSrc = '../images/PLAYER.png';
                }
            } else if (tile === CELL_TYPES.TARGET) {
                cell.classList.add('target');
                imageSrc = '../images/END.png';
            } else {
                cell.classList.add('floor');
            }

            const image = document.createElement('img');
            image.className = 'cell-image';
            image.src = imageSrc;
            image.alt = 'tile';
            cell.appendChild(image);

            if (answerModeActive && x === arrowCellX && y === arrowCellY) {
                const arrowEl = document.createElement('div');
                arrowEl.className = 'hint-arrow';
                
                const arrowInner = document.createElement('span');
                arrowInner.textContent = '↑';
                arrowInner.style.display = 'inline-block';
                
                const rotation = {
                    'up': '0',
                    'right': '90',
                    'down': '180',
                    'left': '-90'
                }[arrowDirection] || '0';
                
                arrowInner.style.transform = `rotate(${rotation}deg)`;
                arrowEl.appendChild(arrowInner);
                cell.appendChild(arrowEl);
            }

            boardElement.appendChild(cell);
        }
    }
}

function getLevelDisplayName(index) {
    const groupIndex = Math.floor(index / 2);
    const groups = ['Easy', 'Medium', 'Hard'];
    return groups[groupIndex] || 'Hard';
}

function updateStatus() {
    levelNameElement.textContent = getLevelDisplayName(currentLevelIndex);
    moveCountElement.textContent = moveCount;
    scoreBadge.textContent = totalScore;
    targetStepsBadge.textContent = Math.max(0, levels[currentLevelIndex].targetSteps - moveCount);
}

function setControlsLocked(locked) {
    gameLocked = locked;
    const answerButton = document.getElementById('answerButton');
    if (answerButton) answerButton.disabled = locked;
    if (restartButton) restartButton.disabled = locked;
    if (quitButton) quitButton.disabled = locked;
}

function startLevel(index, options = {}) {
    answerModeActive = false;
    solutionStepIndex = 0;
    usedAnswerThisLevel = false;

    currentLevelIndex = index;
    moveCount = 0;
    initializeLevel(levels[index].map);
    updateStatus();
    renderBoard();
    if (quitConfirmOverlay) {
        quitConfirmOverlay.classList.remove('active');
    }
    setControlsLocked(false);
    gameCompleted = false;

    if (options.showBanner) {
        setControlsLocked(true);
        levelBanner.textContent = getLevelDisplayName(index);
        levelBanner.classList.remove('show');
        void levelBanner.offsetWidth;
        levelBanner.classList.add('show');
        setTimeout(() => setControlsLocked(false), 1800);
    }
}

function isCompleted() {
    return boxes.length > 0 && boxes.every(box => tileTypeAt(box.x, box.y) === CELL_TYPES.TARGET);
}

function canMove(dx, dy) {
    const nextX = playerPosition.x + dx;
    const nextY = playerPosition.y + dy;
    const nextTile = tileTypeAt(nextX, nextY);

    if (nextTile === CELL_TYPES.WALL || nextTile === undefined) return false;
    if (!boxAt(nextX, nextY)) return true;

    const afterX = nextX + dx;
    const afterY = nextY + dy;
    const afterTile = tileTypeAt(afterX, afterY);
    if (afterTile === CELL_TYPES.WALL || afterTile === undefined) return false;
    if (boxAt(afterX, afterY)) return false;
    return true;
}

function movePlayer(dx, dy) {
    if (gameCompleted || gameLocked) return;
    if (!canMove(dx, dy)) return;

    const nextX = playerPosition.x + dx;
    const nextY = playerPosition.y + dy;

    if (dx === 0 && dy === -1) {
        playerDirection = 'up';
    } else if (dx === 0 && dy === 1) {
        playerDirection = 'down';
    } else if (dx === -1) {
        playerDirection = 'left';
    } else if (dx === 1) {
        playerDirection = 'right';
    }

    if (boxAt(nextX, nextY)) {
        const afterX = nextX + dx;
        const afterY = nextY + dy;
        boxes = boxes.map(box => {
            if (box.x === nextX && box.y === nextY) {
                return { x: afterX, y: afterY };
            }
            return box;
        });
    }

    playerPosition = { x: nextX, y: nextY };
    moveCount += 1;
    updateStatus();

    if (answerModeActive) {
        const solution = levelSolutions[currentLevelIndex];
        const expectedMove = solution[solutionStepIndex];
        const expectedDir = DIRECTION_MAP[expectedMove];
        if (expectedDir && dx === expectedDir.dx && dy === expectedDir.dy) {
            solutionStepIndex++;
            if (solutionStepIndex >= solution.length) {
                answerModeActive = false;
            }
        } else {
            answerModeActive = false;
        }
    }

    renderBoard();

    if (isCompleted()) {
        showWinOverlay();
    }
}

// Shared entry point for keyboard AND swipe input: enforces the movement
// cooldown so rapid key-spam / repeated swipes can't move faster than
// MOVE_COOLDOWN_MS apart. Both input methods funnel into the same
// movePlayer() logic, so scoring/step-counting/rules are untouched.
function attemptMove(dx, dy) {
    const now = Date.now();
    if (now - lastMoveTime < MOVE_COOLDOWN_MS) return;
    lastMoveTime = now;
    movePlayer(dx, dy);
}

function calculateScore() {
    const currentLevel = levels[currentLevelIndex];
    const difference = currentLevel.targetSteps - moveCount;
    return Math.max(0, currentLevel.baseScore + (difference * 10));
}

function showLevelTransition(nextIndex) {
    const currentGroup = getLevelDisplayName(currentLevelIndex);
    const nextGroup = getLevelDisplayName(nextIndex);
    const shouldAnimate = currentLevelIndex < levels.length - 1 && currentGroup !== nextGroup;

    setControlsLocked(true);

    if (shouldAnimate) {
        levelBanner.textContent = nextGroup;
        levelBanner.classList.remove('show');
        void levelBanner.offsetWidth;
        levelBanner.classList.add('show');
        setTimeout(() => {
            startLevel(nextIndex);
        }, 1800);
    } else if (nextIndex < levels.length) {
        setTimeout(() => {
            startLevel(nextIndex);
        }, 500);
    }
}

function showEndGameModal() {
    const statMoves = document.getElementById('statMoves');
    const statScore = document.getElementById('statScore');
    const statHints = document.getElementById('statHints');
    const statLevels = document.getElementById('statLevels');
    const statsOverlay = document.getElementById('statsOverlay');
    const top3Alert = document.getElementById('top3Alert');

    if (statMoves) statMoves.textContent = totalMoves;
    if (statScore) statScore.textContent = totalScore;
    if (statHints) statHints.textContent = '0';
    if (statLevels) statLevels.textContent = `${levels.length}/${levels.length}`;

    if (top3Alert) {
        top3Alert.style.display = 'block';
    }
    if (statsOverlay) {
        statsOverlay.classList.add('active');
    }
}

function showWinOverlay() {
    const scoreEarned = usedAnswerThisLevel ? 0 : calculateScore();
    totalScore += scoreEarned;
    totalMoves += moveCount;
    updateStatus();

    if (currentLevelIndex < levels.length - 1) {
        showLevelTransition(currentLevelIndex + 1);
    } else {
        updateStatus();
        levelBanner.textContent = 'HOÀN THÀNH';
        levelBanner.classList.remove('show');
        void levelBanner.offsetWidth;
        levelBanner.classList.add('show');
        
        gameCompleted = true;
        setControlsLocked(true);

        setTimeout(() => {
            showEndGameModal();
        }, 1800);
    }
}

function handleInput(event) {
    const key = event.key;
    const direction = {
        'ArrowUp': { dx: 0, dy: -1 },
        'ArrowDown': { dx: 0, dy: 1 },
        'ArrowLeft': { dx: -1, dy: 0 },
        'ArrowRight': { dx: 1, dy: 0 },
        'w': { dx: 0, dy: -1 },
        'W': { dx: 0, dy: -1 },
        's': { dx: 0, dy: 1 },
        'S': { dx: 0, dy: 1 },
        'a': { dx: -1, dy: 0 },
        'A': { dx: -1, dy: 0 },
        'd': { dx: 1, dy: 0 },
        'D': { dx: 1, dy: 0 }
    }[key];

    if (gameCompleted || gameLocked) return;

    if (direction && !quitConfirmOverlay.classList.contains('active') && !rulesOverlay.classList.contains('active')) {
        event.preventDefault();
        attemptMove(direction.dx, direction.dy);
    }
}

function initGame2() {
    setControlsLocked(true);
    updateStatus();
    boardElement.innerHTML = '';
    window.addEventListener('keydown', handleInput);
    if (confirmRulesButton) {
        confirmRulesButton.addEventListener('click', () => {
            rulesOverlay.classList.remove('active');
            startLevel(0);
        });
    }

    const answerButton = document.getElementById('answerButton');
    if (answerButton) {
        answerButton.addEventListener('click', () => {
            if (gameLocked) return;

            startLevel(currentLevelIndex);
            answerModeActive = true;
            solutionStepIndex = 0;
            usedAnswerThisLevel = true;
            renderBoard();
        });
    }

    restartButton.addEventListener('click', () => {
        if (gameLocked) return;
        startLevel(currentLevelIndex);
    });

    quitButton.addEventListener('click', () => {
        if (gameLocked) return;
        if (quitConfirmOverlay) {
            quitConfirmOverlay.classList.add('active');
        }
    });

    cancelQuitButton.addEventListener('click', () => {
        if (quitConfirmOverlay) {
            quitConfirmOverlay.classList.remove('active');
        }
    });

    // Swipe-to-move (touch only). Reuses attemptMove/movePlayer — same
    // Sokoban movement + cooldown logic as WASD/arrow keys. Only swipes
    // starting inside the game board count, and only horizontal/vertical
    // page scrolling triggered by those swipes is suppressed.
    const SWIPE_THRESHOLD_PX = 30;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchTracking = false;

    boardElement.addEventListener('touchstart', (event) => {
        if (gameCompleted || gameLocked) return;
        if (quitConfirmOverlay.classList.contains('active') || rulesOverlay.classList.contains('active')) return;
        if (event.touches.length !== 1) return;
        touchTracking = true;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }, { passive: true });

    boardElement.addEventListener('touchmove', (event) => {
        if (!touchTracking) return;
        // Prevent the page from scrolling while swiping on the board.
        event.preventDefault();
    }, { passive: false });

    boardElement.addEventListener('touchend', (event) => {
        if (!touchTracking) return;
        touchTracking = false;
        if (gameCompleted || gameLocked) return;
        if (quitConfirmOverlay.classList.contains('active') || rulesOverlay.classList.contains('active')) return;

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX && Math.abs(deltaY) < SWIPE_THRESHOLD_PX) return;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            attemptMove(deltaX > 0 ? 1 : -1, 0);
        } else {
            attemptMove(0, deltaY > 0 ? 1 : -1);
        }
    });

    boardElement.addEventListener('touchcancel', () => {
        touchTracking = false;
    });
}

initGame2();
