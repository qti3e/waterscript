import { CompiledData } from "../src/compiler";

class Dumper {
  async dump(data: CompiledData, cursor: number): Promise<void> {}
}

export const dumper = new Dumper();
