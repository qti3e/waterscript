import { CompiledData } from "../src/compiler";
import { Dumper } from "../src/dump";
import { DataStack } from "./ds";
import { DataType, isValue, toJSValue, isRef, getValue } from "./data";
import { Scope } from "./scope";
import { compiler } from "./compiler";
import { toBoolean } from "./ecma";
import { ByteCode, isJumpByteCode } from "../src/bytecode";

class VMDumper {
  handler?: (text: string) => Promise<void>;
  private currentData?: CompiledData;
  private lines?: string[];
  private offset2line = new Map<number, number>();
  private line2offset = new Map<number, number>();
  private line2bytecode = new Map<number, ByteCode>();
  private wait?: () => void;
  private dumper?: Dumper;
  private history: string[] = [];
  private historyCursor: number = -1;
  private current: string = "";

  private updateData(data: CompiledData): void {
    const dumper = new Dumper(data, "");
    dumper.initJumps();
    this.dumper = dumper;
    this.lines = [];
    this.offset2line.clear();
    this.line2offset.clear();
    this.line2bytecode.clear();
    let i = 0;
    dumper.forEachByteCode((bc, args, offset) => {
      let line = dumper.renderByteCodeRow(offset, bc, [bc, ...args], 50, 20);
      this.lines!.push(line);
      this.offset2line.set(offset, i);
      this.line2offset.set(i, offset);
      this.line2bytecode.set(i, bc);
      i += 1;
    });
    this.currentData = data;
  }

  private render(
    line: number,
    offset: number,
    ds: DataStack,
    scope: Scope,
    old = false
  ): string {
    const yellow = (x: string | number) => `\u001b[33m${x}\u001b[39m`;
    const cyan = (x: string | number) => `\u001b[36m${x}\u001b[39m`;
    const green = (x: string | number) => `\u001b[32m${x}\u001b[39m`;
    const red = (x: string | number) => `\u001b[31m${x}\u001b[39m`;

    const arrow = (old ? red : green)("⮕");
    const bc = this.line2bytecode.get(line)!;
    let willJump = bc === ByteCode.Jmp;
    if (!willJump && isJumpByteCode(bc)) {
      const value = getValue(ds.peek());
      const boolean = toBoolean(value).value;
      if (boolean) {
        willJump =
          bc === ByteCode.JmpTruePeek ||
          bc === ByteCode.JmpTruePop ||
          bc === ByteCode.JmpTrueThenPop;
      } else {
        willJump =
          bc === ByteCode.JmpFalsePeek ||
          bc === ByteCode.JmpFalsePop ||
          bc === ByteCode.JmpFalseThenPop;
      }
    }
    const jmpFmt = willJump ? green : red;

    const codeLines = this.lines!.map((data, no) => {
      data = (no === line ? arrow : " ") + data;
      const o = this.line2offset.get(no)!;
      return data + this.dumper!.renderJumpHelper(o, offset, jmpFmt);
    });

    const scopeLines: string[] = ["- Scope"];
    const scopeLinesLength: number[] = [scopeLines[0].length];

    for (const [name, value] of scope.table) {
      const val =
        value.type === DataType.FunctionValue ||
        value.type === DataType.NativeFunctionValue
          ? "function"
          : value.type === DataType.UndefinedValue
          ? "undefined"
          : JSON.stringify(toJSValue(value));
      scopeLines.push(green("+") + " " + cyan(name) + " " + yellow(val));
      scopeLinesLength.push(3 + name.length + val.length);
    }

    const dataStackLines: string[] = ["- Data Stack"];
    const dataStackLinesLengths: number[] = [dataStackLines[0].length];

    for (let i = ds.stack.length - 1; i >= 0; --i) {
      const value = ds.stack[i];

      if (value.type === DataType.FunctionValue) {
        dataStackLines.push(green("+ ") + cyan("function"));
        dataStackLinesLengths.push(10);
        break;
      }

      if (isValue(value)) {
        const jsValue = toJSValue(value);
        let str = jsValue === undefined ? "" : JSON.stringify(jsValue);
        if (str.length > 20) str = str.slice(0, 20) + "...";
        const type = typeof jsValue;
        dataStackLines.push(green("+ ") + cyan(type) + " " + yellow(str));
        dataStackLinesLengths.push(3 + type.length + str.length);
      } else if (isRef(value)) {
        const type =
          value.type === DataType.ObjectReference ? "Ref[Obj]" : "Ref[Scope]";
        dataStackLines.push(green("+ ") + cyan(type));
        dataStackLinesLengths.push(2 + type.length);
      }
    }

    const [source, sourceLength] = formatSource(this.currentData!, line, {
      start: "\x1b[32m\x1b[4m",
      end: "\x1b[0m"
    });

    const left = [
      ...dataStackLines.slice(0, 10),
      ...new Array(10 - Math.min(dataStackLines.length, 10)).fill(""),
      ...scopeLines
    ];
    const leftLength = [
      ...dataStackLinesLengths.slice(0, 10),
      ...new Array(10 - Math.min(dataStackLines.length, 10)).fill(0),
      ...scopeLinesLength
    ];
    const maxLength = Math.max(codeLines.length, left.length, source.length);
    const lines: string[] = [];

    for (let i = 0; i < maxLength; ++i) {
      const p1 = (left[i] || "") + "".padEnd(25 - (leftLength[i] || 0));
      const p2 = (source[i] || "") + "".padEnd(40 - (sourceLength[i] || 0));
      const p3 = codeLines[i] || "";
      lines.push(" " + p1 + " ║ " + p2 + " ║ " + p3);
    }

    return lines.join("\n");
  }

