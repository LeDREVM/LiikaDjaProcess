import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, Calendar, Download, Plus, X, Check, Trash2, Folder } from 'lucide-react';

const WorkCalculator = () => {
  const [projects, setProjects] = useState([]);
  const [workSessions, setWorkSessions] = useState([]);
  const [hourlyRate, setHourlyRate] = useState(15);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', color: 'blue' });
  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 60,
    description: ''
  });
  const [filter, setFilter] = useState('all'); // all, today, week, month

  // Charger les données
  useEffect(() => {
    const savedProjects = localStorage.getItem('neguslunar-work-projects');
    const saved = localStorage.getItem('neguslunar-work-sessions');
    const savedRate = localStorage.getItem('neguslunar-hourly-rate');
    
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    if (saved) setWorkSessions(JSON.parse(saved));
    if (savedRate) setHourlyRate(parseFloat(savedRate));
  }, []);

  // Sauvegarder les données
  useEffect(() => {
    localStorage.setItem('neguslunar-work-projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('neguslunar-work-sessions', JSON.stringify(workSessions));
  }, [workSessions]);

  useEffect(() => {
    localStorage.setItem('neguslunar-hourly-rate', hourlyRate.toString());
  }, [hourlyRate]);

  const colorClasses = {
    blue: 'bg-blue-900/30 border-blue-700/30 text-blue-400',
    green: 'bg-green-900/30 border-green-700/30 text-green-400',
    purple: 'bg-purple-900/30 border-purple-700/30 text-purple-400',
    orange: 'bg-orange-900/30 border-orange-700/30 text-orange-400',
    red: 'bg-red-900/30 border-red-700/30 text-red-400',
    pink: 'bg-pink-900/30 border-pink-700/30 text-pink-400'
  };

  // Ajouter un projet
  const addProject = () => {
    if (!newProject.name) return;
    
    const project = {
      id: Date.now(),
      ...newProject,
      createdAt: new Date().toISOString()
    };
    
    setProjects([...projects, project]);
    setSelectedProject(project.id);
    setNewProject({ name: '', description: '', color: 'blue' });
    setShowNewProject(false);
  };

  // Supprimer un projet
  const deleteProject = (id) => {
    if (confirm('Êtes-vous sûr ? Les sessions liées resteront.')) {
      setProjects(projects.filter(p => p.id !== id));
      if (selectedProject === id) setSelectedProject(null);
    }
  };

  // Calculer les heures travaillées
  const calculateHours = (start, end, breakMinutes) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    const totalMinutes = endMinutes - startMinutes - breakMinutes;
    return Math.max(0, totalMinutes / 60);
  };

  // Ajouter une session
  const addSession = () => {
    if (!newSession.startTime || !newSession.endTime || !selectedProject) return;

    const hours = calculateHours(newSession.startTime, newSession.endTime, newSession.breakMinutes);
    const earnings = hours * hourlyRate;

    const session = {
      id: Date.now(),
      date: newSession.date,
      startTime: newSession.startTime,
      endTime: newSession.endTime,
      breakMinutes: newSession.breakMinutes,
      description: newSession.description,
      projectId: selectedProject,
      hours: parseFloat(hours.toFixed(2)),
      earnings: parseFloat(earnings.toFixed(2))
    };

    setWorkSessions([session, ...workSessions]);
    setNewSession({
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 60,
      description: ''
    });
  };

  // Supprimer une session
  const deleteSession = (id) => {
    setWorkSessions(workSessions.filter(s => s.id !== id));
  };

  // Filtrer les sessions
  const getFilteredSessions = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    let filtered = workSessions.filter(session => {
      if (filter === 'today') {
        return session.date === today;
      }
      if (filter === 'week') {
        const sessionDate = new Date(session.date);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekAgo;
      }
      if (filter === 'month') {
        const sessionDate = new Date(session.date);
        return sessionDate.getMonth() === now.getMonth() && 
               sessionDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    // Filtrer par projet si sélectionné
    if (selectedProject) {
      filtered = filtered.filter(s => s.projectId === selectedProject);
    }

    return filtered;
  };

  // Calculer les totaux
  const getTotals = () => {
    const filtered = getFilteredSessions();
    return filtered.reduce((acc, session) => ({
      hours: acc.hours + session.hours,
      earnings: acc.earnings + session.earnings
    }), { hours: 0, earnings: 0 });
  };

  // Obtenir les stats par projet
  const getProjectStats = (projectId) => {
    const sessions = workSessions.filter(s => s.projectId === projectId);
    return sessions.reduce((acc, session) => ({
      hours: acc.hours + session.hours,
      earnings: acc.earnings + session.earnings,
      sessions: acc.sessions + 1
    }), { hours: 0, earnings: 0, sessions: 0 });
  };

  // Exporter en CSV
  const exportToCSV = () => {
    const filtered = getFilteredSessions();
    
    const headers = ['Date', 'Projet', 'Début', 'Fin', 'Pause (min)', 'Heures', 'Taux horaire', 'Gains', 'Description'];
    const rows = filtered.map(s => {
      const project = projects.find(p => p.id === s.projectId);
      return [
        s.date,
        project?.name || 'Sans projet',
        s.startTime,
        s.endTime,
        s.breakMinutes,
        s.hours,
        hourlyRate,
        s.earnings,
        s.description || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `heures_travail_${filter}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totals = getTotals();
  const filteredSessions = getFilteredSessions();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-blue-400 mb-2">
          ⏰ Calculateur d'Heures de Travail
        </h2>
        <p className="text-gray-400 text-sm">
          Suivez vos heures par projet et calculez vos gains automatiquement
        </p>
      </div>

      {/* Gestion des Projets */}
      <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 rounded-xl p-6 border border-indigo-700/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            <Folder size={20} />
            Mes Projets
          </h3>
          <button
            onClick={() => setShowNewProject(!showNewProject)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Nouveau Projet
          </button>
        </div>

        {/* Formulaire nouveau projet */}
        {showNewProject && (
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Nom du projet *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="Ex: Travaux Espace Vert"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Couleur</label>
                <select
                  value={newProject.color}
                  onChange={(e) => setNewProject({...newProject, color: e.target.value})}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="blue">Bleu</option>
                  <option value="green">Vert</option>
                  <option value="purple">Violet</option>
                  <option value="orange">Orange</option>
                  <option value="red">Rouge</option>
                  <option value="pink">Rose</option>
                </select>
              </div>
              <div className="flex gap-2 items-end">
                <button
                  onClick={addProject}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
                >
                  <Check size={16} />
                  Créer
                </button>
                <button
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mt-3 mb-2">Description (optionnel)</label>
              <input
                type="text"
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                placeholder="Détails du projet..."
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Liste des projets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-6 text-gray-400 text-sm">
              Créez votre premier projet pour commencer
            </div>
          ) : (
            projects.map(project => {
              const stats = getProjectStats(project.id);
              const colorClass = colorClasses[project.color] || colorClasses.blue;
              
              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedProject === project.id
                      ? `${colorClass} border-${project.color}-500`
                      : `border-gray-700 bg-gray-800/30 hover:border-gray-600`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-white">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-gray-400 mt-1">{project.description}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {stats.sessions} session{stats.sessions > 1 ? 's' : ''} • {stats.hours.toFixed(1)}h • {stats.earnings.toFixed(2)}€
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Taux horaire */}
      <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-blue-700/30">
        <div className="flex items-center gap-4">
          <DollarSign className="text-blue-400" size={32} />
          <div className="flex-1">
            <label className="text-sm text-gray-400 block mb-2">Taux horaire (€)</label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
              step="0.5"
              min="0"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white text-2xl font-bold focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Gains/heure</div>
            <div className="text-2xl font-bold text-blue-400">{hourlyRate.toFixed(2)}€</div>
          </div>
        </div>
      </div>

      {/* Nouvelle session */}
      <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-700/30">
        <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
          <Plus size={20} />
          Nouvelle Session
        </h3>

        {projects.length === 0 ? (
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 text-yellow-300 text-sm mb-4">
            ⚠️ Créez d'abord un projet avant d'ajouter des sessions
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Projet sélectionné *
                  {selectedProject && (
                    <span className="text-green-400 font-semibold ml-2">
                      {projects.find(p => p.id === selectedProject)?.name}
                    </span>
                  )}
                </label>
                {!selectedProject && (
                  <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-red-300 text-sm">
                    Sélectionnez un projet ci-dessus
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Date</label>
                <input
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Heure de début</label>
                <input
                  type="time"
                  value={newSession.startTime}
                  onChange={(e) => setNewSession({...newSession, startTime: e.target.value})}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Heure de fin</label>
                <input
                  type="time"
                  value={newSession.endTime}
                  onChange={(e) => setNewSession({...newSession, endTime: e.target.value})}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Pause (minutes)</label>
                <input
                  type="number"
                  value={newSession.breakMinutes}
                  onChange={(e) => setNewSession({...newSession, breakMinutes: parseInt(e.target.value) || 0})}
                  min="0"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Heures calculées</label>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white text-center font-bold">
                  {calculateHours(newSession.startTime, newSession.endTime, newSession.breakMinutes).toFixed(2)}h
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Gains estimés</label>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-green-400 text-center font-bold">
                  {(calculateHours(newSession.startTime, newSession.endTime, newSession.breakMinutes) * hourlyRate).toFixed(2)}€
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 block mb-2">Description (optionnel)</label>
                <textarea
                  value={newSession.description}
                  onChange={(e) => setNewSession({...newSession, description: e.target.value})}
                  placeholder="Détails de la session..."
                  rows="2"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <button
              onClick={addSession}
              disabled={!selectedProject}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
              Ajouter la session
            </button>
          </>
        )}
      </div>

      {/* Filtres et Totaux */}
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-700/30">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex gap-2">
            {['all', 'today', 'week', 'month'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                {f === 'all' ? 'Tout' : f === 'today' ? 'Aujourd\'hui' : f === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>

          <button
            onClick={exportToCSV}
            disabled={filteredSessions.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={20} />
            Exporter CSV
          </button>
        </div>

        {/* Totaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{filteredSessions.length}</div>
            <div className="text-sm text-gray-400 mt-1">Sessions</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{totals.hours.toFixed(2)}h</div>
            <div className="text-sm text-gray-400 mt-1">Heures totales</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{totals.earnings.toFixed(2)}€</div>
            <div className="text-sm text-gray-400 mt-1">Gains totaux</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">
              {filteredSessions.length > 0 ? (totals.hours / filteredSessions.length).toFixed(1) : '0'}h
            </div>
            <div className="text-sm text-gray-400 mt-1">Moyenne/jour</div>
          </div>
        </div>
      </div>

      {/* Liste des sessions */}
      {filteredSessions.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900/20 to-slate-900/20 rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Historique des Sessions
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSessions.map(session => {
              const project = projects.find(p => p.id === session.projectId);
              return (
                <div
                  key={session.id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-semibold">{session.date}</span>
                        {project && (
                          <span className={`${colorClasses[project.color]} px-2 py-1 rounded text-xs font-semibold`}>
                            {project.name}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>{session.startTime} → {session.endTime}</span>
                          <span className="text-gray-500">(Pause: {session.breakMinutes}min)</span>
                        </div>
                        {session.description && (
                          <div className="text-gray-500 italic">{session.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-blue-400">{session.hours}h</div>
                      <div className="text-lg font-semibold text-green-400">{session.earnings.toFixed(2)}€</div>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="mt-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkCalculator;
