import { CLASSES } from "./game-data";
import type { BankEntry, GearItem, WillowSaveGame } from "./types";

function item(overrides: Partial<GearItem> = {}): GearItem {
  return {
    kind: "item",
    parts: [
      "gd_itemgrades.ItemGrade_01",
      "gd_shields.A_Item.Item_Shield",
      "gd_shields.Body.body1",
      "None",
      "None",
      "gd_shields.Material.Material1",
      "gd_manufacturers.Manufacturers.Pangolin",
      "gd_shields.Prefix.Prefix_Max1_Reinforced",
      "gd_shields.Title.Title_Shield",
    ],
    quantity: 1,
    quality: 5,
    equippedSlot: 1,
    level: 0,
    junk: 0,
    locked: 0,
    ...overrides,
  };
}

function weapon(overrides: Partial<GearItem> = {}): GearItem {
  return {
    kind: "weapon",
    parts: [
      "gd_itemgrades.ItemGrade_04",
      "gd_manufacturers.Manufacturers.Jakobs",
      "gd_weap_repeater_pistol.A_Weapon.WeaponType_repeater_pistol",
      "gd_weap_repeater_pistol.Body.body1",
      "gd_weap_repeater_pistol.Grip.grip3",
      "gd_weap_repeater_pistol.mag.mag2",
      "gd_weap_repeater_pistol.Barrel.barrel3",
      "gd_weap_repeater_pistol.Sight.sight3",
      "None",
      "gd_weap_repeater_pistol.Action.action1",
      "None",
      "gd_weap_repeater_pistol.Material.Material3",
      "gd_weap_names_shared.Prefix.Prefix_Uncommon",
      "gd_weap_repeater_pistol.Title.Title_Repeater",
    ],
    quantity: 18,
    quality: 3,
    equippedSlot: 1,
    level: 0,
    junk: 0,
    locked: 0,
    ...overrides,
  };
}

export function createDemoSave(options?: {
  enhanced?: boolean;
  platform?: "PC" | "PS3" | "Xbox360";
}): WillowSaveGame {
  const enhanced = options?.enhanced ?? true;
  const platform = options?.platform ?? "PC";
  return {
    platform,
    endian: platform === "PC" ? "le" : "be",
    magicHeader: "WSG",
    versionNumber: 2,
    plyr: "PLYR",
    revisionNumber: enhanced ? 0x27 : 0x20,
    classId: CLASSES[0].id,
    level: 35,
    experience: 1263343,
    skillPoints: 12,
    unknown1: 0,
    cash: 250000,
    finishedPlaythrough1: 1,
    skills: [
      {
        name: "gd_skills2_Roland.Action.A_DeployScorpio",
        level: 1,
        experience: 0,
        inUse: 1,
      },
      {
        name: "gd_skills2_Roland.Infantry.Assault",
        level: 5,
        experience: 0,
        inUse: 0,
      },
    ],
    vehicle1Color: 4,
    vehicle2Color: 6,
    vehicle1Type: 1,
    vehicle2Type: 0,
    ammoPools: [
      {
        resource: "d_resources.AmmoResources.Ammo_Repeater_Pistol",
        pool: "d_resourcepools.AmmoPools.Ammo_Repeater_Pistol_Pool",
        remaining: 270,
        upgradeLevel: 4,
      },
      {
        resource: "d_resources.AmmoResources.Ammo_Combat_Rifle",
        pool: "d_resourcepools.AmmoPools.Ammo_Combat_Rifle_Pool",
        remaining: 280,
        upgradeLevel: 3,
      },
    ],
    items: [item()],
    backpackSize: 36,
    equipSlots: 4,
    weapons: [weapon(), weapon({ equippedSlot: 0, quality: 8, quantity: 6 })],
    challengeBlockId: 0,
    challenges: [{ id: 0x65f, typeId: 1, value: 142 }],
    locations: ["Fyrestone", "HeadstoneMine", "NewHaven"],
    currentLocation: "NewHaven",
    saveInfo1To5: [0, 0, 0, 0, 0],
    saveNumber: 1,
    saveInfo7To8: [0, 0],
    questLists: [
      {
        index: 0,
        currentQuest: "Z0_Missions.Missions.M_KillSledge",
        quests: [
          {
            name: "Z0_Missions.Missions.M_KillSledge",
            progress: 1,
            dlcValue1: 0,
            dlcValue2: 0,
            objectives: [{ description: "Sledge killed", progress: 0 }],
          },
        ],
      },
    ],
    totalPlayTime: 36_000,
    lastPlayedDate: "20100412153000",
    characterName: "Roland",
    color1: 0xff3366cc,
    color2: 0xffcc9933,
    color3: 0xffffffff,
    head: 0,
    unknown2: enhanced ? new Uint8Array(85) : null,
    promoCodesUsed: [],
    promoCodesRequiringNotification: [],
    echoLists: [
      {
        index: 0,
        echoes: [{ name: "Z0_Echos.ClapTrap.Z0E_Badass", dlcValue1: 0, dlcValue2: 0 }],
      },
    ],
    dlc: {
      hasBank: true,
      hasFlags: true,
      hasLevelCap: true,
      hasBackpack: true,
      unknown1: 1,
      bankSize: 42,
      bank: [
        {
          ...weapon({ equippedSlot: 0, quality: 4, quantity: 12 }),
          typeId: 1,
        } satisfies BankEntry,
      ],
      bankRaw: null,
      bankDirty: true,
      unknown2: 1,
      unknown3: 1,
      unknown4: 1,
      skipDlc2Intro: 1,
      unknown5: 1,
      secondaryPackEnabled: 1,
      extraSections: [],
    },
    unknown3: enhanced ? new Uint8Array(16) : null,
    sourceName: "Save0001.sav",
    parsedLength: 0,
    xboxPackage: null,
  };
}

export function emptyWeapon(): GearItem {
  return weapon({ equippedSlot: 0, parts: weapon().parts.slice() });
}

export function emptyItem(): GearItem {
  return item({ equippedSlot: 0, parts: item().parts.slice() });
}
