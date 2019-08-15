/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { Data } from "./data";

export class Scope {
  private table: Map<string, Data | null> = new Map();

  constructor(
    private readonly isBlockScope: boolean,
    private readonly parent?: Scope
  ) {
    if (this.isBlockScope && !this.parent) {
      throw new Error("Global scope must not be a block scope.");
    }
  }

  find(name: string): Data | undefined {
    if (this.table.has(name)) {
      return this.table.get(name)!;
    }

    if (this.parent) {
      return this.parent.find(name);
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

  set(name: string, value: Data): void {
    if (!this.parent || this.table.has(name)) {
      this.table.set(name, value);
      return;
    }

    this.parent.set(name, value);
  }
}
