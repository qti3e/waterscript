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

export class VM {
  private scope: Scope = new Scope(false);

  compileAndExec(source: string): Value {
    const main = compiler.compile(source);

    console.time("exec");
    const ret = exec(main, this.scope, this.scope.obj, []);
    console.timeEnd("exec");
    return ret;
  }
}
