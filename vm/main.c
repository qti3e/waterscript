#include <stdio.h>
#include <unistd.h>
#include <locale.h>
#include "context.h"
#include "wval.h"
#include "utf8.h"

int main()
{
  setlocale(LC_ALL, "en_US.UTF-8");

  ws_context *ctx = context_create();
  context_new_scope(ctx, 0);

  ws_val key1 = {.type = WVAL_TYPE_SYMBOL, .data.symbol.id = 1, .ref_count = 0};

  char16_t wcs[] = u"سلام X A 🍌\n"; // or "z\u00df\u6c34\U0001f34c"

  ws_val *val = ws_string(wcs, sizeof(wcs));

  context_define(ctx, &key1, val, 1);

  ws_utf8 *data = ws_string_to_utf8(val);
  write(1, &data->data, data->size);

  printf("End\n");
}