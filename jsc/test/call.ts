import { testCodeResult } from "./util";

testCodeResult(
  "Call 0",
  `
  let i = 1;

  let x = () => {
    i *= 2;
    return i;
  }

  for (let j = 0; j < 5; j += 1) {
    let r = x();
    if (r > i || r < i) {
      i = 0;
    }
  }

  i
  `
);
