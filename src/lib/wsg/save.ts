import { BinaryReader, BinaryWriter, type ByteOrder } from "./binary";
import {
  DLC_SECTION,
  type AmmoPool,
  type BankEntry,
  type ChallengeEntry,
  type EchoTable,
  type GearItem,
  type QuestTable,
  type Skill,
  type WillowSaveGame,
  exportValueCount,
  isEnhanced,
} from "./types";

export class SaveFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaveFormatError";
  }
}

function emptyDlc(): WillowSaveGame["dlc"] {
  return {
    hasBank: false,
    hasFlags: false,
    hasLevelCap: false,
    hasBackpack: false,
    unknown1: 1,
    bankSize: 0,
    bank: [],
    bankRaw: null,
    bankDirty: false,
    unknown2: 0,
    unknown3: 0,
    unknown4: 0,
    skipDlc2Intro: 0,
    unknown5: 1,
    secondaryPackEnabled: 0,
    extraSections: [],
  };
}

export function detectPlatform(bytes: Uint8Array): WillowSaveGame["platform"] | "unknown" {
  if (bytes.length < 7) return "unknown";
  if (bytes[0] !== 0x57 || bytes[1] !== 0x53 || bytes[2] !== 0x47) return "unknown";
  const version = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt32(3, true);
  if (version === 2) return "PC";
  if (version === 0x02000000) return "PS3";
  return "unknown";
}

function readSkills(reader: BinaryReader): Skill[] {
  const count = reader.readI32();
  const skills: Skill[] = [];
  for (let i = 0; i < count; i++) {
    skills.push({
      name: reader.readString(),
      level: reader.readI32(),
      experience: reader.readI32(),
      inUse: reader.readI32(),
    });
  }
  return skills;
}

function readAmmo(reader: BinaryReader): AmmoPool[] {
  const count = reader.readI32();
  const pools: AmmoPool[] = [];
  for (let i = 0; i < count; i++) {
    pools.push({
      resource: reader.readString(),
      pool: reader.readString(),
      remaining: reader.readF32(),
      upgradeLevel: reader.readI32(),
    });
  }
  return pools;
}

function readGearValues(reader: BinaryReader, enhanced: boolean): Omit<GearItem, "kind" | "parts"> {
  const quantity = reader.readI32();
  const packed = reader.readI32() >>> 0;
  const quality = packed % 65536;
  const level = Math.floor(packed / 65536);
  const equippedSlot = reader.readI32();
  let junk = 0;
  let locked = 0;
  if (enhanced) {
    const junkValue = reader.readI32();
    const lockedValue = reader.readI32();
    const lockedLooksValid = lockedValue === 0 || lockedValue === 1;
    if (!lockedLooksValid) {
      reader.offset -= 8;
    } else {
      junk = junkValue;
      locked = lockedValue;
    }
  }
  return { quantity, quality, equippedSlot, level, junk, locked };
}

function readGearList(reader: BinaryReader, kind: GearItem["kind"], partCount: number, enhanced: boolean): GearItem[] {
  const count = reader.readI32();
  const items: GearItem[] = [];
  for (let i = 0; i < count; i++) {
    const parts: string[] = [];
    for (let p = 0; p < partCount; p++) parts.push(reader.readString());
    items.push({ kind, parts, ...readGearValues(reader, enhanced) });
  }
  return items;
}

function readChallenges(reader: BinaryReader): { blockId: number; challenges: ChallengeEntry[] } {
  const blockLength = reader.readI32();
  const block = reader.readBytes(blockLength);
  const inner = new BinaryReader(block, reader.endian);
  const blockId = inner.readI32();
  inner.readI32(); // data length
  const entryCount = inner.readI16();
  const challenges: ChallengeEntry[] = [];
  for (let i = 0; i < entryCount; i++) {
    challenges.push({
      id: inner.readI16(),
      typeId: inner.readU8(),
      value: inner.readI32(),
    });
  }
  return { blockId, challenges };
}

