/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

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
