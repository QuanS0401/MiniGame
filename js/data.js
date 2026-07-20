const LEVELS = [
    // EASY
    { group: "Easy", target: 24, numbers: [6, 6, 6, 6], hint: "Thử cộng cả 4 số.", hintStep: ["6", "+", "6"], fullSolution: ["6", "+", "6", "+", "6", "+", "6"] },

    // MEDIUM
    { group: "Medium", target: 20, numbers: [2, 2, 5, 5], hint: "phép nhân cơ bản", hintStep: ["5", "*", "2"], fullSolution: ["5", "*", "2", "+", "5", "*", "2"] },
    { group: "Medium", target: 9, numbers: [9, 2, 6, 3], hint: "chỉ là phép tính đơn giản giữa nhân và chia", hintStep: ["9", "*", "6"], fullSolution: ["9", "*", "6", "/", "3", "/", "2"] }, // 9 * 6 / 3 / 2
    
    // HARD
    { group: "Hard", target: 24, numbers: [10, 10, 4, 4], hint: "tạo ra số lớn trước rồi trừ đi", hintStep: ["(", "10", "*", "10", "-", "4", ")"], fullSolution: ["(", "10", "*", "10", "-", "4", ")", "/", "4"] }, // (10 * 10 - 4) / 4
    { group: "Hard", target: 30, numbers: [5, 5, 5, 5], hint: "Có thể ghép 2 số lại rồi trừ.", hintStep: ["5", "5"], fullSolution: ["5", "5", "-", "5", "*", "5",] },
    { group: "Hard", target: 5, numbers: [6, 4, 3, 3], hint: "tạo ra số 2 trước có thể hữu ích", hintStep: ["(" ,"3", "/", "6" ,")"], fullSolution: ["(", "3", "/", "6", ")", "*", "4", "+", "3"] }, // 4 * (3/6) + 3

    // SUPER HARD
    { group: "Super Hard", target: 9, numbers: [4, 3, 3, 4], hint: "hãy tạo ra 1 phân số với 3 và 4", hintStep: ["(", "3", "-", "3", "/", "4", ")"], fullSolution: ["(", "3", "-", "3", "/", "4", ")", "*", "4"] }, // 4 * (3 - 3/4)
    { group: "Super Hard", target: 36, numbers: [3, 8, 4, 3], hint: "phép cộng hoặc trừ có thể kết hợp để tạo ra 1 số hữu ích", hintStep: ["(", "8", "-", "4", ")"], fullSolution: ["(", "8", "-", "4", ")", "*", "3", "*", "3"] }, // (8-4) * (3*3)
    { group: "Super Hard", target: 36, numbers: [3, 6, 3, 6], hint: "hãy thử tạo ra số 1 bằng phép chia", hintStep: ["(", "6", "*", "6", "/", "3", ")"], fullSolution: ["(", "6", "*", "3", "/", "3", ")", "*", "3"] }, // 6 * (6 * 3/3)
    { group: "Super Hard", target: 3636, numbers: [3, 10, 6, 1], hint: "thử ghép 4 số thành 2 số khác nhau rồi nhân với nhau", hintStep: ["3", "6"], fullSolution: ["3", "6", "*", "10", "1"] } // 36 * 101
];