function readLocations(reader: BinaryReader): string[] {
  const count = reader.readI32();
  const locations: string[] = [];
  for (let i = 0; i < count; i++) locations.push(reader.readString());
  return locations;
}

function readQuests(reader: BinaryReader): QuestTable[] {
  const listCount = reader.readI32();
  const lists: QuestTable[] = [];
  for (let i = 0; i < listCount; i++) {
    const index = reader.readI32();
    let currentQuest = reader.readString();
    const total = reader.readI32();
    const quests = [];
    for (let q = 0; q < total; q++) {
      const name = reader.readString();
      const progress = reader.readI32();
      const dlcValue1 = reader.readI32();
      const dlcValue2 = reader.readI32();
      const objectiveCount = reader.readI32();
      const objectives = [];
      for (let o = 0; o < objectiveCount; o++) {
        objectives.push({
          description: reader.readString(),
          progress: reader.readI32(),
        });
      }
      quests.push({ name, progress, dlcValue1, dlcValue2, objectives });
    }
    if (currentQuest === "None" && quests.length > 0) {
      currentQuest = quests[0].name;
    }
    lists.push({ index, currentQuest, quests });
  }
  return lists;
}

function readEchoes(reader: BinaryReader): EchoTable[] {
  const listCount = reader.readI32();
  const lists: EchoTable[] = [];
  for (let i = 0; i < listCount; i++) {
    const index = reader.readI32();
    const total = reader.readI32();
    const echoes = [];
    for (let e = 0; e < total; e++) {
      echoes.push({
        name: reader.readString(),
        dlcValue1: reader.readI32(),
        dlcValue2: reader.readI32(),
      });
    }
    lists.push({ index, echoes });
  }
  return lists;
}

function readBankPart(reader: BinaryReader, index: number, entry: BankEntry): string {
  const mask = reader.readU8();
  if (mask === 0) {
    reader.readBytes(24);
    return "None";
  }
  const start = reader.offset;
  let padding = 0;
  while (true) {
    if (reader.remaining < 4) {
      throw new SaveFormatError("Bank part string was truncated.");
    }
    const probe = reader.readI32();
    const abs = probe < 0 ? -probe * 2 : probe;
    if (abs < 5 || abs > 4096) {
      padding += 4;
      continue;
    }
    const saved = reader.offset;
    try {
      reader.offset = saved - 4;
      const value = reader.readString();
      if (value.length + 1 !== abs && probe >= 0) {
        // valid enough
      }
      reader.offset = saved - 4;
      break;
    } catch {
      reader.offset = saved;
      padding += 4;
      if (reader.offset - start > 24) {
        throw new SaveFormatError("Could not locate bank part string.");
      }
    }
  }
  const componentCount = padding === 8 ? 4 : 3;
  const pieces: string[] = [];
  for (let i = 0; i < componentCount; i++) {
    pieces.push(reader.readString());
  }
  if (index === 2) {
    const packed = reader.readI32() >>> 0;
    entry.quality = packed % 65536;
    entry.level = Math.floor(packed / 65536);
  }
  return pieces.join(".");
}

function readBankFooter(reader: BinaryReader, entry: BankEntry, enhanced: boolean): void {
  if (enhanced) {
    const footer = reader.readBytes(12);
    entry.equippedSlot = footer[8];
    if (entry.typeId === 1) {
      entry.quantity = reader.readI32();
      entry.junk = footer[10];
      entry.locked = footer[11];
    } else {
      entry.quantity = footer[10];
      entry.junk = footer[11];
      entry.locked = reader.readU8();
    }
    return;
  }
  const footer = reader.readBytes(10);
  entry.equippedSlot = footer[8];
  entry.quantity = entry.typeId === 1 ? reader.readI32() : reader.readU8();
}

