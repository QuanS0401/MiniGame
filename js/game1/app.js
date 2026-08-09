/* App controller for Game1 - simplified flow: show rules -> start game -> end */
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    const game = new Game(onGameEnd);

    // Show rules before starting
    UI.showRulesOverlay();

    // Confirm rules -> start game immediately
    if (UI.els.btnConfirmRules) {
        UI.els.btnConfirmRules.addEventListener('click', () => {
            UI.hideRulesOverlay();
            UI.showGamePage();
            game.startGame();
        });
    }

    // btnGoHome returns to menu
    if (UI.els.btnGoHome) {
        UI.els.btnGoHome.addEventListener('click', () => {
            window.location.href = 'menu.html';
        });
    }

    function onGameEnd(playerData) {
        if (playerData.abandoned) {
            // Go back to menu
            window.location.href = 'menu.html';
            return;
        }

        const title = playerData.isWin ? "🎉 CHÚC MỪNG! 🎉" : "KẾT THÚC";
        UI.showStats(title, playerData.time, playerData.correctAnswers, playerData.hintsUsed, playerData.score);
    }
});
