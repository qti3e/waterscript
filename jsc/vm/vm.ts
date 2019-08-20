/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { Scope } from "./scope";
import { exec } from "./call";
import { Value } from "./data";
import { compiler } from "./compiler";
import { DataStack } from "./ds";
import { timer } from "./timer";

export interface VMOptions {
  timeout: number;
}

export class VM {
  readonly scope: Scope = new Scope(false);
  readonly dataStack: DataStack = new DataStack();
  readonly timeout: number;

  constructor(options?: VMOptions) {
    options = {
      timeout: -1,
      ...options
    };

    this.timeout = options.timeout;
  }

  compileAndExec(source: string): Promise<Value> {
    const main = compiler.compile(source);
    timer.start(this.timeout);
    return exec(main, this.scope, this.scope.obj, [], this.dataStack);
  }
}
