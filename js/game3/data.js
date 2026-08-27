// Sumplete level designs (Game 3) — hand-designed like js/game1/data.js, no randomization.
// `values[i][j]` is the number shown in the cell.
// `solution[i][j] === false` means that cell must be XÓA (deleted) to hit rowTargets/colTargets;
// `true` means it stays (counts toward the sum). Used only for the "Gợi ý" hint reveal, never for win-checking.
// (Interpreted this way in js/game3/game.js's correctStateOf(); the raw values below are untouched.)
// `rowTargets`/`colTargets` are hand-typed (not derived) — validateLevelDesign() below only
// warns on a mismatch in dev console, it never recomputes/overrides them.
const LEVELS = [
    // EASY
    {
        group: "Easy",
        values: [[1, 2, 7], [9, 4, 8], [6, 1, 4]],
        solution: [[false, true, true], [true, false, true], [false, true, true]],
        rowTargets: [9, 17, 5],
        colTargets: [9, 3, 19]
    },
    {
        group: "Easy",
        values: [[3, 8, 5], [7, 2, 1], [8, 4, 6]],
        solution: [[false, true, true], [false, true, false], [false, true, false]],
        rowTargets: [13, 2, 4],
        colTargets: [0, 14, 5]
    },

    // MEDIUM
    {
        group: "Medium",
        values: [[8, 7, 2, 6], [8, 6, 2, 6], [3, 4, 5, 3], [5, 9, 1, 2]],
        solution: [[false, true, false, true], [false, true, false, true], [true, false, false, false], [false, true, true, true]],
        rowTargets: [13, 12, 3, 12],
        colTargets: [3, 22, 1, 14]
    },
    {
        group: "Medium",
        values: [[9, 7, 4, 6], [5, 6, 9, 2], [3, 2, 4, 8], [4, 6, 1, 1]],
        solution: [[false, true, true, false], [true, false, true, false], [false, true, false, false], [false, true, true, false]],
        rowTargets: [11, 14, 2, 7],
        colTargets: [5, 15, 14, 0]
    },

    // HARD
    {
        group: "Hard",
        values: [[4, 5, 9, 1, 3], [7, 8, 3, 4, 4], [7, 1, 7, 7, 4], [6, 9, 7, 5, 2], [8, 6, 3, 7, 2]],
        solution: [
            [true, true, false, false, false],
            [true, false, true, true, true],
            [false, true, true, true, true],
            [true, true, false, false, true],
            [true, true, false, true, true]
        ],
        rowTargets: [9, 18, 19, 17, 23],
        colTargets: [25, 21, 10, 18, 12]
    },
    
    // SUPER HARD
    {
        group: "Super Hard",
        values: [[3, 3, 4, 4, 5, 1, 8], [5, 4, 3, 4, 4, 4, 8], [3, 5, 6, 1, 7, 1, 8], [9, 5, 2, 8, 5, 9, 5], [6, 9, 1, 7, 2, 2, 7], [3, 1, 2, 5, 3, 9, 9], [3, 7, 1, 2, 6, 6, 3]],
        solution: [
            [true, false, true, false, true, false, true],
            [true, true, true, true, false, false, true],
            [true, false, false, true, false, false, false],
            [false, false, true, true, false, false, true],
            [true, true, false, false, false, false, false],
            [false, true, false, true, true, false, true],
            [false, false, true, true, true, true, false]
        ],
        rowTargets: [20, 24, 4, 15, 15, 18, 15],
        colTargets: [17, 14, 10, 20, 14, 6, 30]
    },
];

// par/base-score/hint-limit config, keyed by each level's `group` — must have an
// entry for every distinct group name used in LEVELS above.
const LEVEL_META = {
    Easy: { parTime: 60, baseScore: 100, hintLimit: 1 },
    Medium: { parTime: 90, baseScore: 200, hintLimit: 3 },
    Hard: { parTime: 120, baseScore: 300, hintLimit: 5 },
    "Super Hard": { parTime: 150, baseScore: 500, hintLimit: 10 }
};

// Score decays linearly as hints-used-this-level approaches hintLimit, floors at 0
// (never negative, never bleeds into other levels' scores).
function computeLevelScore(baseScore, hintLimit, hintsUsed) {
    const factor = Math.max(0, hintLimit - hintsUsed) / hintLimit;
    return Math.round(baseScore * factor);
}

function validateLevelDesign(level, index) {
    const { values, solution, rowTargets, colTargets } = level;
    const size = values.length;

    for (let i = 0; i < size; i++) {
        const hasKept = solution[i].some(v => v === true);
        const hasXoa = solution[i].some(v => v === false);
        if (!hasKept || !hasXoa) console.warn(`Game3 LEVELS[${index}]: hàng ${i} thiếu ô xóa hoặc ô giữ.`);
    }
    for (let j = 0; j < size; j++) {
        const col = solution.map(row => row[j]);
        const hasKept = col.some(v => v === true);
        const hasXoa = col.some(v => v === false);
        if (!hasKept || !hasXoa) console.warn(`Game3 LEVELS[${index}]: cột ${j} thiếu ô xóa hoặc ô giữ.`);
    }

    // rowTargets/colTargets are hand-typed above; only warn on mismatch, never auto-fix.
    for (let i = 0; i < size; i++) {
        const actual = values[i].reduce((sum, v, j) => sum + (solution[i][j] ? v : 0), 0);
        if (actual !== rowTargets[i]) {
            console.warn(`Game3 LEVELS[${index}]: rowTargets[${i}] gõ tay là ${rowTargets[i]} nhưng tính từ values+solution ra ${actual}.`);
        }
    }
    for (let j = 0; j < size; j++) {
        let actual = 0;
        for (let i = 0; i < size; i++) if (solution[i][j]) actual += values[i][j];
        if (actual !== colTargets[j]) {
            console.warn(`Game3 LEVELS[${index}]: colTargets[${j}] gõ tay là ${colTargets[j]} nhưng tính từ values+solution ra ${actual}.`);
        }
    }
}

LEVELS.forEach(validateLevelDesign);
