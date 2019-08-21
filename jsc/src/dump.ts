/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { ByteCode, byteCodeArgSize, isJumpByteCode } from "./bytecode";
import { CompiledData } from "./compiler";

enum JumpDir {
  S2E,
  E2S
}

interface JumpInfo {
  start: number;
  end: number;
  dir: JumpDir;
  col: number;
}

export class Dumper {
  private jumps: JumpInfo[] = [];
  private jmpMaxCol: number = 0;

  constructor(
    private readonly data: CompiledData,
    private readonly sectionName: string
  ) {}

  forEachByteCode(cb: (bc: ByteCode, args: number[], pos: number) => void) {
    const codeSection = this.data.codeSection;
    for (let cursor = 0; cursor < codeSection.size; ++cursor) {
      const bytecode: ByteCode = codeSection.get(cursor) as ByteCode;
      const argSize = byteCodeArgSize[bytecode] || 0;
      const args: number[] = [];

      for (let i = 1; i <= argSize; ++i) {
        args.push(codeSection.get(cursor + i));
      }

      cb(bytecode, args, cursor);

      cursor += argSize;
    }
  }

  dump(): string {
    this.initJumps();

    let ret = "";
    ret += this.renderHeader() + "\n";
    ret += this.renderCodeSection().join("\n") + "\n";
    ret += this.renderScopeHeader();
    ret += this.renderJumpHelper(-1) + "\n";
    ret += this.renderScopeContent().join("\n") + "\n";
    ret += this.renderConstantsHeader() + "\n";
    ret += this.renderConstantsContent().join("\n");

    return ret;
  }

  renderCodeSection(): string[] {
    const ret: string[] = [];
    this.forEachByteCode((bc, args, pos) => {
      let line = this.renderByteCodeRow(pos, bc, [bc, ...args]);
      line += this.renderJumpHelper(pos);
      ret.push(line);
    });
    return ret;
  }

  renderByteCodeRow(
    offset: number,
    bytecode: ByteCode,
    bytes: number[]
  ): string {
    let line = " ";
    line += hex2str(offset, 8);
    line += " | ";

    for (let j = 0; j < bytes.length; ++j) {
      line += hex2str(bytes[j]) + " ";
    }

    line = line.padEnd(59);
    line += "| ";
    line += ByteCode[bytecode];

    line = line.padEnd(79);
    line += "|";

    return line;
  }

  renderScopeHeader(): string {
    return "          +------SCOPE".padEnd(80, "-");
  }

  renderScopeContent(): string[] {
    const result: string[] = [];
    const scope = this.data.scope;
    const itemsCount = scope.getUint16(0);

    if (itemsCount === 0) {
      return [this.renderEmpty()];
    }

    let cursor = 2;

    for (let i = 0; i < itemsCount; ++i) {
      let line = "";
      const isFunction = scope.get(cursor);
      const name = scope.getNetString16(cursor + 1);
      cursor += 3 + name.length * 2;

      line += "DEF " + name;

      if (isFunction) {
        const fnId = scope.getUint16(cursor);
        line += " FUNCTION(" + hex2str(fnId) + ")";
        cursor += 2;
      }

      line = ("| ".padStart(12) + line).padEnd(79) + "|";
      result.push(line);
    }

    return result;
  }

  renderConstantsHeader(): string {
    return "          +----CONSTANT POOL".padEnd(80, "-");
  }

  renderConstantsContent(): string[] {
    const result: string[] = [];
    const constantPool = this.data.constantPool;
    const size = constantPool.size;

    if (size === 0) {
      return [this.renderEmpty()];
    }

    for (let i = 0; i < size; i += 16) {
      let line = " ";
      line += hex2str(i, 8);
      line += " | ";

      for (let j = 0; j < 16 && i + j < size; ++j) {
        if (j === 8) line += "  ";
        line += hex2str(constantPool.get(i + j)) + " ";
      }

      line = line.padEnd(62);
      line += "|";

      for (let j = 0; j < 16 && i + j < size; ++j) {
        const c = constantPool.get(i + j);
        line += c >= 0x20 && c <= 0x7e ? String.fromCharCode(c) : ".";
      }

      line = line.padEnd(79) + "|";

      result.push(line);
    }

    return result;
  }

  renderEmpty(): string {
    return "|".padStart(11) + "EMPTY".padStart(34).padEnd(68) + "|";
  }

  renderHeader(): string {
    const pos = this.data.position;
    const positionString = pos
      ? "(Loc " + pos.line + ":" + pos.column + ")---"
      : "";
    return (
      ("+>Section #" + this.sectionName)
        .toUpperCase()
        .padEnd(80 - positionString.length, "-") + positionString
    );
  }

  renderJumpHelper(
    offset: number,
    activeOffset?: number,
    fmt?: (s: string) => string
  ): string {
    if (this.jmpMaxCol === 0) {
      return "";
    }

    let ret = Array(this.jmpMaxCol).fill(" ");

    for (let i = 0; i <= this.jmpMaxCol; ++i) {
      for (const jmp of this.jumps) {
        if (
          jmp.col !== i ||
          (offset > -1 && (offset < jmp.start || offset > jmp.end))
        )
          continue;

        ret[i] = "║";

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

    if (activeOffset !== undefined && fmt) {
      for (const jmp of this.jumps) {
        if (
          (jmp.dir === JumpDir.S2E ? jmp.start : jmp.end) !== activeOffset ||
          offset < jmp.start ||
          offset > jmp.end
        )
          continue;

        ret[jmp.col] = fmt(ret[jmp.col]);

        if (jmp.start === offset || jmp.end === offset) {
          for (let i = 0; i < jmp.col; ++i) {
            ret[i] = fmt(ret[i]);
          }
        }
      }
    }

    return ret.join("").trimRight();
  }

  initJumps(): void {
    // Find all of the jump instructions.
    this.forEachByteCode((bc, args, pos) => {
      if (isJumpByteCode(bc)) {
        const to = readUint16(args);
        this.addJump(pos, to);
      }
    });

    // Sort jumps by their length. (How far the jumps are)
    // This way the jumps that are smaller will be inside
    // larger jumps.
    const getSize = (jmp: JumpInfo) => jmp.end - jmp.start;
    this.jumps.sort((a, b) => getSize(a) - getSize(b));

    // Store consumed cols for each row so they don't overlap.
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

    // Assign a column to each jump.
    for (const jmp of this.jumps) {
      for (let col = 2; ; col += 3) {
        if (isFree(jmp, col)) {
          jmp.col = col;
          consumedCols.push([col, jmp.start, jmp.end]);
          if (col > this.jmpMaxCol) this.jmpMaxCol = col;
          break;
        }
      }
    }
  }

  addJump(from: number, to: number): void {
    this.jumps.push({
      start: from < to ? from : to,
      end: from < to ? to : from,
      dir: from < to ? JumpDir.S2E : JumpDir.E2S,
      col: -1
    });
  }
}

export function dump(data: CompiledData, name = "Main"): string {
  const dumper = new Dumper(data, name);
  return dumper.dump();
}

function readUint16(n: number[]): number {
  return (n[0] << 8) + n[1];
}

function hex2str(num: number, length = 2): string {
  return num.toString(16).padStart(length, "0");
}
