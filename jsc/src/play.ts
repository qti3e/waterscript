import { Context } from "./context";
import { dump } from "./dump";

function main() {
  const source = `
  a + 1 * 0;
  function x() {
    b * 0;
  }

  function y() {
    "Hello!";
  }
  `;

  const context = new Context();
  context.compile(source);
  const ret = context.getCompiledProgram();

  console.log(dump(ret.main));
  for (let i = 0; i < ret.functions.length; ++i) {
    console.log(dump(ret.functions[i], i.toString(16)));
  }
}

main();
