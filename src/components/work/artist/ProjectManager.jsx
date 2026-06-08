import React, { useState } from 'react';
import { Plus, X, Edit2, Check, Folder, Calendar, DollarSign, Users, Video, FileText, UserPlus, TrendingUp, AlertCircle } from 'lucide-react';

const ProjectManager = ({ projects, setProjects, artists, shootings, budgets, partnerships, contracts }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: '',
    status: 'planning', // planning, active, completed, cancelled
    color: '#8b5cf6', // violet par défaut
    artistIds: [],
    shootingIds: [],
    budgetIds: [],
    partnershipIds: [],
    contractIds: [],
    notes: ''
  });

  const statusOptions = {
    'planning': { label: 'Planification', color: 'blue', icon: '📋' },
    'active': { label: 'En cours', color: 'green', icon: '🎬' },
    'completed': { label: 'Terminé', color: 'purple', icon: '✅' },
    'cancelled': { label: 'Annulé', color: 'red', icon: '❌' }
  };

  const colorOptions = [
    { value: '#8b5cf6', label: 'Violet' },
    { value: '#3b82f6', label: 'Bleu' },
    { value: '#10b981', label: 'Vert' },
    { value: '#f59e0b', label: 'Orange' },
    { value: '#ef4444', label: 'Rouge' },
    { value: '#ec4899', label: 'Rose' },
    { value: '#14b8a6', label: 'Turquoise' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setProjects(projects.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
      setEditingId(null);
    } else {
      setProjects([...projects, { ...formData, id: Date.now() }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      client: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      budget: '',
      status: 'planning',
      color: '#8b5cf6',
      artistIds: [],
      shootingIds: [],
      budgetIds: [],
      partnershipIds: [],
      contractIds: [],
      notes: ''
    });
    setShowForm(false);
  };

  const handleEdit = (project) => {
    setFormData(project);
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const toggleSelection = (field, id) => {
    const current = formData[field] || [];
    if (current.includes(id)) {
      setFormData({ ...formData, [field]: current.filter(i => i !== id) });
    } else {
      setFormData({ ...formData, [field]: [...current, id] });
    }
  };

  const getProjectStats = (project) => {
    const linkedArtists = artists.filter(a => project.artistIds?.includes(a.id));
    const linkedShootings = shootings.filter(s => project.shootingIds?.includes(s.id));
    const linkedBudgets = budgets.filter(b => project.budgetIds?.includes(b.id));
    const linkedPartnerships = partnerships.filter(p => project.partnershipIds?.includes(p.id));
    const linkedContracts = contracts.filter(c => project.contractIds?.includes(c.id));

    const totalBudget = linkedBudgets.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
    const totalSpent = linkedBudgets.reduce((sum, b) => sum + (parseFloat(b.spent) || 0), 0);

    return {
      artistsCount: linkedArtists.length,
      shootingsCount: linkedShootings.length,
      budgetsCount: linkedBudgets.length,
      partnershipsCount: linkedPartnerships.length,
      contractsCount: linkedContracts.length,
      totalBudget,
      totalSpent,
      budgetRemaining: totalBudget - totalSpent
    };
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Projets ({projects.length})
          </h3>
          <p className="text-gray-400 text-sm mt-1">Gérez vos projets et reliez-y tous vos éléments</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Annuler' : 'Nouveau Projet'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-700/30 space-y-4">
          <h4 className="text-xl font-bold text-purple-300 flex items-center gap-2">
            <Folder size={24} />
            {editingId ? 'Modifier le Projet' : 'Nouveau Projet'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom du projet */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nom du projet *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/30 border border-purple-700/50 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                placeholder="Ex: Clip Musical - Artiste X"
              />
            </div>

            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full bg-black/30 border border-purple-700/50 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                placeholder="Nom du client..."
              />
            </div>

            {/* Date de début */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date de début</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-black/30 border border-purple-700/50 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Date de fin */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date de fin</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-black/30 border border-purple-700/50 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Budget estimé */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Budget estimé (€)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full bg-black/30 border border-purple-700/50 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                placeholder="0"
              />
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-black/30 border border-purple-700/50 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                {Object.entries(statusOptions).map(([key, { label, icon }]) => (
                  <option key={key} value={key}>{icon} {label}</option>
                ))}
              </select>
            </div>

            {/* Couleur */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Couleur du projet</label>
              <div className="flex gap-2">
                {colorOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: value })}
                    className={`w-10 h-10 rounded-lg transition-all ${formData.color === value ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: value }}
                    title={label}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-black/30 border border-purple-700/50 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                rows="3"
                placeholder="Description du projet..."
              />
            </div>
          </div>

          {/* Liaison des éléments */}
          <div className="border-t border-purple-700/30 pt-4 space-y-4">
            <h5 className="text-lg font-semibold text-purple-300">Lier des éléments au projet</h5>

            {/* Artistes */}
            {artists.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Users size={16} /> Artistes
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {artists.map(artist => (
                    <label key={artist.id} className="flex items-center gap-2 bg-black/30 p-2 rounded-lg cursor-pointer hover:bg-black/50">
                      <input
                        type="checkbox"
                        checked={formData.artistIds?.includes(artist.id)}
                        onChange={() => toggleSelection('artistIds', artist.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">{artist.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tournages */}
            {shootings.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Video size={16} /> Tournages
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {shootings.map(shooting => (
                    <label key={shooting.id} className="flex items-center gap-2 bg-black/30 p-2 rounded-lg cursor-pointer hover:bg-black/50">
                      <input
                        type="checkbox"
                        checked={formData.shootingIds?.includes(shooting.id)}
                        onChange={() => toggleSelection('shootingIds', shooting.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">{shooting.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Budgets */}
            {budgets.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <DollarSign size={16} /> Budgets
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {budgets.map(budget => (
                    <label key={budget.id} className="flex items-center gap-2 bg-black/30 p-2 rounded-lg cursor-pointer hover:bg-black/50">
                      <input
                        type="checkbox"
                        checked={formData.budgetIds?.includes(budget.id)}
                        onChange={() => toggleSelection('budgetIds', budget.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">{budget.category}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Partenariats */}
            {partnerships.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <UserPlus size={16} /> Partenariats
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {partnerships.map(partnership => (
                    <label key={partnership.id} className="flex items-center gap-2 bg-black/30 p-2 rounded-lg cursor-pointer hover:bg-black/50">
                      <input
                        type="checkbox"
                        checked={formData.partnershipIds?.includes(partnership.id)}
                        onChange={() => toggleSelection('partnershipIds', partnership.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">{partnership.company}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Contrats */}
            {contracts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <FileText size={16} /> Contrats & Devis
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {contracts.map(contract => (
                    <label key={contract.id} className="flex items-center gap-2 bg-black/30 p-2 rounded-lg cursor-pointer hover:bg-black/50">
                      <input
                        type="checkbox"
                        checked={formData.contractIds?.includes(contract.id)}
                        onChange={() => toggleSelection('contractIds', contract.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">{contract.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-black/30 border border-purple-700/50 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              rows="3"
              placeholder="Notes supplémentaires..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
          >
            <Check size={20} />
            {editingId ? 'Mettre à jour' : 'Créer le projet'}
          </button>
        </form>
      )}

      {/* Liste des projets */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-purple-900/10 to-pink-900/10 rounded-xl border border-purple-700/20">
          <Folder size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-gray-400">Aucun projet enregistré</p>
          <p className="text-gray-500 text-sm">Créez votre premier projet pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map(project => {
            const stats = getProjectStats(project);
            const statusInfo = statusOptions[project.status];
            const progress = project.budget ? (stats.totalSpent / parseFloat(project.budget)) * 100 : 0;

            return (
              <div
                key={project.id}
                className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl p-6 border hover:border-purple-500/50 transition-all"
                style={{ borderColor: `${project.color}40` }}
              >
                {/* En-tête du projet */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <h4 className="text-xl font-bold text-white">{project.name}</h4>
                    </div>
                    {project.client && (
                      <p className="text-gray-400 text-sm">Client: {project.client}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold bg-${statusInfo.color}-900/30 text-${statusInfo.color}-400 border border-${statusInfo.color}-700/50`}
                      >
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-gray-400 text-sm mb-4">{project.description}</p>
                )}

                {/* Dates */}
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(project.startDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {project.endDate && (
                    <>
                      <span>→</span>
                      <span>{new Date(project.endDate).toLocaleDateString('fr-FR')}</span>
                    </>
                  )}
                </div>

                {/* Budget */}
                {project.budget && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Budget</span>
                      <span className="text-white font-semibold">
                        {stats.totalSpent.toFixed(2)}€ / {parseFloat(project.budget).toFixed(2)}€
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${progress > 100 ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    {progress > 100 && (
                      <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                        <AlertCircle size={12} />
                        <span>Budget dépassé de {(stats.totalSpent - parseFloat(project.budget)).toFixed(2)}€</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Statistiques */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="bg-purple-900/20 rounded-lg p-2 text-center border border-purple-700/30">
                    <Users size={16} className="mx-auto mb-1 text-purple-400" />
                    <div className="text-lg font-bold text-white">{stats.artistsCount}</div>
                    <div className="text-xs text-gray-400">Artistes</div>
                  </div>
                  <div className="bg-blue-900/20 rounded-lg p-2 text-center border border-blue-700/30">
                    <Video size={16} className="mx-auto mb-1 text-blue-400" />
                    <div className="text-lg font-bold text-white">{stats.shootingsCount}</div>
                    <div className="text-xs text-gray-400">Tournages</div>
                  </div>
                  <div className="bg-green-900/20 rounded-lg p-2 text-center border border-green-700/30">
                    <DollarSign size={16} className="mx-auto mb-1 text-green-400" />
                    <div className="text-lg font-bold text-white">{stats.budgetsCount}</div>
                    <div className="text-xs text-gray-400">Budgets</div>
                  </div>
                  <div className="bg-amber-900/20 rounded-lg p-2 text-center border border-amber-700/30">
                    <UserPlus size={16} className="mx-auto mb-1 text-amber-400" />
                    <div className="text-lg font-bold text-white">{stats.partnershipsCount}</div>
                    <div className="text-xs text-gray-400">Partenariats</div>
                  </div>
                  <div className="bg-red-900/20 rounded-lg p-2 text-center border border-red-700/30">
                    <FileText size={16} className="mx-auto mb-1 text-red-400" />
                    <div className="text-lg font-bold text-white">{stats.contractsCount}</div>
                    <div className="text-xs text-gray-400">Contrats</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
