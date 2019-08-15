/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { Value, Reference, DataType } from "./data";
import { Undefined } from "./ecma";
import { ObjTable, Obj } from "./obj";

export class Scope {
  private table: ObjTable = new Map();
  readonly obj = new Obj(undefined, this.table);

  constructor(
    private readonly isBlockScope: boolean,
    private readonly parent?: Scope
  ) {
    if (this.isBlockScope && !this.parent) {
      throw new Error("Global scope must not be a block scope.");
    }
  }

  find(name: string): Value | undefined {
    if (this.table.has(name)) {
      return this.table.get(name)!;
    }

    if (this.parent) {
      return this.parent.find(name);
    }
  }

  findRef(name: string): Reference {
    if (!this.parent || this.table.has(name)) {
      return {
        type: DataType.ScopeReference,
        scope: this,
        name
      };
    }

    return this.parent.findRef(name);
  }

  def(name: string, canAssignToBlock = false, init: Value = Undefined): void {
    if (!this.isBlockScope || canAssignToBlock) {
      this.table.set(name, init);
      return;
    }

    if (this.parent) {
      this.parent.def(name, canAssignToBlock);
    }
  }

  set(name: string, value: Value): void {
    if (!this.parent || this.table.has(name)) {
      this.table.set(name, value);
      return;
    }

    this.parent.set(name, value);
  }
}
