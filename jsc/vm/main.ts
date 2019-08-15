/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { VM } from "./vm";
import "../src/buffer.polyfill";

function main() {
  const vm = new VM();
  vm.compileAndExec(`
  null
  `);
}

main();
