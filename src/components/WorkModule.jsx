import React, { useState } from 'react';
import { Briefcase, Calculator, TrendingUp, Users, X } from 'lucide-react';
import WorkCalculator from './work/WorkCalculator';
import TradingDashboard from './work/TradingDashboard';
import ArtistManager from './work/ArtistManager';

const WorkModule = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('calculator');

  const tabs = [
    { id: 'calculator', name: 'Heures', icon: Calculator, color: 'blue' },
    { id: 'trading', name: 'Trading', icon: TrendingUp, color: 'green' },
    { id: 'artist', name: 'Direction Artistique', icon: Users, color: 'purple' }
  ];

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        {/* En-tête */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Briefcase className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  💼 Module Professionnel
                </h1>
                <p className="text-gray-400 text-sm">
                  Gestion complète de votre activité professionnelle
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-colors"
              title="Retour mode Chill"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation des onglets */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 rounded-xl p-2 border border-gray-700">
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all flex-1 md:flex-initial ${
                      activeTab === tab.id
                        ? `bg-${tab.color}-600 text-white shadow-lg scale-105`
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-semibold">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900/30 to-slate-900/30 rounded-xl p-6 md:p-8 border border-gray-700/50">
            {activeTab === 'calculator' && <WorkCalculator />}
            {activeTab === 'trading' && <TradingDashboard />}
            {activeTab === 'artist' && <ArtistManager />}
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto mt-8 text-center">
          <p className="text-gray-500 text-sm">
            💼 Mode Professionnel • NegusLunar Work
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkModule;
