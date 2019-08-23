#ifndef _Q_WS_CONTEXT_
#define _Q_WS_CONTEXT_

#include <stdatomic.h>
#include <uchar.h>

typedef struct _val ws_val;
typedef struct _function ws_function;
typedef struct _function_compiled_data ws_function_compiled_data;

typedef struct _context ws_context;
typedef struct _context_list ws_context_list;
typedef struct _scope ws_scope;
typedef struct _table ws_table;
typedef struct _ds_entity ws_ds_entity;

/**
 * Context provides an execution environment for the JavaScript scripts.
 * It is the heart of VM and each context can only be accessed thought one
 * thread at a time.
 * 
 * WaterScript contexts are designed to work efficient with a lot of forks.
 * 
 * In order to reuse a context in multiple threads one must first fork the
 * context - after the fork the context will become readonly meaning that
 * none of its properties should be subjected to changes.
 */
struct _context
{
  /**
   * Each context has an auto-generated id associated with it.
   * Counting starts at 0.
   */
  unsigned int id;

  /**
   * Determines whatever this context has been forked or not.
   */
  int forked;

  /**
   * If the context is child of another forked context, points to the
   * parent context, otherwise it's null.
   */
  ws_context *parent;

  /**
   * If the context is forked it point to its children.
   */
  ws_context_list *childs;

  /**
   * Part of the GC.
   */
  atomic_uint ref_count;

  /**
   * Head of the data stack.
   */
  ws_ds_entity *ds_head;

  /**
   * Head of the scope chain.
   */
  ws_scope *scope;

  /**
   * List of all the tables in the context.
   */
  struct _table_info
  {
    /**
     * Capacity of tables array.
     */
    unsigned int capacity;

    /**
     * Number of consumed tables.
     */
    unsigned int size;

    /**
     * Array of table data.
     */
    struct _table_ctx **tables;
  } tables;
};

/**
 * A singly-linked list to store an array of contexts.
 */
struct _context_list
{
  /**
   * A context item.
   */
  ws_context *ctx;

  /**
   * Pointer to the previous context.
   */
  ws_context_list *next;
};

/**
 * A hash table that can be used in a context, the information is stored on the
 * context.
 */
struct _table
{
  /**
   * Table id.
   */
  unsigned int id;

  /**
   * The context in which this table was created on for the first time.
   */
  ws_context *ctx;
};

/**
 * A runtime scope.
 */
struct _scope
{
  /**
   * The parent scope.
   */
  ws_scope *parent;

  /**
   * Whatever it's a block scope or a function body.
   */
  int is_block;

  /**
   * Part of the GC.
   */
  atomic_uint ref_count;

  /**
   * Internal table to store values.
   */
  ws_table table;
};

/**
 * A data stack entity which is actually a singly linked list, used in context.
 */
struct _ds_entity
{
  /**
   * Part of the GC.
   */
  atomic_uint ref_count;

  /**
   * The value this stack entity holds.
   */
  ws_val *value;

  /**
   * The next ds entity in the stack.
   */
  ws_ds_entity *next;
};

/**
 * The table data that is stored in context.
 */
struct _table_ctx
{
  /**
   * Unique id of the table.
   */
  unsigned int id;

  /**
   * Current capacity of buckets.
   */
  unsigned int capacity;

  /**
   * Number of consumed buckets.
   */
  unsigned int size;

  /**
   * Array of slots.
   */
  struct _table_slot **buckets;
};

/**
 * A hash table slot.
 */
struct _table_slot
{
  /**
   * Currently the table works with.
   *  - String
   *  - Symbol
   */
  ws_val *key;

  /**
   * In the table chain this key might be deleted along the way this property
   * will tell us if this slot was the point where the key was deleted.
   */
  int is_delete;

  /**
   * A pointer to the value, can be anything.
   */
  void *value;

  /**
   * To handle collision for keys with the same hash.
   */
  struct _table_slot *next;
};

// Methods

/**
 * Create a new context.
 */
ws_context *context_create();

/**
 * Destroy the context, if ref_count is greater than zero, the process
 * ends with a non-zero exit code.
 */
void context_destroy(ws_context *ctx);

/**
 * Increment ref_count.
 */
void context_retain(ws_context *ctx);

/**
 * Decrement ref_count.
 */
void context_release(ws_context *ctx);

/**
 * Execute the compiled data on the context.
 */
ws_val *context_exec(ws_function_compiled_data *data);

/**
 * Check if base is deeply parent of ctx.
 */
int context_is_parent_of(ws_context *base, ws_context *ctx);

/**
 * Fork the context to n branches, returns on success ends the process
 * with a non-zero exit code otherwise.
 * After forking the context, it'll set context.childs
 */
void context_fork(ws_context *ctx, unsigned int n);

/**
 * Release the memory allocated by the list, it does not call
 * the context release on each item.
 */
void context_list_free(ws_context_list *list);

/**
 * Removes ctx from the list.
 */
void context_list_del(ws_context_list **list, ws_context *ctx);

/**
 * Creates a new scope on the context and sets it as the current active
 * scope.
 */
void context_new_scope(ws_context *ctx, int is_block);

/**
 * Pop the scope.
 */
void context_pop_scope(ws_context *ctx);

/**
 * Define a variable on the current scope.
 * 
 * key - The variable name.
 * value - The value we want to set on the context.
 * stick_to_block - If it's false we traverse the scope chain backward
 *      to find the first non-block scope and set the variable on that.
 */
void context_define(ws_context *ctx, ws_val *key, ws_val *value, int stick_to_block);

/**
 * Find a variable and in the scope by `key` and return its value.
 */
ws_val *context_resolve(ws_context *ctx, ws_val *key);

/**
 * Retain the scope - increment ref_count.
 */
void scope_retain(ws_scope *scope);

/**
 * Release the scope - decrement ref_count.
 */
void scope_release(ws_scope *scope);

/**
 * Retain data stack entity - increment ref_count.
 */
void ds_entity_retain(ws_ds_entity *entity);

/**
 * Release data stack entity - decrement ref_count.
 */
void ds_entity_release(ws_ds_entity *entity);

/**
 * Push the value to the data stack of the given context.
 */
void context_ds_push(ws_context *ctx, ws_val *value);

/**
 * Returns the data stack head of the context.
 * If no data is availabe ends the process with a non-zero exit code.
 */
ws_val *context_ds_peek(ws_context *ctx);

/**
 * Pop the last value from the data stack on the given context and return
 * the value. - If no such data is available dies immediately.
 */
ws_val *context_ds_pop(ws_context *ctx);

/**
 * Initialize a new table on the allocated memory.
 */
void table_init(ws_context *ctx, void *mem);

/**
 * Destroy a table on the given context.
 */
void table_destroy(ws_context *ctx, ws_table *table);

/**
 * Destroy a table on all of the contexts in which it is defined on.
 */
void table_destroy_all(ws_table *table);

/**
 * Store the given data on the table in the given context.
 */
void table_set(ws_context *ctx, ws_table *table, ws_val *key, void *value);

/**
 * Delete the entity from the table on the given context.
 */
void table_del(ws_context *ctx, ws_table *table, ws_val *key);

/**
 * Find a value on the table and returns the pointer to that.
 */
void *table_get(ws_context *ctx, ws_table *table, ws_val *key);

#endif