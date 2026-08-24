export const CLASSES = [
  {
    id: "gd_Roland.Character.CharacterClass_Roland",
    name: "Roland",
    title: "Soldier",
  },
  {
    id: "gd_lilith.Character.CharacterClass_Lilith",
    name: "Lilith",
    title: "Siren",
  },
  {
    id: "gd_mordecai.Character.CharacterClass_Mordecai",
    name: "Mordecai",
    title: "Hunter",
  },
  {
    id: "gd_Brick.Character.CharacterClass_Brick",
    name: "Brick",
    title: "Berserker",
  },
] as const;

export const XP_CHART = [
  0, 0, 358, 1241, 2850, 5376, 8997, 13886, 20208, 28126, 37798, 49377, 63016, 78861, 97061,
  117757, 141092, 167207, 196238, 228322, 263595, 302190, 344238, 389873, 439222, 492414,
  549578, 610840, 676325, 746158, 820463, 899363, 982980, 1071436, 1164850, 1263343, 1367034,
  1476041, 1590483, 1710476, 1836137, 1967582, 2104926, 2248285, 2397772, 2553561, 2715586,
  2884139, 3059273, 3241098, 3429728, 3628272, 3827841, 4037544, 4254492, 4478793, 4710557,
  4949891, 5196904, 5451702, 5714395, 5985086, 6263885, 6550897, 6846227, 7149982, 7462266,
  7783184, 8112840, 8451340, 2147483647,
];

export const LIMITS = {
  maxCash: 1_000_000_000,
  maxExperience: 8_451_341,
  maxLevel: 69,
  maxBackpack: 1000,
  maxBank: 1000,
  maxSkillPoints: 500,
};

export const VEHICLE_COLORS = [
  "Range Racer",
  "Vehicle X",
  "Blue Sky",
  "Mean Green",
  "Blaster Master",
  "General Flee",
  "Fuego",
  "Flamingo",
];

export const VEHICLE_TYPES = ["Rocket Launcher", "Machine Gun"];

export const AMMO_LABELS: Record<string, string> = {
  "d_resources.AmmoResources.Ammo_Sniper_Rifle": "Sniper Rifle",
  "d_resources.AmmoResources.Ammo_Repeater_Pistol": "Repeater Pistol",
  "d_resources.AmmoResources.Ammo_Grenade_Protean": "Protean Grenades",
  "d_resources.AmmoResources.Ammo_Patrol_SMG": "Patrol SMG",
  "d_resources.AmmoResources.Ammo_Combat_Shotgun": "Combat Shotgun",
  "d_resources.AmmoResources.Ammo_Combat_Rifle": "Combat Rifle",
  "d_resources.AmmoResources.Ammo_Revolver_Pistol": "Revolver Pistol",
  "d_resources.AmmoResources.Ammo_Rocket_Launcher": "Rocket Launcher",
};

export const AMMO_MAX: Record<string, number> = {
  "d_resources.AmmoResources.Ammo_Sniper_Rifle": 84,
  "d_resources.AmmoResources.Ammo_Repeater_Pistol": 540,
  "d_resources.AmmoResources.Ammo_Grenade_Protean": 9,
  "d_resources.AmmoResources.Ammo_Patrol_SMG": 1080,
  "d_resources.AmmoResources.Ammo_Combat_Shotgun": 240,
  "d_resources.AmmoResources.Ammo_Combat_Rifle": 420,
  "d_resources.AmmoResources.Ammo_Revolver_Pistol": 180,
  "d_resources.AmmoResources.Ammo_Rocket_Launcher": 36,
};

export const WEAPON_SLOTS = [
  { value: 0, label: "Backpack" },
  { value: 1, label: "Slot 1" },
  { value: 2, label: "Slot 2" },
  { value: 3, label: "Slot 3" },
  { value: 4, label: "Slot 4" },
];

export const ITEM_SLOTS = [
  { value: 0, label: "Backpack" },
  { value: 1, label: "Equipped" },
];

export function classLabel(classId: string): string {
  const found = CLASSES.find((entry) => entry.id === classId);
  return found ? `${found.name} · ${found.title}` : classId;
}

export function xpForLevel(level: number): number {
  const index = Math.min(Math.max(level, 1), XP_CHART.length - 1);
  return XP_CHART[index];
}

export function ammoLabel(resource: string): string {
  return AMMO_LABELS[resource] ?? resource.split(".").pop()?.replace(/_/g, " ") ?? resource;
}

export function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatLastPlayed(stamp: string): string {
  if (!/^\d{14}$/.test(stamp)) return stamp || "Unknown";
  const year = stamp.slice(0, 4);
  const month = stamp.slice(4, 6);
  const day = stamp.slice(6, 8);
  const hour = stamp.slice(8, 10);
  const minute = stamp.slice(10, 12);
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function rgbaFromInt(value: number): string {
  const r = value & 0xff;
  const g = (value >>> 8) & 0xff;
  const b = (value >>> 16) & 0xff;
  const a = (value >>> 24) & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
}
