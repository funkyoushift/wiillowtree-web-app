import { describe, expect, it } from "vitest";
import { parseGearClipboard, serializeGear } from "./clipboard";
import { emptyWeapon } from "./wsg/factory";

describe("gear clipboard", () => {
  it("round-trips a weapon in WillowTree text format", () => {
    const weapon = emptyWeapon();
    weapon.quantity = 1;
    weapon.quality = 5;
    weapon.level = 63;
    const parsed = parseGearClipboard(serializeGear(weapon), "weapon");
    expect(parsed.parts[0]).toBe(weapon.parts[0]);
    expect(parsed.quality).toBe(5);
    expect(parsed.level).toBe(63);
  });

  it("parses a Gear Calculator style dump", () => {
    const text = [
      "gd_itemgrades.ItemGrade_04",
      "gd_manufacturers.Manufacturers.Atlas",
      "gd_weap_support_machinegun.A_Weapon.WeaponType_support_machinegun",
      "gd_weap_combat_rifle.Body.body5",
      "gd_weap_combat_rifle.Grip.grip5",
      "gd_weap_support_machinegun.mag.mag5",
      "dlc3_gd_weap_UniqueParts.SupportMachineGun.barrel5_AjaxSpear",
      "gd_weap_support_machinegun.Sight.sight1",
      "gd_weap_combat_rifle.Stock.stock5",
      "None",
      "gd_weap_combat_rifle.acc.acc3_Shock",
      "dlc3_gd_weap_UniqueParts.SupportMachineGun.AjaxSpear_Material",
      "gd_weap_names_shared.Prefix.PrefixU_blank",
      "dlc3_gd_weap_UniqueParts.Title.TitleU_SupportMG_AjaxsSpear",
      "1",
      "5",
      "0",
      "63",
    ].join("\n");
    const parsed = parseGearClipboard(text, "weapon");
    expect(parsed.parts).toHaveLength(14);
    expect(parsed.quantity).toBe(1);
    expect(parsed.quality).toBe(5);
    expect(parsed.level).toBe(63);
  });

  it("rejects truncated clipboard data", () => {
    expect(() => parseGearClipboard("None\nNone", "weapon")).toThrow(/Invalid clipboard data/);
  });
});
