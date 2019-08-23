#include "wval.h"
#include "alloc.h"

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
  string->data.string.data = data;
  string->data.string.size = size;
  return string;
}