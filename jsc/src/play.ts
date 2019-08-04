import { Compiler } from "./compiler";
import { dump } from "./dump";

function main() {
  const source = `
void x;
a - -0;
`;

  const context = new Compiler();
  console.time("Compile");
  context.compile(source);
  console.timeEnd("Compile");
  const ret = context.getCompiledProgram();

  console.log(dump(ret.main));
  for (let i = 0; i < ret.functions.length; ++i) {
    console.log(dump(ret.functions[i], i.toString(16)));
  }
}

main();
