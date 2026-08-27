// Balance Bridge level designs (Game 4) — hand-designed like js/game2's Sokoban levels
// and js/game3's Sumplete grids, no randomization.
//
// PhET "Balancing Act"-style plank: a ruler of fixed distance marks (plankDistances),
// symmetric on both sides of the single pivot. leftObjects is locked ("đề bài"):
// momenTrai = Σ leftObjects[i].weight * leftObjects[i].distance, fixed for the whole
// level. rightPool is the tray stock (may include decoys the player never needs) —
// each entry only has {type, weight}, no distance, since the player drags it to
// whichever empty mark they choose. rightSolution is parallel to rightPool: the
// distance to drop that item on for ONE combination that makes momenPhai exactly equal
// momenTrai (or null if that item is a decoy and should stay in the tray) — used only
// to drive the "Gợi ý" button (js/game4/game.js's useHint()), never for win-checking
// (see js/game4/game.js's datVat()/momenPhai(), which only compare live position sums
// to momenTrai).

const MATERIAL_NAMES = [
    'BRICK XS', 'BRICK S', 'BRICK M', 'BRICK L',
    'BOX', 'PLANT', 'ROCK', 'WATER BUCKET'
]; // index 0-7, khớp đúng 8 ảnh vật liệu trong images/game4/ (xem MATERIAL_IMAGE_FILES bên dưới)

// There is no server-side directory listing for a static site, so this mirrors the
// actual contents of "STEM_MATHRIX - Test/images/game4/" as captured at build time.
// Re-run the matching below (or update this list by hand) if Sun adds/renames files later.
const GAME4_IMAGE_FILES = [
    'BRICK XS.png', 'BRICK S.png', 'BRICK M.png', 'BRICK L.png',
    'BOX.png', 'PLANT.png', 'ROCK.png', 'WATER BUCKET.png'
];

function normalizeMaterialKey(name) {
    return name.toLowerCase().replace(/[\s\-_]/g, '');
}

// Index-aligned with MATERIAL_NAMES: the real filename to use for each material's icon
// (matched case-insensitively, ignoring spaces/hyphens/underscores), or null if no file
// in images/game4/ matched — ui.js falls back to a lettered tile in that case.
const MATERIAL_IMAGE_FILES = MATERIAL_NAMES.map(name => {
    const key = normalizeMaterialKey(name);
    const match = GAME4_IMAGE_FILES.find(file => normalizeMaterialKey(file.replace(/\.[a-zA-Z0-9]+$/, '')) === key);
    return match || null;
});

