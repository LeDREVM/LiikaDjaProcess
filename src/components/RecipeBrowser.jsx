import React, { useState, useMemo } from 'react';
import { Filter, Search, X, Plus, Clock, Users, Flame, Heart, ShoppingCart } from 'lucide-react';
import { recipes, filterRecipes, categories, moods, daysOfWeek } from '../data/recipesDatabase';
import { ingredients, ingredientCategories, getIngredientsByCategory } from '../data/ingredientsDatabase';

const RecipeBrowser = ({ onSelectRecipe, onAddToShoppingList }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDetoxOnly, setShowDetoxOnly] = useState(false);
  const [showPostWorkoutOnly, setShowPostWorkoutOnly] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [selectedIngredientCategory, setSelectedIngredientCategory] = useState('all');

  // Filtrer les ingrédients disponibles
  const availableIngredients = useMemo(() => {
    let filtered = getIngredientsByCategory(selectedIngredientCategory);
    
    if (ingredientSearchTerm) {
      const term = ingredientSearchTerm.toLowerCase();
      filtered = filtered.filter(ing => 
        ing.name.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [selectedIngredientCategory, ingredientSearchTerm]);

  // Filtrer les recettes
  const filteredRecipes = useMemo(() => {
    let results = recipes;

    // Filtrer par recherche
    if (searchTerm) {
      results = results.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase())) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrer par ingrédient sélectionné
    if (selectedIngredient) {
      results = results.filter(recipe =>
        recipe.ingredients.some(ing => 
          ing.toLowerCase().includes(selectedIngredient.name.toLowerCase())
        )
      );
    }

    // Filtrer par mood
    if (selectedMood !== 'all') {
      results = results.filter(recipe => recipe.mood === selectedMood);
    }

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      results = results.filter(recipe => recipe.category === selectedCategory);
    }

    // Filtrer par jour
    if (selectedDay !== null) {
      results = results.filter(recipe => recipe.dayOfWeek === selectedDay || recipe.dayOfWeek === null);
    }

    // Filtrer détox
    if (showDetoxOnly) {
      results = results.filter(recipe => recipe.isDetox);
    }

    // Filtrer post-workout
    if (showPostWorkoutOnly) {
      results = results.filter(recipe => recipe.isPostWorkout);
    }

    return results;
  }, [searchTerm, selectedIngredient, selectedMood, selectedCategory, selectedDay, showDetoxOnly, showPostWorkoutOnly]);

  const handleAddToDay = (recipe) => {
    if (onSelectRecipe) {
      onSelectRecipe(recipe);
    }
    setSelectedRecipe(null);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'facile': return 'text-green-400';
      case 'normal': return 'text-yellow-400';
      case 'difficile': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getMoodColor = (mood) => {
    const moodData = moods.find(m => m.id === mood);
    return moodData ? moodData.color : 'gray';
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche */}
      <div className="p-6 border bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border-purple-700/30">
        <h2 className="mb-4 text-3xl font-bold text-transparent bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text">
          🍽️ Bibliothèque de Recettes BODY DREVM
        </h2>
        
        {/* Barre de recherche */}
        <div className="relative mb-4">
          <Search size={20} className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder="Rechercher une recette, un ingrédient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-10 pr-4 text-white border bg-white/5 border-white/20 rounded-xl placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        {/* Bouton Filtres */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 transition-all border rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/50"
        >
          <Filter size={18} />
          <span>Filtres {showFilters ? '▼' : '▶'}</span>
          {(selectedIngredient || selectedMood !== 'all' || selectedCategory !== 'all' || selectedDay !== null || showDetoxOnly || showPostWorkoutOnly) && (
            <span className="px-2 py-1 text-xs text-white bg-purple-600 rounded-full">
              Actifs
            </span>
          )}
        </button>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="p-4 mt-4 space-y-4 border bg-white/5 rounded-xl border-white/10">
            {/* Filtre par Ingrédient */}
            <div>
              <label className="block mb-2 text-sm text-purple-300">Par Ingrédient/Légume 🥬</label>
              
              {/* Ingrédient sélectionné */}
              {selectedIngredient && (
                <div className="flex items-center gap-2 p-3 mb-3 border rounded-lg bg-green-500/20 border-green-500/50">
                  <span className="text-2xl">{selectedIngredient.emoji}</span>
                  <span className="flex-1 font-medium text-green-200">{selectedIngredient.name}</span>
                  <button
                    onClick={() => {
                      setSelectedIngredient(null);
                      setIngredientSearchTerm('');
                    }}
                    className="text-green-300 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* Catégories d'ingrédients */}
              <div className="flex flex-wrap gap-2 mb-3">
                {ingredientCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedIngredientCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${
                      selectedIngredientCategory === cat.id
                        ? 'bg-green-500 text-white scale-105'
                        : 'bg-white/10 hover:bg-white/20 text-purple-200'
                    }`}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>

              {/* Recherche d'ingrédient */}
              <input
                type="text"
                value={ingredientSearchTerm}
                onChange={(e) => setIngredientSearchTerm(e.target.value)}
                placeholder="Rechercher un ingrédient..."
                className="w-full px-3 py-2 mb-3 text-white border rounded-lg bg-white/5 border-white/20 placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />

              {/* Grille d'ingrédients */}
              <div className="grid grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-6 max-h-48">
                {availableIngredients.map(ing => (
                  <button
                    key={ing.id}
                    onClick={() => setSelectedIngredient(ing)}
                    className={`p-2 rounded-lg text-center transition-all ${
                      selectedIngredient?.id === ing.id
                        ? 'bg-green-500 text-white scale-105'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                    title={ing.name}
                  >
                    <span className="block mb-1 text-2xl">{ing.emoji}</span>
                    <span className="block text-xs text-purple-200 truncate">{ing.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filtres Mood */}
            <div>
              <label className="block mb-2 text-sm text-purple-300">Par Humeur</label>
              <div className="flex flex-wrap gap-2">
                {moods.map(mood => (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedMood === mood.id
                        ? `bg-${mood.color}-500 text-white scale-105`
                        : 'bg-white/10 hover:bg-white/20 text-purple-200'
                    }`}
                  >
                    {mood.emoji} {mood.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtres Catégorie */}
            <div>
              <label className="block mb-2 text-sm text-purple-300">Par Type</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-pink-500 text-white scale-105'
                        : 'bg-white/10 hover:bg-white/20 text-purple-200'
                    }`}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtres Jour */}
            <div>
              <label className="block mb-2 text-sm text-purple-300">Par Jour de la Semaine</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedDay(null)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedDay === null
                      ? 'bg-indigo-500 text-white scale-105'
                      : 'bg-white/10 hover:bg-white/20 text-purple-200'
                  }`}
                >
                  Tous les jours
                </button>
                {daysOfWeek.map(day => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedDay === day.id
                        ? 'bg-indigo-500 text-white scale-105'
                        : 'bg-white/10 hover:bg-white/20 text-purple-200'
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtres Spéciaux */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowDetoxOnly(!showDetoxOnly)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  showDetoxOnly
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-purple-200'
                }`}
              >
                🌿 Détox uniquement
              </button>
              <button
                onClick={() => setShowPostWorkoutOnly(!showPostWorkoutOnly)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  showPostWorkoutOnly
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-purple-200'
                }`}
              >
                💪 Post-workout
              </button>
            </div>
          </div>
        )}

        {/* Résultats */}
        <div className="mt-4 text-sm text-purple-300/80">
          {filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''} trouvée{filteredRecipes.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Grille des recettes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRecipes.map(recipe => (
          <div
            key={recipe.id}
            className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-5 border border-white/20 hover:border-purple-500/50 transition-all hover:scale-[1.02] cursor-pointer"
            onClick={() => setSelectedRecipe(recipe)}
          >
            {/* En-tête */}
            <div className="mb-3">
              <div className="flex items-start justify-between mb-2">
                <h3 className="flex-1 text-lg font-bold text-purple-100">{recipe.name}</h3>
                {onSelectRecipe && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToDay(recipe);
                    }}
                    className="p-2 ml-2 text-white transition-all bg-green-600 rounded-lg hover:bg-green-700"
                    title="Ajouter à ma journée"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {recipe.mood && (
                  <span className={`bg-${getMoodColor(recipe.mood)}-500/20 text-${getMoodColor(recipe.mood)}-200 px-2 py-1 rounded-full text-xs`}>
                    {moods.find(m => m.id === recipe.mood)?.emoji} {recipe.mood}
                  </span>
                )}
                <span className="px-2 py-1 text-xs text-pink-200 rounded-full bg-pink-500/20">
                  {categories.find(c => c.id === recipe.category)?.emoji} {recipe.category}
                </span>
                {recipe.isDetox && (
                  <span className="px-2 py-1 text-xs text-green-200 rounded-full bg-green-500/20">
                    🌿 Détox
                  </span>
                )}
                {recipe.isPostWorkout && (
                  <span className="px-2 py-1 text-xs text-orange-200 rounded-full bg-orange-500/20">
                    💪 Post-sport
                  </span>
                )}
              </div>
            </div>

            {/* Infos rapides */}
            <div className="flex items-center gap-4 mb-3 text-xs text-purple-300/80">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{recipe.time} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>{recipe.servings} {recipe.servings > 1 ? 'pers.' : 'pers.'}</span>
              </div>
              <div className={`flex items-center gap-1 ${getDifficultyColor(recipe.difficulty)}`}>
                <span className="capitalize">{recipe.difficulty}</span>
              </div>
            </div>

            {/* Nutrition */}
            <div className="p-3 mb-3 rounded-lg bg-white/5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Calories:</span>
                  <span className="ml-1 font-semibold text-yellow-200">{recipe.nutrition.calories} kcal</span>
                </div>
                <div>
                  <span className="text-gray-400">Protéines:</span>
                  <span className="ml-1 font-semibold text-blue-200">{recipe.nutrition.proteins}g</span>
                </div>
                <div>
                  <span className="text-gray-400">Glucides:</span>
                  <span className="ml-1 font-semibold text-green-200">{recipe.nutrition.carbs}g</span>
                </div>
                <div>
                  <span className="text-gray-400">Lipides:</span>
                  <span className="ml-1 font-semibold text-orange-200">{recipe.nutrition.fats}g</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded text-xs">
                  {tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="text-xs text-purple-400">+{recipe.tags.length - 3}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <>
        {filteredRecipes.length === 0 && (
        <div className="py-12 text-center text-purple-300/60">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune recette trouvée avec ces critères</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedIngredient(null);
              setIngredientSearchTerm('');
              setSelectedIngredientCategory('all');
              setSelectedMood('all');
              setSelectedCategory('all');
              setSelectedDay(null);
              setShowDetoxOnly(false);
              setShowPostWorkoutOnly(false);
            }}
            className="px-6 py-2 mt-4 transition-all rounded-lg bg-purple-500/20 hover:bg-purple-500/30"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Modal de détails de recette */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedRecipe(null)}>
          <div 
            className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête du modal */}
            <div className="sticky top-0 p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 text-2xl font-bold text-white">{selectedRecipe.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.mood && (
                      <span className="px-3 py-1 text-sm text-white rounded-full bg-white/20">
                        {moods.find(m => m.id === selectedRecipe.mood)?.emoji} {selectedRecipe.mood}
                      </span>
                    )}
                    <span className="px-3 py-1 text-sm text-white rounded-full bg-white/20">
                      {categories.find(c => c.id === selectedRecipe.category)?.emoji} {selectedRecipe.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="p-2 text-white transition-all rounded-lg bg-white/20 hover:bg-white/30"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Infos pratiques */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 text-center rounded-lg bg-white/5">
                  <Clock size={20} className="mx-auto mb-1 text-purple-300" />
                  <div className="text-sm text-gray-400">Temps</div>
                  <div className="font-bold text-white">{selectedRecipe.time} min</div>
                </div>
                <div className="p-3 text-center rounded-lg bg-white/5">
                  <Users size={20} className="mx-auto mb-1 text-purple-300" />
                  <div className="text-sm text-gray-400">Portions</div>
                  <div className="font-bold text-white">{selectedRecipe.servings}</div>
                </div>
                <div className="p-3 text-center rounded-lg bg-white/5">
                  <Flame size={20} className="mx-auto mb-1 text-purple-300" />
                  <div className="text-sm text-gray-400">Difficulté</div>
                  <div className={`font-bold capitalize ${getDifficultyColor(selectedRecipe.difficulty)}`}>
                    {selectedRecipe.difficulty}
                  </div>
                </div>
              </div>

              {/* Nutrition */}
              <div className="p-4 border bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border-yellow-500/20">
                <h4 className="flex items-center gap-2 mb-3 font-semibold text-yellow-200">
                  <Flame size={20} />
                  Apports Nutritionnels (par portion)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-sm text-gray-400">Calories</span>
                    <p className="text-lg font-bold text-yellow-200">{selectedRecipe.nutrition.calories} kcal</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-sm text-gray-400">Protéines</span>
                    <p className="text-lg font-bold text-blue-200">{selectedRecipe.nutrition.proteins}g</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-sm text-gray-400">Glucides</span>
                    <p className="text-lg font-bold text-green-200">{selectedRecipe.nutrition.carbs}g</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-sm text-gray-400">Lipides</span>
                    <p className="text-lg font-bold text-orange-200">{selectedRecipe.nutrition.fats}g</p>
                  </div>
                </div>
              </div>

              {/* Ingrédients */}
              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="mb-3 font-semibold text-green-300">🥬 Ingrédients</h4>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-purple-200/90">
                      <span className="mt-1 text-green-400">✓</span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="mb-3 font-semibold text-blue-300">👨‍🍳 Préparation</h4>
                <ol className="space-y-2">
                  {selectedRecipe.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-purple-200/90">
                      <span className="bg-blue-500/30 text-blue-200 font-bold min-w-[24px] h-[24px] rounded-full flex items-center justify-center text-sm flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Bienfaits */}
              {selectedRecipe.benefits && (
                <div className="p-4 border bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-xl border-pink-500/20">
                  <h4 className="flex items-center gap-2 mb-2 font-semibold text-pink-200">
                    <Heart size={20} />
                    Bienfaits
                  </h4>
                  <p className="italic text-purple-200/90">{selectedRecipe.benefits}</p>
                </div>
              )}

              {/* Tags complets */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-purple-300">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRecipe.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 text-xs text-purple-300 rounded-full bg-purple-600/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                {onSelectRecipe && (
                  <button
                    onClick={() => handleAddToDay(selectedRecipe)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-white transition-all bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl"
                  >
                    <Plus size={20} />
                    Ma journée
                  </button>
                )}
                {onAddToShoppingList && (
                  <button
                    onClick={() => {
                      onAddToShoppingList(selectedRecipe.ingredients);
                      setSelectedRecipe(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-white transition-all bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 rounded-xl"
                  >
                    <ShoppingCart size={20} />
                    Courses
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    </div>
  );
};

export default RecipeBrowser;
