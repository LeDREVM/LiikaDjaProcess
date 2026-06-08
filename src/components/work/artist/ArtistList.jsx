import React, { useState } from 'react';
import { Plus, X, Edit2, Check, User, Mail, Phone, MapPin, Music, Instagram, Youtube } from 'lucide-react';

const ArtistList = ({ artists, setArtists, projects = [] }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProject, setSelectedProject] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    genre: '',
    email: '',
    phone: '',
    location: '',
    instagram: '',
    youtube: '',
    rate: '',
    notes: ''
  });

  // Filtrer les artistes par projet
  const filteredArtists = selectedProject === 'all' 
    ? artists 
    : artists.filter(a => {
        const project = projects.find(p => p.id === parseInt(selectedProject));
        return project?.artistIds?.includes(a.id);
      });

  const resetForm = () => {
    setFormData({
      name: '',
      genre: '',
      email: '',
      phone: '',
      location: '',
      instagram: '',
      youtube: '',
      rate: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingId) {
      // Modifier un artiste existant
      setArtists(artists.map(a => 
        a.id === editingId ? { ...formData, id: editingId } : a
      ));
    } else {
      // Ajouter un nouvel artiste
      setArtists([...artists, { ...formData, id: Date.now(), createdAt: new Date().toISOString() }]);
    }
    
    resetForm();
  };

  const deleteArtist = (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet artiste ?')) {
      setArtists(artists.filter(a => a.id !== id));
    }
  };

  const editArtist = (artist) => {
    setFormData(artist);
    setEditingId(artist.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Bouton ajouter et filtre */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-purple-400">
            Liste des Artistes ({filteredArtists.length})
          </h3>
          {projects.length > 0 && (
            <div className="mt-2">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
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
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Annuler' : 'Nouvel Artiste'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-700/30">
          <h4 className="text-lg font-bold text-purple-400 mb-4">
            {editingId ? 'Modifier l\'artiste' : 'Nouvel artiste'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Nom complet *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="Ex: John Doe"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Genre musical</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({...formData, genre: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="Ex: Rap, R&B, Pop..."
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="artiste@email.com"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="+33 6 XX XX XX XX"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Localisation</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="Ville, Pays"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Tarif journalier (€)</label>
              <input
                type="number"
                value={formData.rate}
                onChange={(e) => setFormData({...formData, rate: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="1000"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Instagram</label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="@username"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">YouTube</label>
              <input
                type="text"
                value={formData.youtube}
                onChange={(e) => setFormData({...formData, youtube: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="@channel"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="Informations complémentaires..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Check size={20} />
              {editingId ? 'Mettre à jour' : 'Ajouter l\'artiste'}
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

      {/* Liste des artistes */}
      {filteredArtists.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <User size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucun artiste {selectedProject !== 'all' ? 'pour ce projet' : 'enregistré'}</p>
          <p className="text-sm">Cliquez sur "Nouvel Artiste" pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArtists.map(artist => (
            <div
              key={artist.id}
              className="bg-gradient-to-br from-gray-800/50 to-slate-800/50 rounded-xl p-6 border border-gray-700 hover:border-purple-600 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center">
                    <User className="text-purple-400" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{artist.name}</h4>
                    {artist.genre && (
                      <p className="text-sm text-purple-400 flex items-center gap-1">
                        <Music size={12} />
                        {artist.genre}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => editArtist(artist)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteArtist(artist.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {artist.email && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail size={14} />
                    <span className="truncate">{artist.email}</span>
                  </div>
                )}
                
                {artist.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone size={14} />
                    <span>{artist.phone}</span>
                  </div>
                )}
                
                {artist.location && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin size={14} />
                    <span>{artist.location}</span>
                  </div>
                )}

                {artist.rate && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="text-green-400 font-semibold">
                      {parseFloat(artist.rate).toLocaleString()}€/jour
                    </div>
                  </div>
                )}

                {(artist.instagram || artist.youtube) && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
                    {artist.instagram && (
                      <a
                        href={`https://instagram.com/${artist.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        <Instagram size={18} />
                      </a>
                    )}
                    {artist.youtube && (
                      <a
                        href={`https://youtube.com/${artist.youtube.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Youtube size={18} />
                      </a>
                    )}
                  </div>
                )}

                {artist.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500 italic">
                    {artist.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArtistList;
