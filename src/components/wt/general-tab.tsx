"use client";

import {
  CLASSES,
  LIMITS,
  VEHICLE_COLORS,
  VEHICLE_TYPES,
  allLocationIds,
  formatLastPlayed,
  formatPlayTime,
  isEnhanced,
  prettyLocation,
  xpForLevel,
  type WillowSaveGame,
} from "@/lib/wsg";
import { xboxIdSummary } from "@/lib/open-save";
import { WfField, WfGroup, WfNumber, WfButton } from "@/components/wt/widgets";

export function GeneralTab({
  save,
  onChange,
}: {
  save: WillowSaveGame;
  onChange: (next: WillowSaveGame) => void;
}) {
  const patch = (partial: Partial<WillowSaveGame>) => onChange({ ...save, ...partial });
  const knownLocations = Array.from(new Set([...save.locations, ...allLocationIds()]));

  return (
    <div className="wf-pane" style={{ display: "grid", gap: 10 }}>
      <div className="wf-grid2">
        <WfGroup title="Character">
          <WfField label="Name">
            <input
              className="wf-input"
              value={save.characterName}
              onChange={(event) => patch({ characterName: event.target.value })}
            />
          </WfField>
          <WfField label="Class">
            <select
              className="wf-select"
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
            </select>
          </WfField>
          <WfField label="Save number">
            <WfNumber value={save.saveNumber} min={1} max={99} onChange={(saveNumber) => patch({ saveNumber })} />
          </WfField>
          <WfField label="Level">
            <WfNumber
              value={save.level}
              min={1}
              max={LIMITS.maxLevel}
              onChange={(level) => patch({ level, experience: Math.max(save.experience, xpForLevel(level)) })}
            />
          </WfField>
          <WfField label="Experience">
            <WfNumber
              value={save.experience}
              min={0}
              max={LIMITS.maxExperience}
              onChange={(experience) => patch({ experience })}
            />
          </WfField>
          <WfField label="Skill points">
            <WfNumber
              value={save.skillPoints}
              min={0}
              max={LIMITS.maxSkillPoints}
              onChange={(skillPoints) => patch({ skillPoints })}
            />
          </WfField>
          <WfField label="Cash">
            <WfNumber value={save.cash} min={0} max={LIMITS.maxCash} onChange={(cash) => patch({ cash })} />
          </WfField>
          <WfButton
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
          </WfButton>
        </WfGroup>

        <WfGroup title="Inventory & playthrough">
          <WfField label="Backpack slots">
            <WfNumber
              value={save.backpackSize}
              min={12}
              max={LIMITS.maxBackpack}
              onChange={(backpackSize) => patch({ backpackSize })}
            />
          </WfField>
          <WfField label="Weapon slots">
            <WfNumber value={save.equipSlots} min={2} max={4} onChange={(equipSlots) => patch({ equipSlots })} />
          </WfField>
          {save.dlc.hasBank && (
            <WfField label="Bank slots">
              <WfNumber
                value={save.dlc.bankSize}
                min={6}
                max={LIMITS.maxBank}
                onChange={(bankSize) => onChange({ ...save, dlc: { ...save.dlc, bankSize } })}
              />
            </WfField>
          )}
          <WfField label="Playthrough 2">
            <select
              className="wf-select"
              value={String(save.finishedPlaythrough1)}
              onChange={(event) => patch({ finishedPlaythrough1: Number(event.target.value) })}
            >
              <option value="0">Locked</option>
              <option value="1">Unlocked</option>
            </select>
          </WfField>
          <WfField label="Current location">
            <select
              className="wf-select"
              value={save.currentLocation}
              onChange={(event) => patch({ currentLocation: event.target.value })}
            >
              {knownLocations.map((location) => (
                <option key={location} value={location}>
                  {prettyLocation(location)}
                </option>
              ))}
            </select>
          </WfField>
          <WfField label="Head">
            <WfNumber value={save.head} min={0} max={32} onChange={(head) => patch({ head })} />
          </WfField>
          <WfField label="Color 1 (ARGB)">
            <WfNumber value={save.color1 >>> 0} onChange={(color1) => patch({ color1 })} />
          </WfField>
          <WfField label="Color 2 (ARGB)">
            <WfNumber value={save.color2 >>> 0} onChange={(color2) => patch({ color2 })} />
          </WfField>
          <WfField label="Color 3 (ARGB)">
            <WfNumber value={save.color3 >>> 0} onChange={(color3) => patch({ color3 })} />
          </WfField>
          <p>
            Last played {formatLastPlayed(save.lastPlayedDate)} · {formatPlayTime(save.totalPlayTime)} ·{" "}
            {isEnhanced(save) ? "GOTY Enhanced" : "Classic"} {save.platform}
          </p>
        </WfGroup>
      </div>

      <div className="wf-grid2">
        <WfGroup title="Catch-A-Ride">
          <WfField label="Runner 1 color">
            <select
              className="wf-select"
              value={String(save.vehicle1Color)}
              onChange={(event) => patch({ vehicle1Color: Number(event.target.value) })}
            >
              {VEHICLE_COLORS.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </WfField>
          <WfField label="Runner 1 weapon">
            <select
              className="wf-select"
              value={String(save.vehicle1Type)}
              onChange={(event) => patch({ vehicle1Type: Number(event.target.value) })}
            >
              {VEHICLE_TYPES.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </WfField>
          <WfField label="Runner 2 color">
            <select
              className="wf-select"
              value={String(save.vehicle2Color)}
              onChange={(event) => patch({ vehicle2Color: Number(event.target.value) })}
            >
              {VEHICLE_COLORS.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </WfField>
          <WfField label="Runner 2 weapon">
            <select
              className="wf-select"
              value={String(save.vehicle2Type)}
              onChange={(event) => patch({ vehicle2Type: Number(event.target.value) })}
            >
              {VEHICLE_TYPES.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </WfField>
        </WfGroup>

        <WfGroup title="Locations">
          <div style={{ maxHeight: 160, overflow: "auto", marginBottom: 8 }}>
            {save.locations.map((location, index) => (
              <div key={`${location}-${index}`} style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                <span style={{ flex: 1 }}>{prettyLocation(location)}</span>
                <WfButton
                  onClick={() => patch({ locations: save.locations.filter((_, i) => i !== index) })}
                >
                  Delete
                </WfButton>
              </div>
            ))}
          </div>
          <select
            className="wf-select"
            defaultValue=""
            onChange={(event) => {
              const value = event.target.value;
              if (value && !save.locations.includes(value)) {
                patch({ locations: [...save.locations, value] });
              }
              event.target.value = "";
            }}
          >
            <option value="">Add visited location…</option>
            {allLocationIds()
              .filter((id) => !save.locations.includes(id))
              .map((id) => (
                <option key={id} value={id}>
                  {prettyLocation(id)}
                </option>
              ))}
          </select>
        </WfGroup>
      </div>

      <WfGroup title="Challenges">
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <WfButton
            onClick={() =>
              patch({ challenges: [...save.challenges, { id: 0, typeId: 1, value: 0 }] })
            }
          >
            Add
          </WfButton>
        </div>
        {save.challenges.length === 0 ? (
          <p>No challenge block entries.</p>
        ) : (
          save.challenges.map((challenge, index) => (
            <div key={`${challenge.id}-${index}`} className="wf-grid2" style={{ marginBottom: 4 }}>
              <WfField label="ID">
                <WfNumber
                  value={challenge.id}
                  onChange={(id) => {
                    const challenges = save.challenges.slice();
                    challenges[index] = { ...challenge, id };
                    patch({ challenges });
                  }}
                />
              </WfField>
              <WfField label="Value">
                <WfNumber
                  value={challenge.value}
                  onChange={(value) => {
                    const challenges = save.challenges.slice();
                    challenges[index] = { ...challenge, value };
                    patch({ challenges });
                  }}
                />
              </WfField>
              <WfButton
                onClick={() => patch({ challenges: save.challenges.filter((_, i) => i !== index) })}
              >
                Delete
              </WfButton>
            </div>
          ))
        )}
      </WfGroup>

      {save.platform === "Xbox360" && (
        <WfGroup title="Xbox 360 IDs">
          <p>{xboxIdSummary(save)}</p>
        </WfGroup>
      )}
    </div>
  );
}
