"use strict";
exports.__esModule = true;
exports.Tokenizer = exports.CharStream = exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["Keyword"] = 0] = "Keyword";
    TokenType[TokenType["Identifier"] = 1] = "Identifier";
    TokenType[TokenType["StringLiteral"] = 2] = "StringLiteral";
    TokenType[TokenType["Seperator"] = 3] = "Seperator";
    TokenType[TokenType["Operator"] = 4] = "Operator";
    TokenType[TokenType["EOF"] = 5] = "EOF";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
;
var CharStream = /** @class */ (function () {
    function CharStream(data) {
        this.pos = 0;
        this.line = 1;
        this.col = 0;
        this.data = data;
    }
    CharStream.prototype.peek = function () {
        return this.data.charAt(this.pos);
    };
    CharStream.prototype.next = function () {
        var ch = this.data.charAt(this.pos++);
        if (ch === '\n') {
            this.line++;
            this.col = 0;
        }
        else {
            this.col++;
        }
        return ch;
    };
    CharStream.prototype.eof = function () {
        return this.peek() == '';
    };
    return CharStream;
}());
exports.CharStream = CharStream;
var Tokenizer = /** @class */ (function () {
    function Tokenizer(stream) {
        this.nextToken = { type: TokenType.EOF, text: "" };
        this.stream = stream;
    }
    Tokenizer.prototype.next = function () {
        if (this.nextToken.type === TokenType.EOF && !this.stream.eof()) {
            this.nextToken = this.getToken();
        }
        var lastToken = this.nextToken;
        this.nextToken = this.getToken();
        return lastToken;
    };
    Tokenizer.prototype.peek = function () {
        if (this.nextToken.type === TokenType.EOF && !this.stream.eof()) {
            this.nextToken = this.getToken();
        }
        return this.nextToken;
    };
    Tokenizer.prototype.getToken = function () {
        this.skipWhiteSpaces();
        if (this.stream.eof()) {
            return { type: TokenType.EOF, text: '' };
        }
        else {
            var ch = this.stream.peek();
            if (this.isLetter(ch) || this.isDigit('ch')) {
                return this.parseIdentifer();
            }
            else if (ch === '"') {
                return this.parseStringLiteral();
            }
            else if (ch === '(' || ch === ')' || ch === '{' ||
                ch === '}' || ch === ';' || ch === ',') {
                this.stream.next();
                return { type: TokenType.Seperator, text: ch };
            }
            else if (ch === '/') {
                this.stream.next();
                var ch1 = this.stream.peek();
                if (ch1 === '*') {
                    this.skipMultipleLineComments();
                }
                else if (ch1 === '/') {
                    this.skipSingleLineComment();
                }
                else if (ch1 === '=') {
                    this.stream.next();
                    return { type: TokenType.Operator, text: '/=' };
                }
                else {
                    return { type: TokenType.Operator, text: '/' };
                }
            }
            else if (ch === '+') {
                this.stream.next();
                var ch1 = this.stream.next();
                if (ch1 === '+') {
                    this.stream.next();
                    return { type: TokenType.Operator, text: '++' };
                }
                else if (ch1 === '=') {
                    this.stream.next();
                    return { type: TokenType.Operator, text: '+=' };
                }
                else {
                    return { type: TokenType.Operator, text: '+' };
                }
            }
            else if (ch === '-') {
                this.stream.next();
                var ch1 = this.stream.next();
                if (ch1 === '-') {
                    this.stream.next();
                    return { type: TokenType.Operator, text: '--' };
                }
                else if (ch1 === '=') {
                    this.stream.next();
                    return { type: TokenType.Operator, text: '-=' };
                }
                else {
                    return { type: TokenType.Operator, text: '-' };
                }
            }
            else if (ch === '*') {
                this.stream.next();
                var ch1 = this.stream.next();
                if (ch1 === '=') {
                    this.stream.next();
                    return { type: TokenType.Operator, text: '*=' };
                }
                else {
                    return { type: TokenType.Operator, text: '*' };
                }
            }
            else {
                console.log('Unexpected char ' + ch + ' at ' + this.stream.line + ' line ' + ' col: ' + this.stream.col);
                this.stream.next();
                return this.getToken();
            }
        }
    };
    Tokenizer.prototype.parseIdentifer = function () {
        var token = { type: TokenType.Identifier, text: '' };
        token.text += this.stream.next();
        while (!this.stream.eof() && this.isLetterDigitOrUnderScore(this.stream.peek())) {
            token.text += this.stream.next();
        }
        if (token.text === 'function') {
            token.type = TokenType.Keyword;
        }
        return token;
    };
    Tokenizer.prototype.parseStringLiteral = function () {
        var token = { type: TokenType.StringLiteral, text: '' };
        while (!this.stream.eof() && this.stream.peek() !== '"') {
            token.text += this.stream.next();
        }
        if (this.stream.peek() === '"') {
            this.stream.next();
        }
        else {
            console.log('UnExpected ' + this.stream.peek() + ' at line: ' + this.stream.line + ' col: ' + this.stream.col);
        }
        return token;
    };
    Tokenizer.prototype.skipWhiteSpaces = function () {
        while (this.isWhiteSpace(this.stream.peek())) {
            this.stream.next();
        }
    };
    Tokenizer.prototype.skipMultipleLineComments = function () {
        this.stream.next();
        if (!this.stream.eof()) {
            var ch = this.stream.next();
            while (!this.stream.eof()) {
                var ch1 = this.stream.next();
                if (ch === '*' && ch1 === '/') {
                    return;
                }
                ch = ch1;
            }
        }
        console.log('Failed to find matching */ for multiple line comments');
    };
    Tokenizer.prototype.skipSingleLineComment = function () {
        this.stream.next();
        while (this.stream.peek() !== '\n' && !this.stream.eof()) {
            this.stream.next();
        }
    };
    Tokenizer.prototype.isLetterDigitOrUnderScore = function (ch) {
        return this.isLetter(ch) || this.isDigit(ch) || ch === '_';
    };
    Tokenizer.prototype.isLetter = function (ch) {
        return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
    };
    Tokenizer.prototype.isDigit = function (ch) {
        return ch >= '0' && ch <= '9';
    };
    Tokenizer.prototype.isWhiteSpace = function (ch) {
        return ch === ' ' || ch === '\t' || ch === '\n';
    };
    return Tokenizer;
}());
exports.Tokenizer = Tokenizer;
