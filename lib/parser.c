#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <assert.h>
#include <stddef.h>
#include "wval.h"
#include "lexer.h"
#include "parser.h"

// DO NOT PANIC! DRY IS EVERYWHERE.

// Managing dynamic memory in this code is hard, as we don't know what
// we should free, currently we do not free anything when we face an error
// and it might cause a memory leak - But it's ok, I can come back later...
//
// Also it works - But it's very slow! (1M lines/sec without tokenization)

#define NOT_IMPLEMENTED \
        fprintf(stderr, "%s is not implemented yet.\n", __func__); \
        abort(); \
        return NULL; \

#define ID(token, word) \
        (token \
         && token->kind == TokenIdentifier \
         && strcmp(token->data.identifier.name, word) == 0)

wnode *assignment_expression(context *ctx, wtoken *token, wtoken **endptr);
wnode *unary_expression(context *ctx, wtoken *token, wtoken **endptr);
wnode *expression(context *ctx, wtoken *token, wtoken **endptr);

wnode *declaration(context *ctx, wtoken *token, wtoken **endptr)
{
        NOT_IMPLEMENTED;
}

wnode *literal(context *ctx, wtoken *token, wtoken **endptr)
{
        wnode *n;

        if (token->kind == TokenIdentifier) {
                if (ID(token, "null")) {
                        n = malloc(SIZE_OF_NODE(null_literal));
                        n->kind = NodeNullLiteral;
                        *endptr = token->next;
                        return n;
                }

                if (ID(token, "true")) {
                        n = malloc(SIZE_OF_NODE(true_literal));
                        n->kind = NodeTrueLiteral;
                        *endptr = token->next;
                        return n;
                }

                if (ID(token, "false")) {
                        n = malloc(SIZE_OF_NODE(false_literal));
                        n->kind = NodeFalseLiteral;
                        *endptr = token->next;
                        return n;
                }
        }

        if (token->kind == TokenStringLiteral) {
                n = malloc(SIZE_OF_NODE(string_literal));
                n->kind = NodeStringLiteral;
                n->data.string_literal.buf = token->data.string_literal.buf;
                n->data.string_literal.length =
                        token->data.string_literal.length;
                *endptr = token->next;
                return n;
        }

        if (token->kind == TokenNumericLiteral) {
                n = malloc(SIZE_OF_NODE(numeric_literal));
                n->kind = NodeNumericLiteral;
                n->data.numeric_literal.number =
                        token->data.numeric_literal.number;
                *endptr = token->next;
                return n;
        }

        return NULL;
}

wnode *function_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        assert(ID(token, "function"));
        NOT_IMPLEMENTED;
}

wnode *primary_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wnode *n, *expr;

        n = NULL;

        if (ID(token, "this")) {
                *endptr = token->next;
                n = malloc(SIZE_OF_NODE(this));
                n->kind = NodeThis;
                return n;
        }

        if (ID(token, "function"))
                return function_expression(ctx, token, endptr);

        if (token->kind == TokenLeftParenthesis) {
                expr = expression(ctx, token->next, &token);
                // TODO(qti3e) Error.
                if (!expr)
                        return NULL;
                if (token->kind != TokenRightParenthesis)
                        return NULL;
                *endptr = token->next;
                n = malloc(SIZE_OF_NODE(group_expr));
                n->kind = NodeGroupExpr;
                n->data.group_expr.expr = expr;
                return n;
        }

        n = literal(ctx, token, &token);

        if (n) {
                *endptr = token;
                return n;
        }

        if (token->kind == TokenIdentifier) {
                *endptr = token->next;
                n = malloc(SIZE_OF_NODE(id_name));
                n->kind = NodeIdName;
                n->data.id_name.id = token->data.identifier.name;
                return n;
        }

        // TODO(qti3e) Error
        return NULL;
}

wnode *member_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *prev, *n, *prop;
        enum token_kind op;
        enum node_kind k;

        n = prop = NULL;
        prev = primary_expression(ctx, token, &token);

        if (!prev)
                return NULL;

        while (token) {
                prop = NULL;
                local = token;
                op = local->kind;

                if (!local->next) break;

                if (op == TokenLeftBracket) {
                        k = NodeComputedMember;
                        prop = expression(ctx, local->next, &local);
                        // TODO(qti3e) Error
                        if (!prop)
                                break;
                        // TODO(qti3e) Error
                        if (local->kind != TokenRightBracket)
                                break;
                        // consume `]`.
                        local = local->next;
                } else if (op == TokenDot) {
                        local = token->next;
                        // TODO(qti3e) Error
                        if (local->kind != TokenIdentifier)
                                break;
                        k = NodeMember;
                        prop = malloc(SIZE_OF_NODE(id_name));
                        prop->kind = NodeIdName;
                        prop->data.id_name.id = local->data.identifier.name;
                        // consume identifier.
                        local = local->next;
                }

                // Error?
                if (!prop)
                        break;

                token = local;
                n = malloc(SIZE_OF_NODE(member));
                n->kind = k;
                n->data.member.obj = prev;
                n->data.member.prop = prop;
                prev = n;
        }

        *endptr = token;
        return prev;
}

