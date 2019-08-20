/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

const enum Kind {
  Variable = 0,
  Function = 1
}

type ScopeEntity =
  | {
      kind: Kind.Function;
      id: number;
    }
  | {
      kind: Kind.Variable;
    };

export class Scope {
  private readonly map: Map<string, ScopeEntity> = new Map();

  addFunction(name: string, id: number): void {
    this.map.set(name, {
      kind: Kind.Function,
      id
    });
  }

  addVariable(name: string): void {
    if (this.map.has(name)) return;
    this.map.set(name, {
      kind: Kind.Variable
    });
  }

  getBuffer(): WSBuffer {
    const buffer = new WSBuffer();
    // The first two bytes is the number of scope sections.
    buffer.setUint16(this.map.size);
    for (const [name, entity] of this.map) {
      buffer.put(entity.kind);
      buffer.setNetString16(name);
      if (entity.kind === Kind.Function) {
        buffer.setUint16(entity.id);
      }
    }
    return buffer;
  }
}
