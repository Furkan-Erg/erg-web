// Ziyaret sayacı: site.js'in yolladığı işareti (POST /api/pulse) kaydeder, özeti /stats'ta gösterir.
// Bağımlılık yok. Çerez yok, IP saklanmaz: ziyaretçi, o güne özel tuzla karılmış IP + tarayıcı özetiyle ayırt edilir,
// tuz gün dönünce değiştiği için günler arası eşleştirme yapılamaz.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";

const PORT = Number(process.env.PORT || 8080);
const DATA = process.env.DATA_DIR || "/data";
const PASSWORD = process.env.STATS_PASSWORD || "";
const TZ = process.env.STATS_TZ || "Europe/Istanbul";
const MAX_FILE = 64 * 1024 * 1024; // aylık dosya üst sınırı; aşılırsa o ay yazmayı bırakır
const BOOT = Date.now().toString(36);

mkdirSync(DATA, { recursive: true });

const BOT =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|curl|wget|python|scrapy|httpclient|phantom|puppeteer|playwright|selenium/i;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const num = (n) => n.toLocaleString("tr-TR");

// ---- gün ve ziyaretçi kimliği ----

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const labelFmt = new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC", day: "numeric", month: "short" });
const dayKey = (date = new Date()) => dayFmt.format(date);
const dayLabel = (day) => labelFmt.format(new Date(`${day}T00:00:00Z`));

function lastDays(n) {
  const [y, m, d] = dayKey().split("-").map(Number);
  return Array.from({ length: n }, (_, i) =>
    new Date(Date.UTC(y, m - 1, d - (n - 1 - i))).toISOString().slice(0, 10),
  );
}

const saltFile = join(DATA, "salt.json");
let salt = { day: "", value: "" };
try {
  salt = JSON.parse(readFileSync(saltFile, "utf8"));
} catch {}

function visitorId(day, ip, ua) {
  if (salt.day !== day) {
    salt = { day, value: randomBytes(16).toString("hex") };
    writeFileSync(saltFile, JSON.stringify(salt));
  }
  return createHash("sha256").update(`${salt.value}|${ip}|${ua}`).digest("base64url").slice(0, 12);
}

// ---- istekten alan çıkarma ----

// Host nginx X-Real-IP'yi her istekte kendisi yazar (Cloudflare real-ip sonrası gerçek istemci adresi).
function clientIp(req) {
  const xff = String(req.headers["x-forwarded-for"] || "").split(",").pop().trim();
  return String(req.headers["x-real-ip"] || xff || req.socket.remoteAddress || "");
}

const ownHost = (req) => String(req.headers.host || "").replace(/:\d+$/, "").replace(/^www\./, "");

function sameOrigin(req) {
  const site = req.headers["sec-fetch-site"];
  if (site && site !== "same-origin") return false;
  try {
    return new URL(req.headers.origin).host === req.headers.host;
  } catch {
    return false;
  }
}

const cleanPath = (p) => (typeof p === "string" && /^\/[\w\-./~%]{0,119}$/.test(p) ? p : "");
const cleanSource = (s) => (typeof s === "string" && /^[\w.\-]{1,40}$/.test(s) ? s.toLowerCase() : "");
const cleanLang = (l) => (typeof l === "string" && /^[a-z]{2,3}(-|$)/i.test(l) ? l.split("-")[0].toLowerCase() : "");

function refHost(r, own) {
  try {
    const h = new URL(String(r)).hostname.replace(/^www\./, "").slice(0, 80);
    return h === own ? "" : h;
  } catch {
    return "";
  }
}

function device(ua) {
  if (/ipad|tablet/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "Tablet";
  return /mobi|iphone|android/i.test(ua) ? "Mobil" : "Masaüstü";
}

function browser(ua) {
  if (/Edg(e|A|iOS)?\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/Firefox\/|FxiOS/.test(ua)) return "Firefox";
  if (/Chrome\/|CriOS/.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Diğer";
}

function os(ua) {
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Diğer";
}

// ---- hız sınırı ----

function limiter(max, windowMs) {
  const seen = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, e] of seen) if (e.until < now) seen.delete(k);
  }, windowMs).unref();
  const entry = (key) => {
    const now = Date.now();
    let e = seen.get(key);
    if (!e || e.until < now) seen.set(key, (e = { n: 0, until: now + windowMs }));
    return e;
  };
  return { hit: (key) => ++entry(key).n > max, over: (key) => entry(key).n >= max };
}

