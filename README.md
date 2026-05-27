import { useState, useEffect, useRef } from "react";

// ─── BATMAN / GHOST MATRIX RAIN ──────────────────────────────────────────────
function MatrixRain({ height = 180 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = height;
    const cols = Math.floor(canvas.width / 16);
    const drops = Array(cols).fill(1);
    const chars = "01𝕏⚠️☠️⚡AMK</>{}[];🦇";
    let raf;
    const draw = () => {
      // Fundo totalmente preto com rastro sutil
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "14px monospace";
      drops.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const bright = Math.random() > 0.98;
        // Chuva cinza escuro / branca tática, sem verde colorido
        ctx.fillStyle = bright ? "#E5A93C" : (Math.random() > 0.7 ? "#FFFFFF" : "#333333");
        ctx.fillText(ch, i * 16, y * 16);
        if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [height]);
  return <canvas ref={canvasRef} style={{ width: "100%", height, display: "block", borderRadius: "12px 12px 0 0" }} />;
}

// ─── BATMAN TERMINAL ─────────────────────────────────────────────────────────
const TERMINAL_LINES = [
  { prompt: "leo@gotham:~$", cmd: " whoami", delay: 0 },
  { out: "Web Developer | Cybersecurity Specialist | Aegis Architect", delay: 600 },
  { prompt: "leo@gotham:~$", cmd: " cat core_stack.json", delay: 1200 },
  { out: "{ \"frontend\": [\"Next.js\", \"TypeScript\", \"Tailwind CSS\"], \"backend\": \"FastAPI\" }", delay: 1800 },
  { prompt: "leo@gotham:~$", cmd: " check --security-status", delay: 2400 },
  { out: "🛡️ Deep Threat Intelligence & Web Architecture synchronized.", delay: 3000 },
  { prompt: "leo@gotham:~$", cmd: " ls -la ./projects", delay: 3600 },
  { out: "drwxr-xr-x  aegis-dashboard/  elyra-studio/  crypt-tools/", delay: 4200 },
  { prompt: "leo@gotham:~$", cmd: " _", delay: 4800, cursor: true },
];

function Terminal() {
  const [visible, setVisible] = useState([]);
  useEffect(() => {
    TERMINAL_LINES.forEach((line, i) => {
      setTimeout(() => setVisible(v => [...v, i]), line.delay);
    });
  }, []);
  return (
    <div style={{
      background: "#000000", border: "1px solid #1A1A1A",
      borderRadius: 10, padding: "16px 20px", fontFamily: "'Fira Code', monospace",
      fontSize: 13, lineHeight: 2, minHeight: 200,
      boxShadow: "0 10px 30px rgba(0,0,0,0.7)"
    }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["#1A1A1A","#333333","#E5A93C"].map(c => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c, border: "1px solid #000" }} />
        ))}
        <span style={{ color: "#666666", fontSize: 11, marginLeft: 6 }}>leo@gotham — secure-bash</span>
      </div>
      {TERMINAL_LINES.map((line, i) => !visible.includes(i) ? null : (
        <div key={i} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {line.prompt && <span style={{ color: "#E5A93C" }}>{line.prompt}</span>}
          {line.cmd && <span style={{ color: "#FFFFFF" }}>{line.cmd}</span>}
          {line.out && <span style={{ color: "#888888", paddingLeft: 4 }}>{line.out}</span>}
          {line.cursor && <span style={{ color: "#E5A93C", animation: "blink 1s step-end infinite" }}>█</span>}
        </div>
      ))}
    </div>
  );
}

// ─── TACTICAL CARD ──────────────────────────────────────────────────────────
function GifCard({ src, label, note }) {
  return (
    <div style={{
      background: "#050505", border: "1px solid #111111", borderRadius: 10,
      overflow: "hidden", flex: "1 1 200px", transition: "all 0.3s"
    }}>
      <img src={src} alt={label} style={{ width: "100%", display: "block", maxHeight: 140, objectFit: "cover", filter: "grayscale(30%)" }}
        onError={e => { e.target.src = "https://media.giphy.com/media/ZVik7pIojeZ0E/giphy.gif"; }} />
      <div style={{ padding: "10px 12px" }}>
        <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 13 }}>{label}</div>
        <div style={{ color: "#666666", fontSize: 11, marginTop: 2 }}>{note}</div>
      </div>
    </div>
  );
}