wnode *new_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wnode *n, *expr;

        if (!ID(token, "new"))
                return member_expression(ctx, token, endptr);

        expr = new_expression(ctx, token->next, &token);

        // TODO(qti3e) Error
        if (!expr)
                return NULL;

        *endptr = token;
        n = malloc(SIZE_OF_NODE(_u));
        n->kind = NodeNew;
        n->data.new.expr = expr;
        return n;
}

wnode *lhs_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        return new_expression(ctx, token, endptr);
}

wnode *update_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *tmp;
        wnode *n, *lhs;
        enum node_kind k;

        if (token->kind == TokenPlusPlus || token->kind == TokenMinusMinus) {
                k = token->kind == TokenPlusPlus ? NodePlus1 : NodeSub1;
                lhs = unary_expression(ctx, token->next, &token);
                // TODO(qti3e) Error.
                if (!lhs)
                        return NULL;
                *endptr = token;
                n = malloc(SIZE_OF_NODE(_u));
                n->kind = k;
                n->data._u.expr = lhs;
                return n;
        }

        tmp = token;
        lhs = lhs_expression(ctx, token, &token);

        if (!lhs)
                return NULL;

        if (!token)
                goto ret;

        if (token->kind == TokenPlusPlus || token->kind == TokenMinusMinus) {
                k = token->kind == TokenPlusPlus
                        ? NodePostfixPlus1
                        : NodePostfixSub1;
                // Find the last consumed token in lhs.
                while (tmp->next != token) tmp = tmp->next;
                // No line break.
                if (token->loc.start.line != tmp->loc.end.line)
                        goto ret;
                *endptr = token->next;
                n = malloc(SIZE_OF_NODE(_u));
                n->kind = k;
                n->data._u.expr = lhs;
                return n;
        }

ret:
        *endptr = token;
        return lhs;
}

wnode *unary_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wnode *n, *expr;
        enum node_kind k;

        switch (token->kind) {
                case TokenPlus:
                        k = NodeOpPositive;
                        break;
                case TokenMinus:
                        k = NodeOpNeg;
                        break;
                case TokenBitNot:
                        k = NodeOpBitNot;
                        break;
                case TokenNot:
                        k = NodeOpNot;
                        break;
                default:
                        return update_expression(ctx, token, endptr);
        }

        expr = update_expression(ctx, token->next, &token);

        if (!expr) {
                // TODO(qti3e) error
                return NULL;
        }

        *endptr = token;
        n = malloc(SIZE_OF_NODE(_u));
        n->kind = k;
        n->data._u.expr = expr;
        return n;
}

wnode *exponentiation_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *lhs, *rhs, *n;
        int ret;

        local = token;
        lhs = rhs = NULL;

        local = token;

        ret =
                (lhs = update_expression(ctx, local, &local)) &&
                (local->kind == TokenPow) &&
                (local = local->next) &&
                (rhs = exponentiation_expression(ctx, local, &local));

        if (ret) {
                *endptr = local;
                n = malloc(SIZE_OF_NODE(op_pow));
                n->kind = NodeOpPow;
                n->data.op_pow.lhs = lhs;
                n->data.op_pow.rhs = rhs;
                return n;
        }

        /*
         * unary_expression:
         *      update_expression
         *      UNARY + unary_expression
         *      UNARY - unary_expression
         *      UNARY ~ unary_expression
         *      UNARY ! unary_expression
         *
         * And we've already looked for `update_expression` and lhs
         * might actually contain one, so we can optimize this part
         * later.
         */
        return unary_expression(ctx, token, endptr);
}

