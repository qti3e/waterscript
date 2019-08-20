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
  switch (x) {
    case x: 0
    case y: 0
    default: 1
    case z: 0
    case t: 0
  }
  `;

  const compiler = new Compiler();
  const ret = compiler.compile(source);

  console.log(dump(ret));
  for (let i = 0; i <= compiler.lastFunctionId; ++i) {
    console.log(dump(compiler.requestCompile(i), i.toString(16)));
  }
}

main();
