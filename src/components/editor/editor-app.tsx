"use client";

import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AmmoPanel } from "@/components/editor/ammo-panel";
import { CharacterPanel } from "@/components/editor/character-panel";
import { GearPanel } from "@/components/editor/gear-panel";
import { QuestsPanel } from "@/components/editor/quests-panel";
import { SkillsPanel } from "@/components/editor/skills-panel";
import {
  classLabel,
  createDemoSave,
  parseSave,
  writeSave,
  type WillowSaveGame,
} from "@/lib/wsg";

function downloadSave(save: WillowSaveGame) {
  const bytes = writeSave(save);
  const blob = new Blob([Uint8Array.from(bytes)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = save.sourceName || "Save0001.sav";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function EditorApp() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [save, setSave] = useState<WillowSaveGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [sample, setSample] = useState(false);

  async function loadFile(file: File) {
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseSave(new Uint8Array(buffer), file.name);
      setSave(parsed);
      setSample(false);
    } catch (cause) {
      setSave(null);
      setError(cause instanceof Error ? cause.message : "Could not read that file.");
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void loadFile(file);
  }

  if (!save) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:py-14">
        <header className="mb-10">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-primary uppercase">
            WillowTree# for the browser
          </p>
          <h1 className="font-heading mt-2 text-6xl leading-none sm:text-8xl">WillowTree Web</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Open a Borderlands 1 save, change the vault hunter, and download a new{" "}
            <code className="text-foreground">.sav</code>. Parsing stays on this device — nothing is
            uploaded.
          </p>
        </header>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`rounded-xl border-2 border-dashed px-6 py-16 text-center transition ${
            dragging
              ? "border-primary bg-primary/10"
              : "border-border bg-card/70 hover:border-primary/70"
          }`}
        >
          <div className="font-heading text-4xl text-primary">Drop Save0001.sav</div>
          <p className="mt-2 text-sm text-muted-foreground">
            or click to browse. PC and PS3 WSG files work. Xbox 360 CON packages are not unpacked
            here.
          </p>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".sav,.SAV"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void loadFile(file);
          }}
        />

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
          >
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-heading text-2xl text-primary">Where the files live</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                Classic:{" "}
                <code className="text-foreground">Documents\\my games\\borderlands\\savedata</code>
              </li>
              <li>
                GOTY Enhanced:{" "}
                <code className="text-foreground">
                  Documents\\my games\\Borderlands Game of the Year\\Binaries\\SaveData
                </code>
              </li>
              <li>Names look like Save0001.sav, Save0002.sav, …</li>
            </ul>
          </section>
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-heading text-2xl text-primary">Before you overwrite</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Copy the original save first. This editor understands the WillowTree WSG layout,
              including GOTY Enhanced extra fields, but a bad edit can still make a character
              unloadable.
            </p>
            <Button
              className="mt-4"
              type="button"
              variant="outline"
              onClick={() => {
                setError(null);
                setSave(createDemoSave());
                setSample(true);
              }}
            >
              Try a sample Roland
            </Button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6">
      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.28em] text-primary uppercase">
            {sample ? "Sample vault hunter" : save.sourceName} · {save.platform}
          </p>
          <h1 className="font-heading text-5xl leading-none sm:text-6xl">{save.characterName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Level {save.level} {classLabel(save.classId)} · $
            {save.cash.toLocaleString()} · {save.weapons.length} guns · {save.items.length} items
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            Open another
          </Button>
          <Button type="button" variant="outline" onClick={() => setSave(null)}>
            Close
          </Button>
          <Button type="button" onClick={() => downloadSave(save)}>
            Download save
          </Button>
        </div>
      </header>
      <input
        ref={inputRef}
        type="file"
        accept=".sav,.SAV"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void loadFile(file);
        }}
      />

      {sample && (
        <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
          This is a generated sample, not a file from your game. Download it only to inspect the
          editor — it will not replace a real character.
        </p>
      )}

      <Tabs defaultValue="hunter">
        <TabsList
          variant="line"
          className="mb-5 h-auto w-full flex-wrap justify-start gap-1 overflow-x-auto"
        >
          <TabsTrigger value="hunter">Vault Hunter</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="ammo">Ammo</TabsTrigger>
          <TabsTrigger value="weapons">Weapons</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="missions">Missions</TabsTrigger>
        </TabsList>
        <TabsContent value="hunter">
          <CharacterPanel save={save} onChange={setSave} />
        </TabsContent>
        <TabsContent value="skills">
          <SkillsPanel save={save} onChange={setSave} />
        </TabsContent>
        <TabsContent value="ammo">
          <AmmoPanel save={save} onChange={setSave} />
        </TabsContent>
        <TabsContent value="weapons">
          <GearPanel save={save} onChange={setSave} kind="weapon" />
        </TabsContent>
        <TabsContent value="items">
          <GearPanel save={save} onChange={setSave} kind="item" />
        </TabsContent>
        <TabsContent value="bank">
          <GearPanel save={save} onChange={setSave} kind="bank" />
        </TabsContent>
        <TabsContent value="missions">
          <QuestsPanel save={save} onChange={setSave} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
