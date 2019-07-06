#ifndef __WS_TESTS__
#define __WS_TESTS__

#include <stdatomic.h>
#include <stdlib.h>
#include <stdio.h>

#define NUM_TESTS 1000
#define LOADING 27

struct test_data {
	char *name;
	int (*test_fn) (char **assert_buf);
        int status;
        char *buf;
};

static struct test_data ws_tests[NUM_TESTS];

#define WSTEST(_test) \
	int ws_test##_##_test(char **assert_buf)

#define REG_TEST(_test) \
        extern int ws_test##_##_test(); \
	register_test(#_test, ws_test##_##_test)

// Only to be used inside WSTEST.
#define wassert(expr) \
        if (!(expr)) { \
                *assert_buf = malloc(512); \
                sprintf(*assert_buf, __FILE__ ":%d " #expr, __LINE__ - 2); \
                return 1; \
        } \

#endif
