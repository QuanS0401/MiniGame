/**
 * Parser an toàn để tính toán biểu thức toán học
 * Sử dụng thuật toán Shunting Yard (Ký pháp Ba Lan ngược)
 * Rất an toàn vì không sử dụng hàm eval() hay Function()
 */
class MathParser {
    static evaluate(expression) {
        try {
            const tokens = this.tokenize(expression);
            const postfix = this.toPostfix(tokens);
            const result = this.evaluatePostfix(postfix);
            
            // Kiểm tra kết quả hợp lệ (không phải NaN, Infinity)
            if (result === null || Number.isNaN(result) || !Number.isFinite(result)) {
                return null;
            }
            return result;
        } catch (e) {
            return null; // Bắt lỗi cú pháp hoặc chia cho 0
        }
    }

    // Bước 1: Tách chuỗi thành các mảng token (số và phép toán)
    static tokenize(expr) {
        const tokens = [];
        let num = "";
        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];
            if (char === ' ') continue; // Bỏ qua khoảng trắng
            
            if (/[0-9.]/.test(char)) {
                num += char; // Ghép các chữ số thành một số
            } else {
                if (num !== "") {
                    tokens.push(parseFloat(num));
                    num = "";
                }
                if ("+-*/()".includes(char)) {
                    tokens.push(char);
                }
            }
        }
        if (num !== "") tokens.push(parseFloat(num));
        return tokens;
    }

    // Hàm phụ: Kiểm tra độ ưu tiên của phép toán
    static precedence(op) {
        if (op === '+' || op === '-') return 1;
        if (op === '*' || op === '/') return 2;
        return 0;
    }

    // Bước 2: Chuyển Infix (A + B) sang Postfix (A B +)
    static toPostfix(tokens) {
        const output = [];
        const operators = [];
        
        for (let token of tokens) {
            if (typeof token === 'number') {
                output.push(token);
            } else if (token === '(') {
                operators.push(token);
            } else if (token === ')') {
                while (operators.length && operators[operators.length - 1] !== '(') {
                    output.push(operators.pop());
                }
                operators.pop(); // Xóa dấu '('
            } else {
                while (
                    operators.length && 
                    this.precedence(operators[operators.length - 1]) >= this.precedence(token)
                ) {
                    output.push(operators.pop());
                }
                operators.push(token);
            }
        }
        while (operators.length) {
            output.push(operators.pop());
        }
        return output;
    }

    // Bước 3: Tính toán từ biểu thức Postfix
    static evaluatePostfix(postfix) {
        const stack = [];
        for (let token of postfix) {
            if (typeof token === 'number') {
                stack.push(token);
            } else {
                const b = stack.pop();
                const a = stack.pop();
                
                if (a === undefined || b === undefined) throw new Error("Cú pháp lỗi");
                
                if (token === '+') stack.push(a + b);
                else if (token === '-') stack.push(a - b);
                else if (token === '*') stack.push(a * b);
                else if (token === '/') {
                    if (b === 0) throw new Error("Không thể chia cho 0");
                    stack.push(a / b);
                }
            }
        }
        if (stack.length !== 1) throw new Error("Cú pháp lỗi");
        return stack[0];
    }
}
