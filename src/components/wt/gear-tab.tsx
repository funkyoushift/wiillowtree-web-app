"use client";

import { useMemo, useState } from "react";
import { parseGearClipboard, serializeGear } from "@/lib/clipboard";
import type { LockerEntry } from "@/lib/locker";
import type { WillowOptions } from "@/lib/options";
import { ITEM_PART_SLOTS, WEAPON_PART_SLOTS, partOptionLabel, partsForSlot } from "@/lib/parts";
import {
  ITEM_SLOTS,
  WEAPON_SLOTS,
  emptyItem,
  emptyWeapon,
  gearCategory,
  gearDisplayName,
  isEnhanced,
  prettyPart,
  rarityFromQuality,
  type BankEntry,
  type GearItem,
  type WillowSaveGame,
} from "@/lib/wsg";
import { WfButton, WfField, WfGroup, WfNumber } from "@/components/wt/widgets";

type GearKind = "weapon" | "item" | "bank" | "locker";

function listLabel(item: GearItem, options: WillowOptions): string {
  const rarity = rarityFromQuality(item.quality);
  const bits = [gearDisplayName(item) || gearCategory(item)];
  if (options.treeDepth >= 2 && options.showRarity) bits.push(rarity.label);
  if (options.treeDepth >= 2 && options.showLevel) bits.push(`L${item.level || "?"}`);
  return bits.join(" · ");
}

function sortItems(items: GearItem[], scheme: WillowOptions["sortScheme"]): number[] {
  const indexed = items.map((item, index) => ({ item, index }));
  indexed.sort((a, b) => {
    if (scheme === "level") return a.item.level - b.item.level;
    if (scheme === "quality") return b.item.quality - a.item.quality;
    if (scheme === "type") return gearCategory(a.item).localeCompare(gearCategory(b.item));
    return listLabel(a.item, { ...({} as WillowOptions), showLevel: false, showRarity: false, colorizeRarity: false, sortScheme: "name", treeDepth: 2 }).localeCompare(
      listLabel(b.item, { ...({} as WillowOptions), showLevel: false, showRarity: false, colorizeRarity: false, sortScheme: "name", treeDepth: 2 }),
    );
  });
  return indexed.map((entry) => entry.index);
}

