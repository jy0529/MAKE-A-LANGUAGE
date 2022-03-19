"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.Parser = exports.FunctionCall = exports.FunctionBody = exports.FunctionDeclartion = exports.Program = exports.Statement = exports.AstNode = void 0;
var tokenizer_1 = require("./tokenizer");
var AstNode = /** @class */ (function () {
    function AstNode() {
    }
    return AstNode;
}());
exports.AstNode = AstNode;
var Statement = /** @class */ (function (_super) {
    __extends(Statement, _super);
    function Statement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Statement;
}(AstNode));
exports.Statement = Statement;
var Program = /** @class */ (function (_super) {
    __extends(Program, _super);
    function Program(statements) {
        var _this = _super.call(this) || this;
        _this.statements = [];
        _this.statements = statements;
        return _this;
    }
    Program.prototype.dump = function (prefix) {
        console.log(prefix + "Program");
        this.statements.forEach(function (s) { return s.dump(prefix + "\t"); });
    };
    return Program;
}(AstNode));
exports.Program = Program;
var FunctionDeclartion = /** @class */ (function (_super) {
    __extends(FunctionDeclartion, _super);
    function FunctionDeclartion(name, body) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.body = body;
        return _this;
    }
    FunctionDeclartion.prototype.dump = function (prefix) {
        console.log(prefix + "FunctionDeclartion " + this.name);
        this.body.dump(prefix + "\t");
    };
    return FunctionDeclartion;
}(Statement));
exports.FunctionDeclartion = FunctionDeclartion;
var FunctionBody = /** @class */ (function (_super) {
    __extends(FunctionBody, _super);
    function FunctionBody(statements) {
        var _this = _super.call(this) || this;
        _this.statements = statements;
        return _this;
    }
    FunctionBody.prototype.dump = function (prefix) {
        console.log(prefix + "FunctionBody");
        this.statements.forEach(function (s) { return s.dump(prefix + "\t"); });
    };
    return FunctionBody;
}(AstNode));
exports.FunctionBody = FunctionBody;
var FunctionCall = /** @class */ (function (_super) {
    __extends(FunctionCall, _super);
    function FunctionCall(name, parameters) {
        var _this = _super.call(this) || this;
        _this.definition = null;
        _this.name = name;
        _this.parameters = parameters;
        return _this;
    }
    FunctionCall.prototype.dump = function (prefix) {
        console.log(prefix + "FunctionCall " + this.name + (this.definition !== null ? ', resolved' : ', not resolved'));
        this.parameters.forEach(function (p) { return console.log(prefix + "\t" + "Parameter: " + p); });
    };
    return FunctionCall;
}(Statement));
exports.FunctionCall = FunctionCall;
var Parser = /** @class */ (function () {
    function Parser(tokenizer) {
        this.tokenizer = tokenizer;
    }
    Parser.prototype.parseProgram = function () {
        var stmts = [];
        var stmt = null;
        var token = this.tokenizer.peek();
        while (token.type !== tokenizer_1.TokenType.EOF) {
            if (token.type === tokenizer_1.TokenType.Keyword && token.text === 'function') {
                stmt = this.parseFunctionDeclartion();
            }
            else if (token.type === tokenizer_1.TokenType.Identifier) {
                this.parseFunctionCall();
            }
            if (stmt !== null) {
                stmts.push(stmt);
            }
            token = this.tokenizer.peek();
        }
        return new Program(stmts);
    };
    /**
     *
     * 语法规则
     * functionDecl: "function" Identifier "(" ")" functionBody;
     *
     */
    Parser.prototype.parseFunctionDeclartion = function () {
        console.log("in FunctionDecl");
        this.tokenizer.next();
        var t = this.tokenizer.next();
        if (t.type === tokenizer_1.TokenType.Identifier) {
            var t1 = this.tokenizer.next();
            if (t1.text === '(') {
                var t2 = this.tokenizer.next();
                if (t2.text === ')') {
                    var functionBody = this.parseFunctionBody();
                    if (functionBody !== null) {
                        return new FunctionDeclartion(t.text, functionBody);
                    }
                    else {
                        console.log("Error parsing FunctionBody in FunctionDecl");
                        return null;
                    }
                }
                else {
                    console.log("Expecting ')' in FunctionDecl, while we got a " + t2.text);
                    return null;
                }
            }
            else {
                console.log("Expecting '(' in FunctionDecl, while we got a " + t1.text);
                return null;
            }
        }
        else {
            console.log('Expected a function name, while we got a ' + t.text);
        }
    };
    /**
     *
     * functionBody: "{" functionCall* "}"
     */
    Parser.prototype.parseFunctionBody = function () {
        var stmts = [];
        var t = this.tokenizer.next();
        if (t.text === '{') {
            while (this.tokenizer.peek().type === tokenizer_1.TokenType.Identifier) {
                var functionCall = this.parseFunctionCall();
                if (functionCall !== null) {
                    stmts.push(functionCall);
                }
                else {
                    console.log('Error parsing a FunctionCall in FunctionBody');
                    return null;
                }
                t = this.tokenizer.next();
                if (t.text === '}') {
                    return new FunctionBody(stmts);
                }
            }
        }
        else {
            console.log('Expecting "}" in FunctionBody, while we got a ' + t.text);
            return null;
        }
    };
    /**
     *
     * 语法规则
     * functionCall : Identifier '(' parameterList ')' ;
     * parameterList : StringLiteral (',' StringLiteral)* ;
     */
    Parser.prototype.parseFunctionCall = function () {
        var params = [];
        var t = this.tokenizer.next();
        if (t.type === tokenizer_1.TokenType.Identifier) {
            var t1 = this.tokenizer.next();
            if (t1.text === '(') {
                var t2 = this.tokenizer.next();
                while (t2.text !== ')') {
                    if (t2.type === tokenizer_1.TokenType.StringLiteral) {
                        params.push(t2.text);
                    }
                    else {
                        console.log("Expecting parameter in FunctionCall, while we got a " + t2.text);
                        return null;
                    }
                    t2 = this.tokenizer.next();
                    if (t2.text !== ')') {
                        if (t2.text === ',') {
                            t2 = this.tokenizer.next();
                        }
                        else {
                            console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
                            return null;
                        }
                    }
                }
                // 消耗 ;
                t2 = this.tokenizer.next();
                if (t2.text === ';') {
                    return new FunctionCall(t.text, params);
                }
                else {
                    console.log("Expecting a semicolon in FunctionCall, while we got a " + t2.text);
                    return null;
                }
            }
        }
        return null;
    };
    return Parser;
}());
exports.Parser = Parser;
