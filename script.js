const expressionDisplay = document.getElementById("expressionDisplay");
const targetElement = document.getElementById("target");
const levelNameElement = document.getElementById("levelName");
const numbersContainer = document.getElementById("numbers");

const deleteBtn = document.getElementById("deleteBtn");
const clearBtn = document.getElementById("clearBtn");
const hintBtn = document.getElementById("hintBtn");
const checkBtn = document.getElementById("checkBtn");

const introOverlay = document.getElementById("introOverlay");
const introText = document.getElementById("introText");
const resultBox = document.getElementById("result");

const difficultyTextElement = document.getElementById("difficultyText");
const progressTextElement = document.getElementById("progressText");
const progressFillElement = document.getElementById("progressFill");
const levelChipElement = document.getElementById("levelChip");

const levelIntroOverlayElement = document.getElementById("levelIntroOverlay");
const levelIntroBadgeElement = document.getElementById("levelIntroBadge");

const QUESTIONS_PER_GROUP = 5;

const LEVELS = [
    // EASY
    {
        group: "Easy",
        name: "Easy - Câu 1",
        target: 24,
        numbers: [6, 6, 6, 6],
        hint: "Thử cộng cả 4 số."
    },
    {
        group: "Easy",
        name: "Easy - Câu 2",
        target: 20,
        numbers: [10, 5, 3, 2],
        hint: "Thử cộng cả 4 số."
    },
    {
        group: "Easy",
        name: "Easy - Câu 3",
        target: 18,
        numbers: [9, 3, 3, 3],
        hint: "Thử cộng cả 4 số."
    },
    {
        group: "Easy",
        name: "Easy - Câu 4",
        target: 16,
        numbers: [8, 4, 2, 2],
        hint: "thử cộng cả 4 số."
    },
    {
        group: "Easy",
        name: "Easy - Câu 5",
        target: 12,
        numbers: [3, 3, 3, 3],
        hint: "Thử cộng cả 4 số."
    },

    // MEDIUM
    {
        group: "Medium",
        name: "Medium - Câu 1",
        target: 24,
        numbers: [10, 10, 4, 4],
        hint: "Thử tạo một số lớn rồi trừ đi."
    },
    {
        group: "Medium",
        name: "Medium - Câu 2",
        target: 30,
        numbers: [5, 5, 5, 5],
        hint: "Có thể ghép 2 số lại rồi trừ."
    },
    {
        group: "Medium",
        name: "Medium - Câu 3",
        target: 36,
        numbers: [6, 6, 6, 6],
        hint: "Thử nhân hai số trước."
    },
    {
        group: "Medium",
        name: "Medium - Câu 4",
        target: 15,
        numbers: [7, 2, 3, 1],
        hint: "tạo ra số 5 trước có thể hữu ích."
    },
    {
        group: "Medium",
        name: "Medium - Câu 5",
        target: 40,
        numbers: [5, 5, 5, 10],
        hint: "thử tạo ra 50 trước"
    },

    // HARD
    {
        group: "Hard",
        name: "Hard - Câu 1",
        target: 20,
        numbers: [2, 2, 5, 5], // 5*2 + 5*2
        hint: "phép nhân cơ bản"
    },
    {
        group: "Hard",
        name: "Hard - Câu 2",
        target: 2,
        numbers: [4, 5, 6, 3], // 6+4-3-5
        hint: "suy nghĩ 1 cách đơn giản về phép tính cộng trừ"
    },
    {
        group: "Hard",
        name: "Hard - Câu 3",
        target: 9,
        numbers: [9, 2, 6, 3], // 9 * 6 / 3 / 2
        hint: "chỉ là phép tính đơn giản giữa nhân và chia"
    },
    {
        group: "Hard",
        name: "Hard - Câu 4",
        target: 5,
        numbers: [6, 4, 3, 3], // 4 * (3/6) + 3
        hint: "tạo ra số 2 trước có thể hữu ích"
    },
    {
        group: "Hard",
        name: "Hard - Câu 5",
        target: 6,
        numbers: [3, 6, 2, 2], // (2 / (3 / 6)) + 2
        hint: "tạo ra số 4 trước có thể hữu ích"
    },

    // SUPER HARD
    {
        group: "Super Hard",
        name: "Super Hard - Câu 1",
        target: 9,
        numbers: [4, 3, 3, 4], // 4 * (3 - 3/4)
        hint: "hãy tạo ra 1 phân số với 3 và 4"
    },
    {
        group: "Super Hard",
        name: "Super Hard - Câu 2",
        target: 36,
        numbers: [3, 8, 4, 3], // (8-4) * (3*3)
        hint: "phép cộng hoặc phép trừ có thể kết hợp để tạo ra 1 số hữu ích khác"
    },
    {
        group: "Super Hard",
        name: "Super Hard - Câu 3",
        target: 33,
        numbers: [3, 6, 6, 6], // 6 * (6 - 3/6)
        hint: "hãy thử tạo ra 1 phân số có thể triệt tiêu 6"
    },
    {
        group: "Super Hard",
        name: "Super Hard - Câu 4",
        target: 36,
        numbers: [3, 6, 3, 6], // 6 * (6 * 3/3)
        hint: "hãy thử tạo ra 1 số khác bằng phép chia"
    },
    {
        group: "Super Hard",
        name: "Super Hard - Câu 5",
        target: 3636,
        numbers: [3, 10, 6, 1], // 36 * 101
        hint: "thử ghép 4 số thành 2 số khác nhau rồi nhân với nhau"
    }
];

