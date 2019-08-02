import { ByteCode, byteCodeArgSize } from "./bytecode";

export function dump(buffer: ArrayBuffer): string {
  let result = "";
  const u8 = new Uint8Array(buffer);

  for (let i = 0; i < u8.length; ++i) {
    const bytecode: ByteCode = u8[i] as ByteCode;
    const argSize = byteCodeArgSize[bytecode] || 0;

    let line = " ";
    line += hex2str(i, "0000");
    line += " | ";

    for (let j = 0; j <= argSize; ++j) {
      line += hex2str(u8[i + j]) + " ";
    }

    line = line.padEnd(39);
    line += "| ";
    line += ByteCode[bytecode];

    line = line.padEnd(79);
    line += "|";

    i += argSize;
    result += line + "\n";
  }

  return result;
}

function hex2str(num: number, pad = "00"): string {
  return "0x" + (pad + num.toString(16)).slice(-2);
}
