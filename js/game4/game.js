// Game logic for Game4 (Cầu Cân Bằng — Balance Bridge)
// One seesaw, one pivot, a ruler of fixed distance marks (PhET "Balancing Act" style).
// Left side is locked (hand-designed per level, never changes mid-level). Right side is
// the player's live placement — rightPositions[i] is null (item i sitting in the tray)
// or the plank distance it's currently dropped on. datVat()/goVat() are the single
// placement entry point called by BOTH the pointer-drag flow and the tap-tap fallback in
// ui.js (mục 1, mục 7 of game4-can-bang-cau-prompt_1.md) — no duplicated placement logic.
//
// v8: the beam no longer tilts live while placing items. It stays visually locked flat
// (0deg, propped by .support-stick) until the player presses "Xác nhận" — only then does
// it animate to the real angle from live momenPhai vs. the level's fixed momenTrai and the
// win/wrong-placement check happens (see confirmPlacement()). A wrong confirm costs 50
// points (soLanDatSai) but never resets placement and never limits retries.
//
// v9: a wrong confirm no longer auto-restores the stick after a fixed hold — instead,
// after WRONG_RETRY_DELAY_MS the beam stays tilted and a "Thử lại" button appears; only
// clicking it (retryAfterWrong()) restores the stick and re-locks the beam flat.
// v13: CONFIRM_TILT_MS only gates the post-"Xác nhận" real-angle animation
// (updateBridgeTilt()) — how long to wait before checking win/loss and showing "Thử lại".
// lockBridgeVisual()'s lock-angle snap (level load / "Thử lại") is instant via
// .snap-instant in game4.css and does NOT wait on this constant.
const CONFIRM_TILT_MS = 750;        // matches .seesaw-beam's CSS transition (0.7s) + a small buffer
const WRONG_RETRY_DELAY_MS = 500;   // wait before showing "Thử lại", so the wrong tilt registers first

class Game {
    constructor(onGameEnd) {
        this.onGameEnd = onGameEnd;
        this.state = {
            currentLevelIndex: 0,
            level: null,
            momenTrai: 0,
            rightPositions: [],   // parallel to level.rightPool — null = in tray, else the distance mark it's on
            score: 0,
            timeElapsed: 0,
            levelElapsed: 0,
            hintsUsedTotal: 0,
            hintsUsedThisLevel: 0,
            soLanDatSai: 0,        // wrong "Xác nhận" presses this level — each one costs 50 points at completion
            levelsCompleted: 0,
            isPlaying: false,
            levelComplete: false,
            bridgeLocked: true,    // true = beam forced flat at 0deg, support stick shown
            confirming: false      // true while the post-"Xác nhận" tilt/hold animation is in flight
        };
        this.timerInterval = null;
        UI.setDropHandler((itemIndex, distance) => this.datVat(itemIndex, distance));
        this.bindEvents();
    }

    bindEvents() {
        UI.els.btnHint && (UI.els.btnHint.onclick = () => this.useHint());
        UI.els.btnConfirm && (UI.els.btnConfirm.onclick = () => this.confirmPlacement());
        UI.els.btnRetry && (UI.els.btnRetry.onclick = () => this.retryAfterWrong());
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
        const level = LEVELS[this.state.currentLevelIndex];
        const prevDifficulty = this.state.currentLevelIndex > 0 ? LEVELS[this.state.currentLevelIndex - 1].difficulty : null;

        this.state.level = level;
        this.state.momenTrai = tinhMomen(level.leftObjects);
        this.state.rightPositions = new Array(level.rightPool.length).fill(null);
        this.state.hintsUsedThisLevel = 0;
        this.state.soLanDatSai = 0;
        this.state.levelComplete = false;
        this.state.levelElapsed = 0;
        this.state.bridgeLocked = true;
        this.state.confirming = false;

        UI.setHintEnabled(true);
        UI.setConfirmEnabled(true);
        UI.hideRetryButton();
        UI.clearSelection();
        UI.updateLevelInfo(level, this.state.currentLevelIndex + 1, LEVELS.length);
        // v12/v13: the beam locks to a fixed max-left-tilt angle (not 0deg), but
        // lockBridgeVisual() snaps to it instantly (.snap-instant, no CSS transition) — so
        // the stick can be measured/shown right away, no need to wait out an animation.
        this.refresh();
        UI.showSupportStick();
        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.hintsUsedTotal);

