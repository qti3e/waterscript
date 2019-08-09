import { test, assertEqual } from "liltest";
import { Buffer } from "../src/buffer";

test(function bufferSlice() {
  const buffer = new Buffer();
  buffer.put(1);
  buffer.put(2);

  const u8 = buffer.getUint8Array();
  assertEqual(u8[0], 1);
  assertEqual(u8[1], 2);
  assertEqual(u8[2], 0);

  assertEqual(buffer.getSlicedBuffer().byteLength, 2);

  const slicedU8 = buffer.getSlicedUint8Array();
  assertEqual(slicedU8.length, 2);

  slicedU8[0] = 5;
  assertEqual(slicedU8[0], 5);
  assertEqual(u8[0], 1);
});

test(function bufferResizePut() {
  const buffer = new Buffer(1);

  assertEqual(buffer.getSize(), 1);
  assertEqual(buffer.getBuffer().byteLength, 1);

  buffer.put(1);
  buffer.put(2);

  assertEqual(buffer.getSize(), 2);
  assertEqual(buffer.getBuffer().byteLength, 2);

  buffer.put(3);

  assertEqual(buffer.getSize(), 4);
  assertEqual(buffer.getBuffer().byteLength, 4);
});

test(function bufferResizeWriteUint16() {
  const buffer = new Buffer(1);

  assertEqual(buffer.getSize(), 1);
  assertEqual(buffer.getBuffer().byteLength, 1);

  buffer.writeUint16(5);

  assertEqual(buffer.getSize(), 2);
  assertEqual(buffer.getBuffer().byteLength, 2);

  buffer.writeUint16(15);

  assertEqual(buffer.getSize(), 4);
  assertEqual(buffer.getBuffer().byteLength, 4);
});

test(function bufferResizeWriteUint32() {
  const buffer = new Buffer(1);

  assertEqual(buffer.getSize(), 1);
  assertEqual(buffer.getBuffer().byteLength, 1);

  buffer.writeUint32(3);

  assertEqual(buffer.getSize(), 4);
  assertEqual(buffer.getBuffer().byteLength, 4);

  buffer.writeUint32(16);

  assertEqual(buffer.getSize(), 8);
  assertEqual(buffer.getBuffer().byteLength, 8);

  const buffer2 = new Buffer(4);
  buffer.writeUint32(27);
  assertEqual(buffer2.getSize(), 4);
  assertEqual(buffer2.getBuffer().byteLength, 4);
});

test(function bufferResizeWriteInt16() {
  const buffer = new Buffer(1);

  assertEqual(buffer.getSize(), 1);
  assertEqual(buffer.getBuffer().byteLength, 1);

  buffer.writeInt16(5);

  assertEqual(buffer.getSize(), 2);
  assertEqual(buffer.getBuffer().byteLength, 2);

  buffer.writeInt16(27);

  assertEqual(buffer.getSize(), 4);
  assertEqual(buffer.getBuffer().byteLength, 4);
});

test(function bufferResizeWriteInt32() {
  const buffer = new Buffer(1);

  assertEqual(buffer.getSize(), 1);
  assertEqual(buffer.getBuffer().byteLength, 1);

  buffer.writeInt32(5);

  assertEqual(buffer.getSize(), 4);
  assertEqual(buffer.getBuffer().byteLength, 4);

  buffer.writeInt32(15);

  assertEqual(buffer.getSize(), 8);
  assertEqual(buffer.getBuffer().byteLength, 8);
});

test(function bufferResizeFoat32() {
  const buffer = new Buffer(1);

  assertEqual(buffer.getSize(), 1);
  assertEqual(buffer.getBuffer().byteLength, 1);

  buffer.writeFloat32(5);

  assertEqual(buffer.getSize(), 4);
  assertEqual(buffer.getBuffer().byteLength, 4);

  buffer.writeFloat32(15.8);

  assertEqual(buffer.getSize(), 8);
  assertEqual(buffer.getBuffer().byteLength, 8);
});

test(function bufferResizeFoat64() {
  const buffer = new Buffer(1);

  assertEqual(buffer.getSize(), 1);
  assertEqual(buffer.getBuffer().byteLength, 1);

  buffer.writeFloat64(5);

  assertEqual(buffer.getSize(), 8);
  assertEqual(buffer.getBuffer().byteLength, 8);

  buffer.writeFloat64(15.8);

  assertEqual(buffer.getSize(), 16);
  assertEqual(buffer.getBuffer().byteLength, 16);
});