export function GearTab({
  save,
  onChange,
  kind,
  options,
  locker,
  onLockerChange,
}: {
  save: WillowSaveGame;
  onChange: (next: WillowSaveGame) => void;
  kind: GearKind;
  options: WillowOptions;
  locker?: LockerEntry[];
  onLockerChange?: (entries: LockerEntry[]) => void;
}) {
  const [selected, setSelected] = useState(0);
  const [swapSlot, setSwapSlot] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const enhanced = isEnhanced(save);

  const list: GearItem[] =
    kind === "weapon" ? save.weapons : kind === "item" ? save.items : kind === "bank" ? save.dlc.bank : (locker ?? []).map((entry) => entry.item);

  const order = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return sortItems(list, options.sortScheme).filter((index) => {
      if (!q) return true;
      const item = list[index];
      return (
        gearDisplayName(item).toLowerCase().includes(q) ||
        gearCategory(item).toLowerCase().includes(q) ||
        item.parts.some((part) => part.toLowerCase().includes(q))
      );
    });
  }, [list, options.sortScheme, filter]);

  const item = list[selected] ?? null;
  const slots = item?.kind === "weapon" ? WEAPON_PART_SLOTS : ITEM_PART_SLOTS;
  const equipSlots = item?.kind === "weapon" ? WEAPON_SLOTS : ITEM_SLOTS;

  function replaceAt(index: number, nextItem: GearItem) {
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
    if (kind === "bank") {
      const bank = save.dlc.bank.slice();
      bank[index] = { ...nextItem, typeId: nextItem.kind === "weapon" ? 1 : 2 };
      onChange({ ...save, dlc: { ...save.dlc, bank, bankDirty: true } });
      return;
    }
    if (!locker || !onLockerChange) return;
    const next = locker.slice();
    next[index] = { ...next[index], item: nextItem };
    onLockerChange(next);
  }

  function addItem(nextItem: GearItem) {
    if (kind === "weapon") onChange({ ...save, weapons: [...save.weapons, nextItem] });
    else if (kind === "item") onChange({ ...save, items: [...save.items, nextItem] });
    else if (kind === "bank") {
      const entry: BankEntry = { ...nextItem, typeId: nextItem.kind === "weapon" ? 1 : 2 };
      onChange({ ...save, dlc: { ...save.dlc, bank: [...save.dlc.bank, entry], hasBank: true, bankDirty: true } });
    } else if (locker && onLockerChange) {
      onLockerChange([
        ...locker,
        {
          id: `${Date.now()}`,
          name: gearDisplayName(nextItem) || "Locker item",
          comment: "",
          rating: 0,
          item: nextItem,
        },
      ]);
    }
    setSelected(list.length);
  }

  function removeSelected() {
    if (!item) return;
    if (kind === "weapon") onChange({ ...save, weapons: save.weapons.filter((_, i) => i !== selected) });
    else if (kind === "item") onChange({ ...save, items: save.items.filter((_, i) => i !== selected) });
    else if (kind === "bank") {
      onChange({
        ...save,
        dlc: { ...save.dlc, bank: save.dlc.bank.filter((_, i) => i !== selected), bankDirty: true },
      });
    } else if (locker && onLockerChange) {
      onLockerChange(locker.filter((_, i) => i !== selected));
    }
    setSelected(0);
  }

  async function copySelected() {
    if (!item) return;
    await navigator.clipboard.writeText(serializeGear(item));
  }

  async function pasteItem() {
    try {
      const text = await navigator.clipboard.readText();
      addItem(parseGearClipboard(text, kind === "item" ? "item" : "weapon"));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Invalid clipboard data");
    }
  }

  function importFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.wsgitem,.wsgweapon";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        addItem(parseGearClipboard(await file.text(), kind === "item" ? "item" : "weapon"));
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Invalid import file");
      }
    };
    input.click();
  }

  function exportFile() {
    if (!item) return;
    const blob = new Blob([serializeGear(item)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${gearDisplayName(item) || kind}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function sendToLocker() {
    if (!item || !locker || !onLockerChange) return;
    onLockerChange([
      ...locker,
      {
        id: `${Date.now()}`,
        name: gearDisplayName(item) || "Locker item",
        comment: "",
        rating: 3,
        item: structuredClone(item),
      },
    ]);
  }

  function copyFromLockerToBackpack() {
    if (kind !== "locker" || !item) return;
    if (item.kind === "weapon") onChange({ ...save, weapons: [...save.weapons, structuredClone(item)] });
    else onChange({ ...save, items: [...save.items, structuredClone(item)] });
  }

  function copyFromLockerToBank() {
    if (kind !== "locker" || !item) return;
    const entry: BankEntry = { ...structuredClone(item), typeId: item.kind === "weapon" ? 1 : 2 };
    onChange({
      ...save,
      dlc: { ...save.dlc, hasBank: true, bank: [...save.dlc.bank, entry], bankDirty: true },
    });
  }

  if (kind === "bank" && !save.dlc.hasBank) {
    return (
      <div className="wf-pane">
        <p>This save has no bank section. Classic characters unlock it after The Underdome.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div className="wf-toolbar">
        <input
          className="wf-input"
          style={{ width: 180 }}
          placeholder="Filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
        <WfButton onClick={() => addItem(kind === "item" ? emptyItem() : emptyWeapon())}>New</WfButton>
        <WfButton disabled={!item} onClick={() => item && addItem(structuredClone(item))}>
          Duplicate
        </WfButton>
        <WfButton disabled={!item} onClick={removeSelected}>
          Delete
        </WfButton>
        <WfButton disabled={!item} onClick={() => void copySelected()}>
          Copy
        </WfButton>
        <WfButton onClick={() => void pasteItem()}>Paste</WfButton>
        <WfButton onClick={importFile}>Import</WfButton>
        <WfButton disabled={!item} onClick={exportFile}>
          Export
        </WfButton>
        {kind !== "locker" && (
          <WfButton disabled={!item} onClick={sendToLocker}>
            To locker
          </WfButton>
        )}
        {kind === "locker" && (
          <>
            <WfButton disabled={!item} onClick={copyFromLockerToBackpack}>
              To backpack
            </WfButton>
            <WfButton disabled={!item} onClick={copyFromLockerToBank}>
              To bank
            </WfButton>
          </>
        )}
      </div>
      <div className="wf-split">
        <div className="wf-tree">
          {order.map((index) => {
            const entry = list[index];
            const rarity = rarityFromQuality(entry.quality);
            const color = options.colorizeRarity && selected !== index ? rarity.color : undefined;
            const partSlots = entry.kind === "weapon" ? WEAPON_PART_SLOTS : ITEM_PART_SLOTS;
            return (
              <div key={`${kind}-${index}`}>
                <button
                  type="button"
                  className="wf-tree-item"
                  data-selected={selected === index && swapSlot === null}
                  style={color ? { color } : undefined}
                  onClick={() => {
                    setSelected(index);
                    setSwapSlot(null);
                  }}
                >
                  {kind === "locker" && locker?.[index] ? `${locker[index].name} — ` : ""}
                  {listLabel(entry, options)}
                </button>
                {options.treeDepth >= 3 &&
                  entry.parts.map((part, slot) => (
                    <button
                      key={`${kind}-${index}-part-${slot}`}
                      type="button"
                      className="wf-tree-item"
                      data-selected={selected === index && swapSlot === slot}
                      style={{ paddingLeft: 18 }}
                      onClick={() => {
                        setSelected(index);
                        setSwapSlot(slot);
                      }}
                    >
                      {partSlots[slot] ?? `Part ${slot}`}: {prettyPart(part) || part}
                    </button>
                  ))}
              </div>
            );
          })}
          {order.length === 0 && <div className="wf-tree-item">Empty</div>}
        </div>
        <div className="wf-pane">
          {!item ? (
            <p>Select an item.</p>
          ) : (
            <>
              {kind === "locker" && locker && onLockerChange && locker[selected] && (
                <WfGroup title="Locker">
                  <WfField label="Name">
                    <input
                      className="wf-input"
                      value={locker[selected].name}
                      onChange={(event) => {
                        const next = locker.slice();
                        next[selected] = { ...next[selected], name: event.target.value };
                        onLockerChange(next);
                      }}
                    />
                  </WfField>
                  <WfField label="Comment">
                    <textarea
                      className="wf-textarea"
                      value={locker[selected].comment}
                      onChange={(event) => {
                        const next = locker.slice();
                        next[selected] = { ...next[selected], comment: event.target.value };
                        onLockerChange(next);
                      }}
                    />
                  </WfField>
                  <WfField label="Rating">
                    <WfNumber
                      value={locker[selected].rating}
                      min={0}
                      max={5}
                      onChange={(rating) => {
                        const next = locker.slice();
                        next[selected] = { ...next[selected], rating };
                        onLockerChange(next);
                      }}
                    />
                  </WfField>
                </WfGroup>
              )}
              <WfGroup title="Values">
                <div className="wf-grid2">
                  <WfField label={item.kind === "weapon" ? "Ammo in mag" : "Quantity"}>
                    <WfNumber value={item.quantity} min={0} onChange={(quantity) => replaceAt(selected, { ...item, quantity })} />
                  </WfField>
                  <WfField label="Quality">
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={item.quality}
                      onChange={(event) => replaceAt(selected, { ...item, quality: Number(event.target.value) })}
                    />
                    <WfNumber
                      value={item.quality}
                      min={0}
                      max={20}
                      onChange={(quality) => replaceAt(selected, { ...item, quality })}
                    />
                  </WfField>
                  <WfField label="Quality (hex)">
                    <input
                      className="wf-input"
                      value={(item.quality >>> 0).toString(16)}
                      onChange={(event) =>
                        replaceAt(selected, {
                          ...item,
                          quality: Number.parseInt(event.target.value || "0", 16) || 0,
                        })
                      }
                    />
                  </WfField>
                  <WfField label="Level override">
                    <WfNumber value={item.level} min={0} max={69} onChange={(level) => replaceAt(selected, { ...item, level })} />
                  </WfField>
                  <WfField label="Level (hex)">
                    <input
                      className="wf-input"
                      value={(item.level >>> 0).toString(16)}
                      onChange={(event) =>
                        replaceAt(selected, { ...item, level: Number.parseInt(event.target.value || "0", 16) || 0 })
                      }
                    />
                  </WfField>
                  <WfField label="Equipped">
                    <select
                      className="wf-select"
                      value={String(item.equippedSlot)}
                      onChange={(event) => replaceAt(selected, { ...item, equippedSlot: Number(event.target.value) })}
                    >
                      {equipSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </WfField>
                  {enhanced && (
                    <>
                      <WfField label="Junk">
                        <select
                          className="wf-select"
                          value={String(item.junk)}
                          onChange={(event) => replaceAt(selected, { ...item, junk: Number(event.target.value) })}
                        >
                          <option value="0">No</option>
                          <option value="1">Yes</option>
                        </select>
                      </WfField>
                      <WfField label="Locked">
                        <select
                          className="wf-select"
                          value={String(item.locked)}
                          onChange={(event) => replaceAt(selected, { ...item, locked: Number(event.target.value) })}
                        >
                          <option value="0">No</option>
                          <option value="1">Yes</option>
                        </select>
                      </WfField>
                    </>
                  )}
                </div>
              </WfGroup>
              <WfGroup title="Parts">
                {item.parts.map((part, slot) => (
                  <div key={`${slot}-${part}`} style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
                    <span style={{ width: 90 }}>{slots[slot] ?? `Part ${slot}`}</span>
                    <input className="wf-input" style={{ flex: 1 }} value={part} readOnly />
                    <WfButton onClick={() => setSwapSlot(slot)}>Swap Part</WfButton>
                  </div>
                ))}
              </WfGroup>
            </>
          )}
        </div>
      </div>
      {swapSlot !== null && item && (
        <div className="wf-dialog" role="dialog">
          <div className="wf-dialog-box">
            <div className="wf-caption">Swap Part — {slots[swapSlot]}</div>
            <div className="wf-pane">
              <select
                className="wf-select"
                size={16}
                style={{ width: "100%", height: 280 }}
                value={item.parts[swapSlot]}
                onChange={(event) => {
                  const parts = item.parts.slice();
                  parts[swapSlot] = event.target.value;
                  replaceAt(selected, { ...item, parts });
                }}
              >
                {partsForSlot(item.kind, swapSlot, item.parts[swapSlot]).map((id) => (
                  <option key={id} value={id}>
                    {partOptionLabel(id)}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 6 }}>
                <WfButton defaultBtn onClick={() => setSwapSlot(null)}>
                  Close
                </WfButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
