import { ByteCode, byteCodeArgSize } from "./bytecode";
import { CompiledData } from "./writer";

export function dump(data: CompiledData): string {
  let result = "";
  const codeU8 = new Uint8Array(data.codeSection);
  const cpU8 = new Uint8Array(data.constantPool);

  result += "<-------SECTION".padEnd(80, "-") + "\n";

  for (let i = 0; i < codeU8.length; ++i) {
    const bytecode: ByteCode = codeU8[i] as ByteCode;
    const argSize = byteCodeArgSize[bytecode] || 0;

    let line = " ";
    line += hex2str(i, "0000");
    line += " | ";

    for (let j = 0; j <= argSize; ++j) {
      line += hex2str(codeU8[i + j]) + " ";
    }

    line = line.padEnd(59);
    line += "| ";
    line += ByteCode[bytecode];

    line = line.padEnd(79);
    line += "|";

    i += argSize;
    result += line + "\n";
  }

  result += "        +------CONSTANT POOL".padEnd(80, "-") + "\n";

  for (let i = 0; i < cpU8.length; i += 16) {
    let line = " ";
    line += i.toString(16).padStart(8, "0");
    line += " | ";

    for (let j = 0; j < 16 && i + j < cpU8.length; ++j) {
      if (j === 8) line += "  ";
      line += cpU8[i + j].toString(16).padStart(2, "0") + " ";
    }

    line = line.padEnd(62);
    line += "|";

    for (let j = 0; j < 16 && i + j < cpU8.length; ++j) {
      const c = cpU8[i + j];
      line += c >= 0x20 && c <= 0x7e ? String.fromCharCode(c) : ".";
    }

    line = line.padEnd(79) + "|";

    result += line + "\n";
  }

  if (cpU8.length === 0) {
    result += "EMPTY".padStart(40).padEnd(79) + "|\n";
  }

  result += "          " + "END->".padStart(70, "-");

  return result;
}

function hex2str(num: number, pad = "00"): string {
  return "0x" + (pad + num.toString(16)).slice(-pad.length);
}
