#include <stdlib.h>
#include <stdatomic.h>
#include <setjmp.h>
#include "wval.h"
#include "context.h"

void wval_retain(wval *v)
{
        if (v == NULL) return;
        ++v->_ref_count;
}

void wval_release(wval *v)
{
        if (v == NULL) return;
        --v->_ref_count;
}

wval *wval_num(long double number) {
        wval *val = malloc(sizeof(*val));
        val->type = WS_NUMBER;
        val->_ref_count  = 0;
        val->data.number = number;
        return val;
}

// TODO(qti3e)
