// =============The real programming lang (no js): asanalinskiy.github.com/SourceCode-Asanali.Script============================
// =========================The framework: asanalinskiy.github.com/AsanaliScript.js=============================================
// ============================install the framwork: npm install asanaliscript==================================================
// ===========================AsanaliScript to JS compiled me... Gemini Google! (surprise)======================================
// Warning: The author is from kazakhstan and his russian speak. Im not english. 😈


const fs = require('fs');
const path = require('path');

class AScriptBridge {
    constructor() {
        this.db = {};
    }

    save_data(key, value) {
        this.db[key] = value;
        return `[database] Сохранено: ${key}`;
    }

    get_data(key) {
        return this.db[key] !== undefined ? this.db[key] : "Не найдено";
    }
}

class AScriptInterpreter {
    constructor(outputCallback = console.log) {
        this.variables = { 'User': 'Guest' };
        this.lines = [];
        this.current_line = 0;
        this.bridge = new AScriptBridge();
        this.output = outputCallback; 
    }

    replace_variables(text) {
        let res = text;
        for (let [varName, varVal] of Object.entries(this.variables)) {
            res = res.split(`$${varName}`).join(varVal);
        }
        return res;
    }

    evaluate_condition(condition_str) {
        condition_str = this.replace_variables(condition_str);
        if (condition_str.includes("==")) {
            let [left, right] = condition_str.split("==");
            return left.trim().replace(/['"]/g, "") === right.trim().replace(/['"]/g, "");
        }
        if (condition_str.includes("!=")) {
            let [left, right] = condition_str.split("!=");
            return left.trim().replace(/['"]/g, "") !== right.trim().replace(/['"]/g, "");
        }
        return false;
    }

    skip_block() {
        let brace_count = 0;
        while (this.current_line < this.lines.length) {
            let line = this.lines[this.current_line].trim();
            if (line.includes("{")) {
                brace_count += (line.match(/{/g) || []).length;
            }
            if (line.includes("}")) {
                brace_count -= (line.match(/}/g) || []).length;
                if (brace_count <= 0) {
                    this.current_line += 1;
                    break;
                }
            }
            this.current_line += 1;
        }
    }

    execute_block_content(end_trigger = "}") {
        let block_lines = [];
        let brace_count = 1;
        while (this.current_line < this.lines.length) {
            let line = this.lines[this.current_line];
            let clean_line = line.trim();
            
            if (clean_line.includes("{")) {
                brace_count += (clean_line.match(/{/g) || []).length;
            }
            if (clean_line.includes(end_trigger)) {
                brace_count -= (clean_line.match(new RegExp(end_trigger, 'g')) || []).length;
                if (brace_count === 0) {
                    this.current_line += 1;
                    break;
                }
            }
            block_lines.push(line);
            this.current_line += 1;
        }
        return block_lines.join("\n");
    }

    run_code(code_text) {
        this.lines = code_text.split("\n");
        this.current_line = 0;

        while (this.current_line < this.lines.length) {
            let line = this.lines[this.current_line];
            let clean_line = line.trim();

            if (!clean_line || clean_line.startsWith("//") || clean_line.startsWith("/*")) {
                this.current_line += 1;
                continue;
            }

            if (clean_line.startsWith("echo ")) {
                this.output(this.replace_variables(clean_line.substring(5).trim()));
                this.current_line += 1;
            }
            else if (clean_line.startsWith("let ")) {
                let match = clean_line.match(/let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)/);
                if (match) {
                    let var_name = match[1];
                    let var_value = match[2].trim().replace(/['"]/g, "");
                    this.variables[var_name] = this.replace_variables(var_value);
                }
                this.current_line += 1;
            }
            else if (clean_line.startsWith("if ")) {
                let match = clean_line.match(/if\s+(.*)\s*\{/);
                if (match) {
                    let condition = match[1];
                    this.current_line += 1;
                    if (this.evaluate_condition(condition)) {
                        continue;
                    } else {
                        this.skip_block();
                        if (this.current_line < this.lines.length && this.lines[this.current_line].includes("else")) {
                            this.current_line += 1;
                            this.skip_block();
                        }
                    }
                } else {
                    this.current_line += 1;
                }
            }
            else if (clean_line.startsWith("else")) {
                this.current_line += 1;
                this.skip_block();
            }
            else if (clean_line.startsWith("database(")) {
                this.current_line += 1;
                this.execute_block_content(")");
                this.output("[aScript DB] База данных инициализирована.");
            }
            else if (clean_line === "show sys.info") {
                this.output(`\n--- Asanali Script System Info ---\nUser: ${this.variables['User']}\nOS: PureJS-Core\n`);
                this.current_line += 1;
            }
            else {
                this.current_line += 1;
            }
        }
    }
}

// Автоматический поиск и запуск внешнего файла при вызове через консоль
if (typeof require !== 'undefined' && require.main === module) {
    const interpreter = new AScriptInterpreter();
    
    // Передаем имя файла аргументом (node app.js test.asc.js) или ищем по умолчанию test.asc.js
    const targetFile = process.argv[2] || 'test.asc.js';
    const filePath = path.resolve(process.cwd(), targetFile);

    if (fs.existsSync(filePath)) {
        const externalCode = fs.readFileSync(filePath, 'utf-8');
        interpreter.run_code(externalCode);
    } else {
        console.log(`Ошибка: Файл ${targetFile} не найден в текущей директории.`);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AScriptInterpreter };
} else {
    window.AScriptInterpreter = AScriptInterpreter;
}