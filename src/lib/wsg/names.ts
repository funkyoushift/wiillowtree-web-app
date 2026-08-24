import echoNames from "@/data/echo-names.json";
import locationNames from "@/data/location-names.json";
import partNamesA from "@/data/part-names.json";
import partNamesB from "@/data/part-names-b.json";
import questNames from "@/data/quest-names.json";
import skillNames from "@/data/skill-names.json";
import type { GearItem } from "./types";

const partNames = { ...partNamesA, ...partNamesB };

const PARTS = partNames as Record<string, string>;
const SKILLS = skillNames as Record<string, { name: string; description: string }>;
const LOCATIONS = locationNames as Record<string, string>;
const QUESTS = questNames as Record<string, { name: string; summary: string; giver: string }>;
const ECHOES = echoNames as Record<string, string>;

export function prettyPart(part: string): string {
  if (!part || part === "None") return "";
  return PARTS[part] ?? "";
}

export function prettySkill(id: string): { name: string; description: string } {
  return SKILLS[id] ?? { name: lastToken(id), description: "" };
}

export function prettyLocation(id: string): string {
  return LOCATIONS[id] ?? lastToken(id);
}

export function prettyQuest(id: string): { name: string; summary: string; giver: string } {
  return QUESTS[id] ?? { name: lastToken(id), summary: "", giver: "" };
}

export function prettyEcho(id: string): string {
  return ECHOES[id] ?? lastToken(id);
}

export function lastToken(id: string): string {
  const piece = id.split(".").pop() ?? id;
  return piece.replace(/_/g, " ");
}

export function gearDisplayName(item: GearItem): string {
  if (item.kind === "weapon") {
    const prefix = prettyPart(item.parts[12] ?? "");
    const title = prettyPart(item.parts[13] ?? "");
    const manufacturer = prettyPart(item.parts[1] ?? "");
    const composed = [manufacturer, prefix, title].filter(Boolean).join(" ");
    return composed || lastToken(item.parts[2] ?? "Weapon");
  }
  const prefix = prettyPart(item.parts[7] ?? "");
  const title = prettyPart(item.parts[8] ?? "");
  const composed = [prefix, title].filter(Boolean).join(" ");
  return composed || lastToken(item.parts[1] ?? "Item");
}

export function gearCategory(item: GearItem): string {
  const source = item.kind === "weapon" ? item.parts[2] : item.parts[1];
  const id = source ?? "";
  if (id.includes("shield")) return "Shield";
  if (id.includes("CommandDeck") || id.includes("ClassMod")) return "Class Mod";
  if (id.includes("grenade") || id.includes("Grenade")) return "Grenade";
  if (id.includes("repeater") || id.includes("Revolver") || id.includes("machine_pistol")) return "Pistol";
  if (id.includes("shotgun")) return "Shotgun";
  if (id.includes("sniper")) return "Sniper";
  if (id.includes("smg") || id.includes("patrol")) return "SMG";
  if (id.includes("rocket") || id.includes("grenade_launcher")) return "Launcher";
  if (id.includes("combat_rifle") || id.includes("assault") || id.includes("alien") || id.includes("support_machine")) {
    return "Rifle";
  }
  if (id.includes("StorageDeck") || id.includes("BankUpgrade")) return "Upgrade";
  return item.kind === "weapon" ? "Weapon" : "Item";
}

export function rarityFromQuality(quality: number): { label: string; className: string; color: string } {
  if (quality >= 8) return { label: "Legendary", className: "text-orange-400", color: "#ff8000" };
  if (quality >= 5) return { label: "Epic", className: "text-purple-400", color: "#a335ee" };
  if (quality >= 3) return { label: "Rare", className: "text-blue-400", color: "#0070dd" };
  if (quality >= 1) return { label: "Uncommon", className: "text-lime-400", color: "#1eff00" };
  return { label: "Common", className: "text-zinc-300", color: "#000000" };
}

export function allPartIds(): string[] {
  return Object.keys(PARTS);
}

export function allSkillIds(): string[] {
  return Object.keys(SKILLS);
}

export function allLocationIds(): string[] {
  return Object.keys(LOCATIONS).filter((id) => id !== "_root");
}

export function allQuestIds(): string[] {
  return Object.keys(QUESTS);
}

export function allEchoIds(): string[] {
  return Object.keys(ECHOES);
}
