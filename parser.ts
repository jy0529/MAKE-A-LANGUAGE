import { Tokenizer, TokenType, Token } from './tokenizer';

export abstract class AstNode {
    public abstract dump(prefix: string): void;
}

export abstract class Statement extends AstNode {}

export class Program extends AstNode {
    statements: Statement[] = [];
    constructor(statements: Statement[]) {
        super();
        this.statements = statements;
    }
    public dump(prefix: string): void {
        console.log(prefix + "Program");
        this.statements.forEach(s => s.dump(prefix + "\t"));
    }
}

export class FunctionDeclare extends Statement {
    name: string;
    body: FunctionBody;
    constructor(name: string, body: FunctionBody) {
        super();
        this.name = name;
        this.body = body;
    }
    public dump(prefix: string): void {
        console.log(prefix + "FunctionDeclare " + this.name)
        this.body.dump(prefix + "\t");
    }
}

export class FunctionBody extends AstNode {
    statements: FunctionCall[];
    constructor(statements: FunctionCall[]) {
        super();
        this.statements = statements;
    }
    public dump(prefix: string): void {
        console.log(prefix + "FunctionBody");
        this.statements.forEach(s => s.dump(prefix + "\t"));
    }
}

export class FunctionCall extends Statement {
    name: string;
    parameters: string[];
    definition: FunctionDeclare | null = null;

    constructor(name: string, parameters: string[]) {
        super();
        this.name = name;
        this.parameters = parameters;
    }
    public dump(prefix: string): void {
        console.log(prefix + "FunctionCall " + this.name + (this.definition !== null ? ', resolved' : ', not resolved'));
        this.parameters.forEach(p => console.log(prefix + "\t" + "Parameter: " + p));
    }
}

export class Parser {
    tokenizer: Tokenizer;
    constructor(tokenizer: Tokenizer) {
        this.tokenizer = tokenizer;
    }

    parseProgram(): Program {
        let stmts: Statement[] = [];
        let stmt: Statement | null = null;
        let token = this.tokenizer.peek();

        while(token.type !== TokenType.EOF) {
            if (token.type === TokenType.Keyword && token.text === 'function') {
                stmt = this.parseFunctionDeclare();
            } else if (token.type === TokenType.Identifier) {
                this.parseFunctionCall();
            }

            if (stmt !== null) {
                stmts.push(stmt);
            }

            token = this.tokenizer.peek();
        }
        return new Program(stmts);
    }

    /**
     * 
     * 语法规则
     * functionDecl: "function" Identifier "(" ")" functionBody;
     * 
     */
    parseFunctionDeclare(): FunctionDeclare | null {
        console.log("in FunctionDecl");
        this.tokenizer.next();

        let t = this.tokenizer.next();
        if (t.type === TokenType.Identifier) {
            let t1 = this.tokenizer.next();
            if (t1.text === '(') {
                let t2 = this.tokenizer.next();
                if (t2.text === ')') {
                    let functionBody = this.parseFunctionBody();
                    if (functionBody !== null) {
                        return new FunctionDeclare(t.text, functionBody);
                    } else {
                        console.log("Error parsing FunctionBody in FunctionDecl");
                        return null;
                    }
                } else {
                    console.log("Expecting ')' in FunctionDecl, while we got a " + t2.text);
                    return null;
                }
            } else {
                console.log("Expecting '(' in FunctionDecl, while we got a " + t1.text);
                return null;
            }
        } else {
            console.log('Expected a function name, while we got a ' + t.text);
        }
    }

    /**
     * 
     * functionBody: "{" functionCall* "}"
     */
    parseFunctionBody(): FunctionBody | null {
        let stmts: FunctionCall[] = [];
        let t:Token = this.tokenizer.next();
        if (t.text === '{') {
            while(this.tokenizer.peek().type === TokenType.Identifier) {
            let functionCall = this.parseFunctionCall();
                if (functionCall !== null) {
                    stmts.push(functionCall);
                } else {
                    console.log('Error parsing a FunctionCall in FunctionBody');
                    return null;
                }
                t = this.tokenizer.next();
                if (t.text === '}') {
                    return new FunctionBody(stmts);
                }
            }
        } else {
            console.log('Expecting "}" in FunctionBody, while we got a ' + t.text);
            return null;
        }
    }

    /**
     * 
     * 语法规则
     * functionCall : Identifier '(' parameterList ')' ;
     * parameterList : StringLiteral (',' StringLiteral)* ;
     */
    parseFunctionCall(): FunctionCall | null {
        let params: string[] = [];
        let t: Token = this.tokenizer.next();
        if (t.type === TokenType.Identifier) {
            let t1:Token = this.tokenizer.next();
            if (t1.text === '(') {
                let t2:Token = this.tokenizer.next();
                while(t2.text !== ')') {
                    if (t2.type === TokenType.StringLiteral) {
                        params.push(t2.text);
                    } else {
                        console.log("Expecting parameter in FunctionCall, while we got a " + t2.text);
                        return null;
                    }
                    t2 = this.tokenizer.next();
                    if (t2.text !== ')') {
                        if (t2.text === ',') {
                            t2 = this.tokenizer.next();
                        } else {
                            console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
                            return null;
                        }
                    }
                }
                // 消耗 ;
                t2 = this.tokenizer.next();
                if (t2.text === ';') {
                    return new FunctionCall(t.text, params);
                } else {
                    console.log("Expecting a semicolon in FunctionCall, while we got a " + t2.text);
                    return null;
                }
            }
        }
        return null;
    }
}