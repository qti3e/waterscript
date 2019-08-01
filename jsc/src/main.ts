import { parse } from "acorn";
import { gen } from "./gen";
import { dump } from "./dump";

export function compile(source: string): number[] {
  const node = parse(source);
  return gen(node as any);
}

function getEval() {
  return eval;
}

const global = getEval()("this");
global.compile = compile;
global.dump = dump;
