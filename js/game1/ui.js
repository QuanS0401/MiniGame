/* UI Manager for Game1 (copied from common/ui.js and scoped to Game1) */
const UI = {
    els: {},
    init() {
        this.els = {
            // Game Page elements (may be null when not present)
            gamePage: document.getElementById('gamePage'),
            // Game Info
            levelName: document.getElementById('levelName'),
            levelBadge: document.getElementById('levelBadge'),
            progressText: document.getElementById('progressText'),
            progressFill: document.getElementById('progressFill'),
            targetNumber: document.getElementById('targetNumber'),
            expressionBox: document.getElementById('expressionBox'),
            numbersGrid: document.getElementById('numbersGrid'),
            operatorsGrid: document.getElementById('operatorsGrid'),
            feedbackMsg: document.getElementById('feedbackMsg'),
            scoreValue: document.getElementById('scoreValue'),
            timerValue: document.getElementById('timerValue'),
            questionTimerValue: document.getElementById('questionTimerValue'),
            hintValue: document.getElementById('hintValue'),
            // Overlays
            rulesOverlay: document.getElementById('rulesOverlay'),
            statsOverlay: document.getElementById('statsOverlay'),
            statsTitle: document.getElementById('statsTitle'),
            statsMessage: document.getElementById('statsMessage'),
            skipConfirmOverlay: document.getElementById('skipConfirmOverlay'),
            levelBanner: document.getElementById('levelBanner'),
            top3Alert: document.getElementById('top3Alert'),
            // Buttons
            btnConfirmRules: document.getElementById('btnConfirmRules'),
            btnGoHome: document.getElementById('btnGoHome'),
            btnSkip: document.getElementById('btnSkip'),
            btnCancelSkip: document.getElementById('btnCancelSkip'),
            btnConfirmSkip: document.getElementById('btnConfirmSkip'),
            btnDelete: document.getElementById('btnDelete'),
            btnClear: document.getElementById('btnClear'),
            btnHint: document.getElementById('btnHint'),
            btnSubmit: document.getElementById('btnSubmit')
        };
    },

    showGamePage() {
        if (this.els.gamePage) this.els.gamePage.style.display = 'block';
        this.hideRulesOverlay();
    },

    renderNumbers(numbers, onNumberClick) {
        if (!this.els.numbersGrid) return;
        this.els.numbersGrid.innerHTML = "";
        numbers.forEach((num, index) => {
            const btn = document.createElement('button');
            btn.className = 'btn-game btn-number';
            btn.textContent = num;
            btn.dataset.index = index;
            btn.addEventListener('click', () => onNumberClick(btn, num, index));
            this.els.numbersGrid.appendChild(btn);
        });
    },

    renderExpression(tokens, animateLastToken = false) {
        if (!this.els.expressionBox) return;
        this.els.expressionBox.innerHTML = '';
        let mergedTokens = [];
        for (let token of tokens) {
            const last = mergedTokens[mergedTokens.length - 1];
            if (last && last.type === 'number' && token.type === 'number') {
                last.value += String(token.value);
            } else {
                mergedTokens.push({ type: token.type, value: String(token.value) });
            }
        }
        mergedTokens.forEach((token, index) => {
            const span = document.createElement('span');
            span.className = `expr-token ${['+','-','*','/','(',')'].includes(token.value) ? 'operator' : 'number'}`;
            if (animateLastToken && index === mergedTokens.length -1) span.classList.add('hint-step');
            let displayVal = token.value;
            if (displayVal === '*') displayVal = '×';
            if (displayVal === '/') displayVal = '÷';
            span.textContent = displayVal;
            this.els.expressionBox.appendChild(span);
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

    updateLevelInfo(levelData, currentLevel, totalLevels) {
        if (this.els.levelName) this.els.levelName.textContent = `${levelData.group} - Câu ${currentLevel}`;
        if (this.els.levelBadge) this.els.levelBadge.textContent = `LEVEL: ${levelData.group}`;
        if (this.els.levelBadge) this.els.levelBadge.className = `level-badge badge-${levelData.group.toLowerCase().replace(' ', '')}`;
        if (this.els.progressText) this.els.progressText.innerHTML = `<span>Tiến độ</span><span>Câu ${currentLevel} / ${totalLevels}</span>`;
        if (this.els.progressFill) this.els.progressFill.style.width = `${(currentLevel / totalLevels) * 100}%`;
        if (this.els.targetNumber) this.els.targetNumber.textContent = levelData.target;
    },

    flashExpressionBox() {
        if (!this.els.expressionBox) return;
        this.els.expressionBox.classList.remove('hint-flash');
        void this.els.expressionBox.offsetWidth;
        this.els.expressionBox.classList.add('hint-flash');
        setTimeout(() => this.els.expressionBox.classList.remove('hint-flash'), 520);
    },

    updateStats(score, timer, hints) {
        if (this.els.scoreValue) this.els.scoreValue.textContent = score;
        if (this.els.timerValue) this.els.timerValue.textContent = this.formatTime(timer);
        if (this.els.hintValue) this.els.hintValue.textContent = hints;
    },

    updateQuestionTimer(seconds) {
        if (this.els.questionTimerValue) this.els.questionTimerValue.textContent = this.formatTime(seconds);
    },

    formatTime(seconds) { const m = Math.floor(seconds/60).toString().padStart(2,'0'); const s = (seconds%60).toString().padStart(2,'0'); return `${m}:${s}`; },

    showStats(title, time, correctCount, hints, score) {
        if (this.els.statsTitle) this.els.statsTitle.innerHTML = title;
        if (this.els.statsMessage) this.els.statsMessage.innerHTML = 'Bạn đã hoàn thành toàn bộ thử thách STEM Mathrix!';
        const el = id => document.getElementById(id);
        if (el('statTime')) el('statTime').textContent = this.formatTime(time);
        if (el('statCorrect')) el('statCorrect').textContent = correctCount;
        if (el('statHints')) el('statHints').textContent = hints;
        if (el('statScore')) el('statScore').textContent = score;
        if (this.els.top3Alert) this.els.top3Alert.style.display = 'block';
        if (this.els.statsOverlay) this.els.statsOverlay.classList.add('active');
    },

    hideStats() { if (this.els.statsOverlay) this.els.statsOverlay.classList.remove('active'); },
    showRulesOverlay() { if (this.els.rulesOverlay) this.els.rulesOverlay.classList.add('active'); },
    hideRulesOverlay() { if (this.els.rulesOverlay) this.els.rulesOverlay.classList.remove('active'); },
    showSkipConfirm() { if (this.els.skipConfirmOverlay) this.els.skipConfirmOverlay.classList.add('active'); },
    hideSkipConfirm() { if (this.els.skipConfirmOverlay) this.els.skipConfirmOverlay.classList.remove('active'); },
    showLevelTransition(levelGroup) { if (!this.els.levelBanner) return; this.els.levelBanner.textContent = `LEVEL: ${levelGroup}`; this.els.levelBanner.classList.remove('show'); void this.els.levelBanner.offsetWidth; this.els.levelBanner.classList.add('show'); },
    setHintState(enabled) { if (!this.els.btnHint) return; if (enabled) { this.els.btnHint.style.opacity='1'; this.els.btnHint.style.pointerEvents='all'; this.els.btnHint.style.filter='grayscale(0)'; } else { this.els.btnHint.style.opacity='0.5'; this.els.btnHint.style.pointerEvents='none'; this.els.btnHint.style.filter='grayscale(1)'; } }
};