let currentLevelIndex = 0;
let tokens = [];
let gameStarted = false;

function showMessage(message = "", type = "") {
    if (!resultBox) return;

    resultBox.textContent = message;
    resultBox.className = "";

    if (type) {
        resultBox.classList.add(type);
    }
}

function formatToken(value) {
    if (value === "*") return "×";
    if (value === "/") return "÷";
    return value;
}

function getQuestionNumberInGroup(index) {
    return (index % QUESTIONS_PER_GROUP) + 1;
}

function isFirstQuestionOfGroup(index) {
    return index % QUESTIONS_PER_GROUP === 0;
}

function getLevelBadgeText(level, index = currentLevelIndex) {
    return `LEVEL: ${level.group.toUpperCase()}`;
}

function updateProgressUI() {
    const totalQuestions = LEVELS.length;
    const currentQuestion = currentLevelIndex + 1;
    const level = LEVELS[currentLevelIndex];

    if (difficultyTextElement && level) {
        difficultyTextElement.textContent = level.group;
    }

    if (progressTextElement) {
        progressTextElement.textContent = `Câu ${currentQuestion} / ${totalQuestions}`;
    }

    if (progressFillElement) {
        const percent = (currentQuestion / totalQuestions) * 100;
        progressFillElement.style.width = `${percent}%`;
    }

    if (levelChipElement && level) {
        levelChipElement.textContent = getLevelBadgeText(level, currentLevelIndex);
    }
}

function renderExpression() {
    if (!expressionDisplay) return;

    expressionDisplay.innerHTML = "";

    if (tokens.length === 0) {
        const placeholder = document.createElement("span");
        placeholder.textContent = "   Nhập biểu thức của bạn...";
        placeholder.style.opacity = "0.6";
        expressionDisplay.appendChild(placeholder);
        return;
    }

    for (const token of tokens) {
        const span = document.createElement("span");
        span.textContent = formatToken(token.value);
        expressionDisplay.appendChild(span);
    }
}

function renderNumbers() {
    if (!numbersContainer) return;

    numbersContainer.innerHTML = "";
    const level = LEVELS[currentLevelIndex];

    level.numbers.forEach((num, index) => {
        const button = document.createElement("button");
        button.className = "number-card";
        button.type = "button";
        button.dataset.value = String(num);
        button.dataset.index = String(index);
        button.textContent = num;

        button.addEventListener("click", () => {
            addNumber(button);
        });

        numbersContainer.appendChild(button);
    });
}

function addNumber(button) {
    if (!button || button.classList.contains("used")) return;

    tokens.push({
        type: "number",
        value: button.dataset.value,
        element: button,
        originIndex: button.dataset.index
    });

    button.classList.add("used");
    renderExpression();
    showMessage("");
}

function addOperator(value) {
    tokens.push({
        type: "operator",
        value: value
    });

    renderExpression();
    showMessage("");
}

function deleteLastToken() {
    if (tokens.length === 0) return;

    const lastToken = tokens.pop();

    if (lastToken.type === "number" && lastToken.element) {
        lastToken.element.classList.remove("used");
    }

    renderExpression();
    showMessage("");
}

