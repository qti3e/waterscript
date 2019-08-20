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
import { dumper } from "./dump";

const stdin = process.stdin;
stdin.setRawMode!(true);
stdin.resume();
stdin.setEncoding("utf8");

stdin.on("data", function(key) {
  // ctrl-c ( end of text )
  if (key === "\u0003" || key === "q") {
    process.exit();
  }

  if (key === "r") {
    dumper.resume();
  }
});

dumper.handler = async (text: string) => {
  console.clear();
  console.log(text);
};

async function main() {
  const vm = new VM();

  const ret = await vm.compileAndExec(`
  let x = 0
  for (let i = 0; i < 5; i += 1) {
    x += 1
  }
  x
  `);

  console.clear();
  console.log(toJSValue(ret));
}

main();
