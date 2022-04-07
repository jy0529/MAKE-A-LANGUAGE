/**
 * 语法分析器
 * @author Jy
 * 
 * 当前特性:
 * 1. 简化版的函数声明
 * 2. 简化版的函数调用
 * 3. 简化版的表达式
 * 
 * 当前语法法则:
 * prog = statementList? EOF;
 * statementList = (variableDecl | functionDecl | expressionStatement)+ ; 
 * variableDecl = 'let' Identifier typeAnnotation? ('=' singleExpression) ';';
 * typeAnnotation = ':' typeName;
 * functionDecl = 'function' Identifier '(' ')' functionBody;
 * functionBody = '{' statementList? '}';
 * statement: functionDecl | expressionStatement;
 * expressionStatement: expression ';';
 * expression: primary (binOp primary)*;
 * primary: StringLiteral | DecimalLiteral | IntegerLiteral | BooleanLiteral | NullLiteral | '(' expression ')' | functionCall;
 * binOp: '+' | '-' | '*' | '/' | '%' | '==' | '!=' | '>' | '<' | '>=' | '<=' | '&&' | '||';
 * functionCall: Identifier '(' parameterList? ')';
 * parameterList = expression (',' expression)*;
 */


import { Block, Expression, ExpressionStatement, FunctionCall, FunctionDecl, Prog, Statement, VariableDecl } from './ast';
import { Tokenizer, TokenType, Token } from './tokenizer';

export class Parser {
    tokenizer: Tokenizer;
    constructor(tokenizer: Tokenizer) {
        this.tokenizer = tokenizer;
    }

    parseProgram(): Prog {
        return new Prog(this.parseStatementList());
    }

    parseStatementList(): Statement[] {
        let stmts: Statement[] = [];
        while(this.tokenizer.peek().type !== TokenType.EOF) {
            let stmt = this.parseStatement();
            if (stmt !== null) {
                stmts.push(stmt);
            } else {
                console.log("Error parsing a statement");
                return [];
            }
        }
        return stmts;
    }

    parseStatement(): Statement | null {
        let token = this.tokenizer.peek();
        if (token.type === TokenType.Keyword && token.text === 'function') {
            return this.parseFunctionDeclare();
        } else if (token.text === 'let') {
            return this.parseVariableDecl();
        } else if (
                token.type === TokenType.Identifier ||
                token.type === TokenType.StringLiteral ||
                token.type === TokenType.DecimalLiteral ||
                token.type === TokenType.IntegerLiteral ||
                token.type === TokenType.ParenL
            ) {
            return this.parseExpressionStatement();
        } else {
            console.log("Can not recognize a expression start with " + token.text);
            return null;
        }
    }

    /**
     * 解析变量声明
     * 语法规则:
     * variableDecl: 'let'? Identifier typeAnnotation? ('=' singleExpression) ';';
     */
    parseVariableDecl(): VariableDecl | null {
        this.tokenizer.next();
        let t = this.tokenizer.next();
        if (t.type === TokenType.Identifier) {
            let varName:string = t.text;

            let varType:string = 'any';
            let init:Expression|null = null;

            let t1 = this.tokenizer.peek();
            // 类型标注
            if (t1.text === ':') {
                this.tokenizer.next();
                t1 = this.tokenizer.peek();
                if (t1.type === TokenType.Identifier) {
                    this.tokenizer.next();
                    varType = t1.text;
                    t1 = this.tokenizer.peek();
                } else {
                    console.log("Expecting a type name, while we got a " + t1.text);
                    return null;
                }
            }

            // 初始化 
            if (t1.text === '=') {
                this.tokenizer.next();
                init = this.parseExpression();
            }

            // 分号
            t1 = this.tokenizer.peek();
            if (t1.text === ';') {
                this.tokenizer.next();
                return new VariableDecl(varName, varType, init);
            } else {
                console.log("Expecting ';' in VariableDecl, while we got a " + t1.text);
                return null;
            }
        } else {
            console.log("Expecting a variable name, while we got a " + t.text);
            return null;
        }
    }

    /**
     * 解析函数声明
     * 语法规则
     * functionDecl: "function" Identifier "(" ")" functionBody;
     * 
     */
    parseFunctionDeclare(): FunctionDecl | null {
        this.tokenizer.next();

        let t = this.tokenizer.next();
        if (t.type === TokenType.Identifier) {
            let t1 = this.tokenizer.next();
            if (t1.text === '(') {
                let t2 = this.tokenizer.next();
                if (t2.text === ')') {
                    let functionBody = this.parseFunctionBody();
                    if (functionBody !== null) {
                        return new FunctionDecl(t.text, functionBody);
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
    parseFunctionBody(): Block | null {
        let t:Token = this.tokenizer.peek();
        if (t.text === '{') {
           this.tokenizer.next();
           let stmts = this.parseStatementList();
           t = this.tokenizer.next();
           if (t.text === '}') {
               return new Block(stmts);
           } else {
                console.log("Expecting '}' in FunctionBody, while we got a " + t.text);
                return null;
           }
        } else {
            console.log("Expecting '{' in FunctionBody, while we got a " + t.text);
            return null;
        }
    }

    parseExpressionStatement(): ExpressionStatement | null {
        let exp = this.parseExpression();
        if (exp != null) {
            let t = this.tokenizer.peek();
            if (t.text === ';') {
                this.tokenizer.next();
                return new ExpressionStatement(exp);
            } else {
                console.log("Expecting ';' in ExpressionStatement, while we got a " + t.text);
                return null;
            }
        } else {
            console.log("Error parsing ExpressionStatement");
            return null;
        }
    }

    parseExpression(): Expression | null {
        return null;
    }


    /**
     * 
     * 语法规则
     * functionCall : Identifier '(' parameterList ')' ;
     * parameterList : StringLiteral (',' StringLiteral)* ;
     */
    parseFunctionCall(): FunctionCall | null {
        let params: Expression[] = [];
        let t: Token = this.tokenizer.next();
        if (t.type === TokenType.Identifier) {
            let t1:Token = this.tokenizer.next();
            if (t1.text === '(') {
                let t2:Token = this.tokenizer.next();
                while(t2.text !== ')') {
                    if (t2.type === TokenType.StringLiteral) {
                        // params.push(t2.text);
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