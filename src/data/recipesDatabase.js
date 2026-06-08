export const categories = [
  { id: 'all', name: 'Toutes' },
  { id: 'smoothie', name: 'Smoothies' },
  { id: 'salade', name: 'Salades' },
  { id: 'plat', name: 'Plats' },
  { id: 'soupe', name: 'Soupes' },
  { id: 'snack', name: 'Collations' }
];

export const moods = [
  { id: 'energie', name: 'Énergie', color: 'yellow' },
  { id: 'detox', name: 'Détox', color: 'green' },
  { id: 'confort', name: 'Confort', color: 'orange' },
  { id: 'leger', name: 'Léger', color: 'blue' }
];

export const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export const recipes = [
  {
    id: 'r1',
    name: 'Toast à l\'avocat',
    category: 'snack',
    mood: 'energie',
    dayOfWeek: null,
    difficulty: 'facile',
    prepTime: 10,
    servings: 1,
    isDetox: false,
    isPostWorkout: false,
    tags: ['rapide', 'vegetal'],
    ingredients: ['Pain complet', 'Avocat', 'Épinards'],
    instructions: ['Toaster le pain', 'Écraser l\'avocat', 'Garnir et servir'],
    nutrition: { calories: 350, proteins: 12, carbs: 35, fats: 18, fiber: 8 }
  },
  {
    id: 'r2',
    name: 'Bowl de Quinoa Arc-en-ciel',
    category: 'plat',
    mood: 'energie',
    dayOfWeek: null,
    difficulty: 'normal',
    prepTime: 25,
    servings: 2,
    isDetox: true,
    isPostWorkout: true,
    tags: ['quinoa', 'bowl'],
    ingredients: ['Quinoa', 'Avocat', 'Épinards'],
    instructions: ['Cuire le quinoa', 'Assembler les légumes', 'Assaisonner'],
    nutrition: { calories: 520, proteins: 18, carbs: 65, fats: 22, fiber: 12 }
  },
  {
    id: 'r3',
    name: 'Salade Thai Épicée',
    category: 'salade',
    mood: 'leger',
    dayOfWeek: null,
    difficulty: 'normal',
    prepTime: 20,
    servings: 2,
    isDetox: true,
    isPostWorkout: false,
    tags: ['thai', 'epice'],
    ingredients: ['Épinards', 'Mangue', 'Curry'],
    instructions: ['Préparer la vinaigrette', 'Mélanger', 'Servir frais'],
    nutrition: { calories: 380, proteins: 15, carbs: 35, fats: 22, fiber: 8 }
  },
  {
    id: 'r4',
    name: 'Smoothie Vert Dynamique',
    category: 'smoothie',
    mood: 'detox',
    dayOfWeek: null,
    difficulty: 'facile',
    prepTime: 5,
    servings: 1,
    isDetox: true,
    isPostWorkout: false,
    tags: ['smoothie', 'vert'],
    ingredients: ['Banane', 'Épinards', 'Mangue'],
    instructions: ['Mixer tous les ingrédients', 'Servir immédiatement'],
    nutrition: { calories: 340, proteins: 12, carbs: 45, fats: 14, fiber: 9 }
  },
  {
    id: 'r5',
    name: 'Curry Malais aux Patates Douces',
    category: 'plat',
    mood: 'confort',
    dayOfWeek: null,
    difficulty: 'normal',
    prepTime: 35,
    servings: 3,
    isDetox: false,
    isPostWorkout: false,
    tags: ['curry', 'patate douce'],
    ingredients: ['Patate douce', 'Pois chiches', 'Curry'],
    instructions: ['Rôtir les patates', 'Préparer le curry', 'Mélanger et mijoter'],
    nutrition: { calories: 450, proteins: 12, carbs: 58, fats: 20, fiber: 11 }
  },
  {
    id: 'r6',
    name: 'Dal aux Lentilles Corail',
    category: 'soupe',
    mood: 'confort',
    dayOfWeek: null,
    difficulty: 'facile',
    prepTime: 30,
    servings: 4,
    isDetox: false,
    isPostWorkout: false,
    tags: ['lentilles', 'dal'],
    ingredients: ['Lentilles corail', 'Curry', 'Épinards'],
    instructions: ['Cuire les lentilles', 'Ajouter les épices', 'Mixer partiellement'],
    nutrition: { calories: 380, proteins: 18, carbs: 48, fats: 14, fiber: 12 }
  }
];

export function filterRecipes(opts = {}) {
  let results = [...recipes];
  if (opts.search) {
    const q = opts.search.toLowerCase();
    results = results.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.ingredients.some(i => i.toLowerCase().includes(q))
    );
  }
  if (opts.category && opts.category !== 'all') {
    results = results.filter(r => r.category === opts.category);
  }
  return results;
}
