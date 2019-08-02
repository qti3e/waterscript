import { TextEncoder } from "./text_encoding";

type SingleByte = number;

const textEncoder = new TextEncoder();

// A buffer that dynamically resizes it self as we write to it.
// Uses "Big Endian".
export class Buffer {
  private size: number;
  private buf: ArrayBuffer;
  private view: Uint8Array;
  private headOffset: number = 0;

  constructor(initialSize = 256) {
    this.size = Math.max(1, initialSize);
    this.buf = new ArrayBuffer(this.size);
    this.view = new Uint8Array(this.buf);
  }

  getSize(): number {
    return this.size;
  }

  getBuffer(): ArrayBuffer {
    return this.buf;
  }

  getUint8Array(): Uint8Array {
    return this.view;
  }

  getSlicedBuffer(): ArrayBuffer {
    return this.buf.slice(0, this.headOffset);
  }

  getSlicedUint8Array(): Uint8Array {
    return new Uint8Array(this.getSlicedBuffer());
  }

  private expand(requiredSize: number): void {
    const size = 2 ** Math.ceil(Math.log2(requiredSize));
    const newBuf = new ArrayBuffer(size);
    const newView = new Uint8Array(newBuf);
    newView.set(this.view);

    this.size = size;
    this.buf = newBuf;
    this.view = newView;
  }

  private resizeOnWrite(cursor: number, count: number): void {
    if (cursor + count > this.size) {
      this.expand(cursor + count);
    }
  }

  put(data: SingleByte, cursor = this.headOffset): void {
    this.resizeOnWrite(cursor, 1);
    this.view[cursor] = data;

    if (arguments.length == 1) {
      this.headOffset++;
    }
  }

  writeUint16(value: number, cursor = this.headOffset): void {
    this.resizeOnWrite(cursor, 2);
    this.view[cursor + 1] = value & 0xff;
    this.view[cursor] = (value >>> 8) & 0xff;

    if (arguments.length == 1) {
      this.headOffset += 2;
    }
  }

  writeUint32(value: number, cursor = this.headOffset): void {
    this.resizeOnWrite(cursor, 4);
    this.view[cursor + 3] = value & 0xff;
    this.view[cursor + 2] = (value >>> 8) & 0xff;
    this.view[cursor + 1] = (value >>> 16) & 0xff;
    this.view[cursor + 0] = (value >>> 24) & 0xff;

    if (arguments.length == 1) {
      this.headOffset += 4;
    }
  }

  writeInt16(value: number, cursor = this.headOffset): void {
    if (arguments.length == 2) {
      return this.writeUint16(value < 0 ? value | 0x10000 : value, cursor);
    }
    this.writeUint16(value < 0 ? value | 0x10000 : value);
  }

  writeInt32(value: number, cursor = this.headOffset): void {
    if (arguments.length == 2) {
      return this.writeUint16(value < 0 ? value | 0x10000 : value, cursor);
    }
    this.writeUint32(value < 0 ? value | 0x100000000 : value);
  }

  writeFloat32(value: number, cursor = this.headOffset): void {
    this.resizeOnWrite(cursor, 4);
    writeFloat(this.view, cursor, value, false, 23, 4);

    if (arguments.length == 1) {
      this.headOffset += 4;
    }
  }

  writeFloat64(value: number, cursor = this.headOffset): void {
    this.resizeOnWrite(cursor, 8);
    writeFloat(this.view, cursor, value, false, 52, 8);
    if (arguments.length == 1) {
      this.headOffset += 8;
    }
  }

  getCursor() {
    return this.headOffset;
  }

  skip(bytes: number): number {
    const index = this.headOffset;
    this.resizeOnWrite(this.headOffset, bytes);
    this.headOffset += bytes;
    return index;
  }
}

// Joyent copyright applies to writeFloat
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// Ported to TypeScript and other modifications by WaterScript project.

function writeFloat(
  u8Array: Uint8Array,
  cursor: number,
  value: number,
  littleEndian: boolean,
  mLen: number,
  bytes: number
): void {
  const buffer = u8Array;
  const offset = u8Array.byteOffset + cursor;
  let eLen = bytes * 8 - mLen - 1;
  const eMax = (1 << eLen) - 1;
  const eBias = eMax >> 1;
  const rt = mLen == 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  const d = littleEndian ? 1 : -1;
  const s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;
  let i = littleEndian ? 0 : bytes - 1;
  let e: number;
  let m: number;
  let c: number;

  value < 0 && (value = -value);

  if (value !== value || value === Infinity) {
    m = value !== value ? 1 : 0;
    e = eMax;
  } else {
    e = (Math.log(value) / Math.LN2) | 0;
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (
    ;
    mLen >= 8;
    buffer[offset + i] = m & 0xff, i += d, m /= 0x100, mLen -= 8
  );

  e = (e << mLen) | m;
  eLen += mLen;
  for (
    ;
    eLen > 0;
    buffer[offset + i] = e & 0xff, i += d, e /= 0x100, eLen -= 8
  );

  buffer[offset + i - d] |= s * 0x80;
}