  async dump(
    data: CompiledData,
    cursor: number,
    ds: DataStack,
    scope: Scope
  ): Promise<void> {
    if (!this.handler) return;
    if (data !== this.currentData) this.updateData(data);
    const promise = new Promise(resolve => (this.wait = resolve));
    const line = this.offset2line.get(cursor);
    if (line === undefined) throw new Error("Fuck!");

    const current = this.render(line, cursor, ds, scope);
    const p = this.handler(current);

    const historyItem = this.render(line, cursor, ds, scope, true);
    this.current = current;
    this.history.push(historyItem);
    this.historyCursor = this.history.length - 1;

    await p;
    await promise;
  }

  private resume(): void {
    if (this.wait) this.wait();
  }

  forward(resume = true): boolean {
    if (!this.handler) return false;

    if (!resume && this.historyCursor + 1 === this.history.length) return false;

    this.historyCursor += 1;
    const item =
      this.historyCursor + 1 === this.history.length
        ? this.current
        : this.history[this.historyCursor];

    if (!item) {
      if (!resume) return false;
      this.resume();
    } else {
      this.handler(item);
    }

    return true;
  }

  backward(): void {
    if (!this.handler || this.historyCursor <= 0) return;
    this.historyCursor -= 1;
    const item = this.history[this.historyCursor];
    this.handler(item);
  }
}

export const dumper = new VMDumper();

type Style = {
  start: string;
  end: string;
};

function formatSource(
  data: CompiledData,
  bytecodeNo: number,
  style: Style
): [string[], number[]] {
  const source = compiler.getSource(data);
  const [start, end] = compiler.getBound(data, bytecodeNo);

  let lines: string[] = [];
  let linesLength: number[] = [];

  let line = "";
  let len = 0;
  let minIndent = Infinity;
  let spaces = 0;
  let isBeforeChar = true;
  let insertedStart = false;
  let insertedEnd = false;
  let lineHasStart = false;

  for (let i = 0; i < source.length; ++i) {
    if (!insertedStart && i >= start) {
      line += style.start;
      insertedStart = true;
      lineHasStart = true;
    }

    if (!insertedEnd && i >= end) {
      line += style.end;
      insertedEnd = true;
    }

    let insertLine = false;
    if (source[i] === "\r" && source[i + 1] === "\n") {
      insertLine = true;
      ++i;
    } else if (source[i] === "\n") {
      insertLine = true;
    }

    if (insertLine) {
      if (line.trim() !== "" && len !== 0) {
        if (spaces < minIndent) minIndent = spaces;
      } else {
        line = "";
      }

      if (lineHasStart && insertedStart && !insertedEnd) {
        line += style.end;
      }
      lines.push(line);
      linesLength.push(len);

      spaces = 0;
      isBeforeChar = true;
      lineHasStart = false;
      line = "";
      len = 0;
      continue;
    }

    if (isBeforeChar) {
      switch (source[i]) {
        case " ":
          line += " ";
          spaces += 1;
          len += 1;
          continue;
        case "\t":
          line += "  ";
          spaces += 2;
          len += 2;
          continue;
        default:
          isBeforeChar = false;
          if (!lineHasStart && insertedStart && !insertedEnd) {
            line += style.start;
            lineHasStart = true;
          }
      }
    }

    line += source[i];
    len += 1;
  }

  if (minIndent === Infinity) {
    minIndent = spaces;
  }

  if (line.trim() !== "") {
    if (insertedStart && !insertedEnd && lineHasStart) {
      line += style.end;
    }
    lines.push(line);
    linesLength.push(len);
  }

  lines = lines.map(line => line.slice(minIndent));
  linesLength = linesLength.map(length => Math.max(0, length - minIndent));

  let s = 0;
  while (linesLength[s] === 0) s++;

  return [["- Source", ...lines.slice(s)], [8, ...linesLength.slice(s)]];
}
