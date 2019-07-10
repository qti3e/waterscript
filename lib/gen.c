#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include "wval.h"
#include "context.h"
#include "lexer.h"
#include "parser.h"
#include "gen.h"

struct bytecode_array {
        size_t size;
        size_t cursor;
        char *constant_pool;
        char *head;
};

void grow(struct bytecode_array *b)
{
        size_t size = b->size + 128;
        b->head = realloc(b->head, size);
        assert(b->head != NULL);
        b->size = size;
}

void wb(struct bytecode_array *b, char c)
{
        if (b->cursor >= b->size)
                grow(b);
        b->head[b->cursor] = c;
        b->cursor++;
}

void wb_alloc(struct bytecode_array *b, size_t size)
{
        if (b->cursor + size < b->size)
                return;
        b->size += size;
        b->head = realloc(b->head, b->size);
        assert(b->head != NULL);
}

void wb_write(struct bytecode_array *b, const void *data, size_t num)
{
        size_t num_org;
        char *ptr;
        num_org = num;
        // Make sure there is enough space in the bytecode array.
        wb_alloc(b, num);
        ptr = &(b->head[b->cursor]);
        for (; num > 0; --num, ++data, ++ptr)
                *ptr = *((char *)data);
        b->cursor += num_org;
}

void visit(struct bytecode_array *b, wnode *n)
{
#define BINARY_CASE(node_kind, bytecode)         \
        node_kind:                               \
                visit(b, n->data._b.lhs);        \
                visit(b, n->data._b.rhs);        \
                wb(b, bytecode);                 \
                break                            \

        switch (n->kind) {
        case NodeOpComma:
                visit(b, n->data.op_comma.lhs); // Push lhs to the stack.
                wb(b, WbDrop);                  // Drop lhs from the stack.
                visit(b, n->data.op_comma.rhs); // Push rhs to the stack.
                break;
        case BINARY_CASE(NodeOpOr, WbLogicalOr);
        case BINARY_CASE(NodeOpAnd, WbLogicalAnd);
        case BINARY_CASE(NodeOpBitOr, WbBitwiseOr);
        case BINARY_CASE(NodeOpBitXor, WbBitwiseXor);
        case BINARY_CASE(NodeOpBitAnd, WbBitwiseAnd);
        case BINARY_CASE(NodeOpLeftShift, WbLeftShift);
        case BINARY_CASE(NodeOpRightShift, WbRightShift);
        case BINARY_CASE(NodeOpSignedRightShift, WbSignedRightShift);
        case BINARY_CASE(NodeOpAdd, WbAdd);
        case BINARY_CASE(NodeOpSub, WbSub);
        case BINARY_CASE(NodeOpMul, WbMul);
        case BINARY_CASE(NodeOpDiv, WbDiv);
        case BINARY_CASE(NodeOpMod, WbMod);
        case BINARY_CASE(NodeOpPow, WbPow);
        case NodeOpPositive:
                visit(b, n->data.op_positive.expr);
                wb(b, WbPositive);
                break;
        case NodeOpNeg:
                visit(b, n->data.op_neg.expr);
                wb(b, WbNeg);
                break;
        case NodeOpBitNot:
                visit(b, n->data.op_bit_not.expr);
                wb(b, WbBitwiseNot);
                break;
        case NodeOpNot:
                visit(b, n->data.op_not.expr);
                wb(b, WbNot);
                break;
        case NodeMember:
                visit(b, n->data.member.obj);
                assert(n->data.member.prop->kind == NodeIdName);
                wb(b, WbGetProperty);
                // TODO(qti3e) We actually need to have a constant pool.
                /*wb_write(b, */
                break;
        case NodeExpressionStatement:
                visit(b, n->data.expression_statement.expr);
                break;
        case NodeNumericLiteral:
                wb(b, WbLdWVal);
                wval *num_var = wval_num(n->data.numeric_literal.number);
                wb_write(b, &num_var, 8);
                break;
        case NodePlus1:
                // TODO(qti3e)
                // a++;
                // Load a
                // ToNumber
                // Dup
                // LdOne
                // Add
                // Store a
        case NodeSub1:
                // TODO(qti3e)
                // a--;
                // Load a
                // ToNumber
                // Dup
                // LdOne
                // Sub
                // Store a    ; Note: `Store` pops from the stack.
        case NodePostfixPlus1:
                // TODO(qti3e)
                // ++a;
                // Load a
                // ToNumber
                // LdOne
                // Add
                // Dup
                // Store a
        case NodePostfixSub1:
                // TODO(qti3e)
                // --a;
                // Load a
                // ToNumber
                // LdOne
                // Sub
                // Dup
                // Store a
        case NodeThis:
                wb(b, WbLdThis);
                break;
        default:
                wb(b, WbAbort);
        }

#undef BINARY_CASE
}

char *compile(wnode *node)
{
        int i;
        struct bytecode_array b;

        b.size = 16;
        b.cursor = 0;
        b.head = malloc(b.size);

        assert(node->kind == NodeProgram);

        for (i = 0; i < node->data.program.num_statements; ++i)
                visit(&b, node->data.program.statements[i]);

        // Add return statement.
        wb(&b, WbLdUndefined);
        wb(&b, WbRet);

        // Append a 0xff at the end of the tokens.
        wb(&b, -1);

        // Free extra allocated data.
        b.head = realloc(b.head, b.cursor);

        return b.head;
}

void dump_bytecodes(char *buf)
{
        int n;
        enum bytecodes bc;
        size_t size;

        n = 0;

        while (*buf != -1) {
                bc = *buf;
                size = wb_size[bc];

                printf("0x%04x  ", n++);

                for (; size > 0; --size, ++buf)
                        printf("%02x ", (unsigned char)*buf);

                printf("%*s %s\n", 30 - (wb_size[bc] * 3), "", wb_names[bc]);
        }
}
