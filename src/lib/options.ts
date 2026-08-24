export interface WillowOptions {
  colorizeRarity: boolean;
  showLevel: boolean;
  showRarity: boolean;
  sortScheme: "name" | "level" | "quality" | "type";
  treeDepth: 1 | 2 | 3;
}

const KEY = "willowtree-options-v1";

export const DEFAULT_OPTIONS: WillowOptions = {
  colorizeRarity: false,
  showLevel: false,
  showRarity: false,
  sortScheme: "name",
  treeDepth: 2,
};

export function loadOptions(): WillowOptions {
  if (typeof localStorage === "undefined") return { ...DEFAULT_OPTIONS };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_OPTIONS, ...(JSON.parse(raw) as WillowOptions) } : { ...DEFAULT_OPTIONS };
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
}

export function saveOptions(options: WillowOptions): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(options));
}
