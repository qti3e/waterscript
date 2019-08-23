#ifndef _Q_WS_COMMON_
#define _Q_WS_COMMON_

typedef struct _val ws_val;
typedef struct _function_compiled_data ws_function_compiled_data;

/**
 * Exit the process with a non-zero code and write the message
 * to stderr.
 */
void die(char *msg);

/**
 * Hash WaterScript value - mostly to be used in the hash table.
 */
unsigned long ws_hash(ws_val *value);

/**
 * Dump a compiled code to the stdout.
 */
void dump_code(ws_function_compiled_data *data);

/**
 * Dump a WaterScript value to the stdout.
 */
void dump_value(ws_val *value);

#endif