const pulses = limiter(30, 60_000);
const authFails = limiter(10, 5 * 60_000);

// ---- kayıt ----

function record(req, body) {
  const ua = String(req.headers["user-agent"] || "").slice(0, 300);
  const path = cleanPath(body.p);
  if (!ua || BOT.test(ua) || !path) return;

  const now = new Date();
  const day = dayKey(now);
  const file = join(DATA, `hits-${day.slice(0, 7)}.jsonl`);
  if (existsSync(file) && statSync(file).size > MAX_FILE) return;

  const country = String(req.headers["cf-ipcountry"] || "");
  const ev = {
    t: `${now.toISOString().slice(0, 19)}Z`,
    d: day,
    v: visitorId(day, clientIp(req), ua),
    p: path,
    r: refHost(body.r, ownHost(req)),
    s: cleanSource(body.s),
    c: /^[A-Z]{2}$/.test(country) && country !== "XX" ? country : "",
    l: cleanLang(body.l),
    dev: device(ua),
    br: browser(ua),
    os: os(ua),
  };
  appendFileSync(file, `${JSON.stringify(ev)}\n`);
}

async function pulse(req, res) {
  if (!sameOrigin(req) || pulses.hit(clientIp(req))) return res.writeHead(204).end();
  req.setEncoding("utf8");
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 2048) return res.writeHead(413).end();
  }
  try {
    const body = JSON.parse(raw);
    if (body && typeof body === "object") record(req, body);
  } catch {}
  res.writeHead(204).end();
}

// ---- özet ----

function readEvents(days) {
  const wanted = new Set(days);
  const months = [...new Set(days.map((d) => d.slice(0, 7)))];
  const events = [];
  for (const month of months) {
    let text = "";
    try {
      text = readFileSync(join(DATA, `hits-${month}.jsonl`), "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n")) {
      if (!line) continue;
      try {
        const ev = JSON.parse(line);
        if (wanted.has(ev.d)) events.push(ev);
      } catch {}
    }
  }
  return events;
}

function summarize(events, days) {
  const perDay = new Map(days.map((d) => [d, { views: 0, visitors: new Set() }]));
  const pages = new Map();
  const dims = { r: new Map(), s: new Map(), c: new Map(), l: new Map(), dev: new Map(), br: new Map(), os: new Map() };
  const seen = new Set();

  for (const ev of events) {
    const day = perDay.get(ev.d);
    day.views++;
    day.visitors.add(ev.v);

    const page = pages.get(ev.p) ?? pages.set(ev.p, { views: 0, visitors: new Set() }).get(ev.p);
    page.views++;
    page.visitors.add(ev.v);

    // Kaynak, ülke, cihaz gibi boyutlar ziyaretçinin o günkü ilk isteğine göre bir kez sayılır.
    if (seen.has(ev.v)) continue;
    seen.add(ev.v);
    for (const [key, map] of Object.entries(dims)) map.set(ev[key] || "", (map.get(ev[key] || "") ?? 0) + 1);
  }
  return { perDay, pages, dims, visitors: seen.size, views: events.length };
}

const totals = (perDay, days) =>
  days.reduce(
    (acc, d) => {
      acc.visitors += perDay.get(d).visitors.size;
      acc.views += perDay.get(d).views;
      return acc;
    },
    { visitors: 0, views: 0 },
  );

// ---- sayfa ----

// CSP satır içi stil ve script'e izin vermez: ölçüler SVG öznitelikleriyle verilir, stil /assets/stats.css'te.
// Yatay ölçüler yüzde, dikey ölçüler piksel: grafik dar ekranda sıkışır ama yazılar küçülmez.
function axisTop(max) {
  const raw = max / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * p).find((x) => x >= raw));
  return { step, top: Math.ceil(max / step) * step };
}