        if (this.state.currentLevelIndex === 0 || prevDifficulty !== level.difficulty) {
            UI.showLevelTransition(level.difficulty);
        }
    }

    momenPhai() {
        const level = this.state.level;
        const placed = [];
        this.state.rightPositions.forEach((distance, i) => {
            if (distance !== null) placed.push({ weight: level.rightPool[i].weight, distance });
        });
        return tinhMomen(placed);
    }

    // Rebuilds the whole board from state (same full-redraw pattern as Game 3's
    // renderBoard). While the bridge is locked, placement never tilts or wins the level —
    // it just re-renders the tray/plank chips and forces the beam back to its fixed
    // max-left-tilt lock angle (v12). Real tilt + win/lose only happen inside
    // confirmPlacement(), which unlocks temporarily.
    refresh() {
        UI.renderBridge(this.state.level, this.state.rightPositions);
        if (this.state.bridgeLocked) UI.lockBridgeVisual();
    }

    // Single placement entry point (mục 7): distance === null moves the item back to the
    // tray; otherwise drops it on that plank mark, rejecting (no-op) if another item
    // already occupies that mark ("mỗi mốc chỉ chứa 1 vật"). Always re-renders — on a
    // rejected/no-op drop this is what snaps the dragged chip back to its resting spot.
    // Blocked while the post-"Xác nhận" tilt/hold animation is in flight (confirming) so a
    // placement can't sneak in mid-animation.
    datVat(itemIndex, distance) {
        if (this.state.levelComplete || this.state.confirming) { this.refresh(); return false; }

        const current = this.state.rightPositions[itemIndex];
        let changed = false;
        if (distance !== current) {
            if (distance === null) {
                this.state.rightPositions[itemIndex] = null;
                changed = true;
            } else {
                const occupantIndex = this.state.rightPositions.findIndex((pos, idx) => idx !== itemIndex && pos === distance);
                if (occupantIndex === -1) {
                    this.state.rightPositions[itemIndex] = distance;
                    changed = true;
                }
            }
        }

        this.refresh();
        return changed;
    }

    goVat(itemIndex) { return this.datVat(itemIndex, null); }

    // Bấm "Xác nhận": removes the support stick, unlocks the beam and animates it to the
    // real angle from live momenPhai vs. momenTrai. If that lands exactly balanced, the
    // level is won (handleWinLevel). Otherwise it's a wrong attempt: soLanDatSai++ (costs
    // 50 points at level completion, see tinhDiemMan's caller in handleWinLevel), placement
    // is left untouched, and the beam stays tilted — after WRONG_RETRY_DELAY_MS a "Thử lại"
    // button appears; only clicking it (retryAfterWrong()) restores the stick and re-locks
    // the beam to its fixed max-left-tilt (v12) so the player can adjust and try again —
    // unlimited attempts.
    confirmPlacement() {
        if (this.state.levelComplete || this.state.confirming) return;

        this.state.confirming = true;
        this.state.bridgeLocked = false;
        UI.setConfirmEnabled(false);
        UI.setHintEnabled(false);
        UI.hideSupportStick();
        UI.hideRetryButton();

        const momenTrai = this.state.momenTrai;
        const momenPhai = this.momenPhai();
        const balanced = momenPhai === momenTrai;
        UI.updateBridgeTilt(momenTrai, momenPhai, balanced);

        setTimeout(() => {
            if (balanced) {
                this.handleWinLevel();
                return;
            }

            this.state.soLanDatSai++;
            setTimeout(() => UI.showRetryButton(), WRONG_RETRY_DELAY_MS);
        }, CONFIRM_TILT_MS);
    }

    // Bấm "Thử lại" (only reachable after a wrong confirm's tilt is showing): hides the
    // retry button, restores the support stick and re-locks the beam to its fixed
    // max-left-tilt (v12) — placement/rightPositions are untouched, matching v8's
    // "giữ nguyên vị trí vật liệu".
    retryAfterWrong() {
        if (this.state.levelComplete) return;
        UI.hideRetryButton();
        this.state.bridgeLocked = true;
        this.state.confirming = false;
        UI.lockBridgeVisual();
        // v13: lockBridgeVisual() snaps to the lock angle instantly (.snap-instant, no CSS
        // transition), so the stick can be measured/shown right away — no setTimeout needed
        // (previously this waited out the old shared-transition animation, per fix v10/v12).
        UI.showSupportStick();
        UI.setConfirmEnabled(true);
        UI.setHintEnabled(true);
    }

    // Unlimited "Gợi ý": find one rightPool item whose current position differs from
    // rightSolution and snap it there (or back to the tray for a decoy). If the target
    // mark is currently occupied by a different (wrongly-placed) item, this hint press
    // just evicts that occupant to the tray first, freeing the mark for the next press —
    // still real progress, no compound state changes. No cap on repeated use — it just
    // erodes this level's score via tinhDiemMan() at completion.
    useHint() {
        if (this.state.levelComplete) return;
        const level = this.state.level;
        let target = -1;
        for (let i = 0; i < level.rightPool.length; i++) {
            if (this.state.rightPositions[i] !== level.rightSolution[i]) { target = i; break; }
        }
        if (target === -1) return; // already matches — datVat() would already have won

        const wantedDistance = level.rightSolution[target];
        if (wantedDistance !== null) {
            const occupantIndex = this.state.rightPositions.findIndex((pos, idx) => idx !== target && pos === wantedDistance);
            if (occupantIndex !== -1) {
                this.registerHintUse();
                this.datVat(occupantIndex, null);
                return;
            }
        }

        this.registerHintUse();
        this.datVat(target, wantedDistance);
    }

    registerHintUse() {
        this.state.hintsUsedThisLevel++;
        this.state.hintsUsedTotal++;
        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.hintsUsedTotal);
    }

    handleWinLevel() {
        this.state.levelComplete = true;
        this.state.confirming = false;
        this.state.levelsCompleted++;
        UI.setConfirmEnabled(false);
        UI.setHintEnabled(false);

        const level = this.state.level;
        const levelScore = tinhDiemMan(level.baseScore, level.hintLimit, this.state.hintsUsedThisLevel, level.id);
        const soLanDatSaiSafe = safeNumber(this.state.soLanDatSai, 0, 'soLanDatSai', level.id);
        const parTimeSafe = safeNumber(level.parTime, 0, 'parTime', level.id);
        const wrongPenalty = soLanDatSaiSafe * 50;
        const secondsOver = Math.max(0, this.state.levelElapsed - parTimeSafe);
        this.state.score += Math.max(0, levelScore - wrongPenalty - secondsOver);

        UI.updateStats(this.state.score, this.state.timeElapsed, this.state.hintsUsedTotal);
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
