"use client";

export function AboutTab() {
  return (
    <div className="wf-pane" style={{ maxWidth: 640, lineHeight: 1.45 }}>
      <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>WillowTree# for the browser</h2>
      <p>
        This is a GPL-3.0 TypeScript port of{" "}
        <a href="https://sourceforge.net/projects/willowtree/">WillowTree#</a> /{" "}
        <a href="https://github.com/Nicolas-Constanty/WillowTreeBLDEnhanced">WillowTreeBLDEnhanced</a>.
        Created by XanderChaos. WSG research by matt911, Turk645, and XanderChaos. X360 class by DJ Shepherd.
        GOTY Enhanced work by Nicolas Constanty and others listed in that project.
      </p>
      <p>
        Version 0.1.0. GPL-3.0. Parsing stays in this browser. Nothing is uploaded. Not affiliated with Gearbox or 2K.
      </p>
      <p>
        <strong>Back up your Save####.sav files before replacing them.</strong> A bad edit can make a character
        unloadable.
      </p>
      <p>
        Chrome and Edge can Save over the file you opened (File System Access). Firefox and Safari download a new
        file instead. The locker is stored in this browser (OPFS / localStorage) and can be exported.
      </p>
      <p>
        Xbox 360 CON packages are opened by extracting the inner WSG (X360/STFS). Saving writes the WSG back into
        the original package when one was opened. Convert-to-Xbox without a CON wraps a new CON header. Some
        consoles still need Horizon/Modio to rehash/resign, the same caveat as the desktop editor. This port does
        not use console private keys.
      </p>
      <p>
        Source:{" "}
        <a href="https://github.com/funkyoushift/wiillowtree-web-app">github.com/funkyoushift/wiillowtree-web-app</a>
      </p>
    </div>
  );
}
