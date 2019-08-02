import { ByteCode } from "./bytecode";
import { Buffer } from "./buffer";

export type JumpByteCode =
  | ByteCode.Jmp
  | ByteCode.JmpFalsePeek
  | ByteCode.JmpFalsePop
  | ByteCode.JmpFalseThenPop
  | ByteCode.JmpTruePeek
  | ByteCode.JmpTruePop
  | ByteCode.JmpTrueThenPop;

export type CompiledData = ArrayBuffer;

export class Writer {
  readonly data: Buffer = new Buffer();

  write(code: ByteCode): void {
    this.data.put(code);
  }

  getData(): CompiledData {
    return this.data.getSlicedBuffer();
  }

  jmp(type: JumpByteCode): Jump {
    this.data.put(type);
    const position = this.data.skip(2);

    return {
      here: () => {
        this.data.writeInt16(this.data.getCursor() - 1, position);
      }
    };
  }
}

export interface Jump {
  here(): void;
}
