#ifndef _Q_WS_COMPILER_
#define _Q_WS_COMPILER_

#include "wval.h"

typedef struct _function ws_function;
typedef struct _function_compiled_data ws_function_compiled_data;

/**
 * Compiled data returned from the compiler.
 */
struct _function_compiled_data
{
  /**
   * Starting offset of the constant pool. (inclusive)
   */
  size_t constant_pool_offset;

  /**
   * Start of the scope data. (inclusive)
   */
  size_t scope_offset;

  /**
   * Start of the source map data. (inclusive)
   */
  size_t map_offset;

  /**
   * A variable length array containing all the buffers data.
   * Starts with the bytecodes.
   */
  uint8_t data[];
};

/**
 * An ECMAScript function.
 */
struct _function
{
  /**
   * The scope this function belongs to.
   */
  ws_scope *scope;

  /**
   * Related to the GC.
   */
  atomic_uint ref_count;

  /**
   * The function id returned by the compiler - it can be used
   * to request compiler or get the source code of the function.
   * And of course way too many things.
   */
  int id;

  /**
   * Function's compiled data if null it means the function is not compiled yet
   * and there is need to ask the compiler service to compiler this function.
   */
  struct _function_compiled_data *data;
};

/**
 * Compile the source code and return a compiled data.
 */
ws_function_compiled_data *compile(ws_val *source);

/**
 * Compile the function and return the result.
 */
ws_function_compiled_data *request_compile(int function_id);

#endif