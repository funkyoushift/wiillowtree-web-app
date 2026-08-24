import { parseSave, writeSave, type WillowSaveGame } from "@/lib/wsg";
import {
  STFS_DATA_OFFSET,
  createConPackage,
  embedWsg,
  findWsgOffset,
  isStfsPackage,
  readXboxIds,
} from "@/lib/x360/stfs";

export function openSaveBytes(bytes: Uint8Array, sourceName: string): WillowSaveGame {
  if (isStfsPackage(bytes)) {
    const offset = findWsgOffset(bytes);
    if (offset < 0) {
      throw new Error("Xbox 360 CON package does not contain a WSG save.");
    }
    const inner = bytes.subarray(offset);
    const save = parseSave(inner, sourceName, { platform: "Xbox360", ignoreTrailing: true });
    save.xboxPackage = {
      bytes: new Uint8Array(bytes),
      innerOffset: offset,
      innerLength: save.parsedLength,
      magic: String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]),
    };
    return save;
  }
  return parseSave(bytes, sourceName);
}

export function encodeSaveBytes(save: WillowSaveGame): Uint8Array {
  const wsg = writeSave(save);
  if (save.platform !== "Xbox360") return wsg;
  if (save.xboxPackage) {
    const wrapped = embedWsg(
      save.xboxPackage.bytes,
      save.xboxPackage.innerOffset,
      save.xboxPackage.innerLength,
      wsg,
    );
    save.xboxPackage = {
      bytes: wrapped,
      innerOffset: save.xboxPackage.innerOffset,
      innerLength: wsg.length,
      magic: save.xboxPackage.magic,
    };
    return wrapped;
  }
  const wrapped = createConPackage(wsg);
  save.xboxPackage = {
    bytes: wrapped,
    innerOffset: STFS_DATA_OFFSET,
    innerLength: wsg.length,
    magic: "CON ",
  };
  return wrapped;
}

export function xboxIdSummary(save: WillowSaveGame): string {
  if (!save.xboxPackage) return "No CON package (Save As will wrap a new CON).";
  const ids = readXboxIds(save.xboxPackage.bytes);
  return `Console ${ids.consoleId || "unknown"} · Profile ${ids.profileId || "unknown"}`;
}
