import { test, assertEqual } from "liltest";
import { VM } from "../vm/vm";
import { toJSValue } from "../vm/data";

export function testCodeResult(name: string, code: string): void {
  const testFunction = function() {
    const vm = new VM({
      timeout: 1500
    });

    const expected = eval(code);
    const actual = vm.compileAndExec(code);

    assertEqual(toJSValue(actual), expected);
    // TODO(qti3e) DataStack GC sucks right now :/
    // assertEqual(vm.dataStack.getSize(), 0);
  };

  Object.defineProperty(testFunction, "name", { value: name });

  test(testFunction);
}