function tryReadBankEntries(reader: BinaryReader, enhanced: boolean): BankEntry[] | null {
  try {
    const count = reader.readI32();
    const entries: BankEntry[] = [];
    for (let i = 0; i < count; i++) {
      const typeId = reader.readU8();
      if (typeId !== 1 && typeId !== 2) {
        return null;
      }
      const entry: BankEntry = {
        kind: typeId === 1 ? "weapon" : "item",
        typeId,
        parts: [],
        quantity: 0,
        quality: 0,
        equippedSlot: 0,
        level: 0,
        junk: 0,
        locked: 0,
      };
      const partCount = typeId === 1 ? 14 : 9;
      for (let p = 0; p < partCount; p++) {
        entry.parts.push(readBankPart(reader, p, entry));
      }
      readBankFooter(reader, entry, enhanced);
      entries.push(entry);
    }
    return entries;
  } catch {
    return null;
  }
}

function writeBankPart(writer: BinaryWriter, part: string, index: number, entry: BankEntry): void {
  if (part === "None") {
    writer.writeBytes(new Uint8Array(25));
    return;
  }
  writer.writeU8(32);
  const pieces = part.split(".");
  writer.writeBytes(new Uint8Array((6 - pieces.length) * 4));
  for (const piece of pieces) writer.writeString(piece);
  if (index === 2) {
    writer.writeI32(((entry.quality & 0xffff) + (entry.level & 0xffff) * 65536) | 0);
  }
}

function writeBankEntry(writer: BinaryWriter, entry: BankEntry, enhanced: boolean): void {
  writer.writeU8(entry.typeId);
  entry.parts.forEach((part, index) => writeBankPart(writer, part, index, entry));
  writer.writeBytes(new Uint8Array(8));
  writer.writeU8(entry.equippedSlot);
  writer.writeU8(1);
  if (enhanced) {
    writer.writeU8(entry.junk);
    writer.writeU8(entry.locked);
  }
  if (entry.typeId === 1) {
    writer.writeI32(entry.quantity);
  } else if (enhanced) {
    writer.writeU8(entry.locked);
  } else {
    writer.writeU8(entry.quantity);
  }
}

function writeGearValues(writer: BinaryWriter, item: GearItem, enhanced: boolean): void {
  writer.writeI32(item.quantity);
  writer.writeI32(((item.quality & 0xffff) + (item.level & 0xffff) * 65536) | 0);
  writer.writeI32(item.equippedSlot);
  if (enhanced) {
    writer.writeI32(item.junk);
    writer.writeI32(item.locked);
  }
}

function writeGearList(writer: BinaryWriter, items: GearItem[], enhanced: boolean): void {
  writer.writeI32(items.length);
  for (const item of items) {
    for (const part of item.parts) writer.writeString(part);
    writeGearValues(writer, item, enhanced);
  }
}

function splitInventory(save: WillowSaveGame): {
  items1: GearItem[];
  items2: GearItem[];
  weapons1: GearItem[];
  weapons2: GearItem[];
} {
  const items1: GearItem[] = [];
  const items2: GearItem[] = [];
  const weapons1: GearItem[] = [];
  const weapons2: GearItem[] = [];
  const useSecondary = save.dlc.hasBackpack && save.dlc.secondaryPackEnabled !== 0;
  if (!useSecondary) {
    return {
      items1: save.items,
      items2: [],
      weapons1: save.weapons,
      weapons2: [],
    };
  }
  for (const item of save.items) {
    if (item.level === 0 && !item.parts[0]?.startsWith("dlc")) items1.push(item);
    else items2.push(item);
  }
  for (const weapon of save.weapons) {
    if (weapon.level === 0 && !weapon.parts[0]?.startsWith("dlc")) weapons1.push(weapon);
    else weapons2.push(weapon);
  }
  return { items1, items2, weapons1, weapons2 };
}

