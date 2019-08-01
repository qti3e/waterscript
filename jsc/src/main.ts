import { parse } from "acorn";
import { gen } from "./gen";
import { dump } from "./dump";

function main() {
  const node = parse("true + 0 * 1");
  const ret = gen(node as any);

  console.log(JSON.stringify(node, null, 4));
  console.log(dump(ret));
}

main();
