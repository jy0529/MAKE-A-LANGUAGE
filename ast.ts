import { Scope } from "./scope";
import { Position } from "./tokenizer";
import { SysTypes, Type } from "./types";

export abstract class AstNode {
    beginPos: Position; // 在源代码中的第一个 Token 的位置
    endPos: Position; // 在源代码中的最后一个 Token 的位置
    isErrorNode:boolean; // 是否是错误节点
    constructor(beginPos: Position, endPos: Position, isErrorNode:boolean) {
        this.beginPos = beginPos;
        this.endPos = endPos;
        this.isErrorNode = isErrorNode;
    }
    public abstract accept(visitor: AstVisitor, additional: any): any;
}

export abstract class Statement extends AstNode {

}

export abstract class Decl extends AstNode {
    name: string;
    constructor(name: string, beginPos: Position, endPos: Position, isErrorNode:boolean) {
        super(beginPos, endPos, isErrorNode);
        this.name = name;
    }
}

export class FunctionDecl extends Decl {
    callSignature: CallSignature;
    body: Block;
    scope:Scope|null=null;
    constructor(beginPos:Position, name: string, body: Block, isErrorNode:boolean) {
        super(name, beginPos, body.endPos, isErrorNode);
        this.body = body;
    }
    public accept(visitor: AstVisitor): any {
        return visitor.visitFunctionDecl(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + "FunctionDecl " + this.name);
    }
}

export class CallSignature extends AstNode {
    paramList: ParameterList | null;
    theType: Type; // 返回值类型
    constructor(beginPos: Position, endPos: Position, paramList: ParameterList | null, theType: Type, isErrorNode:boolean) {
        super(beginPos, endPos, isErrorNode);
        this.paramList = paramList;
        this.theType = theType;
    }
    public accept(visitor: AstVisitor, additional: any): any {
        return visitor.visitCallSignature(this, additional);
    }
}

export class ParameterList extends AstNode {
    params: VariableDecl[];
    constructor(beginPos: Position, endPos: Position, params: VariableDecl[], isErrorNode:boolean) {
        super(beginPos, endPos, isErrorNode);
        this.params = params;
    }
    public accept(visitor: AstVisitor, additional: any): any {
        return visitor.visitParameterList(this, additional);
    }
}

export class Block extends AstNode {
    stmts: Statement[];
    scope: Scope | null = null;
    constructor(beginPos: Position, endPos: Position, stmts: Statement[], isErrorNode:boolean) {
        super(beginPos, endPos, isErrorNode);
        this.stmts = stmts;
    }
    public accept(visitor: AstVisitor): any {
        return visitor.visitBlock(this);
    }
}

export class Prog extends Block {
    public accept(visitor: AstVisitor) {
        return visitor.visitProg(this);
    }
}

/**
 * 变量声明语句
 */
export class VariableStatement extends Statement {
    variableDecl: VariableDecl;
    constructor(beginPos:Position, endPos: Position, variableDecl: VariableDecl, isErrorNode:boolean) {
        super(beginPos, endPos, isErrorNode);
        this.variableDecl = variableDecl;
    }
    public accept(visitor: AstVisitor, additional: any): any {
        return visitor.visitVariableStatement(this, additional);
    }
}
export class VariableDecl extends Decl {
    theType: string; // 变量类型
    init: Expression | null; // 变量初始化所使用的表达式
    inferredType: Type | null = null; // 推断出的类型
    constructor(beginPos: Position, endPos: Position, name: string, theType: string, init: Expression | null, isErrorNode:boolean) {
        super(name, beginPos, endPos, isErrorNode);
        this.theType = theType;
        this.init = init;
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitVariableDecl(this);
    }
}

export abstract class Expression extends AstNode {
    theType: Type | null = null; // 表达式的类型
    shouldBeLeftValue:boolean = false;
    isLeftValue:boolean = false;
    constValue:any = undefined;

    inferredType: Type| null = null;
}

// export class Binary extends Expression {
//     op: string;
//     exp1: Expression; // 左边的表达式
//     exp2: Expression; // 右边的表达式
//     constructor(op: string, exp1: Expression, exp2: Expression) {
//         super();
//         this.op = op;
//         this.exp1 = exp1;
//         this.exp2 = exp2;
//     }
//     public accept(visitor: AstVisitor): void {
//         return visitor.visitBinary(this);
//     }
// }