export function parseSave(bytes: Uint8Array, sourceName = "Save0001.sav"): WillowSaveGame {
  const platform = detectPlatform(bytes);
  if (platform === "unknown") {
    throw new SaveFormatError(
      "This is not a Borderlands 1 WSG save. PC files start with WSG and live in Documents\\my games\\borderlands\\savedata.",
    );
  }

  const endian: ByteOrder = platform === "PC" ? "le" : "be";
  const reader = new BinaryReader(bytes, endian);
  const magicHeader = reader.readChars(3);
  let versionNumber = reader.readI32();
  if (versionNumber === 0x02000000) versionNumber = 2;
  else if (versionNumber !== 2) {
    throw new SaveFormatError(`Unsupported WSG version (${versionNumber}).`);
  }
  reader.endian = endian;

  const plyr = reader.readChars(4);
  if (plyr !== "PLYR") {
    throw new SaveFormatError("Player header does not match expected value.");
  }

  const revisionNumber = reader.readI32();
  const enhanced = revisionNumber >= 0x27;
  const classId = reader.readString();
  const level = reader.readI32();
  const experience = reader.readI32();
  const skillPoints = reader.readI32();
  const unknown1 = reader.readI32();
  const cash = reader.readI32();
  const finishedPlaythrough1 = reader.readI32();
  const skills = readSkills(reader);
  const vehicle1Color = reader.readI32();
  const vehicle2Color = reader.readI32();
  const vehicle1Type = reader.readI32();
  const vehicle2Type = reader.readI32();
  const ammoPools = readAmmo(reader);
  const items = readGearList(reader, "item", 9, enhanced);
  const backpackSize = reader.readI32();
  const equipSlots = reader.readI32();
  const weapons = readGearList(reader, "weapon", 14, enhanced);
  const { blockId: challengeBlockId, challenges } = readChallenges(reader);
  const locations = readLocations(reader);
  const currentLocation = reader.readString();
  const saveInfo1To5 = [
    reader.readI32(),
    reader.readI32(),
    reader.readI32(),
    reader.readI32(),
    reader.readI32(),
  ];
  const saveNumber = reader.readI32();
  const saveInfo7To8 = [reader.readI32(), reader.readI32()];
  const questLists = readQuests(reader);
  const totalPlayTime = reader.readI32();
  const lastPlayedDate = reader.readString();
  const characterName = reader.readString();
  const color1 = reader.readI32();
  const color2 = reader.readI32();
  const color3 = reader.readI32();
  const head = reader.readI32();
  const unknown2 = enhanced ? reader.readBytes(85) : null;
  const promoCodesUsed = reader.readIntList();
  const promoCodesRequiringNotification = reader.readIntList();
  const echoLists = readEchoes(reader);

  const dlc = emptyDlc();
  const dlcSize = reader.readI32();
  const dlcBlock = reader.readBytes(dlcSize);
  const dlcReader = new BinaryReader(dlcBlock, endian);
  while (dlcReader.remaining > 0) {
    const id = dlcReader.readI32();
    const sectionLength = dlcReader.readI32();
    const sectionStart = dlcReader.offset;
    const sectionBytes = dlcReader.slice(sectionStart, sectionStart + sectionLength);
    const sectionReader = new BinaryReader(sectionBytes, endian);
    switch (id) {
      case DLC_SECTION.bank: {
        dlc.hasBank = true;
        dlc.unknown1 = sectionReader.readU8();
        dlc.bankSize = sectionReader.readI32();
        const inventoryStart = sectionReader.offset;
        dlc.bankRaw = sectionReader.slice(inventoryStart);
        const parsed = tryReadBankEntries(new BinaryReader(dlc.bankRaw, endian), enhanced);
        dlc.bank = parsed ?? [];
        break;
      }
      case DLC_SECTION.flags: {
        dlc.hasFlags = true;
        dlc.unknown2 = sectionReader.readI32();
        dlc.unknown3 = sectionReader.readI32();
        dlc.unknown4 = sectionReader.readI32();
        dlc.skipDlc2Intro = sectionReader.readI32();
        break;
      }
      case DLC_SECTION.levelCap: {
        dlc.hasLevelCap = true;
        dlc.unknown5 = sectionReader.readU8();
        break;
      }
      case DLC_SECTION.backpack: {
        dlc.hasBackpack = true;
        dlc.secondaryPackEnabled = sectionReader.readU8();
        items.push(...readGearList(sectionReader, "item", 9, enhanced));
        weapons.push(...readGearList(sectionReader, "weapon", 14, enhanced));
        break;
      }
      default:
        dlc.extraSections.push({ id, raw: new Uint8Array(sectionBytes) });
        break;
    }
    dlcReader.offset = sectionStart + sectionLength;
  }

  const unknown3 = enhanced && !reader.eof ? reader.readBytes(reader.remaining) : enhanced ? new Uint8Array() : null;

  return {
    platform,
    endian,
    magicHeader,
    versionNumber,
    plyr,
    revisionNumber,
    classId,
    level,
    experience,
    skillPoints,
    unknown1,
    cash,
    finishedPlaythrough1,
    skills,
    vehicle1Color,
    vehicle2Color,
    vehicle1Type,
    vehicle2Type,
    ammoPools,
    items,
    backpackSize,
    equipSlots,
    weapons,
    challengeBlockId,
    challenges,
    locations,
    currentLocation,
    saveInfo1To5,
    saveNumber,
    saveInfo7To8,
    questLists,
    totalPlayTime,
    lastPlayedDate,
    characterName,
    color1,
    color2,
    color3,
    head,
    unknown2,
    promoCodesUsed,
    promoCodesRequiringNotification,
    echoLists,
    dlc,
    unknown3,
    sourceName,
  };
}

