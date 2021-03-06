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

export function visit(writer: Writer, node: estree.Node, pop = false): void {
  main: switch (node.type) {
    case "EmptyStatement": {
      break;
    }

    case "ExpressionStatement": {
      visit(writer, node.expression);
      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "ThisExpression": {
      writer.write(node, ByteCode.LdThis);
      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "BinaryExpression": {
      visit(writer, node.left);
      visit(writer, node.right);

      switch (node.operator) {
        case "==":
          writer.write(node, ByteCode.EQ);
          break;
        case "!=":
          writer.write(node, ByteCode.IEQ);
          break;
        case "===":
          writer.write(node, ByteCode.EQS);
          break;
        case "!==":
          writer.write(node, ByteCode.IEQS);
          break;
        case "<":
          writer.write(node, ByteCode.LT);
          break;
        case "<=":
          writer.write(node, ByteCode.LTE);
          break;
        case ">":
          writer.write(node, ByteCode.GT);
          break;
        case ">=":
          writer.write(node, ByteCode.GTE);
          break;
        case "<<":
          writer.write(node, ByteCode.BLS);
          break;
        case ">>":
          writer.write(node, ByteCode.BRS);
          break;
        case ">>>":
          writer.write(node, ByteCode.BURS);
          break;
        case "+":
          writer.write(node, ByteCode.Add);
          break;
        case "-":
          writer.write(node, ByteCode.Sub);
          break;
        case "*":
          writer.write(node, ByteCode.Mul);
          break;
        case "/":
          writer.write(node, ByteCode.Div);
          break;
        case "%":
          writer.write(node, ByteCode.Mod);
          break;
        case "**":
          writer.write(node, ByteCode.Pow);
          break;
        case "|":
          writer.write(node, ByteCode.BitOr);
          break;
        case "^":
          writer.write(node, ByteCode.BitXor);
          break;
        case "&":
          writer.write(node, ByteCode.BitAnd);
          break;
        case "instanceof":
          writer.write(node, ByteCode.InstanceOf);
          break;
        case "in":
          writer.write(node, ByteCode.In);
          break;
      }

      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "LogicalExpression": {
      visit(writer, node.left);
      const jmp = writer.jmp(
        node,
        node.operator == "||" ? ByteCode.JmpTruePeek : ByteCode.JmpFalsePeek
      );
      writer.write(node, ByteCode.Pop);
      visit(writer, node.right);
      jmp.next();
      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "UnaryExpression": {
      visit(writer, node.argument);

      switch (node.operator) {
        case "-":
          writer.write(node, ByteCode.Neg);
          break;
        case "!":
          writer.write(node, ByteCode.Not);
          break;
        case "+":
          writer.write(node, ByteCode.Pos);
          break;
        case "~":
          writer.write(node, ByteCode.BitNot);
          break;
        case "delete":
          writer.write(node, ByteCode.Del);
          break;
        case "typeof":
          writer.write(node, ByteCode.Type);
          break;
        case "void":
          writer.write(node, ByteCode.Void);
          break;
      }

      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "Literal": {
      // Why push a literal when we want to pop it right away?
      if (pop) break;

      switch (node.value) {
        case true:
          writer.write(node, ByteCode.LdTrue);
          break main;
        case false:
          writer.write(node, ByteCode.LdFalse);
          break main;
        case null:
          writer.write(node, ByteCode.LdNull);
          break main;
        case Infinity:
          writer.write(node, ByteCode.LdInfinity);
          break main;
        case 0:
          writer.write(node, ByteCode.LdZero);
          break main;
        case 1:
          writer.write(node, ByteCode.LdOne);
          break main;
        case 2:
          writer.write(node, ByteCode.LdTwo);
          break main;
      }

      if (typeof node.value === "string") {
        writer.write(node, ByteCode.LdStr, node.value);
        break;
      }

      if (typeof node.value === "number") {
        const number = node.value;
        const isInt32 = number === (number | 0);

        if (isInt32) {
          if (number < 0) {
            writer.write(node, ByteCode.LdInt32);
            writer.codeSection.setInt32(number);
          } else {
            writer.write(node, ByteCode.LdUint32);
            writer.codeSection.setUint32(number);
          }
        } else {
          if (number === Math.fround(number)) {
            // 32 bit.
            writer.write(node, ByteCode.LdFloat32);
            writer.codeSection.setFloat32(number);
          } else {
            // 64 bit.
            writer.write(node, ByteCode.LdFloat64);
            writer.codeSection.setFloat64(number);
          }
        }

        break;
      }

      if (node.value instanceof RegExp) {
        writer.write(node, ByteCode.RegExp, node.value.source);
        break;
      }

      throw new Error("Unexpected literal.");
    }

    case "Identifier": {
      writer.write(node, ByteCode.Named, node.name);
      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "FunctionDeclaration": {
      const index = writer.compiler.requestVisit(node);
      writer.scope.addFunction(node.id!.name, index);
      // No instruction is needed.
      break;
    }

    case "FunctionExpression": {
      const index = writer.compiler.requestVisit(node);
      writer.write(node, ByteCode.LdFunction);
      writer.codeSection.setUint16(index);
      if (pop) writer.write(node, ByteCode.Pop);
      // TODO(qti3e) Function name.
      break;
    }

    case "ArrowFunctionExpression": {
      const index = writer.compiler.requestVisit(node);
      writer.write(node, ByteCode.LdFunction);
      writer.codeSection.setUint16(index);
      if (pop) writer.write(node, ByteCode.Pop);
      // TODO(qti3e) Arrow function names in cases like:
      // let add5 = p => p + 5;
      // add5.name === "add5";
      break;
    }

    case "MemberExpression": {
      visit(writer, node.object);
      if (node.computed) {
        visit(writer, node.property);
        writer.write(node, ByteCode.Prop);
      } else {
        writer.write(
          node.property,
          ByteCode.NamedProp,
          (node.property as estree.Identifier).name
        );
      }
      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "AssignmentExpression": {
      if (node.left.type === "Identifier") {
        writer.write(node.left, ByteCode.NamedRef, node.left.name);
      } else if (node.left.type === "MemberExpression") {
        visit(writer, node.left.object);
        if (node.left.computed) {
          visit(writer, node.left.property);
          writer.write(node, ByteCode.ComputedRef);
        } else {
          writer.write(
            node.left,
            ByteCode.PropRef,
            (node.left.property as estree.Identifier).name
          );
        }
        writer.write(node, ByteCode.Swap);
        writer.write(node, ByteCode.Pop);
      } else {
        throw new Error("Unsupported assignment.");
      }

      if (node.operator !== "=") {
        writer.write(node, ByteCode.UnRefDup);
        visit(writer, node.right);

        switch (node.operator) {
          case "%=":
            writer.write(node, ByteCode.Mod);
            break;
          case "&=":
            writer.write(node, ByteCode.BitAnd);
            break;
          case "**=":
            writer.write(node, ByteCode.Pow);
            break;
          case "*=":
            writer.write(node, ByteCode.Mul);
            break;
          case "+=":
            writer.write(node, ByteCode.Add);
            break;
          case "-=":
            writer.write(node, ByteCode.Sub);
            break;
          case "/=":
            writer.write(node, ByteCode.Div);
            break;
          case "<<=":
            writer.write(node, ByteCode.BLS);
            break;
          case ">>=":
            writer.write(node, ByteCode.BRS);
            break;
          case ">>>=":
            writer.write(node, ByteCode.BURS);
            break;
          case "^=":
            writer.write(node, ByteCode.BitXor);
            break;
          case "|=":
            writer.write(node, ByteCode.BitOr);
            break;
        }
      } else {
        visit(writer, node.right);
      }

      writer.write(node, ByteCode.Asgn);

      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "UpdateExpression": {
      if (node.argument.type === "Identifier") {
        writer.write(node.argument, ByteCode.NamedRef, node.argument.name);
      } else if (node.argument.type === "MemberExpression") {
        visit(writer, node.argument.object);
        if (node.argument.computed) {
          visit(writer, node.argument.property);
          writer.write(node, ByteCode.ComputedRef);
        } else {
          writer.write(
            node.argument,
            ByteCode.PropRef,
            (node.argument.property as estree.Identifier).name
          );
        }
      } else {
        throw new Error("Unsupported update expression.");
      }

      if (node.prefix) {
        writer.write(
          node,
          node.operator === "++"
            ? ByteCode.PrefixUpdateAdd
            : ByteCode.PrefixUpdateSub
        );
      } else {
        writer.write(
          node,
          node.operator === "++"
            ? ByteCode.PostfixUpdateAdd
            : ByteCode.PostfixUpdateSub
        );
      }

      if (pop) writer.write(node, ByteCode.Pop);
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
        writer.write(node, ByteCode.LdUndef);
      }

      if (node.id.type === "Identifier") {
        if (writer.varKind === "var") {
          writer.scope.addVariable(node.id.name);
        }

        writer.write(
          node,
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
      const jmp1 = writer.jmp(node, ByteCode.JmpFalsePop);
      visit(writer, node.consequent, true);

      if (alternate) {
        jmp2 = writer.jmp(node.alternate!, ByteCode.Jmp);
      }

      jmp1.next();

      if (alternate) {
        visit(writer, node.alternate!, true);
        jmp2!.next();
      }

      break;
    }

    case "WhileStatement": {
      const label = writer.labels.create();
      const pos = writer.getPosition();
      label.test();
      visit(writer, node.test);
      const jmp = writer.jmp(node.test, ByteCode.JmpFalsePop);
      visit(writer, node.body, true);
      writer.jmpTo(node.body, ByteCode.Jmp, pos);
      jmp.next();
      label.end();
      break;
    }

    case "ForStatement": {
      const label = writer.labels.create();
      writer.write(node, ByteCode.BlockIn);

      if (node.init) visit(writer, node.init, true);

      const testPos = writer.getPosition();
      if (node.test) {
        visit(writer, node.test);
      } else {
        writer.write(node, ByteCode.LdTrue);
      }

      const jmp = writer.jmp(node, ByteCode.JmpFalsePop);

      visit(writer, node.body, true);

      label.test();
      if (node.update) visit(writer, node.update, true);
      writer.jmpTo(node, ByteCode.Jmp, testPos);
      jmp.next();

      writer.write(node, ByteCode.BlockOut);
      label.end();
      break;
    }

    case "DoWhileStatement": {
      const label = writer.labels.create();
      const bodyPos = writer.getPosition();
      visit(writer, node.body, true);
      label.test();
      visit(writer, node.test);
      writer.jmpTo(node, ByteCode.JmpTruePop, bodyPos);
      label.end();
      break;
    }

    case "ConditionalExpression": {
      visit(writer, node.test);
      const jmp = writer.jmp(node.test, ByteCode.JmpFalsePop);
      visit(writer, node.consequent);
      const jmp2 = writer.jmp(node.consequent, ByteCode.Jmp);
      jmp.next();
      visit(writer, node.alternate);
      jmp2.next();
      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "BlockStatement": {
      writer.write(node, ByteCode.BlockIn);
      for (const stmt of node.body) {
        visit(writer, stmt, true);
      }
      writer.write(node, ByteCode.BlockOut);
      break;
    }

    case "LabeledStatement": {
      writer.labels.setName(node.label.name);
      visit(writer, node.body, true);
      break;
    }

    case "BreakStatement": {
      const labelInfo = writer.labels.getLabelInfo(
        node.label ? node.label.name : undefined
      );
      labelInfo.jumpToEnd(node);
      break;
    }

    case "ContinueStatement": {
      const labelInfo = writer.labels.getLabelInfo(
        node.label ? node.label.name : undefined
      );
      labelInfo.jumpToTest(node);
      break;
    }

    case "NewExpression":
    case "CallExpression": {
      const argsCount = node.arguments.length;
      const noSpread = node.arguments.every(a => a.type !== "SpreadElement");

      visit(writer, node.callee);

      if (noSpread && argsCount < 4) {
        for (const arg of node.arguments) {
          visit(writer, arg);
        }
        writer.write(
          node,
          node.type === "CallExpression"
            ? argsCount === 3
              ? ByteCode.Call3
              : argsCount === 2
              ? ByteCode.Call2
              : argsCount === 1
              ? ByteCode.Call1
              : ByteCode.Call0
            : argsCount === 3
            ? ByteCode.New3
            : argsCount === 2
            ? ByteCode.New2
            : argsCount === 1
            ? ByteCode.New1
            : ByteCode.New0
        );
      } else {
        writer.write(node, ByteCode.NewArg);

        for (const arg of node.arguments) {
          if (arg.type === "SpreadElement") {
            throw new Error("Spread argument is not implemented yet.");
          } else {
            visit(writer, arg);
            writer.write(arg, ByteCode.PushArg);
          }
        }

        writer.write(
          node,
          node.type === "CallExpression" ? ByteCode.Call : ByteCode.New
        );
      }

      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "ReturnStatement": {
      if (node.argument) {
        visit(writer, node.argument);
      } else {
        writer.write(node, ByteCode.LdUndef);
      }
      writer.write(node, ByteCode.Ret);
      break;
    }

    case "ArrayExpression": {
      writer.write(node, ByteCode.LdArr);

      for (const element of node.elements) {
        if (element.type === "SpreadElement") {
          throw new Error("Spread array element is not implemented yet.");
        } else {
          visit(writer, element);
          writer.write(element, ByteCode.ArPush);
        }
      }

      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "ObjectExpression": {
      writer.write(node, ByteCode.LdObj);
      for (const property of node.properties) {
        if (property.type === ("SpreadElement" as any))
          throw new Error("Spread obj element is not implemented yet.");

        if (property.kind !== "init")
          throw new Error("Getter/Setter is not supported yet.");

        // TODO(qti3e) ComputedRef and PropRef pop the object from the ds and
        // they're not suited to be used here.

        if (property.computed || property.key.type !== "Identifier") {
          visit(writer, property.key);
          writer.write(property, ByteCode.ComputedRef);
        } else {
          writer.write(
            property,
            ByteCode.PropRef,
            (property.key as estree.Identifier).name
          );
        }

        visit(writer, property.value);
        writer.write(property, ByteCode.Asgn);
        writer.write(property, ByteCode.Pop);
      }
      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "SequenceExpression": {
      const length = node.expressions.length;
      const last = length - 1;
      for (let i = 0; i < length; ++i) {
        visit(writer, node.expressions[i]);
        if (i !== last) writer.write(node.expressions[i], ByteCode.Pop);
      }
      if (pop) writer.write(node, ByteCode.Pop);
      break;
    }

    case "SwitchStatement": {
      const label = writer.labels.createSwitch();
      const length = node.cases.length;
      const last = length - 1;

      if (length === 0) {
        visit(writer, node.discriminant);
        writer.write(node.discriminant, ByteCode.Pop);
        break;
      }

      visit(writer, node.discriminant);

      let lastJump: Jump | undefined;
      let i = 0;

      for (; i < length; ++i) {
        const item = node.cases[i];
        let jmp: Jump | undefined;

        if (item.test) {
          const pos = {
            start: (item as any).start,
            end: (item.test as any).end
          };
          writer.write(pos, ByteCode.Dup);
          visit(writer, item.test);
          writer.write(pos, ByteCode.EQS);
          jmp = writer.jmp(pos, ByteCode.JmpFalsePop);
        } else {
          break;
        }

        writer.write(node, ByteCode.Pop);

        if (lastJump) lastJump.next();

        for (const stmt of item.consequent) {
          visit(writer, stmt, true);
        }

        lastJump = writer.jmp(item, ByteCode.Jmp);

        if (jmp) jmp.next();
      }

      if (i === length) {
        writer.write(node, ByteCode.Pop);
        lastJump!.next();
        label.end();
        break;
      }

      const jumps: Record<number, Jump> = {};

      const defaultIndex = i++;

      // Find a match
      for (; i < length; ++i) {
        const item = node.cases[i];
        const pos = {
          start: (item as any).start,
          end: (item.test as any).end
        };

        writer.write(pos, ByteCode.Dup);
        visit(writer, item.test!);
        writer.write(pos, ByteCode.EQS);

        const jmp = writer.jmp(pos, ByteCode.JmpFalsePop);
        writer.write(node, ByteCode.Pop);
        jumps[i] = writer.jmp(pos, ByteCode.Jmp);
        jmp.next();
      }

      writer.write(node, ByteCode.Pop);

      if (lastJump) {
        const jmp = writer.jmp(node, ByteCode.Jmp);
        lastJump.next();
        jmp.next();
      }

      const defaultCons = node.cases[defaultIndex].consequent;
      for (const stmt of defaultCons) {
        visit(writer, stmt, true);
      }

      for (i = defaultIndex + 1; i < length; ++i) {
        const item = node.cases[i];
        jumps[i].next();

        for (const stmt of item.consequent) {
          visit(writer, stmt, true);
        }
      }

      label.end();
      break;
    }

    default:
      // TODO(qti3e)
      writer.write(node, ByteCode.TODO);
      console.error("TODO: " + node.type);
      break;
  }
}