// ─── TACTICAL SKILL BAR ─────────────────────────────────────────────────────
function SkillBar({ label, pct, color, icon }) {
  const [w, setW] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setTimeout(() => setW(pct), 100); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [pct]);
  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: "#EEEEEE", fontSize: 13 }}>{icon} {label}</span>
        <span style={{ color: color, fontSize: 12, fontFamily: "monospace", fontWeight: "bold" }}>{pct}%</span>
      </div>
      <div style={{ background: "#111111", borderRadius: 2, height: 5, overflow: "hidden", border: "1px solid #222" }}>
        <div style={{
          height: "100%",
          background: color,
          width: `${w}%`, transition: "width 1.5s cubic-bezier(.4,0,.2,1)",
          boxShadow: `0 0 10px ${color}AA`,
        }} />
      </div>
    </div>
  );
}

// ─── COPY BUTTON ────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      style={{
        background: ok ? "#E5A93C11" : "#000000", border: `1px solid ${ok ? "#E5A93C" : "#222222"}`,
        color: ok ? "#E5A93C" : "#888888", padding: "6px 16px", borderRadius: 4,
        cursor: "pointer", fontSize: 12, fontFamily: "monospace", transition: "all .2s",
      }}>
      {ok ? "[ SAVED ]" : "[ COPY CODE ]"}
    </button>
  );
}

// ─── THE BATMAN EXCLUSIVE README.MD ─────────────────────────────────────────
const README = `<!-- ═ BATMAN TRIPLE-BLACK THEME HIGH-END PORTFOLIO ═ -->
<div align="center">

<!-- Minimalist Dark Header -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=000000&height=180&section=header&text=LEO%20FRANCISCO&fontSize=65&fontColor=ffffff&animation=fadeIn&fontAlignY=45&desc=Web%20Architecture%20%7C%20Cybersecurity%20Intelligence&descSize=15&descAlignY=68&descColor=666666" />

<br/>

<!-- Premium Typing SVG -->
[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=19&duration=3000&pause=1000&color=E5A93C&center=true&vCenter=true&width=600&lines=⚡+Building+High-Performance+Web+Applications;🛡️+Specializing+in+Cyber+Threat+Intelligence;💻+Next.js+%7C+TypeScript+%7C+Tailwind;🦇+Developing+%40+Aegis+Dashboard+and+Elyra+Studio)](https://git.io/typing-svg)

<!-- Obsidian Badges -->
![](https://komarev.com/ghpvc/?username=Leonard0MF&color=111111&style=flat-square&label=TARGETS+SCOUTED)
![](https://img.shields.io/github/followers/Leonard0MF?style=flat-square&color=111111&label=OPERATIVES)

<br/>

<!-- Dark Cyber Aesthetic Banner -->
<img src="https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif" width="450" style="border-radius:6px; border: 1px solid #1A1A1A; filter: grayscale(40%);" />

</div>

---

### 🖥️ Secure Terminal Environment

\`\`\`bash
leo@gotham:~$ whoami
  > Web Developer & Cybersecurity Analyst
  > Specializing in bulletproof architectures & offensive tactics.

leo@gotham:~$ cat core_mission.json
  {
    "current_project": "Aegis Intelligence Dashboard",
    "focus": "Next.js core performance paired with elite cyber visibility",
    "operation_base": "Elyra Studio",
    "philosophy": "If it builds, it must be secured."
  }

leo@gotham:~$ systemctl status active-stack
  ● frontend.service - Next.js, React, TypeScript, Tailwind CSS
  ● backend.service  - FastAPI, Node.js, Python, PostgreSQL
  ● security.service - Penetration Testing, OWASP Top 10, Port Scanning, OSINT
\`\`\`

---

### 🗃️ Tactical Armory (Tech Stack)

<div align="center">

**⚔️ Core Languages**
<br>
<img src="https://img.shields.io/badge/TypeScript-000000?style=for-the-badge&logo=typescript&logoColor=FFFFFF&border=111111" />
<img src="https://img.shields.io/badge/JavaScript-000000?style=for-the-badge&logo=javascript&logoColor=CCCCCC" />
<img src="https://img.shields.io/badge/Python-000000?style=for-the-badge&logo=python&logoColor=E5A93C" />

<br>

**🛡️ Web Engineering & UI**
<br>
<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=FFFFFF" />
<img src="https://img.shields.io/badge/React-000000?style=for-the-badge&logo=react&logoColor=888888" />
<img src="https://img.shields.io/badge/TailwindCSS-000000?style=for-the-badge&logo=tailwindcss&logoColor=FFFFFF" />

<br>

**⚙️ Back-end Infrastructure**
<br>
<img src="https://img.shields.io/badge/FastAPI-000000?style=for-the-badge&logo=fastapi&logoColor=FFFFFF" />
<img src="https://img.shields.io/badge/Node.js-000000?style=for-the-badge&logo=nodedotjs&logoColor=CCCCCC" />
<img src="https://img.shields.io/badge/PostgreSQL-000000?style=for-the-badge&logo=postgresql&logoColor=E5A93C" />
<img src="https://img.shields.io/badge/Docker-000000?style=for-the-badge&logo=docker&logoColor=FFFFFF" />

<br>

**🦇 Cyber Ops**
<br>
<img src="https://img.shields.io/badge/Kali_Linux-000000?style=for-the-badge&logo=kalilinux&logoColor=FFFFFF" />
<img src="https://img.shields.io/badge/Nmap-000000?style=for-the-badge&logo=nmap&logoColor=CCCCCC" />
<img src="https://img.shields.io/badge/OSINT_Intelligence-000000?style=for-the-badge&logoColor=E5A93C" />

</div>

---

### 📊 Tactical Metrics

<div align="center">
  <!-- Sincronizados com o tema puramente escuro (dark/obsidian/tokyonight custom) -->
  <img height="165" src="https://github-readme-stats.vercel.app/api?username=Leonard0MF&show_icons=true&theme=dark&include_all_commits=true&count_private=true&hide_border=true&bg_color=000000&title_color=E5A93C&icon_color=E5A93C&text_color=999999"/>
  <img height="165" src="https://github-readme-stats.vercel.app/api/top-langs/?username=Leonard0MF&layout=compact&langs_count=6&theme=dark&hide_border=true&bg_color=000000&title_color=E5A93C&text_color=999999"/>
</div>

<div align="center" style="margin-top: 10px;">
  <img src="https://streak-stats.demolab.com?user=Leonard0MF&theme=dark&hide_border=true&background=000000&ring=E5A93C&fire=E5A93C&currStreakLabel=E5A93C" />
</div>

---

### 📈 Operation Graph

<div align="center">
  <img src="https://github-readme-activity-graph.vercel.app/graph?username=Leonard0MF&theme=github-compact&hide_border=true&bg_color=000000&color=E5A93C&line=E5A93C" width="100%"/>
</div>

---

### 🔗 Secure Vectors

<div align="center">

[![LinkedIn](https://img.shields.io/badge/LinkedIn-000000?style=for-the-badge&logo=linkedin&logoColor=FFFFFF)](https://www.linkedin.com/in/leonardo-machmann-francisco-898902399)
[![Elyra Studio](https://img.shields.io/badge/Elyra_Studio-000000?style=for-the-badge&logo=github&logoColor=E5A93C)](https://github.com/ElyraStudio)

</div>`;

