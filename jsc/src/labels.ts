/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import * as estree from "estree";
import { Writer, Pos } from "./writer";
import { ByteCode } from "./bytecode";

export class Labels {
  private labelStack: LabelInfo[] = [];
  private currentLabelInfo: LabelInfo | undefined;
  private currentLabelName: string | undefined;

  constructor(private readonly writer: Writer) {}

  getLabelInfo(label: string | undefined): LabelInfo {
    if (label === undefined) {
      if (this.currentLabelInfo) {
        return this.currentLabelInfo;
      }
    } else {
      for (let i = this.labelStack.length - 1; i >= 0; --i) {
        const labelInfo = this.labelStack[i];
        if (labelInfo.name === label) {
          return labelInfo;
        }
      }
    }

    throw new ReferenceError("Unresolved label.");
  }

  setName(name: string): void {
    this.currentLabelName = name;
  }

  create(): NormalLabelInfo {
    const labelInfo = new NormalLabelInfo(
      this.currentLabelName,
      this.writer.codeSection,
      this.writer.mapSection
    );

    this.currentLabelName = undefined;
    this.currentLabelInfo = labelInfo;
    this.labelStack.push(labelInfo);

    return labelInfo;
  }

  createSwitch(): SwitchLabelInfo {
    const last = this.labelStack[this.labelStack.length - 1];
    const labelInfo = new SwitchLabelInfo(
      this.currentLabelName,
      this.writer.codeSection,
      this.writer.mapSection,
      last
    );

    this.currentLabelName = undefined;
    this.currentLabelInfo = labelInfo;
    this.labelStack.push(labelInfo);

    return labelInfo;
  }
}

interface LabelInfo {
  readonly name: string | undefined;
  jumpToEnd(node: estree.Node | Pos): void;
  jumpToTest(node: estree.Node | Pos): void;
}

class NormalLabelInfo implements LabelInfo {
  private endPosition?: number;
  private testPosition?: number;

  private pendingEndJumps?: number[] = [];
  private pendingTestJumps?: number[] = [];

  constructor(
    public readonly name: string | undefined,
    private readonly codeSection: WSBuffer,
    private readonly mapSection: WSBuffer
  ) {}

  jumpToEnd(node: estree.Node | Pos): void {
    this.codeSection.put(ByteCode.Jmp);
    this.mapSection.setUint16((node as Pos).start);
    this.mapSection.setUint16((node as Pos).end);

    if (this.endPosition === undefined) {
      this.pendingEndJumps!.push(this.codeSection.skip(2));
      return;
    }

    this.codeSection.setUint16(this.endPosition);
  }

  jumpToTest(node: estree.Node | Pos): void {
    this.codeSection.put(ByteCode.Jmp);
    this.mapSection.setUint16((node as Pos).start);
    this.mapSection.setUint16((node as Pos).end);

    if (this.testPosition === undefined) {
      this.pendingTestJumps!.push(this.codeSection.skip(2));
      return;
    }

    this.codeSection.setUint16(this.testPosition);
  }

  end(): void {
    if (this.endPosition)
      throw new Error("Label end has already been declared.");

    const position = this.codeSection.getCursor();
    this.endPosition = position;

    for (const location of this.pendingEndJumps!) {
      this.codeSection.setUint16(position, location);
    }

    this.pendingEndJumps = undefined;
  }

  test(): void {
    if (this.testPosition)
      throw new Error("Label test has already been declared.");

    const position = this.codeSection.getCursor();
    this.testPosition = position;

    for (const location of this.pendingTestJumps!) {
      this.codeSection.setUint16(position, location);
    }

    this.pendingTestJumps = undefined;
  }
}

class SwitchLabelInfo extends NormalLabelInfo {
  constructor(
    public readonly name: string | undefined,
    codeSection: WSBuffer,
    mapSection: WSBuffer,
    private readonly last: LabelInfo | undefined
  ) {
    super(name, codeSection, mapSection);
  }

  jumpToTest(node: estree.Node | Pos): void {
    if (!this.last) {
      throw new Error("Unresolved label.");
    }
    this.last.jumpToTest(node);
  }
}
