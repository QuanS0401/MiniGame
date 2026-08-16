// Game logic for Game3 (Sumplete)
// Cell state is a plain boolean: true = "Xóa" (excluded from sum), false = "Bình thường" (counts).
class Game {
    constructor(onGameEnd) {
        this.onGameEnd = onGameEnd;
        this.state = {
            currentLevelIndex: 0,
            puzzle: null,
            cellStates: [],
            score: 0,
            timeElapsed: 0,
            levelElapsed: 0,
            hintsUsedTotal: 0,
            hintsUsedThisLevel: 0,
            levelsCompleted: 0,
            isPlaying: false,
            levelComplete: false,
            hintInProgress: false
        };
        this.timerInterval = null;
        this.bindEvents();
    }

    bindEvents() {
        UI.els.btnHint && (UI.els.btnHint.onclick = () => this.useHint());
        UI.els.btnQuit && (UI.els.btnQuit.onclick = () => this.quitRequest());
        UI.els.btnCancelQuit && (UI.els.btnCancelQuit.onclick = () => this.cancelQuit());
        UI.els.btnConfirmQuit && (UI.els.btnConfirmQuit.onclick = () => this.confirmQuit());
    }

    startGame() {
        this.state.score = 0;
        this.state.timeElapsed = 0;
        this.state.hintsUsedTotal = 0;
        this.state.levelsCompleted = 0;
        this.state.isPlaying = true;
        this.state.currentLevelIndex = 0;
        this.startTimer();
        this.loadLevel();
    }

    startTimer() { clearInterval(this.timerInterval); this.timerInterval = setInterval(() => this.tick(), 1000); }
    stopTimer() { clearInterval(this.timerInterval); }

