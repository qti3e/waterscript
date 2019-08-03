import { parse } from "acorn";
import { gen } from "./gen";
import { dump } from "./dump";

function main() {
  const source = "true || 'hello world is there any thing'";

  const node = parse(source);
  console.log(JSON.stringify(node, null, 4));

  const ret = gen(node as any);
  console.log(dump(ret));
}

main();
