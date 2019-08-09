/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import { Buffer } from "./buffer";

export class Scope {
  readonly buffer = new Buffer(64);
  private num = 0;

  constructor() {
    // The first two bytes is the number of scope sections.
    this.buffer.skip(2);
  }

  getArrayBuffer(): ArrayBuffer {
    return this.buffer.getSlicedBuffer();
  }

  addFunction(name: string, id: number): void {
    this.buffer.writeUint16(++this.num, 0);
    this.buffer.put(1);
    // TODO(qti3e) This is wrong... name.length is not the
    // same as number of bytes.
    this.buffer.writeUint16(name.length);
    this.buffer.writeString(name);
    this.buffer.writeUint16(id);
  }

  addVariable(name: string): void {
    this.buffer.writeUint16(++this.num, 0);
    this.buffer.put(0);
    // TODO(qti3e) This is wrong... name.length is not the
    // same as number of bytes.
    this.buffer.writeUint16(name.length);
    this.buffer.writeString(name);
  }
}
