import { Compiler } from "./compiler";
import { dump } from "./dump";

function main() {
  const source = `
a * 0;

function y() {
}

function x() {
}

var test = 19;
`;

  const context = new Compiler();
  context.compile(source);
  const ret = context.getCompiledProgram();

  console.log(dump(ret.main));
  for (let i = 0; i < ret.functions.length; ++i) {
    console.log(dump(ret.functions[i], i.toString(16)));
  }
}

main();