// ─── MAIN APP CONTAINER ──────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("preview");

  const GIFS = [
    {
      src: "https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif",
      label: "Hacker Dashboard Workspace",
      note: "Ativo principal — Tela escura ideal para o topo do perfil."
    },
    {
      src: "https://media.giphy.com/media/RbDKaczqWovIugyJmW/giphy.gif",
      label: "Offensive Matrix Code",
      note: "Aesthetic perfeito para a seção de Cibersegurança."
    },
    {
      src: "https://media.giphy.com/media/coxQHKASG60HrHtvkt/giphy.gif",
      label: "Tactical Shell Monitoring",
      note: "Excelente para colocar perto do bloco do terminal."
    },
  ];

  return (
    <div style={{ background: "#000000", minHeight: "100vh", color: "#FFFFFF", fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tacticalGlow { 0%,100%{text-shadow:0 0 6px rgba(229,169,60,0.2)} 50%{text-shadow:0 0 16px rgba(229,169,60,0.6)} }
        
        .tab { background:none; border:none; cursor:pointer; padding:12px 20px; font-size:12px; font-family: 'Fira Code', monospace; font-weight:600; transition:all .2s; letter-spacing: 1px; }
        .tab:hover { background:#111111; color: #FFFFFF; }
        .tab.on { background:#0A0A0A; color:#E5A93C; border-bottom:2px solid #E5A93C; }
        
        pre { white-space:pre-wrap; word-break:break-all; font-family:'Fira Code',monospace; font-size:12px; line-height:1.8; color:#AAAAAA; margin:0; }
        ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:#000000} ::-webkit-scrollbar-thumb{background:#222222;border-radius:2px}
        img { max-width:100%; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5)); }
      `}</style>

      {/* ── TACTICAL RAIN HEADER ── */}
      <div style={{ position: "relative", borderBottom: "1px solid #111111" }}>
        <MatrixRain height={160} />
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 6,
          background: "linear-gradient(to bottom, transparent 20%, #000000 100%)",
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 3, animation: "tacticalGlow 2.5s ease-in-out infinite", fontFamily: "monospace" }}>
            <span style={{ color: "#FFFFFF" }}>LEO</span>
            <span style={{ color: "#E5A93C" }}> FRANCISCO</span>
          </div>
          <div style={{ color: "#666666", fontFamily: "'Fira Code', monospace", fontSize: 12, letterSpacing: 1 }}>
            [ SYSTEM ARCHITECTURE & CYBER INTELLIGENCE ]
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px" }}>

        {/* ── TACTICAL TABS ── */}
        <div style={{ display: "flex", gap: 2, padding: "16px 0 0", borderBottom: "1px solid #111111", marginBottom: 28 }}>
          {[["preview","// VIEW"], ["gifs","// ASSETS"], ["readme","// README.md"]].map(([id, label]) => (
            <button key={id} className={`tab${tab===id?" on":""}`} onClick={() => setTab(id)}
              style={{ color: tab===id ? "#E5A93C" : "#555555" }}>{label}</button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <CopyBtn text={README} />
          </div>
        </div>

        {/* ── PREVIEW TAB ── */}
        {tab === "preview" && (
          <div style={{ paddingBottom: 48, animation: "fadeInUp .3s ease" }}>

            {/* Banner Workspace */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <img src="https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif"
                style={{ width: "100%", maxWidth: 450, borderRadius: 6, border: "1px solid #111111", filter: "grayscale(20%)" }}
                alt="workspace banner" />
            </div>

            {/* Terminal Widget */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ color: "#444444", fontFamily: "monospace", fontSize: 11, letterSpacing: 2, fontWeight: 600, marginBottom: 12 }}>[ EXECUTE CORE_PROFILE ]</div>
              <Terminal />
            </div>

            {/* Proficiency Indicators */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ color: "#444444", fontFamily: "monospace", fontSize: 11, letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>[ SYSTEMS CALIBRATION ]</div>
              <div style={{ background: "#050505", border: "1px solid #111111", borderRadius: 8, padding: "20px 24px" }}>
                <SkillBar label="Next.js / TypeScript Web Architecture" pct={85} color="#FFFFFF" icon="⚡" />
                <SkillBar label="FastAPI / Back-end Logic" pct={75} color="#AAAAAA" icon="⚙️" />
                <SkillBar label="Cybersecurity Defense & OSINT Intel" pct={70} color="#E5A93C" icon="🛡️" />
                <SkillBar label="Database & Containerized Infrastructure" pct={65} color="#444444" icon="📦" />
              </div>
            </div>

            {/* Mocked Stats Layout */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ color: "#444444", fontFamily: "monospace", fontSize: 11, letterSpacing: 2, fontWeight: 600, marginBottom: 12 }}>[ QUANTUM INTELLIGENCE STATS ]</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "#000", padding: 10, border: "1px solid #111", borderRadius: 8 }}>
                <div style={{ flex: "1 1 280px", background: "#050505", padding: 15, borderRadius: 6, color: "#666", fontSize: 12, fontFamily: "monospace" }}>
                  <span style={{ color: "#E5A93C" }}>⚡ Top Technologies:</span> TypeScript, Next.js, FastAPI, Python, Tailwind.
                </div>
                <div style={{ flex: "1 1 280px", background: "#050505", padding: 15, borderRadius: 6, color: "#666", fontSize: 12, fontFamily: "monospace" }}>
                  <span style={{ color: "#FFFFFF" }}>🔑 Threat Intel Base:</span> Port Scanning, Secure Architecture, Web Hardening.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── ASSETS TAB ── */}
        {tab === "gifs" && (
          <div style={{ paddingBottom: 48, animation: "fadeInUp .3s ease" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {GIFS.map(g => <GifCard key={g.label} {...g} />)}
            </div>
          </div>
        )}

        {/* ── README CODE SOURCE TAB ── */}
        {tab === "readme" && (
          <div style={{ paddingBottom: 48, animation: "fadeInUp .3s ease" }}>
            <div style={{ background: "#050505", border: "1px solid #111111", borderRadius: 8, padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #1A1A1A", paddingBottom: 12 }}>
                <span style={{ color: "#444444", fontSize: 12, fontFamily: "monospace" }}>📄 Destination: Leonard0MF/README.md</span>
                <CopyBtn text={README} />
              </div>
              <pre>{README}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
