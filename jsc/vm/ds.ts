/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { Data } from "./data";

export class DataStack {
  private stack: Data[] = [];

  push(value: Data): void {
    this.stack.push(value);
  }

  pop(): Data {
    return this.stack.pop()!;
  }

  peek(): Data {
    return this.stack[this.stack.length - 1];
  }
}
