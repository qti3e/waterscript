#include <stdlib.h>
#include "wval.h"
#include "utf8.h"
#include "common.h"

static int xmlLittleEndian = 1;

/**
 * UTF16LEToUTF8:
 * @out:  a pointer to an array of bytes to store the result
 * @outlen:  the length of @out
 * @inb:  a pointer to an array of UTF-16LE passwd as a byte array
 * @inlenb:  the length of @in in UTF-16LE chars
 *
 * Take a block of UTF-16LE ushorts in and try to convert it to an UTF-8
 * block of chars out. This function assume the endian property
 * is the same between the native type of this machine and the
 * inputted one.
 *
 * Returns the number of byte written, or -1 by lack of space, or -2
 *     if the transcoding fails (for *in is not valid utf16 string)
 *     The value of *inlen after return is the number of octets consumed
 *     as the return value is positive, else unpredictiable.
 */
int UTF16LEToUTF8(unsigned char *out, int *outlen,
                  const unsigned char *inb, int *inlenb)
{
  unsigned char *outstart = out;
  const unsigned char *processed = inb;
  unsigned char *outend = out + *outlen;
  unsigned short *in = (unsigned short *)inb;
  unsigned short *inend;
  unsigned int c, d, inlen;
  unsigned char *tmp;
  int bits;

  if ((*inlenb % 2) == 1)
    (*inlenb)--;
  inlen = *inlenb / 2;
  inend = in + inlen;
  while ((in < inend) && (out - outstart + 5 < *outlen))
  {
    if (xmlLittleEndian)
    {
      c = *in++;
    }
    else
    {
      tmp = (unsigned char *)in;
      c = *tmp++;
      c = c | (((unsigned int)*tmp) << 8);
      in++;
    }
    if ((c & 0xFC00) == 0xD800)
    { /* surrogates */
      if (in >= inend)
      { /* (in > inend) shouldn't happens */
        break;
      }
      if (xmlLittleEndian)
      {
        d = *in++;
      }
      else
      {
        tmp = (unsigned char *)in;
        d = *tmp++;
        d = d | (((unsigned int)*tmp) << 8);
        in++;
      }
      if ((d & 0xFC00) == 0xDC00)
      {
        c &= 0x03FF;
        c <<= 10;
        c |= d & 0x03FF;
        c += 0x10000;
      }
      else
      {
        *outlen = out - outstart;
        *inlenb = processed - inb;
        return (-2);
      }
    }

    /* assertion: c is a single UTF-4 value */
    if (out >= outend)
      break;
    if (c < 0x80)
    {
      *out++ = c;
      bits = -6;
    }
    else if (c < 0x800)
    {
      *out++ = ((c >> 6) & 0x1F) | 0xC0;
      bits = 0;
    }
    else if (c < 0x10000)
    {
      *out++ = ((c >> 12) & 0x0F) | 0xE0;
      bits = 6;
    }
    else
    {
      *out++ = ((c >> 18) & 0x07) | 0xF0;
      bits = 12;
    }

    for (; bits >= 0; bits -= 6)
    {
      if (out >= outend)
        break;
      *out++ = ((c >> bits) & 0x3F) | 0x80;
    }
    processed = (const unsigned char *)in;
  }
  *outlen = out - outstart;
  *inlenb = processed - inb;
  return (0);
}

ws_utf8 *ws_string_to_utf8(ws_val *string)
{
  if (string == NULL || string->type != WVAL_TYPE_STRING)
    die("ws_string_to_utf8: Only String is a valid parameter.");

  int input_size = string->data.string.size;
  int output_size = input_size;

  ws_utf8 *utf8 = (ws_utf8 *)malloc(output_size);
  if (utf8 == NULL)
    die("ws_string_to_utf8: Memory allocation failed.");

  UTF16LEToUTF8((unsigned char *)(&utf8->data), &output_size,
                (unsigned char *)string->data.string.data, &input_size);

  utf8->size = output_size;

  output_size += offsetof(ws_utf8, data);

  utf8 = (ws_utf8 *)realloc(utf8, output_size);
  if (utf8 == NULL)
    die("ws_string_to_utf8: Memory allocation failed.");

  return utf8;
}