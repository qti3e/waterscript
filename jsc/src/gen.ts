import * as estree from "estree";
import * as walk from "acorn-walk";
import { ByteCode } from "./bytecode";
import { visit } from "./visitor";
import { Writer, CompiledData } from "./writer";
import { Compiler } from "./compiler";

export function compileMain(
  compiler: Compiler,
  program: estree.Program
): CompiledData {
  const writer = new Writer(compiler);
  const ret = findFunctionDeclarationsAndVars(program);

  for (const node of ret.vars) {
    for (const d of node.declarations) {
      // TODO(qti3e) Support other patterns.
      if (d.id.type == "Identifier") {
        writer.write(ByteCode.Var, d.id.name);
      }
    }
  }

  for (const node of ret.functions) {
    writer.write(ByteCode.LdFunction);
    writer.codeSection.writeUint16(compiler.requestVisit(node));
    writer.write(ByteCode.Store, node.id!.name);
  }

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

  return writer.getData();
}

function findFunctionDeclarationsAndVars(
  parent: estree.BlockStatement | estree.Program
): {
  vars: estree.VariableDeclaration[];
  functions: estree.FunctionDeclaration[];
} {
  const vars: estree.VariableDeclaration[] = [];
  const functions: estree.FunctionDeclaration[] = [];

  walk.recursive(parent, null, {
    FunctionDeclaration(node, state, c) {
      functions.push(node);
    },
    VariableDeclaration(node, state, c) {
      if (node.kind === "var") vars.push(node);
    }
  });

  return { vars, functions };
}
