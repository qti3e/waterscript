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
    case "EmptyStatement": {
      break;
    }

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
            writer.codeSection.setInt32(number);
          } else {
            writer.write(ByteCode.LdUint32);
            writer.codeSection.setUint32(number);
          }
        } else {
          if (number === Math.fround(number)) {
            // 32 bit.
            writer.write(ByteCode.LdFloat32);
            writer.codeSection.setFloat32(number);
          } else {
            // 64 bit.
            writer.write(ByteCode.LdFloat64);
            writer.codeSection.setFloat64(number);
          }
        }

        break;
      }

      if (node.value instanceof RegExp) {
        writer.write(ByteCode.RegExp, node.value.source);
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

    case "FunctionExpression": {
      const index = writer.compiler.requestVisit(node);
      writer.write(ByteCode.LdFunction);
      writer.codeSection.setUint16(index);
      // TODO(qti3e) Function name.
      break;
    }

    case "ArrowFunctionExpression": {
      const index = writer.compiler.requestVisit(node);
      writer.write(ByteCode.LdFunction);
      writer.codeSection.setUint16(index);
      // TODO(qti3e) Arrow function names in cases like:
      // let add5 = p => p + 5;
      // add5.name === "add5";
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
      const label = writer.labels.create();
      const pos = writer.getPosition();
      label.test();
      visit(writer, node.test);
      const jmp = writer.jmp(ByteCode.JmpFalsePop);
      visit(writer, node.body);
      writer.jmpTo(ByteCode.Jmp, pos);
      jmp.next();
      label.end();
      break;
    }

    case "ForStatement": {
      const label = writer.labels.create();
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

      label.test();
      if (node.update) visit(writer, node.update);
      writer.jmpTo(ByteCode.Jmp, testPos);
      jmp.next();

      writer.write(ByteCode.BlockOut);
      label.end();
      break;
    }

    case "DoWhileStatement": {
      const label = writer.labels.create();
      const bodyPos = writer.getPosition();
      visit(writer, node.body);
      label.test();
      visit(writer, node.test);
      writer.jmpTo(ByteCode.JmpTruePop, bodyPos);
      label.end();
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

    case "LabeledStatement": {
      writer.labels.setName(node.label.name);
      visit(writer, node.body);
      break;
    }

    case "BreakStatement": {
      const labelInfo = writer.labels.getLabelInfo(
        node.label ? node.label.name : undefined
      );
      labelInfo.jumpToEnd();
      break;
    }

    case "ContinueStatement": {
      const labelInfo = writer.labels.getLabelInfo(
        node.label ? node.label.name : undefined
      );
      labelInfo.jumpToTest();
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
        writer.write(ByteCode.NewArg);

        for (const arg of node.arguments) {
          if (arg.type === "SpreadElement") {
            throw new Error("Spread argument is not implemented yet.");
          } else {
            visit(writer, arg);
            writer.write(ByteCode.PushArg);
          }
        }

        writer.write(
          node.type === "CallExpression" ? ByteCode.Call : ByteCode.New
        );
      }

      break;
    }

    case "ReturnStatement": {
      if (node.argument) {
        visit(writer, node.argument);
      } else {
        writer.write(ByteCode.LdUndef);
      }
      writer.write(ByteCode.Ret);
      break;
    }

    case "ArrayExpression": {
      writer.write(ByteCode.LdArr);

      for (const element of node.elements) {
        if (element.type === "SpreadElement") {
          throw new Error("Spread array element is not implemented yet.");
        } else {
          visit(writer, element);
          writer.write(ByteCode.ArPush);
        }
      }

      break;
    }

    case "ObjectExpression": {
      writer.write(ByteCode.LdObj);
      for (const property of node.properties) {
        if (property.type === ("SpreadElement" as any))
          throw new Error("Spread obj element is not implemented yet.");

        if (property.kind !== "init")
          throw new Error("Getter/Setter is not supported yet.");

        // TODO(qti3e) ComputedRef and PropRef pop the object from the ds and
        // they're not suited to be used here.
        if (property.computed) {
          visit(writer, property.key);
          writer.write(ByteCode.ComputedRef);
        } else {
          writer.write(
            ByteCode.PropRef,
            (property.key as estree.Identifier).name
          );
        }

        visit(writer, property.value);
        writer.write(ByteCode.Asgn);
      }
      break;
    }

    case "SequenceExpression": {
      const length = node.expressions.length;
      const last = length - 1;
      for (let i = 0; i < length; ++i) {
        visit(writer, node.expressions[i]);
        if (i !== last) writer.write(ByteCode.Pop);
      }
      break;
    }

    case "SwitchStatement": {
      const label = writer.labels.createSwitch();
      const length = node.cases.length;
      const last = length - 1;

      if (length === 0) {
        visit(writer, node.discriminant);
        writer.write(ByteCode.Pop);
        break;
      }

      visit(writer, node.discriminant);

      let lastJump: Jump | undefined;
      let i = 0;

      for (; i < length; ++i) {
        const item = node.cases[i];
        let jmp: Jump | undefined;

        if (item.test) {
          writer.write(ByteCode.Dup);
          visit(writer, item.test);
          writer.write(ByteCode.EQS);
          jmp = writer.jmp(ByteCode.JmpFalsePop);
        } else {
          break;
        }

        if (lastJump) lastJump.next();

        for (const stmt of item.consequent) {
          visit(writer, stmt);
        }

        if (i !== last) lastJump = writer.jmp(ByteCode.Jmp);

        if (jmp) jmp.next();
      }

      if (i === length) {
        label.end();
        writer.write(ByteCode.Pop);
        break;
      }

      const jumps: Record<number, Jump> = {};

      const defaultIndex = i++;

      // Find a match
      for (; i < length; ++i) {
        writer.write(ByteCode.Dup);
        visit(writer, node.cases[i].test!);
        writer.write(ByteCode.EQS);
        jumps[i] = writer.jmp(ByteCode.JmpTruePop);
      }

      if (lastJump) {
        const jmp = writer.jmp(ByteCode.Jmp);
        lastJump.next();
        jmp.next();
      }

      const defaultCons = node.cases[defaultIndex].consequent;
      for (const stmt of defaultCons) {
        visit(writer, stmt);
      }

      for (i = defaultIndex + 1; i < length; ++i) {
        const item = node.cases[i];
        jumps[i].next();

        for (const stmt of item.consequent) {
          visit(writer, stmt);
        }
      }

      label.end();
      writer.write(ByteCode.Pop);
      break;
    }

    default:
      // TODO(qti3e)
      writer.write(ByteCode.TODO);
      console.log("TODO: " + node.type);
      break;
  }
}
