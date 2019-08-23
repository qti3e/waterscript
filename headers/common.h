#ifndef _Q_WS_COMMON_
#define _Q_WS_COMMON_

typedef struct _val ws_val;

/**
 * Exit the process with a non-zero code and write the message
 * to stderr.
 */
void die(char *msg);

/**
 * Hash WaterScript value - mostly to be used in the hash table.
 */
unsigned long ws_hash(ws_val *value);

#endif