test(function bufferPut() {
  const buffer = new Buffer(5);
  buffer.put(1);
  buffer.put(2);
  buffer.put(3);
  buffer.put(4);
  buffer.put(5);

  assertEqual([...buffer.getUint8Array()], [1, 2, 3, 4, 5]);
});

test(function bufferWriteUint16() {
  const buffer = new Buffer(10);
  buffer.writeUint16(0x27);
  buffer.writeUint16(0x2700);
  buffer.writeUint16(0x0227);
  buffer.writeUint16(0x0316);
  buffer.writeUint16(0x1603);

  assertEqual(
    [...buffer.getSlicedUint8Array()],
    [0x00, 0x27, 0x27, 0x00, 0x02, 0x27, 0x03, 0x16, 0x16, 0x03]
  );
});

test(function bufferWriteUint32() {
  const buffer = new Buffer(32);

  buffer.writeUint32(0x1);
  buffer.writeUint32(0x12);
  buffer.writeUint32(0x123);
  buffer.writeUint32(0x1234);
  buffer.writeUint32(0x12345);
  buffer.writeUint32(0x123456);
  buffer.writeUint32(0x1234567);
  buffer.writeUint32(0x12345678);

  // prettier-ignore
  assertEqual(
    [...buffer.getSlicedUint8Array()],
    [
      0x00, 0x00, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x12,
      0x00, 0x00, 0x01, 0x23,
      0x00, 0x00, 0x12, 0x34,
      0x00, 0x01, 0x23, 0x45,
      0x00, 0x12, 0x34, 0x56,
      0x01, 0x23, 0x45, 0x67,
      0x12, 0x34, 0x56, 0x78
    ]
  );
});

test(function bufferWriteInt16() {
  const buffer = new Buffer(16);

  buffer.writeInt16(0x1);
  buffer.writeInt16(0x12);
  buffer.writeInt16(0x123);
  buffer.writeInt16(0x1234);
  buffer.writeInt16(-0x1);
  buffer.writeInt16(-0x12);
  buffer.writeInt16(-0x123);
  buffer.writeInt16(-0x1234);

  // prettier-ignore
  assertEqual(
    [...buffer.getSlicedUint8Array()],
    [
      0x00, 0x01,
      0x00, 0x12,
      0x01, 0x23,
      0x12, 0x34,
      0xff, 0xff,
      0xff, 0xee,
      0xfe, 0xdd,
      0xed, 0xcc
    ]
  );
});

test(function bufferWriteInt32() {
  const buffer = new Buffer(64);

  buffer.writeInt32(0x1);
  buffer.writeInt32(0x12);
  buffer.writeInt32(0x123);
  buffer.writeInt32(0x1234);
  buffer.writeInt32(0x12345);
  buffer.writeInt32(0x123456);
  buffer.writeInt32(0x1234567);
  buffer.writeInt32(0x12345678);
  buffer.writeInt32(-0x1);
  buffer.writeInt32(-0x12);
  buffer.writeInt32(-0x123);
  buffer.writeInt32(-0x1234);
  buffer.writeInt32(-0x12345);
  buffer.writeInt32(-0x123456);
  buffer.writeInt32(-0x1234567);
  buffer.writeInt32(-0x12345678);

  // prettier-ignore
  assertEqual(
    [...buffer.getSlicedUint8Array()],
    [
      0x00, 0x00, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x12,
      0x00, 0x00, 0x01, 0x23,
      0x00, 0x00, 0x12, 0x34,
      0x00, 0x01, 0x23, 0x45,
      0x00, 0x12, 0x34, 0x56,
      0x01, 0x23, 0x45, 0x67,
      0x12, 0x34, 0x56, 0x78,
      0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xee,
      0xff, 0xff, 0xfe, 0xdd,
      0xff, 0xff, 0xed, 0xcc,
      0xff, 0xfe, 0xdc, 0xbb,
      0xff, 0xed, 0xcb, 0xaa,
      0xfe, 0xdc, 0xba, 0x99,
      0xed, 0xcb, 0xa9, 0x88
    ]
  );
});

