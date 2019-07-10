#include <stdlib.h>
#include <stdio.h> // printf
#include <assert.h>
#include <string.h>
#include <stddef.h>
#include <ctype.h>
#include "lexer.h"

wtoken *tokenize(char *source)
{
        char *cursor, *s, *line_break;
        char c, l1, l2;
        unsigned int line;
        unsigned int col;
        wtoken *head, *tail, *t;

        cursor = source;
        line = 1;
        // The way we compute col is not correct.
        head = tail = t = NULL;
        line_break = cursor - 1;

        do {
                c = *cursor;
                l1 = *(cursor + 1);
                l2 = *(cursor + 2);
                col = cursor - line_break;

                // We ignore LineBreaks whenever there is a need to check
                // if there is a new line or not (e1) we can implement it
                // by using information stored in token->loc.
                // e1:
                // yield [no LineTerminator here] AssignmentExpression
                if (c == '\n') {
                        line_break = cursor;
                        ++line;
                        col = 0;
                        continue;
                }

                if (isspace(c))
                        continue;

                // Numeric literal.
                if (isdigit(c)) {
                        // TODO(qti3e) Make it ecma compatible.
                        s = cursor;
                        long double num = strtold(cursor, &cursor);
                        --cursor;
                        t = malloc(SIZE_OF_TOKEN(numeric_literal));
                        t->kind = TokenNumericLiteral;
                        t->data.numeric_literal.number = num;
                        t->loc.start.line = t->loc.end.line = line;
                        t->loc.start.column = t->loc.end.column = col;
                        t->loc.end.column += cursor - s;
                        goto push_token;
                }

                // Look for identifiers.
                if (isalpha(c) || c == '$' || c == '_') {
                        // TODO(qti3e) Support Unicode
                        s = cursor;
                        int n = 1;
                        while ((c = *(++cursor)) && isalnum(c))
                                n++;
                        --cursor;

                        char *id = strndup(s, n);

                        t = malloc(SIZE_OF_TOKEN(identifier));
                        t->kind = TokenIdentifier;
                        t->data.identifier.name = id;
                        t->loc.start.line = t->loc.end.line = line;
                        t->loc.start.column = t->loc.end.column = col;
                        t->loc.end.column += n;
                        goto push_token;
                }

                // String literal.
                if (c == '"' || c == '\'') {
                        // TODO(qti3e) Refactor.
                        char tag = c;
                        char *buf;
                        unsigned long i, length;

                        s = cursor + 1;
                        length = 0;

                        while ((c = *(++cursor))) {
                                length++;
                                if (c == '\\') {
                                        ++cursor;
                                        continue;
                                }
                                if (c == tag)
                                        break;
                        }
                        length--;

                        if (c == 0)
                                goto error;

                        buf = malloc(length + 1);
                        assert(buf != NULL);
                        i = 0;

                        for (; s != cursor; ++s, ++i) {
                                if (*s == '\\') switch (*(++s)) {
                                        case 'n':
                                                buf[i] = '\n';
                                                continue;
                                        case 'r':
                                                buf[i] = '\r';
                                                continue;
                                        case 't':
                                                buf[i] = '\t';
                                                continue;
                                        case 'b':
                                                buf[i] = '\b';
                                                continue;
                                        case 'f':
                                                buf[i] = '\f';
                                                continue;
                                        case 'v':
                                                buf[i] = '\v';
                                                continue;
                                        case '0':
                                                buf[i] = '\0';
                                                continue;
                                }
                                buf[i] = *s;
                        }
                        buf[i] = 0;
                        t = malloc(SIZE_OF_TOKEN(string_literal));
                        t->kind = TokenStringLiteral;
                        t->data.string_literal.length = length;
                        t->data.string_literal.buf = buf;
                        t->loc.start.line = t->loc.end.line = line;
                        t->loc.start.column = t->loc.end.column = col;
                        t->loc.end.column += length;
                        goto push_token;
                }

                // Single line comment.
                if (c == '/' && l1 == '/') {
                        while ((c = *(++cursor)) && c != '\n');
                        continue;
                }

                // Mutliline comment.
                if (c == '/' && l1 == '*') {
                        while ((c = *(++cursor)) && (l1 = *(cursor + 1)))
                                if (c == '*' && l1 == '/') break;
                        if (c == '\0' || l1 == '\0')
                                goto error;
                        ++cursor; // for `/`
                        continue;
                }

                // Punctuations.
                t = malloc(SIZE_OF_DATALESS_TOKEN);
                t->loc.start.line = t->loc.end.line = line;
                t->loc.start.column = t->loc.end.column = col;

                // 3 Byte Punctuators.
                cursor += 2;
                t->loc.end.column += 3;

                if (l2 == l1 && l1 == c) switch (c) {
                        case '>':
                                if (*cursor == '=') { // l3
                                        cursor += 1;
                                        t->kind = TokenSignedRightShiftAsgn;
                                        goto push_token;
                                }
                                t->kind = TokenSignedRightShift;
                                goto push_token;
                        case '.':
                                t->kind = TokenDotDotDot;
                                goto push_token;
                }

                if (l2 == '=' && l1 == c) switch (c) {
                        case '<':
                                t->kind = TokenLeftShiftAsgn;
                                goto push_token;
                        case '>':
                                t->kind = TokenRightShiftAsgn;
                                goto push_token;
                        case '*':
                                t->kind = TokenPowAsgn;
                                goto push_token;
                        case '=':
                                t->kind = TokenStrictEquality;
                                goto push_token;
                }

                if (l2 == l1 && l1 == '=' && c == '!') {
                        t->kind = TokenStrictNotEqual;
                        goto push_token;
                }

                // 2 Byte Punctuators.
                // We already did a cursor += 3 above, so instead
                // of `cursor -= 3; cursor += 2` we just do a single
                // `cursor -= 1`
                cursor -= 1;
                t->loc.end.column -= 1;

                if (c == l1) switch (c) {
                        case '>':
                                t->kind = TokenRightShift;
                                goto push_token;
                        case '<':
                                t->kind = TokenLeftShift;
                                goto push_token;
                        case '|':
                                t->kind = TokenOr;
                                goto push_token;
                        case '&':
                                t->kind = TokenAnd;
                                goto push_token;
                        case '+':
                                t->kind = TokenPlusPlus;
                                goto push_token;
                        case '-':
                                t->kind = TokenMinusMinus;
                                goto push_token;
                        case '=':
                                t->kind = TokenEquality;
                                goto push_token;
                        case '*':
                                t->kind = TokenPow;
                                goto push_token;
                }

                if (l1 == '=') switch (c) {
                        case '|':
                                t->kind = TokenOrAsgn;
                                goto push_token;
                        case '&':
                                t->kind = TokenAndAsgn;
                                goto push_token;
                        case '*':
                                t->kind = TokenMulAsgn;
                                goto push_token;
                        case '/':
                                t->kind = TokenDivAsgn;
                                goto push_token;
                        case '%':
                                t->kind = TokenModAsgn;
                                goto push_token;
                        case '+':
                                t->kind = TokenAddAsgn;
                                goto push_token;
                        case '-':
                                t->kind = TokenSubAsgn;
                                goto push_token;
                        case '^':
                                t->kind = TokenXorAsgn;
                                goto push_token;
                        case '!':
                                t->kind = TokenNotEqual;
                                goto push_token;
                        case '>':
                                t->kind = TokenGTE;
                                goto push_token;
                        case '<':
                                t->kind = TokenLTE;
                                goto push_token;
                }

                // 1 Byte Punctuators.
                cursor -= 1;
                t->loc.end.column -= 1;

                switch (c) {
                        case '=':
                                t->kind = TokenAssignment;
                                goto push_token;
                        case ',':
                                t->kind = TokenComma;
                                goto push_token;
                        case '?':
                                t->kind = TokenQuestion;
                                goto push_token;
                        case ':':
                                t->kind = TokenColon;
                                goto push_token;
                        case '|':
                                t->kind = TokenBitOr;
                                goto push_token;
                        case '^':
                                t->kind = TokenBitXor;
                                goto push_token;
                        case '&':
                                t->kind = TokenBitAnd;
                                goto push_token;
                        case '~':
                                t->kind = TokenBitNot;
                                goto push_token;
                        case '!':
                                t->kind = TokenNot;
                                goto push_token;
                        case ';':
                                t->kind = TokenSemicolon;
                                goto push_token;
                        case '(':
                                t->kind = TokenLeftParenthesis;
                                goto push_token;
                        case ')':
                                t->kind = TokenRightParenthesis;
                                goto push_token;
                        case '{':
                                t->kind = TokenLeftBrace;
                                goto push_token;
                        case '}':
                                t->kind = TokenRightBrace;
                                goto push_token;
                        case '[':
                                t->kind = TokenLeftBracket;
                                goto push_token;
                        case ']':
                                t->kind = TokenRightBracket;
                                goto push_token;
                        case '>':
                                t->kind = TokenGT;
                                goto push_token;
                        case '<':
                                t->kind = TokenLT;
                                goto push_token;
                        case '+':
                                t->kind = TokenPlus;
                                goto push_token;
                        case '-':
                                t->kind = TokenMinus;
                                goto push_token;
                        case '*':
                                t->kind = TokenTimes;
                                goto push_token;
                        case '/':
                                t->kind = TokenDiv;
                                goto push_token;
                        case '%':
                                t->kind = TokenMod;
                                goto push_token;
                        case '.':
                                t->kind = TokenDot;
                                goto push_token;
                }
                // Revert cursor to what it was.
                cursor -= 1;

                // End of punctuators
error:
                // TODO(qti3e) Set error on context.
                // and free tokens.
                printf("UnEx Char\n");
                abort();

push_token:
                assert(t != NULL);
                if (head == NULL) {
                        head = tail = t;
                } else {
                        tail->next = t;
                        tail = t;
                }
                t = NULL;
        } while (*cursor && *(++cursor));

        col = cursor - line_break;
        t = malloc(SIZE_OF_DATALESS_TOKEN);
        t->loc.start.line = t->loc.end.line = line;
        t->loc.start.column = t->loc.end.column = col;
        t->kind = TokenEOF;
        t->next = NULL;

        if (head == NULL)
                return t;

        tail->next = t;
        return head;
}

