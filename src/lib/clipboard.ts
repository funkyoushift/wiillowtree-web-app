import type { GearItem } from "@/lib/wsg/types";

export function serializeGear(item: GearItem): string {
  const lines = item.parts.slice();
  while (lines.length < (item.kind === "weapon" ? 14 : 9)) lines.push("None");
  lines.push(String(item.quantity), String(item.quality), String(item.equippedSlot), String(item.level));
  if (item.junk || item.locked) {
    lines.push(String(item.junk), String(item.locked));
  }
  return lines.join("\n");
}

export function parseGearClipboard(text: string, kind: GearItem["kind"]): GearItem {
  const lines = text
    .replace(/\r\n/g, "\n")
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const partCount = kind === "weapon" ? 14 : 9;
  if (lines.length < partCount + 3) {
    throw new Error("Invalid clipboard data");
  }
  const parts = lines.slice(0, partCount).map((part) => part || "None");
  const numbers = lines.slice(partCount).map((value) => Number(value));
  if (numbers.some((value) => Number.isNaN(value))) {
    throw new Error("Invalid clipboard data");
  }
  return {
    kind,
    parts,
    quantity: numbers[0] ?? 0,
    quality: numbers[1] ?? 0,
    equippedSlot: numbers[2] ?? 0,
    level: numbers[3] ?? 0,
    junk: numbers[4] ?? 0,
    locked: numbers[5] ?? 0,
  };
}