const LEVELS = [
    // EASY 1 — verified example from game4-can-bang-cau-prompt_2.md mục 2.
    // momenTrai = (ROCK: 5*2) + (BRICK S: 2*3) = 10 + 6 = 16
    // rightSolution đặt BOX (m=4) ở mốc 1, WATER BUCKET (m=3) ở mốc 4, bỏ 2 BRICK M và 1 PLANT (mồi nhử):
    // momenPhai = (BOX: 4*1) + (WATER BUCKET: 3*4) = 4 + 12 = 16 ✅
    {
        id: 'Easy 1',
        difficulty: 'Easy',
        baseScore: 100,
        parTime: 60,
        hintLimit: 1,

        plankDistances: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],

        leftObjects: [
            { type: 6, weight: 40, distance: 0.75 }
        ],

        rightPool: [
            { type: 4, weight: 17 },
            { type: 3, weight: 40 }
        ],

        rightSolution: [null, 0.75]
    },

    // EASY 2 — placeholder, tính tay để đảm bảo có nghiệm; Sun tự chỉnh số liệu sau khi có ảnh vật liệu thật.
    // momenTrai = (5*2) + (3*6) = 10 + 18 = 28
    // rightSolution đặt rightPool[0] (m=6) ở mốc 3, rightPool[1] (m=5) ở mốc 2, bỏ 2 vật mồi nhử còn lại:
    // momenPhai = (6*3) + (5*2) = 18 + 10 = 28 ✅
    {
        id: 'Easy 2',
        difficulty: 'Easy',
        baseScore: 100,
        parTime: 70,
        hintLimit: 1,

        plankDistances: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],

        leftObjects: [
            { type: 3, weight: 20, distance: 0.25 }
        ],

        rightPool: [
            { type: 1, weight: 10 },
            { type: 5, weight: 3 },
        ],

        rightSolution: [0.5, null]
    },

    // MEDIUM 1 — placeholder, tính tay; Sun tự chỉnh số liệu sau khi có ảnh vật liệu thật.
    // momenTrai = (5*3) + (4*6) + (2*1) = 15 + 24 + 2 = 41
    // rightSolution đặt rightPool[0] (m=6) ở mốc 5, rightPool[1] (m=3) ở mốc 3, rightPool[2] (m=2) ở mốc 1,
    // bỏ 3 vật mồi nhử còn lại:
    // momenPhai = (6*5) + (3*3) + (2*1) = 30 + 9 + 2 = 41 ✅
    {
        id: 'Medium 1',
        difficulty: 'Medium',
        baseScore: 200,
        parTime: 90,
        hintLimit: 1,

        plankDistances: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],

        leftObjects: [
            { type: 3, weight: 20, distance: 0.5 }
        ],

        rightPool: [
            { type: 0, weight: 5},
            { type: 6, weight: 50},
            { type: 5, weight: 15}

        ],

        rightSolution: [2, null, null]
    },

    // MEDIUM 2 — placeholder, tính tay; Sun tự chỉnh số liệu sau khi có ảnh vật liệu thật.
    // momenTrai = (6*4) + (3*7) + (5*2) = 24 + 21 + 10 = 55
    // rightSolution đặt rightPool[0] (m=8) ở mốc 5, rightPool[1] (m=5) ở mốc 2, rightPool[2] (m=5) ở mốc 1,
    // bỏ 3 vật mồi nhử còn lại:
    // momenPhai = (8*5) + (5*2) + (5*1) = 40 + 10 + 5 = 55 ✅
    {
        id: 'Medium 2',
        difficulty: 'Medium',
        baseScore: 200,
        parTime: 100,
        hintLimit: 1,

        plankDistances: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],

        leftObjects: [
            { type: 6, weight: 30, distance: 0.25 }
        ],

        rightPool: [
            
            { type: 6, weight: 20 },
            { type: 7, weight: 3 },
            { type: 5, weight: 10 }
        ],

        rightSolution: [null, null, 0.75]
    },

    // HARD 1 — placeholder, tính tay; Sun tự chỉnh số liệu sau khi có ảnh vật liệu thật.
    // momenTrai = (9*5) + (7*8) + (4*3) + (6*2) = 45 + 56 + 12 + 12 = 125
    // rightSolution đặt rightPool[0] (m=10) ở mốc 7, rightPool[1] (m=9) ở mốc 5, rightPool[2] (m=10) ở mốc 1,
    // bỏ 4 vật mồi nhử còn lại:
    // momenPhai = (10*7) + (9*5) + (10*1) = 70 + 45 + 10 = 125 ✅
    {
        id: 'Hard 1',
        difficulty: 'Hard',
        baseScore: 300,
        parTime: 120,
        hintLimit: 1,

        plankDistances: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],

        leftObjects: [
            { type: 3, weight: 20, distance: 1 },
            { type: 6, weight: 80, distance: 0.25 }
        ],

        rightPool: [
            { type: 0, weight: 5 },
            { type: 4, weight: 20 },
            { type: 5, weight: 10 },
            { type: 7, weight: 25 }
        ],

        rightSolution: [null, 2, null, null, null]
    },

    // HARD 2 — placeholder, tính tay; Sun tự chỉnh số liệu sau khi có ảnh vật liệu thật.
    // momenTrai = (9*8) + (8*6) + (7*4) + (5*2) = 72 + 48 + 28 + 10 = 158
    // rightSolution đặt rightPool[0] (m=11) ở mốc 8, rightPool[1] (m=10) ở mốc 5, rightPool[2] (m=6) ở mốc 3,
    // rightPool[3] (m=2) ở mốc 1, bỏ 3 vật mồi nhử còn lại:
    // momenPhai = (11*8) + (10*5) + (6*3) + (2*1) = 88 + 50 + 18 + 2 = 158 ✅
    {
        id: 'Hard 2',
        difficulty: 'Hard',
        baseScore: 300,
        parTime: 140,
        hintLimit: 2,

        plankDistances: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],

        leftObjects: [
            { type: 3, weight: 20, distance: 1.25 },
            { type: 6, weight: 60, distance: 0.25 }
        ],

        rightPool: [
            { type: 4, weight: 10 },
            { type: 5, weight: 10 },
            { type: 7, weight: 10 },
            { type: 6, weight: 80 },
            { type: 3, weight: 45 },
            { type: 4, weight: 10 }
        ],

        rightSolution: [0.25, 0.75, 1, null, null, 2]
    }
];

