import { test, assertEqual } from "liltest";
import { VM } from "../vm/vm";
import { toJSValue } from "../vm/data";

export function testCodeResult(
  name: string,
  code: string,
  timeout = 1500
): void {
  const testFunction = async function() {
    const vm = new VM({
      timeout
    });

    const expected = eval(code);
    const actual = await vm.compileAndExec(code);

    assertEqual(toJSValue(actual), expected);
    // TODO(qti3e) DataStack GC sucks right now :/
    // assertEqual(vm.dataStack.getSize(), 0);
  };

  Object.defineProperty(testFunction, "name", { value: name });

  test(testFunction);
}
