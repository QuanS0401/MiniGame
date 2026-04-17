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
    
    // Gán sự kiện cơ bản ở trang chủ
    UI.els.btnStartGame.addEventListener('click', handleStartGame);
    UI.els.btnGoHome.addEventListener('click', backToHome);
    UI.els.btnQuitGame.addEventListener('click', handleQuitGame);

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

        // Tên hợp lệ, bắt đầu game
        UI.showNameError('');
        UI.showGamePage(validation.name);
        game.startGame(validation.name);
    }

    function handleQuitGame() {
        if(confirm("Bạn có chắc muốn thoát? Tiến trình hiện tại sẽ bị hủy và không được lưu vào Bảng xếp hạng.")) {
            game.quitGame();
            backToHome();
        }
    }

    function onGameEnd(playerData) {
        // Lưu dữ liệu vào DB (LocalStorage)
        const isTop3 = DatabaseManager.savePlayerScore(playerData);
        
        // Cập nhật lại Bảng xếp hạng cho trang chủ
        loadLeaderboard();
        
        // Hiển thị màn hình chiến thắng / thống kê
        const title = playerData.isWin ? "<span class='icon-party flip'>🎉</span> <span>PHÁ ĐẢO THÀNH CÔNG</span> <span class='icon-party'>🎉</span>" : "HOÀN THÀNH";
        UI.showStats(title, playerData.time, playerData.correctAnswers, playerData.hintsUsed, playerData.score, isTop3);
    }

    function backToHome() {
        UI.showHomePage();
    }
});
