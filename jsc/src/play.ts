import { Compiler } from "./compiler";
import { dump } from "./dump";

function main() {
  const source = `
  var {
    a,
    "T": b,
    _c: c,
    kids: {
      _d: d,
      ...e
    },
    list: [f, g, ...h],
    ...i
  } = test;

  {
    var j = 9;
  }
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
