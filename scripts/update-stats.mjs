// Gera stats.svg com dados reais da API do GitHub.
import { readFileSync, writeFileSync } from "node:fs";

const USER = process.env.USERNAME || "Leonard0MF";
const TOKEN = process.env.GH_TOKEN;
const TZ = "America/Sao_Paulo";
const OUT = new URL("../stats.svg", import.meta.url);
const TEMPLATE = readFileSync(new URL("./stats.template.svg", import.meta.url), "utf8");

const C = { line: "#1E2025", txt: "#EDEBE6", sec: "#9A9DA4", ter: "#5D6068", acc: "#C9F158" };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

async function gql(query, variables) {
  const r = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json", "User-Agent": "profile-stats" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors || !j.data) throw new Error(JSON.stringify(j.errors || j));
  return j.data;
}

const CAL = `query($login:String!,$from:DateTime,$to:DateTime){user(login:$login){createdAt
  contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions
  weeks{contributionDays{date contributionCount}}}}}}`;

async function fetchData() {
  const last = (await gql(CAL, { login: USER })).user;
  const lastYear = last.contributionsCollection.contributionCalendar;
  const created = new Date(last.createdAt);
  const days = new Map();
  for (let y = created.getUTCFullYear(); y <= new Date().getUTCFullYear(); y++) {
    const d = await gql(CAL, { login: USER, from: `${y}-01-01T00:00:00Z`, to: `${y}-12-31T23:59:59Z` });
    for (const w of d.user.contributionsCollection.contributionCalendar.weeks)
      for (const day of w.contributionDays) days.set(day.date, day.contributionCount);
  }
  for (const w of lastYear.weeks) for (const day of w.contributionDays) days.set(day.date, day.contributionCount);
  return { createdAt: last.createdAt, lastYearTotal: lastYear.totalContributions, weeks: lastYear.weeks, days };
}

const today = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
const addDays = (iso, n) => new Date(Date.parse(iso + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const fmt = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const fmtShort = (iso) => { const [, m, d] = iso.split("-").map(Number); return `${MONTHS[m - 1]} ${d}`; };
const num = (n) => n.toLocaleString("en-US");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

function streaks(days) {
  const dates = [...days.keys()].filter((d) => d <= today).sort();
  let cur = 0, d = today;
  if (!(days.get(d) > 0)) d = addDays(d, -1);
  const curEnd = d;
  while (days.get(d) > 0) { cur++; d = addDays(d, -1); }
  const curStart = addDays(d, 1);
  let best = 0, bestStart = null, bestEnd = null, run = 0, runStart = null, prev = null;
  for (const x of dates) {
    if (days.get(x) > 0) {
      run = prev && addDays(prev, 1) === x && days.get(prev) > 0 ? run + 1 : 1;
      if (run === 1) runStart = x;
      if (run > best) { best = run; bestStart = runStart; bestEnd = x; }
    }
    prev = x;
  }
  return { cur, curStart, curEnd, best, bestStart, bestEnd };
}

function render({ createdAt, lastYearTotal, weeks, days }) {
  const allTime = [...days.entries()].filter(([d]) => d <= today).reduce((a, [, c]) => a + c, 0);
  const s = streaks(days);
  const W = 1200, X0 = 64, X1 = W - 64;
  const b = [];
  b.push(`<text x="${X0}" y="64" class="m cap" fill="${C.ter}">GITHUB ACTIVITY</text>`);
  b.push(`<text x="${X1}" y="64" class="m cap" fill="${C.ter}" text-anchor="end">UPDATED ${esc(fmt(today).toUpperCase())}</text>`);
  const cols = [
    { n: num(lastYearTotal), l: "LAST 12 MONTHS", sub: "Contributions", hot: true },
    { n: num(allTime), l: "ALL TIME", sub: `Since ${fmt(createdAt.slice(0, 10))}` },
    { n: `${s.cur}`, unit: s.cur === 1 ? "day" : "days", l: "CURRENT STREAK",
      sub: s.cur ? (s.cur === 1 ? fmtShort(s.curEnd) : `${fmtShort(s.curStart)} – ${fmtShort(s.curEnd)}`) : "Starts with the next commit" },
    { n: `${s.best}`, unit: s.best === 1 ? "day" : "days", l: "LONGEST STREAK",
      sub: s.best ? `${fmtShort(s.bestStart)} – ${fmt(s.bestEnd)}` : "—" },
  ];
  const cw = (X1 - X0) / cols.length;
  cols.forEach((c, i) => {
    const x = X0 + i * cw + (i ? 28 : 0);
    if (i) b.push(`<line x1="${X0 + i * cw}" y1="104" x2="${X0 + i * cw}" y2="212" stroke="${C.line}"/>`);
    b.push(`<text x="${x}" y="112" class="m cap" fill="${c.hot ? C.acc : C.ter}">${c.l}</text>`);
    b.push(`<text x="${x}" y="176" class="d" font-size="60" letter-spacing="-2" fill="${C.txt}">${esc(c.n)}${c.unit ? `<tspan class="r" font-size="20" letter-spacing="0" fill="${C.sec}" dx="8">${c.unit}</tspan>` : ""}</text>`);
    b.push(`<text x="${x}" y="206" class="r" font-size="15" fill="${C.sec}">${esc(c.sub)}</text>`);
  });
  const wk = weeks.slice(-52).map((w) => ({
    start: w.contributionDays[0].date,
    n: w.contributionDays.reduce((a, d) => a + d.contributionCount, 0),
  }));
  const top = 262, h = 76, base = top + h, gap = 6;
  const bw = (X1 - X0 - gap * (wk.length - 1)) / wk.length;
  const max = Math.max(1, ...wk.map((w) => w.n));
  b.push(`<line x1="${X0}" y1="${base + 0.5}" x2="${X1}" y2="${base + 0.5}" stroke="${C.line}"/>`);
  let lastMonth = -1;
  wk.forEach((w, i) => {
    const x = X0 + i * (bw + gap);
    const bh = w.n ? Math.max(4, (w.n / max) * h) : 2;
    const isLast = i === wk.length - 1;
    b.push(`<rect x="${x.toFixed(1)}" y="${(base - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${isLast ? C.acc : w.n ? "#3A3D45" : C.line}"><title>${w.n} contributions · week of ${fmtShort(w.start)}</title></rect>`);
    const m = Number(w.start.slice(5, 7)) - 1;
    if (m !== lastMonth && i > 0 && i < wk.length - 2)
      b.push(`<text x="${x.toFixed(1)}" y="${base + 26}" class="m cap" font-size="11" fill="${C.ter}">${MONTHS[m].toUpperCase()}</text>`);
    lastMonth = m;
  });
  return TEMPLATE.replace("<!--BODY-->", b.join("\n"));
}

const data = await fetchData();
writeFileSync(OUT, render(data));
console.log(`stats.svg atualizado — ${data.lastYearTotal} no último ano`);
