import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity, Zap, Moon, Timer, TrendingUp, ChevronDown, ChevronUp,
  Plus, X, Flame, Dumbbell, Heart, BarChart3, Cloud, RefreshCw, Calendar
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { getAccurateMoonPhase } from '../data/moonPhases2026';
import { syncModule, fetchModule, loadNextcloudConfig } from '../utils/nextcloudSync';

// ─── Lunar energy system ────────────────────────────────────────────────────
const LUNAR_ENERGY = {
  'Nouvelle Lune':          { energy: 4, color: 'from-gray-700 to-gray-800',    text: 'Repos actif, yoga, mobilité, étirements. Écoutez votre corps.' },
  'Premier Croissant':      { energy: 5, color: 'from-teal-800 to-teal-900',    text: 'Reprise légère. Cardio modéré, technique.' },
  'Premier Quartier':       { energy: 6, color: 'from-blue-700 to-blue-800',    text: 'Progression modérée. Construisez la base, volume moyen.' },
  'Gibbeuse Croissante':    { energy: 8, color: 'from-indigo-700 to-indigo-800',text: 'Montée en puissance ! Augmentez le volume et l\'intensité.' },
  'Pleine Lune':            { energy: 9, color: 'from-yellow-600 to-amber-700', text: 'PIC D\'ÉNERGIE ! Intensité max, charges lourdes, PRs.' },
  'Gibbeuse Décroissante':  { energy: 7, color: 'from-purple-700 to-purple-800',text: 'Maintien de l\'effort. Bon volume, commencer à ralentir.' },
  'Dernier Quartier':       { energy: 5, color: 'from-rose-800 to-rose-900',    text: 'Récupération. Léger, mobilité, préparer le prochain cycle.' },
  'Dernier Croissant':      { energy: 3, color: 'from-slate-700 to-slate-800',  text: 'Phase de repos. Stretching, marche, méditation active.' }
};

const getLunarEnergy = (moonPhase) => {
  return LUNAR_ENERGY[moonPhase?.name] || { energy: 5, color: 'from-gray-600 to-gray-700', text: 'Entraînement standard.' };
};

// ─── Workout templates ──────────────────────────────────────────────────────
const WORKOUT_TEMPLATES = [
  {
    id: 'push', name: 'Push', emoji: '💪', muscles: 'Poitrine, Épaules, Triceps',
    color: 'from-red-600 to-rose-700',
    exercises: [
      { name: 'Pompes inclinées', sets: 3, reps: 12 },
      { name: 'Dips assistés', sets: 4, reps: 10 },
      { name: 'Pike push-ups', sets: 3, reps: 10 },
      { name: 'Triceps dips', sets: 3, reps: 12 }
    ]
  },
  {
    id: 'pull', name: 'Pull', emoji: '🏋️', muscles: 'Dos, Biceps',
    color: 'from-blue-600 to-cyan-700',
    exercises: [
      { name: 'Tractions assistées', sets: 4, reps: 8 },
      { name: 'Row inversé', sets: 3, reps: 10 },
      { name: 'Superman', sets: 4, reps: 15 },
      { name: 'Curl biceps isométrique', sets: 3, reps: 0, duration: 30 }
    ]
  },
  {
    id: 'legs', name: 'Legs', emoji: '🦵', muscles: 'Quads, Ischio, Fessiers',
    color: 'from-green-600 to-emerald-700',
    exercises: [
      { name: 'Squats', sets: 5, reps: 20 },
      { name: 'Fentes alternées', sets: 4, reps: 12 },
      { name: 'Nordic curls', sets: 3, reps: 8 },
      { name: 'Pistol squats', sets: 3, reps: 8 },
      { name: 'Mollets debout', sets: 4, reps: 25 }
    ]
  },
  {
    id: 'fullbody', name: 'Full Body', emoji: '⚡', muscles: 'HIIT Circuit',
    color: 'from-orange-600 to-amber-700',
    exercises: [
      { name: 'Burpees', sets: 3, reps: 12 },
      { name: 'Mountain climbers', sets: 3, reps: 0, duration: 40 },
      { name: 'Jump squats', sets: 3, reps: 15 },
      { name: 'Planche dynamique', sets: 3, reps: 0, duration: 45 },
      { name: 'High knees', sets: 3, reps: 0, duration: 30 }
    ]
  }
];

