import { testCodeResult } from "./util";

testCodeResult(
  "Basic While",
  `
  let x = 0
  while (x < 10) x += 3
  x
  `
);

testCodeResult(
  "While with break",
  `
  let x = 0
  while (x < 10) {
    if (x > 5) break
    x += 3
  }
  x
  `
);

testCodeResult(
  "Labeled While with break",
  `
  let x = 0
  x: while (x < 10) {
    if (x > 5) break x;
    x += 3
  }
  x
  `
);

testCodeResult(
  "While with continue",
  `
  let x = 0
  while (x < 10) {
    x += 3
    if (x > 5) continue;
    x *= 2;
  }
  x
  `
);

testCodeResult(
  "Labeled While with continue",
  `
  let x = 0
  x: while (x < 10) {
    x += 3
    if (x > 5) continue x;
    x *= 2;
  }
  x
  `
);
