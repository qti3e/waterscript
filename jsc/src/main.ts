import { parse } from "acorn";

function main() {
  console.log(JSON.stringify(parse('a + 1'), null, 4));
}

main();
