export enum TokenType {
    Keyword, Identifier, StringLiteral, IntegerLiteral, DecimalLiteral, NullLiteral, BooleanLiteral, ParenL , Separator, Operator, EOF
};

export class Token {
    type: TokenType;
    text: string;
    pos: Position;
    constructor(type: TokenType, text: string, pos: Position) {
        this.type = type;
        this.text = text;
        this.pos = pos;
    }
    toString(): string {
        return "Token(" + TokenType[this.type] + "," + this.text + ", @" + this.pos.toString() + ")";
    }
}

export class Position {
    begin:number;
    end:number;
    line:number;
    col:number;

    constructor(begin:number, end:number, line:number, col:number) {
        this.begin = begin;
        this.end = end;
        this.line = line;
        this.col = col;
    }
    
    toString():string {
        return "(ln: " + this.line + ", col:" + this.col + + ", pos:" + this.begin + ")";
    }
}

export class CharStream {
    data: string;
    pos: number = 0;
    line: number = 1;
    col: number = 0;
    constructor(data:string) {
        this.data = data;
    }
    peek():string {
        return this.data.charAt(this.pos);
    }
    next():string {
        let ch = this.data.charAt(this.pos++);
        if (ch === '\n') {
            this.line++;
            this.col = 0;
        } else {
            this.col++;
        }
        return ch;
    }
    eof():boolean {
        return this.peek() == '';
    }
}

export class Tokenizer {
    stream: CharStream;
    tokens: Array<Token> = new Array<Token>();
    private lastPos: Position = new Position(0, 0, 0, 0);
    constructor(stream: CharStream) {
        this.stream = stream;
    }
    
    next():Token {
        let t:Token | undefined = this.tokens.shift();
        if (typeof t === 'undefined') {
            t = this.getToken();
        }
        this.lastPos = t.pos;
        return t;
    }

    peek():Token {
        let t:Token | undefined = this.tokens[0];
        if (typeof t === 'undefined') {
            t = this.getToken();
            this.tokens.push(t);
        }
        return t;
    }

    private getToken(): Token {
        this.skipWhiteSpaces();
        if (this.stream.eof()) {
            return new Token(TokenType.EOF, 'EOF', this.lastPos);
        } else {
            let ch: string = this.stream.peek();
            if (this.isLetter(ch) || this.isDigit('ch')) {
                return this.parseIdentifier();
            } else if (ch === '"') {
                return this.parseStringLiteral();
            } else if (
                ch === '(' || ch === ')' || ch === '{' ||
                ch === '}' || ch === ';' || ch === ','
            ) {
                this.stream.next();
                return new Token(TokenType.Separator, ch, this.lastPos);
            } else if (ch === '/') {
                this.stream.next();
                let ch1 = this.stream.peek();
                if (ch1 === '*') {
                    this.skipMultipleLineComments();
                } else if (ch1 === '/') {
                    this.skipSingleLineComment();
                } else if (ch1 === '=') {
                    this.stream.next();
                    return new Token(TokenType.Operator, '/=', this.lastPos);
                } else {
                    return new Token(TokenType.Operator, '/', this.lastPos);
                }
            } else if (ch === '+') {
                this.stream.next();
                let ch1 = this.stream.next();
                if (ch1 === '+') {
                    this.stream.next();
                    return new Token(TokenType.Operator, '++', this.lastPos);
                } else if (ch1 === '=') {
                    this.stream.next();
                    return new Token(TokenType.Operator, '+=', this.lastPos);
                } else  {
                    return new Token(TokenType.Operator, '+', this.lastPos);
                }
            } else if (ch === '-') {
                this.stream.next();
                let ch1 = this.stream.next();
                if (ch1 === '-') {
                    this.stream.next();
                    return new Token(TokenType.Operator, '--', this.lastPos);
                } else if (ch1 === '=') {
                    this.stream.next();
                    return new Token(TokenType.Operator, '-=', this.lastPos);
                } else  {
                    return new Token(TokenType.Operator, '-', this.lastPos);
                }
            } else if (ch === '*') {
                this.stream.next();
                let ch1 = this.stream.next();
                if (ch1 === '=') {
                    this.stream.next();
                    return new Token(TokenType.Operator, '*=', this.lastPos);
                } else  {
                    return new Token(TokenType.Operator, '*', this.lastPos);
                }
            } else {
                console.log('Unexpected char ' + ch + ' at ' + this.stream.line + ' line ' + ' col: ' + this.stream.col);
                this.stream.next();
                return this.getToken();
            }
        }
    }

    private parseIdentifier(): Token {
        let token:Token = new Token(TokenType.Identifier, '', this.lastPos);
        token.text += this.stream.next();
        while(!this.stream.eof() && this.isLetterDigitOrUnderScore(this.stream.peek())) {
            token.text += this.stream.next();
        }

        if (token.text === 'function') {
            token.type = TokenType.Keyword;
        }

        return token;
    }

    private parseStringLiteral():Token {
        let token:Token = new Token(TokenType.StringLiteral, '', this.lastPos);

        while(!this.stream.eof() && this.stream.peek() !== '"') {
            token.text += this.stream.next();
        }
        if (this.stream.peek() === '"') {
            this.stream.next();
        } else {
            console.log('UnExpected ' + this.stream.peek() + ' at line: ' + this.stream.line + ' col: ' + this.stream.col);
        }
        return token;
    }

    private skipWhiteSpaces() {
        while(this.isWhiteSpace(this.stream.peek())) {
            this.stream.next();
        }
    }

    private skipMultipleLineComments() {
        this.stream.next();
        if (!this.stream.eof()) {
            let ch = this.stream.next();
            while(!this.stream.eof()) {
                let ch1 = this.stream.next();
                if (ch === '*' && ch1 === '/') {
                    return;
                }
                ch = ch1;
            }
        }

        console.log('Failed to find matching */ for multiple line comments');
    }

    private skipSingleLineComment() {
        this.stream.next();
        while(this.stream.peek() !== '\n' && !this.stream.eof()) {
            this.stream.next();
        }
    }

    private isLetterDigitOrUnderScore(ch:string):boolean {
        return this.isLetter(ch) || this.isDigit(ch) || ch === '_';
    }

    private isLetter(ch: string): boolean {
        return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
    }

    private isDigit(ch: string): boolean {
        return ch >= '0' && ch <= '9';
    }

    private isWhiteSpace(ch: string): boolean {
        return ch === ' ' || ch === '\t' || ch === '\n'; 
    }
}