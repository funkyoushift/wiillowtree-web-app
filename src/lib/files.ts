export type FileHandle = FileSystemFileHandle;

interface PickerWindow extends Window {
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<FileSystemFileHandle[]>;
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<FileSystemFileHandle>;
}

function pickerTypes() {
  return [
    {
      description: "Borderlands save",
      accept: { "application/octet-stream": [".sav", ".SAV", ".con", ".CON"] },
    },
  ];
}

export function canUseFileSystemAccess(): boolean {
  return typeof window !== "undefined" && "showOpenFilePicker" in window;
}

export async function pickOpenFile(): Promise<{ bytes: Uint8Array; name: string; handle: FileHandle | null }> {
  const w = window as PickerWindow;
  if (canUseFileSystemAccess() && w.showOpenFilePicker) {
    const [handle] = await w.showOpenFilePicker({
      multiple: false,
      types: pickerTypes(),
    });
    const file = await handle.getFile();
    return { bytes: new Uint8Array(await file.arrayBuffer()), name: file.name, handle };
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".sav,.SAV,.con,.CON";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error("No file selected."));
        return;
      }
      resolve({ bytes: new Uint8Array(await file.arrayBuffer()), name: file.name, handle: null });
    };
    input.click();
  });
}

export async function writeToHandle(handle: FileHandle, bytes: Uint8Array): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(Uint8Array.from(bytes));
  await writable.close();
}

export async function pickSaveAs(bytes: Uint8Array, suggestedName: string): Promise<FileHandle | null> {
  const w = window as PickerWindow;
  if (canUseFileSystemAccess() && w.showSaveFilePicker) {
    const handle = await w.showSaveFilePicker({
      suggestedName,
      types: pickerTypes(),
    });
    await writeToHandle(handle, bytes);
    return handle;
  }
  downloadBytes(bytes, suggestedName);
  return null;
}

export function downloadBytes(bytes: Uint8Array, name: string): void {
  const blob = new Blob([Uint8Array.from(bytes)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
