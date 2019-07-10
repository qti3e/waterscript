#include <string.h>
#include "test.h"
#include "pool.h"

WSTEST(constant_pool)
{
        size_t o1, o2;
        char *d1, *d2;
        char *data_1 = "Hello\n";
        char *data_2 = "This is working :)";

        constant_pool *cp = constant_pool_init(0);

        wassert(cp->cursor == 0);
        wassert(cp->size == 0);

        o1 = constant_pool_write(cp, data_1, strlen(data_1));

        wassert(cp->cursor == strlen(data_1));
        wassert(cp->size >= strlen(data_1));

        o2 = constant_pool_write(cp, data_2, strlen(data_2));

        wassert(cp->cursor == strlen(data_1) + strlen(data_2));
        wassert(cp->size >= strlen(data_1) + strlen(data_2));

        d1 = constant_pool_read(cp, o1);
        wassert(strncmp(d1, data_1, strlen(data_1)) == 0);

        d2 = constant_pool_read(cp, o2);
        wassert(strncmp(d2, data_2, strlen(data_2)) == 0);

        return 0;
}