const f1 = (n) => Math.round(n * 10) / 10;
const pc = (n) => `${Math.round(n * 100) / 100}%`;

function chart(days, perDay) {
  const H = 240, T = 14, B = 28, PH = H - T - B;
  const L = 7, PW = 90;
  const { step, top } = axisTop(Math.max(1, ...days.map((d) => perDay.get(d).visitors.size)));
  const band = PW / days.length;
  const bw = Math.min(band * 0.8, 3.2);
  const y = (v) => f1(PH * (1 - v / top));
  const every = Math.ceil(days.length / 8);

  let ticks = "";
  for (let t = 0; t <= top; t += step) {
    ticks +=
      `<line class="grid" x1="${pc(L)}" x2="${pc(L + PW)}" y1="${T + y(t)}" y2="${T + y(t)}"/>` +
      `<text class="tick" x="${pc(L - 1.5)}" y="${T + y(t) + 4}" text-anchor="end">${num(t)}</text>`;
  }

  let bars = "";
  let labels = "";
  days.forEach((d, i) => {
    const { views, visitors } = perDay.get(d);
    const n = visitors.size;
    const x0 = L + band * i;
    // Çubuk tabanın altına taşar ve iç svg'de kırpılır: üst köşeler yuvarlak, taban düz kalır.
    const bar = n
      ? `<rect class="bar" x="${pc(x0 + (band - bw) / 2)}" y="${y(n)}" width="${pc(bw)}" height="${f1(PH - y(n) + 8)}" rx="3"/>`
      : "";
    bars +=
      `<g class="day"><title>${esc(dayLabel(d))}: ${num(n)} ziyaretçi, ${num(views)} görüntüleme</title>` +
      `<rect class="hit" x="${pc(x0)}" y="0" width="${pc(band)}" height="${PH}"/>${bar}</g>`;
    if ((days.length - 1 - i) % every === 0) {
      labels += `<text class="tick" x="${pc(x0 + band / 2)}" y="${H - 8}" text-anchor="middle">${esc(dayLabel(d))}</text>`;
    }
  });

  return (
    `<div class="chart"><svg width="100%" height="${H}" role="img" aria-label="Günlük tekil ziyaretçi">${ticks}` +
    `<svg class="plot" y="${T}" width="100%" height="${PH}">${bars}</svg>${labels}</svg></div>`
  );
}

function names(type) {
  try {
    const dn = new Intl.DisplayNames(["tr"], { type });
    return (code) => dn.of(code) ?? code;
  } catch {
    return (code) => code;
  }
}
const regionName = names("region");
const languageName = names("language");

function panel(title, map, { empty = "Bilinmiyor", name = (k) => k } = {}) {
  const rows = [...map].sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((a, [, n]) => a + n, 0);
  if (!total) return "";
  const max = rows[0][1];
  const body = rows
    .slice(0, 10)
    .map(([key, n]) => {
      let label = empty;
      try {
        if (key) label = name(key);
      } catch {
        label = key;
      }
      return (
        `<tr><th scope="row" title="${esc(label)}">${esc(label)}</th>` +
        `<td class="rowbar"><svg viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">` +
        `<rect class="bar" width="${f1((n / max) * 100)}" height="6" rx="2"/></svg></td>` +
        `<td class="n">${num(n)}</td><td class="n pct">%${Math.round((n / total) * 100)}</td></tr>`
      );
    })
    .join("");
  return `<section class="panel"><h2>${esc(title)}</h2><table>${body}</table></section>`;
}

