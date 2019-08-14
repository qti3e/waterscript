/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { ByteCode, byteCodeArgSize, isJumpByteCode } from "./bytecode";
import { CompiledData } from "./writer";
import { TextDecoder } from "./text_encoding";

const textDecoder = new TextDecoder();

export function dump(data: CompiledData, sectionName = "MAIN"): string {
  let result = "";
  const codeU8 = new Uint8Array(data.codeSection);
  const cpU8 = new Uint8Array(data.constantPool);
  const scopeU8 = new Uint8Array(data.scope);
  const sectionTitle = "SECTION #" + sectionName;

  let positionString = "";
  if (data.position) {
    const pos = data.position;
    positionString = "(Loc " + pos.line + ":" + pos.column + ")---";
  }

  result += ("+>" + sectionTitle).padEnd(80 - positionString.length, "-");
  result += positionString + "\n";

  // Codes for jump helper.
  enum JumpDir {
    S2E,
    E2S
  }
  type JumpInfo = {
    start: number;
    end: number;
    dir: JumpDir;
    col: number;
    done: boolean;
  };
  const jumps: JumpInfo[] = [];
  let max = 0;
  const addJump = (from: number, to: number) => {
    jumps.push({
      start: from < to ? from : to,
      end: from < to ? to : from,
      dir: from < to ? JumpDir.S2E : JumpDir.E2S,
      col: -1,
      done: false
    });
  };

  const renderJumps = (offset: number) => {
    if (max === 0) {
      return "";
    }

    let ret = Array(max).fill(" ");

    for (let i = 0; i <= max; ++i) {
      for (const jmp of jumps) {
        if (jmp.col !== i || jmp.done || (offset > -1 && offset < jmp.start))
          continue;

        ret[i] = "║";
        if (jmp.end === offset) jmp.done = true;

        if (jmp.start === offset || jmp.end === offset || offset < 0) {
          const headChars = jmp.start === offset ? ["═", "<"] : ["<", "═"];
          const botChar = jmp.start === offset ? "╗" : "╝";

          if (ret[0] !== "<") {
            ret[0] = headChars[jmp.dir === JumpDir.S2E ? 0 : 1];
          }

          ret[i] = botChar;
          for (let j = 1; j < i; ++j) {
            let char = "═";
            switch (ret[j]) {
              case "║":
                char = "╬";
                break;
              case "╝":
              case "╩":
                char = "╩";
                break;
              case "╗":
              case "╦":
                char = "╦";
                break;
              case "<":
                char = "<";
                break;
            }
            ret[j] = char;
          }
        }

        break;
      }
    }

    return ret.join("").trimRight();
  };

  for (let i = 0; i < codeU8.length; ++i) {
    const bytecode: ByteCode = codeU8[i] as ByteCode;
    const argSize = byteCodeArgSize[bytecode] || 0;

    if (isJumpByteCode(bytecode)) {
      const to = readUint16(codeU8, i + 1);
      addJump(i, to);
    }

    i += argSize;
  }

  const getSize = (jmp: JumpInfo) => jmp.end - jmp.start;

  jumps.sort((a, b) => getSize(a) - getSize(b));

  // [col, start, end]
  const consumedCols: [number, number, number][] = [];
  const isFree = (jmp: JumpInfo, col: number) => {
    for (const consumedCol of consumedCols) {
      if (consumedCol[0] === col) {
        const a0 = jmp.start;
        const a1 = jmp.end;
        const [, b0, b1] = consumedCol;
        if (a0 <= b1 && b0 <= a1) {
          return false;
        }
      }
    }
    return true;
  };

  for (const jmp of jumps) {
    for (let col = 2; ; col += 3) {
      if (isFree(jmp, col)) {
        jmp.col = col;
        consumedCols.push([col, jmp.start, jmp.end]);
        if (col > max) max = col;
        break;
      }
    }
  }
  // End of codes for jump helper.

  for (let i = 0; i < codeU8.length; ++i) {
    const bytecode: ByteCode = codeU8[i] as ByteCode;
    const argSize = byteCodeArgSize[bytecode] || 0;
    const offset = i;

    let line = " ";
    line += hex2str(offset, "00000000");
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
    result += line + renderJumps(offset) + "\n";
  }

  result += "          +------SCOPE".padEnd(80, "-");
  result += renderJumps(-1) + "\n";

  const scopeItemsLength = readUint16(scopeU8, 0);
  let scopeCursor = 2;
  if (scopeItemsLength === 0) {
    result += "|".padStart(11) + "EMPTY".padStart(34).padEnd(68) + "|\n";
  }

  for (let i = 0; i < scopeItemsLength; ++i) {
    let line = "";
    const isFunction = scopeU8[scopeCursor];
    const strLen = readUint16(scopeU8, scopeCursor + 1);
    const start = scopeCursor + 3;
    const name = textDecoder.decode(scopeU8.slice(start, start + strLen));
    scopeCursor += 2 + strLen;

    line += "DEF " + name;
    if (isFunction) {
      const fnId = readUint16(scopeU8, scopeCursor);
      line += " FUNCTION(" + hex2str(fnId) + ")";
      scopeCursor += 2;
    }
    result += ("| ".padStart(12) + line).padEnd(79) + "|\n";
  }

  result += "          +----CONSTANT POOL".padEnd(80, "-") + "\n";

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
    result += "|".padStart(11) + "EMPTY".padStart(34).padEnd(68) + "|\n";
  }

  return result.slice(0, result.length - 1);
}

function hex2str(num: number, pad = "00"): string {
  return (pad + num.toString(16)).slice(-pad.length);
}

function readUint16(u8: Uint8Array, index: number): number {
  return (u8[index] << 8) + u8[index + 1];
}
