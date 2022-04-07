// 语义分析
// 函数引用消解

import { AstVisitor, Decl, FunctionCall, FunctionDecl, Prog, Variable, VariableDecl } from "./ast";

/*
 * 符号表
 * 保存变量、函数、类等的名称和它的类型、声明的位置(AST节点)
 */

export class SymTable {
    table: Map<string, Symbol> = new Map();
    enter(name: string, decl: Decl, symType: SymKind): void {
        this.table.set(name, new Symbol(name, decl, symType));
    }
    hasSymbol(name: string) {
        return this.table.has(name);
    }
    getSymbol(name: string): Symbol | null {
        return this.table.get(name) || null;
    }
}

class Symbol {
    name: string;
    decl: Decl;
    kind: SymKind;
    constructor(name: string, decl: Decl, symType: SymKind) {
        this.name = name;
        this.decl = decl;
        this.kind = symType;
    }
}
enum SymKind {
    Variable,
    Function,
    Class,
    Interface,
}

/**
 * 把符号加入符号表
 */
export class Enter extends AstVisitor {
    symTable: SymTable;
    constructor(symTable: SymTable) {
        super();
        this.symTable = symTable;
    }
    /**
     * 把函数声明加入符号表
     * @param functionDecl 
     */
    visitFunctionDecl(functionDecl: FunctionDecl): any {
        if (this.symTable.hasSymbol(functionDecl.name)) {
            console.log(`${functionDecl.name} has been declared`);
        }
        this.symTable.enter(functionDecl.name, functionDecl, SymKind.Function);
    }

    /**
     * 把变量声明加入符号表
     * @param variableDecl 
     */
    visitVariableDecl(variableDecl: VariableDecl) {
        if (this.symTable.hasSymbol(variableDecl.name)) {
            console.log(`${variableDecl.name} has been declared`);
        }
        this.symTable.enter(variableDecl.name, variableDecl, SymKind.Variable);
    }
}

// 语义分析
// 函数引用消解

export class RefResolver extends AstVisitor {
    symTable: SymTable;
    constructor(symTable: SymTable) {
        super();
        this.symTable = symTable;
    }

    /**
     * 消解函数引用
     * @param functionCall 
     */
    visitFunctionCall(functionCall: FunctionCall) {
        let symbol = this.symTable.getSymbol(functionCall.name);
        if (symbol != null && symbol.kind == SymKind.Function) {
            functionCall.decl = symbol.decl as FunctionDecl;
        } else {
            if (functionCall.name !== 'println') {
                console.log(`${functionCall.name} is not a function`);
            }
        }
    }

    /**
     * 消解变量引用
     * @param variable
     */
    visitVariable(variable: Variable) {
        let symbol = this.symTable.getSymbol(variable.name);
        if (symbol != null && symbol.kind == SymKind.Variable) {
            variable.decl = symbol.decl as VariableDecl;
        } else {
            console.log(`${variable.name} is not a variable`);
        }
    }
}