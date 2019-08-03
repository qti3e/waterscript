import * as estree from "estree";
import { parse } from "acorn";
import { CompiledData } from "./writer";
import { compileFunction, compileMain } from "./gen";

interface VisitQueueEntity {
  index: number;
  node: estree.Function;
}

interface CompiledProgram {
  main: CompiledData;
  functions: CompiledData[];
}

export class Compiler {
  private readonly functions: CompiledData[] = [];
  private readonly functionVisitQueue: VisitQueueEntity[] = [];
  private main: CompiledData | undefined;

  /**
   * The returned index can be used in `LdFunction`.
   */
  requestVisit(node: estree.Function): number {
    const index = this.functionVisitQueue.length;
    const entity = { index, node };
    this.functionVisitQueue.push(entity);
    return index;
  }

  compile(text: string): void {
    const node = parse(text);
    this.main = compileMain(this, node as any);

    for (const fn of this.functionVisitQueue) {
      this.functions.push(compileFunction(this, fn.node));
    }

    this.functionVisitQueue.length = 0;
  }

  getCompiledProgram(): CompiledProgram {
    return {
      main: this.main!,
      functions: this.functions
    };
  }
}