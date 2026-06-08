import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, TrendingUp, Activity, Utensils, Calendar, BookOpen, Zap } from 'lucide-react';
import { useDailyMeals, useDailyExercises } from '../hooks/useDatabase';
import { getByIndex, STORES } from '../utils/database';
import RecipeBrowser from './RecipeBrowser';
import { useProfile } from '../context/ProfileContext';

const DailyTracker = ({ pendingMeal, onPendingMealConsumed, onAddToShoppingList }) => {
  const { activeProfileId, getGoals } = useProfile();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [showMealForm, setShowMealForm] = useState(false);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [showRecipeBrowser, setShowRecipeBrowser] = useState(false);
  
  // Hooks pour IndexedDB
  const { data: allMeals, addItem: addMealDB, removeItem: removeMealDB } = useDailyMeals();
  const { data: allExercises, addItem: addExerciseDB, removeItem: removeExerciseDB } = useDailyExercises();
  
  // Formulaire repas
  const [mealForm, setMealForm] = useState({
    type: 'breakfast', // breakfast, lunch, dinner, snack
    name: '',
    calories: 0,
    proteins: 0,
    carbs: 0,
    fats: 0,
    fiber: 0
  });

  // Formulaire exercice
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    sets: 0,
    reps: 0,
    duration: 0, // en minutes
    caloriesBurned: 0
  });

  // Recettes prédéfinies populaires
  const popularMeals = [
    {
      name: 'Toast à l\'avocat',
      calories: 350,
      proteins: 12,
      carbs: 35,
      fats: 18,
      fiber: 8,
      type: 'breakfast'
    },
    {
      name: 'Bowl de Quinoa Arc-en-ciel',
      calories: 520,
      proteins: 18,
      carbs: 65,
      fats: 22,
      fiber: 12,
      type: 'lunch'
    },
    {
      name: 'Salade Thai Épicée',
      calories: 380,
      proteins: 15,
      carbs: 35,
      fats: 22,
      fiber: 8,
      type: 'lunch'
    },
    {
      name: 'Smoothie Vert Dynamique',
      calories: 340,
      proteins: 12,
      carbs: 45,
      fats: 14,
      fiber: 9,
      type: 'breakfast'
    },
    {
      name: 'Curry Malais aux Patates Douces',
      calories: 450,
      proteins: 12,
      carbs: 58,
      fats: 20,
      fiber: 11,
      type: 'dinner'
    },
    {
      name: 'Dal aux Lentilles Corail',
      calories: 380,
      proteins: 18,
      carbs: 48,
      fats: 14,
      fiber: 12,
      type: 'dinner'
    },
    {
      name: 'Yaourt Grec + Fruits',
      calories: 200,
      proteins: 15,
      carbs: 25,
      fats: 5,
      fiber: 3,
      type: 'snack'
    },
    {
      name: 'Amandes (30g)',
      calories: 170,
      proteins: 6,
      carbs: 6,
      fats: 15,
      fiber: 3,
      type: 'snack'
    }
  ];

  // Exercices prédéfinis populaires
  const popularExercises = [
    { name: 'Pompes', caloriesPerRep: 0.5 },
    { name: 'Crunch', caloriesPerRep: 0.3 },
    { name: 'Squats', caloriesPerRep: 0.4 },
    { name: 'Burpees', caloriesPerRep: 1.0 },
    { name: 'Planche', caloriesPerMinute: 5 },
    { name: 'Course', caloriesPerMinute: 10 },
    { name: 'Vélo', caloriesPerMinute: 8 },
    { name: 'Yoga', caloriesPerMinute: 4 },
    { name: 'Natation', caloriesPerMinute: 12 },
    { name: 'Marche', caloriesPerMinute: 4 }
  ];

  // Charger les données pour la date sélectionnée depuis IndexedDB (filtrées par profil)
  useEffect(() => {
    const loadDayData = async () => {
      const dayMeals = await getByIndex(STORES.DAILY_MEALS, 'date', selectedDate);
      const dayExercises = await getByIndex(STORES.DAILY_EXERCISES, 'date', selectedDate);
      // Filtrer par profil actif
      setMeals(dayMeals.filter(m => !m.profileId || m.profileId === activeProfileId));
      setExercises(dayExercises.filter(e => !e.profileId || e.profileId === activeProfileId));
    };
    loadDayData();
  }, [selectedDate, allMeals, allExercises, activeProfileId]);

  // Auto-ajouter un repas venant du Scanner de codes-barres
  useEffect(() => {
    if (!pendingMeal) return;
    const mealWithMeta = {
      ...pendingMeal,
      id: Date.now(),
      date: selectedDate,
      profileId: activeProfileId,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      source: 'scanner'
    };
    addMealDB(mealWithMeta).then(() => {
      if (onPendingMealConsumed) onPendingMealConsumed();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMeal]);

  // Ajouter un repas depuis une recette
  const addMealFromRecipe = async (recipe) => {
    const mealFromRecipe = {
      id: Date.now(),
      date: selectedDate,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type: recipe.category === 'smoothie' ? 'breakfast' : 
            recipe.category === 'salade' || recipe.category === 'plat' ? 'lunch' :
            recipe.category === 'soupe' ? 'dinner' : 'snack',
      name: recipe.name,
      calories: recipe.nutrition.calories,
      proteins: recipe.nutrition.proteins,
      carbs: recipe.nutrition.carbs,
      fats: recipe.nutrition.fats,
      fiber: recipe.nutrition.fiber,
      source: 'recipe',
      recipeId: recipe.id
    };
    
    await addMealDB(mealFromRecipe);
    setShowRecipeBrowser(false);
  };

  // Ajouter un repas manuel
  const addMeal = async (meal = null) => {
    const newMeal = meal || {
      ...mealForm,
      id: Date.now(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    
    const mealWithDate = {
      ...newMeal,
      id: Date.now(),
      date: selectedDate,
      profileId: activeProfileId
    };
    
    await addMealDB(mealWithDate);
    
    setMealForm({
      type: 'breakfast',
      name: '',
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0,
      fiber: 0
    });
    setShowMealForm(false);
  };

  // Ajouter un exercice
  const addExercise = async () => {
    const newExercise = {
      ...exerciseForm,
      id: Date.now(),
      date: selectedDate,
      profileId: activeProfileId,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    
    await addExerciseDB(newExercise);
    
    setExerciseForm({
      name: '',
      sets: 0,
      reps: 0,
      duration: 0,
      caloriesBurned: 0
    });
    setShowExerciseForm(false);
  };

  // Calculer les totaux nutritionnels
  const nutritionTotals = meals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    proteins: acc.proteins + (meal.proteins || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fats: acc.fats + (meal.fats || 0),
    fiber: acc.fiber + (meal.fiber || 0)
  }), { calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0 });

  // Calculer les calories brûlées
  const totalCaloriesBurned = exercises.reduce((acc, ex) => acc + (ex.caloriesBurned || 0), 0);

  // Balance calorique
  const calorieBalance = nutritionTotals.calories - totalCaloriesBurned;

  // Objectifs journaliers depuis MealPlanner (via ProfileContext)
  const profileGoals = getGoals();
  const dailyGoals = {
    calories: profileGoals.dailyCalories,
    proteins: profileGoals.dailyProteins,
    carbs:    profileGoals.dailyCarbs,
    fats:     profileGoals.dailyFats,
    fiber:    30
  };

  const mealTypeLabels = {
    breakfast: '🌅 Petit-déjeuner',
    lunch: '☀️ Déjeuner',
    dinner: '🌙 Dîner',
    snack: '🍎 Collation'
  };

  return (
    <div className="space-y-6">
      {/* Notification repas scanné en attente */}
      {pendingMeal && (
        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/50 rounded-xl p-4 flex items-center gap-3">
          <Zap size={20} className="text-green-400 shrink-0" />
          <div className="flex-1">
            <p className="text-green-300 font-semibold text-sm">Repas scanné ajouté au journal !</p>
            <p className="text-green-400/80 text-xs">{pendingMeal.name} — {pendingMeal.calories} kcal</p>
          </div>
        </div>
      )}

      {/* En-tête avec sélection de date */}
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-700/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-purple-100 flex items-center gap-2">
            <Calendar size={28} />
            Dashboard Journalier
          </h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Statistiques du jour */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{nutritionTotals.calories}</div>
            <div className="text-sm text-gray-400">Calories consommées</div>
            <div className="text-xs text-gray-500 mt-1">/ {dailyGoals.calories} kcal</div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{totalCaloriesBurned}</div>
            <div className="text-sm text-gray-400">Calories brûlées</div>
            <div className="text-xs text-gray-500 mt-1">Sport</div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold ${calorieBalance > 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              {calorieBalance > 0 ? '+' : ''}{calorieBalance}
            </div>
            <div className="text-sm text-gray-400">Balance</div>
            <div className="text-xs text-gray-500 mt-1">Nette</div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{meals.length + exercises.length}</div>
            <div className="text-sm text-gray-400">Entrées</div>
            <div className="text-xs text-gray-500 mt-1">{meals.length} repas • {exercises.length} exercices</div>
          </div>
        </div>
      </div>

      {/* Apports nutritionnels détaillés */}
      <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-blue-700/30">
        <h3 className="text-xl font-bold text-blue-100 mb-4 flex items-center gap-2">
          <TrendingUp size={24} />
          Apports Nutritionnels
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(nutritionTotals).map(([key, value]) => {
            const goal = dailyGoals[key];
            const percentage = goal ? Math.round((value / goal) * 100) : 0;
            const labels = {
              calories: 'Calories',
              proteins: 'Protéines',
              carbs: 'Glucides',
              fats: 'Lipides',
              fiber: 'Fibres'
            };
            const units = {
              calories: 'kcal',
              proteins: 'g',
              carbs: 'g',
              fats: 'g',
              fiber: 'g'
            };
            
            return (
              <div key={key} className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">{labels[key]}</div>
                <div className="text-2xl font-bold text-blue-200 mb-2">
                  {Math.round(value)}{units[key]}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                  <div
                    className={`h-2 rounded-full ${percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {percentage}% de {goal}{units[key]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Section Repas */}
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-700/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-green-100 flex items-center gap-2">
              <Utensils size={24} />
              Repas du Jour
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRecipeBrowser(!showRecipeBrowser)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                title="Parcourir les recettes"
              >
                <BookOpen size={18} />
                <span className="hidden sm:inline">Recettes</span>
              </button>
              <button
                onClick={() => setShowMealForm(!showMealForm)}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
              >
                {showMealForm ? <X size={20} /> : <Plus size={20} />}
              </button>
            </div>
          </div>

          {/* Navigateur de recettes */}
          {showRecipeBrowser && (
            <div className="mb-4">
              <RecipeBrowser onSelectRecipe={addMealFromRecipe} onAddToShoppingList={onAddToShoppingList} />
            </div>
          )}

          {/* Formulaire d'ajout de repas */}
          {showMealForm && (
            <div className="bg-white/5 rounded-lg p-4 mb-4 space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Repas rapide</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {popularMeals.map((meal, idx) => (
                    <button
                      key={idx}
                      onClick={() => addMeal({ ...meal, type: meal.type })}
                      className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg p-2 text-left text-sm text-green-200 transition-all"
                    >
                      <div className="font-semibold">{meal.name}</div>
                      <div className="text-xs text-gray-400">{meal.calories} kcal</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Ou créer un repas personnalisé</label>
                <select
                  value={mealForm.type}
                  onChange={(e) => setMealForm({ ...mealForm, type: e.target.value })}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white mb-2"
                >
                  {Object.entries(mealTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Nom du repas"
                value={mealForm.name}
                onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Calories"
                  value={mealForm.calories || ''}
                  onChange={(e) => setMealForm({ ...mealForm, calories: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Protéines (g)"
                  value={mealForm.proteins || ''}
                  onChange={(e) => setMealForm({ ...mealForm, proteins: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Glucides (g)"
                  value={mealForm.carbs || ''}
                  onChange={(e) => setMealForm({ ...mealForm, carbs: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Lipides (g)"
                  value={mealForm.fats || ''}
                  onChange={(e) => setMealForm({ ...mealForm, fats: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <button
                onClick={() => addMeal()}
                disabled={!mealForm.name}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg transition-colors"
              >
                Ajouter le repas
              </button>
            </div>
          )}

          {/* Liste des repas */}
          <div className="space-y-2">
            {meals.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Utensils size={48} className="mx-auto mb-2 opacity-50" />
                <p>Aucun repas ajouté aujourd'hui</p>
              </div>
            ) : (
              meals.map((meal) => (
                <div key={meal.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs bg-green-600/30 text-green-200 px-2 py-1 rounded">
                          {mealTypeLabels[meal.type]}
                        </span>
                        {meal.source === 'scanner' && (
                          <span className="text-xs bg-amber-600/30 text-amber-200 px-2 py-1 rounded">
                            📷 Scanner
                          </span>
                        )}
                        {meal.source === 'recipe' && (
                          <span className="text-xs bg-purple-600/30 text-purple-200 px-2 py-1 rounded">
                            📖 Recette
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{meal.time}</span>
                      </div>
                      <div className="font-semibold text-white mb-1">{meal.name}</div>
                      <div className="text-xs text-gray-400 flex flex-wrap gap-2">
                        <span>🔥 {meal.calories} kcal</span>
                        <span>💪 {meal.proteins}g protéines</span>
                        <span>🍞 {meal.carbs}g glucides</span>
                        <span>🥑 {meal.fats}g lipides</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeMealDB(meal.id)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section Exercices */}
        <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-xl p-6 border border-orange-700/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-orange-100 flex items-center gap-2">
              <Activity size={24} />
              Exercices du Jour
            </h3>
            <button
              onClick={() => setShowExerciseForm(!showExerciseForm)}
              className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition-colors"
            >
              {showExerciseForm ? <X size={20} /> : <Plus size={20} />}
            </button>
          </div>

          {/* Formulaire d'ajout d'exercice */}
          {showExerciseForm && (
            <div className="bg-white/5 rounded-lg p-4 mb-4 space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Exercice rapide</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {popularExercises.slice(0, 6).map((ex, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setExerciseForm({
                          name: ex.name,
                          sets: ex.name === 'Pompes' || ex.name === 'Crunch' ? 3 : 1,
                          reps: ex.name === 'Pompes' ? 5 : ex.name === 'Crunch' ? 50 : 0,
                          duration: ex.caloriesPerMinute ? 30 : 0,
                          caloriesBurned: ex.caloriesPerRep 
                            ? (ex.name === 'Pompes' ? 3 * 5 * 0.5 : 50 * 0.3)
                            : (ex.caloriesPerMinute ? 30 * ex.caloriesPerMinute : 0)
                        });
                      }}
                      className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg p-2 text-left text-sm text-orange-200 transition-all"
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                placeholder="Nom de l'exercice"
                value={exerciseForm.name}
                onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Séries"
                  value={exerciseForm.sets || ''}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, sets: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Répétitions"
                  value={exerciseForm.reps || ''}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, reps: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Durée (min)"
                  value={exerciseForm.duration || ''}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, duration: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Calories brûlées"
                  value={exerciseForm.caloriesBurned || ''}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, caloriesBurned: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <button
                onClick={addExercise}
                disabled={!exerciseForm.name}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-2 rounded-lg transition-colors"
              >
                Ajouter l'exercice
              </button>
            </div>
          )}

          {/* Liste des exercices */}
          <div className="space-y-2">
            {exercises.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Activity size={48} className="mx-auto mb-2 opacity-50" />
                <p>Aucun exercice ajouté aujourd'hui</p>
              </div>
            ) : (
              exercises.map((exercise) => (
                <div key={exercise.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">{exercise.time}</span>
                      </div>
                      <div className="font-semibold text-white mb-1">{exercise.name}</div>
                      <div className="text-xs text-gray-400 flex flex-wrap gap-2">
                        {exercise.sets > 0 && <span>📊 {exercise.sets} x {exercise.reps}</span>}
                        {exercise.duration > 0 && <span>⏱️ {exercise.duration} min</span>}
                        <span>🔥 {exercise.caloriesBurned} kcal</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeExerciseDB(exercise.id)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyTracker;
