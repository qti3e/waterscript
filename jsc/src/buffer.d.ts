declare interface WSBuffer {
  size: number;

  getCursor(): number;
  skip(count: number): number;

  put(number: number, cursor?: number): void;
  get(cursor: number): number;

  setUint16(number: number, cursor?: number): void;
  getUint16(cursor: number): number;
  setUint32(number: number, cursor?: number): void;
  getUint32(cursor: number): number;

  setInt16(number: number, cursor?: number): void;
  getInt16(cursor: number): number;
  setInt32(number: number, cursor?: number): void;
  getInt32(cursor: number): number;

  setFloat32(number: number, cursor?: number): void;
  getFloat32(cursor: number): number;
  setFloat64(number: number, cursor?: number): void;
  getFloat64(cursor: number): number;

  setNetString16(data: string, cursor?: number): void;
  getNetString16(cursor: number): string;
  setNetString32(data: string, cursor?: number): void;
  getNetString32(cursor: number): string;
}

declare const WSBuffer: { new (initialSize: number): WSBuffer };
