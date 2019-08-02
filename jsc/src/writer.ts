import { ByteCode } from "./bytecode";

export type JumpByteCode =
  | ByteCode.Jmp
  | ByteCode.JmpFalsePeek
  | ByteCode.JmpFalsePop
  | ByteCode.JmpFalseThenPop
  | ByteCode.JmpTruePeek
  | ByteCode.JmpTruePop
  | ByteCode.JmpTrueThenPop;

export type CompiledData = number[];

export class Writer {
  readonly data: CompiledData = [];

  write(code: ByteCode): void {
    this.data.push(code);
  }

  getData(): CompiledData {
    return [...this.data];
  }

  jmp(type: JumpByteCode): Jump {
    this.data.push(type);
    this.data.push(-1);
    const position = this.data.length - 1;

    return {
      here: () => {
        this.data[position] = this.data.length - 1;
      }
    };
  }
}

export interface Jump {
  here(): void;
}
