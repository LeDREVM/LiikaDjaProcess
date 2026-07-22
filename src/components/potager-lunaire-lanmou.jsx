import { useState, useMemo } from "react";

/* ------------------------------------------------------------------ *
 *  POTAGER LUNAIRE — onglet Lanmou Divan
 *  Concombre & Giraumon · calendrier carême/hivernage + lune
 *  Données astronomiques calculées pour la Guadeloupe (UTC-4)
 * ------------------------------------------------------------------ */

const LUNE = {"turns": [{"date": "2026-07-26", "type": "montante"}, {"date": "2026-08-08", "type": "descendante"}, {"date": "2026-08-22", "type": "montante"}, {"date": "2026-09-05", "type": "descendante"}, {"date": "2026-09-18", "type": "montante"}, {"date": "2026-10-02", "type": "descendante"}, {"date": "2026-10-15", "type": "montante"}, {"date": "2026-10-29", "type": "descendante"}, {"date": "2026-11-12", "type": "montante"}, {"date": "2026-11-25", "type": "descendante"}, {"date": "2026-12-09", "type": "montante"}, {"date": "2026-12-23", "type": "descendante"}, {"date": "2027-01-05", "type": "montante"}, {"date": "2027-01-19", "type": "descendante"}, {"date": "2027-02-01", "type": "montante"}, {"date": "2027-02-16", "type": "descendante"}, {"date": "2027-03-01", "type": "montante"}, {"date": "2027-03-15", "type": "descendante"}, {"date": "2027-03-28", "type": "montante"}, {"date": "2027-04-11", "type": "descendante"}, {"date": "2027-04-24", "type": "montante"}, {"date": "2027-05-08", "type": "descendante"}, {"date": "2027-05-22", "type": "montante"}, {"date": "2027-06-05", "type": "descendante"}, {"date": "2027-06-18", "type": "montante"}, {"date": "2027-07-02", "type": "descendante"}, {"date": "2027-07-15", "type": "montante"}, {"date": "2027-07-30", "type": "descendante"}, {"date": "2027-08-11", "type": "montante"}, {"date": "2027-08-26", "type": "descendante"}], "phases": [{"date": "2026-07-29", "time": "10h35", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2026-08-05", "time": "22h21", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2026-08-12", "time": "13h36", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2026-08-19", "time": "22h46", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2026-08-28", "time": "00h18", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2026-09-04", "time": "03h51", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2026-09-10", "time": "23h26", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2026-09-18", "time": "16h43", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2026-09-26", "time": "12h48", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2026-10-03", "time": "09h24", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2026-10-10", "time": "11h50", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2026-10-18", "time": "12h12", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2026-10-26", "time": "00h11", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2026-11-01", "time": "16h28", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2026-11-09", "time": "03h02", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2026-11-17", "time": "07h47", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2026-11-24", "time": "10h53", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2026-12-01", "time": "02h08", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2026-12-08", "time": "20h51", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2026-12-17", "time": "01h42", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2026-12-23", "time": "21h28", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2026-12-30", "time": "14h59", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2027-01-07", "time": "16h24", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2027-01-15", "time": "16h34", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2027-01-22", "time": "08h17", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2027-01-29", "time": "06h55", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2027-02-06", "time": "11h56", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2027-02-14", "time": "03h58", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2027-02-20", "time": "19h23", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2027-02-28", "time": "01h16", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2027-03-08", "time": "05h29", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2027-03-15", "time": "12h25", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2027-03-22", "time": "06h43", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2027-03-29", "time": "20h53", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2027-04-06", "time": "19h51", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2027-04-13", "time": "18h56", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2027-04-20", "time": "18h27", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2027-04-28", "time": "16h17", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2027-05-06", "time": "06h58", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2027-05-13", "time": "00h43", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2027-05-20", "time": "06h58", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2027-05-28", "time": "09h57", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2027-06-04", "time": "15h40", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2027-06-11", "time": "06h56", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2027-06-18", "time": "20h44", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2027-06-27", "time": "00h54", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2027-07-03", "time": "23h01", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2027-07-10", "time": "14h38", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2027-07-18", "time": "11h44", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2027-07-26", "time": "12h54", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2027-08-02", "time": "06h05", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2027-08-09", "time": "00h54", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2027-08-17", "time": "03h28", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2027-08-24", "time": "22h27", "name": "Dernier quartier", "emoji": "🌗"}, {"date": "2027-08-31", "time": "13h41", "name": "Nouvelle lune", "emoji": "🌑"}, {"date": "2027-09-07", "time": "14h31", "name": "Premier quartier", "emoji": "🌓"}, {"date": "2027-09-15", "time": "19h03", "name": "Pleine lune", "emoji": "🌕"}, {"date": "2027-09-23", "time": "06h20", "name": "Dernier quartier", "emoji": "🌗"}], "monthly": {"2026-07": {"semis": [26, 27], "repiquage": []}, "2026-08": {"semis": [5, 6, 23, 24], "repiquage": [13, 14]}, "2026-09": {"semis": [1, 2, 20, 28, 29], "repiquage": [9]}, "2026-10": {"semis": [17, 25, 27], "repiquage": [7, 8]}, "2026-11": {"semis": [12, 14, 22, 23], "repiquage": [3, 4, 30]}, "2026-12": {"semis": [10, 19, 20], "repiquage": [1, 27, 28, 29]}, "2027-01": {"semis": [6, 16, 17], "repiquage": [24, 25]}, "2027-02": {"semis": [2, 4, 12, 13], "repiquage": [21]}, "2027-03": {"semis": [1, 2, 11, 12, 29, 30], "repiquage": [20, 21]}, "2027-04": {"semis": [7, 8, 9, 25, 26], "repiquage": [16, 17]}, "2027-05": {"semis": [5, 22, 23, 24], "repiquage": [13, 14]}, "2027-06": {"semis": [1, 2, 19, 20, 29, 30], "repiquage": [9, 10, 11]}}, "periapo": [{"date": "2026-07-25", "type": "apogée"}, {"date": "2026-08-10", "type": "périgée"}, {"date": "2026-08-22", "type": "apogée"}, {"date": "2026-09-06", "type": "périgée"}, {"date": "2026-09-19", "type": "apogée"}, {"date": "2026-10-01", "type": "périgée"}, {"date": "2026-10-16", "type": "apogée"}, {"date": "2026-10-28", "type": "périgée"}, {"date": "2026-11-13", "type": "apogée"}, {"date": "2026-11-25", "type": "périgée"}, {"date": "2026-12-11", "type": "apogée"}, {"date": "2026-12-24", "type": "périgée"}, {"date": "2027-01-07", "type": "apogée"}, {"date": "2027-01-21", "type": "périgée"}, {"date": "2027-02-03", "type": "apogée"}, {"date": "2027-02-19", "type": "périgée"}, {"date": "2027-03-03", "type": "apogée"}, {"date": "2027-03-19", "type": "périgée"}, {"date": "2027-03-31", "type": "apogée"}, {"date": "2027-04-13", "type": "périgée"}, {"date": "2027-04-27", "type": "apogée"}, {"date": "2027-05-09", "type": "périgée"}, {"date": "2027-05-25", "type": "apogée"}, {"date": "2027-06-06", "type": "périgée"}, {"date": "2027-06-22", "type": "apogée"}, {"date": "2027-07-04", "type": "périgée"}, {"date": "2027-07-19", "type": "apogée"}, {"date": "2027-08-02", "type": "périgée"}, {"date": "2027-08-15", "type": "apogée"}, {"date": "2027-08-30", "type": "périgée"}]};

const MOIS = [
  { n: "Janvier",   s: "careme", cyc: false, cc: "Pleine fenêtre. Semer en godets et repiquer. Sol riche, plein soleil, palissage dès le départ.", gg: "Semer en poquets de 3 graines (2 m d'écart) ou en pépinière. Pincer la tige après 2 feuilles." },
  { n: "Février",   s: "careme", cyc: false, cc: "Continuer les semis et récolter les plants de décembre. Arroser au pied, sans mouiller le feuillage.", gg: "Arrosage régulier (saison sèche). Nouveaux semis encore possibles." },
  { n: "Mars",      s: "careme", cyc: false, cc: "Récolte pleine des semis de déc.–janv. Derniers semis avant la montée des pluies.", gg: "Floraison et nouaison. Tailler les tiges qui ne portent pas de fruit." },
  { n: "Avril",     s: "careme", cyc: false, cc: "Récolte. Fin de la fenêtre idéale : éviter de lancer de nouveaux plants sensibles.", gg: "Récolte + semer une planche rustique pour traverser l'hivernage." },
  { n: "Mai",       s: "trans",  cyc: false, cc: "Terminer les récoltes. Pause conseillée en pleine terre : l'humidité amène mildiou et oïdium.", gg: "Semis encore possible (plus résistant). Tuteurer, bien aérer les plants." },
  { n: "Juin",      s: "hiver",  cyc: true,  cc: "Pause pleine terre (trop humide). À réserver à une culture sous abri aéré.", gg: "Entretien, drainage soigné, surveiller l'oïdium. Isoler les fruits du sol." },
  { n: "Juillet",   s: "hiver",  cyc: true,  cc: "Pause. Amender et préparer le sol pour le prochain carême.", gg: "Récolte des semis d'avril–mai. Isoler les fruits du sol détrempé." },
  { n: "Août",      s: "hiver",  cyc: true,  cc: "Pause. Composter, entretenir, préparer les purins (ortie, prêle).", gg: "Protéger la planche, éviter les jeunes plants fragiles. Veille cyclonique." },
  { n: "Septembre", s: "hiver",  cyc: true,  cc: "Pause active : compost, purins préventifs, préparer les godets pour la reprise.", gg: "Récolte et protection des plants. Veille cyclonique maintenue." },
  { n: "Octobre",   s: "hiver",  cyc: true,  cc: "Reprise : semer en godets à l'abri en fin de mois pour repiquer en novembre.", gg: "Semer pour viser une récolte en plein carême." },
  { n: "Novembre",  s: "trans",  cyc: false, cc: "Semer en godets pour repiquage en décembre → récolte en carême. Préparer les planches.", gg: "Semer. Former les billons, apporter le compost." },
  { n: "Décembre",  s: "careme", cyc: false, cc: "Repiquer les plants de novembre + semer. Plein soleil, palissage, paillage au pied.", gg: "Semer, pleine croissance. Récupérer les graines des giraumons bien mûrs." },
];

const ABBR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const SEASON = {
  careme: { label: "Carême", color: "#e3ba5c", bg: "rgba(227,186,92,.14)" },
  trans:  { label: "Transition", color: "#a7dd8f", bg: "rgba(143,207,122,.14)" },
  hiver:  { label: "Hivernage", color: "#7fd0a0", bg: "rgba(63,125,90,.2)" },
};

const GOLD = "#e3ba5c";
const GREEN = "#4ade80";
const AMBER = "#f59e0b";
const MONTANTE = "#5fe39a";
const DESCENDANTE = "#d9a765";
const SYN = 29.53059;

/* ---------- helpers lune ---------- */
const parseD = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const NEWMOONS = LUNE.phases.filter((p) => p.name === "Nouvelle lune").map((p) => parseD(p.date)).sort((a, b) => a - b);

function moonAge(date) {
  let last = null;
  for (const nm of NEWMOONS) if (nm <= date) last = nm;
  if (!last) { last = new Date(NEWMOONS[0]); while (last > date) last = new Date(last - SYN * 864e5); }
  return (date - last) / 864e5;
}
const illum = (age) => (1 - Math.cos((2 * Math.PI * age) / SYN)) / 2;
const waxing = (age) => age % SYN < SYN / 2;
function phaseName(age) {
  const a = ((age % SYN) + SYN) % SYN;
  if (a < 1.4 || a > 28.1) return "Nouvelle lune";
  if (a < 6.4) return "Premier croissant";
  if (a < 8.4) return "Premier quartier";
  if (a < 13.8) return "Gibbeuse croissante";
  if (a < 15.8) return "Pleine lune";
  if (a < 21.1) return "Gibbeuse décroissante";
  if (a < 23.1) return "Dernier quartier";
  return "Dernier croissant";
}
function mvtFor(date) {
  let state = "descendante"; // avant la 1re bascule (26 juil 2026)
  for (const t of LUNE.turns) { if (parseD(t.date) <= date) state = t.type; else break; }
  return state;
}
const isoOf = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const fmtLong = (d) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/* ---------- petit disque de lune (SVG) ---------- */
function MoonDisc({ frac, wax, size = 96 }) {
  // masque : on éclaire une fraction du disque
  const r = size / 2;
  const w = (1 - frac) * size;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", position: "relative", overflow: "hidden",
      background: "#0c130f", boxShadow: `inset 0 0 0 1px rgba(227,186,92,.25), 0 0 ${size / 3}px rgba(227,186,92,.16)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%",
        background: "radial-gradient(circle at 38% 34%, #fbf1cf, #e3ba5c 70%, #b98f38)" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, width: w, borderRadius: "50%", background: "#0b110d",
        left: wax ? 0 : "auto", right: wax ? "auto" : 0 }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", mixBlendMode: "multiply", opacity: 0.28,
        background: "radial-gradient(circle at 62% 60%, transparent 40%, #7a5f26 41%, transparent 46%), radial-gradient(circle at 30% 66%, transparent 30%, #7a5f26 31%, transparent 35%)" }} />
    </div>
  );
}

export default function PotagerLunaire() {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth());

  const age = moonAge(today);
  const frac = illum(age), wax = waxing(age);
  const mvt = mvtFor(today);

  // prochaine action (semis/repiquage) à venir
  const nextAction = useMemo(() => {
    const up = [];
    Object.keys(LUNE.monthly).forEach((mk) => {
      LUNE.monthly[mk].semis.forEach((d) => up.push({ t: "semis", date: new Date(+mk.slice(0, 4), +mk.slice(5, 7) - 1, d) }));
      LUNE.monthly[mk].repiquage.forEach((d) => up.push({ t: "repiquage", date: new Date(+mk.slice(0, 4), +mk.slice(5, 7) - 1, d) }));
    });
    up.sort((a, b) => a.date - b.date);
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return up.find((u) => u.date >= t0);
  }, [today]);

  const mk = month >= 6 ? `2026-${String(month + 1).padStart(2, "0")}` : `2027-${String(month + 1).padStart(2, "0")}`;
  const md = LUNE.monthly[mk] || { semis: [], repiquage: [] };
  const m = MOIS[month];
  const season = SEASON[m.s];

  const upcomingPhases = useMemo(() => {
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return LUNE.phases.map((p) => ({ ...p, d: parseD(p.date) })).filter((p) => p.d >= t0).slice(0, 8);
  }, [today]);

  const box = { background: "rgba(255,255,255,0.03)", border: "1px solid #1a3028", borderRadius: 16 };
  const mono = "'Space Mono', monospace";
  const serif = "'Playfair Display', Georgia, serif";

  return (
    <div style={{ fontFamily: serif, color: "#e8f5e0",
      background: "linear-gradient(135deg,#0a0f0d 0%,#0d1a12 50%,#0a0e10 100%)", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Mono:wght@400;700&display=swap');
        .pl-mn::-webkit-scrollbar{height:0}
        .pl-btn{transition:all .2s ease;cursor:pointer}
        .pl-btn:hover{transform:translateY(-2px)}
        @keyframes plfade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .pl-fade{animation:plfade .35s ease}
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "26px 20px 16px", borderBottom: "1px solid #1e3a2a",
        background: "linear-gradient(180deg,#0a150e 0%,transparent 100%)" }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: GOLD, letterSpacing: 4, textTransform: "uppercase", marginBottom: 6 }}>
          Lanmou Divan · Potager 🌴
        </div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: "#f0faf0", lineHeight: 1 }}>
          Kalandriye <span style={{ fontStyle: "italic", fontWeight: 400, color: GOLD }}>Lalin</span>
        </h1>
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#6b9e7a", fontStyle: "italic", maxWidth: "42ch", lineHeight: 1.5 }}>
          Concombre &amp; giraumon au bon moment — carême, hivernage et cycles de la lune 🌱
        </p>
      </div>

      {/* ÉTAT LUNAIRE DU JOUR */}
      <div style={{ padding: "18px 20px 0" }}>
        <div style={{ ...box, padding: 18, display: "flex", gap: 16, alignItems: "center",
          background: "linear-gradient(140deg,rgba(227,186,92,.06),rgba(255,255,255,.015))" }}>
          <MoonDisc frac={frac} wax={wax} size={84} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: "#6b9e7a", textTransform: "uppercase", letterSpacing: 1 }}>
              {today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#f6fbf2", margin: "3px 0 6px" }}>
              {phaseName(age)} · {Math.round(frac * 100)}%
            </div>
            <span style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, padding: "3px 11px", borderRadius: 20,
              background: (mvt === "montante" ? MONTANTE : DESCENDANTE) + "22",
              color: mvt === "montante" ? MONTANTE : DESCENDANTE }}>
              {mvt === "montante" ? "⬆ Montante — semis & récolte" : "⬇ Descendante — repiquage & sol"}
            </span>
          </div>
        </div>

        {nextAction && (
          <div style={{ ...box, padding: "13px 16px", marginTop: 10, display: "flex", gap: 11, alignItems: "flex-start" }}>
            <span style={{ fontSize: 17 }}>🌱</span>
            <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
              Prochain jour idéal pour <b style={{ color: GOLD }}>{nextAction.t === "semis" ? "semer" : "repiquer"}</b> :{" "}
              <b style={{ color: GOLD }}>{fmtLong(nextAction.date)}</b>
              <div style={{ fontSize: 12, color: "#6b9e7a", fontStyle: "italic", marginTop: 2 }}>
                {nextAction.t === "semis" ? "lune montante + jour fruit" : "lune descendante + jour fruit"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SÉLECTEUR MOIS */}
      <div className="pl-mn" style={{ padding: "20px 20px 12px", display: "flex", gap: 7, overflowX: "auto" }}>
        {MOIS.map((mm, i) => (
          <button key={i} className="pl-btn" onClick={() => setMonth(i)} style={{
            minWidth: 52, padding: "9px 6px", borderRadius: 12, border: "none",
            background: month === i ? "linear-gradient(135deg," + GOLD + ",#c9a24a)" : "rgba(255,255,255,0.04)",
            color: month === i ? "#0a0f0d" : "#6b9e7a", fontFamily: mono, fontSize: 11, fontWeight: 700,
            textAlign: "center", boxShadow: month === i ? "0 4px 16px rgba(227,186,92,.3)" : "none", outline: "none" }}>
            <div>{ABBR[i]}</div>
            <div style={{ fontSize: 8, marginTop: 2, opacity: 0.7 }}>{mm.cyc ? "⚡" : month === i ? "●" : "○"}</div>
          </button>
        ))}
      </div>

      {/* FICHE DU MOIS */}
      <div className="pl-fade" key={month} style={{ padding: "0 20px 24px" }}>
        <div style={{ ...box, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
            paddingBottom: 16, borderBottom: "1px solid #1e3a2a", marginBottom: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#f4faf1", lineHeight: 1 }}>{m.n}</div>
              {m.cyc && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 10,
                  color: "#fb7185", background: "rgba(251,113,133,.1)", padding: "4px 10px", borderRadius: 20, marginTop: 8 }}>
                  ⚡ Saison cyclonique — veille météo
                </div>
              )}
            </div>
            <div style={{ fontFamily: mono, fontSize: 10.5, padding: "5px 12px", borderRadius: 20, fontWeight: 700,
              background: season.bg, color: season.color }}>{season.label}</div>
          </div>

          {/* concombre */}
          <div style={{ display: "flex", gap: 12, paddingBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 20, background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.3)" }}>🥒</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: GREEN, marginBottom: 2 }}>Concombre</div>
              <div style={{ fontSize: 13, color: "#bcd4c2", lineHeight: 1.55 }}>{m.cc}</div>
            </div>
          </div>
          {/* giraumon */}
          <div style={{ display: "flex", gap: 12, paddingTop: 14, borderTop: "1px dashed #1e3a2a" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 20, background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.3)" }}>🎃</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: AMBER, marginBottom: 2 }}>Giraumon</div>
              <div style={{ fontSize: 13, color: "#bcd4c2", lineHeight: 1.55 }}>{m.gg}</div>
            </div>
          </div>

          {/* jours favorables */}
          <div style={{ marginTop: 16, padding: 15, borderRadius: 14, border: "1px solid #1e3a2a",
            background: "linear-gradient(135deg,rgba(227,186,92,.06),rgba(74,222,128,.03))" }}>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>
              🌙 Jours favorables — {m.n} {mk.slice(0, 4)}
            </div>
            <DayRow label="⬆ Semer" days={md.semis} cls="semis" />
            <DayRow label="⬇ Repiquer" days={md.repiquage} cls="repiq" />
          </div>
        </div>
      </div>

      {/* PRINCIPES */}
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: "#c9a24a", letterSpacing: 2, marginBottom: 12 }}>
          🌗 PLANTER AVEC LA LUNE
        </div>
        {[
          { emoji: "⬆", tag: "SEMER", tagcol: MONTANTE, title: "Lune montante", txt: "La sève monte : on sème et on récolte les fruits à consommer frais. Idéal un jour fruit." },
          { emoji: "🌕", tag: "RÉCOLTER", tagcol: GOLD, title: "Pleine lune", txt: "Fruits gorgés de sève : récolte de conservation et prélèvement des graines de giraumon mûr." },
          { emoji: "⬇", tag: "REPIQUER", tagcol: DESCENDANTE, title: "Lune descendante", txt: "La sève descend : les plants s'enracinent mieux. On repique, plante, bouture et amende la terre." },
          { emoji: "🌑", tag: "REPOS", tagcol: "#fb7185", title: "Nœuds · périgée · apogée", txt: "Autour des nouvelle/pleine lune et aux périgée/apogée : pas de semis. On composte et on prépare." },
        ].map((p, i) => (
          <div key={i} style={{ ...box, padding: 15, display: "flex", gap: 13, marginBottom: 10 }}>
            <span style={{ fontSize: 20, minWidth: 26, textAlign: "center" }}>{p.emoji}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f2faef", marginBottom: 3 }}>
                <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                  marginRight: 8, background: p.tagcol + "22", color: p.tagcol }}>{p.tag}</span>{p.title}
              </div>
              <div style={{ fontSize: 12.5, color: "#b4cebc", lineHeight: 1.5 }}>{p.txt}</div>
            </div>
          </div>
        ))}
      </div>

      {/* PROCHAINES PHASES */}
      <div style={{ padding: "0 20px 40px" }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: "#c9a24a", letterSpacing: 2, marginBottom: 12 }}>
          📅 PROCHAINES PHASES · Guadeloupe
        </div>
        <div style={{ ...box, overflow: "hidden" }}>
          {upcomingPhases.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 16px",
              borderBottom: i < upcomingPhases.length - 1 ? "1px solid #1a3028" : "none", fontSize: 13 }}>
              <span style={{ fontSize: 18, width: 22, textAlign: "center" }}>{p.emoji}</span>
              <span style={{ fontFamily: mono, fontSize: 11.5, color: GOLD, minWidth: 92 }}>
                {p.d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} · {p.time}
              </span>
              <span style={{ color: "#cfe3d4", flex: 1 }}>{p.name}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#4b7a5c", fontStyle: "italic", lineHeight: 1.6, marginTop: 16 }}>
          La lune est un repère, pas une loi : la météo et l'état du sol priment toujours. Cycle 100 jours pour les
          deux cultures. Phases calculées astronomiquement pour Pointe-à-Pitre (UTC-4).
        </p>
      </div>
    </div>
  );
}

/* ---------- ligne de jours ---------- */
function DayRow({ label, days, cls }) {
  const mono = "'Space Mono', monospace";
  const col = cls === "semis" ? MONTANTE : DESCENDANTE;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
      <span style={{ fontFamily: mono, fontSize: 10.5, color: "#6b9e7a", minWidth: 82, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {days && days.length ? days.map((d, i) => (
          <span key={i} style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 8,
            background: col + "24", color: col, border: "1px solid " + col + "4d" }}>{d}</span>
        )) : (
          <span style={{ fontSize: 12, color: "#4b7a5c", fontStyle: "italic" }}>à ajuster selon la météo</span>
        )}
      </div>
    </div>
  );
}