wnode *multiplicative_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *prev, *n, *right;
        enum token_kind op;
        enum node_kind k;

        n = right = NULL;
        prev = exponentiation_expression(ctx, token, &token);

        if (!prev)
                return NULL;

        while (token) {
                local = token;
                op = local->kind;

                if (!local->next || !(
                        (k = NodeOpMul, op == TokenTimes)
                        || (k = NodeOpDiv, op == TokenDiv)
                        || (k = NodeOpMod, op == TokenMod))) break;

                local = local->next;
                right = exponentiation_expression(ctx, local, &local);

                if (!right)
                        break;

                token = local;
                n = malloc(SIZE_OF_NODE(_b));
                n->kind = k;
                n->data._b.lhs = prev;
                n->data._b.rhs = right;
                prev = n;
        }

        *endptr = token;
        return prev;
}

wnode *additive_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *prev, *n, *right;
        enum token_kind op;
        enum node_kind k;

        n = right = NULL;
        prev = multiplicative_expression(ctx, token, &token);

        if (!prev)
                return NULL;

        while (token) {
                local = token;
                op = local->kind;

                if (!local->next || !(
                        (k = NodeOpAdd, op == TokenPlus)
                        || (k = NodeOpSub, op == TokenMinus))) break;

                local = local->next;
                right = multiplicative_expression(ctx, local, &local);

                if (!right)
                        break;

                token = local;
                n = malloc(SIZE_OF_NODE(_b));
                n->kind = k;
                n->data._b.lhs = prev;
                n->data._b.rhs = right;
                prev = n;
        }

        *endptr = token;
        return prev;
}

wnode *shift_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *prev, *n, *right;
        enum token_kind op;
        enum node_kind k;

        n = right = NULL;
        prev = additive_expression(ctx, token, &token);

        if (!prev)
                return NULL;

        while (token) {
                local = token;
                op = local->kind;

                if (!local->next || !(
                        (k = NodeOpLeftShift, op == TokenLeftShift)
                        || (k = NodeOpRightShift, op == TokenRightShift)
                        || (k = NodeOpSignedRightShift,
                                op == TokenSignedRightShift))) break;

                local = local->next;
                right = additive_expression(ctx, local, &local);

                if (!right)
                        break;

                token = local;
                n = malloc(SIZE_OF_NODE(_b));
                n->kind = k;
                n->data._b.lhs = prev;
                n->data._b.rhs = right;
                prev = n;
        }

        *endptr = token;
        return prev;
}

wnode *relational_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *prev, *n, *right;
        enum token_kind op;

        n = right = NULL;
        prev = shift_expression(ctx, token, &token);

        if (!prev)
                return NULL;

        while (token) {
                local = token;
                op = local->kind;

                if (!local->next || !IS_RELATIONAL_TOKEN(local))
                        break;

                local = local->next;
                right = shift_expression(ctx, local, &local);

                if (!right)
                        break;

                token = local;
                n = malloc(SIZE_OF_NODE(relational));
                n->kind = NodeRelational;
                n->data.relational.lhs = prev;
                n->data.relational.op = op;
                n->data.relational.rhs = right;
                prev = n;
        }

        *endptr = token;
        return prev;
}

wnode *equality_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *prev, *n, *right;
        enum token_kind op;

        n = right = NULL;
        prev = relational_expression(ctx, token, &token);

        if (!prev)
                return NULL;

        while (token) {
                local = token;
                op = local->kind;

                if (!local->next || !IS_EQUALITY_TOKEN(local))
                        break;

                local = local->next;
                right = relational_expression(ctx, local, &local);

                if (!right)
                        break;

                token = local;
                n = malloc(SIZE_OF_NODE(equality));
                n->kind = NodeEquality;
                n->data.equality.lhs = prev;
                n->data.equality.op = op;
                n->data.equality.rhs = right;
                prev = n;
        }

        *endptr = token;
        return prev;
}

wnode *bitwise_and_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *prev, *n, *right;

        n = right = NULL;
        prev = equality_expression(ctx, token, &token);

        if (!prev)
                return NULL;

        while (token) {
                local = token;

                if (!local->next || local->kind != TokenBitAnd)
                        break;

                local = local->next;
                right = equality_expression(ctx, local, &local);

                if (!right)
                        break;

                token = local;
                n = malloc(SIZE_OF_NODE(op_bit_and));
                n->kind = NodeOpBitAnd;
                n->data.op_bit_and.lhs = prev;
                n->data.op_bit_and.rhs = right;
                prev = n;
        }

        *endptr = token;
        return prev;
}

