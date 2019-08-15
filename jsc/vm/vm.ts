/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { Compiler, CompiledProgram, CompiledData } from "../src/compiler";
import { Value } from "./data";
import { DataStack } from "./ds";
import { ByteCode, byteCodeArgSize } from "../src/bytecode";
import { Scope } from "./scope";

export class VM {
  private program: CompiledProgram | undefined;
  private ds: DataStack = new DataStack();
  private scope: Scope = new Scope(false);

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
