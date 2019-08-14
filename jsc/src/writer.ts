/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { ByteCode, JumpByteCode } from "./bytecode";
import { Compiler } from "./compiler";
import { Scope } from "./scope";
import { Labels } from "./labels";
import { Position } from "estree";

export type CompiledData = {
  codeSection: WSBuffer;
  constantPool: WSBuffer;
  scope: WSBuffer;
  position?: Position;
};

export class Writer {
  readonly codeSection: WSBuffer = new WSBuffer(64);
  readonly constantPool: WSBuffer = new WSBuffer(128);
  readonly scope: Scope = new Scope();
  readonly labels: Labels = new Labels(this);
  varKind: "var" | "let" | "const" = "var";

  constructor(readonly compiler: Compiler) {
    this.codeSection.put(ByteCode.LdScope);
  }

  getData(): CompiledData {
    return {
      codeSection: this.codeSection,
      constantPool: this.constantPool,
      scope: this.scope.buffer
    };
  }

  jmp(type: JumpByteCode): Jump {
    this.codeSection.put(type);
    const position = this.codeSection.skip(2);

    return {
      next: () => {
        this.codeSection.setUint16(this.codeSection.getCursor(), position);
      }
    };
  }

  write(code: ByteCode, constantPoolData?: string): void {
    this.codeSection.put(code);

    if (constantPoolData !== undefined) {
      const index = this.constantPool.getCursor();
      this.constantPool.setNetString16(constantPoolData);
      this.codeSection.setUint32(index);
    }
  }

  getPosition(): number {
    return this.codeSection.getCursor();
  }

  jmpTo(type: JumpByteCode, pos: number): void {
    this.codeSection.put(type);
    this.codeSection.setInt16(pos);
  }
}

export interface Jump {
  next(): void;
}
