// Gera stats.svg: projetos públicos com mais commits nos últimos 30 dias.
// Repositórios privados nunca aparecem por nome; entram só na soma de "private contributions".
import { readFileSync, writeFileSync } from "node:fs";

const USER = process.env.USERNAME || "Leonard0MF";
const TOKEN = process.env.GH_TOKEN;
const DAYS = 30;
const MAX = 4;
// Repositórios públicos que nunca devem aparecer (owner/name, separados por vírgula)
const EXCLUDE = new Set([`${USER}/${USER}`, ...(process.env.EXCLUDE || "").split(",").map((s) => s.trim()).filter(Boolean)]);
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

const Q = `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){
  contributionsCollection(from:$from,to:$to){
    restrictedContributionsCount
    commitContributionsByRepository(maxRepositories:25){
      contributions{totalCount}
      repository{nameWithOwner name description isPrivate pushedAt primaryLanguage{name color}}
    }
  }}}`;

async function fetchData() {
  if (process.env.MOCK) return JSON.parse(readFileSync(process.env.MOCK, "utf8"));
  const to = new Date();
  const from = new Date(to.getTime() - DAYS * 864e5);
  const d = await gql(Q, { login: USER, from: from.toISOString(), to: to.toISOString() });
  return d.user.contributionsCollection;
}

const today = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
const fmtDate = (iso) => {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso)).split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}${y === Number(today.slice(0, 4)) ? "" : `, ${y}`}`;
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

function render(cc) {
  const all = cc.commitContributionsByRepository || [];
  const pub = all
    .filter((x) => !x.repository.isPrivate && !EXCLUDE.has(x.repository.nameWithOwner))
    .sort((a, b) => b.contributions.totalCount - a.contributions.totalCount)
    .slice(0, MAX);
  const priv = (cc.restrictedContributionsCount || 0) +
    all.filter((x) => x.repository.isPrivate).reduce((a, x) => a + x.contributions.totalCount, 0);

  const X0 = 64, X1 = 1136, TOP = 100, ROW = 92;
  const b = [];
  b.push(`<text x="${X0}" y="64" class="m cap" fill="${C.acc}">ACTIVE PROJECTS</text>`);
  b.push(`<text x="${X1}" y="64" class="m cap" fill="${C.ter}" text-anchor="end">LAST ${DAYS} DAYS · UPDATED ${esc(fmtDate(new Date().toISOString()).toUpperCase())}</text>`);

  if (!pub.length) {
    b.push(`<line x1="${X0}" y1="${TOP}" x2="${X1}" y2="${TOP}" stroke="${C.line}"/>`);
    b.push(`<text x="${X0}" y="${TOP + 48}" class="r" font-size="16" fill="${C.sec}">No public commits in the last ${DAYS} days.</text>`);
  }
  pub.forEach((x, i) => {
    const r = x.repository, y = TOP + i * ROW, n = x.contributions.totalCount;
    const lang = r.primaryLanguage;
    b.push(`<line x1="${X0}" y1="${y}" x2="${X1}" y2="${y}" stroke="${C.line}"/>`);
    b.push(`<text x="${X0}" y="${y + 40}" class="d" font-size="26" letter-spacing="-0.6" fill="${C.txt}">${esc(cut(r.name, 40))}</text>`);
    if (r.description) b.push(`<text x="${X0}" y="${y + 68}" class="r" font-size="15" fill="${C.sec}">${esc(cut(r.description, 96))}</text>`);
    b.push(`<text x="${X1}" y="${y + 40}" class="d" font-size="26" letter-spacing="-0.6" text-anchor="end" fill="${i === 0 ? C.acc : C.txt}">${n}<tspan class="r" font-size="15" letter-spacing="0" fill="${C.sec}" dx="6">${n === 1 ? "commit" : "commits"}</tspan></text>`);
    const meta = `${lang ? `<tspan fill="${esc(lang.color || C.ter)}">●</tspan> ${esc(lang.name)} · ` : ""}pushed ${esc(fmtDate(r.pushedAt))}`;
    b.push(`<text x="${X1}" y="${y + 68}" class="r" font-size="14" text-anchor="end" fill="${C.ter}">${meta}</text>`);
  });

  let y = TOP + Math.max(1, pub.length) * ROW;
  b.push(`<line x1="${X0}" y1="${y}" x2="${X1}" y2="${y}" stroke="${C.line}"/>`);
  if (priv > 0) {
    y += 40;
    b.push(`<text x="${X0}" y="${y}" class="r" font-size="15" fill="${C.sec}">+ ${esc(plural(priv, "contribution"))} to private repositories in the same period</text>`);
  }
  const H = y + 48;
  const label = `Active projects in the last ${DAYS} days: ${pub.map((x) => x.repository.name).join(", ") || "none"}`;
  return TEMPLATE.replaceAll("{{H}}", H).replaceAll("{{H1}}", H - 1).replace("{{LABEL}}", esc(label)).replace("<!--BODY-->", b.join("\n"));
}

const data = await fetchData();
writeFileSync(OUT, render(data));
console.log("stats.svg atualizado");