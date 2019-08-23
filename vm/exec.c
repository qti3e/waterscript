#include <stdio.h>
#include <unistd.h>
#include "exec.h"
#include "wval.h"
#include "context.h"
#include "compiler.h"
#include "bytecode.h"

ws_val *exec(ws_context *ctx, ws_function_compiled_data *function)
{
  unsigned long cursor = 0, next_cursor = 0;
  unsigned int bytecode;
  uint8_t *data = function->data;

  while (cursor < function->constant_pool_offset)
  {
    bytecode = data[cursor];
    next_cursor = cursor + 1 + WS_BYTECODE_SIZE[bytecode];

    switch (bytecode)
    {
    case WB_LD_TWO:
      context_ds_push(ctx, (ws_val *)&WS_TWO);
      break;

    default:
      fprintf(stderr, "TODO: %s\n", WS_BYTECODE_NAME[bytecode]);
    }

    cursor = next_cursor;
  }

  return context_ds_pop(ctx);
}