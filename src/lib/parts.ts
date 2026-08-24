import { allPartIds, prettyPart } from "@/lib/wsg/names";

export const WEAPON_PART_SLOTS = [
  "Item Grade",
  "Manufacturer",
  "Type",
  "Body",
  "Grip",
  "Magazine",
  "Barrel",
  "Sight",
  "Stock",
  "Action",
  "Accessory",
  "Material",
  "Prefix",
  "Title",
] as const;

export const ITEM_PART_SLOTS = [
  "Item Grade",
  "Type",
  "Body",
  "Left",
  "Right",
  "Material",
  "Manufacturer",
  "Prefix",
  "Title",
] as const;

const WEAPON_HINTS = [
  ["itemgrade", "ItemGrade"],
  ["Manufacturers", "manufacturers"],
  ["WeaponType", "A_Weapon", "weap_"],
  ["Body", ".body"],
  ["Grip", ".grip"],
  ["mag.", ".mag"],
  ["Barrel", ".barrel"],
  ["Sight", ".sight"],
  ["Stock", ".stock"],
  ["Action", ".action"],
  ["acc.", ".acc", "Accessory"],
  ["Material"],
  ["Prefix"],
  ["Title"],
];

const ITEM_HINTS = [
  ["itemgrade", "ItemGrade"],
  ["A_Item", "Item_Shield", "CommandDeck", "grenade", "StorageDeck", "tunercuffs"],
  ["Body", ".body"],
  ["Left", "left"],
  ["Right", "right"],
  ["Material"],
  ["Manufacturers", "manufacturers"],
  ["Prefix"],
  ["Title"],
];

const ALL_PARTS = allPartIds();

export function partsForSlot(kind: "weapon" | "item", slot: number, current: string): string[] {
  const hints = (kind === "weapon" ? WEAPON_HINTS : ITEM_HINTS)[slot] ?? [];
  const matched = ALL_PARTS.filter((id) => hints.some((hint) => id.includes(hint)));
  const unique = new Set(["None", current, ...matched.filter(Boolean)]);
  return [...unique];
}

export function partOptionLabel(id: string): string {
  if (!id || id === "None") return "None";
  const pretty = prettyPart(id);
  return pretty ? `${pretty}  (${id})` : id;
}
