import { describe, expect, it } from "vitest";
import { BinaryReader, BinaryWriter } from "./binary";
import { createDemoSave } from "./factory";
import { detectPlatform, parseSave, writeSave } from "./save";

describe("binary strings", () => {
  it("round-trips latin1 WSG strings", () => {
    const writer = new BinaryWriter();
    writer.writeString("gd_Roland.Character.CharacterClass_Roland");
    writer.writeString("");
    const reader = new BinaryReader(writer.toUint8Array(), "le");
    expect(reader.readString()).toBe("gd_Roland.Character.CharacterClass_Roland");
    expect(reader.readString()).toBe("");
  });

  it("writes big-endian integers for PS3 saves", () => {
    const writer = new BinaryWriter();
    writer.endian = "be";
    writer.writeI32(2);
    expect([...writer.toUint8Array()]).toEqual([0, 0, 0, 2]);
  });
});

describe("save round trip", () => {
  it("detects PC and PS3 platforms", () => {
    const pc = writeSave(createDemoSave({ platform: "PC" }));
    const ps3 = writeSave(createDemoSave({ platform: "PS3" }));
    expect(detectPlatform(pc)).toBe("PC");
    expect(detectPlatform(ps3)).toBe("PS3");
  });

  it("round-trips a classic PC save", () => {
    const original = createDemoSave({ enhanced: false, platform: "PC" });
    const parsed = parseSave(writeSave(original), original.sourceName);
    expect(parsed.characterName).toBe("Roland");
    expect(parsed.level).toBe(35);
    expect(parsed.cash).toBe(250000);
    expect(parsed.skills).toHaveLength(2);
    expect(parsed.weapons).toHaveLength(2);
    expect(parsed.items[0].parts[1]).toBe("gd_shields.A_Item.Item_Shield");
    expect(parsed.questLists[0].quests[0].objectives[0].description).toBe("Sledge killed");
    expect(parsed.revisionNumber).toBe(0x20);
    expect(parsed.unknown2).toBeNull();
  });

  it("round-trips an enhanced PC save with DLC backpack items", () => {
    const original = createDemoSave({ enhanced: true });
    original.weapons[1].level = 48;
    const parsed = parseSave(writeSave(original));
    expect(parsed.weapons).toHaveLength(2);
    expect(parsed.weapons[1].level).toBe(48);
    expect(parsed.weapons[1].quality).toBe(8);
    expect(parsed.dlc.hasBank).toBe(true);
    expect(parsed.dlc.bankSize).toBe(42);
    expect(parsed.unknown2?.length).toBe(85);
  });

  it("round-trips a PS3 save", () => {
    const original = createDemoSave({ enhanced: false, platform: "PS3" });
    original.characterName = "Lilith";
    original.cash = 999999;
    const bytes = writeSave(original);
    expect(bytes[3]).toBe(0);
    expect(bytes[6]).toBe(2);
    const parsed = parseSave(bytes);
    expect(parsed.platform).toBe("PS3");
    expect(parsed.characterName).toBe("Lilith");
    expect(parsed.cash).toBe(999999);
  });

  it("preserves edits to character fields", () => {
    const original = createDemoSave();
    const parsed = parseSave(writeSave(original));
    parsed.characterName = "Brick";
    parsed.classId = "gd_Brick.Character.CharacterClass_Brick";
    parsed.level = 69;
    parsed.experience = 8451340;
    parsed.skillPoints = 99;
    parsed.cash = 1_000_000_000;
    parsed.backpackSize = 72;
    parsed.ammoPools[0].remaining = 540;
    parsed.skills[1].level = 5;
    const again = parseSave(writeSave(parsed));
    expect(again.characterName).toBe("Brick");
    expect(again.level).toBe(69);
    expect(again.cash).toBe(1_000_000_000);
    expect(again.ammoPools[0].remaining).toBeCloseTo(540);
    expect(again.skills[1].level).toBe(5);
  });

  it("rejects non-WSG files", () => {
    expect(() => parseSave(new Uint8Array([1, 2, 3, 4]))).toThrow(/not a Borderlands 1 WSG/);
  });
});
