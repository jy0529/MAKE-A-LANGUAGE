export enum TokenType {
    Keyword, Identifier, StringLiteral, IntegerLiteral, DecimalLiteral, NullLiteral, BooleanLiteral, ParenL , Separator, Operator, EOF
};

export interface Token {
    type: TokenType;
    text: string;
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
    nextToken: Token={ type: TokenType.EOF, text: ""};
    constructor(stream: CharStream) {
        this.stream = stream;
    }
    
    next():Token {
        if (this.nextToken.type === TokenType.EOF && !this.stream.eof()) {
            this.nextToken = this.getToken();
        }
        let lastToken = this.nextToken;
        this.nextToken = this.getToken();
        return lastToken;
    }

    peek():Token {
        if (this.nextToken.type === TokenType.EOF && !this.stream.eof()) {
            this.nextToken = this.getToken();
        }
        return this.nextToken;
    }

    private getToken(): Token {
        this.skipWhiteSpaces();
        if (this.stream.eof()) {
            return { type: TokenType.EOF, text: '' };
        } else {
            let ch: string = this.stream.peek();
            if (this.isLetter(ch) || this.isDigit('ch')) {
                return this.parseIdentifer();
            } else if (ch === '"') {
                return this.parseStringLiteral();
            } else if (
                ch === '(' || ch === ')' || ch === '{' ||
                ch === '}' || ch === ';' || ch === ','
            ) {
                this.stream.next();
                return { type: TokenType.Separator, text: ch };                
            } else if (ch === '/') {
                this.stream.next();
                let ch1 = this.stream.peek();
                if (ch1 === '*') {
                    this.skipMultipleLineComments();
                } else if (ch1 === '/') {
                    this.skipSingleLineComment();
                } else if (ch1 === '=') {
                    this.stream.next();
                    return { type: TokenType.Operator, text: '/=' };
                } else {
                    return { type: TokenType.Operator, text: '/' };
                }
            } else if (ch === '+') {
                this.stream.next();
                let ch1 = this.stream.next();
                if (ch1 === '+') {
                    this.stream.next();
                    return { type: TokenType.Operator, text: '++' };
                } else if (ch1 === '=') {
                    this.stream.next();
                    return { type: TokenType.Operator, text: '+=' };
                } else  {
                    return { type: TokenType.Operator, text: '+' };
                }
            } else if (ch === '-') {
                this.stream.next();
                let ch1 = this.stream.next();
                if (ch1 === '-') {
                    this.stream.next();
                    return { type: TokenType.Operator, text: '--' };
                } else if (ch1 === '=') {
                    this.stream.next();
                    return { type: TokenType.Operator, text: '-=' };
                } else  {
                    return { type: TokenType.Operator, text: '-' };
                }
            } else if (ch === '*') {
                this.stream.next();
                let ch1 = this.stream.next();
                if (ch1 === '=') {
                    this.stream.next();
                    return { type: TokenType.Operator, text: '*=' };
                } else  {
                    return { type: TokenType.Operator, text: '*' };
                }
            } else {
                console.log('Unexpected char ' + ch + ' at ' + this.stream.line + ' line ' + ' col: ' + this.stream.col);
                this.stream.next();
                return this.getToken();
            }
        }
    }

    private parseIdentifer(): Token {
        let token:Token = { type: TokenType.Identifier, text: '' };
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
        let token: Token = { type: TokenType.StringLiteral, text: '' };

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