/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { Compiler } from "./compiler";
import { dump } from "./dump";

function main() {
  const source = `
  while (x) {

    if (y) {

      while (z) {}

    } else {

    }

  }

  p++;
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