wnode *bitwise_xor_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *prev, *n, *right;

        n = right = NULL;
        prev = bitwise_and_expression(ctx, token, &token);

        if (!prev)
                return NULL;

        while (token) {
                local = token;

                if (!local->next || local->kind != TokenBitXor)
                        break;

                local = local->next;
                right = bitwise_and_expression(ctx, local, &local);

                if (!right)
                        break;

                token = local;
                n = malloc(SIZE_OF_NODE(op_bit_xor));
                n->kind = NodeOpBitXor;
                n->data.op_bit_xor.lhs = prev;
                n->data.op_bit_xor.rhs = right;
                prev = n;
        }

        *endptr = token;
        return prev;
}

wnode *bitwise_or_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *prev, *n, *right;

        n = right = NULL;
        prev = bitwise_xor_expression(ctx, token, &token);

        if (!prev)
                return NULL;

        while (token) {
                local = token;

                if (!local->next || local->kind != TokenBitOr)
                        break;

                local = local->next;
                right = bitwise_xor_expression(ctx, local, &local);

                if (!right)
                        break;

                token = local;
                n = malloc(SIZE_OF_NODE(op_bit_or));
                n->kind = NodeOpBitOr;
                n->data.op_bit_or.lhs = prev;
                n->data.op_bit_or.rhs = right;
                prev = n;
        }

        *endptr = token;
        return prev;
}

wnode *logical_and_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *prev, *n, *right;

        n = right = NULL;
        prev = bitwise_or_expression(ctx, token, &token);

        if (!prev)
                return NULL;

        while (token) {
                local = token;

                if (!local->next || local->kind != TokenAnd)
                        break;

                local = local->next;
                right = bitwise_or_expression(ctx, local, &local);

                if (!right)
                        break;

                token = local;
                n = malloc(SIZE_OF_NODE(op_and));
                n->kind = NodeOpAnd;
                n->data.op_and.lhs = prev;
                n->data.op_and.rhs = right;
                prev = n;
        }

        *endptr = token;
        return prev;
}

wnode *logical_or_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *prev, *n, *right;

        n = right = NULL;
        prev = logical_and_expression(ctx, token, &token);

        if (!prev)
                return NULL;

        while (token) {
                local = token;

                if (!local->next || local->kind != TokenOr)
                        break;

                local = local->next;
                right = logical_and_expression(ctx, local, &local);

                if (!right)
                        break;

                token = local;
                n = malloc(SIZE_OF_NODE(op_or));
                n->kind = NodeOpOr;
                n->data.op_or.lhs = prev;
                n->data.op_or.rhs = right;
                prev = n;
        }

        *endptr = token;
        return prev;
}

wnode *conditional_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *n, *condition, *expr_t, *expr_f;

        condition = expr_t = expr_f = n = NULL;
        local = token;

        condition = logical_or_expression(ctx, local, &local);

        if (!condition)
                return NULL;

        if (!local || local->kind != TokenQuestion) {
                /*assert(local != token);*/
                *endptr = local;
                return condition;
        }

        // Consume ?
        local = local->next;

        expr_t = assignment_expression(ctx, local, &local);

        // TODO(qti3e) Error
        if (!expr_t)
                return NULL;

        // TODO(qti3e) Error
        if (!local || local->kind != TokenColon)
                return NULL;

        // Consume :
        local = local->next;
        expr_f = assignment_expression(ctx, local, &local);

        // TODO(qti3e) Error
        if (!expr_f)
                return NULL;

        *endptr = local;
        n = malloc(SIZE_OF_NODE(conditional));
        n->kind = NodeConditional;
        n->data.conditional.condition = condition;
        n->data.conditional.expr_t = expr_t;
        n->data.conditional.expr_f = expr_f;
        return n;
}

wnode *assignment_expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *lhs, *rhs, *n;
        enum token_kind op;
        int ret;

        local = token;
        lhs = rhs = NULL;

        local = token;

        ret =
                (lhs = lhs_expression(ctx, local, &local)) &&
                (op = local->kind, IS_ASGN_TOKEN(local)) &&
                (local = local->next) &&
                (rhs = assignment_expression(ctx, local, &local));

        // free lhs & rhs
        if (!ret)
                return conditional_expression(ctx, token, endptr);

        *endptr = local;
        n = malloc(SIZE_OF_NODE(assignment));
        n->kind = NodeAssignment;
        n->data.assignment.lhs = lhs;
        n->data.assignment.op = op;
        n->data.assignment.rhs = rhs;
        return n;
}

