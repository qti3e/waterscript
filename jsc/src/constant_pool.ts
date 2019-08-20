export class ConstantPool {
  private map: Map<string, number> = new Map();
  readonly buffer: WSBuffer = new WSBuffer(128);

  setNetString16(data: string): number {
    if (this.map.has(data)) return this.map.get(data)!;
    const index = this.buffer.getCursor();
    this.buffer.setNetString16(data);
    this.map.set(data, index);
    return index;
  }
}
