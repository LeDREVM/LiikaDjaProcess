import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, RotateCcw, Calendar, TrendingUp, Moon, Sun, MessageCircle, X, Cloud, CloudOff, Settings, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import {
  syncToNextcloud,
  fetchFromNextcloud,
  testNextcloudConnection,
  saveNextcloudConfig,
  loadNextcloudConfig
} from '../utils/nextcloudSync';

// ─── Types de jeûne ───────────────────────────────────────────────────────────
const fastingTypes = {
  '16-8': { fast: 16, eat: 8, name: '16:8 (Débutant)', description: '16h jeûne, 8h alimentation' },
  '18-6': { fast: 18, eat: 6, name: '18:6 (Intermédiaire)', description: '18h jeûne, 6h alimentation' },
  '20-4': { fast: 20, eat: 4, name: '20:4 (Avancé)', description: '20h jeûne, 4h alimentation' },
  '24':   { fast: 24, eat: 0, name: '24h (Warrior)',  description: '24h de jeûne complet' }
};

// ─── Messages d'encouragement ─────────────────────────────────────────────────
const encouragementMessages = {
  2:  { title: "🌱 Excellent départ !",         message: "2 heures de jeûne accompli ! Votre corps commence à puiser dans ses réserves de glycogène. Restez hydraté !", tip: "💧 Buvez un grand verre d'eau" },
  4:  { title: "💪 Vous êtes sur la bonne voie !", message: "4 heures ! Votre insuline commence à baisser. C'est le moment idéal pour une activité légère.", tip: "🚶 Une petite marche serait parfaite" },
  6:  { title: "🔥 La cétose approche !",        message: "6 heures de jeûne ! Votre corps commence la transition vers la combustion des graisses. Bravo !", tip: "☕ Un thé ou café sans sucre pour vous accompagner" },
  8:  { title: "⭐ Vous êtes à mi-chemin !",      message: "8 heures ! La moitié du chemin est parcourue. Votre corps est maintenant en mode détox.", tip: "🧘 Prenez quelques minutes pour méditer" },
  10: { title: "🌟 Performance maximale !",       message: "10 heures ! Votre clarté mentale est à son pic. L'autophagie cellulaire est en marche.", tip: "🧠 Profitez de cette concentration pour vos tâches importantes" },
  12: { title: "🏆 Champion du jeûne !",          message: "12 heures accomplies ! Votre corps brûle activement les graisses. Vous êtes incroyable !", tip: "💪 Vous pouvez faire quelques étirements" },
  14: { title: "🎯 Presque au but !",             message: "14 heures ! L'autophagie bat son plein. Vos cellules se régénèrent. Continuez !", tip: "🌿 Une tisane pour vous réconforter" },
  16: { title: "🎉 16 heures accomplies !",       message: "Félicitations ! Vous avez atteint les 16 heures. Votre corps vous remercie pour ce cadeau !", tip: "🍽️ Préparez un repas équilibré pour rompre le jeûne" },
  18: { title: "🌙 Maître du jeûne !",            message: "18 heures ! Vous êtes dans la zone d'élite. Les bénéfices sont maximaux !", tip: "🙏 Prenez un moment de gratitude" },
  20: { title: "👑 Niveau expert atteint !",      message: "20 heures ! Votre résilience est impressionnante. L'autophagie profonde est active.", tip: "✨ Vous êtes un guerrier du jeûne" },
  22: { title: "🔮 Zone mystique !",              message: "22 heures ! Peu de personnes atteignent ce niveau. Votre corps se transforme.", tip: "🌟 La fin approche, tenez bon" },
  24: { title: "🏅 Jeûne de 24h complété !",      message: "Extraordinaire ! 24 heures de jeûne. Vous avez accompli quelque chose de remarquable !", tip: "🎊 Célébrez cette victoire avec un repas conscient" }
};

