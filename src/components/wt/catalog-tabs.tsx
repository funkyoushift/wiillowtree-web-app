"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AMMO_MAX,
  allEchoIds,
  allQuestIds,
  allSkillIds,
  ammoLabel,
  prettyEcho,
  prettyQuest,
  prettySkill,
  type AmmoPool,
  type EchoEntry,
  type QuestEntry,
  type Skill,
  type WillowSaveGame,
} from "@/lib/wsg";
import { WfButton, WfField, WfGroup, WfNumber } from "@/components/wt/widgets";

const QUEST_STATES = [
  { value: 0, label: "Not started" },
  { value: 1, label: "Active" },
  { value: 2, label: "Ready to turn in" },
  { value: 4, label: "Complete" },
];

export function SkillsTab({
  save,
  onChange,
}: {
  save: WillowSaveGame;
  onChange: (next: WillowSaveGame) => void;
}) {
  const [selected, setSelected] = useState(0);
  const skill = save.skills[selected];
  return (
    <CatalogShell
      items={save.skills.map((entry) => prettySkill(entry.name).name)}
      selected={selected}
      onSelect={setSelected}
      onNew={() =>
        onChange({
          ...save,
          skills: [...save.skills, { name: allSkillIds()[0] ?? "None", level: 0, experience: 0, inUse: 0 }],
        })
      }
      onDelete={() => onChange({ ...save, skills: save.skills.filter((_, i) => i !== selected) })}
    >
      {skill ? (
        <WfGroup title="Skill">
          <WfField label="Name">
            <select
              className="wf-select"
              value={skill.name}
              onChange={(event) => updateSkill(save, onChange, selected, { ...skill, name: event.target.value })}
            >
              {allSkillIds().map((id) => (
                <option key={id} value={id}>
                  {prettySkill(id).name}
                </option>
              ))}
            </select>
          </WfField>
          <p>{prettySkill(skill.name).description}</p>
          <WfField label="Level">
            <WfNumber
              value={skill.level}
              min={0}
              max={5}
              onChange={(level) => updateSkill(save, onChange, selected, { ...skill, level })}
            />
          </WfField>
          <WfField label="Experience">
            <WfNumber
              value={skill.experience}
              onChange={(experience) => updateSkill(save, onChange, selected, { ...skill, experience })}
            />
          </WfField>
          <WfField label="Equipped / in use">
            <select
              className="wf-select"
              value={String(skill.inUse)}
              onChange={(event) => updateSkill(save, onChange, selected, { ...skill, inUse: Number(event.target.value) })}
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </WfField>
        </WfGroup>
      ) : (
        <p>No skills.</p>
      )}
    </CatalogShell>
  );
}

function updateSkill(
  save: WillowSaveGame,
  onChange: (next: WillowSaveGame) => void,
  index: number,
  skill: Skill,
) {
  const skills = save.skills.slice();
  skills[index] = skill;
  onChange({ ...save, skills });
}

