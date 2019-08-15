require("./dist/buffer");
require("./dist/bundle");

const fs = require("fs");
const source = fs.readFileSync("./dist/bundle.js", "utf-8");

const compiler = new Wsy.Compiler();
const main = compiler.compile(source);

console.log(Wsy.dump(main));
for (let i = 0; i <= compiler.lastFunctionId; ++i) {
  console.log(Wsy.dump(compiler.requestCompile(i), i.toString(16)));
}