// ─── Panel de configuration Nextcloud ─────────────────────────────────────────
const NextcloudPanel = ({ onClose }) => {
  const [config, setConfig] = useState(() => loadNextcloudConfig() || { serverUrl: '', username: '', password: '' });
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    const result = await testNextcloudConnection(config.serverUrl, config.username, config.password);
    setStatus(result);
    setTesting(false);
    if (result.success) saveNextcloudConfig(config);
  };

  const handleSave = () => {
    saveNextcloudConfig(config);
    setStatus({ success: true, message: 'Configuration sauvegardée.' });
  };

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-6 border border-blue-700/30 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
          <Cloud size={20} /> Configuration Nextcloud
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">URL du serveur</label>
          <input
            type="url"
            placeholder="https://mon-nextcloud.exemple.com"
            value={config.serverUrl}
            onChange={e => setConfig(c => ({ ...c, serverUrl: e.target.value }))}
            className="w-full bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nom d'utilisateur</label>
          <input
            type="text"
            placeholder="utilisateur"
            value={config.username}
            onChange={e => setConfig(c => ({ ...c, username: e.target.value }))}
            className="w-full bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Mot de passe (ou mot de passe d'application)</label>
          <input
            type="password"
            placeholder="••••••••"
            value={config.password}
            onChange={e => setConfig(c => ({ ...c, password: e.target.value }))}
            className="w-full bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {status && (
        <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${status.success ? 'bg-green-900/30 text-green-400 border border-green-700/40' : 'bg-red-900/30 text-red-400 border border-red-700/40'}`}>
          {status.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {status.message}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex-1 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          {testing ? 'Test en cours…' : 'Tester la connexion'}
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Sauvegarder
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Les données sont stockées dans <code className="text-gray-400">/NegusLunar/&lt;profil&gt;/fasting-history.json</code> sur votre Nextcloud.
        Utilisez un <strong>mot de passe d'application</strong> Nextcloud pour plus de sécurité.
      </p>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
const IntermittentFasting = () => {
  const { activeProfile } = useProfile();
  const profileId = activeProfile?.id || 'default';

  // Clés localStorage scopées au profil
  const keys = {
    history: `ld-fasting-history-${profileId}`,
    active:  `ld-fasting-active-${profileId}`,
    start:   `ld-fasting-start-${profileId}`,
    phase:   `ld-fasting-phase-${profileId}`,
    type:    `ld-fasting-type-${profileId}`
  };

  const [fastingType, setFastingType] = useState('16-8');
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [fastingHistory, setFastingHistory] = useState([]);
  const [currentPhase, setCurrentPhase] = useState('eating');
  const [encouragementMessage, setEncouragementMessage] = useState(null);
  const [lastEncouragementHour, setLastEncouragementHour] = useState(0);
  const [showNextcloudPanel, setShowNextcloudPanel] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const intervalRef = useRef(null);

  // Recharger les données quand le profil change
  useEffect(() => {
    const savedHistory = localStorage.getItem(keys.history);
    const savedActive  = localStorage.getItem(keys.active);
    const savedStart   = localStorage.getItem(keys.start);
    const savedPhase   = localStorage.getItem(keys.phase);
    const savedType    = localStorage.getItem(keys.type);

    setFastingHistory(savedHistory ? JSON.parse(savedHistory) : []);
    if (savedType) setFastingType(savedType);
    if (savedActive === 'true' && savedStart) {
      setIsActive(true);
      setStartTime(parseInt(savedStart));
      setCurrentPhase(savedPhase || 'fasting');
    } else {
      setIsActive(false);
      setStartTime(null);
      setElapsedTime(0);
      setCurrentPhase('eating');
    }
    setEncouragementMessage(null);
    setLastEncouragementHour(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  // Persister l'historique
  useEffect(() => {
    localStorage.setItem(keys.history, JSON.stringify(fastingHistory));
  }, [fastingHistory, keys.history]);

  // Persister l'état actif
  useEffect(() => {
    localStorage.setItem(keys.active,  isActive.toString());
    localStorage.setItem(keys.start,   startTime?.toString() || '');
    localStorage.setItem(keys.phase,   currentPhase);
    localStorage.setItem(keys.type,    fastingType);
  }, [isActive, startTime, currentPhase, fastingType, keys.active, keys.start, keys.phase, keys.type]);

  // Timer
  useEffect(() => {
    if (isActive && startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);

        const hoursElapsed = Math.floor(elapsed / 3600);
        if (hoursElapsed > 0 && hoursElapsed % 2 === 0 && hoursElapsed !== lastEncouragementHour) {
          if (encouragementMessages[hoursElapsed]) {
            setEncouragementMessage(encouragementMessages[hoursElapsed]);
            setLastEncouragementHour(hoursElapsed);
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`🌙 NegusLunar — ${activeProfile?.name || 'Jeûne'}`, {
                body: encouragementMessages[hoursElapsed].message,
                icon: '/moon.svg'
              });
            }
          }
        }

        const targetSeconds = fastingTypes[fastingType].fast * 3600;
        if (elapsed >= targetSeconds && currentPhase === 'fasting') completeFast();
      }, 1000);

      return () => clearInterval(intervalRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, startTime, fastingType, currentPhase, lastEncouragementHour]);

  // Notifications
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const startFast = () => {
    setStartTime(Date.now());
    setIsActive(true);
    setElapsedTime(0);
    setCurrentPhase('fasting');
    setLastEncouragementHour(0);
    setEncouragementMessage(null);
  };

  const pauseFast = () => {
    setIsActive(false);
    clearInterval(intervalRef.current);
  };

  const resumeFast = () => {
    setStartTime(Date.now() - elapsedTime * 1000);
    setIsActive(true);
  };

  const completeFast = () => {
    const fast = {
      id: Date.now(),
      type: fastingType,
      duration: elapsedTime,
      targetDuration: fastingTypes[fastingType].fast * 3600,
      startTime,
      endTime: Date.now(),
      completed: elapsedTime >= fastingTypes[fastingType].fast * 3600,
      date: new Date().toISOString(),
      profileId
    };
    setFastingHistory(prev => [fast, ...prev]);
    resetFast();
  };

  const resetFast = () => {
    setIsActive(false);
    setStartTime(null);
    setElapsedTime(0);
    setCurrentPhase('eating');
    clearInterval(intervalRef.current);
  };

  // ── Nextcloud sync ─────────────────────────────────────────────────────────
  const handleSync = async () => {
    const config = loadNextcloudConfig();
    if (!config) {
      setShowNextcloudPanel(true);
      return;
    }
    setSyncing(true);
    setSyncStatus(null);
    const result = await syncToNextcloud(profileId, fastingHistory, config);
    setSyncStatus(result);
    setSyncing(false);
  };

  const handleFetchFromNextcloud = async () => {
    const config = loadNextcloudConfig();
    if (!config) { setShowNextcloudPanel(true); return; }
    setSyncing(true);
    setSyncStatus(null);
    const result = await fetchFromNextcloud(profileId, config);
    if (result.success && result.data.length > 0) {
      // Merge: keep local + remote, deduplicate by id
      setFastingHistory(prev => {
        const merged = [...result.data, ...prev];
        const seen = new Set();
        return merged.filter(item => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        }).sort((a, b) => b.id - a.id);
      });
    }
    setSyncStatus(result);
    setSyncing(false);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getProgress = () => {
    const target = fastingTypes[fastingType].fast * 3600;
    return Math.min((elapsedTime / target) * 100, 100);
  };

  const getStats = () => {
    const completed = fastingHistory.filter(f => f.completed).length;
    const totalDuration = fastingHistory.reduce((acc, f) => acc + f.duration, 0);
    const avg = fastingHistory.length > 0 ? totalDuration / fastingHistory.length : 0;
    const longest = fastingHistory.length > 0 ? Math.max(...fastingHistory.map(f => f.duration)) : 0;
    return {
      completed,
      total: fastingHistory.length,
      avgDuration: Math.floor(avg / 3600),
      longestFast: Math.floor(longest / 3600)
    };
  };

  const stats = getStats();
  const progress = getProgress();
  const targetHours = fastingTypes[fastingType].fast;
  const currentHours = Math.floor(elapsedTime / 3600);
  const hasNextcloudConfig = !!loadNextcloudConfig();

  return (
    <div className="space-y-6">
      {/* En-tête avec profil actif */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-400 mb-1">⏱️ Jeûne Intermittent</h2>
        {activeProfile && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-2xl">{activeProfile.avatar}</span>
            <span className="text-white font-semibold">{activeProfile.name}</span>
          </div>
        )}
        <p className="text-gray-400 text-sm mt-1">Suivez vos périodes de jeûne et optimisez votre santé</p>
      </div>

      {/* Sélection du type de jeûne */}
      {!isActive && (
        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl p-6 border border-indigo-700/30">
          <h3 className="text-lg font-bold text-indigo-400 mb-4">Choisir un protocole</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(fastingTypes).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setFastingType(key)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  fastingType === key
                    ? 'border-indigo-500 bg-indigo-900/30'
                    : 'border-gray-700 bg-gray-800/30 hover:border-indigo-700'
                }`}
              >
                <div className="font-bold text-white mb-1">{type.name}</div>
                <div className="text-sm text-gray-400">{type.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timer principal */}
      <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-xl p-8 border border-amber-700/30">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            currentPhase === 'fasting'
              ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50'
              : 'bg-green-900/30 text-green-400 border border-green-700/50'
          }`}>
            {currentPhase === 'fasting' ? <Moon size={20} /> : <Sun size={20} />}
            <span className="font-semibold">
              {currentPhase === 'fasting' ? 'Phase de Jeûne' : "Phase d'Alimentation"}
            </span>
          </div>
        </div>

        {/* Cercle de progression */}
        <div className="relative w-64 h-64 mx-auto mb-6">
          <svg className="transform -rotate-90 w-full h-full">
            <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="12" fill="none" className="text-gray-700" />
            <circle
              cx="128" cy="128" r="110"
              stroke="currentColor" strokeWidth="12" fill="none"
              strokeDasharray={`${2 * Math.PI * 110}`}
              strokeDashoffset={`${2 * Math.PI * 110 * (1 - progress / 100)}`}
              className="text-amber-500 transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-white mb-2">{formatTime(elapsedTime)}</div>
            <div className="text-sm text-gray-400">{currentHours}h / {targetHours}h</div>
            <div className="text-lg font-semibold text-amber-400 mt-2">{Math.round(progress)}%</div>
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex justify-center gap-3 flex-wrap">
          {!isActive ? (
            <button
              onClick={startFast}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg transition-all flex items-center gap-2 font-semibold"
            >
              <Play size={20} /> Démarrer le jeûne
            </button>
          ) : (
            <>
              <button onClick={pauseFast} className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2">
                <Pause size={20} /> Pause
              </button>
              <button onClick={completeFast} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2">
                <Clock size={20} /> Terminer
              </button>
              <button onClick={resetFast} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2">
                <RotateCcw size={20} /> Réinitialiser
              </button>
            </>
          )}
        </div>

        {!isActive && elapsedTime > 0 && (
          <button
            onClick={resumeFast}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play size={20} /> Reprendre
          </button>
        )}
      </div>

      {/* Statistiques */}
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-700/30">
        <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
          <TrendingUp size={20} /> Statistiques
          {activeProfile && <span className="text-sm font-normal text-gray-400">— {activeProfile.name}</span>}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-gray-400 mt-1">Jeûnes réussis</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-sm text-gray-400 mt-1">Total de jeûnes</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">{stats.avgDuration}h</div>
            <div className="text-sm text-gray-400 mt-1">Durée moyenne</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{stats.longestFast}h</div>
            <div className="text-sm text-gray-400 mt-1">Plus long jeûne</div>
          </div>
        </div>
      </div>

      {/* Synchronisation Nextcloud */}
      <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl p-6 border border-blue-700/30 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
            {hasNextcloudConfig ? <Cloud size={20} /> : <CloudOff size={20} />}
            Sync Nextcloud
          </h3>
          <button
            onClick={() => setShowNextcloudPanel(p => !p)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Configurer Nextcloud"
          >
            <Settings size={18} />
          </button>
        </div>

        {syncStatus && (
          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
            syncStatus.success
              ? 'bg-green-900/30 text-green-400 border border-green-700/40'
              : 'bg-red-900/30 text-red-400 border border-red-700/40'
          }`}>
            {syncStatus.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {syncStatus.message}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Cloud size={16} />
            {syncing ? 'Envoi…' : 'Envoyer vers Nextcloud'}
          </button>
          <button
            onClick={handleFetchFromNextcloud}
            disabled={syncing}
            className="flex-1 flex items-center justify-center gap-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Download size={16} />
            {syncing ? 'Récup…' : 'Récupérer depuis Nextcloud'}
          </button>
        </div>

        {showNextcloudPanel && (
          <NextcloudPanel onClose={() => setShowNextcloudPanel(false)} />
        )}
      </div>

      {/* Historique */}
      {fastingHistory.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900/20 to-slate-900/20 rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
            <Calendar size={20} /> Historique des jeûnes
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {fastingHistory.slice(0, 10).map(fast => (
              <div
                key={fast.id}
                className={`bg-gray-800/50 rounded-lg p-3 flex items-center justify-between ${
                  fast.completed ? 'border-l-4 border-green-500' : 'border-l-4 border-yellow-500'
                }`}
              >
                <div>
                  <div className="font-semibold text-white">{fastingTypes[fast.type]?.name || fast.type}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(fast.date).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-400">{formatTime(fast.duration)}</div>
                  <div className="text-xs text-gray-400">{fast.completed ? '✓ Complété' : '⚠ Interrompu'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message d'encouragement */}
      {encouragementMessage && (
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-6 border-2 border-green-500/50 shadow-lg shadow-green-500/20 animate-fadeIn relative">
          <button onClick={() => setEncouragementMessage(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
          <div className="flex items-start gap-4">
            <MessageCircle className="text-green-400 shrink-0" size={40} />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-green-400 mb-2">{encouragementMessage.title}</h3>
              <p className="text-white text-base mb-3 leading-relaxed">{encouragementMessage.message}</p>
              <div className="bg-green-800/30 rounded-lg p-3 border border-green-700/50">
                <p className="text-green-300 text-sm font-semibold">{encouragementMessage.tip}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conseils */}
      <div className="bg-gradient-to-br from-teal-900/20 to-cyan-900/20 rounded-xl p-6 border border-teal-700/30">
        <h3 className="text-lg font-bold text-teal-400 mb-3">💡 Conseils pour réussir</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2"><span className="text-teal-400 mt-1">•</span><span>Restez bien hydraté pendant le jeûne (eau, thé, café sans sucre)</span></li>
          <li className="flex items-start gap-2"><span className="text-teal-400 mt-1">•</span><span>Commencez progressivement avec le protocole 16:8</span></li>
          <li className="flex items-start gap-2"><span className="text-teal-400 mt-1">•</span><span>Écoutez votre corps et adaptez selon vos besoins</span></li>
          <li className="flex items-start gap-2"><span className="text-teal-400 mt-1">•</span><span>Privilégiez des repas équilibrés pendant la fenêtre d'alimentation</span></li>
          <li className="flex items-start gap-2"><span className="text-teal-400 mt-1">•</span><span>📬 Vous recevrez un message d'encouragement toutes les 2 heures</span></li>
        </ul>
      </div>
    </div>
  );
};

export default IntermittentFasting;
