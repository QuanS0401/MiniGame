/* UI Manager for Game3 (Sumplete) */
const UI = {
    els: {},
    init() {
        this.els = {
            gameBoard: document.getElementById('gameBoard'),
            levelName: document.getElementById('levelName'),
            levelBadge: document.getElementById('levelBadge'),
            feedbackMsg: document.getElementById('feedbackMsg'),
            scoreValue: document.getElementById('scoreValue'),
            timerValue: document.getElementById('timerValue'),
            hintValue: document.getElementById('hintValue'),
            // Overlays
            rulesOverlay: document.getElementById('rulesOverlay'),
            quitConfirmOverlay: document.getElementById('quitConfirmOverlay'),
            statsOverlay: document.getElementById('statsOverlay'),
            statsTitle: document.getElementById('statsTitle'),
            statsMessage: document.getElementById('statsMessage'),
            top3Alert: document.getElementById('top3Alert'),
            levelBanner: document.getElementById('levelBanner'),
            // Buttons
            btnConfirmRules: document.getElementById('btnConfirmRules'),
            btnHint: document.getElementById('btnHint'),
            btnQuit: document.getElementById('btnQuit'),
            btnCancelQuit: document.getElementById('btnCancelQuit'),
            btnConfirmQuit: document.getElementById('btnConfirmQuit')
        };
    },

    renderBoard(puzzle, cellStates, onCellClick) {
        const board = this.els.gameBoard;
        if (!board) return;
        board.innerHTML = '';
        const size = puzzle.size;
        board.dataset.size = size;
        board.style.gridTemplateColumns = `repeat(${size}, 1fr) 0.85fr`;
        board.style.gridTemplateRows = `repeat(${size}, 1fr) 0.85fr`;

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cell = document.createElement('div');
                cell.className = 'sumplete-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.style.gridRow = i + 1;
                cell.style.gridColumn = j + 1;
                const valueSpan = document.createElement('span');
                valueSpan.className = 'cell-value';
                valueSpan.textContent = puzzle.grid[i][j];
                cell.appendChild(valueSpan);
                this.applyCellStateClass(cell, cellStates[i][j]);
                cell.addEventListener('click', () => onCellClick(i, j));
                board.appendChild(cell);
            }
        }

        for (let i = 0; i < size; i++) {
            const label = document.createElement('div');
            label.className = 'sum-label row-sum';
            label.id = `rowSum-${i}`;
            label.style.gridRow = i + 1;
            label.style.gridColumn = size + 1;
            label.textContent = puzzle.rowTargets[i];
            board.appendChild(label);
        }

        for (let j = 0; j < size; j++) {
            const label = document.createElement('div');
            label.className = 'sum-label col-sum';
            label.id = `colSum-${j}`;
            label.style.gridRow = size + 1;
            label.style.gridColumn = j + 1;
            label.textContent = puzzle.colTargets[j];
            board.appendChild(label);
        }

        const corner = document.createElement('div');
        corner.className = 'corner-cell';
        corner.style.gridRow = size + 1;
        corner.style.gridColumn = size + 1;
        board.appendChild(corner);
    },

    applyCellStateClass(cell, isDeleted) {
        cell.classList.toggle('state-removed', !!isDeleted);
    },

    updateCell(r, c, isDeleted) {
        if (!this.els.gameBoard) return;
        const cell = this.els.gameBoard.querySelector(`.sumplete-cell[data-row="${r}"][data-col="${c}"]`);
        if (cell) this.applyCellStateClass(cell, isDeleted);
    },

    getCell(r, c) {
        if (!this.els.gameBoard) return null;
        return this.els.gameBoard.querySelector(`.sumplete-cell[data-row="${r}"][data-col="${c}"]`);
    },

    startHintFlash(r, c) {
        const cell = this.getCell(r, c);
        if (!cell) return;
        cell.classList.remove('hint-flash');
        void cell.offsetWidth;
        cell.classList.add('hint-flash');
    },

    stopHintFlash(r, c) {
        const cell = this.getCell(r, c);
        if (cell) cell.classList.remove('hint-flash');
    },

    setHintEnabled(enabled) { if (this.els.btnHint) this.els.btnHint.disabled = !enabled; },

    // Labels always show the static target; this only toggles the "correct" glow,
    // never the text, so the live running sum stays hidden from the player.
    updateSumCorrectness(rowSums, colSums, rowTargets, colTargets) {
        rowSums.forEach((sum, i) => {
            const label = document.getElementById(`rowSum-${i}`);
            if (label) label.classList.toggle('correct', sum === rowTargets[i]);
        });
        colSums.forEach((sum, j) => {
            const label = document.getElementById(`colSum-${j}`);
            if (label) label.classList.toggle('correct', sum === colTargets[j]);
        });
    },

    showFeedback(msg, type) {
        if (!this.els.feedbackMsg) return;
        this.els.feedbackMsg.textContent = msg;
        this.els.feedbackMsg.className = `feedback-msg ${type || ''}`;
    },

    clearFeedback() {
        if (!this.els.feedbackMsg) return;
        this.els.feedbackMsg.textContent = '';
        this.els.feedbackMsg.className = 'feedback-msg';
    },

    updateLevelInfo(levelDesign, currentLevel, totalLevels) {
        if (this.els.levelName) this.els.levelName.textContent = `${levelDesign.group} - Màn ${currentLevel}`;
        if (this.els.levelBadge) {
            this.els.levelBadge.textContent = `LEVEL: ${levelDesign.group.toUpperCase()}`;
            this.els.levelBadge.className = `level-badge badge-${levelDesign.group.toLowerCase().replace(' ', '')}`;
        }
    },

    updateStats(score, timeElapsed, hintsUsed) {
        if (this.els.scoreValue) this.els.scoreValue.textContent = score;
        if (this.els.timerValue) this.els.timerValue.textContent = this.formatTime(timeElapsed);
        if (this.els.hintValue) this.els.hintValue.textContent = hintsUsed;
    },

    formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },

    showLevelTransition(levelGroup) {
        if (!this.els.levelBanner) return;
        this.els.levelBanner.textContent = `LEVEL: ${levelGroup.toUpperCase()}`;
        this.els.levelBanner.classList.remove('show');
        void this.els.levelBanner.offsetWidth;
        this.els.levelBanner.classList.add('show');
    },

    showRulesOverlay() { if (this.els.rulesOverlay) this.els.rulesOverlay.classList.add('active'); },
    hideRulesOverlay() { if (this.els.rulesOverlay) this.els.rulesOverlay.classList.remove('active'); },
    showQuitConfirm() { if (this.els.quitConfirmOverlay) this.els.quitConfirmOverlay.classList.add('active'); },
    hideQuitConfirm() { if (this.els.quitConfirmOverlay) this.els.quitConfirmOverlay.classList.remove('active'); },

    showStats(title, levelsCompleted, totalLevels, score, timeElapsed, hintsUsed) {
        if (this.els.statsTitle) this.els.statsTitle.innerHTML = title;
        if (this.els.statsMessage) this.els.statsMessage.innerHTML = 'Bạn đã hoàn thành toàn bộ thử thách Sumplete!';
        const statTime = document.getElementById('statTime');
        const statHints = document.getElementById('statHints');
        if (statTime) statTime.textContent = this.formatTime(timeElapsed);
        if (statHints) statHints.textContent = hintsUsed;
        const statLevels = document.getElementById('statLevels');
        const statScore = document.getElementById('statScore');
        if (statLevels) statLevels.textContent = `${levelsCompleted}/${totalLevels}`;
        if (statScore) statScore.textContent = score;
        if (this.els.top3Alert) this.els.top3Alert.style.display = levelsCompleted === totalLevels ? 'block' : 'none';
        if (this.els.statsOverlay) this.els.statsOverlay.classList.add('active');
    }
};
