/**
 * App Controller
 * Quản lý vòng đời ứng dụng, từ Homepage -> Game -> Kết thúc Game.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo UI
    UI.init();
    
    // 2. Tải Bảng xếp hạng lên trang chủ
    loadLeaderboard();

    // 3. Khởi tạo đối tượng Game
    const game = new Game(onGameEnd);
    let pendingPlayerName = '';
    let winAutoRedirectTimer = null;
    
    // Gán sự kiện cơ bản ở trang chủ
    UI.els.btnStartGame.addEventListener('click', handleStartGame);
    UI.els.btnConfirmRules.addEventListener('click', confirmRulesAndStartGame);
    UI.els.btnGoHome.addEventListener('click', () => backToHome(true));

    // Xử lý chuyển tab ở trang chủ
    UI.els.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            UI.switchTab(btn.dataset.target);
            if (btn.dataset.target === 'tab-leaderboard') {
                loadLeaderboard();
            }
        });
    });

    // Bắt phím Enter trong ô nhập tên
    UI.els.playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleStartGame();
    });

    function loadLeaderboard() {
        const topPlayers = DatabaseManager.getLeaderboard(10);
        UI.renderLeaderboard(topPlayers);
    }

    function handleStartGame() {
        const nameInput = UI.els.playerNameInput.value;
        const validation = DatabaseManager.validateName(nameInput);
        
        if (!validation.valid) {
            UI.showNameError(validation.error);
            return;
        }

        pendingPlayerName = validation.name;
        UI.showNameError('');
        UI.showHomePage('tab-play');
        UI.showRulesOverlay();
    }

    function confirmRulesAndStartGame() {
        if (!pendingPlayerName) {
            return;
        }

        UI.hideRulesOverlay();
        UI.showGamePage(pendingPlayerName);
        game.startGame(pendingPlayerName);
        pendingPlayerName = '';
    }

    function onGameEnd(playerData) {
        if (playerData.abandoned) {
            UI.showHomePage('tab-play');
            return;
        }

        // Lưu dữ liệu vào DB (LocalStorage)
        const isTop3 = DatabaseManager.savePlayerScore(playerData);
        
        // Cập nhật lại Bảng xếp hạng cho trang chủ
        loadLeaderboard();
        
        // Hiển thị màn hình chiến thắng / thống kê
        const title = playerData.isWin ? "<span class='icon-party flip'>🎉</span> <span>CHÚC MỪNG!</span> <span class='icon-party'>🎉</span>" : "HOÀN THÀNH";
        UI.showStats(title, playerData.time, playerData.correctAnswers, playerData.hintsUsed, playerData.score, isTop3);

        if (playerData.isWin) {
            clearTimeout(winAutoRedirectTimer);
            winAutoRedirectTimer = setTimeout(() => {
                backToHome(false);
            }, 3000);
        }
    }

    function backToHome(refreshLeaderboard = true) {
        clearTimeout(winAutoRedirectTimer);
        if (refreshLeaderboard) {
            loadLeaderboard();
        }
        UI.showHomePage('tab-leaderboard');
        loadLeaderboard();
    }
});
