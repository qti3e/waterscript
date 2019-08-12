/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

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
  Next = 0x2e,
  ArPush = 0x2f,
  LdTwo = 0x30,
  Del = 0x31,
  ComputedRef = 0x32,
  UnRefDup = 0x33,
  PostfixUpdateAdd = 0x34,
  PostfixUpdateSub = 0x35,
  PrefixUpdateAdd = 0x36,
  PrefixUpdateSub = 0x37,
  // Data Stack with Constant Pool
  LdStr = 0x40,
  NamedProp = 0x41,
  Named = 0x42,
  Store = 0x43,
  Var = 0x44,
  Let = 0x45,
  SetIsConst = 0x46,
  Const = 0x47,
  NamedRef = 0x48,
  PropRef = 0x49,
  // Control Flow
  Jmp = 0x70,
  JmpTruePop = 0x71,
  JmpFalsePop = 0x72,
  JmpTruePeek = 0x73,
  JmpFalsePeek = 0x74,
  JmpTrueThenPop = 0x75,
  JmpFalseThenPop = 0x76,
  // Hoisting and Scoping
  LdScope = 0x90,
  Ret = 0x91,
  FunctionIn = 0x92,
  BlockOut = 0x93,
  BlockIn = 0x94,
  // Byte codes with fixed size arguments
  LdFunction = 0xa0,
  LdFloat32 = 0xa1,
  LdFloat64 = 0xa2,
  LdInt32 = 0xa3,
  LdUint32 = 0xa4
}

export const byteCodeArgSize: Partial<Record<ByteCode, number>> = {
  [ByteCode.Jmp]: 2,
  [ByteCode.JmpTruePop]: 2,
  [ByteCode.JmpFalsePop]: 2,
  [ByteCode.JmpTruePeek]: 2,
  [ByteCode.JmpFalsePeek]: 2,
  [ByteCode.JmpTrueThenPop]: 2,
  [ByteCode.JmpFalseThenPop]: 2,

  [ByteCode.LdStr]: 4,
  [ByteCode.NamedProp]: 4,
  [ByteCode.Named]: 4,
  [ByteCode.Store]: 4,
  [ByteCode.Var]: 4,
  [ByteCode.Let]: 4,
  [ByteCode.SetIsConst]: 4,
  [ByteCode.Const]: 4,
  [ByteCode.NamedRef]: 4,
  [ByteCode.PropRef]: 4,

  [ByteCode.LdFunction]: 2,
  [ByteCode.LdFloat32]: 4,
  [ByteCode.LdFloat64]: 8,
  [ByteCode.LdInt32]: 4,
  [ByteCode.LdUint32]: 4
};

export type JumpByteCode =
  | ByteCode.Jmp
  | ByteCode.JmpFalsePeek
  | ByteCode.JmpFalsePop
  | ByteCode.JmpFalseThenPop
  | ByteCode.JmpTruePeek
  | ByteCode.JmpTruePop
  | ByteCode.JmpTrueThenPop;

export function isJumpByteCode(bytecode: ByteCode): bytecode is JumpByteCode {
  return (
    bytecode === ByteCode.Jmp ||
    bytecode === ByteCode.JmpFalsePeek ||
    bytecode === ByteCode.JmpFalsePop ||
    bytecode === ByteCode.JmpFalseThenPop ||
    bytecode === ByteCode.JmpTruePeek ||
    bytecode === ByteCode.JmpTruePop ||
    bytecode === ByteCode.JmpTrueThenPop
  );
}
