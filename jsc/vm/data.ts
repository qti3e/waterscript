/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { CompiledData } from "../src/compiler";
import { Scope } from "./scope";
import { Obj } from "./obj";
import { Undefined, Null } from "./ecma";

/**
 * Data type indicator.
 */
export const enum DataType {
  ScopeReference,
  ObjectReference,
  UndefinedValue,
  NullValue,
  BooleanValue,
  StringValue,
  SymbolValue,
  NumberValue,
  ObjectValue,
  FunctionValue,
  NativeFunctionValue
}

export type ValueType =
  | DataType.UndefinedValue
  | DataType.NullValue
  | DataType.BooleanValue
  | DataType.StringValue
  | DataType.SymbolValue
  | DataType.NumberValue
  | DataType.ObjectValue
  | DataType.FunctionValue
  | DataType.NativeFunctionValue;

export interface ScopeReference {
  type: DataType.ScopeReference;
  scope: Scope;
  name: string;
}

export interface ObjectReference {
  type: DataType.ObjectReference;
  object: Obj;
  property: string;
}

export interface UndefinedValue {
  type: DataType.UndefinedValue;
}

export interface NullValue {
  type: DataType.NullValue;
}

export interface BooleanValue {
  type: DataType.BooleanValue;
  value: boolean;
}

export interface StringValue {
  type: DataType.StringValue;
  value: string;
}

export interface SymbolValue {
  type: DataType.SymbolValue;
  id: number;
}

export interface NumberValue {
  type: DataType.NumberValue;
  value: number;
}

export interface FunctionValue {
  type: DataType.FunctionValue;
  props: Obj;
  compiledData: CompiledData;
  scope: Scope;
}

export interface NativeFunctionValue {
  type: DataType.NativeFunctionValue;
  props: Obj;
  fn: (env: Value, ...args: Value[]) => Value | void;
}

export type Reference = ScopeReference | ObjectReference;

export type Value =
  | UndefinedValue
  | NullValue
  | BooleanValue
  | StringValue
  | SymbolValue
  | NumberValue
  | FunctionValue
  | NativeFunctionValue
  | Obj;

export type Callable = FunctionValue | NativeFunctionValue;

export type Data = Reference | Value;

export function setToRef(ref: Reference, value: Value): void {
  switch (ref.type) {
    case DataType.ScopeReference:
      ref.scope.set(ref.name, value);
      break;
    case DataType.ObjectReference:
      ref.object.set(ref.property, value);
      break;
  }
}

export function getRef(ref: Reference): Value {
  switch (ref.type) {
    case DataType.ScopeReference:
      return ref.scope.find(ref.name)!;
    case DataType.ObjectReference:
      return ref.object.get(ref.property);
  }
}

export function isData(value: any): value is Data {
  return (
    value &&
    typeof value === "object" &&
    (value.type >= DataType.ScopeReference &&
      value.type <= DataType.NativeFunctionValue)
  );
}

export function isValue(value: any): value is Value {
  return (
    value &&
    typeof value === "object" &&
    (value.type >= DataType.UndefinedValue &&
      value.type <= DataType.NativeFunctionValue)
  );
}

export function isRef(value: any): value is Reference {
  return (
    value &&
    typeof value === "object" &&
    (value.type === DataType.ScopeReference ||
      value.type === DataType.ObjectReference)
  );
}

export function getValue(value: Data): Value {
  if (isValue(value)) return value;
  return getRef(value);
}

export function isCallable(input: Value): input is Callable {
  return (
    input.type === DataType.FunctionValue ||
    input.type === DataType.NativeFunctionValue
  );
}

export function toJSValue(value: Value): any {
  switch (value.type) {
    case DataType.NullValue:
      return null;
    case DataType.UndefinedValue:
      return undefined;
    case DataType.BooleanValue:
    case DataType.NumberValue:
    case DataType.StringValue:
      return value.value;
  }
  throw new Error("Not implemented.");
}

export function jsValue2VM(value: any): Value {
  switch (typeof value) {
    case "undefined":
      return Undefined;
    case "object":
      if (value === null) return Null;
    case "function":
      return {
        type: DataType.NativeFunctionValue,
        props: new Obj(),
        fn: value
      };
    case "number":
      return {
        type: DataType.NumberValue,
        value: value
      };
    case "boolean":
      return {
        type: DataType.BooleanValue,
        value: value
      };
    case "string":
      return {
        type: DataType.StringValue,
        value: value
      };
  }
  throw new Error("Not implemented.");
}
