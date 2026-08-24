import type { GearItem } from "@/lib/wsg/types";

export interface LockerEntry {
  id: string;
  name: string;
  comment: string;
  rating: number;
  item: GearItem;
}

const FILE_NAME = "willowtree-locker.json";
const STORAGE_KEY = "willowtree-locker-v1";

function fallbackLoad(): LockerEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LockerEntry[]) : [];
  } catch {
    return [];
  }
}

function fallbackSave(entries: LockerEntry[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

async function opfsFile(write: boolean): Promise<FileSystemFileHandle | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.getDirectory) return null;
  const root = await navigator.storage.getDirectory();
  return root.getFileHandle(FILE_NAME, { create: write });
}

export async function loadLocker(): Promise<LockerEntry[]> {
  try {
    const handle = await opfsFile(false);
    if (!handle) return fallbackLoad();
    const file = await handle.getFile();
    const text = await file.text();
    return text ? (JSON.parse(text) as LockerEntry[]) : [];
  } catch {
    return fallbackLoad();
  }
}

export async function saveLocker(entries: LockerEntry[]): Promise<void> {
  fallbackSave(entries);
  try {
    const handle = await opfsFile(true);
    if (!handle) return;
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(entries, null, 2));
    await writable.close();
  } catch {
    // localStorage already written
  }
}

export function serializeLockerFile(entries: LockerEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function parseLockerFile(text: string): LockerEntry[] {
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Locker file is not a list.");
  return parsed.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new Error(`Locker entry ${index} is invalid.`);
    const entry = raw as Partial<LockerEntry>;
    const item = entry.item;
    if (!item || !Array.isArray(item.parts) || (item.kind !== "weapon" && item.kind !== "item")) {
      throw new Error(`Locker entry ${index} is missing gear data.`);
    }
    return {
      id: String(entry.id || newLockerId()),
      name: String(entry.name || "Locker item"),
      comment: String(entry.comment || ""),
      rating: Number(entry.rating) || 0,
      item,
    };
  });
}

export function newLockerId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
