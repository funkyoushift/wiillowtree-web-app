import { describe, expect, it } from "vitest";
import { createConPackage, embedWsg, findWsgOffset, isStfsPackage } from "./stfs";
import { convertPlatform, createDemoSave, parseSave, writeSave } from "../wsg";
import { encodeSaveBytes, openSaveBytes } from "../open-save";

describe("STFS / CON", () => {
  it("detects CON magic and finds an embedded WSG", () => {
    const wsg = writeSave(createDemoSave({ platform: "PS3" }));
    const con = createConPackage(wsg);
    expect(isStfsPackage(con)).toBe(true);
    expect(findWsgOffset(con)).toBe(0xc000);
  });

  it("opens a CON package as Xbox360 and writes the WSG back", () => {
    const original = createDemoSave({ platform: "PS3" });
    original.characterName = "Brick";
    const con = createConPackage(writeSave(original));
    const parsed = openSaveBytes(con, "Save0001.sav");
    expect(parsed.platform).toBe("Xbox360");
    expect(parsed.characterName).toBe("Brick");
    parsed.cash = 42;
    const rewritten = encodeSaveBytes(parsed);
    expect(isStfsPackage(rewritten)).toBe(true);
    const again = openSaveBytes(rewritten, "Save0001.sav");
    expect(again.cash).toBe(42);
    expect(again.platform).toBe("Xbox360");
  });

  it("replaces a larger inner WSG when embedding", () => {
    const small = new Uint8Array([1, 2, 3]);
    const container = new Uint8Array(10);
    container.set(small, 2);
    const grown = embedWsg(container, 2, 3, new Uint8Array([9, 9, 9, 9, 9]));
    expect([...grown.subarray(2, 7)]).toEqual([9, 9, 9, 9, 9]);
  });
});

describe("platform convert", () => {
  it("switches endian when converting PC to PS3", () => {
    const pc = createDemoSave({ platform: "PC" });
    const ps3 = convertPlatform(pc, "PS3");
    const bytes = writeSave(ps3);
    expect(bytes[3]).toBe(0);
    expect(parseSave(bytes).platform).toBe("PS3");
    expect(parseSave(bytes).characterName).toBe("Roland");
  });

  it("wraps a new CON when converting to Xbox without a package", () => {
    const xbox = convertPlatform(createDemoSave({ platform: "PC" }), "Xbox360");
    const bytes = encodeSaveBytes(xbox);
    expect(isStfsPackage(bytes)).toBe(true);
    expect(openSaveBytes(bytes, "x.sav").platform).toBe("Xbox360");
  });

  it("keeps CON wrapping consistent across a second larger save", () => {
    const parsed = openSaveBytes(createConPackage(writeSave(createDemoSave({ platform: "PS3" }))), "Save0001.sav");
    parsed.characterName = "A";
    encodeSaveBytes(parsed);
    parsed.characterName = "LongerXboxName";
    const second = encodeSaveBytes(parsed);
    expect(openSaveBytes(second, "Save0001.sav").characterName).toBe("LongerXboxName");
  });
});