export function AmmoTab({
  save,
  onChange,
}: {
  save: WillowSaveGame;
  onChange: (next: WillowSaveGame) => void;
}) {
  const [selected, setSelected] = useState(0);
  const pool = save.ammoPools[selected];
  return (
    <CatalogShell
      items={save.ammoPools.map((entry) => ammoLabel(entry.resource))}
      selected={selected}
      onSelect={setSelected}
      extra={
        <WfButton
          onClick={() =>
            onChange({
              ...save,
              ammoPools: save.ammoPools.map((entry) => ({
                ...entry,
                remaining: AMMO_MAX[entry.resource] ?? 999,
                upgradeLevel: Math.max(entry.upgradeLevel, 6),
              })),
            })
          }
        >
          Fill every pool
        </WfButton>
      }
      onNew={() =>
        onChange({
          ...save,
          ammoPools: [
            ...save.ammoPools,
            {
              resource: "d_resources.AmmoResources.Ammo_Repeater_Pistol",
              pool: "d_resourcepools.AmmoPools.Ammo_Repeater_Pistol_Pool",
              remaining: 0,
              upgradeLevel: 0,
            },
          ],
        })
      }
      onDelete={() => onChange({ ...save, ammoPools: save.ammoPools.filter((_, i) => i !== selected) })}
    >
      {pool ? (
        <WfGroup title="Ammo pool">
          <WfField label="Resource">
            <input
              className="wf-input"
              value={pool.resource}
              onChange={(event) => updateAmmo(save, onChange, selected, { ...pool, resource: event.target.value })}
            />
          </WfField>
          <WfField label="Pool">
            <input
              className="wf-input"
              value={pool.pool}
              onChange={(event) => updateAmmo(save, onChange, selected, { ...pool, pool: event.target.value })}
            />
          </WfField>
          <WfField label="Remaining">
            <WfNumber
              value={Math.round(pool.remaining)}
              min={0}
              onChange={(remaining) => updateAmmo(save, onChange, selected, { ...pool, remaining })}
            />
          </WfField>
          <WfField label="SDU level">
            <WfNumber
              value={pool.upgradeLevel}
              min={0}
              max={10}
              onChange={(upgradeLevel) => updateAmmo(save, onChange, selected, { ...pool, upgradeLevel })}
            />
          </WfField>
        </WfGroup>
      ) : (
        <p>No ammo pools.</p>
      )}
    </CatalogShell>
  );
}

function updateAmmo(
  save: WillowSaveGame,
  onChange: (next: WillowSaveGame) => void,
  index: number,
  pool: AmmoPool,
) {
  const ammoPools = save.ammoPools.slice();
  ammoPools[index] = pool;
  onChange({ ...save, ammoPools });
}

