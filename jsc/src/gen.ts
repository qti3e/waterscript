/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import * as estree from "estree";
import { visit } from "./visitor";
import { Writer, CompiledData } from "./writer";
import { Compiler } from "./compiler";

export function compileMain(
  compiler: Compiler,
  program: estree.Program
): CompiledData {
  const writer = new Writer(compiler);

  for (const node of program.body) {
    visit(writer, node);
  }

  return writer.getData();
}

export function compileFunction(
  compiler: Compiler,
  functionNode: estree.Function
): CompiledData {
  const writer = new Writer(compiler);
  const body = functionNode.body;

  switch (body.type) {
    case "BlockStatement":
      for (const node of body.body) {
        visit(writer, node);
      }
      break;
  }

  const data = writer.getData();
  if (functionNode.loc) data.position = functionNode.loc.start;
  return data;
}
