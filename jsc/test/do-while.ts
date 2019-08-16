import { testCodeResult } from "./util";

testCodeResult(
  "Basic do-while",
  `
  let x = 1
  do {
    x *= 2
  } while (x < 50);
  x
  `
);

testCodeResult(
  "Do-while with break",
  `
  let x = 1
  do {
    x *= 2
    if (x > 30) break;
  } while (true);
  x
  `
);

testCodeResult(
  "Do-while with continue",
  `
  let x = 1
  do {
    x *= 2
    if (x > 30) continue;
    x *= 5;
  } while (x < 50);
  x
  `
);
