/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import * as estree from "estree";
import { Node as AcornNode } from "acorn";
import { ByteCode, JumpByteCode } from "./bytecode";
import { Compiler, CompiledData } from "./compiler";
import { Scope } from "./scope";
import { Labels } from "./labels";
import { ConstantPool } from "./constant_pool";

type Pos = {
  start: number,
  end: number
}

export class Writer {
  readonly codeSection: WSBuffer = new WSBuffer(64);
  readonly mapSection: WSBuffer = new WSBuffer(64);
  readonly constantPool: ConstantPool = new ConstantPool();
  readonly scope: Scope = new Scope();
  readonly labels: Labels = new Labels(this);
  varKind: "var" | "let" | "const" = "var";

  constructor(readonly compiler: Compiler) {
    this.codeSection.put(ByteCode.LdScope);
    this.mapSection.setUint16(0);
    this.mapSection.setUint16(0);
  }

  getData(): CompiledData {
    return {
      codeSection: this.codeSection,
      mapSection: this.mapSection,
      constantPool: this.constantPool.buffer,
      scope: this.scope.getBuffer()
    };
  }

  jmp(node: estree.Node | Pos, type: JumpByteCode): Jump {
    this.codeSection.put(type);
    this.mapSection.setUint16((node as Pos).start);
    this.mapSection.setUint16((node as Pos).end);
    const position = this.codeSection.skip(2);

    return {
      next: () => {
        this.codeSection.setUint16(this.codeSection.getCursor(), position);
      }
    };
  }

  write(node: estree.Node | Pos, code: ByteCode, constantPoolData?: string): void {
    this.codeSection.put(code);
    this.mapSection.setUint16((node as Pos).start);
    this.mapSection.setUint16((node as Pos).end);

    if (constantPoolData !== undefined) {
      const index = this.constantPool.setNetString16(constantPoolData);
      this.codeSection.setUint32(index);
    }
  }

  getPosition(): number {
    return this.codeSection.getCursor();
  }

  jmpTo(node: estree.Node | Pos, type: JumpByteCode, pos: number): void {
    this.codeSection.put(type);
    this.mapSection.setUint16((node as Pos).start);
    this.mapSection.setUint16((node as Pos).end);
    this.codeSection.setInt16(pos);
  }
}

export interface Jump {
  next(): void;
}
