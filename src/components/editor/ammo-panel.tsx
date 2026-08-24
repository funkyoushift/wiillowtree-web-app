"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PanelIntro } from "@/components/editor/fields";
import { AMMO_MAX, ammoLabel, type WillowSaveGame } from "@/lib/wsg";

export function AmmoPanel({
  save,
  onChange,
}: {
  save: WillowSaveGame;
  onChange: (next: WillowSaveGame) => void;
}) {
  const fill = () => {
    onChange({
      ...save,
      ammoPools: save.ammoPools.map((pool) => ({
        ...pool,
        remaining: AMMO_MAX[pool.resource] ?? 999,
        upgradeLevel: Math.max(pool.upgradeLevel, 6),
      })),
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PanelIntro title="Ammo">
          Remaining rounds and Storage Deck Upgrade level for each pool.
        </PanelIntro>
        <Button type="button" variant="outline" onClick={fill} disabled={save.ammoPools.length === 0}>
          Fill every pool
        </Button>
      </div>
      {save.ammoPools.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No ammo pools in this save.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {save.ammoPools.map((pool, index) => (
            <Card key={`${pool.resource}-${index}`}>
              <CardContent className="grid gap-3 py-4">
                <div className="font-medium">{ammoLabel(pool.resource)}</div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs tracking-wide text-muted-foreground uppercase">
                    Remaining
                    <Input
                      type="number"
                      min={0}
                      value={Math.round(pool.remaining)}
                      onChange={(event) => {
                        const ammoPools = save.ammoPools.slice();
                        ammoPools[index] = {
                          ...pool,
                          remaining: Number(event.target.value),
                        };
                        onChange({ ...save, ammoPools });
                      }}
                    />
                  </label>
                  <label className="grid gap-1 text-xs tracking-wide text-muted-foreground uppercase">
                    SDU level
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={pool.upgradeLevel}
                      onChange={(event) => {
                        const ammoPools = save.ammoPools.slice();
                        ammoPools[index] = {
                          ...pool,
                          upgradeLevel: Number(event.target.value),
                        };
                        onChange({ ...save, ammoPools });
                      }}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
