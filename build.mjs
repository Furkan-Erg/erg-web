// Statik site üretici: src/template.html + src/strings.mjs -> dist/ (EN kökte, TR /tr/ altında).
// Bağımlılık yok: `node build.mjs`.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SHOTS, STRINGS } from "./src/strings.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "dist");
const template = readFileSync(join(root, "src", "template.html"), "utf8");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const lookup = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

function shotsHtml(lang) {
  return SHOTS.map(
    (s) =>
      `      <li><a href="/assets/img/lhs_${s.id}.webp"><img src="/assets/img/lhs_${s.id}_s.webp" ` +
      `alt="${esc(s[lang])}" width="640" height="360" loading="lazy"></a></li>`,
  ).join("\n");
}

function render(lang) {
  const data = { ...STRINGS[lang], year: new Date().getFullYear() };
  return template.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    if (key === "shots") return shotsHtml(lang);
    const v = lookup(data, key);
    if (v == null) throw new Error(`Eksik metin: ${lang}.${key}`);
    return esc(v);
  });
}

rmSync(dist, { recursive: true, force: true });
cpSync(join(root, "public"), dist, { recursive: true });
writeFileSync(join(dist, "index.html"), render("en"));
mkdirSync(join(dist, "tr"), { recursive: true });
writeFileSync(join(dist, "tr", "index.html"), render("tr"));
console.log("dist/ hazır: /, /tr/");
