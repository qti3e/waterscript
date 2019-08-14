require("./dist/bundle");

const fs = require("fs");
const source = fs.readFileSync("./dist/bundle.js", "utf-8");

const start = Date.now();
const ret = compile(source);
const time = Date.now() - start;
const lineNo = source.split(/\r?\n/g).length;

console.log("Compiled %d lines of code in %dms.", lineNo, time);
console.log(dump(ret.main));
for (let i = 0; i < ret.functions.length; ++i) {
  console.log(dump(ret.functions[i], i.toString(16)));
}
