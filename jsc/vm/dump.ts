import { CompiledData } from "../src/compiler";
import { Dumper } from "../src/dump";
import { DataStack } from "./ds";
import { DataType, isValue, toJSValue, isRef } from "./data";
import { Scope } from "./scope";

class VMDumper {
  handler?: (text: string) => Promise<void>;
  private currentData?: CompiledData;
  private lines?: string[];
  private offset2line = new Map<number, number>();
  private line2offset = new Map<number, number>();
  private wait?: () => void;
  private cp: string[] = [];
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
    this.cp = [
      dumper.renderConstantsHeader(),
      ...dumper.renderConstantsContent()
    ];
    let i = 0;
    dumper.forEachByteCode((bc, args, offset) => {
      let line = dumper.renderByteCodeRow(offset, bc, [bc, ...args]);
      this.lines!.push(line);
      this.offset2line.set(offset, i);
      this.line2offset.set(i, offset);
      i += 1;
    });
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

    const codeLines = this.lines!.map((data, no) => {
      data = (no === line ? arrow : " ") + data;
      const o = this.line2offset.get(no)!;
      return data + this.dumper!.renderJumpHelper(o, offset, green);
    });

    codeLines.push(...this.cp);

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
    const maxLength = Math.max(codeLines.length, left.length);
    const lines: string[] = [];

    for (let i = 0; i < maxLength; ++i) {
      const p1 = (left[i] || "") + "".padEnd(25 - (leftLength[i] || 0));
      const p2 = codeLines[i] || "";
      lines.push(" " + p1 + " ║ " + p2);
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
