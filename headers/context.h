#ifndef __WS_CONTEXT__
#define __WS_CONTEXT__

#include <stdatomic.h>
#include <setjmp.h>

/**
 * Structs are supposed to be private and you should only use
 * the functions to work with the data.
 */

typedef struct _context context;
typedef struct _context_list context_list;
typedef struct _scope scope;
typedef struct _ds_entity ds_entity;
typedef struct _wtable wtable;

/**
 * A better approach would be to use:
 * void *magic_ptr()
 * {
 *   static void *p = malloc(1);
 *   return p;
 * }
 */
#define WTABLE_DEL_MAGIC (-3)

/**
 * Context provides an execution environment for the scripts, only one thread
 * can access a context at a time by design.
 *
 * To use a context at multiple threads, one must fork the context - after
 * forking, context becomes readonly.
 */
struct _context {
        /**
         * Each context has an auto-generated id associated with it, starting
         * from 0.
         */
        unsigned int id;

        context *parent;
        context_list *childs;

        /**
         * Whatever a context is forked or not.
         * After a fork, we're no longer able to:
         *
         * 1. fork the context.
         * 2. execute code.
         * 3. change scope.
         * 4. touch datastack.
         * 5. run functions.
         *
         * in other words the context is now readonly - no modifications.
         */
        int forked;

        /**
         * Default to 0 after calling context_create().
         * Used for garbage collection, in case you're wondering who can
         * reference a context: its child.
         * @internal
         */
        atomic_uint _ref_count;

        /**
         * Pointer to the data-stack head.
         */
        ds_entity *ds_head;

        /**
         * Pointer to current execution scope.
         */
        scope *scope;

        /**
         * Array of functions.
         */
        struct functions_array {
                unsigned int from;
                unsigned int cursor;
                unsigned int capacity;
                wval **array;
        } functions;

        /**
         * Data of all the tables that are used within a context are
         * actually stored in that context.
         * ctx.tables is implemented as an open-addressing hash table.
         */
        struct {
                unsigned int capacity;
                unsigned int size;
                struct _wtable_ctx **tables;
        } tables;

        jmp_buf *on_throw;
};

/**
 * A singly-linked list to store an array of cotextes.
 */
struct _context_list {
        context *ctx;
        context_list *next;
};

/**
 * To store variables and symbols related to the current execuations
 * scope.
 */
struct _scope {
        scope *prev;
        int is_function_body;
        atomic_uint _ref_count;
        wtable *table;
};

struct _ds_entity {
        atomic_uint _ref_count;
        wval *value;
        ds_entity *next;
};

struct _wtable {
        unsigned int id;
        context *ctx;
};

struct _wtable_ctx {
        unsigned int id;
        unsigned int cpacity;
        unsigned int size;
        struct _wtable_slot **buckets;
};

struct _wtable_slot {
        /**
         * The actual key for this element.
         */
        char *key;

        /**
         * The value that this entity holds.
         * is_delete can only be equal to WTABLE_DEL_MAGIC, and there
         * is no flag to check whatever we should use `v.value` or `v.is_delete`
         * The only way is to check if is_delete is equal to WTABLE_DEL_MAGIC
         * or not.
         * (A pointer can not be evaluated to WTABLE_DEL_MAGIC)
         */
        union {
                int is_delete;
                wval *value;
        } v;

        /**
         * To handle collision for keys with same hash.
         */
        struct _wtable_slot *next;
};

struct _code_pointer {
        int is_try;
        ds_entity *ds_head;
        struct _code_pointer *prev;
};


/**
 * Creates a context which has no parent, entry point of the user code.
 */
context *context_create();

/**
 * Run the code in the given context.
 */
void context_compile(context *ctx, char *code);

/**
 * Destroys the given context.
 * If the ref count is greater than zero it'll simply kill the process with
 * a non-zero code.
 * Also removes ctx from ctx.parent childs.
 * if the is no child left for the parent sets ctx.parent to NULL.
 */
void context_destroy(context *ctx);

/**
 * Increase ref_count.
 */
void context_retain(context *ctx);

/**
 * Decrease ref_count.
 */
void context_release(context *ctx);

/**
 * Push ctx to the job queue.
 */
void context_request_run(context *ctx);

/**
 * Cheeks whatever test is parent of ctx or not.
 */
int context_is_deep_parent(context *ctx, context *test);

/**
 * Forks the given context into `n` branches and set ctx.childs.
 */
void context_fork(context *ctx, unsigned int n);

/**
 * Add all of the contexes in the list to the job queue.
 */
void context_list_request_run(context_list *list);

/**
 * Free a context list - it does not call context_release.
 */
void context_list_free(context_list *list);

/**
 * Removes ctx from context list.
 * It does not call context_release on ctx.
 */
void context_list_del(context_list **list, context *ctx);

/**
 * Use a new scope for the context.
 */
void context_new_scope(context *ctx, int is_function_body);

/**
 * Pop the current scope and use its parent as the current scope.
 */
void context_pop_scope(context *ctx);

/**
 * Defines a new variable in current scope of the given context.
 */
void context_define(context *ctx, char *var, wval *val, int in_function_body);

/**
 * Find a variable by its name in the context.
 */
wval *context_resolve(context *ctx, char *var);

/**
 * Called by compiler - add a new function to the context.
 * returns function id.
 */
unsigned int context_add_function(context *ctx, wval *fn);

/**
 * Called by VM - fetch a function from the context.
 */
wval *contex_fetch_function(context *ctx, unsigned int id);

/**
 * Increase ref_count.
 */
void scope_retain(scope *s);

/**
 * Decrease ref_count.
 */
void scope_release(scope *s);

/**
 * Increase ref_count.
 */
void ds_entity_retain(ds_entity *e);

/**
 * Decrease ref_count.
 */
void ds_entity_release(ds_entity *e);

/**
 * Push val to the data stack.
 */
void context_ds_push(context *ctx, wval *val);

/**
 * Peek the head from data stack.
 */
wval *context_ds_peek(context *ctx);

/**
 * Pop the last element from data stack.
 * You should call wval_release on the returned
 * value after you're done with it.
 */
wval *context_ds_pop(context *ctx);

/**
 * Initilize a table on the allocated memory.
 */
void wtable_init(context *ctx, void *m);

/**
 * Destroy a table on the given context.
 */
void wtable_destroy(context *ctx, wtable *t);

/**
 * Destroy a table on all of the contextes.
 */
void wtable_destroy_all(wtable *t);

/**
 * Store the data with the given key in the table.
 */
void wtable_set(context *ctx, wtable *t, char *key, wval *data);

/**
 * Delete an entry from the table.
 */
void wtable_del(context *ctx, wtable *t, char *key);

/**
 * Resolve a data from table.
 */
wval *wtable_get(context *ctx, wtable *t, char *key);

#endif
