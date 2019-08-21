/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import * as estree from "estree";
import { visit } from "./visitor";
import { Writer } from "./writer";
import { Compiler, CompiledData } from "./compiler";
import { ByteCode } from "./bytecode";

export function compileMain(
  compiler: Compiler,
  program: estree.Program
): CompiledData {
  const writer = new Writer(compiler);
  const body = program.body;
  const last = body.length - 1;

  for (let i = 0; i < body.length; ++i) {
    visit(writer, body[i], i < last);
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

  writer.write(functionNode, ByteCode.LdUndef);
  writer.write(functionNode, ByteCode.Ret);

  const data = writer.getData();
  if (functionNode.loc) data.position = functionNode.loc.start;
  return data;
}