function page(range) {
  const days = lastDays(Math.max(range, 30));
  const shown = days.slice(-range);
  const events = readEvents(days);
  const all = summarize(events, days);
  const sel = range === days.length ? all : summarize(events.filter((ev) => shown.includes(ev.d)), shown);

  const tile = (label, d) => {
    const t = totals(all.perDay, d);
    return (
      `<li><span class="k">${label}</span><b>${num(t.visitors)}</b>` +
      `<span class="sub">${num(t.views)} görüntüleme</span></li>`
    );
  };

  const ranges = [7, 30, 90]
    .map((n) => `<a href="/stats?gun=${n}"${n === range ? ' aria-current="page"' : ""}>${n} gün</a>`)
    .join("");

  const pageRows = new Map([...sel.pages].map(([p, v]) => [p, v.visitors.size]));
  const daily = [...shown]
    .reverse()
    .map((d) => {
      const { views, visitors } = sel.perDay.get(d);
      return `<tr><th scope="row">${esc(dayLabel(d))}</th><td class="n">${num(visitors.size)}</td><td class="n">${num(views)}</td></tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Ziyaretçiler · Evolving Reality Games</title>
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png">
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="/assets/stats.css?v=${BOOT}">
</head>
<body class="stats">
<header class="stats-top">
  <h1>Ziyaretçiler</h1>
  <nav aria-label="Dönem">${ranges}</nav>
</header>
<main>
  <ul class="tiles">
    ${tile("Bugün", days.slice(-1))}
    ${tile("Dün", days.slice(-2, -1))}
    ${tile("Son 7 gün", days.slice(-7))}
    ${tile("Son 30 gün", days.slice(-30))}
  </ul>

  <section class="panel wide">
    <h2>Günlük tekil ziyaretçi, son ${range} gün</h2>
    ${sel.views ? chart(shown, sel.perDay) : '<p class="empty">Bu dönemde kayıt yok.</p>'}
    <details>
      <summary>Günlük tablo</summary>
      <table class="daily"><thead><tr><th scope="col">Gün</th><th scope="col" class="n">Ziyaretçi</th><th scope="col" class="n">Görüntüleme</th></tr></thead>${daily}</table>
    </details>
  </section>

  <div class="panels">
    ${panel("Sayfalar", pageRows)}
    ${panel("Geldiği yer", sel.dims.r, { empty: "Doğrudan / bilinmiyor" })}
    ${panel("Kampanya (utm_source, ref)", new Map([...sel.dims.s].filter(([k]) => k)))}
    ${panel("Ülke", sel.dims.c, { name: regionName })}
    ${panel("Tarayıcı dili", sel.dims.l, { name: languageName })}
    ${panel("Cihaz", sel.dims.dev)}
    ${panel("Tarayıcı", sel.dims.br)}
    ${panel("İşletim sistemi", sel.dims.os)}
  </div>

  <p class="note">Tekil ziyaretçi gün bazında sayılır; çok günlü toplamlar günlük tekillerin toplamıdır, aynı kişi iki
  ayrı gün gelirse iki kez sayılır. Botlar ve JavaScript çalıştırmayan istekler sayılmaz. Gün sınırı: ${esc(TZ)}.</p>
</main>
</body>
</html>
`;
}

function dashboard(req, res, url) {
  if (!PASSWORD) return send(res, 404, "not found");
  const ip = clientIp(req);
  const given = /^Basic (.+)$/.exec(req.headers.authorization || "");
  if (given) {
    if (authFails.over(ip)) return send(res, 429, "too many attempts");
    const pass = Buffer.from(given[1], "base64").toString("utf8").replace(/^[^:]*:/, "");
    const hash = (s) => createHash("sha256").update(s).digest();
    if (timingSafeEqual(hash(pass), hash(PASSWORD))) {
      const range = [7, 30, 90].includes(Number(url.searchParams.get("gun"))) ? Number(url.searchParams.get("gun")) : 30;
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      });
      return res.end(page(range));
    }
    authFails.hit(ip);
  }
  res.writeHead(401, { "WWW-Authenticate": 'Basic realm="ERG stats", charset="UTF-8"', "Cache-Control": "no-store" });
  res.end("auth required");
}

function send(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end(text);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://stats");
    if (url.pathname === "/api/health") return send(res, 200, "ok");
    if (url.pathname === "/api/pulse" && req.method === "POST") return await pulse(req, res);
    if (url.pathname === "/stats" && req.method === "GET") return dashboard(req, res, url);
    send(res, 404, "not found");
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, 500, "error");
  }
}).listen(PORT, () => console.log(`sayaç dinliyor: ${PORT}${PASSWORD ? "" : " (STATS_PASSWORD yok, /stats kapalı)"}`));