wnode *expression(context *ctx, wtoken *token, wtoken **endptr)
{
        wtoken *local;
        wnode *prev, *n, *right;

        prev = assignment_expression(ctx, token, &token);

        if (!prev)
                return NULL;

        while (token) {
                local = token;

                if (!local->next || local->kind != TokenComma)
                        break;

                local = local->next;
                right = assignment_expression(ctx, local, &local);

                if (!right)
                        break;

                token = local;
                n = malloc(SIZE_OF_NODE(op_comma));
                n->kind = NodeOpComma;
                n->data.op_comma.lhs = prev;
                n->data.op_comma.rhs = right;
                prev = n;
        }

        *endptr = token;
        return prev;
}

wnode *expression_statement(context *ctx, wtoken *token, wtoken **endptr)
{
        assert(token->kind != TokenLeftBrace);

        if (ID(token, "let") && token->next &&
                        token->next->kind == TokenLeftBracket) {
                // TODO(qti3e) Set error.
                return NULL;
        }

        wnode *node, *expr;
        expr = expression(ctx, token, endptr);

        if (expr == NULL)
                return NULL;

        node = malloc(SIZE_OF_NODE(expression_statement));
        node->kind = NodeExpressionStatement;
        node->data.expression_statement.expr = expr;
        return node;
}

wnode *block_statement(context *ctx, wtoken *token, wtoken **endptr)
{
        assert(token->kind == TokenLeftBrace);
        NOT_IMPLEMENTED;
}

wnode *if_statement(context *ctx, wtoken *token, wtoken **endptr)
{
        assert(ID(token, "if"));
        NOT_IMPLEMENTED;
}

wnode *for_statement(context *ctx, wtoken *token, wtoken **endptr)
{
        assert(ID(token, "for"));
        NOT_IMPLEMENTED;
}

wnode *return_statement(context *ctx, wtoken *token, wtoken **endptr)
{
        assert(ID(token, "return"));
        NOT_IMPLEMENTED;
}

wnode *statement(context *ctx, wtoken *token, wtoken **endptr)
{
        wnode *node;
        switch (token->kind) {
                case TokenSemicolon:
                        node = malloc(SIZE_OF_NODE(empty_statement));
                        node->kind = NodeEmptyStatement;
                        *endptr = token->next;
                        return node;
                case TokenLeftBrace:
                        return block_statement(ctx, token, endptr);
                case TokenIdentifier:
                        if (ID(token, "if"))
                                return if_statement(ctx, token, endptr);
                        if (ID(token, "for"))
                                return for_statement(ctx, token, endptr);
                        if (ID(token, "return"))
                                return return_statement(ctx, token, endptr);
                default:
                        return expression_statement(ctx, token, endptr);
        }
}

wnode *statement_list_item(context *ctx, wtoken *token, wtoken **endptr)
{
        wnode *node;
        node = statement(ctx, token, endptr);
        if (node)
                return node;
        *endptr = token;
        return declaration(ctx, token, endptr);
}

wnode *program(context *ctx, wtoken *token, wtoken **endptr)
{
        int size, num;
        wnode *node, **statements, *statement;

        num = 0;
        size = 10;
        statements = malloc(sizeof(*statements) * size);
        assert(statements != NULL);

        while (token && token->kind != TokenEOF) {
                if (token->kind == TokenSemicolon) {
                        token = token->next;
                        continue;
                }

                statement = statement_list_item(ctx, token, &token);

                if (!statement) {
                        free_nodes(statements, num);
                        return NULL;
                }

                num++;
                if (num > size) {
                        size *= 2;
                        statements = realloc(statements,
                                        sizeof(*statements) * size);
                        assert(statements != NULL);
                }

                statements[num - 1] = statement;
        }

        statement = realloc(statement, sizeof(*statements) * num);
        assert(statements != NULL);

        *endptr = token;
        node = malloc(SIZE_OF_NODE(program));
        node->kind = NodeProgram;
        node->data.program.num_statements = num;
        node->data.program.statements = statements;
        return node;
}

wnode *parse(context *ctx, wtoken *tokens)
{
        wnode *root;
        root = program(ctx, tokens, &tokens);
        assert(tokens && tokens->kind == TokenEOF);
        return root;
}

void free_nodes(wnode **nodes, int num)
{
        // TODO(qti3e)
}

