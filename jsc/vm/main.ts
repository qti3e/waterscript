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
  let x = function () {
    let z = 0;
    z += 5;
    z *= 2;
    return z;
  }

  x() + 3
  `);

  console.log(toJSValue(ret));
}

main();
