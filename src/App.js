import { useState, useEffect } from "react";

const HOLES = Array.from({ length: 18 }, (_, i) => i + 1);

const defaultHole = () => ({
  fairwayHit: null,
  fairwayBunker: false,
  outOfBounds: 0,
  hazardPenalty: 0,
  gir: null,
  greenSideBunker: false,
  firstPuttLength: "",
  totalPutts: "",
  note: "",
});

const defaultRound = () => ({
  id: Date.now(),
  date: new Date().toISOString().split("T")[0],
  course: "",
  holes: HOLES.map(() => defaultHole()),
});

const STORAGE_KEY = "golf_rounds_v1";

function loadRounds() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveRounds(rounds) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds)); } catch {}
}

function Toggle({ value, onChange, labels = ["Yes", "No", "N/A"], values = [true, false, null] }) {
  return (
    <div className="toggle-group">
      {labels.map((label, i) => (
        <button key={i} className={`toggle-btn ${value === values[i] ? "active" : ""}`}
          onClick={() => onChange(values[i])} type="button">{label}</button>
      ))}
    </div>
  );
}

function Stepper({ value, onChange, min = 0, max = 9 }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

function HoleCard({ holeNum, data, onChange, active, onActivate }) {
  const update = (field, val) => onChange({ ...data, [field]: val });
  const isComplete = data.totalPutts !== "" && data.gir !== null;

  return (
    <div className={`hole-card ${active ? "expanded" : ""} ${isComplete ? "done" : ""}`}>
      <div className="hole-header" onClick={onActivate}>
        <div className="hole-num">
          <span className="hole-label">HOLE</span>
          <span className="hole-digit">{holeNum}</span>
        </div>
        <div className="hole-summary">
          {data.totalPutts !== "" && <span className="pill">⛳ {data.totalPutts}</span>}
          {data.gir === true && <span className="pill green">GIR ✓</span>}
          {data.gir === false && <span className="pill gray">GIR ✗</span>}
          {data.outOfBounds > 0 && <span className="pill red">OB ×{data.outOfBounds}</span>}
          {data.fairwayBunker && <span className="pill amber">FW Bkr</span>}
          {data.greenSideBunker && <span className="pill amber">GS Bkr</span>}
        </div>
        <span className="chevron">{active ? "▲" : "▼"}</span>
      </div>

      {active && (
        <div className="hole-body">
          <div className="field-row">
            <label>Fairway Hit</label>
            <Toggle value={data.fairwayHit} onChange={v => update("fairwayHit", v)} />
          </div>
          <div className="field-row">
            <label>Fairway Bunker</label>
            <Toggle value={data.fairwayBunker} onChange={v => update("fairwayBunker", v)}
              labels={["Yes", "No"]} values={[true, false]} />
          </div>
          <div className="field-row">
            <label>Out of Bounds</label>
            <Stepper value={data.outOfBounds} onChange={v => update("outOfBounds", v)} />
          </div>
          <div className="field-row">
            <label>Hazard Penalty</label>
            <Stepper value={data.hazardPenalty} onChange={v => update("hazardPenalty", v)} />
          </div>
          <div className="field-row">
            <label>Green in Regulation</label>
            <Toggle value={data.gir} onChange={v => update("gir", v)}
              labels={["Yes", "No"]} values={[true, false]} />
          </div>
          <div className="field-row">
            <label>Green Side Bunker</label>
            <Toggle value={data.greenSideBunker} onChange={v => update("greenSideBunker", v)}
              labels={["Yes", "No"]} values={[true, false]} />
          </div>
          <div className="field-row">
            <label>1st Putt Length <span className="unit">(ft)</span></label>
            <input className="num-input" type="number" min="0" max="200" placeholder="—"
              value={data.firstPuttLength} onChange={e => update("firstPuttLength", e.target.value)} />
          </div>
          <div className="field-row">
            <label>Total Putts</label>
            <Stepper value={data.totalPutts === "" ? 0 : Number(data.totalPutts)}
              onChange={v => update("totalPutts", v)} />
          </div>
          <div className="field-col">
            <label>Note</label>
            <textarea placeholder="Anything worth remembering…" value={data.note}
              onChange={e => update("note", e.target.value)} rows={2} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatsPanel({ round }) {
  const h = round.holes;
  const played = h.filter(x => x.totalPutts !== "");
  if (played.length === 0) return <p className="no-data">No holes recorded yet.</p>;

  const totalPutts = played.reduce((s, x) => s + Number(x.totalPutts), 0);
  const girs = h.filter(x => x.gir === true).length;
  const fwHits = h.filter(x => x.fairwayHit === true).length;
  const fwOpps = h.filter(x => x.fairwayHit !== null).length;
  const ob = h.reduce((s, x) => s + x.outOfBounds, 0);
  const hazard = h.reduce((s, x) => s + x.hazardPenalty, 0);
  const fwBunker = h.filter(x => x.fairwayBunker).length;
  const gsBunker = h.filter(x => x.greenSideBunker).length;
  const puttLengths = h.filter(x => x.firstPuttLength !== "").map(x => Number(x.firstPuttLength));
  const avgFirstPutt = puttLengths.length
    ? (puttLengths.reduce((a, b) => a + b, 0) / puttLengths.length).toFixed(1) : "—";

  const stat = (label, value, sub) => (
    <div className="stat-box">
      <div className="stat-val">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );

  return (
    <div className="stats-grid">
      {stat("Total Putts", totalPutts, `${(totalPutts / played.length).toFixed(1)} avg/hole`)}
      {stat("GIR", `${girs}/18`, `${Math.round(girs / 18 * 100)}%`)}
      {stat("Fairways", fwOpps > 0 ? `${fwHits}/${fwOpps}` : "—", fwOpps > 0 ? `${Math.round(fwHits / fwOpps * 100)}%` : "")}
      {stat("Avg 1st Putt", avgFirstPutt !== "—" ? `${avgFirstPutt} ft` : "—")}
      {stat("OB Penalties", ob)}
      {stat("Hazard Penalties", hazard)}
      {stat("FW Bunkers", fwBunker)}
      {stat("GS Bunkers", gsBunker)}
    </div>
  );
}

function RoundRow({ round, onSelect, onDelete }) {
  const h = round.holes;
  const putts = h.filter(x => x.totalPutts !== "").reduce((s, x) => s + Number(x.totalPutts), 0);
  const girs = h.filter(x => x.gir === true).length;
  const fwHits = h.filter(x => x.fairwayHit === true).length;

  return (
    <div className="round-row">
      <div className="round-info" onClick={onSelect}>
        <span className="round-date">{round.date}</span>
        <span className="round-course">{round.course || "Unnamed Course"}</span>
      </div>
      <div className="round-chips">
        <span className="chip">⛳ {putts} putts</span>
        <span className="chip">{girs}/18 GIR</span>
        <span className="chip">{fwHits} FW</span>
      </div>
      <button className="del-btn" onClick={onDelete}>✕</button>
    </div>
  );
}

export default function GolfTracker() {
  const [view, setView] = useState("home");
  const [rounds, setRounds] = useState(loadRounds);
  const [activeRound, setActiveRound] = useState(null);
  const [activeHole, setActiveHole] = useState(0);
  const [reviewRound, setReviewRound] = useState(null);

  useEffect(() => { saveRounds(rounds); }, [rounds]);

  const startNewRound = () => {
    const r = defaultRound();
    setActiveRound(r);
    setActiveHole(0);
    setView("entry");
  };

  const updateHole = (idx, data) => {
    setActiveRound(prev => ({ ...prev, holes: prev.holes.map((h, i) => i === idx ? data : h) }));
  };

  const saveRound = () => {
    setRounds(prev => [activeRound, ...prev]);
    setView("home");
    setActiveRound(null);
  };

  const deleteRound = (id) => setRounds(prev => prev.filter(r => r.id !== id));

  const completedHoles = activeRound
    ? activeRound.holes.filter(h => h.totalPutts !== "").length : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0f1a0f; --surface: #162016; --card: #1c2b1c;
          --border: #2a3d2a; --green: #4ade80; --green-dim: #22543d;
          --amber: #fbbf24; --red: #f87171; --text: #e8f5e8;
          --muted: #6b8f6b; --radius: 12px;
        }
        body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        .app { max-width: 480px; margin: 0 auto; padding: 0 0 80px; min-height: 100vh; }
        .app-header {
          background: linear-gradient(135deg, #0a2a0a 0%, #162e16 100%);
          padding: 28px 20px 20px; border-bottom: 1px solid var(--border);
          position: sticky; top: 0; z-index: 100;
        }
        .app-title { font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem; letter-spacing: 3px; color: var(--green); line-height: 1; }
        .app-sub { font-size: 0.75rem; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
        .bottom-nav {
          position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: 480px;
          background: var(--surface); border-top: 1px solid var(--border);
          display: flex; z-index: 200;
        }
        .nav-btn {
          flex: 1; padding: 14px 0; background: none; border: none; color: var(--muted);
          font-family: 'DM Sans', sans-serif; font-size: 0.7rem; letter-spacing: 1px;
          text-transform: uppercase; cursor: pointer; transition: color 0.2s;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .nav-btn .icon { font-size: 1.1rem; }
        .nav-btn.active, .nav-btn:hover { color: var(--green); }
        .home-wrap { padding: 30px 20px; }
        .hero-card {
          background: linear-gradient(135deg, #1a3a1a, #0f2010);
          border: 1px solid var(--border); border-radius: var(--radius);
          padding: 32px 24px; text-align: center; margin-bottom: 28px;
        }
        .hero-icon { font-size: 3rem; margin-bottom: 12px; }
        .hero-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; letter-spacing: 2px; color: var(--green); }
        .hero-sub { font-size: 0.85rem; color: var(--muted); margin-top: 6px; }
        .start-btn {
          margin-top: 20px; padding: 14px 40px;
          background: var(--green); color: #0a1a0a;
          border: none; border-radius: 8px; font-family: 'Bebas Neue', sans-serif;
          font-size: 1.1rem; letter-spacing: 2px; cursor: pointer; transition: opacity 0.2s;
        }
        .start-btn:hover { opacity: 0.85; }
        .recent-title { font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
        .entry-wrap { padding: 16px; }
        .round-meta { display: flex; gap: 10px; margin-bottom: 16px; }
        .round-meta input {
          flex: 1; background: var(--card); border: 1px solid var(--border);
          border-radius: 8px; padding: 10px 12px; color: var(--text);
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
        }
        .progress-bar-wrap { margin-bottom: 16px; }
        .progress-label { font-size: 0.7rem; color: var(--muted); letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase; }
        .progress-bar { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--green); border-radius: 2px; transition: width 0.4s; }
        .hole-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius); margin-bottom: 8px; overflow: hidden; transition: border-color 0.2s;
        }
        .hole-card.done { border-color: #2a5a2a; }
        .hole-card.expanded { border-color: var(--green); }
        .hole-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; user-select: none; }
        .hole-num { display: flex; flex-direction: column; align-items: center; min-width: 36px; }
        .hole-label { font-size: 0.55rem; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; }
        .hole-digit { font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: var(--green); line-height: 1; }
        .hole-summary { flex: 1; display: flex; flex-wrap: wrap; gap: 4px; }
        .pill { font-size: 0.65rem; padding: 2px 7px; border-radius: 20px; background: var(--surface); color: var(--muted); border: 1px solid var(--border); }
        .pill.green { background: #1a3d1a; color: var(--green); border-color: var(--green-dim); }
        .pill.gray { background: #252525; color: #888; }
        .pill.red { background: #3a1a1a; color: var(--red); border-color: #5a2a2a; }
        .pill.amber { background: #3a2e0a; color: var(--amber); border-color: #5a4a0a; }
        .chevron { font-size: 0.7rem; color: var(--muted); }
        .hole-body { padding: 4px 16px 16px; border-top: 1px solid var(--border); }
        .field-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1e2e1e; }
        .field-col { padding: 12px 0; }
        .field-col label { display: block; margin-bottom: 8px; }
        label { font-size: 0.82rem; color: #a0c0a0; }
        .unit { font-size: 0.72rem; color: var(--muted); }
        .toggle-group { display: flex; gap: 4px; }
        .toggle-btn {
          padding: 5px 12px; border-radius: 6px; border: 1px solid var(--border);
          background: var(--surface); color: var(--muted);
          font-family: 'DM Sans', sans-serif; font-size: 0.78rem; cursor: pointer; transition: all 0.15s;
        }
        .toggle-btn.active { background: var(--green); color: #0a1a0a; border-color: var(--green); font-weight: 500; }
        .stepper { display: flex; align-items: center; }
        .stepper button {
          width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--border);
          background: var(--surface); color: var(--text); font-size: 1.1rem; cursor: pointer; transition: background 0.15s;
        }
        .stepper button:hover { background: var(--border); }
        .stepper span { min-width: 32px; text-align: center; font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; color: var(--green); }
        .num-input {
          width: 72px; text-align: center; background: var(--surface); border: 1px solid var(--border);
          border-radius: 6px; padding: 6px; color: var(--text); font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem;
        }
        .num-input:focus { outline: 1px solid var(--green); }
        textarea {
          width: 100%; background: var(--surface); border: 1px solid var(--border);
          border-radius: 8px; padding: 10px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.85rem; resize: vertical;
        }
        textarea:focus { outline: 1px solid var(--green); }
        .save-bar { position: sticky; bottom: 56px; left: 0; right: 0; padding: 12px 16px; background: var(--bg); border-top: 1px solid var(--border); }
        .save-btn {
          width: 100%; padding: 13px; background: var(--green); color: #0a1a0a;
          border: none; border-radius: 8px; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 2px; cursor: pointer;
        }
        .history-wrap { padding: 20px 16px; }
        .section-title { font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; }
        .round-row {
          background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
          padding: 14px 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: border-color 0.2s;
        }
        .round-row:hover { border-color: var(--green); }
        .round-info { flex: 1; }
        .round-date { font-size: 0.75rem; color: var(--muted); display: block; }
        .round-course { font-size: 0.95rem; color: var(--text); font-weight: 500; }
        .round-chips { display: flex; flex-wrap: wrap; gap: 4px; }
        .chip { font-size: 0.65rem; padding: 2px 7px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; color: var(--muted); }
        .del-btn { background: none; border: none; color: #5a3a3a; font-size: 0.85rem; cursor: pointer; padding: 4px 6px; }
        .del-btn:hover { color: var(--red); }
        .no-data { color: var(--muted); font-size: 0.9rem; text-align: center; padding: 40px 0; }
        .review-wrap { padding: 20px 16px; }
        .back-btn {
          background: none; border: 1px solid var(--border); border-radius: 8px;
          color: var(--muted); padding: 6px 14px; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; margin-bottom: 20px;
        }
        .review-course { font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; letter-spacing: 2px; color: var(--green); }
        .review-date { font-size: 0.8rem; color: var(--muted); margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px; }
        .stat-box { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; text-align: center; }
        .stat-val { font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; color: var(--green); line-height: 1; }
        .stat-label { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
        .stat-sub { font-size: 0.7rem; color: #4a7a4a; margin-top: 2px; }
        .log-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid #1a2a1a; }
        .log-num { font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; color: var(--green); min-width: 28px; }
        .log-fields { flex: 1; display: flex; flex-wrap: wrap; gap: 4px; }
        .log-note { width: 100%; font-size: 0.75rem; color: var(--muted); font-style: italic; margin-top: 4px; }
        input[type="date"], input[type="text"] {
          background: var(--card); border: 1px solid var(--border); border-radius: 8px;
          padding: 10px 12px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
        }
        input:focus { outline: 1px solid var(--green); }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>

      <div className="app">
        <div className="app-header">
          <div className="app-title">Fairway Log</div>
          <div className="app-sub">Golf Round Tracker</div>
        </div>

        {view === "home" && (
          <div className="home-wrap">
            <div className="hero-card">
              <div className="hero-icon">⛳</div>
              <div className="hero-title">Ready to Track?</div>
              <div className="hero-sub">Record every hole in detail</div>
              <button className="start-btn" onClick={startNewRound}>Start New Round</button>
            </div>
            {rounds.length > 0 && (
              <>
                <div className="recent-title">Recent Rounds</div>
                {rounds.slice(0, 3).map(r => (
                  <RoundRow key={r.id} round={r}
                    onSelect={() => { setReviewRound(r); setView("review"); }}
                    onDelete={() => deleteRound(r.id)} />
                ))}
              </>
            )}
          </div>
        )}

        {view === "entry" && activeRound && (
          <>
            <div className="entry-wrap">
              <div className="round-meta">
                <input type="date" value={activeRound.date}
                  onChange={e => setActiveRound({ ...activeRound, date: e.target.value })} />
                <input type="text" placeholder="Course name" value={activeRound.course}
                  onChange={e => setActiveRound({ ...activeRound, course: e.target.value })} />
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-label">{completedHoles} / 18 holes entered</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(completedHoles / 18) * 100}%` }} />
                </div>
              </div>
              {HOLES.map((h, i) => (
                <HoleCard key={i} holeNum={h} data={activeRound.holes[i]}
                  onChange={d => updateHole(i, d)}
                  active={activeHole === i}
                  onActivate={() => setActiveHole(activeHole === i ? -1 : i)} />
              ))}
            </div>
            <div className="save-bar">
              <button className="save-btn" onClick={saveRound}>Save Round</button>
            </div>
          </>
        )}

        {view === "history" && (
          <div className="history-wrap">
            <div className="section-title">{rounds.length} Saved Rounds</div>
            {rounds.length === 0 && <p className="no-data">No rounds saved yet.</p>}
            {rounds.map(r => (
              <RoundRow key={r.id} round={r}
                onSelect={() => { setReviewRound(r); setView("review"); }}
                onDelete={() => deleteRound(r.id)} />
            ))}
          </div>
        )}

        {view === "review" && reviewRound && (
          <div className="review-wrap">
            <button className="back-btn" onClick={() => setView("history")}>← Back</button>
            <div className="review-course">{reviewRound.course || "Unnamed Course"}</div>
            <div className="review-date">{reviewRound.date}</div>
            <div className="section-title">Round Stats</div>
            <StatsPanel round={reviewRound} />
            <div className="section-title">Hole Log</div>
            <div className="hole-log">
              {reviewRound.holes.map((h, i) => (
                <div className="log-row" key={i}>
                  <div className="log-num">{i + 1}</div>
                  <div className="log-fields">
                    {h.fairwayHit === true && <span className="pill green">FW ✓</span>}
                    {h.fairwayHit === false && <span className="pill gray">FW ✗</span>}
                    {h.fairwayBunker && <span className="pill amber">FW Bkr</span>}
                    {h.outOfBounds > 0 && <span className="pill red">OB ×{h.outOfBounds}</span>}
                    {h.hazardPenalty > 0 && <span className="pill red">Haz ×{h.hazardPenalty}</span>}
                    {h.gir === true && <span className="pill green">GIR ✓</span>}
                    {h.gir === false && <span className="pill gray">GIR ✗</span>}
                    {h.greenSideBunker && <span className="pill amber">GS Bkr</span>}
                    {h.firstPuttLength !== "" && <span className="pill">1st: {h.firstPuttLength}ft</span>}
                    {h.totalPutts !== "" && <span className="pill">⛳ {h.totalPutts}</span>}
                    {h.note && <div className="log-note">"{h.note}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bottom-nav">
          <button className={`nav-btn ${view === "home" ? "active" : ""}`} onClick={() => setView("home")}>
            <span className="icon">🏠</span>Home
          </button>
          <button className={`nav-btn ${view === "entry" ? "active" : ""}`}
            onClick={() => activeRound ? setView("entry") : startNewRound()}>
            <span className="icon">✏️</span>Enter
          </button>
          <button className={`nav-btn ${view === "history" || view === "review" ? "active" : ""}`}
            onClick={() => setView("history")}>
            <span className="icon">📋</span>History
          </button>
        </div>
      </div>
    </>
  );
}
