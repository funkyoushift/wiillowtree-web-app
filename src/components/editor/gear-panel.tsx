"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect, NumberField, PanelIntro } from "@/components/editor/fields";
import { Badge } from "@/components/ui/badge";
import {
  ITEM_SLOTS,
  WEAPON_SLOTS,
  gearCategory,
  gearDisplayName,
  isEnhanced,
  rarityFromQuality,
  type GearItem,
  type WillowSaveGame,
} from "@/lib/wsg";

function GearEditor({
  item,
  enhanced,
  onChange,
}: {
  item: GearItem;
  enhanced: boolean;
  onChange: (item: GearItem) => void;
}) {
  const slots = item.kind === "weapon" ? WEAPON_SLOTS : ITEM_SLOTS;
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label={item.kind === "weapon" ? "Ammo in mag" : "Quantity"}
          value={item.quantity}
          min={0}
          onChange={(quantity) => onChange({ ...item, quantity })}
        />
        <NumberField
          label="Quality"
          value={item.quality}
          min={0}
          max={20}
          onChange={(quality) => onChange({ ...item, quality })}
        />
        <NumberField
          label="Level override"
          value={item.level}
          min={0}
          max={69}
          onChange={(level) => onChange({ ...item, level })}
        />
        <Field label="Equipped">
          <NativeSelect
            value={String(item.equippedSlot)}
            onChange={(event) => onChange({ ...item, equippedSlot: Number(event.target.value) })}
          >
            {!slots.some((slot) => slot.value === item.equippedSlot) && (
              <option value={item.equippedSlot}>Slot {item.equippedSlot}</option>
            )}
            {slots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {enhanced && (
          <>
            <Field label="Junk">
              <NativeSelect
                value={String(item.junk)}
                onChange={(event) => onChange({ ...item, junk: Number(event.target.value) })}
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </NativeSelect>
            </Field>
            <Field label="Locked">
              <NativeSelect
                value={String(item.locked)}
                onChange={(event) => onChange({ ...item, locked: Number(event.target.value) })}
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </NativeSelect>
            </Field>
          </>
        )}
      </div>
      <div>
        <div className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Parts
        </div>
        <ol className="grid gap-1 font-mono text-xs break-all text-muted-foreground">
          {item.parts.map((part, index) => (
            <li key={`${part}-${index}`}>{part}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function GearPanel({
  save,
  onChange,
  kind,
}: {
  save: WillowSaveGame;
  onChange: (next: WillowSaveGame) => void;
  kind: "weapon" | "item" | "bank";
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const enhanced = isEnhanced(save);

  const list: GearItem[] =
    kind === "weapon" ? save.weapons : kind === "item" ? save.items : save.dlc.bank;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (!q) return true;
        return (
          gearDisplayName(item).toLowerCase().includes(q) ||
          gearCategory(item).toLowerCase().includes(q) ||
          item.parts.some((part) => part.toLowerCase().includes(q))
        );
      });
  }, [list, query]);

  const title = kind === "weapon" ? "Weapons" : kind === "item" ? "Items" : "Bank";
  const intro =
    kind === "weapon"
      ? "Backpack and equipped guns. Quality is the WillowTree rarity index; level 0 means the item grade decides the level."
      : kind === "item"
        ? "Shields, grenades, class mods, and upgrades."
        : "Mad Moxxi's Underdome bank. Size is on the Vault Hunter tab. Bank parts use a packed format, so keep a backup if you rewrite entries.";

  const updateAt = (index: number, nextItem: GearItem) => {
    if (kind === "weapon") {
      const weapons = save.weapons.slice();
      weapons[index] = nextItem;
      onChange({ ...save, weapons });
      return;
    }
    if (kind === "item") {
      const items = save.items.slice();
      items[index] = nextItem;
      onChange({ ...save, items });
      return;
    }
    const bank = save.dlc.bank.slice();
    bank[index] = { ...nextItem, typeId: save.dlc.bank[index].typeId };
    onChange({ ...save, dlc: { ...save.dlc, bank, bankDirty: true } });
  };

  const selectedItem = selected === null ? null : list[selected];

  return (
    <div>
      <PanelIntro title={title}>{intro}</PanelIntro>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder={`Search ${title.toLowerCase()}…`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {filtered.length} / {list.length}
        </div>
      </div>
      {kind === "bank" && save.dlc.bank.length === 0 && save.dlc.hasBank && (
        <p className="mb-4 text-sm text-muted-foreground">
          {save.dlc.bankRaw
            ? "The bank section is present but its packed items could not be decoded. Bank size can still be changed. Items will be left as they were."
            : "Bank is empty."}
        </p>
      )}
      {kind === "bank" && !save.dlc.hasBank && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            This save has no bank section. Classic characters unlock it after The Underdome.
          </CardContent>
        </Card>
      )}
      {list.length === 0 && (kind !== "bank" || save.dlc.hasBank) ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nothing stored here yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map(({ item, index }) => {
            const rarity = rarityFromQuality(item.quality);
            return (
              <button
                key={`${kind}-${index}`}
                type="button"
                className="rounded-lg border border-border bg-card px-3 py-3 text-left transition hover:border-primary/60"
                onClick={() => setSelected(index)}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className={`font-medium ${rarity.className}`}>{gearDisplayName(item)}</div>
                    <div className="text-xs text-muted-foreground">
                      {gearCategory(item)} · Q{item.quality}
                      {item.level ? ` · L${item.level}` : ""} ·{" "}
                      {item.kind === "weapon" ? `${item.quantity} ammo` : `x${item.quantity}`}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {item.equippedSlot > 0 && <Badge variant="secondary">Equipped</Badge>}
                    {item.locked === 1 && <Badge variant="outline">Locked</Badge>}
                    {item.junk === 1 && <Badge variant="outline">Junk</Badge>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={selectedItem !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {selectedItem && selected !== null && (
            <>
              <DialogHeader>
                <DialogTitle className={rarityFromQuality(selectedItem.quality).className}>
                  {gearDisplayName(selectedItem)}
                </DialogTitle>
                <DialogDescription>{gearCategory(selectedItem)}</DialogDescription>
              </DialogHeader>
              <GearEditor
                item={selectedItem}
                enhanced={enhanced}
                onChange={(next) => updateAt(selected, next)}
              />
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                  Done
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
