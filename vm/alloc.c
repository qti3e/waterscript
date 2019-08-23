#include "common.h"
#include "alloc.h"

void *ws_alloc(size_t size)
{
  void *ptr = malloc(size);
  if (ptr == NULL)
    die("Memory allocation failed.");
  return ptr;
}