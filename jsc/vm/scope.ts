/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { Value, Reference, DataType } from "./data";
import { Undefined } from "./ecma";

export class Scope {
  private table: Map<string, Value | null> = new Map();

  constructor(
    private readonly isBlockScope: boolean,
    private readonly parent?: Scope
  ) {
    if (this.isBlockScope && !this.parent) {
      throw new Error("Global scope must not be a block scope.");
    }
  }

  find(name: string): Value {
    if (this.table.has(name)) {
      return this.table.get(name)!;
    }

    if (this.parent) {
      return this.parent.find(name);
    }

    return Undefined;
  }

  findRef(name: string): Reference | undefined {
    if (this.table.has(name)) {
      return {
        type: DataType.ScopeReference,
        scope: this,
        name
      };
    }

    if (this.parent) {
      return this.parent.findRef(name);
    }
  }

  def(name: string, canAssignToBlock = false): void {
    if (!this.isBlockScope || canAssignToBlock) {
      this.table.set(name, null);
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
