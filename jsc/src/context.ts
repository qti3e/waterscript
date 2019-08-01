export enum ByteCode {
  TODO = 0x0,
  // Data Stack Main Functions.
  Add = 0x01,
  Mul = 0x02,
  Sub = 0x03,
  Div = 0x04,
  Mod = 0x05,
  Pow = 0x06,
  BLS = 0x07,
  BRS = 0x08,
  BURS = 0x09,
  LT = 0x0a,
  LTE = 0x0b,
  GT = 0x0c,
  GTE = 0x0d,
  EQ = 0x0e,
  IEQ = 0x0f,
  EQS = 0x10,
  IEQS = 0x11,
  BitOr = 0x12,
  BitAnd = 0x13,
  BitXor = 0x14,
  BitNot = 0x15,
  And = 0x16,
  OR = 0x17,
  Not = 0x18,
  Neg = 0x19,
  Pos = 0x1a,
  Asgn = 0x1b,
  Pop = 0x1c,
  Type = 0x1d,
  Void = 0x1e,
  LdUndef = 0x1f,
  LdNull = 0x20,
  LdTrue = 0x21,
  LdFalse = 0x22,
  LdZero = 0x23,
  LdOne = 0x24,
  LdNaN = 0x25,
  LdInfinity = 0x26,
  LdArr = 0x27,
  LdObj = 0x28,
  LdThis = 0x29,
  Dup = 0x2a,
  Prop = 0x2b,
  InstanceOf = 0x2c,
  In = 0x2d,
  // Data Stack with Constant Pool
  IProp = 0x40,
  Load = 0x41,
  Named = 0x42,
  // Control Flow
  Jmp = 0x70,
  JmpTrue = 0x71,
  JmpFalse = 0x72
}

export class GenContext {
  private bytecodes: number[] = [];

  write(code: ByteCode): void {
    this.bytecodes.push(code);
  }

  getBytecodes(): number[] {
    return [...this.bytecodes];
  }
}
