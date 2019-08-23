#include <stdio.h>
#include "wval.h"
#include "common.h"

void die(char *msg)
{
  fprintf(stderr, msg);
  exit(-1);
}

unsigned long ws_hash(ws_val *value)
{
  unsigned long hash = 0;

  switch (value->type)
  {
  case WVAL_TYPE_STRING:

    int n = value->data.string.size - 1;
    char *data = (char *)value->data.string.data;

    for (; n >= 0; --n)
    {
      hash = ((hash << 5) - hash) + data[n];
    }

    return hash;

  case WVAL_TYPE_SYMBOL:
    return value->data.symbol.id * 27;
  }
}