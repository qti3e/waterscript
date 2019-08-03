import * as estree from "estree";
import { visit } from "./visitor";
import { Writer, CompiledData } from "./writer";
import { Context } from "./context";

export function compileMain(
  context: Context,
  program: estree.Program
): CompiledData {
  const writer = new Writer(context);

  // TODO(qti3e);

  for (const node of program.body) {
    visit(writer, node);
  }

  return writer.getData();
}

export function compileFunction(
  context: Context,
  functionNode: estree.Function
): CompiledData {
  const writer = new Writer(context);
  const body = functionNode.body;

  // TODO(qti3e);
  switch (body.type) {
    case "BlockStatement":
      for (const node of body.body) {
        visit(writer, node);
      }
      break;
  }

  return writer.getData();
}