test(function bufferWriteFloat32() {
  const buffer = new Buffer(32);

  buffer.writeFloat32(Math.PI);
  buffer.writeFloat32(Math.E);
  buffer.writeFloat32(Math.log(2));
  buffer.writeFloat32(1);
  buffer.writeFloat32(27);
  buffer.writeFloat32(-0.5);
  buffer.writeFloat32(0.5);
  buffer.writeFloat32(0xff);

  // prettier-ignore
  assertEqual(
    [...buffer.getSlicedUint8Array()],
    [
      0x40, 0x49, 0x0f, 0xdb,
      0x40, 0x2d, 0xf8, 0x54,
      0x3f, 0x31, 0x72, 0x18,
      0x3f, 0x80, 0x00, 0x00,
      0x41, 0xd8, 0x00, 0x00,
      0xbf, 0x00, 0x00, 0x00,
      0x3f, 0x00, 0x00, 0x00,
      0x43, 0x7f, 0x00, 0x00,
    ]
  );
});

test(function bufferWriteString() {
  const buffer = new Buffer(1);

  buffer.writeString("Hello");
  buffer.writeString("سلام");
  buffer.writeString("你好");

  // prettier-ignore
  assertEqual(
    [...buffer.getSlicedUint8Array()],
    [
      0x48, 0x65, 0x6c, 0x6c,
      0x6f, 0xd8, 0xb3, 0xd9,
      0x84, 0xd8, 0xa7, 0xd9,
      0x85, 0xe4, 0xbd, 0xa0,
      0xe5, 0xa5, 0xbd
    ]
  );
});

test(function bufferCursor() {
  const buffer = new Buffer(1);
  buffer.writeUint32(0x12345678, 2);

  assertEqual(buffer.getSize(), 8);
  assertEqual(buffer.getCursor(), 0);

  // prettier-ignore
  assertEqual(
    [...buffer.getUint8Array()],
    [
      0x00, 0x00, 0x12, 0x34,
      0x56, 0x78, 0x00, 0x00
    ]
  );

  buffer.writeInt32(0x1234abcd);

  // prettier-ignore
  assertEqual(
    [...buffer.getUint8Array()],
    [
      0x12, 0x34, 0xab, 0xcd,
      0x56, 0x78, 0x00, 0x00
    ]
  );

  assertEqual(buffer.getCursor(), 4);
  assertEqual(buffer.getSlicedBuffer().byteLength, 4);
});

test(function bufferSkip() {
  const buffer = new Buffer(1);

  const pos = buffer.skip(4);
  assertEqual(buffer.getSize(), 4);

  buffer.writeUint16(0xabcd);
  assertEqual(buffer.getSize(), 8);

  // prettier-ignore
  assertEqual(
    [...buffer.getSlicedUint8Array()],
    [
      0x00, 0x00, 0x00, 0x00,
      0xab, 0xcd
    ]
  );

  buffer.writeUint32(0x12345678, pos);

  // prettier-ignore
  assertEqual(
    [...buffer.getSlicedUint8Array()],
    [
      0x12, 0x34, 0x56, 0x78,
      0xab, 0xcd
    ]
  );
});

test(function bufferWriteNetString16() {
  const buffer = new Buffer(1);

  buffer.writeNetString16("سلام");
  assertEqual(buffer.getSize(), 16);
  // To test that cursor has moved.
  buffer.put(0xff);

  // prettier-ignore
  assertEqual(
    [...buffer.getSlicedUint8Array()],
    [
      0x00, 0x08, 0xd8, 0xb3,
      0xd9, 0x84, 0xd8, 0xa7,
      0xd9, 0x85, 0xff
    ]
  );
});

test(function bufferWriteNetString32() {
  const buffer = new Buffer(1);

  buffer.writeNetString32("سلام");
  assertEqual(buffer.getSize(), 16);
  // To test that cursor has moved.
  buffer.put(0xff);

  // prettier-ignore
  assertEqual(
    [...buffer.getSlicedUint8Array()],
    [
      0x00, 0x00, 0x00, 0x08,
      0xd8, 0xb3, 0xd9, 0x84,
      0xd8, 0xa7, 0xd9, 0x85,
      0xff
    ]
  );
});
