#include <stdio.h>
#include <stdlib.h>
#include "wval.h"
#include "compiler.h"
#include "common.h"
#include "bytecode.h"
#include "utf8.h"
#include "alloc.h"

void die(char *msg)
{
  fprintf(stderr, "%s\n", msg);
  exit(-1);
}

unsigned long ws_hash(ws_val *value)
{
  unsigned long hash = 0;
  int n;
  char *data;

  switch (value->type)
  {
  case WVAL_TYPE_STRING:
    n = value->data.string.size - 1;
    data = (char *)value->data.string.data;
    for (; n >= 0; --n)
      hash = ((hash << 5) - hash) + data[n];
    return hash;

  case WVAL_TYPE_SYMBOL:
    hash = value->data.symbol.id;
    return (hash << 5) - hash;

  default:
    die("ws_hash: Cannot hash a value that isn't either string or symbol.");
  }

  return -1;
}

void dump_code(ws_function_compiled_data *data)
{
  int size;

  for (size_t i = 0; i < data->constant_pool_offset; ++i)
  {
    printf("| %-18s | ", WS_BYTECODE_NAME[data->data[i]]);
    printf("%#04x", data->data[i]);

    size = WS_BYTECODE_SIZE[data->data[i]];
    for (int j = 0; j < size; ++j, ++i)
      printf(" %#04x", data->data[i + 1]);

    printf("\n");
  }
}

ws_val *escape_string(ws_val *value)
{
  size_t size, cursor, cursor2;
  char16_t *ret;
  char16_t escapes[] = u"\0\b\t\n\v\f\r\"\'\\";
  char16_t escaped[] = u"0btnvfr\"\'\\";
  size_t num_escapes = sizeof(escaped) / 2 - 1;

  size = value->data.string.size;
  for (cursor = 0; cursor < value->data.string.size / 2 - 1; ++cursor)
  {
    for (size_t i = 0; i < num_escapes; ++i)
    {
      if (escapes[i] == value->data.string.data[cursor])
      {
        size += 2;
        break;
      }
    }
  }

  ret = (char16_t *)ws_alloc(size);
  for (cursor = 0, cursor2 = 0; cursor < value->data.string.size / 2 - 1; ++cursor, ++cursor2)
  {
    ret[cursor2] = value->data.string.data[cursor];
    for (size_t i = 0; i < num_escapes; ++i)
    {
      if (escapes[i] == value->data.string.data[cursor])
      {
        ret[cursor2] = *u"\\";
        ret[cursor2 + 1] = escaped[i];
        cursor2 += 1;
        break;
      }
    }
  }

  ret[cursor2] = 0;

  return ws_string(ret, size);
}

void dump_value(ws_val *value)
{
  // TODO(qti3e) Make this better, and use ws_free.

  if (value == NULL)
  {
    printf("dump_value: Value cannot be null.\n");
    return;
  }

  ws_utf8 *utf8;

  switch (value->type)
  {
  case WVAL_TYPE_BOOLEAN:
    printf(value->data.boolean ? "true\n" : "false\n");
    return;
  case WVAL_TYPE_UNDEFINED:
    printf("undefined\n");
    return;
  case WVAL_TYPE_NULL:
    printf("null\n");
    return;
  case WVAL_TYPE_SYMBOL:
    if (value->data.symbol.description != NULL)
    {
      utf8 = ws_string_to_utf8(value->data.symbol.description);
      printf("Symbol(%d)[%.*s]\n", value->data.symbol.id, utf8->size, utf8->data);
    }
    else
    {
      printf("Symbol(%d)\n", value->data.symbol.id);
    }
    return;
  case WVAL_TYPE_OBJECT:
    printf("Object {...}\n");
    return;
  case WVAL_TYPE_STRING:
    utf8 = ws_string_to_utf8(escape_string(value));
    printf("\"%.*s\"\n", utf8->size, utf8->data);
    return;
  case WVAL_TYPE_NUMBER:
    printf("%f\n", value->data.number);
    return;
  }
}