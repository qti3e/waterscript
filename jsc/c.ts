import "./src/buffer.polyfill";
import { Compiler, CompiledData } from "./src/compiler";

// Run this file like:
// TS_NODE_FILES=true ts-node c.ts > ../vm/compiled.c
// To generate VM pre compiled data.

const source = `
2 + 3;

const x = function () {
  return 0 + 1 * 5.3;
}
`;

// Generate the C file.
const compiler = new Compiler();

const fmt = (n: number, width = 2) =>
  "0x" + n.toString(16).padStart(width, "0");

const data = {
  cursor: 0,
  u8: new Uint8Array(1 << 20)
};

type FunctionInfo = {
  size: number;
  code_offset: number;
  constant_pool_offset: number;
  map_offset: number;
  scope_offset: number;
};

const functions: FunctionInfo[] = [];

function write(buffer: WSBuffer): number {
  const cursor = data.cursor;
  for (let i = 0; i < buffer.size; ++i, ++data.cursor) {
    data.u8[data.cursor] = buffer.get(i);
  }
  return cursor;
}

function addFunction(data: CompiledData): void {
  const size =
    data.codeSection.size +
    data.constantPool.size +
    data.scope.size +
    data.mapSection.size;

  const code_offset = write(data.codeSection);
  const constant_pool_offset = write(data.constantPool);
  const scope_offset = write(data.scope);
  const map_offset = write(data.mapSection);
  const info: FunctionInfo = {
    size,
    code_offset,
    constant_pool_offset,
    scope_offset,
    map_offset
  };
  functions.push(info);
}

addFunction(compiler.compile(source));
for (let i = 1; i <= compiler.lastFunctionId; ++i) {
  addFunction(compiler.requestCompile(i));
}

// Print data.
const u8array = [...data.u8.slice(0, data.cursor)];

console.log(`// This file is auto-generated do not edit.
#include "compiled.h"
#include "compiler.h"
#include "alloc.h"

const struct _compiled_function_info
{
  size_t size;
  size_t code_offset;
  size_t constant_pool_offset;
  size_t scope_offset;
  size_t map_offset;
} compiled_functions[] = {`);

for (let i = 0; i < functions.length; ++i) {
  const line = [
    functions[i].size,
    functions[i].code_offset,
    functions[i].constant_pool_offset,
    functions[i].scope_offset,
    functions[i].map_offset
  ]
    .map(x => fmt(x, 4))
    .join(", ");
  console.log("  {" + line + "},");
}

console.log(`};\n`);
console.log(`const uint8_t global_compiled_data[] = {`);

for (let i = 0; i < u8array.length; i += 13) {
  let line = u8array
    .slice(i, i + 13)
    .map(x => fmt(x))
    .join(", ");
  console.log("  " + line + ",");
}

console.log(`};`);

console.log(`
ws_function_compiled_data *get_compiled_data(int id)
{
  size_t start;
  struct _compiled_function_info info = compiled_functions[id];
  start = info.code_offset;
  const uint8_t *data = global_compiled_data + start;

  ws_function_compiled_data *compiled_data = (ws_function_compiled_data *)
      ws_alloc(sizeof(ws_function_compiled_data) + info.size);

  compiled_data->constant_pool_offset = info.constant_pool_offset - start;
  compiled_data->scope_offset = info.scope_offset - start;
  compiled_data->map_offset = info.map_offset - start;

  for (unsigned long i = 0; i < info.size; ++i)
    compiled_data->data[i] = data[i];

  return compiled_data;
}

ws_function *get_function(int id, ws_scope *scope)
{
  static ws_function *cache = NULL;

  if (cache != NULL)
    return cache;

  ws_function *function = (ws_function *)ws_alloc(sizeof(*function));
  function->scope = scope;
  function->ref_count = 1;
  function->id = -id;
  function->data = get_compiled_data(id);

  cache = function;
  return function;
}`);
