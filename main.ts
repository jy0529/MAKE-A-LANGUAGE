import { FunctionBody, FunctionCall, FunctionDeclartion, Parser, Program } from "./parser";
import { CharStream, Tokenizer, TokenType } from "./tokenizer";

abstract class AstVisitor {
    visitProgram(prog: Program):any {
        let retVal: any;
        for(let x of prog.statements) {
            if (typeof (x as FunctionDeclartion).body === 'object') {
                retVal = this.visitFunctionDecl(x as FunctionDeclartion);
            } else {
                retVal = this.visitFunctionCall(x as FunctionCall);
            }
        }
    }
    visitFunctionDecl(functionDecl:FunctionDeclartion):any {
        return this.visitFunctionBody(functionDecl.body);
    }
    visitFunctionBody(functionBody:FunctionBody):any {
        let retVal:any;
        for(let x of functionBody.statements) {
            retVal = this.visitFunctionCall(x);
        }
        return retVal;
    }
    visitFunctionCall(functionCall: FunctionCall):any {
        return undefined;
    }
}

// 语义分析
// 函数引用消解

class RefResolver extends AstVisitor {
    prog: Program | null = null;
    visitProg(prog: Program):any {
        this.prog = prog;
        for(let x of prog.statements) {
            let functionCall = x as FunctionCall;
            if (typeof functionCall.parameters === 'object') {
                this.resolveFunctionCall(prog, functionCall);
            } else {
                this.visitFunctionDecl(x as FunctionDeclartion);
            }
        }
    }
    visitFunctionBody(functionBody: FunctionBody):any {
        if (this.prog !== null) {
            for(let x of functionBody.statements) {
                return this.resolveFunctionCall(this.prog, x);
            }
        }
    }

    private resolveFunctionCall(prog: Program, functionCall: FunctionCall) {
        let functionDecl = this.findFunctionDecl(prog, functionCall.name);
        if (functionDecl !== null) {
            functionCall.definition = functionDecl;
        } else {
            if (functionCall.name !== 'println') { // 系统函数
                console.log("cannot find definition of function " + functionCall.name);
            }
        }
    }
    private findFunctionDecl(prog: Program, name: string):FunctionDeclartion | null {
        for(let x of prog?.statements) {
            let functionDecl = x as FunctionDeclartion;
            if (typeof functionDecl.body === 'object' && functionDecl.name == name) {
                return functionDecl;
            }
        }
        return null;
    }
}

// 遍历AST，执行函数调用
class Intepretor extends AstVisitor {
    visitProg(prog:Program):any {
        let retVal:any;
        for(let x of prog.statements) {
            let functionCall = x as FunctionCall;
            if (typeof functionCall.parameters === 'object') {
                retVal = this.runFunction(functionCall);
            }
        };
        return retVal;
    }

    visitFunctionBody(functionBody: FunctionBody): any {
        let retVal: any;
        for(let x of functionBody.statements) {
            retVal = this.runFunction(x);
        }
        return retVal;
    }

    private runFunction(functionCall: FunctionCall) {
        if (functionCall.name === 'println') { // 内置函数
            if (functionCall.parameters.length > 0) {
                console.log(functionCall.parameters[0]);
            } else {
                console.log()
            }
            return 0;
        } else {
            if (functionCall.definition !== null) {
                this.visitFunctionBody(functionCall.definition.body);
            }
        }
    }
}

// 主程序

function compileAndRun(program: string) {
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
    let prog:Program = new Parser(tokenizer).parseProgram();
    console.log("\n语法分析后的AST: ");
    prog.dump("");

    // 语义分析
    new RefResolver().visitProg(prog);
    console.log("\n语法分析后的AST, 自定义函数的调用已被消解:");
    prog.dump("");

    // 运行程序
    console.log("\n运行程序:");
    let retVal = new Intepretor().visitProg(prog);
    console.log("程序返回值: " + retVal);
}