function clearAllTokens() {
    tokens = [];

    document.querySelectorAll(".number-card").forEach((button) => {
        button.classList.remove("used");
    });

    renderExpression();
    showMessage("");
}

function getExpressionString() {
    return tokens.map((token) => token.value).join("");
}

function countUsedNumbers() {
    const used = {};

    for (const token of tokens) {
        if (token.type === "number") {
            used[token.value] = (used[token.value] || 0) + 1;
        }
    }

    return used;
}

function countAvailableNumbers() {
    const available = {};
    const level = LEVELS[currentLevelIndex];

    for (const num of level.numbers) {
        const key = String(num);
        available[key] = (available[key] || 0) + 1;
    }

    return available;
}

function isUsingValidNumbers() {
    const used = countUsedNumbers();
    const available = countAvailableNumbers();

    for (const value in used) {
        if (!available[value] || used[value] > available[value]) {
            return false;
        }
    }

    return true;
}

function isAllNumbersUsed() {
    const level = LEVELS[currentLevelIndex];
    const usedCount = tokens.filter((token) => token.type === "number").length;
    return usedCount === level.numbers.length;
}

function isExpressionStructureValid() {
    if (tokens.length === 0) return false;

    let balance = 0;

    for (let i = 0; i < tokens.length; i++) {
        const current = tokens[i];
        const prev = tokens[i - 1];
        const next = tokens[i + 1];

        if (current.value === "(") {
            balance++;
        } else if (current.value === ")") {
            balance--;
            if (balance < 0) return false;
        }

        if (current.type === "operator") {
            const val = current.value;

            if (val === "+" || val === "-" || val === "*" || val === "/") {
                if (i === 0 || i === tokens.length - 1) return false;
                if (!prev || !next) return false;

                const invalidBefore = ["+", "-", "*", "/", "("];
                const invalidAfter = ["+", "-", "*", "/", ")"];

                if (invalidBefore.includes(prev.value)) return false;
                if (invalidAfter.includes(next.value)) return false;
            }

            if (val === "(") {
                if (!next) return false;
                if (next.value === ")") return false;
                if (prev && (prev.type === "number" || prev.value === ")")) return false;
            }

            if (val === ")") {
                if (!prev) return false;
                if (prev.value === "(") return false;
                if (next && (next.type === "number" || next.value === "(")) return false;
            }
        }
    }

    return balance === 0;
}

function evaluateExpression(expression) {
    try {
        return Function(`"use strict"; return (${expression})`)();
    } catch (error) {
        return null;
    }
}

function resetLevelIntroState() {
    if (!levelIntroOverlayElement || !levelIntroBadgeElement) return;

    levelIntroOverlayElement.classList.remove("show", "shrink", "move-to-corner");
}

function showLevelIntro(level, index = currentLevelIndex) {
    if (!levelIntroOverlayElement || !levelIntroBadgeElement) return;

    resetLevelIntroState();
    levelIntroBadgeElement.textContent = getLevelBadgeText(level, index);

    requestAnimationFrame(() => {
        levelIntroOverlayElement.classList.add("show");
    });

    setTimeout(() => {
        levelIntroOverlayElement.classList.add("shrink");
    }, 800);

    setTimeout(() => {
        levelIntroOverlayElement.classList.add("move-to-corner");
    }, 1450);

    setTimeout(() => {
        resetLevelIntroState();
    }, 2200);
}

function loadLevel(options = {}) {
    const { showTransition = false } = options;
    const level = LEVELS[currentLevelIndex];

    if (!level) return;

    if (levelNameElement) {
        levelNameElement.textContent = level.name;
    }

    if (targetElement) {
        targetElement.textContent = level.target;
    }

    tokens = [];
    renderNumbers();
    renderExpression();
    showMessage("");
    updateProgressUI();

    if (showTransition) {
        showLevelIntro(level, currentLevelIndex);
    }
}

function showFinalVictory() {
    showMessage("🔥 Chúc mừng! Bạn đã hoàn thành toàn bộ Vòng 3! 🔥", "success");

    const victoryOverlay = document.createElement("div");
    victoryOverlay.className = "final-victory-overlay";
    victoryOverlay.innerHTML = `
        <div class="final-victory-card">
            <h2>🎉 PHÁ ĐẢO VÒNG 3 🎉</h2>
            <p>Bạn đã hoàn thành tất cả 20 câu của mini game.</p>
            <button id="restartGameBtn" type="button">Chơi lại</button>
        </div>
    `;

    document.body.appendChild(victoryOverlay);

    const restartBtn = document.getElementById("restartGameBtn");
    if (restartBtn) {
        restartBtn.addEventListener("click", () => {
            victoryOverlay.remove();
            currentLevelIndex = 0;
            tokens = [];
            loadLevel({ showTransition: true });
        });
    }
}

