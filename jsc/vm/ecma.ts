/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import {
  Data,
  isValue,
  Value,
  getValue,
  DataType,
  ValueType,
  UndefinedValue,
  NullValue,
  BooleanValue,
  isCallable,
  StringValue,
  NumberValue,
  jsValue2VM
} from "./data";
import { assert } from "./util";
import { Obj } from "./obj";
import { call } from "./call";

// ECMAScript abstract operations

export const Undefined: UndefinedValue = {
  type: DataType.UndefinedValue
};

export const Null: NullValue = {
  type: DataType.NullValue
};

export const True: BooleanValue = {
  type: DataType.BooleanValue,
  value: true
};

export const False: BooleanValue = {
  type: DataType.BooleanValue,
  value: false
};

export enum PreferredType {
  String,
  Number
}

export function toPrimitive(
  input: Value,
  preferredType?: PreferredType
): Value {
  assert(isValue(input));
  if (input.type === DataType.ObjectValue) {
    const hint = preferredType === PreferredType.String ? "string" : "number";
    return ordinaryToPrimitive(input, hint);
  }
  return input;
}

function ordinaryToPrimitive(input: Obj, hint: "string" | "number"): Value {
  const methodNames =
    hint === "string" ? ["toString", "valueOf"] : ["valueOf", "toString"];
  for (const name of methodNames) {
    const method = input.get(name);
    if (isCallable(method)) {
      const result = call(method, input);
      if (result.type !== DataType.ObjectValue) return result;
    }
  }
  throw new TypeError("Cannot convert object to primitive value");
}

export function type(input: Data): ValueType {
  return getValue(input).type;
}

export function toString(input: Value): StringValue {
  let str: string;

  switch (input.type) {
    case DataType.UndefinedValue:
      str = "undefined";
      break;
    case DataType.NullValue:
      str = "null";
      break;
    case DataType.BooleanValue:
      str = input.value ? "true" : "false";
      break;
    case DataType.StringValue:
      return input;
    case DataType.NumberValue:
      str = input.value + "";
      break;
    case DataType.SymbolValue:
      throw new TypeError(
        "TypeError: Cannot convert a Symbol value to a string"
      );
    case DataType.ObjectValue:
      const prim = toPrimitive(input, PreferredType.String);
      return toString(prim);
    case DataType.NativeFunctionValue:
      str = "function () { [native code] }";
      break;
    case DataType.FunctionValue:
      throw new Error("Cannot convert function to a string (yet).");
  }

  return {
    type: DataType.StringValue,
    value: str!
  };
}

export function numberToString(m: NumberValue): StringValue {
  return {
    type: DataType.StringValue,
    value: m.value + ""
  };
}

export function toNumber(value: Value): NumberValue {
  let num: number;
  switch (value.type) {
    case DataType.UndefinedValue:
      num = NaN;
      break;
    case DataType.NullValue:
      num = +0;
      break;
    case DataType.BooleanValue:
      num = value.value ? 1 : 0;
      break;
    case DataType.NumberValue:
      return value;
    case DataType.StringValue:
      num = parseFloat(value.value);
    case DataType.SymbolValue:
      throw new TypeError(
        "TypeError: Cannot convert a Symbol value to a number"
      );
    case DataType.ObjectValue:
      const prim = toPrimitive(value, PreferredType.Number);
      return toNumber(prim);
  }

  return {
    type: DataType.NumberValue,
    value: num!
  };
}

export function toBoolean(value: Value): BooleanValue {
  let bool: boolean;
  switch (value.type) {
    case DataType.BooleanValue:
      return value;
    case DataType.UndefinedValue:
    case DataType.NullValue:
      bool = false;
      break;
    case DataType.NumberValue:
    case DataType.StringValue:
      bool = !!value.value;
      break;
    case DataType.SymbolValue:
    case DataType.ObjectValue:
      bool = true;
      break;
  }

  return {
    type: DataType.BooleanValue,
    value: bool!
  };
}
