import { Callable, Value, DataType } from "./data";
import { Undefined } from "./ecma";

export function call(
  callable: Callable,
  env: Value,
  args: Value[] = []
): Value {
  if (callable.type === DataType.NativeFunctionValue) {
    return callable.fn(env, ...args) || Undefined;
  }

  return exec(callable, env, args);
}

function exec(callable: Callable, env: Value, args: Value[] = []): Value {
  return Undefined;
}
