import { ByteCode } from "./bytecode";
import { Buffer } from "./buffer";
import { Compiler } from "./compiler";
import { Scope } from "./scope";

export type JumpByteCode =
  | ByteCode.Jmp
  | ByteCode.JmpFalsePeek
  | ByteCode.JmpFalsePop
  | ByteCode.JmpFalseThenPop
  | ByteCode.JmpTruePeek
  | ByteCode.JmpTruePop
  | ByteCode.JmpTrueThenPop;

export type CompiledData = {
  codeSection: ArrayBuffer;
  constantPool: ArrayBuffer;
  scope: ArrayBuffer;
};

export class Writer {
  readonly codeSection: Buffer = new Buffer(64);
  readonly constantPool: Buffer = new Buffer(128);
  readonly scope: Scope = new Scope();
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
      here: () => {
        this.codeSection.writeInt16(this.codeSection.getCursor() - 1, position);
      },
      next: () => {
        this.codeSection.writeInt16(this.codeSection.getCursor(), position);
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
}

export interface Jump {
  here(): void;
  next(): void;
}
