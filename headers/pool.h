#ifndef __WS_POOL__
#define __WS_POOL__

typedef struct _constant_pool constant_pool;

struct _constant_pool {
        size_t size;
        size_t cursor;
        void *data;
};

constant_pool *constant_pool_init(size_t size);
size_t constant_pool_write(constant_pool *cp, void *data, size_t num);
void *constant_pool_read(constant_pool *cp, size_t offset);


#endif
