// Game logic copied from original js/game.js (kept intact)
class Game {
    constructor(onGameEnd) {
        this.onGameEnd = onGameEnd;
        this.state = {
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
            answerDeductedThisLevel: false,
            isSubmitting: false,
            questionTimeLeft: 0
        };
        this.timerInterval = null;
        this.questionTimerInterval = null;
        this.bindEvents();
    }

    bindEvents() {
        UI.els.btnDelete && (UI.els.btnDelete.onclick = () => this.deleteToken());
        UI.els.btnClear && (UI.els.btnClear.onclick = () => this.clearTokens());
        UI.els.btnHint && (UI.els.btnHint.onclick = () => this.useHint());
        UI.els.btnSubmit && (UI.els.btnSubmit.onclick = () => this.checkAnswer());
        if (UI.els.btnSkip) UI.els.btnSkip.onclick = () => this.skipQuestion();
        if (UI.els.btnCancelSkip) UI.els.btnCancelSkip.onclick = () => this.cancelSkip();
        if (UI.els.btnConfirmSkip) UI.els.btnConfirmSkip.onclick = () => this.confirmSkip();
        const ops = document.querySelectorAll('.btn-operator');
        ops.forEach(op => op.onclick = () => this.addOperator(op.dataset.val));
    }

    startGame() {
        this.state.score = 0;
        this.state.timeElapsed = 0;
        this.state.totalHintsUsed = 0;
        this.state.correctAnswers = 0;
        this.state.isPlaying = true;
        this.state.currentLevelIndex = 0;
        this.state.isSubmitting = false;
        this.startTimer();
        this.loadLevel();
    }

