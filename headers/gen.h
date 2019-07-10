#ifndef __WS_GEN__
#define __WS_GEN__

/**
 * List of all of WS VM bytecodes in the following format:
 *
 * > Name, Size
 *
 * Where size indicateds number of bytes that bytecode consumes
 * (yes, bytecodes are fixed size).
 *
 * For example WbAdd is only one byte, we do not need anything
 * else for that bytecode but something like WbLdStr requires
 * about 9 bytes, the first but will be the bytecode it self
 * and next 8 bytes is a pointer to wstr value.
 *
 * (Maybe we can use constant pool in the furture but for now
 *  we just want to make it work.)
 */
#define FOREACH_BYTECODE(V)                      \
        V(WbDrop, 1)                             \
        V(WbDup, 1)                              \
        V(WbAbort, 1)                            \
        V(WbLogicalOr, 1)                        \
        V(WbLogicalAnd, 1)                       \
        V(WbBitwiseOr, 1)                        \
        V(WbBitwiseXor, 1)                       \
        V(WbBitwiseAnd, 1)                       \
        V(WbLeftShift, 1)                        \
        V(WbRightShift, 1)                       \
        V(WbSignedRightShift, 1)                 \
        V(WbAdd, 1)                              \
        V(WbSub, 1)                              \
        V(WbMul, 1)                              \
        V(WbDiv, 1)                              \
        V(WbMod, 1)                              \
        V(WbPow, 1)                              \
        V(WbPositive, 1)                         \
        V(WbNeg, 1)                              \
        V(WbBitwiseNot, 1)                       \
        V(WbNot, 1)                              \
        V(WbLdThis, 1)                           \
        V(WbLdNull, 1)                           \
        V(WbLdUndefined, 1)                      \
        V(WbLdNaN, 1)                            \
        V(WbLdInfinity, 1)                       \
        V(WbGetProperty, 9)                      \
        V(WbLdWVal, 9)                           \
        V(WbRet, 1)                              \

#define GEN_BYTECODE_ENUM(bc, _) bc,
#define GEN_BYTECODE_SIZE(_, size) size,
#define GEN_BYTECODE_NAME(bc, _) #bc,

enum bytecodes {
        FOREACH_BYTECODE(GEN_BYTECODE_ENUM)
};

static const int wb_size[] = {
        FOREACH_BYTECODE(GEN_BYTECODE_SIZE)
};

static const char *wb_names[] = {
        FOREACH_BYTECODE(GEN_BYTECODE_NAME)
};

char *compile(wnode *node);
void dump_bytecodes(char *buf);

#endif
