#ifndef __WS_LEXER__
#define __WS_LEXER__

typedef struct _token wtoken;

// Used for dump.
static const char *tokens_str[] = {
        NULL  , NULL , NULL , "="  , "|=" , "&=" , "*=" ,
        "/="  , "%=" , "+=" , "-=" , "^=" , "<<=", ">>=",
        ">>>=", "**=", "...", "!=" , "!==", "===", "==" ,
        ">="  , "<=" , ">"  , "<"  , "<<" , ">>" , ">>>",
        "**"  , "++" , "--" , "+"  , "-"  , "*"  , "/"  ,
        "%"   , "."  , ","  , "?"  , ":"  , "||" , "&&" ,
        "|"   , "^"  , "&"  , "~"  , "!"  , ";"  , "("  ,
        ")"   , "{"  , "}"  , "["  , "]"  , NULL
};

typedef enum token_kind {
        TokenIdentifier,
        // Literals
        TokenStringLiteral,
        TokenNumericLiteral,
        // Punctuators
        // assignment operators.
        TokenAssignment,               // =
        TokenOrAsgn,                   // |=
        TokenAndAsgn,                  // &=
        TokenMulAsgn,                  // *=
        TokenDivAsgn,                  // /=
        TokenModAsgn,                  // %=
        TokenAddAsgn,                  // +=
        TokenSubAsgn,                  // -=
        TokenXorAsgn,                  // ^=
        TokenLeftShiftAsgn,            // <<=
        TokenRightShiftAsgn,           // >>=
        TokenSignedRightShiftAsgn,     // >>>=
        TokenPowAsgn,                  // **=
        // end of assignment operators.
        TokenDotDotDot,                // ...
        // equality ops
        TokenNotEqual,                 // !=
        TokenStrictNotEqual,           // !==
        TokenStrictEquality,           // ===
        TokenEquality,                 // ==
        // end of equality ops
        // relational ops
        TokenGTE,                      // >=
        TokenLTE,                      // <=
        TokenGT,                       // >
        TokenLT,                       // <
        // end of relational ops.
        TokenLeftShift,                // <<
        TokenRightShift,               // >>
        TokenSignedRightShift,         // >>>
        TokenPow,                      // **
        TokenPlusPlus,                 // ++
        TokenMinusMinus,               // --
        TokenPlus,                     // +
        TokenMinus,                    // -
        TokenTimes,                    // *
        TokenDiv,                      // /
        TokenMod,                      // %
        TokenDot,                      // .
        TokenComma,                    // ,
        TokenQuestion,                 // ?
        TokenColon,                    // :
        TokenOr,                       // ||
        TokenAnd,                      // &&
        TokenBitOr,                    // |
        TokenBitXor,                   // ^
        TokenBitAnd,                   // &
        TokenBitNot,                   // ~
        TokenNot,                      // !
        TokenSemicolon,                // ;
        TokenLeftParenthesis,          // (
        TokenRightParenthesis,         // )
        TokenLeftBrace,                // {
        TokenRightBrace,               // }
        TokenLeftBracket,              // [
        TokenRightBracket,             // ]
        TokenEOF
} token_kind;

#define IS_ASGN_TOKEN(t) \
        ((t)->kind >= TokenAssignment && (t)->kind <= TokenPowAsgn)

#define IS_EQUALITY_TOKEN(t) \
        ((t)->kind >= TokenNotEqual && (t)->kind <= TokenEquality)

#define IS_RELATIONAL_TOKEN(t) \
        ((t)->kind >= TokenGTE && (t)->kind <= TokenLT)

struct _pos {
        unsigned int line;
        unsigned int column;
};

struct _token {
        token_kind kind;

        struct {
                struct _pos start;
                struct _pos end;
        } loc;

        wtoken *next;

        union {
                struct {
                        char *name;
                } identifier;

                struct {
                        unsigned long length;
                        char *buf;
                } string_literal;

                struct {
                        double long number;
                } numeric_literal;
        } data;
};

#define SIZE_OF_DATALESS_TOKEN (offsetof(wtoken, data))
#define SIZE_OF_TOKEN(_d) \
        (SIZE_OF_DATALESS_TOKEN + sizeof(((wtoken*)NULL)->data._d))

void dump_token(wtoken *token);
wtoken *tokenize(char *source);

#endif
