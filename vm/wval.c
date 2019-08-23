#include "wval.h"
#include "alloc.h"
#include "common.h"

const ws_val WS_UNDEFINED = {.type = WVAL_TYPE_UNDEFINED, .ref_count = 2727};
const ws_val WS_NULL = {.type = WVAL_TYPE_NULL, .ref_count = 2727};
const ws_val WS_TRUE = {.type = WVAL_TYPE_BOOLEAN, .data.boolean = 1, .ref_count = 2727};
const ws_val WS_FALSE = {.type = WVAL_TYPE_BOOLEAN, .data.boolean = 0, .ref_count = 2727};
const ws_val WS_ZERO = {.type = WVAL_TYPE_NUMBER, .data.number = 0.0, .ref_count = 2727};
const ws_val WS_ONE = {.type = WVAL_TYPE_NUMBER, .data.number = 1.0, .ref_count = 2727};
const ws_val WS_TWO = {.type = WVAL_TYPE_NUMBER, .data.number = 2.0, .ref_count = 2727};

void wval_retain(ws_val *value)
{
  if (value == NULL)
    return;
  ++value->ref_count;
}

void wval_release(ws_val *value)
{
  if (value == NULL)
    return;
  --value->ref_count;
  if (value->ref_count)
  {
    // TODO(qti3e) GC.
  }
}

int wval_strict_equal(ws_val *v1, ws_val *v2)
{
  unsigned int n;
  char16_t *str1, *str2;

  if (v1 == v2)
    return 1;

  if (v1->type != v2->type)
    return 0;

  switch (v1->type)
  {
  case WVAL_TYPE_NULL:
    return 1;

  case WVAL_TYPE_UNDEFINED:
    return 1;

  case WVAL_TYPE_BOOLEAN:
    return v1->data.boolean == v2->data.boolean;

  case WVAL_TYPE_NUMBER:
    return v1->data.number == v2->data.number;

  case WVAL_TYPE_OBJECT:
    return v1->data.object == v2->data.object;

  case WVAL_TYPE_SYMBOL:
    return v1->data.symbol.id == v2->data.symbol.id;

  case WVAL_TYPE_STRING:
    if (v1->data.string.size != v2->data.string.size)
      return 0;
    n = v1->data.string.size - 1;
    str1 = v1->data.string.data;
    str2 = v2->data.string.data;
    for (; n >= 0; --n)
      if (str1[n] != str2[n])
        return 0;
    return 1;
  }
}

ws_val *ws_string(char16_t *data, size_t size)
{
  ws_val *string = (ws_val *)ws_alloc(sizeof(*string));
  string->type = WVAL_TYPE_STRING;
  string->ref_count = 0;
  string->data.string.data = data;
  string->data.string.size = size;
  return string;
}

ws_val *ws_symbol(ws_val *description)
{
  static atomic_uint last_symbol_id = 0;

  ws_val *value = (ws_val *)ws_alloc(sizeof(*value));
  value->type = WVAL_TYPE_STRING;
  value->ref_count = 0;
  value->data.symbol.id = ++last_symbol_id;
  value->data.symbol.description = description;
  wval_retain(description);
  return value;
}

ws_val *ws_number(double number)
{
  ws_val *value = (ws_val *)ws_alloc(sizeof(*value));
  value->type = WVAL_TYPE_STRING;
  value->ref_count = 0;
  value->data.number = number;
  return value;
}

ws_val *ws_object(ws_context *ctx, ws_val *proto)
{
  if (proto != NULL && proto->type != WVAL_TYPE_OBJECT)
    die("ws_object: Cannot use a non-object value as prototype.");

  ws_obj *object = (ws_obj *)ws_alloc(sizeof(*object));
  object->call = NULL;
  object->construct = NULL;
  object->proto = proto == NULL ? NULL : proto->data.object;
  wval_retain(proto);
  table_init(ctx, &object->properties);

  ws_val *value = (ws_val *)ws_alloc(sizeof(*value));
  value->type = WVAL_TYPE_STRING;
  value->ref_count = 0;
  value->data.object = object;
  return value;
}