// ─── Main Component ─────────────────────────────────────────────────────────
const SportPerformance = () => {
  const { activeProfileId } = useProfile();
  const storageKey = `ld-sport-reports-${activeProfileId}`;

  const [moonPhase, setMoonPhase] = useState(null);
  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  // Report form
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportForm, setReportForm] = useState({
    type: 'push',
    duration: 45,
    energy: 7,
    performance: '',
    nutritionNote: '',
    notes: ''
  });

  // Sync
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  // Fasting state
  const [fastingState, setFastingState] = useState(null);

  // Moon phase
  useEffect(() => {
    setMoonPhase(getAccurateMoonPhase(new Date()));
  }, []);

  // Reload on profile change
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setReports(saved ? JSON.parse(saved) : []);
  }, [activeProfileId]);

  // Check fasting state
  useEffect(() => {
    const phase = localStorage.getItem(`ld-fasting-phase-${activeProfileId}`);
    const type = localStorage.getItem(`ld-fasting-type-${activeProfileId}`);
    const start = localStorage.getItem(`ld-fasting-start-${activeProfileId}`);
    if (phase && start) {
      const elapsed = (Date.now() - parseInt(start)) / 1000 / 3600; // hours
      setFastingState({ phase, type, elapsed: elapsed.toFixed(1) });
    } else {
      setFastingState(null);
    }
  }, [activeProfileId]);

  const saveReports = (updated) => {
    setReports(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const lunar = getLunarEnergy(moonPhase);

  // ─── Submit report ──────────────────────────────────────────────────────
  const submitReport = () => {
    const report = {
      id: Date.now(),
      ...reportForm,
      date: new Date().toISOString(),
      moonPhase: moonPhase?.name || 'Inconnu',
      moonEmoji: moonPhase?.emoji || '🌙',
      lunarEnergy: lunar.energy,
      profileId: activeProfileId
    };
    const updated = [report, ...reports];
    saveReports(updated);
    setShowReportForm(false);
    setReportForm({ type: 'push', duration: 45, energy: 7, performance: '', nutritionNote: '', notes: '' });
  };

  const deleteReport = (id) => {
    saveReports(reports.filter(r => r.id !== id));
  };

  // ─── Correlation analysis ──────────────────────────────────────────────
  const correlationData = useMemo(() => {
    if (reports.length < 3) return null;

    const byPhase = {};
    reports.forEach(r => {
      if (!byPhase[r.moonPhase]) byPhase[r.moonPhase] = [];
      byPhase[r.moonPhase].push(r.energy);
    });

    const phaseAverages = Object.entries(byPhase).map(([phase, energies]) => ({
      phase,
      avg: (energies.reduce((a, b) => a + b, 0) / energies.length).toFixed(1),
      count: energies.length,
      expected: LUNAR_ENERGY[phase]?.energy || 5
    }));

    // Correlation coefficient
    let matchCount = 0;
    reports.forEach(r => {
      const expected = LUNAR_ENERGY[r.moonPhase]?.energy || 5;
      if (Math.abs(r.energy - expected) <= 2) matchCount++;
    });
    const correlationPct = Math.round((matchCount / reports.length) * 100);

    const bestPhase = phaseAverages.reduce((best, curr) =>
      parseFloat(curr.avg) > parseFloat(best.avg) ? curr : best, phaseAverages[0]);

    return { phaseAverages, correlationPct, bestPhase, totalSessions: reports.length };
  }, [reports]);

  // ─── Nextcloud sync ────────────────────────────────────────────────────
  const handleSync = async (direction) => {
    const config = loadNextcloudConfig();
    if (!config) { setSyncMsg({ ok: false, text: 'Nextcloud non configuré' }); return; }
    setSyncing(true); setSyncMsg(null);
    if (direction === 'push') {
      const r = await syncModule(activeProfileId, 'sport', reports, config);
      setSyncMsg({ ok: r.success, text: r.success ? 'Envoyé ✓' : 'Échec' });
    } else {
      const r = await fetchModule(activeProfileId, 'sport', config);
      if (r.success && Array.isArray(r.data)) {
        const merged = [...r.data, ...reports];
        const seen = new Set();
        const deduped = merged.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; });
        saveReports(deduped);
        setSyncMsg({ ok: true, text: 'Récupéré ✓' });
      } else {
        setSyncMsg({ ok: false, text: 'Échec' });
      }
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(null), 3000);
  };

  // ─── Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const last7 = reports.filter(r => {
      const diff = (Date.now() - new Date(r.date).getTime()) / (1000 * 3600 * 24);
      return diff <= 7;
    });
    const last30 = reports.filter(r => {
      const diff = (Date.now() - new Date(r.date).getTime()) / (1000 * 3600 * 24);
      return diff <= 30;
    });
    const avgEnergy7 = last7.length > 0
      ? (last7.reduce((a, r) => a + r.energy, 0) / last7.length).toFixed(1)
      : '—';
    const totalMin7 = last7.reduce((a, r) => a + (r.duration || 0), 0);
    return { week: last7.length, month: last30.length, avgEnergy7, totalMin7 };
  }, [reports]);

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ─── Lunar Energy Banner ─────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${lunar.color} rounded-2xl p-6 border border-white/10`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{moonPhase?.emoji || '🌙'}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{moonPhase?.name || 'Phase Lunaire'}</h2>
              <p className="text-white/60 text-sm">{moonPhase?.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white">{lunar.energy}<span className="text-lg text-white/50">/10</span></div>
            <p className="text-xs text-white/50">Énergie lunaire</p>
          </div>
        </div>

        {/* Energy bar */}
        <div className="mb-3">
          <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${lunar.energy * 10}%`,
                background: `linear-gradient(90deg,
                  ${lunar.energy <= 4 ? '#6366f1' : lunar.energy <= 6 ? '#3b82f6' : lunar.energy <= 8 ? '#f59e0b' : '#ef4444'},
                  ${lunar.energy <= 4 ? '#818cf8' : lunar.energy <= 6 ? '#60a5fa' : lunar.energy <= 8 ? '#fbbf24' : '#f87171'})`
              }}
            />
          </div>
        </div>

        <p className="text-white/80 text-sm italic">{lunar.text}</p>

        {/* Fasting state indicator */}
        {fastingState && (
          <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
            fastingState.phase === 'fasting'
              ? 'bg-orange-900/40 text-orange-300 border border-orange-500/30'
              : 'bg-green-900/40 text-green-300 border border-green-500/30'
          }`}>
            <Timer size={14} />
            {fastingState.phase === 'fasting'
              ? `En jeûne ${fastingState.type} — ${fastingState.elapsed}h écoulées. ${parseFloat(fastingState.elapsed) > 14 ? '⚠️ Entraînement léger conseillé' : '✓ OK pour s\'entraîner'}`
              : `Fenêtre d'alimentation — Bon moment pour l'entraînement !`
            }
          </div>
        )}
      </div>

      {/* ─── Quick Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Semaine', value: stats.week, icon: Calendar, color: 'text-blue-400' },
          { label: 'Mois', value: stats.month, icon: BarChart3, color: 'text-purple-400' },
          { label: 'Énergie moy.', value: stats.avgEnergy7, icon: Zap, color: 'text-yellow-400' },
          { label: 'Min/sem', value: stats.totalMin7, icon: Timer, color: 'text-green-400' }
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <Icon size={16} className={`mx-auto mb-1 ${color}`} />
            <div className="text-lg font-bold text-white">{value}</div>
            <div className="text-[10px] text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* ─── Workout Templates ───────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Dumbbell size={20} className="text-orange-400" /> Programme Poids du Corps
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {WORKOUT_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(selectedTemplate?.id === t.id ? null : t)}
              className={`bg-gradient-to-br ${t.color} rounded-xl p-4 text-left transition-all hover:scale-[1.02] border ${
                selectedTemplate?.id === t.id ? 'border-white/40 ring-2 ring-white/20' : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">{t.emoji}</span>
                {selectedTemplate?.id === t.id ? <ChevronUp size={16} className="text-white/50" /> : <ChevronDown size={16} className="text-white/50" />}
              </div>
              <div className="text-white font-bold">{t.name}</div>
              <div className="text-white/50 text-xs">{t.muscles}</div>
            </button>
          ))}
        </div>

        {/* Template detail */}
        {selectedTemplate && (
          <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4 animate-fadeIn">
            <h4 className="text-white font-bold mb-3">{selectedTemplate.emoji} {selectedTemplate.name} — Exercices</h4>
            <div className="space-y-2">
              {selectedTemplate.exercises.map((ex, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 text-sm">
                  <span className="text-white/90">{ex.name}</span>
                  <span className="text-white/50">
                    {ex.reps > 0 ? `${ex.sets}×${ex.reps}` : `${ex.sets}×${ex.duration}s`}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setReportForm(f => ({ ...f, type: selectedTemplate.id }));
                setShowReportForm(true);
              }}
              className="mt-3 w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Enregistrer cette séance
            </button>
          </div>
        )}
      </div>

      {/* ─── New Report Form ─────────────────────────────────────────── */}
      {!showReportForm && (
        <button
          onClick={() => setShowReportForm(true)}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Ajouter un rapport de séance
        </button>
      )}

      {showReportForm && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-bold flex items-center gap-2">
              <Activity size={18} className="text-orange-400" /> Rapport de séance
            </h4>
            <button onClick={() => setShowReportForm(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
          </div>

          {/* Session type */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Type de séance</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'push', label: '💪 Push' },
                { id: 'pull', label: '🏋️ Pull' },
                { id: 'legs', label: '🦵 Legs' },
                { id: 'fullbody', label: '⚡ Full Body' },
                { id: 'cardio', label: '🏃 Cardio' },
                { id: 'yoga', label: '🧘 Yoga' },
                { id: 'rest', label: '😴 Repos actif' }
              ].map(t => (
                <button key={t.id}
                  onClick={() => setReportForm(f => ({ ...f, type: t.id }))}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    reportForm.type === t.id ? 'bg-orange-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >{t.label}</button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Durée (minutes)</label>
            <input type="number" value={reportForm.duration}
              onChange={e => setReportForm(f => ({ ...f, duration: parseInt(e.target.value) || 0 }))}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
          </div>

          {/* Energy slider */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Énergie ressentie : <span className="text-white font-bold">{reportForm.energy}/10</span>
              <span className="text-white/40 ml-2">(lunaire attendue : {lunar.energy}/10)</span>
            </label>
            <input type="range" min="1" max="10" value={reportForm.energy}
              onChange={e => setReportForm(f => ({ ...f, energy: parseInt(e.target.value) }))}
              className="w-full accent-orange-500" />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Épuisé</span><span>Normal</span><span>En feu !</span>
            </div>
          </div>

          {/* Performance */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Performance (exercices réalisés)</label>
            <textarea value={reportForm.performance}
              onChange={e => setReportForm(f => ({ ...f, performance: e.target.value }))}
              placeholder="Ex: Pompes 3×12, Dips 4×10..."
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white text-sm h-20 resize-none" />
          </div>

          {/* Nutrition note */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Note nutrition</label>
            <input type="text" value={reportForm.nutritionNote}
              onChange={e => setReportForm(f => ({ ...f, nutritionNote: e.target.value }))}
              placeholder="Ex: Smoothie post-workout, bien hydraté..."
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
          </div>

          <button onClick={submitReport}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 rounded-xl font-bold transition-all">
            Enregistrer le rapport
          </button>
        </div>
      )}

      {/* ─── Correlation Analysis ────────────────────────────────────── */}
      {correlationData && (
        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 rounded-xl p-5 space-y-4">
          <h4 className="text-white font-bold flex items-center gap-2">
            <Moon size={18} className="text-indigo-400" /> Corrélation Lunaire
          </h4>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-black text-white">{correlationData.correlationPct}%</div>
              <div className="text-[10px] text-gray-400">Corrélation</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-black text-white">{correlationData.totalSessions}</div>
              <div className="text-[10px] text-gray-400">Séances</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-lg font-bold text-white">{correlationData.bestPhase?.phase?.split(' ').slice(0, 2).join(' ')}</div>
              <div className="text-[10px] text-gray-400">Meilleure phase</div>
            </div>
          </div>

          <p className="text-sm text-indigo-200/70 italic">
            {correlationData.correlationPct >= 70
              ? '✨ Excellente synchronisation avec les cycles lunaires !'
              : correlationData.correlationPct >= 50
                ? '👍 Bonne corrélation. Continuez à suivre vos cycles.'
                : '📊 Corrélation faible. Essayez d\'ajuster votre intensité selon la lune.'}
          </p>

          {/* Phase averages */}
          <div className="space-y-2">
            {correlationData.phaseAverages.map(p => (
              <div key={p.phase} className="flex items-center gap-3 text-xs">
                <span className="w-32 text-gray-400 truncate">{p.phase}</span>
                <div className="flex-1 bg-black/30 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${parseFloat(p.avg) * 10}%` }} />
                </div>
                <span className="text-white w-8 text-right">{p.avg}</span>
                <span className="text-gray-500 w-12">({p.count}×)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Recent Reports ──────────────────────────────────────────── */}
      {reports.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-green-400" /> Historique ({reports.length})
            </h4>
            <div className="flex gap-2">
              <button onClick={() => handleSync('push')} disabled={syncing} title="Envoyer vers Nextcloud"
                className="bg-blue-700/50 hover:bg-blue-600/50 disabled:opacity-40 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1">
                {syncing ? <RefreshCw size={12} className="animate-spin" /> : <Cloud size={12} />} Sync
              </button>
            </div>
          </div>
          {syncMsg && (
            <p className={`text-xs mb-2 ${syncMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{syncMsg.text}</p>
          )}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {reports.slice(0, 20).map(r => {
              const template = WORKOUT_TEMPLATES.find(t => t.id === r.type) || {};
              const typeLabels = { cardio: '🏃 Cardio', yoga: '🧘 Yoga', rest: '😴 Repos' };
              return (
                <div key={r.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-3">
                  <span className="text-xl">{template.emoji || typeLabels[r.type]?.split(' ')[0] || '🏋️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white font-semibold">{template.name || typeLabels[r.type]?.split(' ')[1] || r.type}</span>
                      <span className="text-white/30">•</span>
                      <span className="text-white/50">{r.duration}min</span>
                      <span className="text-white/30">•</span>
                      <span className="text-yellow-400">⚡{r.energy}/10</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>{new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      <span>{r.moonEmoji} {r.moonPhase}</span>
                      {r.energy > r.lunarEnergy && <span className="text-green-400">↑</span>}
                      {r.energy < r.lunarEnergy && <span className="text-red-400">↓</span>}
                    </div>
                    {r.performance && <p className="text-xs text-white/40 mt-1 truncate">{r.performance}</p>}
                  </div>
                  <button onClick={() => deleteReport(r.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reports.length === 0 && !showReportForm && (
        <div className="text-center py-8 text-gray-500">
          <Activity size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucun rapport de séance</p>
          <p className="text-sm">Enregistrez votre première séance pour voir vos stats</p>
        </div>
      )}
    </div>
  );
};

export default SportPerformance;