export function QuestsTab({
  save,
  onChange,
}: {
  save: WillowSaveGame;
  onChange: (next: WillowSaveGame) => void;
}) {
  const quests = save.questLists.flatMap((table, tableIndex) =>
    table.quests.map((quest, questIndex) => ({ tableIndex, questIndex, quest })),
  );
  const [selected, setSelected] = useState(0);
  const current = quests[selected];
  return (
    <CatalogShell
      items={quests.map(({ quest }) => prettyQuest(quest.name).name)}
      selected={selected}
      onSelect={setSelected}
      onNew={() => {
        const name = allQuestIds()[0];
        if (!name) return;
        const questLists = save.questLists.slice();
        if (questLists.length === 0) {
          questLists.push({
            index: 0,
            currentQuest: name,
            quests: [{ name, progress: 0, dlcValue1: 0, dlcValue2: 0, objectives: [] }],
          });
        } else {
          questLists[0] = {
            ...questLists[0],
            quests: [...questLists[0].quests, { name, progress: 0, dlcValue1: 0, dlcValue2: 0, objectives: [] }],
          };
        }
        onChange({ ...save, questLists });
      }}
      onDelete={() => {
        if (!current) return;
        const questLists = save.questLists.map((table, index) =>
          index === current.tableIndex
            ? { ...table, quests: table.quests.filter((_, i) => i !== current.questIndex) }
            : table,
        );
        onChange({ ...save, questLists });
      }}
    >
      {current ? (
        <WfGroup title="Quest">
          <WfField label="Mission">
            <select
              className="wf-select"
              value={current.quest.name}
              onChange={(event) => updateQuest(save, onChange, current, { ...current.quest, name: event.target.value })}
            >
              {allQuestIds().map((id) => (
                <option key={id} value={id}>
                  {prettyQuest(id).name}
                </option>
              ))}
            </select>
          </WfField>
          <p>
            {prettyQuest(current.quest.name).giver} · {prettyQuest(current.quest.name).summary}
          </p>
          <WfField label="Progress">
            <select
              className="wf-select"
              value={String(current.quest.progress)}
              onChange={(event) =>
                updateQuest(save, onChange, current, { ...current.quest, progress: Number(event.target.value) })
              }
            >
              {!QUEST_STATES.some((state) => state.value === current.quest.progress) && (
                <option value={current.quest.progress}>Status {current.quest.progress}</option>
              )}
              {QUEST_STATES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </WfField>
        </WfGroup>
      ) : (
        <p>No missions.</p>
      )}
    </CatalogShell>
  );
}

function updateQuest(
  save: WillowSaveGame,
  onChange: (next: WillowSaveGame) => void,
  current: { tableIndex: number; questIndex: number; quest: QuestEntry },
  quest: QuestEntry,
) {
  const questLists = save.questLists.map((table, index) => {
    if (index !== current.tableIndex) return table;
    const quests = table.quests.slice();
    quests[current.questIndex] = quest;
    return { ...table, quests };
  });
  onChange({ ...save, questLists });
}

export function EchoesTab({
  save,
  onChange,
}: {
  save: WillowSaveGame;
  onChange: (next: WillowSaveGame) => void;
}) {
  const echoes = save.echoLists.flatMap((table, tableIndex) =>
    table.echoes.map((echo, echoIndex) => ({ tableIndex, echoIndex, echo })),
  );
  const [selected, setSelected] = useState(0);
  const current = echoes[selected];
  const ids = useMemo(() => allEchoIds(), []);
  return (
    <CatalogShell
      items={echoes.map(({ echo }) => prettyEcho(echo.name))}
      selected={selected}
      onSelect={setSelected}
      extra={
        <WfButton
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".txt,.echo";
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              const names = (await file.text())
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line.length > 0 && !line.startsWith("#"));
              if (names.length === 0) return;
              const echoLists = save.echoLists.slice();
              const entries: EchoEntry[] = names.map((name) => ({ name, dlcValue1: 0, dlcValue2: 0 }));
              if (echoLists.length === 0) echoLists.push({ index: 0, echoes: entries });
              else echoLists[0] = { ...echoLists[0], echoes: [...echoLists[0].echoes, ...entries] };
              onChange({ ...save, echoLists });
            };
            input.click();
          }}
        >
          Import
        </WfButton>
      }
      onNew={() => {
        const name = ids[0];
        if (!name) return;
        const echoLists = save.echoLists.slice();
        const entry: EchoEntry = { name, dlcValue1: 0, dlcValue2: 0 };
        if (echoLists.length === 0) echoLists.push({ index: 0, echoes: [entry] });
        else echoLists[0] = { ...echoLists[0], echoes: [...echoLists[0].echoes, entry] };
        onChange({ ...save, echoLists });
      }}
      onDelete={() => {
        if (!current) return;
        const echoLists = save.echoLists.map((table, index) =>
          index === current.tableIndex
            ? { ...table, echoes: table.echoes.filter((_, i) => i !== current.echoIndex) }
            : table,
        );
        onChange({ ...save, echoLists });
      }}
    >
      {current ? (
        <WfGroup title="ECHO log">
          <WfField label="Recording">
            <select
              className="wf-select"
              value={current.echo.name}
              onChange={(event) => {
                const echoLists = save.echoLists.map((table, index) => {
                  if (index !== current.tableIndex) return table;
                  const next = table.echoes.slice();
                  next[current.echoIndex] = { ...current.echo, name: event.target.value };
                  return { ...table, echoes: next };
                });
                onChange({ ...save, echoLists });
              }}
            >
              {ids.map((id) => (
                <option key={id} value={id}>
                  {prettyEcho(id)}
                </option>
              ))}
            </select>
          </WfField>
        </WfGroup>
      ) : (
        <p>No ECHO recordings.</p>
      )}
    </CatalogShell>
  );
}

function CatalogShell({
  items,
  selected,
  onSelect,
  onNew,
  onDelete,
  extra,
  children,
}: {
  items: string[];
  selected: number;
  onSelect: (index: number) => void;
  onNew: () => void;
  onDelete: () => void;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div className="wf-toolbar">
        <WfButton onClick={onNew}>New</WfButton>
        <WfButton disabled={items.length === 0} onClick={onDelete}>
          Delete
        </WfButton>
        {extra}
      </div>
      <div className="wf-split">
        <div className="wf-tree">
          {items.map((label, index) => (
            <button
              key={`${label}-${index}`}
              type="button"
              className="wf-tree-item"
              data-selected={selected === index}
              onClick={() => onSelect(index)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="wf-pane">{children}</div>
      </div>
    </div>
  );
}
