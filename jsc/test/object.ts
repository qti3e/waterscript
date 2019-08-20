import { testCodeResult } from "./util";

testCodeResult("Empty Object", `({})`);

testCodeResult(
  "Object Properties",
  `
  ({
    a: 5,
    b: 3
  })
  `
);
