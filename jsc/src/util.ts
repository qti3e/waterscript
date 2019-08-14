function getEval() {
  return eval;
}

export const global = getEval()("this");
