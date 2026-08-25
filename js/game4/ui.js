/* UI Manager for Game4 (Cầu Cân Bằng) — PhET "Balancing Act"-style plank.
   Rendering is a full redraw from state every time (renderBridge), same pattern as
   Game 3's renderBoard. Two independent interaction paths both end by calling the same
   `onDrop(itemIndex, distance|null)` callback (wired once from game.js to Game.datVat):
     - Pointer Events drag (pointerdown/pointermove/pointerup) — no HTML5 Drag API,
       since that API is unreliable on touch (mục 1 of game4-can-bang-cau-prompt_1.md).
     - Tap-tap fallback: tap a chip to select it (outline), tap an empty right plank-slot
       to drop it there, or tap the tray background to send a selected placed item back.

   pointerdown is delegated on the two containers that survive re-renders (#itemTray,
   #bridgeBoard) rather than bound per-chip, so a freshly rendered chip is always
   reachable without re-attaching anything. pointermove/pointerup/pointercancel are bound
   on `window` for the duration of a drag (not on the dragged chip itself) so they can
   never be silently lost to a DOM removal/reparent mid-drag — the single biggest source
   of a drag session getting permanently "stuck". */
const FALLBACK_MAX_TILT_DEG = 20; // only used if the pivot/ground/beam can't be measured for some reason
const DRAG_THRESHOLD_PX = 6;
const PLANK_SPREAD_PERCENT = 45; // how far the outermost mark sits from center, as % of the beam's own width
const SNAP_RADIUS_PX = 50; // drop/hover target = nearest plank-slot center within this radius — no need to hit the tick/number precisely

