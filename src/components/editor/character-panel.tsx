"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect, NumberField, PanelIntro } from "@/components/editor/fields";
import {
  CLASSES,
  LIMITS,
  VEHICLE_COLORS,
  VEHICLE_TYPES,
  formatLastPlayed,
  formatPlayTime,
  isEnhanced,
  prettyLocation,
  xpForLevel,
  type WillowSaveGame,
} from "@/lib/wsg";

export function CharacterPanel({
  save,
  onChange,
}: {
  save: WillowSaveGame;
  onChange: (next: WillowSaveGame) => void;
}) {
  const patch = (partial: Partial<WillowSaveGame>) => onChange({ ...save, ...partial });

  return (
    <div>
      <PanelIntro title="Vault Hunter">
        Name, class, level, cash, and travel data. Changing level also fills in the minimum XP
        WillowTree uses for that rank.
      </PanelIntro>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Character name" className="sm:col-span-2">
              <Input
                value={save.characterName}
                onChange={(event) => patch({ characterName: event.target.value })}
              />
            </Field>
            <Field label="Class">
              <NativeSelect
                value={save.classId}
                onChange={(event) => patch({ classId: event.target.value })}
              >
                {!CLASSES.some((entry) => entry.id === save.classId) && (
                  <option value={save.classId}>{save.classId}</option>
                )}
                {CLASSES.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} — {entry.title}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <NumberField
              label="Save number"
              value={save.saveNumber}
              min={1}
              max={99}
              onChange={(saveNumber) => patch({ saveNumber })}
            />
            <NumberField
              label="Level"
              value={save.level}
              min={1}
              max={LIMITS.maxLevel}
              onChange={(level) =>
                patch({
                  level,
                  experience: Math.max(save.experience, xpForLevel(level)),
                })
              }
            />
            <NumberField
              label="Experience"
              value={save.experience}
              min={0}
              max={LIMITS.maxExperience}
              onChange={(experience) => patch({ experience })}
            />
            <NumberField
              label="Skill points"
              value={save.skillPoints}
              min={0}
              max={LIMITS.maxSkillPoints}
              onChange={(skillPoints) => patch({ skillPoints })}
            />
            <NumberField
              label="Cash"
              value={save.cash}
              min={0}
              max={LIMITS.maxCash}
              onChange={(cash) => patch({ cash })}
            />
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  patch({
                    cash: LIMITS.maxCash,
                    skillPoints: LIMITS.maxSkillPoints,
                    level: LIMITS.maxLevel,
                    experience: LIMITS.maxExperience,
                  })
                }
              >
                Max money, XP, and points
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gear space & playthrough</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <NumberField
              label="Backpack slots"
              value={save.backpackSize}
              min={12}
              max={LIMITS.maxBackpack}
              onChange={(backpackSize) => patch({ backpackSize })}
            />
            <NumberField
              label="Weapon slots"
              value={save.equipSlots}
              min={2}
              max={4}
              onChange={(equipSlots) => patch({ equipSlots })}
            />
            {save.dlc.hasBank && (
              <NumberField
                label="Bank slots"
                value={save.dlc.bankSize}
                min={6}
                max={LIMITS.maxBank}
                onChange={(bankSize) =>
                  onChange({ ...save, dlc: { ...save.dlc, bankSize } })
                }
              />
            )}
            <Field label="Playthrough 2">
              <NativeSelect
                value={String(save.finishedPlaythrough1)}
                onChange={(event) =>
                  patch({ finishedPlaythrough1: Number(event.target.value) })
                }
              >
                <option value="0">Locked</option>
                <option value="1">Unlocked</option>
              </NativeSelect>
            </Field>
            <Field label="Current location" className="sm:col-span-2">
              <NativeSelect
                value={save.currentLocation}
                onChange={(event) => patch({ currentLocation: event.target.value })}
              >
                {save.locations.includes(save.currentLocation) ? null : (
                  <option value={save.currentLocation}>
                    {prettyLocation(save.currentLocation)}
                  </option>
                )}
                {save.locations.map((location) => (
                  <option key={location} value={location}>
                    {prettyLocation(location)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              Last played {formatLastPlayed(save.lastPlayedDate)} ·{" "}
              {formatPlayTime(save.totalPlayTime)} in Sanctuary time ·{" "}
              {isEnhanced(save) ? "GOTY Enhanced" : "Classic"} {save.platform} save
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catch-a-Ride</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Runner 1 color">
              <NativeSelect
                value={String(save.vehicle1Color)}
                onChange={(event) => patch({ vehicle1Color: Number(event.target.value) })}
              >
                {VEHICLE_COLORS.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Runner 1 weapon">
              <NativeSelect
                value={String(save.vehicle1Type)}
                onChange={(event) => patch({ vehicle1Type: Number(event.target.value) })}
              >
                {VEHICLE_TYPES.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Runner 2 color">
              <NativeSelect
                value={String(save.vehicle2Color)}
                onChange={(event) => patch({ vehicle2Color: Number(event.target.value) })}
              >
                {VEHICLE_COLORS.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Runner 2 weapon">
              <NativeSelect
                value={String(save.vehicle2Type)}
                onChange={(event) => patch({ vehicle2Type: Number(event.target.value) })}
              >
                {VEHICLE_TYPES.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visited locations</CardTitle>
          </CardHeader>
          <CardContent>
            {save.locations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fast-travel posts unlocked yet.</p>
            ) : (
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {save.locations.map((location) => (
                  <li key={location} className="truncate text-muted-foreground">
                    {prettyLocation(location)}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
