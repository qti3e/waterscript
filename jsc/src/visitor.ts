/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import * as estree from "estree";
import { ByteCode } from "./bytecode";
import { Writer, Jump } from "./writer";

export function visit(writer: Writer, node: estree.Node): void {
  main: switch (node.type) {
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
      const jmp = writer.jmp(
        node.operator == "||" ? ByteCode.JmpTruePeek : ByteCode.JmpFalsePeek
      );
      writer.write(ByteCode.Pop);
      visit(writer, node.right);
      jmp.next();
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
          writer.write(ByteCode.Del);
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
          break main;
        case false:
          writer.write(ByteCode.LdFalse);
          break main;
        case null:
          writer.write(ByteCode.LdNull);
          break main;
        case Infinity:
          writer.write(ByteCode.LdInfinity);
          break main;
        case 0:
          writer.write(ByteCode.LdZero);
          break main;
        case 1:
          writer.write(ByteCode.LdOne);
          break main;
        case 2:
          writer.write(ByteCode.LdTwo);
          break main;
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

    case "MemberExpression": {
      visit(writer, node.object);
      if (node.computed) {
        visit(writer, node.property);
        writer.write(ByteCode.Prop);
      } else {
        writer.write(
          ByteCode.NamedProp,
          (node.property as estree.Identifier).name
        );
      }
      break;
    }

    case "AssignmentExpression": {
      if (node.left.type === "Identifier") {
        writer.write(ByteCode.NamedRef, node.left.name);
      } else if (node.left.type === "MemberExpression") {
        visit(writer, node.left.object);
        if (node.left.computed) {
          visit(writer, node.left.property);
          writer.write(ByteCode.ComputedRef);
        } else {
          writer.write(
            ByteCode.PropRef,
            (node.left.property as estree.Identifier).name
          );
        }
      } else {
        throw new Error("Unsupported assignment.");
      }

      if (node.operator !== "=") {
        writer.write(ByteCode.UnRefDup);
        visit(writer, node.right);

        switch (node.operator) {
          case "%=":
            writer.write(ByteCode.Mod);
            break;
          case "&=":
            writer.write(ByteCode.BitAnd);
            break;
          case "**=":
            writer.write(ByteCode.Pow);
            break;
          case "*=":
            writer.write(ByteCode.Mul);
            break;
          case "+=":
            writer.write(ByteCode.Add);
            break;
          case "-=":
            writer.write(ByteCode.Sub);
            break;
          case "/=":
            writer.write(ByteCode.Div);
            break;
          case "<<=":
            writer.write(ByteCode.BLS);
            break;
          case ">>=":
            writer.write(ByteCode.BRS);
            break;
          case ">>>=":
            writer.write(ByteCode.BURS);
            break;
          case "^=":
            writer.write(ByteCode.BitXor);
            break;
          case "|=":
            writer.write(ByteCode.BitOr);
            break;
        }
      } else {
        visit(writer, node.right);
      }

      writer.write(ByteCode.Asgn);
      break;
    }

    case "UpdateExpression": {
      if (node.argument.type === "Identifier") {
        writer.write(ByteCode.NamedRef, node.argument.name);
      } else if (node.argument.type === "MemberExpression") {
        visit(writer, node.argument.object);
        if (node.argument.computed) {
          visit(writer, node.argument.property);
          writer.write(ByteCode.ComputedRef);
        } else {
          writer.write(
            ByteCode.PropRef,
            (node.argument.property as estree.Identifier).name
          );
        }
      } else {
        throw new Error("Unsupported update expression.");
      }

      if (node.prefix) {
        writer.write(
          node.operator === "++"
            ? ByteCode.PrefixUpdateAdd
            : ByteCode.PrefixUpdateSub
        );
      } else {
        writer.write(
          node.operator === "++"
            ? ByteCode.PostfixUpdateAdd
            : ByteCode.PostfixUpdateSub
        );
      }

      break;
    }

    case "VariableDeclaration": {
      writer.varKind = node.kind;
      for (const declaration of node.declarations) {
        visit(writer, declaration);
      }
      break;
    }

    case "VariableDeclarator": {
      if (node.init) {
        visit(writer, node.init);
      } else {
        writer.write(ByteCode.LdUndef);
      }

      if (node.id.type === "Identifier") {
        if (writer.varKind === "var") {
          writer.scope.addVariable(node.id.name);
        }

        writer.write(
          writer.varKind === "const"
            ? ByteCode.Const
            : writer.varKind === "let"
            ? ByteCode.Let
            : ByteCode.Store,
          node.id.name
        );
      } else {
        throw new Error(
          "Advanced variable declarations are not implemented yet."
        );
      }

      break;
    }

    case "IfStatement": {
      const alternate = !!node.alternate;
      let jmp2: Jump;

      visit(writer, node.test);
      const jmp1 = writer.jmp(ByteCode.JmpFalsePop);
      visit(writer, node.consequent);

      if (alternate) {
        jmp2 = writer.jmp(ByteCode.Jmp);
      }

      jmp1.next();

      if (alternate) {
        visit(writer, node.alternate!);
        jmp2!.next();
      }

      break;
    }

    case "WhileStatement": {
      const pos = writer.getPosition();
      visit(writer, node.test);
      const jmp = writer.jmp(ByteCode.JmpFalsePop);
      visit(writer, node.body);
      writer.jmpTo(ByteCode.Jmp, pos);
      jmp.next();
      break;
    }

    case "ForStatement": {
      writer.write(ByteCode.BlockIn);

      if (node.init) visit(writer, node.init);

      const testPos = writer.getPosition();
      if (node.test) {
        visit(writer, node.test);
      } else {
        writer.write(ByteCode.LdTrue);
      }

      const jmp = writer.jmp(ByteCode.JmpFalsePop);

      visit(writer, node.body);

      if (node.update) visit(writer, node.update);
      writer.jmpTo(ByteCode.Jmp, testPos);
      jmp.next();

      writer.write(ByteCode.BlockOut);
      break;
    }

    case "DoWhileStatement": {
      const bodyPos = writer.getPosition();
      visit(writer, node.body);
      visit(writer, node.test);
      writer.jmpTo(ByteCode.JmpTruePop, bodyPos);
      break;
    }

    case "ConditionalExpression": {
      visit(writer, node.test);
      const jmp = writer.jmp(ByteCode.JmpFalsePop);
      visit(writer, node.consequent);
      const jmp2 = writer.jmp(ByteCode.Jmp);
      jmp.next();
      visit(writer, node.alternate);
      jmp2.next();
      break;
    }

    case "BlockStatement": {
      writer.write(ByteCode.BlockIn);
      for (const stmt of node.body) {
        visit(writer, stmt);
      }
      writer.write(ByteCode.BlockOut);
      break;
    }

    case "EmptyStatement": {
      break;
    }

    default:
      // TODO(qti3e)
      writer.write(ByteCode.TODO);
      console.log("TODO: " + node.type);
      break;
  }
}
