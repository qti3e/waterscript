import * as data from "./src/bytecode";

function toUnderscore(str: string): string {
  if (str.toUpperCase() == str) return "_" + str;
  return str
    .replace(/(?:^\w|[A-Z0-9]|\b\w)/g, word => "_" + word)
    .replace(/\s+/g, "")
    .toUpperCase()
    .trim();
}

const fmt = (n: number, width = 2) =>
  "0x" + n.toString(16).padStart(width, "0");

console.log(`// This is an auto generated file.
#ifndef _Q_WS_BYTECODE_
#define _Q_WS_BYTECODE_

enum WS_BYTECODE {`);

let max = 0;
const arg_sizes = Array(500).fill(0);

for (let i = 0; i < 300; ++i) {
  const name: string = data.ByteCode[i];
  if (!name) continue;
  const value: data.ByteCode = (data.ByteCode[
    name as any
  ] as any) as data.ByteCode;
  if (value > max) max = value;
  const arg_size = data.byteCodeArgSize[value] || 0;
  arg_sizes[value] = arg_size;
  console.log("  " + "WB" + toUnderscore(name) + " = " + fmt(value) + ",");
}

console.log(`};

const int WS_BYTECODE_SIZE[] = {`);

for (let i = 0; i <= max; i += 13) {
  let line = arg_sizes
    .slice(i, i + 13)
    .map(x => fmt(x))
    .join(", ");
  console.log("  " + line + ",");
}

console.log(`};

const char *WS_BYTECODE_NAME[] = {`);

let line = "";
for (let i = 0; i <= max; ++i) {
  const name = data.ByteCode[i] as string;
  const str = name ? `"${name}"` : `0`;
  if ((line + str).length > 77) {
    console.log("  " + line + ",");
    line = str;
  } else if (line) {
    line += ", " + str;
  } else {
    line = str;
  }
}

if (line) {
  console.log("  " + line);
}

console.log(`};

#endif`);
