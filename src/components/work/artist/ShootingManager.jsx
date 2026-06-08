import React, { useState } from 'react';
import { Plus, X, Edit2, Check, Video, Calendar, MapPin, Camera, Package, Clock, User } from 'lucide-react';

const ShootingManager = ({ shootings, setShootings, artists, projects = [] }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProject, setSelectedProject] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    artistId: '',
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '18:00',
    location: '',
    status: 'planned', // planned, in-progress, completed, cancelled
    equipment: [],
    cameras: [],
    crew: '',
    notes: ''
  });

  // Filtrer les tournages par projet
  const filteredShootings = selectedProject === 'all' 
    ? shootings 
    : shootings.filter(s => {
        const project = projects.find(p => p.id === parseInt(selectedProject));
        return project?.shootingIds?.includes(s.id);
      });

  const [newEquipment, setNewEquipment] = useState('');
  const [newCamera, setNewCamera] = useState('');

  const statusOptions = {
    'planned': { label: 'Planifié', color: 'blue' },
    'in-progress': { label: 'En cours', color: 'yellow' },
    'completed': { label: 'Terminé', color: 'green' },
    'cancelled': { label: 'Annulé', color: 'red' }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      artistId: '',
      projectId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '18:00',
      location: '',
      status: 'planned',
      equipment: [],
      cameras: [],
      crew: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingId) {
      setShootings(shootings.map(s => 
        s.id === editingId ? { ...formData, id: editingId } : s
      ));
    } else {
      setShootings([...shootings, { 
        ...formData, 
        id: Date.now(), 
        createdAt: new Date().toISOString() 
      }]);
    }
    
    resetForm();
  };

  const deleteShooting = (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce tournage ?')) {
      setShootings(shootings.filter(s => s.id !== id));
    }
  };

  const editShooting = (shooting) => {
    setFormData(shooting);
    setEditingId(shooting.id);
    setShowForm(true);
  };

  const addEquipment = () => {
    if (newEquipment.trim()) {
      setFormData({
        ...formData,
        equipment: [...formData.equipment, newEquipment.trim()]
      });
      setNewEquipment('');
    }
  };

  const removeEquipment = (index) => {
    setFormData({
      ...formData,
      equipment: formData.equipment.filter((_, i) => i !== index)
    });
  };

  const addCamera = () => {
    if (newCamera.trim()) {
      setFormData({
        ...formData,
        cameras: [...formData.cameras, newCamera.trim()]
      });
      setNewCamera('');
    }
  };

  const removeCamera = (index) => {
    setFormData({
      ...formData,
      cameras: formData.cameras.filter((_, i) => i !== index)
    });
  };

  const getArtistName = (artistId) => {
    const artist = artists.find(a => a.id === parseInt(artistId));
    return artist ? artist.name : 'Artiste inconnu';
  };

  return (
    <div className="space-y-6">
      {/* Bouton ajouter et filtre */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-blue-400">
            Tournages ({filteredShootings.length})
          </h3>
          {projects.length > 0 && (
            <div className="mt-2">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Annuler' : 'Nouveau Tournage'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-blue-700/30">
          <h4 className="text-lg font-bold text-blue-400 mb-4">
            {editingId ? 'Modifier le tournage' : 'Nouveau tournage'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Titre du tournage *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Ex: Clip 'Nouveau Single'"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Artiste *</label>
              <select
                required
                value={formData.artistId}
                onChange={(e) => setFormData({...formData, artistId: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
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
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Aucun projet</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400 block mb-2">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
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
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Heure début</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Heure fin</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Lieu</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Adresse du tournage"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Équipe (nombre)</label>
              <input
                type="text"
                value={formData.crew}
                onChange={(e) => setFormData({...formData, crew: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Ex: 5 personnes"
              />
            </div>

            {/* Matériel */}
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Matériel</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Trépied, Lumières..."
                />
                <button
                  type="button"
                  onClick={addEquipment}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.equipment.map((item, index) => (
                  <span
                    key={index}
                    className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    <Package size={14} />
                    {item}
                    <button
                      type="button"
                      onClick={() => removeEquipment(index)}
                      className="hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Caméras */}
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Caméras</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCamera}
                  onChange={(e) => setNewCamera(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCamera())}
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Sony A7S III, Canon R5..."
                />
                <button
                  type="button"
                  onClick={addCamera}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.cameras.map((camera, index) => (
                  <span
                    key={index}
                    className="bg-purple-900/30 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    <Camera size={14} />
                    {camera}
                    <button
                      type="button"
                      onClick={() => removeCamera(index)}
                      className="hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Détails, instructions spéciales..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Check size={20} />
              {editingId ? 'Mettre à jour' : 'Créer le tournage'}
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

      {/* Liste des tournages */}
      {filteredShootings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Video size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucun tournage {selectedProject !== 'all' ? 'pour ce projet' : 'planifié'}</p>
          <p className="text-sm">Cliquez sur "Nouveau Tournage" pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredShootings.map(shooting => {
            const status = statusOptions[shooting.status];
            return (
              <div
                key={shooting.id}
                className="bg-gradient-to-br from-gray-800/50 to-slate-800/50 rounded-xl p-6 border border-gray-700 hover:border-blue-600 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-lg mb-2">{shooting.title}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <User size={14} className="text-purple-400" />
                      <span className="text-purple-400 text-sm">{getArtistName(shooting.artistId)}</span>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-${status.color}-900/30 text-${status.color}-400 border border-${status.color}-700/50`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => editShooting(shooting)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteShooting(shooting.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={14} />
                    <span>{new Date(shooting.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock size={14} />
                    <span>{shooting.startTime} - {shooting.endTime}</span>
                  </div>
                  
                  {shooting.location && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin size={14} />
                      <span>{shooting.location}</span>
                    </div>
                  )}

                  {shooting.crew && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <User size={14} />
                      <span>Équipe: {shooting.crew}</span>
                    </div>
                  )}

                  {shooting.cameras.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-xs text-gray-500 mb-2">Caméras:</div>
                      <div className="flex flex-wrap gap-1">
                        {shooting.cameras.map((camera, i) => (
                          <span key={i} className="bg-purple-900/20 text-purple-400 px-2 py-1 rounded text-xs">
                            {camera}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {shooting.equipment.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-2">Matériel:</div>
                      <div className="flex flex-wrap gap-1">
                        {shooting.equipment.map((item, i) => (
                          <span key={i} className="bg-blue-900/20 text-blue-400 px-2 py-1 rounded text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {shooting.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500 italic">
                      {shooting.notes}
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

export default ShootingManager;
