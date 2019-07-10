#include <assert.h>
#include <stdio.h>
#include "wval.h"
#include "context.h"
#include "lexer.h"
#include "parser.h"
#include "gen.h"

int main(int argc, char **argv)
{
        char *source = "2 + 3 * 45";
        wtoken *tokens = tokenize(source);
        wnode *node = parse(NULL, tokens);
        dump_node(node);

        printf("----------\n");

        char *code_buf = compile(node);
        dump_bytecodes(code_buf);

        return 0;
}
