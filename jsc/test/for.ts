import { testCodeResult } from "./util";

testCodeResult(
  "For Loop",
  `
  let x = 1;
  for (let i = 1; i < 5; i += 1) {
    x *= i
  }
  x
`
);

testCodeResult(
  "Nested For Loop",
  `
  let x = 1;
  for (let i = 1; i < 5; i += 1) {
    for (let j = 0; j < 10; j += 2) {
      x += i * j
    }
  }
  x
`
);

testCodeResult(
  "Nested For Loop With a Break",
  `
  let x = 1;
  for (let i = 1; i < 5; i += 1) {
    for (let j = 0; j < 10; j += 2) {
      x += i * j
      if (j > 5) break;
    }
  }
  x
`
);

testCodeResult(
  "Nested Labeled For Loop With a Break",
  `
  let x = 1;
  main: for (let i = 1; i < 5; i += 1) {
    for (let j = 0; j < 10; j += 2) {
      x += i * j
      if (j > 5) break main;
    }
  }
  x
`
);

testCodeResult(
  "Nested Labeled For Loop With a Break (2)",
  `
  let x = 1;
  main: for (let i = 1; i < 5; i += 1) {
    l2: for (let j = 0; j < 10; j += 2) {
      x += i * j
      if (i > 2) break main;
      if (j > 5) break l2;
    }
  }
  x
`
);

testCodeResult(
  "Nested Labeled For Loop With Continue",
  `
  let x = 1;
  main: for (let i = 1; i < 5; i += 1) {
    l2: for (let j = 0; j < 10; j += 2) {
      if (j > 4) continue;
      x += i * j
    }
  }
  x
`
);

testCodeResult(
  "Nested Labeled For Loop With Continue (2)",
  `
  let x = 1;
  main: for (let i = 1; i < 5; i += 1) {
    l2: for (let j = 0; j < 10; j += 2) {
      if (j > 4) continue main;
      x += i * j
    }
  }
  x
`
);
