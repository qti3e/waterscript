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
      for (const name of extractNames(d.id)) {
        writer.write(ByteCode.Var, name);
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

function extractNames(pattern: estree.Pattern): string[] {
  if (pattern.type === "Identifier") return [pattern.name];

  const ret: string[] = [];

  walk.recursive(pattern, null, {
    Identifier(node, state, c) {
      ret.push(node.name);
    },
    ArrayPattern(node, state, c) {
      for (const element of node.elements) {
        c(element, state);
      }
    },
    AssignmentPattern(node, state, c) {
      c(node.left, state);
    },
    MemberExpression(node, state, c) {
      throw new Error("Invalid MemberExpression!");
    },
    ObjectPattern(node, state, c) {
      for (const property of node.properties) {
        c(property, state);
      }
    },
    RestElement(node, state, c) {
      c(node.argument, state);
    }
  });

  return ret;
}
