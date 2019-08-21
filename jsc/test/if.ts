import { testCodeResult } from "./util";

testCodeResult(
  "Basic if",
  `
  let x = 0;
  if (1 <= 2) {
    x += 1;
  }

  if (1 > 2) {
    x *= 5;
  } else {
    x *= 3;
  }

  if (1 > 2) x *= 2;

  x
  `
);
