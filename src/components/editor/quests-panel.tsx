"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, PanelIntro } from "@/components/editor/fields";
import { prettyEcho, prettyQuest, type WillowSaveGame } from "@/lib/wsg";

const QUEST_STATES = [
  { value: 0, label: "Not started" },
  { value: 1, label: "Active" },
  { value: 2, label: "Ready to turn in" },
  { value: 4, label: "Complete" },
];

export function QuestsPanel({
  save,
  onChange,
}: {
  save: WillowSaveGame;
  onChange: (next: WillowSaveGame) => void;
}) {
  const [query, setQuery] = useState("");
  const quests = save.questLists.flatMap((table, tableIndex) =>
    table.quests.map((quest, questIndex) => ({ tableIndex, questIndex, quest, table })),
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quests.filter(({ quest }) => {
      const info = prettyQuest(quest.name);
      return (
        !q ||
        info.name.toLowerCase().includes(q) ||
        quest.name.toLowerCase().includes(q) ||
        info.giver.toLowerCase().includes(q)
      );
    });
  }, [quests, query]);

  return (
    <div>
      <PanelIntro title="Missions & ECHO logs">
        Change mission status and browse collected ECHO recordings. Marking a story mission complete
        can skip content — keep a backup.
      </PanelIntro>
      <Input
        className="mb-4"
        placeholder="Search missions…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No missions match that search.
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8 grid gap-2">
          {filtered.map(({ quest, tableIndex, questIndex, table }) => {
            const info = prettyQuest(quest.name);
            const known = QUEST_STATES.some((state) => state.value === quest.progress);
            return (
              <Card key={`${tableIndex}-${questIndex}`}>
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{info.name}</div>
                    <p className="text-xs text-muted-foreground">
                      {info.giver ? `${info.giver} · ` : ""}
                      {info.summary || quest.name}
                      {table.currentQuest === quest.name ? " · Current" : ""}
                    </p>
                  </div>
                  <NativeSelect
                    className="sm:w-48"
                    value={String(quest.progress)}
                    onChange={(event) => {
                      const questLists = save.questLists.map((entry, index) => {
                        if (index !== tableIndex) return entry;
                        const nextQuests = entry.quests.slice();
                        nextQuests[questIndex] = {
                          ...quest,
                          progress: Number(event.target.value),
                        };
                        return { ...entry, quests: nextQuests };
                      });
                      onChange({ ...save, questLists });
                    }}
                  >
                    {!known && <option value={quest.progress}>Status {quest.progress}</option>}
                    {QUEST_STATES.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </NativeSelect>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <h3 className="font-heading mb-3 text-2xl text-primary">ECHO logs</h3>
      {save.echoLists.every((table) => table.echoes.length === 0) ? (
        <p className="text-sm text-muted-foreground">No ECHO recordings collected yet.</p>
      ) : (
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {save.echoLists.flatMap((table) =>
            table.echoes.map((echo, index) => (
              <li key={`${echo.name}-${index}`} className="text-muted-foreground">
                {prettyEcho(echo.name)}
              </li>
            )),
          )}
        </ul>
      )}
    </div>
  );
}
