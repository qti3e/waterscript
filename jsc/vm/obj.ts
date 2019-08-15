/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { DataType, Value, Reference, Undefined } from "./data";

export class Obj {
  readonly type = DataType.ObjectValue;
  private readonly table: Map<string, Value> = new Map();

  constructor(private proto?: Obj) {}

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
}
