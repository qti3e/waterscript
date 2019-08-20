import { testCodeResult } from "./util";

testCodeResult("Basic Let", "let x = 1; x");
testCodeResult("Let without initializer", "let x; x");
// testCodeResult("Assign to Let", "let x, y; y = (x = 5) + 1; x * y");