// v9: guards every score input against missing/NaN fields (a level object typed by hand
// with a missing/misspelled field, or hintLimit left at 0, used to silently produce a
// NaN score with no console signal). Falls back to `fallback` and warns with the exact
// field + level id so a bad LEVELS entry is easy to spot, instead of NaN bleeding into
// the displayed score.
function safeNumber(value, fallback, fieldName, levelId) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        console.warn(`Game4 màn "${levelId}": trường "${fieldName}" không hợp lệ (giá trị: ${value}) — dùng mặc định ${fallback}.`);
        return fallback;
    }
    return value;
}

// Score decays linearly as hints-used-this-level approaches hintLimit, floors at 0
// (never negative, never bleeds into other levels' scores) — same formula as Game 3's
// computeLevelScore, just fed per-level baseScore/hintLimit instead of a per-tier table.
function tinhDiemMan(baseScore, hintLimit, hintsUsed, levelId = '?') {
    const safeBaseScore = safeNumber(baseScore, 0, 'baseScore', levelId);
    const safeHintsUsed = safeNumber(hintsUsed, 0, 'hintsUsed', levelId);
    let safeHintLimit = safeNumber(hintLimit, 1, 'hintLimit', levelId);
    if (safeHintLimit < 1) {
        console.warn(`Game4 màn "${levelId}": "hintLimit" phải >= 1 (giá trị: ${safeHintLimit}) — dùng mặc định 1.`);
        safeHintLimit = 1;
    }
    const heSo = Math.max(0, safeHintLimit - safeHintsUsed) / safeHintLimit;
    return Math.round(safeBaseScore * heSo);
}

// Shared by both sides: Σ weight * distance. Left objects already carry their fixed
// distance; the right side's objects are built on the fly from rightPool + wherever
// each item is currently placed (see game.js's momenPhai()).
function tinhMomen(objects) {
    return objects.reduce((sum, o) => sum + o.weight * o.distance, 0);
}

function validateLevelDesign(level, index) {
    const { plankDistances, leftObjects, rightPool, rightSolution } = level;

    if (typeof level.baseScore !== 'number' || Number.isNaN(level.baseScore)) {
        console.warn(`Game4 LEVELS[${index}] (${level.id}): "baseScore" thiếu hoặc không phải số (giá trị: ${level.baseScore}).`);
    }
    if (typeof level.parTime !== 'number' || Number.isNaN(level.parTime)) {
        console.warn(`Game4 LEVELS[${index}] (${level.id}): "parTime" thiếu hoặc không phải số (giá trị: ${level.parTime}).`);
    }
    if (typeof level.hintLimit !== 'number' || Number.isNaN(level.hintLimit) || level.hintLimit < 1) {
        console.warn(`Game4 LEVELS[${index}] (${level.id}): "hintLimit" phải là số >= 1 (giá trị: ${level.hintLimit}).`);
    }

    if (rightPool.length !== rightSolution.length) {
        console.warn(`Game4 LEVELS[${index}] (${level.id}): rightPool và rightSolution phải cùng độ dài.`);
    }

    const leftDistancesUsed = leftObjects.map(o => o.distance);
    if (new Set(leftDistancesUsed).size !== leftDistancesUsed.length) {
        console.warn(`Game4 LEVELS[${index}] (${level.id}): leftObjects có 2 vật trùng mốc khoảng cách.`);
    }
    leftObjects.forEach(o => {
        if (!plankDistances.includes(o.distance)) {
            console.warn(`Game4 LEVELS[${index}] (${level.id}): leftObjects dùng mốc ${o.distance} không có trong plankDistances.`);
        }
    });

    const solutionDistancesUsed = rightSolution.filter(d => d !== null);
    if (new Set(solutionDistancesUsed).size !== solutionDistancesUsed.length) {
        console.warn(`Game4 LEVELS[${index}] (${level.id}): rightSolution đặt 2 vật vào cùng 1 mốc.`);
    }
    solutionDistancesUsed.forEach(d => {
        if (!plankDistances.includes(d)) {
            console.warn(`Game4 LEVELS[${index}] (${level.id}): rightSolution dùng mốc ${d} không có trong plankDistances.`);
        }
    });

    const momenTrai = tinhMomen(leftObjects);
    const solvedRightObjects = rightPool
        .map((item, i) => ({ weight: item.weight, distance: rightSolution[i] }))
        .filter(o => o.distance !== null);
    const momenPhai = tinhMomen(solvedRightObjects);
    if (momenTrai !== momenPhai) {
        console.warn(`Game4 LEVELS[${index}] (${level.id}): rightSolution tính ra momenPhai=${momenPhai}, không khớp momenTrai=${momenTrai}.`);
    }
}

LEVELS.forEach(validateLevelDesign);
