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

if (global.Wsy === undefined) {
  global.Wsy = Object.create(null);
  global.Wsy.Compiler = Compiler;
  global.Wsy.dump = dump;
}

export { Compiler, dump };
