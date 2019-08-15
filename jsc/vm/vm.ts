/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { Compiler, CompiledProgram } from "../src/compiler";

export class VM {
  private program: CompiledProgram | undefined;

  exec(): void {
    if (!this.program) throw new Error("VM: calling exec before compilation.");
  }

  compileAndExec(source: string): void {
    const compiler = new Compiler();
    compiler.compile(source);
    this.program = compiler.getCompiledProgram();

    this.exec();
  }
}