export class ExpressionStatement extends Statement {
    exp: Expression;
    constructor(endPos: Position, exp: Expression, isErrorNode:boolean) {
        super(exp.beginPos, endPos, isErrorNode);
        this.exp = exp;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitExpressionStatement(this);
    }
}
export class FunctionCall extends AstNode {
    name: string;
    parameters: Expression[];
    decl: FunctionDecl|null = null;
    constructor(beginPos:Position, endPos: Position, name: string, parameters: Expression[], isErrorNode: boolean) {
        super(beginPos, endPos, isErrorNode);
        this.name = name;
        this.parameters = parameters;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitFunctionCall(this);
    }
}

export class Variable extends Expression {
    name: string;
    decl: VariableDecl|null = null;
    constructor(beginPos: Position, endPos: Position, name: string, isErrorNode:boolean) {
        super(beginPos, endPos, isErrorNode);
        this.name = name;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitVariable(this);
    }
}

export class StringLiteral extends Expression {
    value: string;
    constructor(pos: Position, value: string, isErrorNode:boolean) {
        super(pos, pos, isErrorNode);
        this.value = value;
        this.theType = SysTypes.String;
        this.constValue = value;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitStringLiteral(this);
    }
}

export class IntegerLiteral extends Expression {
    value: number;
    constructor(pos:Position, value: number, isErrorNode:boolean) {
        super(pos, pos, isErrorNode);
        this.value = value;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitIntegerLiteral(this);
    }
}

export class DecimalLiteral extends Expression {
    value: number;
    constructor(pos: Position, value: number, isErrorNode:boolean) {
        super(pos, pos, isErrorNode);
        this.value = value;
        this.theType = SysTypes.Integer;
        this.constValue = value;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitDecimalLiteral(this);
    }
}

export class NullLiteral extends Expression {
    value: null = null;
    constructor(pos: Position, isErrorNode: boolean) {
        super(pos, pos, isErrorNode);
        this.theType = SysTypes.Null;
        this.constValue = this.value;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitNullLiteral(this);
    }
}

export class BooleanLiteral extends Expression {
    value: boolean;
    constructor(pos: Position, value: boolean, isErrorNode:boolean) {
        super(pos, pos, isErrorNode);
        this.value = value;
        this.theType = SysTypes.Boolean;
        this.constValue = this.value;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitBooleanLiteral(this);
    }
}

/**
 * Visitor
 */
export abstract class AstVisitor {
    visit(node: AstNode, additional:any = undefined):any {
        return node.accept(this, additional);
    }
    visitProg(prog:Prog, additional:any = undefined):any {
        return this.visitBlock(prog, additional);
    }

    visitVariableStatement(variableStmt: VariableStatement, additional:any=undefined) {
        return this.visit(variableStmt.variableDecl, additional);
    }

    visitVariableDecl(variableDecl: VariableDecl, additional:any=undefined):any {
        if (variableDecl.init != null) {
            return this.visit(variableDecl.init, additional);
        }
    }
    visitFunctionDecl(functionDecl: FunctionDecl, additional:any=undefined): any {
        this.visit(functionDecl.callSignature, additional);
        return this.visit(functionDecl.body, additional);
    }
    visitCallSignature(callSignature: CallSignature, additional:any=undefined):any {
        if (callSignature.paramList != null) {
            return this.visit(callSignature.paramList, additional);
        }
    }
    visitParameterList(paramList:ParameterList, additional:any=undefined):any {
        let retVal:any;
        for(let x of paramList.params) {
            retVal = this.visit(x, additional);
        }
        return retVal;
    }
    visitBlock(Block: Block, additional:any=undefined): any {
        let retVal: any;
        for(let x of Block.stmts) {
            retVal = this.visit(x, additional);
        }
        return retVal;
    }
    visitExpressionStatement(stmt: ExpressionStatement):any {
        return this.visit(stmt.exp);
    }
    // visitBinary(exp: Binary):any {
    //     this.visit(exp.exp1);
    //     this.visit(exp.exp2);
    // }
    visitIntegerLiteral(exp: IntegerLiteral):any {
        return exp.value;
    }
    visitDecimalLiteral(exp: DecimalLiteral):any {
        return exp.value;
    }
    visitStringLiteral(exp: StringLiteral): any {
        return exp.value;
    }
    visitNullLiteral(exp: NullLiteral): any {
        return exp.value;
    }
    visitBooleanLiteral(exp:BooleanLiteral): any {
        return exp.value;
    }
    visitVariable(variable: Variable): any {
        return undefined;
    }
    visitFunctionCall(functionCall: FunctionCall, additional:any=undefined): any {
        for(let param of functionCall.parameters) {
            this.visit(param, additional);
        }
        return undefined;
    }
}