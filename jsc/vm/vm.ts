/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { Compiler, CompiledProgram, CompiledData } from "../src/compiler";
import { Scope } from "./scope";
import { exec } from "./call";
import { Value } from "./data";

export class VM {
  private program: CompiledProgram | undefined;
  private scope: Scope = new Scope(false);

  exec(): Value {
    if (!this.program) throw new Error("VM: calling exec before compilation.");
    return exec(
      this.program.main,
      this.scope,
      this.scope.obj,
      [],
      this.program.functions
    );
  }

  compileAndExec(source: string): Value {
    const compiler = new Compiler();
    compiler.compile(source);
    this.program = compiler.getCompiledProgram();

    return this.exec();
  }
}
