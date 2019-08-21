import {
  Value,
  DataType,
  getValue,
  jsValue2VM,
  FunctionValue,
  Reference,
  setToRef,
  getRef,
  isCallable,
  BooleanValue,
  NumberValue,
  StringValue,
  SymbolValue
} from "./data";
import {
  Undefined,
  Null,
  False,
  True,
  toPrimitive,
  toString,
  toNumber,
  toBoolean
} from "./ecma";
import { CompiledData } from "../src/compiler";
import { DataStack } from "./ds";
import { Scope } from "./scope";
import { ByteCode, byteCodeArgSize } from "../src/bytecode";
import { Obj } from "./obj";
import { compiler } from "./compiler";
import { timer } from "./timer";
import { dumper } from "./dump";

export async function call(
  callable: Value,
  env: Value,
  args: Value[] = []
): Promise<Value> {
  if (!isCallable(callable)) {
    throw new TypeError("Value is not a function");
  }

  if (callable.type === DataType.NativeFunctionValue) {
    return callable.fn(env, ...args) || Undefined;
  }

  return await exec(callable.compiledData, callable.scope, env, args);
}

export async function exec(
  data: CompiledData,
  callScope: Scope,
  env: Value,
  args: Value[] = [],
  dataStack: DataStack = new DataStack()
): Promise<Value> {
  const { codeSection, constantPool, scope } = data;
  let cursor = 0;

  while (cursor < codeSection.size) {
    timer.check();
    await dumper.dump(data, cursor, dataStack, callScope);

    const bytecode = codeSection.get(cursor) as ByteCode;
    const argsSize = byteCodeArgSize[bytecode] || 0;
    let nextCursor = cursor + argsSize + 1;
    switch (bytecode) {
      case ByteCode.LdUint32:
        dataStack.push(jsValue2VM(codeSection.getUint32(cursor + 1)));
        break;
      case ByteCode.LdFloat32:
        dataStack.push(jsValue2VM(codeSection.getFloat32(cursor + 1)));
        break;
      case ByteCode.LdFloat64:
        dataStack.push(jsValue2VM(codeSection.getFloat64(cursor + 1)));
        break;
      case ByteCode.LdNull:
        dataStack.push(Null);
        break;
      case ByteCode.LdFalse:
        dataStack.push(False);
        break;
      case ByteCode.LdTrue:
        dataStack.push(True);
        break;
      case ByteCode.LdInfinity:
        dataStack.push(jsValue2VM(Infinity));
        break;
      case ByteCode.LdNaN:
        dataStack.push(jsValue2VM(NaN));
        break;
      case ByteCode.LdZero:
        dataStack.push(jsValue2VM(0));
        break;
      case ByteCode.LdOne:
        dataStack.push(jsValue2VM(1));
        break;
      case ByteCode.LdTwo:
        dataStack.push(jsValue2VM(2));
        break;
      case ByteCode.LdThis:
        dataStack.push(env);
        break;
      case ByteCode.LdUndef:
        dataStack.push(Undefined);
        break;
      case ByteCode.Pop:
        dataStack.pop();
        break;
      case ByteCode.Void:
        dataStack.pop();
        dataStack.push(Undefined);
        break;
      case ByteCode.Dup:
        dataStack.push(dataStack.peek());
        break;
      case ByteCode.LdObj:
        dataStack.push(new Obj());
        break;

      case ByteCode.Swap: {
        let a = dataStack.pop();
        let b = dataStack.pop();
        dataStack.push(a);
        dataStack.push(b);
        break;
      }

      case ByteCode.LdFunction: {
        const id = codeSection.getUint16(cursor + 1);
        const fn: FunctionValue = {
          type: DataType.FunctionValue,
          props: new Obj(),
          compiledData: compiler.requestCompile(id),
          scope: callScope
        };
        dataStack.push(fn);
        break;
      }

      case ByteCode.LdStr: {
        const offset = codeSection.getUint32(cursor + 1);
        const string = constantPool.getNetString16(offset);
        dataStack.push(jsValue2VM(string));
        break;
      }

      case ByteCode.Add: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lPrim = await toPrimitive(lhs);
        const rPrim = await toPrimitive(rhs);
        if (
          lPrim.type === DataType.StringValue ||
          rPrim.type === DataType.StringValue
        ) {
          const lStr = await toString(lPrim);
          const rStr = await toString(rPrim);
          dataStack.push(jsValue2VM(lStr.value + rStr.value));
          break;
        }
        const lNum = await toNumber(lPrim);
        const rNum = await toNumber(rPrim);
        dataStack.push(jsValue2VM(lNum.value + rNum.value));
        break;
      }

      case ByteCode.Sub: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value - rNum.value));
        break;
      }

      case ByteCode.Mul: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value * rNum.value));
        break;
      }

      case ByteCode.Div: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value / rNum.value));
        break;
      }

      case ByteCode.Pow: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value ** rNum.value));
        break;
      }

      case ByteCode.BLS: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value << rNum.value));
        break;
      }

      case ByteCode.BRS: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value >> rNum.value));
        break;
      }

      case ByteCode.BURS: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value >>> rNum.value));
        break;
      }

      case ByteCode.LT: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value < rNum.value));
        break;
      }

      case ByteCode.LTE: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value <= rNum.value));
        break;
      }

      case ByteCode.GT: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value > rNum.value));
        break;
      }

      case ByteCode.GTE: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value >= rNum.value));
        break;
      }

      case ByteCode.BitOr: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value | rNum.value));
        break;
      }

      case ByteCode.BitAnd: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value & rNum.value));
        break;
      }

      case ByteCode.BitXor: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = await toNumber(lhs);
        const rNum = await toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value ^ rNum.value));
        break;
      }

      case ByteCode.BitNot: {
        const val = getValue(dataStack.pop());
        const num = await toNumber(val);
        dataStack.push(jsValue2VM(~num.value));
        break;
      }

      case ByteCode.And: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lBool = toBoolean(lhs);
        const rBool = toBoolean(rhs);
        dataStack.push(jsValue2VM(lBool.value && rBool.value));
        break;
      }

      case ByteCode.OR: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lBool = toBoolean(lhs);
        const rBool = toBoolean(rhs);
        dataStack.push(jsValue2VM(lBool.value || rBool.value));
        break;
      }

      case ByteCode.Not: {
        const val = getValue(dataStack.pop());
        const bool = toBoolean(val);
        dataStack.push(jsValue2VM(!bool.value));
        break;
      }

      case ByteCode.Neg: {
        const val = getValue(dataStack.pop());
        const num = await toNumber(val);
        dataStack.push(jsValue2VM(-num.value));
        break;
      }

      case ByteCode.Pos: {
        const val = getValue(dataStack.pop());
        const num = await toNumber(val);
        dataStack.push(jsValue2VM(+num.value));
        break;
      }

      case ByteCode.Jmp: {
        const offset = codeSection.getUint16(cursor + 1);
        nextCursor = offset;
        break;
      }

      case ByteCode.JmpTruePop: {
        const offset = codeSection.getUint16(cursor + 1);
        const value = toBoolean(getValue(dataStack.pop()));
        if (value.value) {
          nextCursor = offset;
        }
        break;
      }

      case ByteCode.JmpFalsePop: {
        const offset = codeSection.getUint16(cursor + 1);
        const value = toBoolean(getValue(dataStack.pop()));
        if (!value.value) {
          nextCursor = offset;
        }
        break;
      }

      case ByteCode.JmpTruePeek: {
        const offset = codeSection.getUint16(cursor + 1);
        const value = toBoolean(getValue(dataStack.peek()));
        if (value.value) {
          nextCursor = offset;
        }
        break;
      }

      case ByteCode.JmpFalsePeek: {
        const offset = codeSection.getUint16(cursor + 1);
        const value = toBoolean(getValue(dataStack.peek()));
        if (!value.value) {
          nextCursor = offset;
        }
        break;
      }

      case ByteCode.JmpTrueThenPop: {
        const offset = codeSection.getUint16(cursor + 1);
        const value = toBoolean(getValue(dataStack.peek()));
        if (value.value) {
          dataStack.pop();
          nextCursor = offset;
        }
        break;
      }

      case ByteCode.JmpFalseThenPop: {
        const offset = codeSection.getUint16(cursor + 1);
        const value = toBoolean(getValue(dataStack.peek()));
        if (!value.value) {
          dataStack.pop();
          nextCursor = offset;
        }
        break;
      }

      case ByteCode.Let: {
        const value = getValue(dataStack.pop());
        const offset = codeSection.getUint32(cursor + 1);
        const name = constantPool.getNetString16(offset);
        callScope.def(name, true, value);
        break;
      }

      case ByteCode.Named: {
        const offset = codeSection.getUint32(cursor + 1);
        const name = constantPool.getNetString16(offset);
        const value = callScope.find(name);
        if (!value) throw new ReferenceError(name + " is not defined");
        dataStack.push(value);
        break;
      }

      case ByteCode.NamedRef: {
        const offset = codeSection.getUint32(cursor + 1);
        const name = constantPool.getNetString16(offset);
        const ref = callScope.findRef(name);
        dataStack.push(ref);
        break;
      }

      case ByteCode.Asgn: {
        const value = getValue(dataStack.pop());
        const ref = dataStack.pop() as Reference;
        dataStack.push(value);
        setToRef(ref, value);
        break;
      }

      case ByteCode.UnRefDup: {
        const ref = dataStack.peek() as Reference;
        const value = getRef(ref);
        dataStack.push(value);
        break;
      }

      case ByteCode.PropRef: {
        const obj = dataStack.peek();
        const offset = codeSection.getUint32(cursor + 1);
        const name = constantPool.getNetString16(offset);
        if (obj.type !== DataType.ObjectValue)
          throw new Error("Not implemented.");
        const ref = obj.getRef(name);
        dataStack.push(ref);
        break;
      }

      case ByteCode.ComputedRef: {
        const prop = getValue(dataStack.pop());
        const obj = dataStack.peek();
        const name = (await toString(prop)).value;
        if (obj.type !== DataType.ObjectValue)
          throw new Error("Not implemented.");
        const ref = obj.getRef(name);
        dataStack.push(ref);
        break;
      }

      case ByteCode.Ret: {
        return getValue(dataStack.pop());
      }

      case ByteCode.Call0: {
        const callable = getValue(dataStack.pop());
        const ret = await call(callable, env, []);
        dataStack.push(ret);
        break;
      }

      case ByteCode.EQS: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());

        if (rhs.type !== lhs.type) {
          dataStack.push(False);
          break;
        }

        if (
          rhs.type === DataType.NullValue ||
          rhs.type === DataType.UndefinedValue
        ) {
          dataStack.push(True);
          break;
        }

        if (rhs.type === DataType.BooleanValue) {
          dataStack.push(
            rhs.value === (lhs as BooleanValue).value ? True : False
          );
          break;
        }

        if (rhs.type === DataType.NumberValue) {
          dataStack.push(
            rhs.value === (lhs as NumberValue).value ? True : False
          );
          break;
        }

        if (rhs.type === DataType.StringValue) {
          dataStack.push(
            rhs.value === (lhs as StringValue).value ? True : False
          );
          break;
        }

        if (rhs.type === DataType.SymbolValue) {
          dataStack.push(rhs.id === (lhs as SymbolValue).id ? True : False);
          break;
        }

        if (
          rhs.type === DataType.FunctionValue ||
          rhs.type === DataType.ObjectValue ||
          rhs.type === DataType.NativeFunctionValue
        ) {
          dataStack.push(rhs === lhs ? True : False);
          break;
        }

        throw new Error("Not implemented.");
      }

      default: {
        if (
          bytecode === ByteCode.LdScope ||
          bytecode === ByteCode.BlockIn ||
          bytecode === ByteCode.BlockOut
        )
          break;
        const str = ByteCode[bytecode];
        throw new Error(`Not implemented. [${str}]`);
      }
    }
    cursor = nextCursor;
  }

  return getValue(dataStack.pop() || Undefined);
}
