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

export class VM {
  private program: CompiledProgram | undefined;
  private ds: DataStack = new DataStack();

  runCompiledData(data: CompiledData, cursor = 0): void {
    const { codeSection, scope, constantPool } = data;
    const bytecode = codeSection.get(cursor) as ByteCode;
    const argSize = byteCodeArgSize[bytecode] || 0;
    const nextCursor = cursor + argSize + 1;

    switch (bytecode) {
      default:
        console.log("TODO: " + ByteCode[bytecode]);
    }

    if (nextCursor < codeSection.size) this.runCompiledData(data, nextCursor);
  }

  exec(): void {
    if (!this.program) throw new Error("VM: calling exec before compilation.");
    this.runCompiledData(this.program.main);
  }

  compileAndExec(source: string): void {
    const compiler = new Compiler();
    compiler.compile(source);
    this.program = compiler.getCompiledProgram();

    this.exec();
  }
}