void dump_token(wtoken *token)
{
        if (!token) {
                printf("[T] [--NULL--]\n");
                return;
        }

        const char *punc = tokens_str[token->kind];
        char *head = malloc(20);
        // to format an string literal.
        char *str;
        unsigned int len;

        snprintf(head, 20, "[T;%03d:%02d-%03d:%02d]",
                        token->loc.start.line,
                        token->loc.start.column,
                        token->loc.end.line,
                        token->loc.end.column);

        if (punc)
                printf("%s PUNCTUATOR\t%s\n", head, punc);

        if (token->kind == TokenIdentifier)
                printf("%s IDENTIFIER\t%s\n", head, token->data.identifier.name);

        if (token->kind == TokenStringLiteral) {
                len = token->data.string_literal.length;
                str = token->data.string_literal.buf;
                if (len > 15) {
                        str = malloc(16);
                        strncpy(str, token->data.string_literal.buf, 12);
                        str[12] = str[13] = str[14] = '.';
                        str[15] = 0;
                }
                printf("%s STRING\t%s\n", head, str);

                if (len > 15)
                        free(str);
        }

        if (token->kind == TokenNumericLiteral)
                printf("%s NUMERICLIT\t%Lf\n", head,
                                token->data.numeric_literal.number);

        if (token->kind == TokenEOF)
                printf("%s EOF\n", head);

        free(head);
}
