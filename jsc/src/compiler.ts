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

export interface CompiledData {
  codeSection: WSBuffer;
  constantPool: WSBuffer;
  scope: WSBuffer;
  position?: Position;
}

interface FunctionEntity {
  index: number;
  node: estree.Function;
  compiledData?: CompiledData;
}
export class Compiler {
  private readonly functions: Record<number, FunctionEntity> = {};
  readonly lastFunctionId = -1;
  inVarDef = false;

  requestVisit(node: estree.Function): number {
    const index = ++(this as any).lastFunctionId;
    const entity = { index, node };
    this.functions[index] = entity;
    return index;
  }

  compile(text: string): CompiledData {
    const node = parse(text, { locations: true });
    return compileMain(this, node as any);
  }

  requestCompile(functionId: number): CompiledData {
    const entity = this.functions[functionId];
    if (entity.compiledData) return entity.compiledData;
    const data = compileFunction(this, entity.node);
    entity.compiledData = data;
    return data;
  }
}
