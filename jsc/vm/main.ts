/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { VM } from "./vm";
import "../src/buffer.polyfill";
import { toJSValue } from "./data";

function main() {
  const vm = new VM();

  const ret = vm.compileAndExec(`
  let i = 0;
  let j
  j = i = 5;
  j + 2
  `);

  console.log(toJSValue(ret));
}

main();
