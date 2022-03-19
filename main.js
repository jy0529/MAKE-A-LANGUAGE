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
var parser_1 = require("./parser");
var tokenizer_1 = require("./tokenizer");
var AstVisitor = /** @class */ (function () {
    function AstVisitor() {
    }
    AstVisitor.prototype.visitProgram = function (prog) {
        var retVal;
        for (var _i = 0, _a = prog.statements; _i < _a.length; _i++) {
            var x = _a[_i];
            if (typeof x.body === 'object') {
                retVal = this.visitFunctionDecl(x);
            }
            else {
                retVal = this.visitFunctionCall(x);
            }
        }
    };
    AstVisitor.prototype.visitFunctionDecl = function (functionDecl) {
        return this.visitFunctionBody(functionDecl.body);
    };
    AstVisitor.prototype.visitFunctionBody = function (functionBody) {
        var retVal;
        for (var _i = 0, _a = functionBody.statements; _i < _a.length; _i++) {
            var x = _a[_i];
            retVal = this.visitFunctionCall(x);
        }
        return retVal;
    };
    AstVisitor.prototype.visitFunctionCall = function (functionCall) {
        return undefined;
    };
    return AstVisitor;
}());
// 语义分析
// 函数引用消解
var RefResolver = /** @class */ (function (_super) {
    __extends(RefResolver, _super);
    function RefResolver() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.prog = null;
        return _this;
    }
    RefResolver.prototype.visitProg = function (prog) {
        this.prog = prog;
        for (var _i = 0, _a = prog.statements; _i < _a.length; _i++) {
            var x = _a[_i];
            var functionCall = x;
            if (typeof functionCall.parameters === 'object') {
                this.resolveFunctionCall(prog, functionCall);
            }
            else {
                this.visitFunctionDecl(x);
            }
        }
    };
    RefResolver.prototype.visitFunctionBody = function (functionBody) {
        if (this.prog !== null) {
            for (var _i = 0, _a = functionBody.statements; _i < _a.length; _i++) {
                var x = _a[_i];
                return this.resolveFunctionCall(this.prog, x);
            }
        }
    };
    RefResolver.prototype.resolveFunctionCall = function (prog, functionCall) {
        var functionDecl = this.findFunctionDecl(prog, functionCall.name);
        if (functionDecl !== null) {
            functionCall.definition = functionDecl;
        }
        else {
            if (functionCall.name !== 'println') { // 系统函数
                console.log("cannot find definition of function " + functionCall.name);
            }
        }
    };
    RefResolver.prototype.findFunctionDecl = function (prog, name) {
        for (var _i = 0, _a = prog === null || prog === void 0 ? void 0 : prog.statements; _i < _a.length; _i++) {
            var x = _a[_i];
            var functionDecl = x;
            if (typeof functionDecl.body === 'object' && functionDecl.name == name) {
                return functionDecl;
            }
        }
        return null;
    };
    return RefResolver;
}(AstVisitor));
// 遍历AST，执行函数调用
var Intepretor = /** @class */ (function (_super) {
    __extends(Intepretor, _super);
    function Intepretor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Intepretor.prototype.visitProg = function (prog) {
        var retVal;
        for (var _i = 0, _a = prog.statements; _i < _a.length; _i++) {
            var x = _a[_i];
            var functionCall = x;
            if (typeof functionCall.parameters === 'object') {
                retVal = this.runFunction(functionCall);
            }
        }
        ;
        return retVal;
    };
    Intepretor.prototype.visitFunctionBody = function (functionBody) {
        var retVal;
        for (var _i = 0, _a = functionBody.statements; _i < _a.length; _i++) {
            var x = _a[_i];
            retVal = this.runFunction(x);
        }
        return retVal;
    };
    Intepretor.prototype.runFunction = function (functionCall) {
        if (functionCall.name === 'println') { // 内置函数
            if (functionCall.parameters.length > 0) {
                console.log(functionCall.parameters[0]);
            }
            else {
                console.log();
            }
            return 0;
        }
        else {
            if (functionCall.definition !== null) {
                this.visitFunctionBody(functionCall.definition.body);
            }
        }
    };
    return Intepretor;
}(AstVisitor));
// 主程序
function compileAndRun(program) {
    console.log('源代码: ');
    console.log(program);
    console.log("\n词法分析结果:");
    var tokenizer = new tokenizer_1.Tokenizer(new tokenizer_1.CharStream(program));
    while (tokenizer.peek().type !== tokenizer_1.TokenType.EOF) {
        console.log(tokenizer.next());
    }
    // 重置
    tokenizer = new tokenizer_1.Tokenizer(new tokenizer_1.CharStream(program));
    // 语法分析
    var prog = new parser_1.Parser(tokenizer).parseProgram();
    console.log("\n语法分析后的AST: ");
    prog.dump("");
    // 语义分析
    new RefResolver().visitProg(prog);
    console.log("\n语法分析后的AST, 自定义函数的调用已被消解:");
    prog.dump("");
    // 运行程序
    console.log("\n运行程序:");
    var retVal = new Intepretor().visitProg(prog);
    console.log("程序返回值: " + retVal);
}
compileAndRun("function func() { };");
