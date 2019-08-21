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
let digits = "";
let interval: NodeJS.Timeout | undefined;

stdin.on("data", function(key) {
  // ctrl-c ( end of text )
  if (key === "\u0003" || key === "q") {
    process.exit();
  }

  // Escape
  if (key === "\u001B") {
    digits = "";
  }

  if (/\d/.test(key)) {
    digits += key;
  }

  if (key === "f" || key === "j") {
    const num = parseInt(digits || "1");
    let i = 0;
    const x = setInterval(
      () => (i++ === num ? clearInterval(x) : dumper.forward()),
      10
    );
  }

  if (key === "b" || key === "k") {
    const num = parseInt(digits || "1");
    for (let i = 0; i < num; ++i) dumper.backward();
  }

  if (key === "c") {
    while (dumper.forward(false));
  }

  if (key === "p") {
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    } else {
      const time = parseInt(digits || "1500");
      if (dumper.forward()) {
        const x = setInterval(() => {
          if (!dumper.forward()) {
            clearInterval(x);
            interval = undefined;
          }
        }, time);
        interval = x;
      }
    }
  }

  if (!/\d/.test(key)) {
    digits = "";
  }
});

dumper.handler = async (text: string) => {
  console.clear();
  console.log(text);
};

async function main() {
  const vm = new VM();

  const ret = await vm.compileAndExec(`
  switch (0) {
    case 0: !0;
    default:
    case 1: !0;
  }
  `);

  console.clear();
  console.log(toJSValue(ret));
}

main();
