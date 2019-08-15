import {
  Callable,
  Value,
  DataType,
  getValue,
  jsValue2VM,
  FunctionValue
} from "./data";
import {
  Undefined,
  Null,
  False,
  True,
  toPrimitive,
  toString,
  toNumber
} from "./ecma";
import { CompiledData } from "../src/compiler";
import { DataStack } from "./ds";
import { Scope } from "./scope";
import { ByteCode, byteCodeArgSize } from "../src/bytecode";
import { Obj } from "./obj";

export function call(
  callable: Callable,
  env: Value,
  args: Value[] = []
): Value {
  if (callable.type === DataType.NativeFunctionValue) {
    return callable.fn(env, ...args) || Undefined;
  }

  return exec(callable.compiledData, callable.scope, env, args);
}

export function exec(
  data: CompiledData,
  callScope: Scope,
  env: Value,
  args: Value[] = [],
  functions: CompiledData[] = []
): Value {
  const dataStack = new DataStack();
  const { codeSection, constantPool, scope } = data;
  let cursor = 0;

  while (cursor < codeSection.size) {
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

      case ByteCode.LdFunction: {
        const id = codeSection.getUint16(cursor + 1);
        const fn: FunctionValue = {
          type: DataType.FunctionValue,
          props: new Obj(),
          // TODO(qti3e) This will not work on nested functions, maybe:
          // import { compiler } from "./compiler";
          // compiler.getFunction(id);
          // And use the same compiler service in the VM class.
          compiledData: functions[id]!,
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
        const lPrim = toPrimitive(lhs);
        const rPrim = toPrimitive(rhs);
        if (
          lPrim.type === DataType.StringValue ||
          rPrim.type === DataType.StringValue
        ) {
          const lStr = toString(lPrim);
          const rStr = toString(rPrim);
          dataStack.push(jsValue2VM(lStr.value + rStr.value));
          break;
        }
        const lNum = toNumber(lPrim);
        const rNum = toNumber(rPrim);
        dataStack.push(jsValue2VM(lNum.value + rNum.value));
        break;
      }

      case ByteCode.Sub: {
        const rhs = getValue(dataStack.pop());
        const lhs = getValue(dataStack.pop());
        const lNum = toNumber(lhs);
        const rNum = toNumber(rhs);
        dataStack.push(jsValue2VM(lNum.value - rNum.value));
        break;
      }

      default:
        console.log("TODO: " + ByteCode[bytecode]);
    }
    cursor = nextCursor;
  }

  return getValue(dataStack.pop() || Undefined);
}
