/**
 * Player Database & Leaderboard Manager
 * Mô phỏng chức năng của một Database thật bằng LocalStorage.
 * Được thiết kế theo dạng API để sau này dễ dàng chuyển sang Firebase/Supabase.
 */
class DatabaseManager {
    static DB_KEY = 'stem_mathrix_players';

    // Đọc tất cả user
    static getPlayers() {
        return JSON.parse(localStorage.getItem(this.DB_KEY)) || [];
    }

    // Lưu danh sách user
    static savePlayers(players) {
        localStorage.setItem(this.DB_KEY, JSON.stringify(players));
    }

    // Kiểm tra tính hợp lệ và duy nhất của tên
    static validateName(name) {
        const trimmed = name.trim();
        
        if (trimmed.length < 2) {
            return { valid: false, error: "Tên phải có ít nhất 2 ký tự." };
        }
        if (trimmed.length > 24) {
            return { valid: false, error: "Tên không được vượt quá 24 ký tự." };
        }
        
        // Kiểm tra trùng lặp (không phân biệt hoa thường)
        const players = this.getPlayers();
        const lowerName = trimmed.toLowerCase();
        const exists = players.some(p => p.playerName.toLowerCase() === lowerName);
        
        if (exists) {
            return { valid: false, error: "Tên này đã tồn tại, vui lòng nhập tên khác." };
        }
        
        return { valid: true, name: trimmed };
    }

    // Lưu điểm người chơi khi kết thúc game
    // Không lưu nếu người chơi thoát giữa chừng
    static savePlayerScore(playerData) {
        // playerData bao gồm: playerName, score, time, correctAnswers, hintsUsed
        const players = this.getPlayers();
        
        const newPlayer = {
            id: 'player_' + Date.now().toString(),
            playerName: playerData.playerName,
            highestScore: playerData.score,
            totalTime: playerData.time,
            totalCorrect: playerData.correctAnswers,
            totalHints: playerData.hintsUsed,
            gamesPlayed: 1, // Vì luật game yêu cầu tài khoản dùng 1 lần, nên luôn là 1
            createdAt: new Date().toISOString()
        };
        
        players.push(newPlayer);
        this.savePlayers(players);
        
        // Kiểm tra xem người này có lọt top 3 hay không
        const leaderboard = this.getLeaderboard();
        const rank = leaderboard.findIndex(p => p.id === newPlayer.id);
        const isTop3 = (rank >= 0 && rank < 3);
        
        return isTop3;
    }

    // Lấy top người chơi xuất sắc nhất
    static getLeaderboard(limit = 10) {
        const players = this.getPlayers();
        
        // Sắp xếp:
        // 1. Điểm cao nhất giảm dần
        // 2. Nếu bằng điểm, ai tốn ít thời gian hơn xếp trên
        // 3. Nếu bằng thời gian, ai dùng ít hint hơn xếp trên
        players.sort((a, b) => {
            if (b.highestScore !== a.highestScore) {
                return b.highestScore - a.highestScore;
            }
            if (a.totalTime !== b.totalTime) {
                return a.totalTime - b.totalTime;
            }
            return a.totalHints - b.totalHints;
        });
        
        return players.slice(0, limit);
    }

    // [TÍNH NĂNG ADMIN] Xóa một người chơi theo tên
    static deletePlayer(playerName) {
        let players = this.getPlayers();
        const lowerName = playerName.trim().toLowerCase();
        // Lọc bỏ người chơi có tên cần xóa
        const newPlayers = players.filter(p => p.playerName.toLowerCase() !== lowerName);
        this.savePlayers(newPlayers);
        return players.length !== newPlayers.length; // Trả về true nếu đã xóa thành công
    }

    // [TÍNH NĂNG ADMIN] Xóa toàn bộ dữ liệu bảng xếp hạng
    static clearAll() {
        localStorage.removeItem(this.DB_KEY);
    }
}
