/* App controller for Game4 - show rules -> start game -> end */
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    const game = new Game(onGameEnd);

    UI.showRulesOverlay();

    if (UI.els.btnConfirmRules) {
        UI.els.btnConfirmRules.addEventListener('click', () => {
            UI.hideRulesOverlay();
            game.startGame();
        });
    }

    function onGameEnd(playerData) {
        if (playerData.abandoned) {
            window.location.href = 'menu.html';
            return;
        }

        const title = playerData.isWin ? "🎉 CHÚC MỪNG! 🎉" : "KẾT THÚC";
        UI.showStats(title, playerData.levelsCompleted, LEVELS.length, playerData.score, playerData.timeElapsed, playerData.hintsUsed);
    }
});
