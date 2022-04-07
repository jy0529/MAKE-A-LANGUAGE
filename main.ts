import { AstVisitor, Block, FunctionCall, FunctionDecl, Prog, Variable, VariableDecl } from "./ast";
import { Parser } from "./parser";
import { Enter, RefResolver, SymTable } from "./semantic";
import { CharStream, Tokenizer, TokenType } from "./tokenizer";

// 遍历AST，执行函数调用
class Interpreter extends AstVisitor {
    // 存储变量值的区域
    values: Map<string, any> = new Map();

    visitFunctionDecl(functionDecl: FunctionDecl) {
        // nothing to do1
    }

    /**
     * 运行函数调用
     * 原理：根据函数定义，执行其函数体
     * @param functionCall 
     */
    visitFunctionCall(functionCall: FunctionCall): any {
        if (functionCall.name === 'println') {
            if (functionCall.parameters.length > 0) {
                let retVal = this.visit(functionCall.parameters[0]);
                if (typeof (retVal as LeftValue).variable == 'object') {
                    retVal = this.getVariableValue((retVal as LeftValue).variable.name);
                }
                console.log(retVal);
            } else {
                console.log();
            }
            return 0;
        } else {
            if (functionCall.decl !== null) {
                this.visitBlock(functionCall.decl.body);
            }
        }
    }

    /**
     * 变量声明
     * 如果存在变量初始化部分，要存变量值
     * @param variableDecl 
     */
    visitVariableDecl(variableDecl: VariableDecl) {
        if (variableDecl.init != null) {
            let v = this.visit(variableDecl.init);
            if (this.isLeftValue(v)) {
                v = this.getVariableValue((v as LeftValue).variable.name);
            }
            this.setVariableValue(variableDecl.name, v);
            return v;
        }
    }

    /**
     * 获取变量的值
     * @param v 
     * @returns 
     */
    visitVariable(v: Variable): any {
        return new LeftValue(v);
    }

    private getVariableValue(varName: string): any {
        return this.values.get(varName);
    }

    private setVariableValue(varName: string, value: any) {
        return this.values.set(varName, value);
    }

    private isLeftValue(v: any): boolean {
        return typeof (v as LeftValue).variable == 'object';
    }
}

class LeftValue {
    variable: Variable;
    constructor(variable: Variable) {
        this.variable = variable;
    }
}

// 主程序

export function compileAndRun(program: string) {
    console.log('源代码: ');
    console.log(program);

    console.log("\n词法分析结果:");
    let tokenizer = new Tokenizer(new CharStream(program));
    while(tokenizer.peek().type !== TokenType.EOF) {
        console.log(tokenizer.next());
    }
    // 重置
    tokenizer = new Tokenizer(new CharStream(program));

    // 语法分析
    let prog:Prog = new Parser(tokenizer).parseProgram();
    console.log("\n语法分析后的AST: ");
    prog.dump("");

    // 语义分析
    let symTable = new SymTable();
    new Enter(symTable).visit(prog);
    new RefResolver(symTable).visit(prog);
    console.log("\n语法分析后的AST, 自定义函数的调用已被消解:");
    prog.dump("");

    // 运行程序
    console.log("\n运行程序:");
    let retVal = new Interpreter().visit(prog);
    console.log("程序返回值: " + retVal);
}