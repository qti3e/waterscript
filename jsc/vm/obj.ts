/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { DataType, Value, Reference, toJSValue } from "./data";
import { Undefined } from "./ecma";

export type ObjTable = Map<string, Value>;

export class Obj {
  readonly type = DataType.ObjectValue;

  constructor(
    private proto?: Obj,
    private readonly table: ObjTable = new Map()
  ) {}

  set(prop: string, value: Value): void {
    this.table.set(prop, value);
  }

  get(prop: string): Value {
    let obj: Obj | undefined = this;
    while (obj) {
      if (obj.table.has(prop)) {
        return obj.table.get(prop)!;
      }
      obj = obj.proto;
    }
    return Undefined;
  }

  getRef(prop: string): Reference {
    return {
      type: DataType.ObjectReference,
      object: this,
      property: prop
    };
  }

  toJS(): Record<string, any> {
    const ret: Record<string, any> = {};
    for (const [key, value] of this.table) {
      ret[key] = toJSValue(value);
    }
    return ret;
  }
}
