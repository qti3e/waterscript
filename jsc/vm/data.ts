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

/**
 * Data type indicator.
 */
export const enum DataType {
  ScopeReference,
  ObjectReference,
  PrimitiveValue,
  FunctionValue,
  NullableValue,
  ObjectValue,
  NativeFunctionValue
}

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

export interface PrimitiveValue {
  type: DataType.PrimitiveValue;
  value: number | string | boolean;
  props: Obj;
}

export interface NullableValue {
  type: DataType.NullableValue;
  undefined?: boolean;
}

export interface FunctionValue {
  type: DataType.FunctionValue;
  compiledData: CompiledData;
  props: Obj;
  scope: Scope;
}

export interface NativeFunctionValue {
  type: DataType.NativeFunctionValue;
  props: Obj;
  fn: Function;
}

export type Reference = ScopeReference | ObjectReference;
export type Value = PrimitiveValue | NullableValue | FunctionValue | Obj;
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

export const Null: NullableValue = {
  type: DataType.NullableValue
};

export const Undefined: NullableValue = {
  type: DataType.NullableValue,
  undefined: true
};

export const True: PrimitiveValue = {
  type: DataType.PrimitiveValue,
  value: true,
  // TODO(qti3e)
  props: new Obj()
};

export const False: PrimitiveValue = {
  type: DataType.PrimitiveValue,
  value: false,
  // TODO(qti3e)
  props: new Obj()
};