import { global } from "./util";

class WSBufferPolyFill implements WSBuffer {
  private ab: ArrayBuffer;
  private u8: Uint8Array;
  private view: DataView;
  private cursor: number;
  size: number;

  constructor(initialSize: number) {
    this.ab = new ArrayBuffer(initialSize);
    this.u8 = new Uint8Array(this.ab);
    this.view = new DataView(this.ab);
    this.cursor = 0;
    this.size = 0;
  }

  private expand(requiredSize: number): void {
    const size = 2 ** Math.ceil(Math.log2(requiredSize));
    const newBuf = new ArrayBuffer(size);
    const newU8 = new Uint8Array(newBuf);
    newU8.set(this.u8);

    this.size = size;
    this.ab = newBuf;
    this.u8 = newU8;
    this.view = new DataView(this.ab);
  }

  private resizeOnWrite(cursor: number, count: number): void {
    const newSize = cursor + count;
    if (newSize > this.ab.byteLength) {
      this.expand(cursor + count);
    }
    if (newSize > this.size) {
      this.size = newSize;
    }
  }

  getCursor(): number {
    return this.cursor;
  }

  skip(count: number): number {
    const index = this.cursor;
    this.resizeOnWrite(this.cursor, count);
    this.cursor += count;
    return index;
  }

  put(number: number, cursor: number = this.cursor): void {
    this.resizeOnWrite(cursor, 1);
    this.u8[cursor] = number;
    if (arguments.length === 1) this.cursor += 1;
  }

  get(cursor: number): number {
    return this.u8[cursor];
  }

  setUint16(number: number, cursor: number = this.cursor): void {
    this.resizeOnWrite(cursor, 2);
    this.view.setUint16(cursor, number);
    if (arguments.length === 1) this.cursor += 2;
  }

  getUint16(cursor: number): number {
    return this.view.getUint16(cursor);
  }

  setUint32(number: number, cursor: number = this.cursor): void {
    this.resizeOnWrite(cursor, 4);
    this.view.setUint32(cursor, number);
    if (arguments.length === 1) this.cursor += 4;
  }

  getUint32(cursor: number): number {
    return this.view.getUint32(cursor);
  }

  setInt16(number: number, cursor: number = this.cursor): void {
    this.resizeOnWrite(cursor, 2);
    this.view.setInt16(cursor, number);
    if (arguments.length === 1) this.cursor += 2;
  }

  getInt16(cursor: number): number {
    return this.view.getInt16(cursor);
  }

  setInt32(number: number, cursor: number = this.cursor): void {
    this.resizeOnWrite(cursor, 4);
    this.view.setInt32(cursor, number);
    if (arguments.length === 1) this.cursor += 4;
  }

  getInt32(cursor: number): number {
    return this.view.getInt32(cursor);
  }

  setFloat32(number: number, cursor: number = this.cursor): void {
    this.resizeOnWrite(cursor, 4);
    this.view.setFloat32(cursor, number);
    if (arguments.length === 1) this.cursor += 4;
  }

  getFloat32(cursor: number): number {
    return this.view.getFloat32(cursor);
  }

  setFloat64(number: number, cursor: number = this.cursor): void {
    this.resizeOnWrite(cursor, 8);
    this.view.setFloat64(cursor, number);
    if (arguments.length === 1) this.cursor += 8;
  }

  getFloat64(cursor: number): number {
    return this.view.getFloat64(cursor);
  }

  private writeString(data: string, cursor: number): void {
    for (let i = 0; i < data.length; ++i) {
      this.view.setUint16(cursor + i * 2, data.charCodeAt(i));
    }
  }

  private readString(length: number, cursor: number): string {
    if (length === 0) return "";
    const chars: number[] = [];
    for (let i = 0; i < length; ++i) {
      chars.push(this.view.getUint16(cursor + i * 2));
    }
    return chars.map(ch => String.fromCharCode(ch)).join("");
  }

  setNetString16(data: string, cursor: number = this.cursor): void {
    const writeLen = 2 + data.length * 2;
    this.resizeOnWrite(cursor, writeLen);
    this.view.setUint16(cursor, data.length);
    this.writeString(data, cursor + 2);
    if (arguments.length === 1) this.cursor += writeLen;
  }

  getNetString16(cursor: number): string {
    const len = this.view.getUint16(cursor);
    return this.readString(len, cursor + 2);
  }

  setNetString32(data: string, cursor: number = this.cursor): void {
    const writeLen = 4 + data.length * 2;
    this.resizeOnWrite(cursor, writeLen);
    this.view.setUint32(cursor, data.length);
    this.writeString(data, cursor + 4);
    if (arguments.length === 1) this.cursor += writeLen;
  }

  getNetString32(cursor: number): string {
    const len = this.view.getUint32(cursor);
    return this.readString(len, cursor + 4);
  }
}

if (global.WSBuffer === undefined) {
  global.WSBuffer = WSBufferPolyFill;
}
