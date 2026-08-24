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
