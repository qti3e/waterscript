#ifndef __WS_PARSER__
#define __WS_PARSER__

// Forward declr.
typedef struct _wval wval;

typedef struct _node wnode;

typedef enum node_kind {
        NodeOpComma,                             // Binary ,
        NodeOpOr,                                // Binary ||
        NodeOpAnd,                               // Binary &&
        NodeOpBitOr,                             // Binary |
        NodeOpBitXor,                            // Binary ^
        NodeOpBitAnd,                            // Binary &
        NodeOpLeftShift,                         // Binary <<
        NodeOpRightShift,                        // Binary >>
        NodeOpSignedRightShift,                  // Binary >>>
        NodeOpAdd,                               // Binary +
        NodeOpSub,                               // Binary -
        NodeOpMul,                               // Binary *
        NodeOpDiv,                               // Binary /
        NodeOpMod,                               // Binary %
        NodeOpPow,                               // Binary **

        NodeOpPositive,                          // Unary +
        NodeOpNeg,                               // Unary -
        NodeOpBitNot,                            // Unary ~
        NodeOpNot,                               // Unary !
        NodePlus1,                               // Unary ++
        NodeSub1,                                // Unary --
        NodeNew,                                 // Unary new
        NodePostfixPlus1,                        // Postfix ++
        NodePostfixSub1,                         // Postfix --

        NodeAssignment,                          // Assignment Expression
        NodeEquality,                            // Binary == != === !==
        NodeRelational,                          // Binary < > <= >=

        NodeProgram,
        NodeBlockStatement,
        NodeEmptyStatement,
        NodeExpressionStatement,

        NodeThis,                                // this
        NodeMember,                              // Property Access (aka .)
        NodeComputedMember,                      // obj[prop]
        NodeIdName,                              // An identifer.

        NodeNullLiteral,
        NodeTrueLiteral,
        NodeFalseLiteral,
        NodeNumericLiteral,
        NodeStringLiteral,

        NodeGroupExpr,                           // parenthesized_expression
        NodeConditional,                         // ? :

        NodeFunctionExpression,
        NodeFunctionParameter,
} node_kind;

struct _node_data_binary {
        wnode *lhs;
        wnode *rhs;
};

struct _node_data_unary_postfix {
        wnode *expr;
};

struct _node_data_binary_op {
        wnode *lhs;
        enum token_kind op;
        wnode *rhs;
};

struct _node {
        enum node_kind kind;

        union {
                struct _node_data_binary _b;
                struct _node_data_unary_postfix _u;
                struct _node_data_binary_op _bo;

                struct _node_data_binary op_comma;
                struct _node_data_binary op_or;
                struct _node_data_binary op_and;
                struct _node_data_binary op_bit_or;
                struct _node_data_binary op_bit_xor;
                struct _node_data_binary op_bit_and;
                struct _node_data_binary op_left_shift;
                struct _node_data_binary op_right_shift;
                struct _node_data_binary op_signed_right_shift;
                struct _node_data_binary op_add;
                struct _node_data_binary op_sub;
                struct _node_data_binary op_mul;
                struct _node_data_binary op_div;
                struct _node_data_binary op_mod;
                struct _node_data_binary op_pow;

                struct _node_data_unary_postfix op_positive;
                struct _node_data_unary_postfix op_neg;
                struct _node_data_unary_postfix op_bit_not;
                struct _node_data_unary_postfix op_not;
                struct _node_data_unary_postfix plus1;
                struct _node_data_unary_postfix sub1;
                struct _node_data_unary_postfix new;
                struct _node_data_unary_postfix postfix_plus1;
                struct _node_data_unary_postfix postfix_sub1;

                struct _node_data_binary_op assignment;
                struct _node_data_binary_op equality;
                struct _node_data_binary_op relational;

                // shared with block_statement
                struct {
                        unsigned int num_statements;
                        wnode **statements;
                } program;

                // Statements===================================================
                struct {} empty_statement;

                struct {
                        wnode *expr;
                } expression_statement;

                // =============================================================

                struct {} this;

                // Shared with NodeComputedMember
                struct {
                        wnode *obj;
                        wnode *prop;
                } member;

                struct {
                        char *id;
                } id_name;

                // Literals
                struct { } null_literal;

                struct { } true_literal;

                struct { } false_literal;

                struct { } undefined_literal;

                struct { } nan_literal;

                struct { } infinity_literal;

                struct {
                        double long number;
                } numeric_literal;

                struct {
                        unsigned long length;
                        char *buf;
                } string_literal;
                // End of literals

                struct {
                        wnode *expr;
                } group_expr;

                struct {
                        wnode *condition;
                        wnode *expr_t;
                        wnode *expr_f;
                } conditional;

                struct {
                        unsigned int num_params;
                        wnode **params;
                        wnode *rest;
                        wnode *body;
                        wnode *id;
                } function_expression;

                struct {
                        wnode *name;
                        wnode *init;
                } function_parameter;
        } data;
};

#define SIZE_OF_NODE(_d)\
        (offsetof(wnode, data) + sizeof(((wnode*)NULL)->data._d))

void free_nodes(wnode **nodes, int num);
wnode *parse(context *ctx, wtoken *tokens);
void dump_node(wnode *node);

#endif
