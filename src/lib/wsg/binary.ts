export type ByteOrder = "le" | "be";

const TEXT_DECODER_UTF16LE = new TextDecoder("utf-16le");
const TEXT_ENCODER_UTF16LE = new TextEncoder();

export function decodeLatin1(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
}

export function encodeLatin1(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) {
    bytes[i] = value.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export function encodeUtf16Le(value: string): Uint8Array {
  const utf8 = TEXT_ENCODER_UTF16LE.encode(value);
  // TextEncoder is UTF-8. Encode UTF-16LE manually for exact WillowTree parity.
  const bytes = new Uint8Array(value.length * 2);
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    bytes[i * 2] = code & 0xff;
    bytes[i * 2 + 1] = code >> 8;
  }
  void utf8;
  return bytes;
}

function needsUnicode(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 256) return true;
  }
  return false;
}

export class BinaryReader {
  private view: DataView;
  private bytes: Uint8Array;
  offset = 0;

  constructor(
    buffer: ArrayBuffer | Uint8Array,
    public endian: ByteOrder = "le",
  ) {
    if (buffer instanceof Uint8Array) {
      this.bytes = buffer;
      this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    } else {
      this.bytes = new Uint8Array(buffer);
      this.view = new DataView(buffer);
    }
  }

  get remaining(): number {
    return this.bytes.length - this.offset;
  }

  slice(start: number, end?: number): Uint8Array {
    return this.bytes.slice(start, end ?? this.bytes.length);
  }

  get eof(): boolean {
    return this.offset >= this.bytes.length;
  }

  private little(): boolean {
    return this.endian === "le";
  }

  readU8(): number {
    if (this.offset + 1 > this.bytes.length) {
      throw new Error("Unexpected end of save file.");
    }
    return this.bytes[this.offset++];
  }

  readI16(): number {
    if (this.offset + 2 > this.bytes.length) {
      throw new Error("Unexpected end of save file.");
    }
    const value = this.view.getInt16(this.offset, this.little());
    this.offset += 2;
    return value;
  }

  readI32(): number {
    if (this.offset + 4 > this.bytes.length) {
      throw new Error("Unexpected end of save file.");
    }
    const value = this.view.getInt32(this.offset, this.little());
    this.offset += 4;
    return value;
  }

  readF32(): number {
    if (this.offset + 4 > this.bytes.length) {
      throw new Error("Unexpected end of save file.");
    }
    const value = this.view.getFloat32(this.offset, this.little());
    this.offset += 4;
    return value;
  }

  readBytes(count: number): Uint8Array {
    if (count < 0 || this.offset + count > this.bytes.length) {
      throw new Error("Unexpected end of save file.");
    }
    const slice = this.bytes.subarray(this.offset, this.offset + count);
    this.offset += count;
    return new Uint8Array(slice);
  }

  readChars(count: number): string {
    return decodeLatin1(this.readBytes(count));
  }

  readString(): string {
    const lengthValue = this.readI32();
    if (lengthValue === 0) return "";

    let raw: Uint8Array;
    let text: string;
    if (lengthValue < 0) {
      const byteCount = -lengthValue * 2;
      if (byteCount > 4096) {
        throw new Error("String length was too long.");
      }
      raw = this.readBytes(byteCount);
      text = TEXT_DECODER_UTF16LE.decode(raw);
    } else {
      if (lengthValue > 4096) {
        throw new Error("String length was too long.");
      }
      raw = this.readBytes(lengthValue);
      text = decodeLatin1(raw);
    }

    const nullIndex = text.indexOf("\0");
    if (nullIndex !== text.length - 1) {
      throw new Error("String was not properly terminated with a null character.");
    }
    return text.slice(0, nullIndex);
  }

  readIntList(): number[] {
    const count = this.readI32();
    const values: number[] = [];
    for (let i = 0; i < count; i++) {
      values.push(this.readI32());
    }
    return values;
  }
}

export class BinaryWriter {
  private chunks: Uint8Array[] = [];
  endian: ByteOrder = "le";

  private little(): boolean {
    return this.endian === "le";
  }

  writeU8(value: number): void {
    this.chunks.push(Uint8Array.of(value & 0xff));
  }

  writeBytes(data: Uint8Array): void {
    this.chunks.push(data);
  }

  writeChars(value: string): void {
    this.writeBytes(encodeLatin1(value));
  }

  writeI16(value: number): void {
    const buf = new Uint8Array(2);
    new DataView(buf.buffer).setInt16(0, value, this.little());
    this.chunks.push(buf);
  }

  writeI32(value: number): void {
    const buf = new Uint8Array(4);
    new DataView(buf.buffer).setInt32(0, value, this.little());
    this.chunks.push(buf);
  }

  writeF32(value: number): void {
    const buf = new Uint8Array(4);
    new DataView(buf.buffer).setFloat32(0, value, this.little());
    this.chunks.push(buf);
  }

  writeString(value: string): void {
    if (!value) {
      this.writeI32(0);
      return;
    }
    if (!needsUnicode(value)) {
      this.writeI32(value.length + 1);
      this.writeBytes(encodeLatin1(value));
      this.writeU8(0);
      return;
    }
    this.writeI32(-1 - value.length);
    this.writeBytes(encodeUtf16Le(value));
    this.writeI16(0);
  }

  writeIntList(values: number[]): void {
    this.writeI32(values.length);
    for (const value of values) this.writeI32(value);
  }

  toUint8Array(): Uint8Array {
    let total = 0;
    for (const chunk of this.chunks) total += chunk.length;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}
