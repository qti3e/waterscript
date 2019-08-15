export function assert(condition: boolean, msg?: string): void {
  msg = msg || "Assentation failed.";
  if (!condition) throw new Error(msg);
}
