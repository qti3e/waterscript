require("./dist/bundle");

const fs = require("fs");
const source = fs.readFileSync("./dist/bundle.js", "utf-8");
const ret = compile(source);

console.log(dump(ret.main));
for (let i = 0; i < ret.functions.length; ++i) {
  console.log(dump(ret.functions[i], i.toString(16)));
}
