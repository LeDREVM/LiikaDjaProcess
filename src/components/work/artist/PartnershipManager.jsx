import React, { useState } from 'react';
import { Plus, X, Edit2, Check, Users, Building, Mail, Phone, DollarSign, Calendar, Link2, Truck, Tv, HelpCircle } from 'lucide-react';

const PartnershipManager = ({ partnerships, setPartnerships, projects = [] }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProject, setSelectedProject] = useState('all');
  const [formData, setFormData] = useState({
    company: '',
    contactName: '',
    email: '',
    phone: '',
    projectId: '',
    type: 'sponsorship', // sponsorship, collaboration, distribution
    value: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'active', // active, pending, completed, cancelled
    terms: '',
    notes: ''
  });

  // Filtrer les partenariats par projet
  const filteredPartnerships = selectedProject === 'all' 
    ? partnerships 
    : partnerships.filter(p => {
        const project = projects.find(proj => proj.id === parseInt(selectedProject));
        return project?.partnershipIds?.includes(p.id);
      });

  const partnershipTypes = {
    'sponsorship': { label: 'Sponsoring', icon: DollarSign },
    'collaboration': { label: 'Collaboration', icon: Link2 },
    'distribution': { label: 'Distribution', icon: Truck },
    'media': { label: 'Média', icon: Tv },
    'other': { label: 'Autre', icon: HelpCircle }
  };

  const statusOptions = {
    'active': { label: 'Actif', color: 'green' },
    'pending': { label: 'En attente', color: 'yellow' },
    'completed': { label: 'Terminé', color: 'blue' },
    'cancelled': { label: 'Annulé', color: 'red' }
  };

  const resetForm = () => {
    setFormData({
      company: '',
      contactName: '',
      email: '',
      phone: '',
      type: 'sponsorship',
      value: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      terms: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingId) {
      setPartnerships(partnerships.map(p => 
        p.id === editingId ? { ...formData, id: editingId } : p
      ));
    } else {
      setPartnerships([...partnerships, { 
        ...formData, 
        id: Date.now(), 
        createdAt: new Date().toISOString() 
      }]);
    }
    
    resetForm();
  };

  const deletePartnership = (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce partenariat ?')) {
      setPartnerships(partnerships.filter(p => p.id !== id));
    }
  };

  const editPartnership = (partnership) => {
    setFormData(partnership);
    setEditingId(partnership.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Bouton ajouter */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-amber-400">
          Partenariats ({partnerships.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Annuler' : 'Nouveau Partenariat'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-xl p-6 border border-amber-700/30">
          <h4 className="text-lg font-bold text-amber-400 mb-4">
            {editingId ? 'Modifier le partenariat' : 'Nouveau partenariat'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Entreprise *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                placeholder="Nom de l'entreprise"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Contact</label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                placeholder="Nom du contact"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                placeholder="contact@entreprise.com"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                placeholder="+33 X XX XX XX XX"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Type de partenariat</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                {Object.entries(partnershipTypes).map(([key, {label, icon: IconComponent}]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                {Object.entries(statusOptions).map(([key, {label}]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Valeur (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                placeholder="Montant"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Date de début</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Date de fin</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Conditions</label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({...formData, terms: e.target.value})}
                rows="2"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                placeholder="Termes et conditions du partenariat..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="2"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                placeholder="Informations complémentaires..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Check size={20} />
              {editingId ? 'Mettre à jour' : 'Créer le partenariat'}
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

      {/* Liste des partenariats */}
      {partnerships.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucun partenariat enregistré</p>
          <p className="text-sm">Cliquez sur "Nouveau Partenariat" pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {partnerships.map(partnership => {
            const type = partnershipTypes[partnership.type];
            const status = statusOptions[partnership.status];
            
            return (
              <div
                key={partnership.id}
                className="bg-gradient-to-br from-gray-800/50 to-slate-800/50 rounded-xl p-6 border border-gray-700 hover:border-amber-600 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="text-amber-400" size={20} />
                      <h4 className="font-bold text-white text-lg">{partnership.company}</h4>
                    </div>
                    
                    <div className="flex gap-2 mb-2">
                      <span className="bg-amber-900/30 text-amber-400 px-2 py-1 rounded text-xs flex items-center gap-1">
                        <type.icon size={14} />
                        {type.label}
                      </span>
                      <span className={`bg-${status.color}-900/30 text-${status.color}-400 px-2 py-1 rounded text-xs border border-${status.color}-700/50`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => editPartnership(partnership)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deletePartnership(partnership.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {partnership.contactName && (
                    <div className="text-gray-400">
                      Contact: <span className="text-white">{partnership.contactName}</span>
                    </div>
                  )}
                  
                  {partnership.email && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail size={14} />
                      <span className="truncate">{partnership.email}</span>
                    </div>
                  )}
                  
                  {partnership.phone && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone size={14} />
                      <span>{partnership.phone}</span>
                    </div>
                  )}

                  {partnership.value && (
                    <div className="flex items-center gap-2 text-green-400 font-semibold mt-3">
                      <DollarSign size={14} />
                      <span>{parseFloat(partnership.value).toLocaleString()}€</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-400 mt-3 pt-3 border-t border-gray-700">
                    <Calendar size={14} />
                    <span>
                      {new Date(partnership.startDate).toLocaleDateString('fr-FR')}
                      {partnership.endDate && ` → ${new Date(partnership.endDate).toLocaleDateString('fr-FR')}`}
                    </span>
                  </div>

                  {partnership.terms && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-xs text-gray-500 mb-1">Conditions:</div>
                      <div className="text-xs text-gray-400">{partnership.terms}</div>
                    </div>
                  )}

                  {partnership.notes && (
                    <div className="mt-2 text-xs text-gray-500 italic">
                      {partnership.notes}
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

export default PartnershipManager;