export function writeSave(save: WillowSaveGame): Uint8Array {
  const writer = new BinaryWriter();
  writer.endian = save.endian;
  const enhanced = isEnhanced(save);
  const { items1, items2, weapons1, weapons2 } = splitInventory(save);

  writer.writeChars(save.magicHeader || "WSG");
  writer.writeI32(save.versionNumber);
  writer.writeChars(save.plyr || "PLYR");
  writer.writeI32(save.revisionNumber);
  writer.writeString(save.classId);
  writer.writeI32(save.level);
  writer.writeI32(save.experience);
  writer.writeI32(save.skillPoints);
  writer.writeI32(save.unknown1);
  writer.writeI32(save.cash);
  writer.writeI32(save.finishedPlaythrough1);
  writer.writeI32(save.skills.length);
  for (const skill of save.skills) {
    writer.writeString(skill.name);
    writer.writeI32(skill.level);
    writer.writeI32(skill.experience);
    writer.writeI32(skill.inUse);
  }
  writer.writeI32(save.vehicle1Color);
  writer.writeI32(save.vehicle2Color);
  writer.writeI32(save.vehicle1Type);
  writer.writeI32(save.vehicle2Type);
  writer.writeI32(save.ammoPools.length);
  for (const pool of save.ammoPools) {
    writer.writeString(pool.resource);
    writer.writeString(pool.pool);
    writer.writeF32(pool.remaining);
    writer.writeI32(pool.upgradeLevel);
  }
  writeGearList(writer, items1, enhanced);
  writer.writeI32(save.backpackSize);
  writer.writeI32(save.equipSlots);
  writeGearList(writer, weapons1, enhanced);

  const challengeCount = save.challenges.length;
  writer.writeI32(challengeCount * 7 + 10);
  writer.writeI32(save.challengeBlockId);
  writer.writeI32(challengeCount * 7 + 2);
  writer.writeI16(challengeCount);
  for (const challenge of save.challenges) {
    writer.writeI16(challenge.id);
    writer.writeU8(challenge.typeId);
    writer.writeI32(challenge.value);
  }

  writer.writeI32(save.locations.length);
  for (const location of save.locations) writer.writeString(location);
  writer.writeString(save.currentLocation);
  for (const value of save.saveInfo1To5) writer.writeI32(value);
  writer.writeI32(save.saveNumber);
  for (const value of save.saveInfo7To8) writer.writeI32(value);

  writer.writeI32(save.questLists.length);
  for (const table of save.questLists) {
    writer.writeI32(table.index);
    writer.writeString(table.currentQuest);
    writer.writeI32(table.quests.length);
    for (const quest of table.quests) {
      writer.writeString(quest.name);
      writer.writeI32(quest.progress);
      writer.writeI32(quest.dlcValue1);
      writer.writeI32(quest.dlcValue2);
      writer.writeI32(quest.objectives.length);
      for (const objective of quest.objectives) {
        writer.writeString(objective.description);
        writer.writeI32(objective.progress);
      }
    }
  }

  writer.writeI32(save.totalPlayTime);
  writer.writeString(save.lastPlayedDate);
  writer.writeString(save.characterName);
  writer.writeI32(save.color1);
  writer.writeI32(save.color2);
  writer.writeI32(save.color3);
  writer.writeI32(save.head);
  if (enhanced) {
    writer.writeBytes(save.unknown2 ?? new Uint8Array(85));
  }
  writer.writeIntList(save.promoCodesUsed);
  writer.writeIntList(save.promoCodesRequiringNotification);
  writer.writeI32(save.echoLists.length);
  for (const table of save.echoLists) {
    writer.writeI32(table.index);
    writer.writeI32(table.echoes.length);
    for (const echo of table.echoes) {
      writer.writeString(echo.name);
      writer.writeI32(echo.dlcValue1);
      writer.writeI32(echo.dlcValue2);
    }
  }

  const dlcSections: { id: number; body: Uint8Array }[] = [];
  if (save.dlc.hasBank) {
    const body = new BinaryWriter();
    body.endian = save.endian;
    body.writeU8(save.dlc.unknown1);
    body.writeI32(save.dlc.bankSize);
    if (!save.dlc.bankDirty && save.dlc.bankRaw) {
      body.writeBytes(save.dlc.bankRaw);
    } else {
      body.writeI32(save.dlc.bank.length);
      for (const entry of save.dlc.bank) writeBankEntry(body, entry, enhanced);
    }
    dlcSections.push({ id: DLC_SECTION.bank, body: body.toUint8Array() });
  }
  if (save.dlc.hasFlags) {
    const body = new BinaryWriter();
    body.endian = save.endian;
    body.writeI32(save.dlc.unknown2);
    body.writeI32(save.dlc.unknown3);
    body.writeI32(save.dlc.unknown4);
    body.writeI32(save.dlc.skipDlc2Intro);
    dlcSections.push({ id: DLC_SECTION.flags, body: body.toUint8Array() });
  }
  if (save.dlc.hasLevelCap) {
    const body = new BinaryWriter();
    body.endian = save.endian;
    body.writeU8(save.dlc.unknown5);
    dlcSections.push({ id: DLC_SECTION.levelCap, body: body.toUint8Array() });
  }
  if (save.dlc.hasBackpack) {
    const body = new BinaryWriter();
    body.endian = save.endian;
    body.writeU8(save.dlc.secondaryPackEnabled);
    writeGearList(body, items2, enhanced);
    writeGearList(body, weapons2, enhanced);
    dlcSections.push({ id: DLC_SECTION.backpack, body: body.toUint8Array() });
  }
  for (const extra of save.dlc.extraSections) {
    dlcSections.push({ id: extra.id, body: extra.raw });
  }

  let dlcSize = 0;
  for (const section of dlcSections) dlcSize += section.body.length + 8;
  writer.writeI32(dlcSize);
  for (const section of dlcSections) {
    writer.writeI32(section.id);
    writer.writeI32(section.body.length);
    writer.writeBytes(section.body);
  }

  if (enhanced && save.unknown3) {
    writer.writeBytes(save.unknown3);
  }

  void exportValueCount;
  return writer.toUint8Array();
}

export function cloneSave(save: WillowSaveGame): WillowSaveGame {
  return structuredClone(save);
}
