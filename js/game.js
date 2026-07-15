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
            hint1UsedThisLevel: false,
            hint2UsedThisLevel: false,
            answerUsedThisLevel: false,
            questionTimeLeft: 0
        };
        this.timerInterval = null;
        this.questionTimerInterval = null;
        this.bindEvents(); // Bind các nút điều khiển 1 lần
    }

    bindEvents() {
        // Controls
        UI.els.btnDelete.onclick = () => this.deleteToken();
        UI.els.btnClear.onclick = () => this.clearTokens();
        UI.els.btnHint.onclick = () => this.useHint();
        UI.els.btnSubmit.onclick = () => this.checkAnswer();
        
        // Skip buttons
        if (UI.els.btnSkip) {
            UI.els.btnSkip.onclick = () => this.skipQuestion();
        }
        if (UI.els.btnCancelSkip) {
            UI.els.btnCancelSkip.onclick = () => this.cancelSkip();
        }
        if (UI.els.btnConfirmSkip) {
            UI.els.btnConfirmSkip.onclick = () => this.confirmSkip();
        }
        
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
        this.state.hint1UsedThisLevel = false;
        this.state.hint2UsedThisLevel = false;
        this.state.answerUsedThisLevel = false;
        
        UI.clearFeedback();
        UI.setHintState(true);
        UI.els.btnHint.textContent = 'Hint';
        UI.updateLevelInfo(levelData, this.state.currentLevelIndex + 1, LEVELS.length);
        
        // Reset timer cho câu hỏi mới
        this.resetQuestionTimer();
        
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
        
        this.state.tokens.push({ type: 'number', value: num, element: btn, elements: [btn] });
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
        if (last.type === 'number') {
            const buttonsToRelease = Array.isArray(last.elements) ? last.elements : (last.element ? [last.element] : []);
            buttonsToRelease.forEach(btn => {
                if (btn) btn.classList.remove('used');
            });
        }
        UI.renderExpression(this.state.tokens);
        UI.clearFeedback();
    }

    clearTokens() {
        while(this.state.tokens.length > 0) {
            this.deleteToken();
        }
    }

    // --- HINT 1: giữ nguyên nội dung gợi ý chữ như cũ ---
    useHint() {
        if (!this.state.hint1UsedThisLevel) {
            return this.useHint1();
        }

        if (!this.state.hint2UsedThisLevel) {
            return this.useHint2();
        }

        if (!this.state.answerUsedThisLevel) {
            return this.useAnswer();
        }

        return UI.showFeedback("Bạn đã dùng Đáp án trong câu này rồi.", "warning");
    }

    useHint1() {
        const level = LEVELS[this.state.currentLevelIndex];
        this.state.totalHintsUsed++;
        this.state.hint1UsedThisLevel = true;
        this.state.score = Math.max(0, this.state.score - 10);

        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
        UI.showFeedback(`💡 Gợi ý: ${level.hint}`, 'warning');

        UI.els.btnHint.textContent = 'Hint 2';
        UI.setHintState(true);
    }

    useHint2() {
        if (!this.state.hint1UsedThisLevel) {
            return UI.showFeedback("Bạn cần dùng Hint 1 trước rồi mới có thể mở Hint 2.", "warning");
        }

        if (this.state.hint2UsedThisLevel) {
            return UI.showFeedback("Bạn đã dùng Hint 2 ở câu này rồi.", "warning");
        }

        const level = LEVELS[this.state.currentLevelIndex];
        const hintStep = Array.isArray(level.hintStep) ? level.hintStep : [];
        if (hintStep.length === 0) {
            return UI.showFeedback("Không có bước gợi ý cho câu này.", "warning");
        }

        this.state.totalHintsUsed++;
        this.state.hint2UsedThisLevel = true;
        this.state.score = Math.max(0, this.state.score - 40);
        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);

        this.playHintTokenSequence(hintStep, () => {
            UI.els.btnHint.textContent = 'Đáp án';
            UI.setHintState(true);
            UI.flashExpressionBox();
            UI.showFeedback("💡 Bước đầu tiên của lời giải đã được gợi ý.", "warning");
        });
    }

    useAnswer() {
        if (!this.state.hint2UsedThisLevel) {
            return UI.showFeedback("Bạn cần dùng Hint 2 trước rồi mới có thể dùng Đáp án.", "warning");
        }

        if (this.state.answerUsedThisLevel) {
            return UI.showFeedback("Bạn đã dùng Đáp án ở câu này rồi.", "warning");
        }

        const level = LEVELS[this.state.currentLevelIndex];
        const fullSolution = Array.isArray(level.fullSolution) ? level.fullSolution : [];
        if (fullSolution.length === 0) {
            return UI.showFeedback("Không có đáp án mẫu cho câu này.", "warning");
        }

        this.state.totalHintsUsed++;
        this.state.answerUsedThisLevel = true;
        this.state.score = Math.max(0, this.state.score - 50);
        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);

        const remainingTokens = fullSolution.slice(this.state.tokens.length);
        if (remainingTokens.length === 0) {
            UI.flashExpressionBox();
            return UI.showFeedback("💡 Đáp án đã được điền đủ.", "success");
        }

        UI.setHintState(false);
        this.playHintTokenSequence(remainingTokens, () => {
            UI.flashExpressionBox();
            UI.showFeedback("💡 Đáp án đã được điền hoàn chỉnh.", "warning");
        });
    }

    playHintTokenSequence(stepTokens, onComplete) {
        const queue = [...stepTokens];
        const delay = 180;

        const processNextToken = () => {
            if (queue.length === 0) {
                if (onComplete) onComplete();
                return;
            }

            const token = queue.shift();
            const isOperator = ['+', '-', '*', '/', '(', ')'].includes(token);
            const tokenValue = String(token);

            let hintButtons = [];
            if (!isOperator) {
                hintButtons = this.reserveNumberButtonsForHint(tokenValue);
            }

            this.state.tokens.push({
                type: isOperator ? 'operator' : 'number',
                value: tokenValue,
                element: hintButtons[0] || null,
                elements: hintButtons
            });
            UI.renderExpression(this.state.tokens, true);

            setTimeout(() => {
                processNextToken();
            }, delay);
        };

        processNextToken();
    }

    reserveNumberButtonsForHint(value) {
        const numericValue = String(value);
        const buttons = Array.from(document.querySelectorAll('#numbersGrid .btn-number'));
        const availableButtons = buttons.filter(btn => !btn.classList.contains('used'));
        const matchedButton = availableButtons.find(btn => btn.textContent.trim() === numericValue);

        if (!matchedButton) {
            return [];
        }

        matchedButton.classList.add('used');
        return [matchedButton];
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
            this.state.score = Math.max(0, this.state.score - 20); // Sai trừ 20 điểm
            UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
            return UI.showFeedback("Biểu thức sai cú pháp hoặc tính toán không hợp lệ!", "error");
        }
        
        if (Math.abs(result - target) < 0.0001) { 
            if (this.state.answerUsedThisLevel) {
                this.state.correctAnswers++;
                UI.showFeedback(`Chính xác! Bạn đã tìm ra ${LEVELS[this.state.currentLevelIndex].target}.`, "success");
                setTimeout(() => {
                    this.goToNextLevel();
                }, 1000);
                return;
            }

            this.handleWinLevel();
        } else {
            this.state.score = Math.max(0, this.state.score - 20); // Sai trừ 20 điểm
            UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
            UI.showFeedback(`Sai rồi! Kết quả của bạn bằng ${result}.`, "error");
        }
    }

    handleWinLevel() {
        this.state.correctAnswers++;
        
        // Trả lời đúng cộng 100 điểm, không tính bonus hay multiplier
        this.state.score += 100;
        
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
        this.stopQuestionTimer();

        if (this.onGameEnd) {
            this.onGameEnd({
                playerName: this.state.playerName,
                score: this.state.score,
                time: this.state.timeElapsed,
                correctAnswers: this.state.correctAnswers,
                hintsUsed: this.state.totalHintsUsed,
                isWin: false,
                abandoned: true
            });
        }
    }

    endGame(isWin) {
        this.state.isPlaying = false;
        this.stopTimer();
        this.stopQuestionTimer();
        
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

    // --- CÁC HÀM QUẢN LÝ TIMER CÂU & SKIP ---

    /**
     * Bắt đầu timer cho câu hiện tại
     */
    startQuestionTimer() {
        this.stopQuestionTimer();
        this.questionTimerInterval = setInterval(() => {
            if (this.state.isPlaying) {
                this.updateQuestionTimer();
            }
        }, 1000);
    }

    /**
     * Dừng timer câu hiện tại
     */
    stopQuestionTimer() {
        if (this.questionTimerInterval) {
            clearInterval(this.questionTimerInterval);
            this.questionTimerInterval = null;
        }
    }

    /**
     * Reset lại timer câu dựa theo độ khó của màn chơi hiện tại
     */
    resetQuestionTimer() {
        const levelData = LEVELS[this.state.currentLevelIndex];
        const durations = { 'Easy': 10, 'Medium': 20, 'Hard': 30, 'Super Hard': 60 };
        this.state.questionTimeLeft = durations[levelData.group] || 10;
        this.updateQuestionDisplay();
        this.startQuestionTimer();
    }

    /**
     * Cập nhật thời gian câu mỗi giây
     */
    updateQuestionTimer() {
        if (this.state.questionTimeLeft > 0) {
            this.state.questionTimeLeft--;
        } else {
            this.applyOvertimePenalty();
        }
        this.updateQuestionDisplay();
    }

    /**
     * Phạt trừ 2 điểm mỗi giây khi hết thời gian câu
     */
    applyOvertimePenalty() {
        this.state.score = Math.max(0, this.state.score - 2);
        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
    }

    /**
     * Cập nhật hiển thị timer câu trên UI
     */
    updateQuestionDisplay() {
        UI.updateQuestionTimer(this.state.questionTimeLeft);
    }

    /**
     * Bỏ qua câu hỏi hiện tại (Skip) - Hiển thị Custom Modal xác nhận
     */
    skipQuestion() {
        UI.showSkipConfirm();
    }

    /**
     * Hủy bỏ cuộc
     */
    cancelSkip() {
        UI.hideSkipConfirm();
    }

    /**
     * Xác nhận bỏ cuộc
     */
    confirmSkip() {
        UI.hideSkipConfirm();
        this.quitGame();
    }

    /**
     * Điều hướng sang câu tiếp theo
     */
    goToNextQuestion() {
        if (this.state.currentLevelIndex === LEVELS.length - 1) {
            this.endGame(true);
        } else {
            this.state.currentLevelIndex++;
            this.loadLevel();
        }
    }
}
