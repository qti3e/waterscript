#ifndef __WS_WVAL__
#define __WS_WVAL__

#include <stdatomic.h>

typedef struct _wtable wtable;
typedef struct _context context;

#ifndef GEN_ENUM
#define GEN_ENUM(E) E,
#endif

#define FOREACH_WVAL_TYPE(T)   \
        T(WS_OBJECT)           \
        T(WS_FUNCTION)         \
        T(WS_STRING)           \
        T(WS_NUMBER)           \
        T(WS_BOOLEAN)          \
        T(WS_UNDEFINED)        \
        T(WS_NULL)             \

typedef struct _wval wval;
typedef struct _wfunction wfunction;

enum wval_type {
        FOREACH_WVAL_TYPE(GEN_ENUM)
};

/**
 * WS compiler is lazy, it does not compile a function unless
 * it's necessary.
 */
struct _wfunction {
        /**
         * Whatever this function is a native binding or not.
         */
        int is_native;

        /**
         * A flag to check whatever a function is compiled or
         * not.
         */
        atomic_bool compiled;

        /**
         * When a function is called, the VM checks whatever
         * the function is pre-compiled or not, if it's
         * compiled it simply start the execution.
         * On the other hand, if the function is not compiled:
         *
         * 1. If in_queue is set:
         *  It will push the current context without changing
         *  its state to the job queue and returns.
         * 2. Otherwise:
         *  It sets the in_queue flag, then pushes a compile
         *  task to the job queue and then enquee the current
         *  context to the job queue without changing it's
         *  state and returns.
         */
        atomic_bool in_queue;

        /**
         * When a function is compiled it points to the
         * instruction table, otherwise it stores the AST
         * node representing that function.
         */
        union {
                wval *(*native)(wval *env, wval *args);
                //node *node;
                //instruct *instruct;
        } fn;
};

/**
 * WVal is a data structure capable of representing all of the valid
 * JavaScript types.
 *
 * nuullptr represents UNDEFINED.
 */
struct _wval {
        /**
         * The `type` attribute states how `data` should be treated.
         * Once a wval is created we're no longer allowed to alert its type.
         */
        enum wval_type type;

        /**
         * Used as part of the GC mechanism, we use both ref_cout and
         * mark-and-swap.
         */
        atomic_uint _ref_count;

        union {
                /**
                 * An object is actually a WHash-Table and another wobject
                 * to represent its proto.
                 *
                 * NULL `proto` means undefined proto.
                 */
                struct wval_object {
                        wval *proto;
                        wval *internal_slot;
                        int is_extensible;
                        wtable *table;
                } *object;

                /**
                 * WS compiler is lazy, it does not compile a function unless
                 * it's necessary.
                 */
                struct wval_function {
                        /**
                         * Holds static properties of a function as well as
                         * its proto and prototype.
                         */
                        wval *properties;
                        wfunction *call;
                        wfunction *constructor;
                } *function;

                struct wval_string {
                        unsigned long length;
                        char *buf;
                } *string;

                long double number;

                int boolean;
        } data;
};

#define SIZE_OF_WS_OBJECT sizeof(*(((struct _wval*)NULL)->data.object))
#define SIZE_OF_WS_STRING sizeof(*(((struct _wval*)NULL)->data.string))
#define SIZE_OF_WS_FUNCTION sizeof(*(((struct _wval*)NULL)->data.function))

/**
 * Increase ref_count.
 */
void wval_retain(wval *v);

/**
 * Decrease ref_count.
 */
void wval_release(wval *v);

wval *wval_num(long double number);

// Type Conversion
wval *to_object(context *ctx, wval *v);
wval *to_string(context *ctx, wval *v);
wval *to_number(context *ctx, wval *v);
wval *to_boolean(context *ctx, wval *v);

#endif
