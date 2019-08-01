import { ByteCode } from "./context";

export function dump(codes: number[]): string {
  let result = "";

  for (let i = 0; i < codes.length; ) {
    let length = 1;
    let line = "";

    const bytecode = codes[i] as ByteCode;

    if (
      bytecode === ByteCode.Jmp ||
      bytecode === ByteCode.JmpTruePop ||
      bytecode === ByteCode.JmpFalsePop ||
      bytecode === ByteCode.JmpTruePeek ||
      bytecode === ByteCode.JmpFalsePeek ||
      bytecode === ByteCode.JmpTrueThenPop ||
      bytecode === ByteCode.JmpFalseThenPop
    )
      length = 2;

    line += " 0x" + ("000" + i.toString(16)).slice(-3);

    line += "\t";
    for (let j = 0; j < length; ++j) {
      line += " " + fmtNumber(codes[i + j]);
    }

    line = line.padEnd(40);
    line += " | ";

    line += ByteCode[bytecode];

    line = line.padEnd(79);
    line += "|";

    result += line + "\n";
    i += length;
  }

  return result;
}

function fmtNumber(num: number): string {
  const len = Math.max(1, Math.ceil(Math.log2(num + 1) / 8));
  const arr = Array(len)
    .fill(0)
    .map(() => {
      const r = num % 0x100;
      num = Math.floor(num / 0x100);
      return r;
    });
  arr.reverse();
  return arr.map(n => "0x" + ("00" + n.toString(16)).slice(-2)).join(" ");
}
