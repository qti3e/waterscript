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
  var x = 4;
  var rp = 4;
  var rz = 4;
  function t() {}
  function t$A() {}
  for (let i = 0; i < 4; ++i) {}
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
