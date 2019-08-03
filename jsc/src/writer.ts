import { ByteCode } from "./bytecode";
import { Buffer } from "./buffer";
import { Context } from "./context";

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
};

export class Writer {
  readonly codeSection: Buffer = new Buffer(64);
  readonly constantPool: Buffer = new Buffer(128);

  constructor(readonly context: Context) {}

  getData(): CompiledData {
    return {
      codeSection: this.codeSection.getSlicedBuffer(),
      constantPool: this.constantPool.getSlicedBuffer()
    };
  }

  jmp(type: JumpByteCode): Jump {
    this.codeSection.put(type);
    const position = this.codeSection.skip(2);

    return {
      here: () => {
        this.codeSection.writeInt16(this.codeSection.getCursor() - 1, position);
      }
    };
  }

  write(code: ByteCode, constantPoolData?: string): void {
    this.codeSection.put(code);

    if (constantPoolData) {
      const index = this.constantPool.getCursor();
      this.constantPool.writeInt16(constantPoolData.length);
      this.constantPool.writeString(constantPoolData);
      this.codeSection.writeUint32(index);
    }
  }
}

export interface Jump {
  here(): void;
}
