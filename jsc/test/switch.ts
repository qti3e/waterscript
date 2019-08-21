import { testCodeResult } from "./util";

testCodeResult(
  "Switch Basic",
  `
  let x = 1;
  let count = 0;

  let incr = () => {
    count += 1;
  }

  switch (3 + 2) {
    case (incr(), 1): x *= 2; break;
    case (incr(), 2): x *= 3; break;
    case (incr(), 3): x *= 5; break;
    case (incr(), 4): x *= 7; break;
    case (incr(), 5): x *= 11; break;
    case (incr(), 6): x *= 13; break;
    case (incr(), 7): x *= 17; break;
    case (incr(), 8): x *= 19; break;
    case (incr(), 9): x *= 23; break;
    case (incr(), 10): x *= 29; break;
  }

  ({ x, count });
  `
);

testCodeResult(
  "Switch Fallthrough",
  `
  let x = 1;
  let count = 0;

  let incr = () => {
    count += 1;
  }

  switch (3 + 2) {
    case (incr(), 1): x *= 2;
    case (incr(), 2): x *= 3;
    case (incr(), 3): x *= 5;
    case (incr(), 4): x *= 7;
    case (incr(), 5): x *= 11;
    case (incr(), 6): x *= 13;
    case (incr(), 7): x *= 17;
    case (incr(), 8): x *= 19; break;
    case (incr(), 9): x *= 23;
    case (incr(), 10): x *= 29;
  }

  ({ count, x });
  `
);

testCodeResult(
  "Switch Continue Loop",
  `
  let x = 1;
  let count = 0;

  let incr = () => {
    count += 1;
  }

  for (let i = 1; i <= 10; i += 1) {
    switch (i) {
      case (incr(), 5): continue;
      case (incr(), 2): x *= 3; continue;
    }

    x *= 2;
  }

  ({ count, x })
  `
);

testCodeResult(
  "Switch Complex",
  `
  let ret = {};
  let str = "";
  let x = "";

  for (let i = -1; i < 4; i += 1) {
    str = "";
    x = "";

    switch (i) {
      case (x += "0", 0):
        str += "a";

      case (x += "1", 1):
        str += "b";

      default:
        str += "c";

      case (x += "2", 1):
        str += "d";

      case (x += "3", 2):
        str += "e";
    }

    ret[i] = {str, x};
  }

  ret
  `
);

testCodeResult(
  "Switch Default as Last Statement",
  `
  let x = 1;

  switch (0) {
    case 1: x *= 3;
    default: x *= 2;
  }

  x
  `
);

testCodeResult(
  "Switch Default as Last Statement 2",
  `
  let x = 1;

  switch (1) {
    case 1: x *= 3;
    default: x *= 2;
  }

  x
  `
);

testCodeResult(
  "Switch Simple Default",
  `
  let x = {
    '0': 1,
    '1': 1
  };

  let count = 0;

  let incr = () => {
    count += 1
  }

  for (let i = 0; i < 3; i += 1) {
    switch (i) {
      default: x[i] *= 2
      case (incr(), 1): x[i] *= 3
    }
  }

  ({ x, count })
  `
);

testCodeResult(
  "Switch - Default",
  `
  let ret = {};
  let x = 1;
  let count = 0;

  let incr = () => {
    count += 1;
  }

  for (let i = 0; i <= 6; i += 1) {
    switch (i) {
      case (incr(), 1): x *= 2;
      case (incr(), 2): x *= 3;
      default: x *= 5;
      case (incr(), 3): x *= 7;
      case (incr(), 4): x *= 9;
      case 0:
      case (incr(), 5): x *= 13; break;
      case (incr(), 6): x *= 11;
    }

    let e = {
      x,
      count
    };

    ret[i] = e;
  }

  ret
  `
);

testCodeResult(
  "Switch All",
  `
  let ret = {}
  for (let i = -1; i < 10; i += 1) {
    let t = "";
    let r = "";
    switch (i) {
      case (t += "0", 0): r += "a"; if (i === 4) break; r += "f";
      case (t += "1", 1): r += "b"; if (i === 5) break; r += "g";
      default: r += "c"; if (i === 6) break; r += "h";
      case (t += "2", 1): r += "d"; if (i === 7) break; r += "i";
      case (t += "3", 2): r += "e"; if (i === 8) break; r += "j";
    }
    ret[i] = {t, r}
  }
  ret
  `
);