function goToNextLevel() {
    const oldGroup = LEVELS[currentLevelIndex].group;
    currentLevelIndex++;

    if (currentLevelIndex >= LEVELS.length) {
        currentLevelIndex = LEVELS.length - 1;
        showFinalVictory();
        return;
    }

    const newGroup = LEVELS[currentLevelIndex].group;
    const shouldShowTransition =
        oldGroup !== newGroup && isFirstQuestionOfGroup(currentLevelIndex);

    setTimeout(() => {
        loadLevel({ showTransition: shouldShowTransition });
        showMessage(`Đã qua câu mới: ${LEVELS[currentLevelIndex].name}`, "success");
    }, shouldShowTransition ? 900 : 250);
}

function checkAnswer() {
    const target = Number(targetElement.textContent.trim());

    if (tokens.length === 0) {
        showMessage("Chưa có biểu thức nào được nhập.", "warning");
        return;
    }

    if (!isUsingValidNumbers()) {
        showMessage("Biểu thức đang dùng số không hợp lệ.", "error");
        return;
    }

    if (!isAllNumbersUsed()) {
        showMessage("Cần dùng hết tất cả các số đã cho.", "warning");
        return;
    }

    if (!isExpressionStructureValid()) {
        showMessage("Biểu thức chưa đúng cấu trúc.", "error");
        return;
    }

    const expression = getExpressionString();
    const result = evaluateExpression(expression);

    if (result === null || Number.isNaN(result) || !Number.isFinite(result)) {
        showMessage("Biểu thức không hợp lệ hoặc có phép chia cho 0.", "error");
        return;
    }

    if (Math.abs(result - target) < 1e-9) {
        if (currentLevelIndex === LEVELS.length - 1) {
            showMessage(`Chính xác! Kết quả bằng ${target}.`, "success");
            setTimeout(() => {
                showFinalVictory();
            }, 700);
        } else {
            showMessage(`Chính xác! Kết quả bằng ${target}.`, "success");
            goToNextLevel();
        }
    } else {
        showMessage(`Chưa đúng. Kết quả hiện tại là ${result}, không phải ${target}.`, "error");
    }
}

function showHint() {
    const level = LEVELS[currentLevelIndex];
    showMessage(level.hint, "warning");
}

function bindOperatorButtons() {
    const operatorButtons = document.querySelectorAll(".operator-card");

    operatorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            addOperator(button.dataset.value);
        });
    });
}

function showIntro() {
    if (!introOverlay || !introText) {
        loadLevel({ showTransition: true });
        return;
    }

    introOverlay.style.display = "flex";

    introText.innerHTML = `
        <div class="intro-card">
            <p class="intro-tag">MINI GAME - VÒNG 3</p>
            <h1>Chào mừng đến vòng 3</h1>
            <p>
                Đây là vòng cuối trong tổng 3 vòng. Nhiệm vụ của người chơi là dùng đúng 4 số đã cho,
                kết hợp các phép toán +, -, ×, ÷, ngoặc để tạo ra số N.
            </p>
            <ul class="intro-rules">
                <li>Mỗi câu phải dùng hết tất cả các số.</li>
                <li>Không được dùng thêm số ngoài đề bài.</li>
                <li>Biểu thức phải đúng cấu trúc và không được chia cho 0.</li>
                <li>Có tổng cộng 20 câu: Easy, Medium, Hard, Super Hard, mỗi mức 5 câu.</li>
                <li>Không được dùng máy tính.</li>
            </ul>
            <button id="startGameBtn" type="button">Bắt đầu vòng 3</button>
        </div>
    `;

    const startGameBtn = document.getElementById("startGameBtn");

    if (startGameBtn) {
        startGameBtn.addEventListener("click", () => {
            introOverlay.style.opacity = "0";

            setTimeout(() => {
                introOverlay.style.display = "none";
                introOverlay.style.opacity = "1";

                if (!gameStarted) {
                    gameStarted = true;
                    loadLevel({ showTransition: true });
                }
            }, 250);
        });
    }
}

