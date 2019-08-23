#include <stdio.h>
#include <unistd.h>
#include "exec.h"
#include "wval.h"
#include "context.h"
#include "compiler.h"
#include "bytecode.h"

ws_val *call(ws_context *ctx, ws_function *function)
{
  return NULL;
}

ws_val *exec(ws_context *ctx, ws_function_compiled_data *function)
{
  unsigned long cursor = 0, next_cursor = 0;
  unsigned int bytecode;
  uint8_t *data = function->data;

  ws_val *a;
  ws_val *b;

  while (cursor < function->constant_pool_offset)
  {
    bytecode = data[cursor];
    next_cursor = cursor + 1 + WS_BYTECODE_SIZE[bytecode];

    switch (bytecode)
    {
    case WB_LD_UNDEF:
    {
      context_ds_push(ctx, (ws_val *)&WS_UNDEFINED);
      break;
    }

    case WB_LD_NULL:
    {
      context_ds_push(ctx, (ws_val *)&WS_NULL);
      break;
    }

    case WB_LD_FALSE:
    {
      context_ds_push(ctx, (ws_val *)&WS_FALSE);
      break;
    }

    case WB_LD_TRUE:
    {
      context_ds_push(ctx, (ws_val *)&WS_TRUE);
      break;
    }

    case WB_LD_ZERO:
    {
      context_ds_push(ctx, (ws_val *)&WS_ZERO);
      break;
    }

    case WB_LD_ONE:
    {
      context_ds_push(ctx, (ws_val *)&WS_ONE);
      break;
    }

    case WB_LD_TWO:
    {
      context_ds_push(ctx, (ws_val *)&WS_TWO);
      break;
    }

    case WB_POP:
    {
      wval_release(context_ds_pop(ctx));
      break;
    }

    case WB_DUP:
    {
      a = context_ds_peek(ctx);
      context_ds_push(ctx, a);
      wval_release(a);
      a = NULL;
      break;
    }

    case WB_SWAP:
    {
      a = context_ds_pop(ctx);
      b = context_ds_pop(ctx);
      context_ds_push(ctx, a);
      context_ds_push(ctx, b);
      wval_release(a);
      wval_release(b);
      a = b = NULL;
    }

    default:
      fprintf(stderr, "TODO: %s\n", WS_BYTECODE_NAME[bytecode]);
    }

    cursor = next_cursor;
  }

  return context_ds_pop(ctx);
}