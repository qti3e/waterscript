import { testCodeResult } from "./util";

// Numbers
testCodeResult("Zero", "0");
testCodeResult("One", "1");
testCodeResult("Two", "2");
testCodeResult("Uint32", "2727");
testCodeResult("Float32", "27.5");
testCodeResult("Float64", "27.512");
// Negative Numbers
testCodeResult("Neg Zero", "-0");
testCodeResult("Neg One", "-1");
testCodeResult("Neg Two", "-2");
testCodeResult("Neg Uint32", "-2727");
testCodeResult("Neg Float32", "-27.5");
testCodeResult("Neg Float64", "-27.512");
// Numbers in other formats
testCodeResult("Number in hex", "0xfe2f");
testCodeResult("Number in bin", "0b11011");
testCodeResult("Number in oct", "0o1234567");
// Booleans
testCodeResult("True", "true");
testCodeResult("False", "false");
// Etc...
testCodeResult("Null", "null");
testCodeResult("String", `"Hello"`);
