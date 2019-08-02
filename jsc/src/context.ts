import * as estree from "estree";
import { CompiledData } from "./writer";

interface VisitQueueEntity {
  index: number;
  node: estree.Function;
}

export class Context {
  private readonly functions: CompiledData[] = [];
  private readonly functionVisitQueue: VisitQueueEntity[] = [];

  /**
   * The returned index can be used in `LdFunction`.
   */
  requestVisit(node: estree.Function): number {
    const index = this.functions.length;
    const entity = { index, node };
    this.functionVisitQueue.push(entity);
    return index;
  }
}
