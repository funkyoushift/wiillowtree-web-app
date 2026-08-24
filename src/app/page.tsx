import { EditorApp } from "@/components/editor/editor-app";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <EditorApp />
      <footer className="mt-auto border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        Source on{" "}
        <a
          className="text-primary underline-offset-2 hover:underline"
          href="https://github.com/funkyoushift/wiillowtree-web-app"
        >
          GitHub
        </a>
        . Save format from{" "}
        <a
          className="text-primary underline-offset-2 hover:underline"
          href="https://sourceforge.net/projects/willowtree/"
        >
          WillowTree#
        </a>{" "}
        (GPL-3.0). Not affiliated with Gearbox or 2K. Back up your Save####.sav files before
        replacing them.
      </footer>
    </div>
  );
}
