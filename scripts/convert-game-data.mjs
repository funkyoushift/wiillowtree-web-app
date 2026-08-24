import fs from "node:fs";
import path from "node:path";

const SRC = "/tmp/wt-src/WillowTreeBLDEnhanced/WillowTree#/Data";
const DEST = path.resolve("src/data");

function parseIni(text) {
  const sections = new Map();
  let current = "_root";
  sections.set(current, {});
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";") || line.startsWith("#")) continue;
    const sectionMatch = line.match(/^\[(.+)]$/);
    if (sectionMatch) {
      current = sectionMatch[1];
      if (!sections.has(current)) sections.set(current, {});
      continue;
    }
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    sections.get(current)[key] = value;
  }
  return sections;
}

function writeJson(name, data) {
  fs.writeFileSync(path.join(DEST, name), JSON.stringify(data), "utf8");
  console.log(name, Object.keys(data).length);
}

fs.mkdirSync(DEST, { recursive: true });

const partNames = {};
const partnamesIni = parseIni(fs.readFileSync(path.join(SRC, "partnames.ini"), "utf8"));
for (const [section, entries] of partnamesIni) {
  if (section === "NameTable") {
    Object.assign(partNames, entries);
  }
}
const titlesIni = parseIni(fs.readFileSync(path.join(SRC, "titles.ini"), "utf8"));
for (const [section, entries] of titlesIni) {
  if (entries.PartName && !partNames[section]) {
    partNames[section] = entries.PartName;
  }
}
writeJson("part-names.json", partNames);

const skillNames = {};
const skillFiles = [
  "gd_skills_common.txt",
  "gd_skills2_Roland.txt",
  "gd_Skills2_Lilith.txt",
  "gd_skills2_Mordecai.txt",
  "gd_Skills2_Brick.txt",
];
for (const file of skillFiles) {
  const ini = parseIni(fs.readFileSync(path.join(SRC, file), "utf8"));
  for (const [section, entries] of ini) {
    if (entries.SkillName) {
      skillNames[section] = {
        name: entries.SkillName,
        description: entries.SkillDescription ?? "",
      };
    }
  }
}
writeJson("skill-names.json", skillNames);

const locationNames = {};
const locationsIni = parseIni(fs.readFileSync(path.join(SRC, "Locations.ini"), "utf8"));
for (const [section, entries] of locationsIni) {
  const display = entries.OutpostDisplayName || section;
  if (entries.OutpostName) locationNames[entries.OutpostName] = display;
  locationNames[section] = display;
}
writeJson("location-names.json", locationNames);

const questNames = {};
const questsIni = parseIni(fs.readFileSync(path.join(SRC, "Quests.ini"), "utf8"));
for (const [section, entries] of questsIni) {
  if (entries.MissionName) {
    questNames[section] = {
      name: entries.MissionName,
      summary: entries.MissionSummary ?? "",
      giver: entries.MissionGiver ?? "",
    };
  }
}
writeJson("quest-names.json", questNames);

const echoNames = {};
const echoesIni = parseIni(fs.readFileSync(path.join(SRC, "Echos.ini"), "utf8"));
for (const [section, entries] of echoesIni) {
  if (entries.Subject) echoNames[section] = entries.Subject;
}
writeJson("echo-names.json", echoNames);