const UI = {
    els: {},
    selectedIndex: null,   // tap-tap: itemIndex currently "picked up", or null
    onDrop: null,           // (itemIndex, distance|null) => void — set once by game.js
    dragState: null,        // active pointer-drag session, or null
    lastLevel: null,
    lastPositions: null,

    init() {
        this.els = {
            bridgeBoard: document.getElementById('bridgeBoard'),
            seesawBeam: document.getElementById('seesawBeam'),
            seesawPivot: document.getElementById('seesawPivot'),
            boardGround: document.getElementById('boardGround'),
            supportStick: document.getElementById('supportStick'),
            itemTray: document.getElementById('itemTray'),
            levelName: document.getElementById('levelName'),
            levelBadge: document.getElementById('levelBadge'),
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
            btnConfirm: document.getElementById('btnConfirm'),
            btnRetry: document.getElementById('btnRetry'),
            btnQuit: document.getElementById('btnQuit'),
            btnCancelQuit: document.getElementById('btnCancelQuit'),
            btnConfirmQuit: document.getElementById('btnConfirmQuit')
        };

        // Stable bound references so window listeners added in onChipPointerDown can be
        // removed again with the exact same reference in onChipPointerUp.
        this._onWindowPointerMove = (e) => this.onChipPointerMove(e);
        this._onWindowPointerUp = (e) => this.onChipPointerUp(e);

        // Delegated on containers that persist across renders (only their innerHTML is
        // rebuilt) — never needs re-binding no matter how many times renderBridge runs.
        if (this.els.itemTray) {
            this.els.itemTray.addEventListener('pointerdown', (e) => this.onContainerPointerDown(e));
            this.els.itemTray.addEventListener('click', (e) => {
                if (e.target === this.els.itemTray) this.handleTrayBackgroundTap();
            });
        }
        if (this.els.bridgeBoard) {
            this.els.bridgeBoard.addEventListener('pointerdown', (e) => this.onContainerPointerDown(e));
            this.els.bridgeBoard.addEventListener('click', (e) => {
                // A tap on a chip itself is a selection tap (handled by onChipPointerUp's
                // !moved branch) — only an empty stretch of the slot completes a placement.
                if (e.target.closest('.tray-item')) return;
                const slot = e.target.closest('.plank-slot.slot-active');
                if (slot) this.handleSlotTap(Number(slot.dataset.distance));
            });
        }

        // The support stick's geometry is measured live off the beam/ground boxes (same
        // approach as computeMaxTiltDeg) — keep it correct across the responsive breakpoints.
        window.addEventListener('resize', () => {
            if (this.els.supportStick && !this.els.supportStick.classList.contains('hidden')) {
                this.positionSupportStick();
            }
        });
    },

    setDropHandler(fn) { this.onDrop = fn; },
    clearSelection() { this.selectedIndex = null; },

    materialIcon(type) {
        const file = MATERIAL_IMAGE_FILES[type];
        if (!file) return this.fallbackIcon(type); // no matching file at all — no point trying to load one

        const img = document.createElement('img');
        img.className = 'material-icon';
        img.src = `../images/game4/${encodeURIComponent(file)}`;
        img.alt = MATERIAL_NAMES[type];
        img.onerror = () => { img.replaceWith(this.fallbackIcon(type)); };
        return img;
    },

    fallbackIcon(type) {
        const fallback = document.createElement('div');
        fallback.className = 'material-icon material-icon-fallback';
        fallback.title = MATERIAL_NAMES[type];
        fallback.textContent = MATERIAL_NAMES[type]
            .split(/\s+/)
            .map(w => w[0])
            .join('')
            .slice(0, 3);
        return fallback;
    },

    createChip(type, weight, itemIndex, interactive) {
        const chip = document.createElement('div');
        chip.className = 'tray-item' + (interactive ? '' : ' locked');
        const w = document.createElement('span');
        w.className = 'chip-weight';
        w.textContent = `${weight} kg`;
        chip.appendChild(w); // weight label above the icon
        chip.appendChild(this.materialIcon(type));

        if (interactive) {
            chip.dataset.itemIndex = itemIndex; // read by the delegated pointerdown handler
            if (itemIndex === this.selectedIndex) chip.classList.add('selected');
        }
        return chip;
    },

    // --- Pointer Events drag (delegated + window-bound) ---------------------------

    onContainerPointerDown(e) {
        const chip = e.target.closest('.tray-item[data-item-index]');
        if (chip) this.onChipPointerDown(e, chip, Number(chip.dataset.itemIndex));
    },

    onChipPointerDown(e, chip, itemIndex) {
        if (this.dragState) return; // one drag session at a time
        e.preventDefault();
        // Capturing on <body> (never removed/reparented, unlike the chip itself) keeps
        // delivering move/up even if the pointer strays outside the browser viewport —
        // without tying capture to an element we might later move or discard mid-drag.
        try { document.body.setPointerCapture(e.pointerId); } catch (err) { /* not critical — window listeners still work without it */ }
        this.dragState = {
            itemIndex,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            width: chip.offsetWidth,
            height: chip.offsetHeight,
            moved: false,
            chip,
            hoverSlot: null
        };
        window.addEventListener('pointermove', this._onWindowPointerMove);
        window.addEventListener('pointerup', this._onWindowPointerUp);
        window.addEventListener('pointercancel', this._onWindowPointerUp);
    },

    onChipPointerMove(e) {
        const d = this.dragState;
        if (!d || e.pointerId !== d.pointerId) return;
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
            d.moved = true;
            // Escape any transformed ancestor (the seesaw-beam carries a live CSS
            // `transform: rotate(...)`, which would otherwise become this chip's
            // position:fixed containing block instead of the viewport, offsetting it
            // by a fixed amount from the pointer) so clientX/clientY map 1:1 to screen space.
            document.body.appendChild(d.chip);
            d.chip.classList.add('dragging');
            d.chip.style.position = 'fixed';
            d.chip.style.width = `${d.width}px`;
            d.chip.style.height = `${d.height}px`;
            d.chip.style.pointerEvents = 'none';
        }
        if (d.moved) {
            // Center the chip on the cursor every frame from absolute clientX/clientY —
            // no accumulated deltas, so it can't drift.
            d.chip.style.left = `${e.clientX - d.width / 2}px`;
            d.chip.style.top = `${e.clientY - d.height / 2}px`;
            const slot = this.findNearestSlot(e.clientX, e.clientY);
            if (slot !== d.hoverSlot) {
                if (d.hoverSlot) d.hoverSlot.classList.remove('drag-over');
                if (slot) slot.classList.add('drag-over');
                d.hoverSlot = slot;
            }
        }
    },

    // Snap-to-nearest: the drop target is whichever right-side plank-slot's CENTER is
    // closest to the pointer, as long as that distance is within SNAP_RADIUS_PX — no
    // need to land precisely on the tick/number. Uses getBoundingClientRect() per slot,
    // which already reflects the beam's current rotation, so this works correctly at any
    // tilt angle without any manual trigonometry.
    findNearestSlot(clientX, clientY) {
        const slots = document.querySelectorAll('.plank-slot.slot-active');
        let nearest = null;
        let nearestDist = Infinity;
        slots.forEach(slot => {
            const rect = slot.getBoundingClientRect();
            const dist = Math.hypot(clientX - (rect.left + rect.width / 2), clientY - (rect.top + rect.height / 2));
            if (dist < nearestDist) { nearestDist = dist; nearest = slot; }
        });
        return nearestDist <= SNAP_RADIUS_PX ? nearest : null;
    },

    onChipPointerUp(e) {
        const d = this.dragState;
        if (!d || e.pointerId !== d.pointerId) return;
        // Reset first, before any DOM work below that could theoretically throw — a
        // drag session must never be able to get stuck "active" and block future drags.
        this.dragState = null;
        window.removeEventListener('pointermove', this._onWindowPointerMove);
        window.removeEventListener('pointerup', this._onWindowPointerUp);
        window.removeEventListener('pointercancel', this._onWindowPointerUp);
        try { document.body.releasePointerCapture(e.pointerId); } catch (err) { /* already released/invalid — fine */ }
        if (d.hoverSlot) d.hoverSlot.classList.remove('drag-over');

        if (!d.moved) {
            this.handleChipTap(d.itemIndex);
            return;
        }

        const slot = this.findNearestSlot(e.clientX, e.clientY);
        d.chip.remove(); // discard the chip temporarily relocated to <body> for the drag — the resulting re-render builds a fresh one in its resting place
        if (slot) this.onDrop && this.onDrop(d.itemIndex, Number(slot.dataset.distance));
        else this.onDrop && this.onDrop(d.itemIndex, null);
    },

    // --- Tap-tap fallback -----------------------------------------------------------

    handleChipTap(itemIndex) {
        this.selectedIndex = this.selectedIndex === itemIndex ? null : itemIndex;
        if (this.lastLevel) this.renderBridge(this.lastLevel, this.lastPositions);
    },

    handleSlotTap(distance) {
        if (this.selectedIndex === null) return;
        const idx = this.selectedIndex;
        this.selectedIndex = null;
        this.onDrop && this.onDrop(idx, distance);
    },

    handleTrayBackgroundTap() {
        if (this.selectedIndex === null) return;
        const idx = this.selectedIndex;
        this.selectedIndex = null;
        this.onDrop && this.onDrop(idx, null);
    },

    // --- Rendering --------------------------------------------------------------

    // Every plank-slot is position:absolute inside the beam, placed at a `left`
    // percentage computed from its distance (see PLANK_SPREAD_PERCENT) — the beam's own
    // box stays a fixed-size CSS rectangle no matter how many items are on it, so its
    // rotation center never drifts (mục 2 of the v2 bugfix prompt).
    renderBridge(level, rightPositions) {
        this.lastLevel = level;
        this.lastPositions = rightPositions;

        const beam = this.els.seesawBeam;
        const tray = this.els.itemTray;
        if (!beam || !tray) return;

        beam.innerHTML = '';
        tray.innerHTML = '';

        const distances = [...level.plankDistances].sort((a, b) => a - b);
        const maxDistance = Math.max(...distances);

        distances.forEach(d => {
            const slot = document.createElement('div');
            slot.className = 'plank-slot slot-locked';
            slot.style.left = `${50 - (d / maxDistance) * PLANK_SPREAD_PERCENT}%`;
            slot.dataset.distance = d;
            const leftObj = level.leftObjects.find(o => o.distance === d);
            if (leftObj) slot.appendChild(this.createChip(leftObj.type, leftObj.weight, undefined, false));
            slot.appendChild(this.plankTick());
            slot.appendChild(this.plankMark(d));
            beam.appendChild(slot);
        });

        distances.forEach(d => {
            const slot = document.createElement('div');
            slot.className = 'plank-slot slot-active';
            slot.style.left = `${50 + (d / maxDistance) * PLANK_SPREAD_PERCENT}%`;
            slot.dataset.distance = d;
            const itemIndex = rightPositions.findIndex(pos => pos === d);
            if (itemIndex !== -1) {
                const item = level.rightPool[itemIndex];
                slot.appendChild(this.createChip(item.type, item.weight, itemIndex, true));
            }
            slot.appendChild(this.plankTick());
            slot.appendChild(this.plankMark(d));
            beam.appendChild(slot);
        });

        level.rightPool.forEach((item, i) => {
            if (rightPositions[i] !== null) return; // đang đặt trên cầu, không hiện trong kho
            tray.appendChild(this.createChip(item.type, item.weight, i, true));
        });
    },

    plankTick() {
        const tick = document.createElement('span');
        tick.className = 'plank-tick';
        return tick;
    },

    plankMark(distance) {
        const mark = document.createElement('span');
        mark.className = 'plank-mark';
        mark.textContent = distance;
        return mark;
    },

    updateBridgeTilt(momenTrai, momenPhai, balanced) {
        const beam = this.els.seesawBeam;
        if (!beam) return;
        if (balanced) {
            beam.style.transform = 'translateX(-50%) rotate(0deg)';
            beam.classList.add('balanced');
            return;
        }
        beam.classList.remove('balanced');
        const maxTiltDeg = this.computeMaxTiltDeg();
        const ratio = momenTrai === 0 ? 0 : (momenPhai - momenTrai) / momenTrai;
        const deg = Math.max(-maxTiltDeg, Math.min(maxTiltDeg, ratio * maxTiltDeg));
        beam.style.transform = `translateX(-50%) rotate(${deg}deg)`;
    },

    // v12: forces the beam to a fixed left-tilt at its max angle (the same angle it would
    // naturally sit at with momenPhai=0, i.e. nothing placed on the right yet) regardless of
    // what's actually been placed — used while the bridge is "locked" (placing items)
    // instead of updateBridgeTilt(), so placing/removing materials never changes the beam's
    // angle in real time. Negative matches updateBridgeTilt()'s own sign convention: there,
    // ratio = (momenPhai - momenTrai) / momenTrai goes to -1 (deg = -maxTiltDeg) exactly when
    // momenPhai is 0, so this is that same resting-left pose held fixed.
    // v13: this snap to the lock angle must be INSTANT, not animated — only updateBridgeTilt()
    // (the real angle after "Xác nhận") should animate along .seesaw-beam's 0.7s transition.
    // Toggling .snap-instant off/on around the transform write (with a forced reflow via
    // offsetWidth in between so the browser actually applies transition:none before it's
    // removed) suppresses the transition for just this one write.
    lockBridgeVisual() {
        const beam = this.els.seesawBeam;
        if (!beam) return;
        const maxTiltDeg = this.computeMaxTiltDeg();
        const target = `translateX(-50%) rotate(${-maxTiltDeg}deg)`;
        if (beam.style.transform === target) {
            // Already at the lock angle (e.g. re-rendering mid drag-and-drop) — nothing to snap.
            beam.classList.remove('balanced');
            return;
        }
        beam.classList.add('snap-instant');
        beam.style.transform = target;
        void beam.offsetWidth; // force reflow so the instant snap applies before the class comes off
        beam.classList.remove('snap-instant');
        beam.classList.remove('balanced');
    },

    // v9/v12: the stick's footprint spans exactly between the right side's 1.75 and 2 plank
    // marks — the SAME coordinate system used to place materials (each plank-slot is
    // centered via `left: X%` + `transform: translate(-50%, -100%)`, so a slot's
    // bounding-box center is that mark's true x-position regardless of its current
    // width/contents). Since v12, the locked angle is a fixed max-left-tilt (not 0deg), so
    // the beam's own axis-aligned getBoundingClientRect().bottom no longer means anything at
    // the 1.75/2 marks specifically (it reflects the LOWEST point of the whole tilted beam,
    // i.e. its left end near the ground) — instead we derive the underside height from the
    // slots themselves: each slot's own bottom edge sits flush on the beam's TOP surface at
    // that mark (see .plank-slot's `top:0; transform: translate(-50%,-100%)` in game4.css),
    // and since it's a DOM child of the rotated beam it rotates right along with it, so
    // outerRect.bottom/innerRect.bottom already give the beam's top surface in screen space
    // at the tilted angle. Add the beam's true (unrotated) thickness via offsetHeight — which
    // rotate() never changes — to get the underside at that x position. Only valid while the
    // beam is at its locked angle (i.e. while locked) — that's the only time this is called.
    positionSupportStick() {
        const board = this.els.bridgeBoard;
        const beam = this.els.seesawBeam;
        const ground = this.els.boardGround;
        const stick = this.els.supportStick;
        if (!board || !beam || !ground || !stick) return;

        const boardRect = board.getBoundingClientRect();
        const groundRect = ground.getBoundingClientRect();
        const beamThickness = beam.offsetHeight; // true thickness, unaffected by rotate()

        const slotOuter = beam.querySelector('.plank-slot.slot-active[data-distance="2"]');
        const slotInner = beam.querySelector('.plank-slot.slot-active[data-distance="1.75"]');

        let leftPx, widthPx, undersideY;
        if (slotOuter && slotInner) {
            const outerRect = slotOuter.getBoundingClientRect();
            const innerRect = slotInner.getBoundingClientRect();
            const centerOuter = outerRect.left + outerRect.width / 2;
            const centerInner = innerRect.left + innerRect.width / 2;
            leftPx = Math.min(centerOuter, centerInner) - boardRect.left;
            widthPx = Math.max(20, Math.abs(centerOuter - centerInner));
            // Take the lower (more ground-ward) of the two marks so the stick's top always
            // meets the beam's underside with no gap across its whole footprint.
            undersideY = Math.max(outerRect.bottom, innerRect.bottom) + beamThickness;
        } else {
            // Fallback if a level's plankDistances somehow lack 1.75/2 — prop the beam's own right end.
            const beamRect = beam.getBoundingClientRect();
            leftPx = beamRect.right - boardRect.left - 40;
            widthPx = 40;
            undersideY = beamRect.bottom;
        }

        stick.style.left = `${leftPx}px`;
        stick.style.width = `${widthPx}px`;
        stick.style.bottom = `${boardRect.bottom - groundRect.top}px`;
        stick.style.height = `${Math.max(0, groundRect.top - undersideY)}px`;
    },

    showSupportStick() {
        if (!this.els.supportStick) return;
        this.positionSupportStick();
        this.els.supportStick.classList.remove('hidden');
    },

    hideSupportStick() {
        if (!this.els.supportStick) return;
        this.els.supportStick.classList.add('hidden');
    },

    showRetryButton() { if (this.els.btnRetry) this.els.btnRetry.classList.remove('hidden'); },
    hideRetryButton() { if (this.els.btnRetry) this.els.btnRetry.classList.add('hidden'); },

    // Real geometry, measured live off the DOM (not hard-coded) — the beam may only tilt
    // until one end touches the ground, exactly like the PhET reference:
    //   L = half the beam's true unrotated length (offsetWidth ignores any current
    //       CSS transform, unlike getBoundingClientRect(), which would return an
    //       inflated axis-aligned box once the beam is already rotated).
    //   H = px from the pivot's apex (its rendered box's top edge, since the CSS
    //       border-triangle's apex is the topmost point of its border box) down to the
    //       ground surface (.board-ground's top edge).
    //   thetaMax = asin(H / L) — the angle at which the beam's end just reaches the ground.
    computeMaxTiltDeg() {
        const beam = this.els.seesawBeam;
        const pivot = this.els.seesawPivot;
        const ground = this.els.boardGround;
        if (!beam || !pivot || !ground) return FALLBACK_MAX_TILT_DEG;

        const L = beam.offsetWidth / 2;
        if (L <= 0) return 0;

        const H = ground.getBoundingClientRect().top - pivot.getBoundingClientRect().top;
        if (H <= 0) return FALLBACK_MAX_TILT_DEG;
        if (H >= L) return 90; // guard against Math.asin() domain error (NaN) — see fix v4 mục 2

        return Math.asin(H / L) * (180 / Math.PI);
    },

    setHintEnabled(enabled) { if (this.els.btnHint) this.els.btnHint.disabled = !enabled; },
    setConfirmEnabled(enabled) { if (this.els.btnConfirm) this.els.btnConfirm.disabled = !enabled; },

    updateLevelInfo(level, currentLevel, totalLevels) {
        if (this.els.levelName) this.els.levelName.textContent = `${level.difficulty} - Màn ${currentLevel}`;
        if (this.els.levelBadge) {
            this.els.levelBadge.textContent = `LEVEL: ${level.difficulty.toUpperCase()}`;
            this.els.levelBadge.className = `level-badge badge-${level.difficulty.toLowerCase().replace(' ', '')}`;
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

    showLevelTransition(difficulty) {
        if (!this.els.levelBanner) return;
        this.els.levelBanner.textContent = `LEVEL: ${difficulty.toUpperCase()}`;
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
        if (this.els.statsMessage) this.els.statsMessage.innerHTML = 'Bạn đã hoàn thành toàn bộ thử thách Cầu Cân Bằng!';
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
