/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import * as estree from "estree";
import { ByteCode } from "./bytecode";
import { Writer, Jump, CompiledData } from "./writer";

export function visit(writer: Writer, node: estree.Node): void {
  let jmp1: Jump;

  switch (node.type) {
    case "ExpressionStatement": {
      visit(writer, node.expression);
      break;
    }

    case "ThisExpression": {
      writer.write(ByteCode.LdThis);
      break;
    }

    case "BinaryExpression": {
      visit(writer, node.left);
      visit(writer, node.right);

      switch (node.operator) {
        case "==":
          writer.write(ByteCode.EQ);
          break;
        case "!=":
          writer.write(ByteCode.IEQ);
          break;
        case "===":
          writer.write(ByteCode.EQS);
          break;
        case "!==":
          writer.write(ByteCode.IEQS);
          break;
        case "<":
          writer.write(ByteCode.LT);
          break;
        case "<=":
          writer.write(ByteCode.LTE);
          break;
        case ">":
          writer.write(ByteCode.GT);
          break;
        case ">=":
          writer.write(ByteCode.GTE);
          break;
        case "<<":
          writer.write(ByteCode.BLS);
          break;
        case ">>":
          writer.write(ByteCode.BRS);
          break;
        case ">>>":
          writer.write(ByteCode.BURS);
          break;
        case "+":
          writer.write(ByteCode.Add);
          break;
        case "-":
          writer.write(ByteCode.Sub);
          break;
        case "*":
          writer.write(ByteCode.Mul);
          break;
        case "/":
          writer.write(ByteCode.Div);
          break;
        case "%":
          writer.write(ByteCode.Mod);
          break;
        case "**":
          writer.write(ByteCode.Pow);
          break;
        case "|":
          writer.write(ByteCode.BitOr);
          break;
        case "^":
          writer.write(ByteCode.BitXor);
          break;
        case "&":
          writer.write(ByteCode.BitAnd);
          break;
        case "instanceof":
          writer.write(ByteCode.InstanceOf);
          break;
        case "in":
          writer.write(ByteCode.In);
          break;
      }
      break;
    }

    case "LogicalExpression": {
      visit(writer, node.left);
      jmp1 = writer.jmp(
        node.operator == "||" ? ByteCode.JmpTruePeek : ByteCode.JmpFalsePeek
      );
      writer.write(ByteCode.Pop);
      visit(writer, node.right);
      jmp1.here();
      break;
    }

    case "UnaryExpression": {
      visit(writer, node.argument);

      switch (node.operator) {
        case "-":
          writer.write(ByteCode.Neg);
          break;
        case "!":
          writer.write(ByteCode.Not);
          break;
        case "+":
          writer.write(ByteCode.Pos);
          break;
        case "~":
          writer.write(ByteCode.BitNot);
          break;
        case "delete":
          // TODO(qti3e);
          writer.write(ByteCode.TODO);
          break;
        case "typeof":
          writer.write(ByteCode.Type);
          break;
        case "void":
          writer.write(ByteCode.Void);
          break;
      }
      break;
    }

    case "Literal": {
      switch (node.value) {
        case true:
          writer.write(ByteCode.LdTrue);
          break;
        case false:
          writer.write(ByteCode.LdFalse);
          break;
        case null:
          writer.write(ByteCode.LdNull);
          break;
        case Infinity:
          writer.write(ByteCode.LdInfinity);
          break;
        case 0:
          writer.write(ByteCode.LdZero);
          break;
        case 1:
          writer.write(ByteCode.LdOne);
          break;
        case 2:
          writer.write(ByteCode.LdTwo);
          break;
      }

      if (typeof node.value === "string") {
        writer.write(ByteCode.LdStr, node.value);
        break;
      }

      if (typeof node.value === "number") {
        const number = node.value;
        const isInt32 = number === (number | 0);

        if (isInt32) {
          if (number < 0) {
            writer.write(ByteCode.LdInt32);
            writer.codeSection.writeInt32(number);
          } else {
            writer.write(ByteCode.LdUint32);
            writer.codeSection.writeUint32(number);
          }
        } else {
          if (number === Math.fround(number)) {
            // 32 bit.
            writer.write(ByteCode.LdFloat32);
            writer.codeSection.writeFloat32(number);
          } else {
            // 64 bit.
            writer.write(ByteCode.LdFloat64);
            writer.codeSection.writeFloat64(number);
          }
        }

        break;
      }

      throw new Error("Unexpected literal.");
    }

    case "Identifier": {
      writer.write(ByteCode.Named, node.name);
      break;
    }

    case "FunctionDeclaration": {
      const index = writer.compiler.requestVisit(node);
      writer.scope.addFunction(node.id!.name, index);
      // No instruction is needed.
      break;
    }

    default:
      // TODO(qti3e)
      writer.write(ByteCode.TODO);
      console.log("TODO: " + node.type);
      break;
  }
}
