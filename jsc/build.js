require("./dist/bundle");

const fs = require("fs");
const source = fs.readFileSync("./dist/bundle.js", "utf-8");
const ret = compile(source);
console.log(dump(ret));
