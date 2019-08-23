/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { Compiler } from "./compiler";
import { dump } from "./dump";
import "./buffer.polyfill";

function main() {
  const source = `
2 + 3;
  `;

  const compiler = new Compiler();
  const ret = compiler.compile(source);

  console.log(dump(ret));
  for (let i = 1; i <= compiler.lastFunctionId; ++i) {
    console.log(dump(compiler.requestCompile(i), i.toString(16)));
  }
}

main();
