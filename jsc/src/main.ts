/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { Compiler } from "./compiler";
import { dump } from "./dump";
import { global } from "./util";

export function compile(source: string) {
  const context = new Compiler();
  context.compile(source);

  const ret = context.getCompiledProgram();
  return ret;
}

global.compile = compile;
global.dump = dump;
