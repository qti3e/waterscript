#include <stdio.h>
#include <unistd.h>
#include <locale.h>
#include "context.h"
#include "wval.h"
#include "utf8.h"
#include "compiled.h"
#include "common.h"

int main()
{
  setlocale(LC_ALL, "en_US.UTF-8");

  ws_context *ctx = context_create();
  context_new_scope(ctx, 0);

  char16_t keystr[] = u"test";
  char16_t keystr2[] = u"a";
  char16_t valstr[] = u"سلام X A 🍌\n";

  ws_val *key = ws_string(keystr, sizeof(keystr));
  ws_val *key2 = ws_string(keystr2, sizeof(keystr2));
  ws_val *value = ws_string(valstr, sizeof(valstr));

  printf("Start\n");
  context_define(ctx, key, value, 1);
  context_define(ctx, key2, (ws_val *)&WS_TRUE, 1);

  ws_utf8 *data = ws_string_to_utf8(context_resolve(ctx, key));
  write(1, &data->data, data->size);

  ws_function *fn = get_function(1, ctx->scope);
  dump_code(fn->data);

  double num = 5.3;
  for (size_t i = 0; i < sizeof(num); ++i)
    printf(" %#04x", ((char *)&num)[i]);

  printf("\nEnd\n");
}