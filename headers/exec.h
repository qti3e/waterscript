#ifndef _Q_WS_EXEC_
#define _Q_WS_EXEC_

typedef struct _val ws_val;
typedef struct _function_compiled_data ws_function_compiled_data;
typedef struct _context ws_context;

ws_val *exec(ws_context *ctx, ws_function_compiled_data *function);

#endif