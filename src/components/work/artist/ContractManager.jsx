import React, { useState } from 'react';
import { Plus, X, Edit2, FileText, Download, User, Calendar, DollarSign, Check } from 'lucide-react';

const ContractManager = ({ contracts, setContracts, artists, projects = [] }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProject, setSelectedProject] = useState('all');
  const [formData, setFormData] = useState({
    type: 'contract', // contract, quote
    artistId: '',
    projectId: '',
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: '',
    status: 'draft', // draft, sent, signed, cancelled
    terms: '',
    notes: ''
  });

  const contractTypes = {
    'contract': { label: 'Contrat', icon: '📝' },
    'quote': { label: 'Devis', icon: '💼' }
  };

  const statusOptions = {
    'draft': { label: 'Brouillon', color: 'gray' },
    'sent': { label: 'Envoyé', color: 'blue' },
    'signed': { label: 'Signé', color: 'green' },
    'cancelled': { label: 'Annulé', color: 'red' }
  };

  const resetForm = () => {
    setFormData({
      type: 'contract',
      artistId: '',
      projectId: '',
      title: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      validUntil: '',
      status: 'draft',
      terms: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Filtrer les contrats par projet
  const filteredContracts = selectedProject === 'all' 
    ? contracts 
    : contracts.filter(c => c.projectId === parseInt(selectedProject));

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const artist = artists.find(a => a.id === parseInt(formData.artistId));
    
    if (editingId) {
      setContracts(contracts.map(c => 
        c.id === editingId ? { ...formData, id: editingId, artistName: artist?.name } : c
      ));
    } else {
      setContracts([...contracts, { 
        ...formData,
        artistId: parseInt(formData.artistId),
        artistName: artist?.name || 'Artiste inconnu',
        id: Date.now(), 
        createdAt: new Date().toISOString() 
      }]);
    }
    
    resetForm();
  };

  const deleteContract = (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      setContracts(contracts.filter(c => c.id !== id));
    }
  };

  const editContract = (contract) => {
    setFormData(contract);
    setEditingId(contract.id);
    setShowForm(true);
  };

  const exportContractPDF = (contract) => {
    // Simulation d'export PDF (dans une vraie app, utiliser jsPDF ou similaire)
    const content = `
${contract.type === 'contract' ? 'CONTRAT' : 'DEVIS'}

Artiste: ${contract.artistName}
Titre: ${contract.title}
Montant: ${parseFloat(contract.amount).toLocaleString()}€
Date: ${new Date(contract.date).toLocaleDateString('fr-FR')}
${contract.validUntil ? `Valide jusqu'au: ${new Date(contract.validUntil).toLocaleDateString('fr-FR')}` : ''}

Conditions:
${contract.terms || 'Aucune condition spécifiée'}

Notes:
${contract.notes || 'Aucune note'}

Statut: ${statusOptions[contract.status].label}
Créé le: ${new Date(contract.createdAt).toLocaleDateString('fr-FR')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${contract.type}_${contract.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Bouton ajouter et filtre */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-red-400">
            Contrats & Devis ({filteredContracts.length})
          </h3>
          {projects.length > 0 && (
            <div className="mt-2">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="all">Tous les projets</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Annuler' : 'Nouveau Document'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-red-900/20 to-pink-900/20 rounded-xl p-6 border border-red-700/30">
          <h4 className="text-lg font-bold text-red-400 mb-4">
            {editingId ? 'Modifier le document' : 'Nouveau document'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              >
                {Object.entries(contractTypes).map(([key, {label, icon}]) => (
                  <option key={key} value={key}>{icon} {label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Artiste *</label>
              <select
                required
                value={formData.artistId}
                onChange={(e) => setFormData({...formData, artistId: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              >
                <option value="">Sélectionner un artiste</option>
                {artists.map(artist => (
                  <option key={artist.id} value={artist.id}>{artist.name}</option>
                ))}
              </select>
            </div>

            {projects.length > 0 && (
              <div>
                <label className="text-sm text-gray-400 block mb-2">Projet (optionnel)</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Aucun projet</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Titre *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                placeholder="Ex: Contrat clip vidéo"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Montant (€) *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                placeholder="Montant"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              >
                {Object.entries(statusOptions).map(([key, {label}]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Valide jusqu'au</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Conditions</label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({...formData, terms: e.target.value})}
                rows="4"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                placeholder="Termes et conditions du contrat/devis..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="2"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                placeholder="Informations complémentaires..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Check size={20} />
              {editingId ? 'Mettre à jour' : 'Créer le document'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste des contrats */}
      {filteredContracts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucun contrat ou devis {selectedProject !== 'all' ? 'pour ce projet' : 'enregistré'}</p>
          <p className="text-sm">Cliquez sur "Nouveau Document" pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredContracts.map(contract => {
            const type = contractTypes[contract.type];
            const status = statusOptions[contract.status];
            
            return (
              <div
                key={contract.id}
                className="bg-gradient-to-br from-gray-800/50 to-slate-800/50 rounded-xl p-6 border border-gray-700 hover:border-red-600 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{type.icon}</span>
                      <h4 className="font-bold text-white text-lg">{contract.title}</h4>
                    </div>
                    
                    <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
                      <User size={14} />
                      <span>{contract.artistName}</span>
                    </div>
                    
                    <span className={`inline-block bg-${status.color}-900/30 text-${status.color}-400 px-2 py-1 rounded text-xs border border-${status.color}-700/50`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportContractPDF(contract)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Exporter"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => editContract(contract)}
                      className="text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteContract(contract.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-3 px-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                    <span className="text-gray-400 flex items-center gap-2">
                      <DollarSign size={16} />
                      Montant
                    </span>
                    <span className="text-2xl font-bold text-green-400">
                      {parseFloat(contract.amount).toLocaleString()}€
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={14} />
                    <span>{new Date(contract.date).toLocaleDateString('fr-FR')}</span>
                  </div>

                  {contract.validUntil && (
                    <div className="text-xs text-gray-500">
                      Valide jusqu'au: {new Date(contract.validUntil).toLocaleDateString('fr-FR')}
                    </div>
                  )}

                  {contract.terms && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-xs text-gray-500 mb-1">Conditions:</div>
                      <div className="text-xs text-gray-400 max-h-20 overflow-y-auto">
                        {contract.terms}
                      </div>
                    </div>
                  )}

                  {contract.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500 italic">
                      {contract.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContractManager;
