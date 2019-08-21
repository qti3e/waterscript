/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import * as estree from "estree";
import { parse, Node as AcornNode } from "acorn";
import { compileFunction, compileMain } from "./gen";
import { Position } from "estree";

export interface CompiledData {
  codeSection: WSBuffer;
  mapSection: WSBuffer;
  constantPool: WSBuffer;
  scope: WSBuffer;
  position?: Position;
}

type JSSource = {
  text: string;
};

interface FunctionEntity {
  index: number;
  node: estree.Function;
  compiledData?: CompiledData;
  source: JSSource;
}

export class Compiler {
  private readonly functions: Record<number, FunctionEntity> = {};
  private readonly sources: WeakMap<CompiledData, JSSource> = new WeakMap();
  private currentSource: JSSource = { text: "" };

  readonly lastFunctionId = 0;
  inVarDef = false;

  requestVisit(node: estree.Function): number {
    const index = ++(this as any).lastFunctionId;
    const entity = { index, node, source: this.currentSource };
    this.functions[index] = entity;
    return index;
  }

  compile(text: string): CompiledData {
    this.currentSource = Object.create(null);
    this.currentSource.text = text;
    const node = parse(text, { locations: true });
    const data = compileMain(this, node as any);
    this.sources.set(data, this.currentSource);
    return data;
  }

  requestCompile(functionId: number): CompiledData {
    const entity = this.functions[functionId];
    this.currentSource = entity.source;
    if (entity.compiledData) return entity.compiledData;
    const data = compileFunction(this, entity.node);
    this.sources.set(data, entity.source);
    entity.compiledData = data;
    return data;
  }

  getSource(data: CompiledData): string {
    return this.sources.get(data)!.text;
  }

  getFunctionSource(functionId: number): string {
    const entity = this.functions[functionId];
    const node = (entity.node as any) as AcornNode;
    return entity.source.text.slice(node.start, node.end);
  }

  getBound(data: CompiledData, bytecodeNo: number): [number, number] {
    const start = data.mapSection.getUint16(bytecodeNo * 4);
    const end = data.mapSection.getUint16(bytecodeNo * 4 + 2);
    return [start, end];
  }
}
