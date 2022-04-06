export abstract class AstNode {
    public abstract dump(prefix: string): void;
    public abstract accept(visitor: AstVisitor): void;
}

export abstract class Decl {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}

export class FunctionDecl extends Decl {
    body: Block;
    constructor(name: string, body: Block) {
        super(name);
        this.body = body;
    }
    public accept(visitor: AstVisitor): any {
        return visitor.visitFunctionDecl(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + "FunctionDecl " + this.name);
    }
}

export class Block extends AstNode {
    stmts: Statement[];
    constructor(stmts: Statement[]) {
        super();
        this.stmts = stmts;
    }
    public accept(visitor: AstVisitor): any {
        return visitor.visitBlock(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + "Block");
        this.stmts.forEach(x => x.dump(prefix + "  "));
    }
}

export class Prog extends Block {
    public accept(visitor: AstVisitor) {
        return visitor.visitProg(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + 'Prog');
        this.stmts.forEach(x => x.dump(prefix + "  "));
    }
}

export class VariableDecl extends Decl {
    varType: string; // 变量类型
    init: Expression | null; // 变量初始化所使用的表达式
    constructor(name: string, varType: string, init: Expression | null) {
        super(name);
        this.varType = varType;
        this.init = init;
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitVariableDecl(this);
    }
    
    public dump(prefix: string):void {
        console.log(prefix + "VariableDecl " + this.name + ", type: " + this.varType);
        if (this.init == null) {
            console.log(prefix + "no initialization.");
        } else {
            this.init.dump(prefix + "   ");
        }
    }
}

export abstract class Statement extends AstNode {

}

export abstract class Expression extends AstNode {}

export class Binary extends Expression {
    op: string;
    exp1: Expression; // 左边的表达式
    exp2: Expression; // 右边的表达式
    constructor(op: string, exp1: Expression, exp2: Expression) {
        super();
        this.op = op;
        this.exp1 = exp1;
        this.exp2 = exp2;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitBinary(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + "Binary: " + this.op);
        this.exp1.dump(prefix + "   ");
        this.exp2.dump(prefix + "   ");
    }
}

export class ExpressionStatement extends Statement {
    exp: Expression;
    constructor(exp: Expression) {
        super();
        this.exp = exp;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitExpressionStatement(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + "ExpressionStatement");
        this.exp.dump(prefix + "   ");
    }
}

export class FunctionCall extends AstNode {
    name: string;
    parameters: Expression[];
    decl: FunctionDecl|null = null;
    constructor(name: string, parameters: Expression[]) {
        super();
        this.name = name;
        this.parameters = parameters;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitFunctionCall(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + "FunctionCall " + this.name + (this.decl != null ? ", resolved": ", not resolved"));
        this.parameters.forEach(x => x.dump(prefix + "    "));
    }
}

export class Variable extends Expression {
    name: string;
    decl: VariableDecl|null = null;
    constructor(name: string) {
        super();
        this.name = name;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitVariable(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + "Variable: " + this.name + (this.decl != null ? ", resolved" : ", not resolved"));
    }
}

export class StringLiteral extends Expression {
    value: string;
    constructor(value: string) {
        super();
        this.value = value;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitStringLiteral(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + this.value);
    }
}

export class IntegerLiteral extends Expression {
    value: number;
    constructor(value: number) {
        super();
        this.value = value;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitIntegerLiteral(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + this.value);
    }
}

export class DecimalLiteral extends Expression {
    value: number;
    constructor(value: number) {
        super();
        this.value = value;
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitDecimalLiteral(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + this.value);
    }
}

export class NullLiteral extends Expression {
    value: null = null;
    constructor() {
        super();
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitNullLiteral(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + this.value);
    }
}

export class BooleanLiteral extends Expression {
    value: null = null;
    constructor() {
        super();
    }
    public accept(visitor: AstVisitor): void {
        return visitor.visitBooleanLiteral(this);
    }
    public dump(prefix: string): void {
        console.log(prefix + this.value);
    }
}

/**
 * Visitor
 */
export abstract class AstVisitor {
    visit(node: AstNode):any {
        return node.accept(this);
    }
    visitProg(prog:Prog):any {
        let retVal:any;
        for(let x of prog.stmts) {
            retVal = this.visit(x);
        }
        return retVal;
    }
    visitVariableDecl(variableDecl: VariableDecl):any {
        if (variableDecl.init != null) {
            return this.visit(variableDecl.init);
        }
    }
    visitFunctionDecl(functionDecl: FunctionDecl): any {
        return this.visitBlock(functionDecl.body);
    }
    visitBlock(Block: Block): any {
        let retVal: any;
        for(let x of Block.stmts) {
            retVal = this.visit(x);
        }
        return retVal;
    }
    visitExpressionStatement(stmt: ExpressionStatement):any {
        return this.visit(stmt.exp);
    }
    visitBinary(exp: Binary):any {
        this.visit(exp.exp1);
        this.visit(exp.exp2);
    }
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
    visitFunctionCall(functionCall: FunctionCall): any {
        return undefined;
    }
}