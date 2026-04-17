class Game {
    constructor(onGameEnd) {
        this.onGameEnd = onGameEnd; // Callback khi kết thúc game
        this.state = {
            playerName: '',
            currentLevelIndex: 0,
            tokens: [],
            score: 0,
            timeElapsed: 0,
            totalHintsUsed: 0,
            correctAnswers: 0,
            isPlaying: false,
            hintUsedThisLevel: false
        };
        this.timerInterval = null;
        this.bindEvents(); // Bind các nút điều khiển 1 lần
    }

    bindEvents() {
        // Controls
        UI.els.btnDelete.onclick = () => this.deleteToken();
        UI.els.btnClear.onclick = () => this.clearTokens();
        UI.els.btnHint.onclick = () => this.useHint();
        UI.els.btnSubmit.onclick = () => this.checkAnswer();
        
        // Operators
        const ops = document.querySelectorAll('.btn-operator');
        ops.forEach(op => {
            op.onclick = () => this.addOperator(op.dataset.val);
        });
    }

    startGame(playerName) {
        this.state.playerName = playerName;
        this.state.score = 0;
        this.state.timeElapsed = 0;
        this.state.totalHintsUsed = 0;
        this.state.correctAnswers = 0;
        this.state.isPlaying = true;
        this.state.currentLevelIndex = 0; // Luôn bắt đầu từ 0 cho 1 session định danh mới
        
        this.startTimer();
        this.loadLevel();
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if(this.state.isPlaying) {
                this.state.timeElapsed++;
                UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
            }
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    loadLevel() {
        const levelData = LEVELS[this.state.currentLevelIndex];
        this.state.tokens = [];
        this.state.hintUsedThisLevel = false;
        
        UI.clearFeedback();
        UI.setHintState(true);
        UI.updateLevelInfo(levelData, this.state.currentLevelIndex + 1, LEVELS.length);
        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
        
        UI.renderNumbers(levelData.numbers, (btn, num, index) => this.addNumber(btn, num, index));
        UI.renderExpression(this.state.tokens);
        
        // Hiện banner nếu bắt đầu nhóm level mới
        if (this.state.currentLevelIndex === 0 || LEVELS[this.state.currentLevelIndex - 1].group !== levelData.group) {
            UI.showLevelTransition(levelData.group);
        }
    }

    addNumber(btn, num, index) {
        if (btn.classList.contains('used')) return;
        
        this.state.tokens.push({ type: 'number', value: num, element: btn });
        btn.classList.add('used');
        UI.renderExpression(this.state.tokens);
        UI.clearFeedback();
    }

    addOperator(val) {
        this.state.tokens.push({ type: 'operator', value: val });
        UI.renderExpression(this.state.tokens);
        UI.clearFeedback();
    }

    deleteToken() {
        if (this.state.tokens.length === 0) return;
        
        const last = this.state.tokens.pop();
        if (last.type === 'number' && last.element) {
            last.element.classList.remove('used');
        }
        UI.renderExpression(this.state.tokens);
        UI.clearFeedback();
    }

    clearTokens() {
        while(this.state.tokens.length > 0) {
            this.deleteToken();
        }
    }

    useHint() {
        if (this.state.hintUsedThisLevel) {
            return UI.showFeedback("Bạn đã dùng hint ở câu này rồi.", "warning");
        }
        
        const level = LEVELS[this.state.currentLevelIndex];
        this.state.totalHintsUsed++;
        this.state.hintUsedThisLevel = true;
        
        this.state.score = Math.max(0, this.state.score - 20); 
        
        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
        UI.showFeedback(`💡 Gợi ý: ${level.hint}`, 'warning');
        
        UI.setHintState(false);
    }

    checkAnswer() {
        const levelData = LEVELS[this.state.currentLevelIndex];
        const target = levelData.target;
        
        if (this.state.tokens.length === 0) {
            return UI.showFeedback("Vui lòng nhập biểu thức!", "warning");
        }
        
        const usedCount = this.state.tokens.filter(t => t.type === 'number').length;
        if (usedCount < levelData.numbers.length) {
            return UI.showFeedback("Bạn phải dùng hết tất cả 4 số!", "error");
        }
        
        const exprString = this.state.tokens.map(t => t.value).join("");
        const result = MathParser.evaluate(exprString);
        
        if (result === null) {
            this.state.score = Math.max(0, this.state.score - 10);
            UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
            return UI.showFeedback("Biểu thức sai cú pháp hoặc tính toán không hợp lệ!", "error");
        }
        
        if (Math.abs(result - target) < 0.0001) { 
            this.handleWinLevel();
        } else {
            this.state.score = Math.max(0, this.state.score - 10);
            UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
            UI.showFeedback(`Sai rồi! Kết quả của bạn bằng ${result}.`, "error");
        }
    }

    handleWinLevel() {
        this.state.correctAnswers++;
        
        const baseScore = 100;
        const multipliers = { 'Easy': 1, 'Medium': 1.5, 'Hard': 2, 'Super Hard': 3 };
        const mult = multipliers[LEVELS[this.state.currentLevelIndex].group];
        
        const hintBonus = this.state.hintUsedThisLevel ? 0 : 30;
        
        this.state.score += Math.floor(baseScore * mult) + hintBonus;
        
        UI.showFeedback(`Chính xác! Bạn đã tìm ra ${LEVELS[this.state.currentLevelIndex].target}.`, "success");
        
        setTimeout(() => {
            this.goToNextLevel();
        }, 1000);
    }

    goToNextLevel() {
        if (this.state.currentLevelIndex === LEVELS.length - 1) {
            this.endGame(true);
        } else {
            this.state.currentLevelIndex++;
            this.loadLevel();
        }
    }

    quitGame() {
        this.state.isPlaying = false;
        this.stopTimer();
    }

    endGame(isWin) {
        this.state.isPlaying = false;
        this.stopTimer();
        
        if (this.onGameEnd) {
            this.onGameEnd({
                playerName: this.state.playerName,
                score: this.state.score,
                time: this.state.timeElapsed,
                correctAnswers: this.state.correctAnswers,
                hintsUsed: this.state.totalHintsUsed,
                isWin: isWin
            });
        }
    }
}