#define TAB 4
void dump_node_i(wnode *node, int call)
{
        static const char *ops[] = {
                ","  , "||" , "&&" , "|"  , "^"  , "&"  , "<<" ,
                ">>" , ">>>", "+"  , "-"  , "*"  , "/"  , "%"  ,
                "**" , "+"  , "-"  , "~"  , "!"  , "++" , "--" ,
                "new", "++" , "--" , NULL , NULL , NULL , NULL , // NodeProgram
                NULL , NULL , NULL , NULL , "."  , NULL , NULL , // NodeIdName
                NULL , NULL , NULL , NULL , NULL , NULL , NULL , // NConditional
                NULL , NULL
        };

        // category of the node:
        // 0: special
        // 1: unary
        // 2: binary
        // 3: postfix
        // 4: binary with op
        static int class[] = {
                2 , 2 , 2 , 2 , 2 , 2 , 2 , // <<
                2 , 2 , 2 , 2 , 2 , 2 , 2 , // %
                2 , 1 , 1 , 1 , 1 , 1 , 1 , // --
                1 , 3 , 3 , 4 , 4 , 4 , 0 , // NodeProgram
                0 , 0 , 0 , 0 , 0 , 0 , 0 , // NodeIdName
                0 , 0 , 0 , 0 , 0 , 0 , 0 , // NodeConditional
                0 , 0
        };

        printf("%*s", call * TAB, "");

        if (node == NULL) {
                printf("node: [--null--]");
                return;
        }

        enum node_kind kind;
        const char *op;
        int n;

        // to format an string literal.
        char *str;
        unsigned int len;

        kind = node->kind;
        op = ops[kind];

        switch (class[kind]) {
                case 0:
                        goto sp;
                case 1:
                        goto unary;
                case 2:
                        goto binary;
                case 3:
                        goto postfix;
                case 4:
                        goto binary_op;
        }

unary:
        printf("| UNARY %s\n", op);
        goto pu_inner;
postfix:
        printf("| POSTFIX %s\n", op);
pu_inner:
        dump_node_i(node->data._u.expr, call + 1);
        return;

binary:
        printf("| BINARY %s\n", op);
        dump_node_i(node->data._b.lhs, call + 1);
        dump_node_i(node->data._b.rhs, call + 1);
        return;

binary_op:
        // TODO(qti3e)
        printf("| BINARY %s\n", tokens_str[node->data._bo.op]);
        dump_node_i(node->data._bo.lhs, call + 1);
        dump_node_i(node->data._bo.rhs, call + 1);
        return;

sp:
        switch (kind) {
                case NodeProgram:
                        printf("| Program\n");
                        goto block_body;
                case NodeBlockStatement:
                        printf("| BLOCK\n");
block_body:
                        n = node->data.program.num_statements;
                        wnode **s = node->data.program.statements;
                        for (int i = 0; i < n; ++i)
                                dump_node_i(s[i], call + 1);
                        break;
                case NodeExpressionStatement:
                        printf("| EXPR STATEMENT\n");
                        dump_node_i(node->data.expression_statement.expr,
                                        call + 1);
                        break;
                case NodeIdName:
                        printf("| ID [%s]\n", node->data.id_name.id);
                        break;
                case NodeMember:
                case NodeComputedMember:
                        printf("| MEMBER\n");
                        dump_node_i(node->data.member.obj, call + 1);
                        dump_node_i(node->data.member.prop, call + 1);
                        break;
                case NodeConditional:
                        printf("| TERNARY\n");
                        dump_node_i(node->data.conditional.condition, call + 1);
                        dump_node_i(node->data.conditional.expr_t, call + 1);
                        dump_node_i(node->data.conditional.expr_f, call + 1);
                        break;
                case NodeGroupExpr:
                        printf("| GROUP\n");
                        dump_node_i(node->data.group_expr.expr, call + 1);
                        break;
                case NodeThis:
                        printf("| THIS\n");
                        break;
                case NodeNullLiteral:
                        printf("| NULL\n");
                        break;
                case NodeTrueLiteral:
                        printf("| TRUE\n");
                        break;
                case NodeFalseLiteral:
                        printf("| FALSE\n");
                        break;
                case NodeStringLiteral:
                        len = node->data.string_literal.length;
                        str = node->data.string_literal.buf;
                        if (len > 15) {
                                str = malloc(16);
                                strncpy(str, node->data.string_literal.buf, 12);
                                str[12] = str[13] = str[14] = '.';
                                str[15] = 0;
                        }
                        printf("| STRING\t%s\n", str);
                        if (len > 15)
                                free(str);
                        break;
                case NodeNumericLiteral:
                        printf("| NUMBER\t%Lf\n",
                                        node->data.numeric_literal.number);
                        break;
                default:
                        printf("-- unsupported [%d] --\n", kind);
        }
}
#undef TAB

void dump_node(wnode *node)
{
        dump_node_i(node, 0);
}
