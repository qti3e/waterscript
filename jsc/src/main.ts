import { dump } from "./dump";

export function compile(source: string) {
  // TODO(qti3e)
}

function getEval() {
  return eval;
}

const global = getEval()("this");
global.compile = compile;
global.dump = dump;
