/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

export class Scope {
  readonly buffer = new WSBuffer(64);
  private num = 0;

  constructor() {
    // The first two bytes is the number of scope sections.
    this.buffer.skip(2);
  }

  addFunction(name: string, id: number): void {
    this.buffer.setUint16(++this.num, 0);
    this.buffer.put(1);
    this.buffer.setNetString16(name);
    this.buffer.setUint16(id);
  }

  addVariable(name: string): void {
    this.buffer.setUint16(++this.num, 0);
    this.buffer.put(0);
    this.buffer.setNetString16(name);
  }
}
