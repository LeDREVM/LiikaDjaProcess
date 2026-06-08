export const ingredientCategories = [
  { id: 'all', name: 'Tous', emoji: '🛒' },
  { id: 'fruits', name: 'Fruits', emoji: '🍎' },
  { id: 'legumes', name: 'Légumes', emoji: '🥬' },
  { id: 'cereales', name: 'Céréales', emoji: '🌾' },
  { id: 'proteines', name: 'Protéines', emoji: '🫘' },
  { id: 'epices', name: 'Épices', emoji: '🌶️' },
  { id: 'recipe', name: 'Recette', emoji: '🍽️' }
];

export const ingredients = [
  { name: 'Avocat', category: 'fruits', emoji: '🥑' },
  { name: 'Banane', category: 'fruits', emoji: '🍌' },
  { name: 'Mangue', category: 'fruits', emoji: '🥭' },
  { name: 'Quinoa', category: 'cereales', emoji: '🌾' },
  { name: 'Lentilles corail', category: 'proteines', emoji: '🫘' },
  { name: 'Pois chiches', category: 'proteines', emoji: '🫘' },
  { name: 'Patate douce', category: 'legumes', emoji: '🍠' },
  { name: 'Épinards', category: 'legumes', emoji: '🥬' },
  { name: 'Curry', category: 'epices', emoji: '🌶️' },
  { name: 'Yaourt grec', category: 'proteines', emoji: '🥛' },
  { name: 'Amandes', category: 'proteines', emoji: '🌰' },
  { name: 'Pain complet', category: 'cereales', emoji: '🍞' }
];

export function getIngredientsByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') return ingredients;
  return ingredients.filter(i => i.category === categoryId);
}
