import type { ByteOrder } from "./binary";

export const ENHANCED_REVISION = 0x27;

export const DLC_SECTION = {
  bank: 0x43211234,
  flags: 0x02151984,
  levelCap: 0x32235947,
  backpack: 0x234ba901,
} as const;

export type Platform = "PC" | "PS3" | "Xbox360";

export interface XboxPackage {
  bytes: Uint8Array;
  innerOffset: number;
  innerLength: number;
  magic: string;
}

export interface Skill {
  name: string;
  level: number;
  experience: number;
  inUse: number;
}

export interface AmmoPool {
  resource: string;
  pool: string;
  remaining: number;
  upgradeLevel: number;
}

export interface GearItem {
  kind: "item" | "weapon";
  parts: string[];
  quantity: number;
  quality: number;
  equippedSlot: number;
  level: number;
  junk: number;
  locked: number;
}

export interface ChallengeEntry {
  id: number;
  typeId: number;
  value: number;
}

export interface QuestObjective {
  description: string;
  progress: number;
}

export interface QuestEntry {
  name: string;
  progress: number;
  dlcValue1: number;
  dlcValue2: number;
  objectives: QuestObjective[];
}

export interface QuestTable {
  index: number;
  currentQuest: string;
  quests: QuestEntry[];
}

export interface EchoEntry {
  name: string;
  dlcValue1: number;
  dlcValue2: number;
}

export interface EchoTable {
  index: number;
  echoes: EchoEntry[];
}

export interface BankEntry extends GearItem {
  typeId: 1 | 2;
}

export interface DlcSection {
  id: number;
  raw: Uint8Array;
}

export interface WillowSaveGame {
  platform: Platform;
  endian: ByteOrder;
  magicHeader: string;
  versionNumber: number;
  plyr: string;
  revisionNumber: number;
  classId: string;
  level: number;
  experience: number;
  skillPoints: number;
  unknown1: number;
  cash: number;
  finishedPlaythrough1: number;
  skills: Skill[];
  vehicle1Color: number;
  vehicle2Color: number;
  vehicle1Type: number;
  vehicle2Type: number;
  ammoPools: AmmoPool[];
  items: GearItem[];
  backpackSize: number;
  equipSlots: number;
  weapons: GearItem[];
  challengeBlockId: number;
  challenges: ChallengeEntry[];
  locations: string[];
  currentLocation: string;
  saveInfo1To5: number[];
  saveNumber: number;
  saveInfo7To8: number[];
  questLists: QuestTable[];
  totalPlayTime: number;
  lastPlayedDate: string;
  characterName: string;
  color1: number;
  color2: number;
  color3: number;
  head: number;
  unknown2: Uint8Array | null;
  promoCodesUsed: number[];
  promoCodesRequiringNotification: number[];
  echoLists: EchoTable[];
  dlc: {
    hasBank: boolean;
    hasFlags: boolean;
    hasLevelCap: boolean;
    hasBackpack: boolean;
    unknown1: number;
    bankSize: number;
    bank: BankEntry[];
    bankRaw: Uint8Array | null;
    bankDirty: boolean;
    unknown2: number;
    unknown3: number;
    unknown4: number;
    skipDlc2Intro: number;
    unknown5: number;
    secondaryPackEnabled: number;
    extraSections: DlcSection[];
  };
  unknown3: Uint8Array | null;
  sourceName: string;
  parsedLength: number;
  xboxPackage: XboxPackage | null;
}

export function isEnhanced(save: Pick<WillowSaveGame, "revisionNumber">): boolean {
  return save.revisionNumber >= ENHANCED_REVISION;
}

export function exportValueCount(save: Pick<WillowSaveGame, "revisionNumber">): number {
  return isEnhanced(save) ? 6 : 4;
}
