import * as estree from "estree";
import { ByteCode } from "./bytecode";
import { Writer, Jump, CompiledData } from "./writer";

export function visit(writer: Writer, node: estree.Node): void {
  let jmp1: Jump;

  switch (node.type) {
    case "ExpressionStatement":
      visit(writer, node.expression);
      break;

    case "ThisExpression":
      writer.write(ByteCode.LdThis);
      break;

    case "BinaryExpression":
      visit(writer, node.left);
      visit(writer, node.right);
      binaryOperator(writer, node.operator);
      break;

    case "LogicalExpression":
      visit(writer, node.left);
      jmp1 = writer.jmp(
        node.operator == "||" ? ByteCode.JmpTruePeek : ByteCode.JmpFalsePeek
      );
      writer.write(ByteCode.Pop);
      visit(writer, node.right);
      jmp1.here();
      break;

    case "Literal":
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
        case NaN:
          writer.write(ByteCode.LdNaN);
          break;
        case 1:
          writer.write(ByteCode.LdOne);
          break;
        case 0:
          writer.write(ByteCode.LdZero);
          break;
        default:
          if (typeof node.value === "string") {
            writer.write(ByteCode.LdStr, node.value);
            break;
          }
          writer.write(ByteCode.TODO);
      }
      break;

    case "Identifier":
      writer.write(ByteCode.Named, node.name);
      break;

    case "FunctionDeclaration":
      // Function Declaration is already seen due to how hoisting
      // is implemented.
      break;

    default:
      // TODO(qti3e)
      writer.write(ByteCode.TODO);
      console.log("TODO: " + node.type);
      break;
  }
}

function binaryOperator(writer: Writer, operator: estree.BinaryOperator): void {
  switch (operator) {
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
}