    // Only bookkeeping here — the par-time penalty is settled once, at level
    // completion, via handleWinLevel()'s Math.max(0, levelScore - secondsOver).
    tick() {
        if (!this.state.isPlaying) return;
        this.state.timeElapsed++;
        this.state.levelElapsed++;
        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.hintsUsedTotal);
    }

    loadLevel() {
        const levelDesign = LEVELS[this.state.currentLevelIndex];
        const prevGroup = this.state.currentLevelIndex > 0 ? LEVELS[this.state.currentLevelIndex - 1].group : null;
        const size = levelDesign.values.length;

        this.state.puzzle = { size, grid: levelDesign.values, solution: levelDesign.solution, rowTargets: levelDesign.rowTargets, colTargets: levelDesign.colTargets };
        this.state.cellStates = Array.from({ length: size }, () => new Array(size).fill(false));
        this.state.hintsUsedThisLevel = 0;
        this.state.levelComplete = false;
        this.state.levelElapsed = 0;
        this.state.hintInProgress = false;

        UI.clearFeedback();
        UI.setHintEnabled(true);

        UI.updateLevelInfo(levelDesign, this.state.currentLevelIndex + 1, LEVELS.length);
        UI.renderBoard(this.state.puzzle, this.state.cellStates, (r, c) => this.onCellClick(r, c));
        this.refreshSums();
        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.hintsUsedTotal);

        if (this.state.currentLevelIndex === 0 || prevGroup !== levelDesign.group) {
            UI.showLevelTransition(levelDesign.group);
        }
    }

    onCellClick(r, c) {
        if (this.state.levelComplete) return;
        const nextState = !this.state.cellStates[r][c];
        this.state.cellStates[r][c] = nextState;
        UI.updateCell(r, c, nextState);
        this.refreshSums();
        UI.clearFeedback();
        this.checkWin();
    }

    computeSums() {
        const { size, grid } = this.state.puzzle;
        const rowSums = new Array(size).fill(0);
        const colSums = new Array(size).fill(0);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (!this.state.cellStates[i][j]) {
                    rowSums[i] += grid[i][j];
                    colSums[j] += grid[i][j];
                }
            }
        }
        return { rowSums, colSums };
    }

    refreshSums() {
        const { rowSums, colSums } = this.computeSums();
        const { rowTargets, colTargets } = this.state.puzzle;
        UI.updateSumCorrectness(rowSums, colSums, rowTargets, colTargets);
    }

    // solution[r][c] convention: false = ô phải XÓA, true = giữ lại.
    // cellStates convention (unchanged): true = "Xóa", false = "Bình thường".
    // So the correct cellState is the negation of the raw solution value.
    correctStateOf(r, c) {
        return !this.state.puzzle.solution[r][c];
    }

    // Single unlimited hint: reveal one random currently-wrong cell.
    // No cap on repeated use — it just erodes this level's score via
    // computeLevelScore() at completion (see handleWinLevel). The cell
    // flashes red for 1s before the correct state is actually applied.
    useHint() {
        if (this.state.levelComplete || this.state.hintInProgress) return;

        const { size } = this.state.puzzle;
        const candidates = [];
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (this.state.cellStates[i][j] !== this.correctStateOf(i, j)) candidates.push({ r: i, c: j });
            }
        }
        if (candidates.length === 0) {
            // Already fully correct — checkWin() after the triggering change
            // should already have completed the level; nothing to do here.
            this.checkWin();
            return;
        }

        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const puzzleRef = this.state.puzzle;

        this.state.hintInProgress = true;
        UI.setHintEnabled(false);
        UI.startHintFlash(pick.r, pick.c);

        setTimeout(() => {
            // Bail out silently if the level changed while the cell was flashing
            // (e.g. the player solved it manually in the meantime) — loadLevel()
            // already reset hintInProgress/the hint button for the new level.
            if (this.state.puzzle !== puzzleRef) return;

            UI.stopHintFlash(pick.r, pick.c);

            const correct = this.correctStateOf(pick.r, pick.c);
            this.state.cellStates[pick.r][pick.c] = correct;
            UI.updateCell(pick.r, pick.c, correct);
            this.refreshSums();

            this.state.hintsUsedThisLevel++;
            this.state.hintsUsedTotal++;
            UI.updateStats(this.state.score, this.state.timeElapsed, this.state.hintsUsedTotal);
            UI.showFeedback(`💡 Gợi ý: Ô hàng ${pick.r + 1}, cột ${pick.c + 1} nên được đánh dấu "${correct ? 'Xóa' : 'Bình thường'}".`, 'warning');

            this.state.hintInProgress = false;
            UI.setHintEnabled(true);
            this.checkWin();
        }, 1000);
    }

    checkWin() {
        if (this.state.levelComplete) return;
        const { rowSums, colSums } = this.computeSums();
        const { rowTargets, colTargets, size } = this.state.puzzle;
        for (let i = 0; i < size; i++) if (rowSums[i] !== rowTargets[i]) return;
        for (let j = 0; j < size; j++) if (colSums[j] !== colTargets[j]) return;
        this.handleWinLevel();
    }

    handleWinLevel() {
        this.state.levelComplete = true;
        this.state.levelsCompleted++;

        const meta = LEVEL_META[LEVELS[this.state.currentLevelIndex].group];
        const levelScore = computeLevelScore(meta.baseScore, meta.hintLimit, this.state.hintsUsedThisLevel);
        const secondsOver = Math.max(0, this.state.levelElapsed - meta.parTime);
        this.state.score += Math.max(0, levelScore - secondsOver);

        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.hintsUsedTotal);
        UI.showFeedback('Chính xác! Bạn đã hoàn thành màn này.', 'success');
        setTimeout(() => this.goToNextLevel(), 500);
    }

    goToNextLevel() {
        if (this.state.currentLevelIndex === LEVELS.length - 1) this.endGame(true);
        else { this.state.currentLevelIndex++; this.loadLevel(); }
    }

    quitRequest() { UI.showQuitConfirm(); }
    cancelQuit() { UI.hideQuitConfirm(); }
    confirmQuit() { UI.hideQuitConfirm(); this.quitGame(); }

    quitGame() {
        this.state.isPlaying = false;
        this.stopTimer();
        if (this.onGameEnd) {
            this.onGameEnd({
                score: this.state.score,
                levelsCompleted: this.state.levelsCompleted,
                hintsUsed: this.state.hintsUsedTotal,
                isWin: false,
                abandoned: true
            });
        }
    }

    endGame(isWin) {
        this.state.isPlaying = false;
        this.stopTimer();
        if (this.onGameEnd) {
            this.onGameEnd({
                score: this.state.score,
                levelsCompleted: this.state.levelsCompleted,
                hintsUsed: this.state.hintsUsedTotal,
                timeElapsed: this.state.timeElapsed,
                isWin
            });
        }
    }
}
