#ifndef _Q_WS_WVAL_
#define _Q_WS_WVAL_

#include "context.h"

typedef struct _obj ws_obj;
typedef struct _property_descriptor ws_obj_property_descriptor;
typedef struct _val ws_val;

/**
 * An objects property descriptor.
 */
struct _property_descriptor
{
  /**
   * The value of this property.
   */
  ws_val *value;

  /**
   * Either Null or a function object.
   */
  ws_val *get;

  /**
   * Either Null or a function object.
   */
  ws_val *set;

  /**
   * If false, attempts by ECMAScript code to change the property's [[Value]]
   * attribute using [[Set]] will not succeed.
   */
  int writable;

  /**
   * If true, the property will be enumerated by a for-in enumeration Otherwise,
   * the property is said to be non-enumerable.
   */
  int enumerable;

  /**
   * If false, attempts to delete the property, change the property to be an
   * accessor property, or change its attributes (other than [[Value]], or
   * changing [[Writable]] to false) will fail.
   */
  int configurable;
};

/**
 * A JavaScrip object that might be as well a function.
 */
struct _obj
{
  /**
   * [Call] internal slot.
   */
  struct _wfunction *call;

  /**
   * [Construct] internal slot.
   */
  struct _wfunction *construct;

  /**
   * Object parent.
   */
  struct _obj *proto;

  /**
   * Maps property keys to property descriptors.
   */
  ws_table properties;
};

/**
 * Type of the value.
 */
enum WVAL_TYPE
{
  /**
   * The value is a 64 bit double.
   */
  WVAL_TYPE_NUMBER,

  /**
   * A JavaScript string, stored in UTF-16.
   */
  WVAL_TYPE_STRING,

  /**
   * Either True or False.
   */
  WVAL_TYPE_BOOLEAN,

  /**
   * JavaScript undefined value.
   */
  WVAL_TYPE_UNDEFINED,

  /**
   * A null value.
   */
  WVAL_TYPE_NULL,

  /**
   * An object, function or a constructor.
   */
  WVAL_TYPE_OBJECT,

  /**
   * A unique symbol.
   */
  WVAL_TYPE_SYMBOL
};

/**
 * WVal is data type that can represent any JavaScript primitive value and
 * object.
 * 
 * Note that function are just objects with a [call] internal slot.
 */
struct _val
{
  /**
   * Type of this value.
   */
  enum WVAL_TYPE type;

  /**
   * Used in GC.
   */
  atomic_uint ref_count;

  /**
   * Internal data for this value.
   */
  union {
    /**
     * 64-bit float for numbers.
     */
    double number;

    /**
     * A non zero-terminated string.
     */
    struct
    {
      /**
       * Size of the data in bytes.
       */
      size_t size;

      /**
       * A pointer to the raw data.
       */
      char16_t *data;
    } string;

    /**
     * Whatever the data is true or false.
     */
    int boolean;

    /**
     * Each symbol has an incremental id which makes them unique.
     */
    struct symbol
    {
      /**
       * Symbols description - Null or a string.
       */
      ws_val *description;

      /**
       * Symbols id.
       */
      unsigned int id;
    } symbol;

    /**
     * Pointer to a wval object.
     */
    ws_obj *object;
  } data;
};

/**
 * Undefiend value to be used in the VM.
 */
ws_val WS_UNDEFINED;

/**
 * Null value to be used in the VM.
 */
ws_val WS_NULL;

/**
 * True to be used in the VM.
 */
ws_val WS_TRUE;

/**
 * False to be used in the VM.
 */
ws_val WS_FALSE;

/**
 * 0 to be used in the VM.
 */
ws_val WS_ZERO;

/**
 * 1 to be used in the VM.
 */
ws_val WS_ONE;

/**
 * 2 to be used in the VM.
 */
ws_val WS_TWO;

/**
 * Retain a wval - increment ref_count.
 */
void wval_retain(ws_val *value);

/**
 * Release a wval - decrement ref_count.
 */
void wval_release(ws_val *value);

/**
 * Check if two WaterScript values are equal.
 */
int wval_strict_equal(ws_val *v1, ws_val *v2);

/**
 * Create a new WaterScript string.
 */
ws_val *ws_string(char16_t *data, size_t size);

/**
 * Create a WaterScript symbol.
 */
ws_val *ws_symbol(ws_val *description);

/**
 * Create a new WaterScript number.
 */
ws_val *ws_number(double value);

/**
 * Create a new WaterScript object value in the context.
 */
ws_val *ws_object(ws_context *ctx, ws_val *proto);

/**
 * Convert a WaterScript value to a primitive value.
 */
ws_val *ws_to_primitive(ws_context *ctx, ws_val *value);

/**
 * Convert a WaterScript value to a string.
 */
ws_val *ws_to_string(ws_context *ctx, ws_val *value);

/**
 * Convert a WaterScript value to a number.
 */
ws_val *ws_to_number(ws_context *ctx, ws_val *value);

/**
 * Convert a WaterScript value to a boolean.
 */
ws_val *ws_to_boolean(ws_context *ctx, ws_val *value);

#endif