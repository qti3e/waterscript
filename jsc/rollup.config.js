import typescript from "rollup-plugin-typescript";
import resolve from "rollup-plugin-node-resolve";

export default {
  input: "./src/main.ts",
  output: {
    format: "iife",
    file: "dist/bundle.js",
    name: "Wsy"
  },
  plugins: [
    typescript(),
    resolve({
      modulesOnly: true
    })
  ]
};