function setupButtons() {
    if (deleteBtn) {
        deleteBtn.addEventListener("click", deleteLastToken);
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", clearAllTokens);
    }

    if (hintBtn) {
        hintBtn.addEventListener("click", showHint);
    }

    if (checkBtn) {
        checkBtn.addEventListener("click", checkAnswer);
    }
}

function injectExtraStyles() {
    const style = document.createElement("style");
    style.textContent = `
        .success {
            color: #22c55e;
            border-color: rgba(34, 197, 94, 0.4) !important;
        }

        .error {
            color: #ef4444;
            border-color: rgba(239, 68, 68, 0.4) !important;
        }

        .warning {
            color: #f59e0b;
            border-color: rgba(245, 158, 11, 0.4) !important;
        }

        #introOverlay {
            position: fixed;
            inset: 0;
            background: rgba(2, 6, 23, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 0.25s ease;
            padding: 20px;
        }

        #introText {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .intro-card {
            width: min(100%, 620px);
            background: linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.96));
            border: 1px solid rgba(56, 189, 248, 0.28);
            border-radius: 24px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            color: #e2e8f0;
            margin: 0 auto;
        }

        .intro-tag {
            color: #7dd3fc;
            font-size: 0.95rem;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 12px;
            text-transform: uppercase;
        }

        .intro-card h1 {
            font-size: 2.6rem;
            margin-bottom: 16px;
            color: #f8fafc;
        }

        .intro-card p {
            line-height: 1.7;
            margin-bottom: 14px;
            color: #cbd5e1;
        }

        .intro-rules {
            margin: 16px 0 22px 20px;
            color: #e2e8f0;
            line-height: 1.8;
        }

        #startGameBtn {
            width: 100%;
            border: none;
            border-radius: 14px;
            padding: 14px 22px;
            font-size: 1.1rem;
            font-weight: 700;
            color: white;
            cursor: pointer;
            background: linear-gradient(135deg, #2563eb, #38bdf8);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        #startGameBtn:hover {
            transform: translateY(-1px) scale(1.01);
            box-shadow: 0 10px 25px rgba(56, 189, 248, 0.35);
        }

        .level-intro-overlay {
            position: fixed;
            inset: 0;
            z-index: 9998;
            display: flex;
            justify-content: center;
            align-items: center;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.25s ease;
        }

        .level-intro-overlay.show {
            opacity: 1;
        }

        .level-intro-overlay.shrink .level-intro-badge {
            transform: scale(0.72);
        }

        .level-intro-overlay.move-to-corner {
            opacity: 0;
        }

        .level-intro-badge {
            padding: 22px 42px;
            border-radius: 22px;
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.95), rgba(168, 85, 247, 0.95));
            border: 1px solid rgba(255, 255, 255, 0.18);
            color: white;
            font-size: clamp(1.25rem, 3vw, 2.4rem);
            font-weight: 800;
            letter-spacing: 1px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
            transform: scale(1.28);
            transition: transform 0.6s ease, opacity 0.45s ease;
        }

        .final-victory-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;
            background: rgba(2, 6, 23, 0.72);
            backdrop-filter: blur(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .final-victory-card {
            width: min(100%, 500px);
            background: linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.96));
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 22px;
            padding: 30px;
            text-align: center;
            color: #f8fafc;
            box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }

        .final-victory-card h2 {
            font-size: 2rem;
            margin-bottom: 12px;
            color: #38bdf8;
        }

        .final-victory-card p {
            color: #cbd5e1;
            line-height: 1.7;
            margin-bottom: 20px;
        }

        #restartGameBtn {
            border: none;
            border-radius: 12px;
            padding: 12px 20px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            color: white;
            background: linear-gradient(135deg, #22c55e, #16a34a);
        }

        @media (max-width: 640px) {
            .intro-card {
                padding: 22px;
            }

            .intro-card h1 {
                font-size: 2rem;
            }

            .level-intro-badge {
                font-size: 1.35rem;
                padding: 18px 24px;
            }
        }
    `;

    document.head.appendChild(style);
}

function initGame() {
    injectExtraStyles();
    bindOperatorButtons();
    setupButtons();
    renderExpression();
    updateProgressUI();
    showIntro();
}

initGame();