    startTimer() { clearInterval(this.timerInterval); this.timerInterval = setInterval(() => { if (this.state.isPlaying) { this.state.timeElapsed++; UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed); } }, 1000); }
    stopTimer() { clearInterval(this.timerInterval); }

    loadLevel() {
        const levelData = LEVELS[this.state.currentLevelIndex];
        this.state.tokens = [];
        this.state.hint1UsedThisLevel = false;
        this.state.hint2UsedThisLevel = false;
        this.state.answerUsedThisLevel = false;
        this.state.answerDeductedThisLevel = false;
        this.state.isSubmitting = false;
        UI.clearFeedback && UI.clearFeedback();
        UI.setHintState(true);
        if (UI.els.btnSubmit) UI.els.btnSubmit.disabled = false;
        UI.els.btnHint && (UI.els.btnHint.textContent = 'Gợi ý 1');
        UI.updateLevelInfo && UI.updateLevelInfo(levelData, this.state.currentLevelIndex + 1, LEVELS.length);
        this.resetQuestionTimer();
        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
        UI.renderNumbers(levelData.numbers, (btn, num, index) => this.addNumber(btn, num, index));
        UI.renderExpression(this.state.tokens);
        if (this.state.currentLevelIndex === 0 || LEVELS[this.state.currentLevelIndex - 1].group !== levelData.group) {
            UI.showLevelTransition(levelData.group);
        }
    }

    addNumber(btn, num, index) {
        if (btn.classList.contains('used')) return;
        this.state.tokens.push({ type: 'number', value: num, element: btn, elements: [btn] });
        btn.classList.add('used');
        UI.renderExpression(this.state.tokens);
        UI.clearFeedback && UI.clearFeedback();
    }

    addOperator(val) { this.state.tokens.push({ type: 'operator', value: val }); UI.renderExpression(this.state.tokens); UI.clearFeedback && UI.clearFeedback(); }

    deleteToken() { if (this.state.tokens.length === 0) return; const last = this.state.tokens.pop(); if (last.type === 'number') { const buttonsToRelease = Array.isArray(last.elements) ? last.elements : (last.element ? [last.element] : []); buttonsToRelease.forEach(btn => { if (btn) btn.classList.remove('used'); }); } UI.renderExpression(this.state.tokens); UI.clearFeedback && UI.clearFeedback(); }

    clearTokens() { while (this.state.tokens.length > 0) this.deleteToken(); }

    resetExpressionState() { const tokensToRelease = [...this.state.tokens]; this.state.tokens = []; tokensToRelease.forEach(token => { if (token.type === 'number' && Array.isArray(token.elements)) token.elements.forEach(btn => { if (btn) btn.classList.remove('used'); }); }); UI.renderExpression(this.state.tokens); UI.clearFeedback && UI.clearFeedback(); }

    expressionMatchesTokenSequence(tokensToCompare) { if (!Array.isArray(tokensToCompare) || !Array.isArray(this.state.tokens)) return false; if (this.state.tokens.length !== tokensToCompare.length) return false; return this.state.tokens.every((token, index) => String(token.value) === String(tokensToCompare[index])); }

    useHint() { if (!this.state.hint1UsedThisLevel) return this.useHint1(); if (!this.state.hint2UsedThisLevel) return this.useHint2(); return this.useAnswer(); }

    useHint1() { const level = LEVELS[this.state.currentLevelIndex]; this.state.totalHintsUsed++; this.state.hint1UsedThisLevel = true; this.state.score = Math.max(0, this.state.score - 10); UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed); UI.showFeedback && UI.showFeedback(`💡 Gợi ý: ${level.hint}`, 'warning'); UI.els.btnHint && (UI.els.btnHint.textContent = 'Gợi ý 2'); UI.setHintState(true); }

    useHint2() { if (!this.state.hint1UsedThisLevel) return UI.showFeedback && UI.showFeedback("Bạn cần dùng Gợi ý 1 trước rồi mới có thể mở Gợi ý 2.", "warning"); if (this.state.hint2UsedThisLevel) return UI.showFeedback && UI.showFeedback("Bạn đã dùng Gợi ý 2 ở câu này rồi.", "warning"); const level = LEVELS[this.state.currentLevelIndex]; const hintStep = Array.isArray(level.hintStep) ? level.hintStep : []; if (hintStep.length === 0) return UI.showFeedback && UI.showFeedback("Không có bước gợi ý cho câu này.", "warning"); this.state.totalHintsUsed++; this.state.hint2UsedThisLevel = true; this.state.score = Math.max(0, this.state.score - 40); UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed); this.resetExpressionState(); UI.setHintState(false); this.playHintTokenSequence(hintStep, () => { UI.els.btnHint && (UI.els.btnHint.textContent = 'Đáp án'); UI.setHintState(true); UI.flashExpressionBox(); UI.showFeedback && UI.showFeedback("💡 Bước đầu tiên của lời giải đã được gợi ý.", "warning"); }); }

    useAnswer() {
        if (!this.state.hint2UsedThisLevel) return UI.showFeedback && UI.showFeedback("Bạn cần dùng Gợi ý 2 trước rồi mới có thể dùng Đáp án.", "warning");
        const level = LEVELS[this.state.currentLevelIndex];
        const fullSolution = Array.isArray(level.fullSolution) ? level.fullSolution : [];
        const hintStep = Array.isArray(level.hintStep) ? level.hintStep : [];
        if (fullSolution.length === 0) return UI.showFeedback && UI.showFeedback("Không có đáp án mẫu cho câu này.", "warning");

        if (!this.state.answerUsedThisLevel) {
            this.state.totalHintsUsed++;
            this.state.answerUsedThisLevel = true;
            this.state.score = Math.max(0, this.state.score - 50);
            UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
        }

        const currentMatchHint2 = this.expressionMatchesTokenSequence(hintStep);
        const completeAnswer = () => {
            UI.flashExpressionBox();
            UI.showFeedback && UI.showFeedback("💡 Đáp án đã được điền hoàn chỉnh.", "warning");
            UI.els.btnHint && (UI.els.btnHint.textContent = 'Đáp án');
            UI.setHintState(true);
        };

        if (!currentMatchHint2) {
            this.resetExpressionState();
            UI.setHintState(false);
            this.playHintTokenSequence(fullSolution, completeAnswer);
            return;
        }

        const remainingTokens = fullSolution.slice(this.state.tokens.length);
        if (remainingTokens.length === 0) {
            UI.setHintState(true);
            UI.flashExpressionBox();
            return UI.showFeedback && UI.showFeedback("💡 Đáp án đã được điền đủ.", "success");
        }

        UI.setHintState(false);
        this.playHintTokenSequence(remainingTokens, completeAnswer);
    }

    playHintTokenSequence(stepTokens, onComplete) { const queue = [...stepTokens]; const delay = 180; const processNextToken = () => { if (queue.length === 0) { if (onComplete) onComplete(); return; } const token = queue.shift(); const isOperator = ['+','-','*','/','(',')'].includes(token); const tokenValue = String(token); let hintButtons = []; if (!isOperator) { hintButtons = this.reserveNumberButtonsForHint(tokenValue); } this.state.tokens.push({ type: isOperator ? 'operator' : 'number', value: tokenValue, element: hintButtons[0] || null, elements: hintButtons }); UI.renderExpression(this.state.tokens, true); setTimeout(() => { processNextToken(); }, delay); }; processNextToken(); }

    reserveNumberButtonsForHint(value) { const numericValue = String(value); const buttons = Array.from(document.querySelectorAll('#numbersGrid .btn-number')); const availableButtons = buttons.filter(btn => !btn.classList.contains('used')); const matchedButton = availableButtons.find(btn => btn.textContent.trim() === numericValue); if (!matchedButton) return []; matchedButton.classList.add('used'); return [matchedButton]; }

    checkAnswer() {
        if (this.state.isSubmitting) return;

        const levelData = LEVELS[this.state.currentLevelIndex];
        const target = levelData.target;
        if (this.state.tokens.length === 0) return UI.showFeedback && UI.showFeedback("Vui lòng nhập biểu thức!", "warning");
        const usedCount = this.state.tokens.filter(t => t.type === 'number').length;
        if (usedCount < levelData.numbers.length) return UI.showFeedback && UI.showFeedback("Bạn phải dùng hết tất cả 4 số!", "error");

        const exprString = this.state.tokens.map(t => t.value).join("");
        const result = MathParser.evaluate(exprString);
        if (result === null) {
            this.state.score = Math.max(0, this.state.score - 20);
            UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
            return UI.showFeedback && UI.showFeedback("Biểu thức sai cú pháp hoặc tính toán không hợp lệ!", "error");
        }

        if (Math.abs(result - target) < 0.0001) {
            if (this.state.isSubmitting) return;
            this.state.isSubmitting = true;
            if (UI.els.btnSubmit) UI.els.btnSubmit.disabled = true;
            if (this.state.answerUsedThisLevel) {
                this.state.correctAnswers++;
                UI.showFeedback && UI.showFeedback(`Chính xác! Bạn đã tìm ra ${LEVELS[this.state.currentLevelIndex].target}.`, "success");
                setTimeout(() => this.goToNextLevel(), 1000);
                return;
            }
            this.handleWinLevel();
        } else {
            this.state.score = Math.max(0, this.state.score - 20);
            UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed);
            UI.showFeedback && UI.showFeedback(`Sai rồi! Kết quả của bạn bằng ${result}.`, "error");
        }
    }

    handleWinLevel() { this.state.correctAnswers++; this.state.score += 100; UI.showFeedback && UI.showFeedback(`Chính xác! Bạn đã tìm ra ${LEVELS[this.state.currentLevelIndex].target}.`, "success"); setTimeout(() => this.goToNextLevel(), 1000); }

    goToNextLevel() { if (this.state.currentLevelIndex === LEVELS.length - 1) this.endGame(true); else { this.state.currentLevelIndex++; this.loadLevel(); } }

    quitGame() { this.state.isPlaying = false; this.stopTimer(); this.stopQuestionTimer(); if (this.onGameEnd) { this.onGameEnd({ score: this.state.score, time: this.state.timeElapsed, correctAnswers: this.state.correctAnswers, hintsUsed: this.state.totalHintsUsed, isWin: false, abandoned: true }); } }

    endGame(isWin) { this.state.isPlaying = false; this.stopTimer(); this.stopQuestionTimer(); if (this.onGameEnd) { this.onGameEnd({ score: this.state.score, time: this.state.timeElapsed, correctAnswers: this.state.correctAnswers, hintsUsed: this.state.totalHintsUsed, isWin: isWin }); } }

    startQuestionTimer() { this.stopQuestionTimer(); this.questionTimerInterval = setInterval(() => { if (this.state.isPlaying) this.updateQuestionTimer(); }, 1000); }
    stopQuestionTimer() { if (this.questionTimerInterval) { clearInterval(this.questionTimerInterval); this.questionTimerInterval = null; } }
    resetQuestionTimer() { const levelData = LEVELS[this.state.currentLevelIndex]; const durations = { 'Easy': 10, 'Medium': 20, 'Hard': 30, 'Super Hard': 60 }; this.state.questionTimeLeft = durations[levelData.group] || 10; this.updateQuestionDisplay(); this.startQuestionTimer(); }
    updateQuestionTimer() { if (this.state.questionTimeLeft > 0) this.state.questionTimeLeft--; else this.applyOvertimePenalty(); this.updateQuestionDisplay(); }
    applyOvertimePenalty() { this.state.score = Math.max(0, this.state.score - 1); UI.updateStats(this.state.score, this.state.timeElapsed, this.state.totalHintsUsed); }
    updateQuestionDisplay() { UI.updateQuestionTimer(this.state.questionTimeLeft); }
    skipQuestion() { UI.showSkipConfirm(); }
    cancelSkip() { UI.hideSkipConfirm(); }
    confirmSkip() { UI.hideSkipConfirm(); this.quitGame(); }
    goToNextQuestion() { if (this.state.currentLevelIndex === LEVELS.length - 1) this.endGame(true); else { this.state.currentLevelIndex++; this.loadLevel(); } }
}
