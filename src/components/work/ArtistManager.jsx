import React, { useState, useEffect } from 'react';
import { Users, Video, DollarSign, FileText, UserPlus, Camera, Package, Utensils, Car, Download, Folder } from 'lucide-react';
import ArtistList from './artist/ArtistList';
import ShootingManager from './artist/ShootingManager';
import BudgetManager from './artist/BudgetManager';
import PartnershipManager from './artist/PartnershipManager';
import ContractManager from './artist/ContractManager';
import ProjectManager from './artist/ProjectManager';

const ArtistManager = () => {
  const [activeSection, setActiveSection] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [artists, setArtists] = useState([]);
  const [shootings, setShootings] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [partnerships, setPartnerships] = useState([]);
  const [contracts, setContracts] = useState([]);

  // Charger les données
  useEffect(() => {
    const loadedProjects = localStorage.getItem('neguslunar-projects');
    const loadedArtists = localStorage.getItem('neguslunar-artists');
    const loadedShootings = localStorage.getItem('neguslunar-shootings');
    const loadedBudgets = localStorage.getItem('neguslunar-budgets');
    const loadedPartnerships = localStorage.getItem('neguslunar-partnerships');
    const loadedContracts = localStorage.getItem('neguslunar-contracts');

    if (loadedProjects) setProjects(JSON.parse(loadedProjects));
    if (loadedArtists) setArtists(JSON.parse(loadedArtists));
    if (loadedShootings) setShootings(JSON.parse(loadedShootings));
    if (loadedBudgets) setBudgets(JSON.parse(loadedBudgets));
    if (loadedPartnerships) setPartnerships(JSON.parse(loadedPartnerships));
    if (loadedContracts) setContracts(JSON.parse(loadedContracts));
  }, []);

  // Sauvegarder les données
  useEffect(() => {
    localStorage.setItem('neguslunar-projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('neguslunar-artists', JSON.stringify(artists));
  }, [artists]);

  useEffect(() => {
    localStorage.setItem('neguslunar-shootings', JSON.stringify(shootings));
  }, [shootings]);

  useEffect(() => {
    localStorage.setItem('neguslunar-budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('neguslunar-partnerships', JSON.stringify(partnerships));
  }, [partnerships]);

  useEffect(() => {
    localStorage.setItem('neguslunar-contracts', JSON.stringify(contracts));
  }, [contracts]);

  const sections = [
    { id: 'projects', name: 'Projets', icon: Folder, color: 'purple' },
    { id: 'artists', name: 'Artistes', icon: Users, color: 'pink' },
    { id: 'shootings', name: 'Tournages', icon: Video, color: 'blue' },
    { id: 'budget', name: 'Budgets', icon: DollarSign, color: 'green' },
    { id: 'partnerships', name: 'Partenariats', icon: UserPlus, color: 'amber' },
    { id: 'contracts', name: 'Contrats', icon: FileText, color: 'red' }
  ];

  // Statistiques globales
  const stats = {
    totalArtists: artists.length,
    activeShootings: shootings.filter(s => s.status === 'in-progress').length,
    totalBudget: budgets.reduce((acc, b) => acc + b.total, 0),
    activePartnerships: partnerships.filter(p => p.status === 'active').length
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-400 mb-2">
          🎬 Gestion Directeur Artistique
        </h2>
        <p className="text-gray-400 text-sm">
          Gérez vos artistes, tournages, budgets et partenariats
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-4 border border-purple-700/30">
          <div className="flex items-center gap-3">
            <Users className="text-purple-400" size={32} />
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalArtists}</div>
              <div className="text-xs text-gray-400">Artistes</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl p-4 border border-blue-700/30">
          <div className="flex items-center gap-3">
            <Video className="text-blue-400" size={32} />
            <div>
              <div className="text-2xl font-bold text-white">{stats.activeShootings}</div>
              <div className="text-xs text-gray-400">Tournages actifs</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-4 border border-green-700/30">
          <div className="flex items-center gap-3">
            <DollarSign className="text-green-400" size={32} />
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalBudget.toLocaleString()}€</div>
              <div className="text-xs text-gray-400">Budget total</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-xl p-4 border border-amber-700/30">
          <div className="flex items-center gap-3">
            <UserPlus className="text-amber-400" size={32} />
            <div>
              <div className="text-2xl font-bold text-white">{stats.activePartnerships}</div>
              <div className="text-xs text-gray-400">Partenariats</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation des sections */}
      <div className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 rounded-xl p-2 border border-gray-700">
        <div className="flex flex-wrap gap-2">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  activeSection === section.id
                    ? `bg-${section.color}-600 text-white shadow-lg`
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                <Icon size={20} />
                <span className="font-semibold">{section.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu des sections */}
      <div className="animate-fadeIn">
        {activeSection === 'projects' && (
          <ProjectManager
            projects={projects}
            setProjects={setProjects}
            artists={artists}
            shootings={shootings}
            budgets={budgets}
            partnerships={partnerships}
            contracts={contracts}
          />
        )}

        {activeSection === 'artists' && (
          <ArtistList 
            artists={artists}
            setArtists={setArtists}
            projects={projects}
          />
        )}

        {activeSection === 'shootings' && (
          <ShootingManager
            shootings={shootings}
            setShootings={setShootings}
            artists={artists}
            projects={projects}
          />
        )}

        {activeSection === 'budget' && (
          <BudgetManager
            budgets={budgets}
            setBudgets={setBudgets}
            shootings={shootings}
            projects={projects}
          />
        )}

        {activeSection === 'partnerships' && (
          <PartnershipManager
            partnerships={partnerships}
            setPartnerships={setPartnerships}
            projects={projects}
          />
        )}

        {activeSection === 'contracts' && (
          <ContractManager
            contracts={contracts}
            setContracts={setContracts}
            artists={artists}
            projects={projects}
          />
        )}
      </div>
    </div>
  );
};

export default ArtistManager;
