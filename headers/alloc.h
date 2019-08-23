#ifndef _Q_WS_ALLOC_
#define _Q_WS_ALLOC_

#include <stdlib.h>

/**
 * This functions will help us have more control over memory allocation
 * and using them we might be able to provide snapshots :)
 */

/**
 * Allocate the memory and dies if it fails.
 */
void *ws_alloc(size_t size);

/**
 * Free the allocated memory.
 */
#define ws_free(ptr) free(ptr)

#endif