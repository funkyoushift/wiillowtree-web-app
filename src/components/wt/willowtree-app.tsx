"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AboutTab } from "@/components/wt/about-tab";
import { AmmoTab, EchoesTab, QuestsTab, SkillsTab } from "@/components/wt/catalog-tabs";
import { GearTab } from "@/components/wt/gear-tab";
import { GeneralTab } from "@/components/wt/general-tab";
import { WfButton } from "@/components/wt/widgets";
import { canUseFileSystemAccess, pickOpenFile, pickSaveAs, writeToHandle, type FileHandle } from "@/lib/files";
import { loadLocker, parseLockerFile, saveLocker, serializeLockerFile, type LockerEntry } from "@/lib/locker";
import { DEFAULT_OPTIONS, loadOptions, saveOptions, type WillowOptions } from "@/lib/options";
import { encodeSaveBytes, openSaveBytes } from "@/lib/open-save";
import { convertPlatform, createDemoSave, type Platform, type WillowSaveGame } from "@/lib/wsg";

const TABS = [
  "General",
  "Weapons",
  "Items",
  "Skills",
  "Quests",
  "Ammo Pools",
  "Echo Logs",
  "Bank",
  "Locker",
  "About",
] as const;

type Tab = (typeof TABS)[number];

export function WillowTreeApp() {
  const [save, setSave] = useState<WillowSaveGame | null>(null);
  const [tab, setTab] = useState<Tab>("General");
  const [fileMenu, setFileMenu] = useState(false);
  const [optionsMenu, setOptionsMenu] = useState(false);
  const [helpMenu, setHelpMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState<FileHandle | null>(null);
  const [openedPlatform, setOpenedPlatform] = useState<Platform | null>(null);
  const [options, setOptions] = useState<WillowOptions>(DEFAULT_OPTIONS);
  const [locker, setLocker] = useState<LockerEntry[]>([]);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  const formatChanged = Boolean(save && openedPlatform && save.platform !== openedPlatform);
  const canSaveInPlace = Boolean(handle) && !formatChanged && canUseFileSystemAccess();

  useEffect(() => {
    setOptions(loadOptions());
    void loadLocker().then(setLocker);
  }, []);

  useEffect(() => {
    saveOptions(options);
  }, [options]);

  useEffect(() => {
    void saveLocker(locker);
  }, [locker]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "F1") {
        event.preventDefault();
        setOptions((current) => {
          const order: WillowOptions["sortScheme"][] = ["name", "type", "quality", "level"];
          const next = order[(order.indexOf(current.sortScheme) + 1) % order.length];
          return { ...current, sortScheme: next };
        });
      }
      if (event.key === "F2") {
        event.preventDefault();
        setOptions((current) => ({
          ...current,
          treeDepth: current.treeDepth === 3 ? 1 : ((current.treeDepth + 1) as 1 | 2 | 3),
        }));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeMenus = () => {
    setFileMenu(false);
    setOptionsMenu(false);
    setHelpMenu(false);
  };

  const applySave = (next: WillowSaveGame) => {
    setSave(next);
    setError(null);
  };

  const openBytes = useCallback((bytes: Uint8Array, name: string, nextHandle: FileHandle | null) => {
    try {
      const parsed = openSaveBytes(bytes, name);
      setSave(parsed);
      setOpenedPlatform(parsed.platform);
      setHandle(nextHandle);
      setError(null);
      setTab("General");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open that file.");
    }
  }, []);

  const onOpen = async () => {
    closeMenus();
    try {
      const picked = await pickOpenFile();
      openBytes(picked.bytes, picked.name, picked.handle);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Open cancelled.");
    }
  };

  const suggestedName = save
    ? save.platform === "Xbox360" && !save.sourceName.toLowerCase().endsWith(".sav")
      ? save.sourceName
      : save.platform === "Xbox360"
        ? save.sourceName.replace(/\.sav$/i, ".sav")
        : save.sourceName || "Save0001.sav"
    : "Save0001.sav";

  const onSaveAs = async () => {
    closeMenus();
    if (!save) return;
    try {
      const bytes = encodeSaveBytes(save);
      const nextHandle = await pickSaveAs(bytes, suggestedName);
      if (nextHandle) setHandle(nextHandle);
      setOpenedPlatform(save.platform);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Save As failed.");
    }
  };

  const onSave = async () => {
    closeMenus();
    if (!save) return;
    if (!canSaveInPlace || !handle) {
      await onSaveAs();
      return;
    }
    try {
      await writeToHandle(handle, encodeSaveBytes(save));
      setOpenedPlatform(save.platform);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Save failed.");
    }
  };

  const onFormat = (platform: Platform) => {
    if (!save) return;
    if (platform === "PS3") {
      window.alert(
        "PS3 saves need extra console files alongside the WSG. Use Save As after converting. Back up first.",
      );
    }
    applySave(convertPlatform(save, platform));
  };

  const exportLocker = () => {
    const blob = new Blob([serializeLockerFile(locker)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "willowtree-locker.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importLocker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        setLocker(parseLockerFile(await file.text()));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Locker import failed.");
      }
    };
    input.click();
  };

  const title = save ? `WillowTree# — ${save.characterName}` : "WillowTree#";

  return (
    <div style={{ minHeight: "100%", padding: 16, display: "flex", justifyContent: "center" }}>
      <div className="wf-window" style={{ width: "min(1100px, 100%)", height: "min(760px, calc(100vh - 32px))" }}>
        <div className="wf-caption">{title}</div>
        <div className="wf-menu">
          <div className="wf-menu-item" ref={fileMenuRef}>
            <button type="button" className="wf-menu-btn" data-open={fileMenu} onClick={() => setFileMenu((v) => !v)}>
              File
            </button>
            {fileMenu && (
              <div className="wf-menu-drop">
                <button type="button" onClick={() => void onOpen()}>
                  Open…
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeMenus();
                    const demo = createDemoSave();
                    setSave(demo);
                    setOpenedPlatform(demo.platform);
                    setHandle(null);
                    setTab("General");
                  }}
                >
                  Open sample Roland
                </button>
                <button type="button" disabled={!save || formatChanged} onClick={() => void onSave()}>
                  Save{formatChanged ? " (use Save As)" : ""}
                </button>
                <button type="button" disabled={!save} onClick={() => void onSaveAs()}>
                  Save As…
                </button>
                <div className="wf-menu-sep" />
                <button
                  type="button"
                  onClick={() => {
                    closeMenus();
                    setSave(null);
                    setHandle(null);
                    setOpenedPlatform(null);
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
          <div className="wf-menu-item">
            <button
              type="button"
              className="wf-menu-btn"
              data-open={optionsMenu}
              onClick={() => setOptionsMenu((v) => !v)}
            >
              Options
            </button>
            {optionsMenu && (
              <div className="wf-menu-drop">
                <label>
                  <input
                    type="checkbox"
                    checked={options.colorizeRarity}
                    onChange={(event) => setOptions({ ...options, colorizeRarity: event.target.checked })}
                  />
                  Colorize lists by rarity
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={options.showLevel}
                    onChange={(event) => setOptions({ ...options, showLevel: event.target.checked })}
                  />
                  Show level in lists
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={options.showRarity}
                    onChange={(event) => setOptions({ ...options, showRarity: event.target.checked })}
                  />
                  Show rarity in lists
                </label>
                <div className="wf-menu-sep" />
                <button type="button" onClick={exportLocker}>
                  Export locker…
                </button>
                <button type="button" onClick={importLocker}>
                  Import locker…
                </button>
              </div>
            )}
          </div>
          <div className="wf-menu-item">
            <button type="button" className="wf-menu-btn" data-open={helpMenu} onClick={() => setHelpMenu((v) => !v)}>
              Help
            </button>
            {helpMenu && (
              <div className="wf-menu-drop">
                <button
                  type="button"
                  onClick={() => {
                    closeMenus();
                    setTab("About");
                  }}
                >
                  About WillowTree#
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="wf-toolbar">
          <WfButton onClick={() => void onOpen()}>Open</WfButton>
          <WfButton disabled={!save || formatChanged} onClick={() => void onSave()}>
            Save
          </WfButton>
          <WfButton disabled={!save} onClick={() => void onSaveAs()}>
            Save As
          </WfButton>
          <span>Format:</span>
          <select
            className="wf-select"
            disabled={!save}
            value={save?.platform ?? "PC"}
            onChange={(event) => onFormat(event.target.value as Platform)}
          >
            <option value="PC">PC</option>
            <option value="PS3">PS3</option>
            <option value="Xbox360">Xbox 360</option>
          </select>
          <span style={{ marginLeft: "auto" }}>{save?.sourceName ?? "No file"}</span>
        </div>
        <div className="wf-tabs">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              className="wf-tab"
              data-active={tab === name}
              disabled={!save && name !== "About" && name !== "Locker"}
              onClick={() => setTab(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "#f0f0f0" }}>
          {!save && tab !== "About" && tab !== "Locker" ? (
            <div className="wf-pane">
              <p>Open a Borderlands 1 save (File → Open). PC and PS3 WSG files and Xbox 360 CON packages are supported.</p>
              <p>Back up your Save####.sav files before replacing them.</p>
              <WfButton
                defaultBtn
                onClick={() => {
                  const demo = createDemoSave();
                  setSave(demo);
                  setOpenedPlatform(demo.platform);
                  setHandle(null);
                  setTab("General");
                }}
              >
                Open sample Roland
              </WfButton>
              {error && <p role="alert">{error}</p>}
            </div>
          ) : tab === "General" && save ? (
            <GeneralTab save={save} onChange={applySave} />
          ) : tab === "Weapons" && save ? (
            <GearTab save={save} onChange={applySave} kind="weapon" options={options} locker={locker} onLockerChange={setLocker} />
          ) : tab === "Items" && save ? (
            <GearTab save={save} onChange={applySave} kind="item" options={options} locker={locker} onLockerChange={setLocker} />
          ) : tab === "Skills" && save ? (
            <SkillsTab save={save} onChange={applySave} />
          ) : tab === "Quests" && save ? (
            <QuestsTab save={save} onChange={applySave} />
          ) : tab === "Ammo Pools" && save ? (
            <AmmoTab save={save} onChange={applySave} />
          ) : tab === "Echo Logs" && save ? (
            <EchoesTab save={save} onChange={applySave} />
          ) : tab === "Bank" && save ? (
            <GearTab save={save} onChange={applySave} kind="bank" options={options} locker={locker} onLockerChange={setLocker} />
          ) : tab === "Locker" ? (
            save ? (
              <GearTab save={save} onChange={applySave} kind="locker" options={options} locker={locker} onLockerChange={setLocker} />
            ) : (
              <div className="wf-pane">
                <p>Open a save to copy locker items into a backpack. You can still import/export the locker from Options.</p>
                <p>{locker.length} item(s) stored in this browser.</p>
              </div>
            )
          ) : (
            <AboutTab />
          )}
        </div>
        <div className="wf-status">
          <span>
            {error ??
              (formatChanged
                ? "Format changed — use Save As"
                : save
                  ? `Editing ${save.characterName} (${save.platform})`
                  : "Ready. Back up your Save####.sav files before replacing them.")}
          </span>
          <span>
            Sort F1={options.sortScheme} · Depth F2={options.treeDepth}
            {save ? ` · ${save.platform}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
