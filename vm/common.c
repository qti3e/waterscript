#include <stdio.h>
#include <stdlib.h>
#include "wval.h"
#include "common.h"

void die(char *msg)
{
  fprintf(stderr, "%s\n", msg);
  exit(-1);
}

unsigned long ws_hash(ws_val *value)
{
  unsigned long hash = 0;
  unsigned int n;
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