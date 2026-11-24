// Gera stats.svg: projetos públicos com mais commits nos últimos 30 dias.
// Repositórios privados nunca aparecem por nome; entram só na soma de "private contributions".
import { readFileSync, writeFileSync } from "node:fs";

const USER = process.env.USERNAME || "Leonard0MF";
const TOKEN = process.env.GH_TOKEN;
const DAYS = 30;
const MAX = 4;
// Repositórios públicos que nunca devem aparecer (owner/name, separados por vírgula)
const EXCLUDE = new Set([`${USER}/${USER}`, ...(process.env.EXCLUDE || "").split(",").map((s) => s.trim()).filter(Boolean)]);
// Linha que agrupa todo o trabalho em repositórios privados (sem nomes)
const PRIVATE_LABEL = process.env.PRIVATE_LABEL || "Private work";
const PRIVATE_DESC = process.env.PRIVATE_DESC || "";
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

function render(cc) {
  const all = cc.commitContributionsByRepository || [];
  const priv = (cc.restrictedContributionsCount || 0) +
    all.filter((x) => x.repository.isPrivate).reduce((a, x) => a + x.contributions.totalCount, 0);
  const rows = all
    .filter((x) => !x.repository.isPrivate && !EXCLUDE.has(x.repository.nameWithOwner))
    .map((x) => ({ name: x.repository.name, desc: x.repository.description, n: x.contributions.totalCount,
      lang: x.repository.primaryLanguage, pushed: x.repository.pushedAt }));
  if (priv > 0) rows.push({ name: PRIVATE_LABEL, desc: PRIVATE_DESC, n: priv, private: true });
  const pub = rows.sort((a, b) => b.n - a.n).slice(0, MAX);

  const X0 = 64, X1 = 1136, TOP = 100, ROW = 92;
  const b = [];
  b.push(`<text x="${X0}" y="64" class="m cap" fill="${C.acc}">ACTIVE PROJECTS</text>`);
  b.push(`<text x="${X1}" y="64" class="m cap" fill="${C.ter}" text-anchor="end">LAST ${DAYS} DAYS · UPDATED ${esc(fmtDate(new Date().toISOString()).toUpperCase())}</text>`);

  if (!pub.length) {
    b.push(`<line x1="${X0}" y1="${TOP}" x2="${X1}" y2="${TOP}" stroke="${C.line}"/>`);
    b.push(`<text x="${X0}" y="${TOP + 48}" class="r" font-size="16" fill="${C.sec}">No public commits in the last ${DAYS} days.</text>`);
  }
  pub.forEach((x, i) => {
    const y = TOP + i * ROW, n = x.n;
    b.push(`<line x1="${X0}" y1="${y}" x2="${X1}" y2="${y}" stroke="${C.line}"/>`);
    b.push(`<text x="${X0}" y="${y + 40}" class="d" font-size="26" letter-spacing="-0.6" fill="${C.txt}">${esc(cut(x.name, 40))}</text>`);
    if (x.desc) b.push(`<text x="${X0}" y="${y + 68}" class="r" font-size="15" fill="${C.sec}">${esc(cut(x.desc, 96))}</text>`);
    const unit = x.private ? (n === 1 ? "contribution" : "contributions") : (n === 1 ? "commit" : "commits");
    b.push(`<text x="${X1}" y="${y + 40}" class="d" font-size="26" letter-spacing="-0.6" text-anchor="end" fill="${i === 0 ? C.acc : C.txt}">${n}<tspan class="r" font-size="15" letter-spacing="0" fill="${C.sec}" dx="6">${unit}</tspan></text>`);
    const meta = x.private
      ? `<tspan fill="${C.ter}">●</tspan> private repositories`
      : `${x.lang ? `<tspan fill="${esc(x.lang.color || C.ter)}">●</tspan> ${esc(x.lang.name)} · ` : ""}pushed ${esc(fmtDate(x.pushed))}`;
    b.push(`<text x="${X1}" y="${y + 68}" class="r" font-size="14" text-anchor="end" fill="${C.ter}">${meta}</text>`);
  });

  const y = TOP + Math.max(1, pub.length) * ROW;
  b.push(`<line x1="${X0}" y1="${y}" x2="${X1}" y2="${y}" stroke="${C.line}"/>`);
  const H = y + 48;
  const label = `Active projects in the last ${DAYS} days: ${pub.map((x) => x.name).join(", ") || "none"}`;
  return TEMPLATE.replaceAll("{{H}}", H).replaceAll("{{H1}}", H - 1).replace("{{LABEL}}", esc(label)).replace("<!--BODY-->", b.join("\n"));
}

const data = await fetchData();
writeFileSync(OUT, render(data));
console.log("stats.svg atualizado");