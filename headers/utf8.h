#ifndef _Q_WS_UTF8_
#define _Q_WS_UTF8_

#include <stdio.h>
typedef struct _val ws_val;

typedef struct _ws_utf8 ws_utf8;

/**
 * A non zero terminated UTF-8 buffer.
 */
struct _ws_utf8
{
  /**
   * Size of the data in bytes.
   */
  size_t size;

  /**
   * The raw data.
   */
  unsigned char data[];
};

/**
 * Convert a WaterScript string to a UTF-8 buffer.
 */
ws_utf8 *ws_string_to_utf8(ws_val *string);

#endif