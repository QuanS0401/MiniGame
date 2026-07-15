/**
 * UI Manager - Quản lý tương tác với DOM
 */
const UI = {
    els: {},
    
    init() {
        this.els = {
            // Pages
            homePage: document.getElementById('homePage'),
            gamePage: document.getElementById('gamePage'),
            
            // Home Elements
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            playerNameInput: document.getElementById('playerNameInput'),
            playerNameError: document.getElementById('playerNameError'),
            btnStartGame: document.getElementById('btnStartGame'),
            btnConfirmRules: document.getElementById('btnConfirmRules'),
            leaderboardList: document.getElementById('leaderboardList'),
            rulesOverlay: document.getElementById('rulesOverlay'),
            
            // Game Info
            currentPlayerName: document.getElementById('currentPlayerName'),
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
            
            // Game Overlays
            statsOverlay: document.getElementById('statsOverlay'),
            statsTitle: document.getElementById('statsTitle'),
            statsMessage: document.getElementById('statsMessage'),
            skipConfirmOverlay: document.getElementById('skipConfirmOverlay'),
            levelBanner: document.getElementById('levelBanner'),
            top3Alert: document.getElementById('top3Alert'),
            
            // Game Buttons
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

    showHomePage(targetTab = 'tab-play') {
        this.els.homePage.style.display = 'block';
        this.els.gamePage.style.display = 'none';
        this.els.playerNameInput.value = '';
        this.els.playerNameError.textContent = '';
        this.hideRulesOverlay();
        this.hideStats();
        this.switchTab(targetTab);
    },

    switchTab(targetId) {
        this.els.tabBtns.forEach(btn => {
            if (btn.dataset.target === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.els.tabContents.forEach(content => {
            if (content.id === targetId) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    },

    showGamePage(playerName) {
        this.els.homePage.style.display = 'none';
        this.els.gamePage.style.display = 'block';
        this.els.currentPlayerName.textContent = playerName;
        this.hideRulesOverlay();
    },

    showNameError(msg) {
        this.els.playerNameError.textContent = msg;
    },

    renderLeaderboard(players) {
        this.els.leaderboardList.innerHTML = '';
        if (players.length === 0) {
            this.els.leaderboardList.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding: 20px;">Chưa có dữ liệu. Hãy là người đầu tiên!</p>';
            return;
        }

        players.forEach((p, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}`;
            
            let rankIcon = `#${index + 1}`;
            if (index === 0) rankIcon = '🥇';
            if (index === 1) rankIcon = '🥈';
            if (index === 2) rankIcon = '🥉';

            item.innerHTML = `
                <span class="rank">${rankIcon}</span>
                <span class="player-name">${p.playerName}</span>
                <span class="score">${p.highestScore} đ</span>
            `;
            this.els.leaderboardList.appendChild(item);
        });
    },

    showFeedback(msg, type) {
        this.els.feedbackMsg.textContent = msg;
        this.els.feedbackMsg.className = `feedback-msg ${type}`;
    },

    clearFeedback() {
        this.els.feedbackMsg.textContent = "";
        this.els.feedbackMsg.className = "feedback-msg";
    },

    updateLevelInfo(levelData, currentLevel, totalLevels) {
        this.els.levelName.textContent = `${levelData.group} - Câu ${currentLevel}`;
        this.els.levelBadge.textContent = `LEVEL: ${levelData.group}`;
        this.els.levelBadge.className = `level-badge badge-${levelData.group.toLowerCase().replace(' ', '')}`;
        this.els.progressText.innerHTML = `<span>Tiến độ</span><span>Câu ${currentLevel} / ${totalLevels}</span>`;
        this.els.progressFill.style.width = `${(currentLevel / totalLevels) * 100}%`;
        this.els.targetNumber.textContent = levelData.target;
    },

    renderNumbers(numbers, onNumberClick) {
        this.els.numbersGrid.innerHTML = "";
        numbers.forEach((num, index) => {
            const btn = document.createElement("button");
            btn.className = "btn-game btn-number";
            btn.textContent = num;
            btn.dataset.index = index;
            btn.addEventListener('click', () => onNumberClick(btn, num, index));
            this.els.numbersGrid.appendChild(btn);
        });
    },

    renderExpression(tokens, animateLastToken = false) {
        this.els.expressionBox.innerHTML = "";
        
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
            const span = document.createElement("span");
            span.className = `expr-token ${['+', '-', '*', '/', '(', ')'].includes(token.value) ? 'operator' : 'number'}`;
            if (animateLastToken && index === mergedTokens.length - 1) {
                span.classList.add('hint-step');
            }
            let displayVal = token.value;
            if (displayVal === '*') displayVal = '×';
            if (displayVal === '/') displayVal = '÷';
            span.textContent = displayVal;
            this.els.expressionBox.appendChild(span);
        });
    },

    flashExpressionBox() {
        this.els.expressionBox.classList.remove('hint-flash');
        void this.els.expressionBox.offsetWidth;
        this.els.expressionBox.classList.add('hint-flash');
        setTimeout(() => {
            this.els.expressionBox.classList.remove('hint-flash');
        }, 520);
    },
    
    updateStats(score, timer, hints) {
        if(this.els.scoreValue) this.els.scoreValue.textContent = score;
        if(this.els.timerValue) this.els.timerValue.textContent = this.formatTime(timer);
        if(this.els.hintValue) this.els.hintValue.textContent = hints;
    },
    
    updateQuestionTimer(seconds) {
        if(this.els.questionTimerValue) {
            this.els.questionTimerValue.textContent = this.formatTime(seconds);
        }
    },
    
    formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },
    
    showStats(title, time, correctCount, hints, score, isTop3) {
        this.els.statsTitle.innerHTML = title;
        this.els.statsMessage.innerHTML = 'Bạn đã hoàn thành toàn bộ thử thách STEM Mathrix!<br>Điểm của bạn đã được lưu vào Bảng xếp hạng.';
        document.getElementById('statTime').textContent = this.formatTime(time);
        document.getElementById('statCorrect').textContent = correctCount;
        document.getElementById('statHints').textContent = hints;
        document.getElementById('statScore').textContent = score;
        
        if (isTop3) {
            this.els.top3Alert.style.display = 'block';
        } else {
            this.els.top3Alert.style.display = 'none';
        }
        
        this.els.statsOverlay.classList.add('active');
    },
    
    hideStats() {
        this.els.statsOverlay.classList.remove('active');
    },

    showRulesOverlay() {
        if (this.els.rulesOverlay) {
            this.els.rulesOverlay.classList.add('active');
        }
    },

    hideRulesOverlay() {
        if (this.els.rulesOverlay) {
            this.els.rulesOverlay.classList.remove('active');
        }
    },

    showSkipConfirm() {
        if (this.els.skipConfirmOverlay) this.els.skipConfirmOverlay.classList.add('active');
    },

    hideSkipConfirm() {
        if (this.els.skipConfirmOverlay) this.els.skipConfirmOverlay.classList.remove('active');
    },

    showLevelTransition(levelGroup) {
        this.els.levelBanner.textContent = `LEVEL: ${levelGroup}`;
        this.els.levelBanner.classList.remove('show');
        void this.els.levelBanner.offsetWidth;
        this.els.levelBanner.classList.add('show');
    },
    
    setHintState(enabled) {
        if (enabled) {
            this.els.btnHint.style.opacity = "1";
            this.els.btnHint.style.pointerEvents = "all";
            this.els.btnHint.style.filter = "grayscale(0)";
        } else {
            this.els.btnHint.style.opacity = "0.5";
            this.els.btnHint.style.pointerEvents = "none";
            this.els.btnHint.style.filter = "grayscale(1)";
        }
    }
};
