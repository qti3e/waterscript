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
  isCallable
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