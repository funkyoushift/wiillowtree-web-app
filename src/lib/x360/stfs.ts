/** Minimal STFS/CON handling modeled on WillowTree# + X360 (GPL-3.0). */

export const STFS_DATA_OFFSET = 0xc000;

function magicOf(bytes: Uint8Array): string {
  if (bytes.length < 4) return "";
  return String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
}

export function isStfsPackage(bytes: Uint8Array): boolean {
  const magic = magicOf(bytes);
  return magic === "CON " || magic === "LIVE" || magic === "PIRS";
}

export function findWsgOffset(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i <= bytes.length - 7; i++) {
    if (bytes[i] !== 0x57 || bytes[i + 1] !== 0x53 || bytes[i + 2] !== 0x47) continue;
    const le = view.getInt32(i + 3, true);
    if (le === 2 || le === 0x02000000) return i;
  }
  return -1;
}

export function readXboxIds(bytes: Uint8Array): { consoleId: string; profileId: string } {
  const hex = (start: number, length: number) =>
    [...bytes.slice(start, start + length)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (bytes.length < 0x380) return { consoleId: "", profileId: "" };
  return {
    consoleId: hex(0x22c, 5),
    profileId: hex(0x371, 8),
  };
}

export function createConPackage(wsg: Uint8Array): Uint8Array {
  const out = new Uint8Array(STFS_DATA_OFFSET + wsg.length);
  out[0] = 0x43;
  out[1] = 0x4f;
  out[2] = 0x4e;
  out[3] = 0x20;
  out.set(wsg, STFS_DATA_OFFSET);
  return out;
}

export function embedWsg(
  container: Uint8Array,
  offset: number,
  oldLength: number,
  wsg: Uint8Array,
): Uint8Array {
  if (wsg.length <= oldLength) {
    const out = new Uint8Array(container);
    out.set(wsg, offset);
    out.fill(0, offset + wsg.length, offset + oldLength);
    return out;
  }
  const prefix = container.subarray(0, offset);
  const suffix = container.subarray(offset + oldLength);
  const out = new Uint8Array(prefix.length + wsg.length + suffix.length);
  out.set(prefix, 0);
  out.set(wsg, prefix.length);
  out.set(suffix, prefix.length + wsg.length);
  return out;
}
