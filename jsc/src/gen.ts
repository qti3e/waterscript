import * as estree from "estree";
import { GenContext, ByteCode, Jump } from "./context";

export function gen(program: estree.Program): number[] {
  if (program.type !== "Program") throw new Error("Invalid input node to gen");

  const context = new GenContext();

  for (const node of program.body) {
    visit(context, node);
  }

  // TODO(qti3e) Ret
  context.write(ByteCode.TODO);

  return context.getBytecodes();
}

function visit(context: GenContext, node: estree.Node): void {
  let jmp1: Jump;
  let jmp2: Jump;

  switch (node.type) {
    case "ExpressionStatement":
      visit(context, node.expression);
      break;

    case "ThisExpression":
      context.write(ByteCode.LdThis);
      break;

    case "BinaryExpression":
      visit(context, node.left);
      visit(context, node.right);
      binaryOperator(context, node.operator);
      break;

    case "LogicalExpression":
      visit(context, node.left);
      jmp1 = context.jmp(
        node.operator == "||" ? ByteCode.JmpTruePeek : ByteCode.JmpFalsePeek
      );
      context.write(ByteCode.Pop);
      visit(context, node.right);
      jmp1.here();
      break;

    case "Literal":
      switch (node.value) {
        case true:
          context.write(ByteCode.LdTrue);
          break;
        case false:
          context.write(ByteCode.LdFalse);
          break;
        case null:
          context.write(ByteCode.LdNull);
          break;
        case NaN:
          context.write(ByteCode.LdNaN);
          break;
        case 1:
          context.write(ByteCode.LdOne);
          break;
        case 0:
          context.write(ByteCode.LdZero);
          break;
        default:
          // TODO(qti3e)
          context.write(ByteCode.TODO);
      }
      break;

    default:
      // TODO(qti3e)
      context.write(ByteCode.TODO);
      console.log("TODO: " + node.type);
      break;
  }
}

function binaryOperator(
  context: GenContext,
  operator: estree.BinaryOperator
): void {
  switch (operator) {
    case "==":
      context.write(ByteCode.EQ);
      break;
    case "!=":
      context.write(ByteCode.IEQ);
      break;
    case "===":
      context.write(ByteCode.EQS);
      break;
    case "!==":
      context.write(ByteCode.IEQS);
      break;
    case "<":
      context.write(ByteCode.LT);
      break;
    case "<=":
      context.write(ByteCode.LTE);
      break;
    case ">":
      context.write(ByteCode.GT);
      break;
    case ">=":
      context.write(ByteCode.GTE);
      break;
    case "<<":
      context.write(ByteCode.BLS);
      break;
    case ">>":
      context.write(ByteCode.BRS);
      break;
    case ">>>":
      context.write(ByteCode.BURS);
      break;
    case "+":
      context.write(ByteCode.Add);
      break;
    case "-":
      context.write(ByteCode.Sub);
      break;
    case "*":
      context.write(ByteCode.Mul);
      break;
    case "/":
      context.write(ByteCode.Div);
      break;
    case "%":
      context.write(ByteCode.Mod);
      break;
    case "**":
      context.write(ByteCode.Pow);
      break;
    case "|":
      context.write(ByteCode.BitOr);
      break;
    case "^":
      context.write(ByteCode.BitXor);
      break;
    case "&":
      context.write(ByteCode.BitAnd);
      break;
    case "instanceof":
      context.write(ByteCode.InstanceOf);
      break;
    case "in":
      context.write(ByteCode.In);
      break;
  }
}
