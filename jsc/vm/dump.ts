import { CompiledData } from "../src/compiler";
import { Dumper } from "../src/dump";
import { DataStack } from "./ds";
import { DataType, isValue, toJSValue, isRef } from "./data";

class VMDumper {
  handler?: (text: string) => Promise<void>;
  private currentData?: CompiledData;
  private lines?: string[];
  private offset2line = new Map<number, number>();
  private line2offset = new Map<number, number>();
  private wait?: () => void;
  private cp: string[] = [];
  private dumper?: Dumper;

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

  private render(line: number, offset: number, ds: DataStack): string {
    const yellow = (x: string | number) => `\u001b[33m${x}\u001b[39m`;
    const cyan = (x: string | number) => `\u001b[36m${x}\u001b[39m`;
    const green = (x: string | number) => `\u001b[32m${x}\u001b[39m`;

    const arrow = green(">");

    const codeLines = this.lines!.map((data, no) => {
      data = (no === line ? arrow : " ") + data;
      const o = this.line2offset.get(no)!;
      return data + this.dumper!.renderJumpHelper(o, offset, green);
    });

    codeLines.push(...this.cp);

    const dataStackLines: string[] = ["Data Stack"];
    const dataStackLinesLengths: number[] = [dataStackLines[0].length];

    for (let i = ds.stack.length - 1; i >= 0; --i) {
      const value = ds.stack[i];

      if (isValue(value)) {
        const jsValue = toJSValue(value);
        let str = JSON.stringify(jsValue);
        if (str.length > 20) str = str.slice(0, 20) + "...";
        const type = typeof jsValue;
        dataStackLines.push("> " + cyan(type) + " " + yellow(str));
        dataStackLinesLengths.push(3 + type.length + str.length);
      } else if (isRef(value)) {
        const type =
          value.type === DataType.ObjectReference ? "Ref[Obj]" : "Ref[Scope]";
        dataStackLines.push("> " + cyan(type));
        dataStackLinesLengths.push(2 + type.length);
      }
    }

    const lines: string[] = [];
    const maxLength = Math.max(codeLines.length, dataStackLines.length);

    for (let i = 0; i < maxLength; ++i) {
      const p1 =
        (dataStackLines[i] || "") +
        "".padEnd(25 - (dataStackLinesLengths[i] || 0));
      const p2 = codeLines[i] || "";
      lines.push(" " + p1 + " ║ " + p2);
    }

    return lines.join("\n");
  }

  async dump(data: CompiledData, cursor: number, ds: DataStack): Promise<void> {
    if (!this.handler) return;
    if (data !== this.currentData) this.updateData(data);
    const promise = new Promise(resolve => (this.wait = resolve));
    const line = this.offset2line.get(cursor);
    if (line === undefined) throw new Error("Fuck!");
    await this.handler(this.render(line, cursor, ds));
    await promise;
  }

  resume(): void {
    if (this.wait) this.wait();
  }
}

export const dumper = new VMDumper();
