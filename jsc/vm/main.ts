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

  if (key === "f" || key === "j") {
    dumper.forward();
  }

  if (key === "b" || key === "k") {
    dumper.backward();
  }
});

dumper.handler = async (text: string) => {
  console.clear();
  console.log(text);
};

async function main() {
  const vm = new VM();

  const ret = await vm.compileAndExec(`
  let x;

  x = 5;

  x + 3 + 2 * 4
  `);

  console.clear();
  console.log(toJSValue(ret));
}

main();
