/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import * as estree from "estree";
import { parse } from "acorn";
import { compileFunction, compileMain } from "./gen";
import { Position } from "estree";

interface VisitQueueEntity {
  index: number;
  node: estree.Function;
}

export interface CompiledData {
  codeSection: WSBuffer;
  constantPool: WSBuffer;
  scope: WSBuffer;
  position?: Position;
}

export interface CompiledProgram {
  main: CompiledData;
  functions: CompiledData[];
}

export class Compiler {
  private readonly functions: CompiledData[] = [];
  private readonly functionVisitQueue: VisitQueueEntity[] = [];
  private main: CompiledData | undefined;
  inVarDef = false;

  requestVisit(node: estree.Function): number {
    const index = this.functionVisitQueue.length;
    const entity = { index, node };
    this.functionVisitQueue.push(entity);
    return index;
  }

  compile(text: string): void {
    const node = parse(text, { locations: true });
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
