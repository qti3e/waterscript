#include <stdio.h>
#include <unistd.h>
#include <locale.h>
#include "context.h"
#include "wval.h"

int main()
{
  setlocale(LC_ALL, "en_US.UTF-8");

  ws_context *ctx = context_create();
  context_new_scope(ctx, 0);

  ws_val key1 = {.type = WVAL_TYPE_SYMBOL, .data.symbol.id = 1, .ref_count = 0};
  ws_val key2 = {.type = WVAL_TYPE_SYMBOL, .data.symbol.id = 2, .ref_count = 0};

  ws_val val = {
      .type = WVAL_TYPE_NUMBER,
      .ref_count = 1,
      .data.number = 3.6};

  ws_val val2 = {
      .type = WVAL_TYPE_NUMBER,
      .ref_count = 1,
      .data.number = 6};

  context_define(ctx, &key1, &val, 1);
  context_define(ctx, &key2, &val2, 1);

  table_del(ctx, &ctx->scope->table, &key1);
  context_define(ctx, &key1, &val, 1);

  ws_val *value = context_resolve(ctx, &key1);
  if (value == NULL)
  {
    printf("NULL\n");
  }
  else if (value->type == WVAL_TYPE_NUMBER)
  {
    printf("Num %f\n", value->data.number);
  }
}