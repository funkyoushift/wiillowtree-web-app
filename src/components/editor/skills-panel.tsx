"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PanelIntro } from "@/components/editor/fields";
import { prettySkill, type WillowSaveGame } from "@/lib/wsg";

export function SkillsPanel({
  save,
  onChange,
}: {
  save: WillowSaveGame;
  onChange: (next: WillowSaveGame) => void;
}) {
  if (save.skills.length === 0) {
    return (
      <div>
        <PanelIntro title="Skills">This vault hunter has no skill entries in the save.</PanelIntro>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Empty skill list. Load a character that has spent or unlocked skills.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PanelIntro title="Skills">
        Rank action skills and tree skills. Most trees cap at 5. The game still has to accept the
        build when you load in.
      </PanelIntro>
      <div className="grid gap-3">
        {save.skills.map((skill, index) => {
          const info = prettySkill(skill.name);
          return (
            <Card key={`${skill.name}-${index}`}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{info.name}</div>
                  <p className="text-xs text-muted-foreground">{info.description || skill.name}</p>
                </div>
                <label className="flex items-center gap-2 text-xs tracking-wide text-muted-foreground uppercase">
                  Rank
                  <Input
                    className="w-20"
                    type="number"
                    min={0}
                    max={5}
                    value={skill.level}
                    onChange={(event) => {
                      const skills = save.skills.slice();
                      skills[index] = { ...skill, level: Number(event.target.value) };
                      onChange({ ...save, skills });
                    }}
                  />
                </label>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
