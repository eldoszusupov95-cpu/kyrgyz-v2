import { useState, useEffect } from "react";
import { geographyQuestions } from "./data/geography.js";
import { historyQuestions } from "./data/history.js";
import { literatureQuestions } from "./data/literature.js";

const SUBJECTS = [
  { id: "geo", name: "География",  ru: "Жер таануу", icon: "🏔️", color: "#10b981", bg: "#10b98115", questions: geographyQuestions  },
  { id: "his", name: "Тарых",      ru: "История",    icon: "📜", color: "#f59e0b", bg: "#f59e0b15", questions: historyQuestions    },
  { id: "lit", name: "Адабият",    ru: "Адабият",    icon: "📖", color: "#a855f7", bg: "#a855f715", questions: literatureQuestions  },
];

const LETTERS = ["А", "Б", "В", "Г"];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getLS(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }
function setLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

export default function App() {
  const [screen,    setScreen]    = useState("home");
  const [subject,   setSubject]   = useState(SUBJECTS[0]);
  const [mode,      setMode]      = useState("all");
  const [questions, setQuestions] = useState([]);
  const [idx,       setIdx]       = useState(0);
  const [chosen,    setChosen]    = useState(null);
  const [revealed,  setRevealed]  = useState(false);
  const [log,       setLog]       = useState([]);
  const [mistakes,  setMistakes]  = useState(() => getLS("kg_mistakes2", {}));
  const [best,      setBest]      = useState(() => getLS("kg_best2",     {}));

  const saveMistakes = m => { setMistakes(m); setLS("kg_mistakes2", m); };
  const saveBest     = b => { setBest(b);     setLS("kg_best2",     b); };

  const startQuiz = (sub, md) => {
    let qs = [...sub.questions];
    if      (md === "r20")      qs = shuffle(qs).slice(0, 20);
    else if (md === "r50")      qs = shuffle(qs).slice(0, Math.min(50, qs.length));
    else if (md === "mistakes") {
      const ids = mistakes[sub.id] || [];
      qs = sub.questions.filter(q => ids.includes(q.id));
      if (!qs.length) { alert("Катаңар жок! Абдан жакшы! 🎉"); return; }
      qs = shuffle(qs);
    }
    setSubject(sub); setMode(md); setQuestions(qs);
    setIdx(0); setChosen(null); setRevealed(false); setLog([]);
    setScreen("quiz");
  };

  const pick = i => {
    if (revealed) return;
    setChosen(i); setRevealed(true);
    const q = questions[idx];
    const ok = i === q.correct;
    setLog(prev => [...prev, { id: q.id, chosen: i, correct: ok }]);
    const m = { ...mistakes };
    if (!m[subject.id]) m[subject.id] = [];
    if (!ok) { if (!m[subject.id].includes(q.id)) m[subject.id].push(q.id); }
    else m[subject.id] = m[subject.id].filter(x => x !== q.id);
    saveMistakes(m);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      const score = log.filter(l => l.correct).length + (revealed && chosen === questions[idx].correct ? 1 : 0);
      const pct = Math.round((score / questions.length) * 100);
      const b = { ...best };
      if (!b[subject.id] || pct > b[subject.id]) { b[subject.id] = pct; saveBest(b); }
      setScreen("result");
    } else {
      setIdx(i => i + 1); setChosen(null); setRevealed(false);
    }
  };

  useEffect(() => {
    if (screen !== "quiz") return;
    const h = e => {
      if (!revealed) {
        if (e.key === "1") pick(0);
        if (e.key === "2") pick(1);
        if (e.key === "3") pick(2);
        if (e.key === "4") pick(3);
      }
      if (e.key === "Enter" && revealed) next();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [screen, revealed, idx, chosen]);

  const q = questions[idx];
  const correctCount = log.filter(l => l.correct).length;
  const progress = questions.length ? (idx / questions.length) * 100 : 0;
  const finalScore = log.filter(l => l.correct).length + (revealed && q && chosen === q.correct ? 1 : 0);

  if (screen === "home")    return <HomeScreen subjects={SUBJECTS} onStart={startQuiz} best={best} mistakes={mistakes} onAnswers={() => setScreen("answers")} />;
  if (screen === "answers") return <AnswersScreen subjects={SUBJECTS} onBack={() => setScreen("home")} />;
  if (screen === "quiz" && q) return <QuizScreen subject={subject} question={q} idx={idx} total={questions.length} chosen={chosen} revealed={revealed} onPick={pick} onNext={next} progress={progress} correctCount={correctCount} onHome={() => setScreen("home")} />;
  if (screen === "result")  return <ResultScreen subject={subject} score={finalScore} total={questions.length} best={best[subject.id] || 0} onHome={() => setScreen("home")} onRetry={() => startQuiz(subject, mode)} />;
  return null;
}

// ──────────────────────────────────────────────────────────────
// HOME SCREEN
// ──────────────────────────────────────────────────────────────
function HomeScreen({ subjects, onStart, best, mistakes, onAnswers }) {
  const [sub,  setSub]  = useState(subjects[0]);
  const [mode, setMode] = useState("all");

  const modes = [
    { id: "all",      label: "Бардыгы",    note: `${sub.questions.length} суроо` },
    { id: "r20",      label: "Аралаш 20",  note: "20 суроо" },
    { id: "r50",      label: "Аралаш 50",  note: "50 суроо" },
    { id: "mistakes", label: "Каталар ❌", note: `${(mistakes[sub.id]||[]).length} ката` },
  ];

  return (
    <div style={S.pg}>
      <Glow />
      <div style={S.wrap}>
        <div style={{ textAlign:"center", marginBottom:28, paddingTop:8 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>🇰🇬</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:"#f1f5f9", letterSpacing:"-0.5px" }}>Кыргызстан Тесттери</h1>
          <p style={{ color:"#475569", fontSize:13, marginTop:5 }}>Билимиңди текшер • Проверь знания</p>
        </div>

        <Label>📚 Предмет тандоо</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
          {subjects.map(s => {
            const active = sub.id === s.id;
            const mc = (mistakes[s.id]||[]).length;
            const b  = best[s.id];
            return (
              <button key={s.id} onClick={() => setSub(s)} style={{
                display:"flex", alignItems:"center", gap:14, padding:"13px 15px",
                borderRadius:16, cursor:"pointer", textAlign:"left", width:"100%",
                background: active ? s.bg : "#1a1d27",
                border: `1.5px solid ${active ? s.color : "rgba(255,255,255,0.06)"}`,
                transition:"all 0.18s", transform: active ? "scale(1.01)" : "scale(1)",
              }}>
                <div style={{ fontSize:26, width:46, height:46, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", background: active ? s.color+"30" : "#ffffff10", flexShrink:0 }}>
                  {s.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, color: active ? s.color : "#e2e8f0", marginBottom:5 }}>{s.name}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <Pill bg={s.color+"22"} color={s.color}>{s.questions.length} суроо</Pill>
                    {mc > 0 && <Pill bg="#ef444420" color="#ef4444">{mc} ката</Pill>}
                  </div>
                  {b !== undefined && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:7 }}>
                      <div style={{ flex:1, height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:b+"%", background:s.color, borderRadius:2, transition:"width 0.5s" }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:s.color, whiteSpace:"nowrap" }}>🏅 {b}%</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <Label>⚡ Режим тандоо</Label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
          {modes.map(m => {
            const active = mode === m.id;
            return (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                padding:"12px 8px", borderRadius:12, cursor:"pointer", transition:"all 0.15s",
                background: active ? sub.color : "#1a1d27",
                border: `1.5px solid ${active ? sub.color : "rgba(255,255,255,0.06)"}`,
                color: active ? "#fff" : "#64748b",
              }}>
                <span style={{ fontWeight:700, fontSize:14 }}>{m.label}</span>
                <span style={{ fontSize:11, opacity:0.8 }}>{m.note}</span>
              </button>
            );
          })}
        </div>

        <Btn color={sub.color} onClick={() => onStart(sub, mode)}>🚀 Баштоо — Start</Btn>
        <Btn color="#1e293b" onClick={onAnswers} style={{ marginTop:10, border:"1.5px solid rgba(255,255,255,0.08)" }}>
          📋 Жооптор баракчасы (Ответы)
        </Btn>

        <div style={{ display:"flex", justifyContent:"center", gap:10, flexWrap:"wrap", marginTop:20 }}>
          {subjects.map(s => (
            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:6, background:"#1a1d27", borderRadius:10, padding:"6px 12px", border:"1px solid rgba(255,255,255,0.06)" }}>
              <span>{s.icon}</span>
              <span style={{ color:"#64748b", fontSize:12 }}>{s.name}:</span>
              <span style={{ color:s.color, fontWeight:700, fontSize:12 }}>{best[s.id] !== undefined ? best[s.id]+"%" : "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ANSWER SHEET
// ──────────────────────────────────────────────────────────────
function AnswersScreen({ subjects, onBack }) {
  const [activeSub, setActiveSub] = useState(subjects[0]);
  const [search, setSearch] = useState("");

  const filtered = activeSub.questions.filter(q => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return q.question.toLowerCase().includes(s) ||
           q.options[q.correct].toLowerCase().includes(s) ||
           String(q.id) === s.trim();
  });

  return (
    <div style={S.pg}>
      <Glow />
      <div style={{ ...S.wrap, maxWidth:640 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <button onClick={onBack} style={{ background:"none", color:"#64748b", fontSize:14, fontWeight:600, cursor:"pointer", padding:"6px 0" }}>← Артка</button>
          <h2 style={{ color:"#f1f5f9", fontSize:18, fontWeight:800, flex:1 }}>📋 Туура Жооптор</h2>
          <span style={{ color:"#475569", fontSize:12 }}>{filtered.length} суроо</span>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:14 }}>
          {subjects.map(s => (
            <button key={s.id} onClick={() => { setActiveSub(s); setSearch(""); }} style={{
              flex:1, padding:"10px 6px", borderRadius:10, cursor:"pointer",
              fontWeight:700, fontSize:12, transition:"all 0.15s",
              background: activeSub.id === s.id ? s.color : "#1a1d27",
              border: `1.5px solid ${activeSub.id === s.id ? s.color : "rgba(255,255,255,0.06)"}`,
              color: activeSub.id === s.id ? "#fff" : "#64748b",
            }}>
              {s.icon} {s.name}<br/>
              <span style={{ fontSize:10, opacity:0.7 }}>{s.questions.length} суроо</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Суроо же жооп издөө..."
          style={{ width:"100%", padding:"11px 16px", borderRadius:12, marginBottom:12,
            background:"#1a1d27", border:"1.5px solid rgba(255,255,255,0.08)",
            color:"#e2e8f0", fontSize:14, outline:"none", fontFamily:"inherit" }} />

        {/* List */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {filtered.map((q, i) => (
            <div key={q.id} style={{
              background: i%2===0 ? "#1a1d27" : "#141720",
              border:"1px solid rgba(255,255,255,0.05)",
              borderRadius:12, padding:"12px 14px",
              borderLeft:`3px solid ${activeSub.color}`,
            }}>
              <div style={{ display:"flex", gap:10 }}>
                <span style={{ ...S.pill, background:activeSub.color+"22", color:activeSub.color, fontSize:11, flexShrink:0, marginTop:1 }}>#{q.id}</span>
                <div style={{ flex:1 }}>
                  <p style={{ color:"#cbd5e1", fontSize:13, lineHeight:1.6, marginBottom:7, whiteSpace:"pre-wrap" }}>{q.question}</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{
                        display:"flex", gap:8, alignItems:"center",
                        padding:"4px 8px", borderRadius:7,
                        background: oi===q.correct ? "#10b98115" : "transparent",
                        border:`1px solid ${oi===q.correct ? "#10b98140" : "transparent"}`,
                      }}>
                        <span style={{
                          fontSize:10, fontWeight:800, width:18, height:18, borderRadius:5,
                          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                          background: oi===q.correct ? "#10b981" : "rgba(255,255,255,0.05)",
                          color: oi===q.correct ? "#fff" : "#3f4b5c",
                        }}>{oi===q.correct ? "✓" : LETTERS[oi]}</span>
                        <span style={{
                          fontSize:13, fontWeight: oi===q.correct ? 700 : 400,
                          color: oi===q.correct ? "#10b981" : "#475569",
                        }}>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ height:40 }} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// QUIZ SCREEN
// ──────────────────────────────────────────────────────────────
function QuizScreen({ subject, question, idx, total, chosen, revealed, onPick, onNext, progress, correctCount, onHome }) {
  return (
    <div style={S.pg}>
      <Glow />
      <div style={{ ...S.wrap, maxWidth:560 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <button onClick={onHome} style={{ background:"none", color:"#475569", fontSize:14, fontWeight:600, cursor:"pointer" }}>← Чыгуу</button>
          <Pill bg={subject.bg} color={subject.color}>{subject.icon} {subject.name}</Pill>
          <span style={{ color:"#10b981", fontWeight:700, fontSize:14 }}>✓ {correctCount}</span>
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden", marginBottom:6 }}>
            <div style={{ height:"100%", width:progress+"%", background:subject.color, borderRadius:3, transition:"width 0.4s ease" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:"#475569", fontSize:12 }}>{idx+1} / {total}</span>
            <span style={{ color:"#475569", fontSize:12 }}>{Math.round((idx/total)*100)}%</span>
          </div>
        </div>

        <div style={{ background:"#1a1d27", border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, padding:"18px 18px 20px", marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:subject.color, marginBottom:10 }}>#{question.id}</div>
          <p style={{ color:"#f1f5f9", fontSize:15, lineHeight:1.75, fontWeight:500, whiteSpace:"pre-wrap" }}>{question.question}</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:14 }}>
          {question.options.map((opt, i) => {
            let bg="#1a1d27", brd="1.5px solid rgba(255,255,255,0.07)", col="#cbd5e1";
            let lBg="rgba(255,255,255,0.07)", lCol="#64748b", icon=LETTERS[i], glow="none";
            if (revealed) {
              if (i===question.correct) { bg="#10b98115"; brd="1.5px solid #10b981"; col="#10b981"; lBg="#10b981"; lCol="#fff"; icon="✓"; glow="0 0 18px #10b98128"; }
              else if (i===chosen)      { bg="#ef444415"; brd="1.5px solid #ef4444"; col="#ef4444"; lBg="#ef4444"; lCol="#fff"; icon="✗"; }
            } else if (chosen===i) {
              bg=subject.bg; brd=`1.5px solid ${subject.color}`; col=subject.color; lBg=subject.color; lCol="#fff";
            }
            return (
              <button key={i} onClick={() => onPick(i)} style={{
                display:"flex", alignItems:"center", gap:12, padding:"13px 15px",
                borderRadius:13, transition:"all 0.15s", textAlign:"left", width:"100%",
                background:bg, border:brd, color:col, boxShadow:glow,
                cursor:revealed?"default":"pointer",
                transform:!revealed&&chosen===i?"scale(1.01)":"scale(1)",
              }}>
                <span style={{ minWidth:34, height:34, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, flexShrink:0, transition:"all 0.15s", background:lBg, color:lCol }}>{icon}</span>
                <span style={{ fontSize:14, fontWeight:500, lineHeight:1.4, flex:1 }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {revealed && <Btn color={subject.color} onClick={onNext}>{idx+1>=total ? "🏁 Жыйынтыкка" : "Кийинки →"}</Btn>}
        <p style={{ textAlign:"center", color:"#1e293b", fontSize:12, marginTop:10 }}>Баскычтоп: 1–4 тандоо • Enter кийинки</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// RESULT SCREEN
// ──────────────────────────────────────────────────────────────
function ResultScreen({ subject, score, total, best, onHome, onRetry }) {
  const pct = Math.round((score/total)*100);
  const isNew = pct >= best && pct > 0;
  let emoji="😔", msg="Дагы бир жолу жатка бер!";
  if (pct>=90){emoji="🏆";msg="Мыкты! Абдан жакшы!";}
  else if(pct>=75){emoji="🎉";msg="Жакшы! Улантыңыз!";}
  else if(pct>=50){emoji="💪";msg="Аракет жакшы!";}
  return (
    <div style={S.pg}>
      <Glow />
      <div style={{ ...S.wrap, maxWidth:420 }}>
        <div style={{ background:"#1a1d27", border:"1px solid rgba(255,255,255,0.07)", borderRadius:24, padding:"36px 28px", textAlign:"center", marginTop:40 }}>
          <div style={{ fontSize:60 }}>{emoji}</div>
          {isNew && <Pill bg={subject.color+"22"} color={subject.color} style={{ margin:"8px auto" }}>🆕 Жаңы рекорд!</Pill>}
          <div style={{ fontSize:80, fontWeight:900, color:subject.color, lineHeight:1, marginTop:8 }}>{pct}%</div>
          <p style={{ color:"#94a3b8", fontSize:15, margin:"8px 0 24px" }}>{msg}</p>
          <div style={{ display:"flex", justifyContent:"center", gap:24, marginBottom:28 }}>
            {[["#10b981",score,"Туура"],["#ef4444",total-score,"Жаңылыш"],[subject.color,best+"%","Рекорд"]].map(([cl,val,lb])=>(
              <div key={lb} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ color:cl, fontSize:30, fontWeight:800 }}>{val}</div>
                <div style={{ color:"#475569", fontSize:12 }}>{lb}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn color={subject.color} onClick={onRetry} style={{ flex:1 }}>🔄 Кайталоо</Btn>
            <Btn color="#0f172a" onClick={onHome} style={{ flex:1, border:"1px solid rgba(255,255,255,0.08)" }}>🏠 Башкы бет</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SHARED COMPONENTS & STYLES
// ──────────────────────────────────────────────────────────────
function Glow() {
  return <>
    <div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:"radial-gradient(ellipse 80% 60% at 20% 5%, #7c3aed18 0%, transparent 55%)" }} />
    <div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:"radial-gradient(ellipse 70% 50% at 85% 90%, #10b98112 0%, transparent 55%)" }} />
  </>;
}
function Pill({ bg, color, children, style }) {
  return <span style={{ padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600, display:"inline-block", background:bg, color, ...style }}>{children}</span>;
}
function Label({ children }) {
  return <div style={{ color:"#475569", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, marginBottom:10, marginTop:18 }}>{children}</div>;
}
function Btn({ color, onClick, children, style }) {
  return (
    <button onClick={onClick} style={{ width:"100%", padding:"15px", borderRadius:14, color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:"inherit", background:color, border:"none", transition:"opacity 0.15s", ...style }}>
      {children}
    </button>
  );
}

const S = {
  pg:   { minHeight:"100vh", position:"relative", overflowX:"hidden" },
  wrap: { position:"relative", zIndex:1, maxWidth:600, margin:"0 auto", padding:"24px 16px 60px" },
  pill: { padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600, display:"inline-block" },
};
