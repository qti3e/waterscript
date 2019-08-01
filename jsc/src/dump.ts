import { ByteCode } from "./context";

export function dump(codes: number[]): string {
  let result = "";

  for (let i = 0; i < codes.length; ) {
    let length = 1;
    let line = "";

    line += " 0x" + ("000" + i.toString(16)).slice(-3);

    line += "\t";
    for (let j = 0; j < length; ++j) {
      line += " 0x" + ("00" + codes[i + j].toString(16)).slice(-2);
    }

    line = line.padEnd(40);
    line += " | ";

    line += ByteCode[codes[i]] as string;

    line = line.padEnd(79);
    line += "|";

    result += line + "\n";
    i += length;
  }

  return result;
}
