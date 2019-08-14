import { ByteCode, JumpByteCode } from "./bytecode";
import { Buffer } from "./buffer";
import { Compiler } from "./compiler";
import { Scope } from "./scope";
import { Labels } from "./labels";
import { Position } from "estree";

export type CompiledData = {
  codeSection: ArrayBuffer;
  constantPool: ArrayBuffer;
  scope: ArrayBuffer;
  position?: Position;
};

export class Writer {
  readonly codeSection: Buffer = new Buffer(64);
  readonly constantPool: Buffer = new Buffer(128);
  readonly scope: Scope = new Scope();
  readonly labels: Labels = new Labels(this);
  varKind: "var" | "let" | "const" = "var";

  constructor(readonly compiler: Compiler) {
    this.codeSection.put(ByteCode.LdScope);
  }

  getData(): CompiledData {
    return {
      codeSection: this.codeSection.getSlicedBuffer(),
      constantPool: this.constantPool.getSlicedBuffer(),
      scope: this.scope.getArrayBuffer()
    };
  }

  jmp(type: JumpByteCode): Jump {
    this.codeSection.put(type);
    const position = this.codeSection.skip(2);

    return {
      next: () => {
        this.codeSection.writeUint16(this.codeSection.getCursor(), position);
      }
    };
  }

  write(code: ByteCode, constantPoolData?: string): void {
    this.codeSection.put(code);

    if (constantPoolData) {
      const index = this.constantPool.getCursor();
      this.constantPool.writeNetString16(constantPoolData);
      this.codeSection.writeUint32(index);
    }
  }

  getPosition(): number {
    return this.codeSection.getCursor();
  }

  jmpTo(type: JumpByteCode, pos: number): void {
    this.codeSection.put(type);
    this.codeSection.writeInt16(pos);
  }
}

export interface Jump {
  next(): void;
}
