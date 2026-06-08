import React, { useState, useCallback } from 'react';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import DailyTracker from './components/DailyTracker';
import BarcodeScanner from './components/BarcodeScanner';
import MealPlanner from './components/MealPlanner';
import ShoppingList from './components/ShoppingList';
import IntermittentFasting from './components/IntermittentFasting';
import SportPerformance from './components/SportPerformance';

const TABS = [
  { id: 'tracker', label: 'Journal', icon: '📅' },
  { id: 'scanner', label: 'Scanner', icon: '📷' },
  { id: 'planner', label: 'Objectifs', icon: '🎯' },
  { id: 'shopping', label: 'Courses', icon: '🛒' },
  { id: 'fasting', label: 'Jeûne', icon: '⏱️' },
  { id: 'sport', label: 'Sport', icon: '💪' }
];

function NutritionApp() {
  const { profiles, activeProfileId, setActiveProfileId, activeProfile } = useProfile();
  const [tab, setTab] = useState('tracker');
  const [pendingMeal, setPendingMeal] = useState(null);
  const [pendingIngredients, setPendingIngredients] = useState(null);

  const handleAddToTracker = useCallback((meal) => {
    setPendingMeal(meal);
    setTab('tracker');
  }, []);

  const handleAddToShoppingList = useCallback((items) => {
    const list = Array.isArray(items) ? items : [items];
    setPendingIngredients(list);
    setTab('shopping');
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-lg font-bold text-amber-400">Lanmou Douvan — Nutrition</h1>
              <p className="text-xs text-gray-500">Suivi alimentaire · {activeProfile.emoji} {activeProfile.name}</p>
            </div>
            <div className="flex gap-1">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActiveProfileId(p.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeProfileId === p.id
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-600/50'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          </div>
          <nav className="flex gap-1 mt-3 overflow-x-auto pb-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 px-3 py-2 rounded-lg text-sm transition-colors ${
                  tab === t.id
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-600/40'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'tracker' && (
          <DailyTracker
            pendingMeal={pendingMeal}
            onPendingMealConsumed={() => setPendingMeal(null)}
            onAddToShoppingList={handleAddToShoppingList}
          />
        )}
        {tab === 'scanner' && (
          <BarcodeScanner
            onAddToTracker={handleAddToTracker}
            onAddToShoppingList={handleAddToShoppingList}
          />
        )}
        {tab === 'planner' && (
          <MealPlanner onAddToShoppingList={handleAddToShoppingList} />
        )}
        {tab === 'shopping' && (
          <ShoppingList
            pendingIngredients={pendingIngredients}
            onPendingIngredientsConsumed={() => setPendingIngredients(null)}
          />
        )}
        {tab === 'fasting' && <IntermittentFasting />}
        {tab === 'sport' && <SportPerformance />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ProfileProvider>
      <NutritionApp />
    </ProfileProvider>
  );
}
