import { testCodeResult } from "./util";

testCodeResult("Empty Object", `({})`);

testCodeResult(
  "Object Base",
  `
  ({
    a: 5,
    b: 3,
    '0': 4
  })
  `
);

testCodeResult(
  "Object Set",
  `
  let x = ({
    a: 5,
    b: 3,
    '0': 4
  })

  x['a'] = 9

  x
  `
);
