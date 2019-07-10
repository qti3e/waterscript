#include <stdlib.h>
#include "pool.h"

constant_pool *constant_pool_init(size_t size)
{
        constant_pool *cp = malloc(sizeof(*cp));
        cp->size = size;
        cp->cursor = 0;
        cp->data = malloc(size);
        return cp;
}

size_t constant_pool_write(constant_pool *cp, void *data, size_t num)
{
        size_t new_size, cursor;
        char *write_base;

        if (cp->size < cp->cursor + num) {
                new_size = cp->cursor + num + 1024;
                cp->data = realloc(cp->data, new_size);
                cp->size = new_size;
        }

        cursor = 0;
        write_base = cp->data + cp->cursor;

        for (cursor = 0; cursor < num; ++cursor) {
                write_base[cursor] = ((char *)data)[cursor];
        }

        cursor = cp->cursor;
        cp->cursor += num;

        return cursor;
}

void *constant_pool_read(constant_pool *cp, size_t offset)
{
        return cp->data + offset;
}
