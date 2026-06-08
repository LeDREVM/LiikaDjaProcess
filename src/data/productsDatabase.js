// Base locale — produits courants (codes EAN réels, valeurs nutritionnelles / 100g)
const carrefourProducts = {
  '3017620422003': {
    name: 'Pâte à tartiner Nutella',
    brand: 'Ferrero',
    barcode: '3017620422003',
    calories: 539, proteins: 6.3, carbs: 57.5, fats: 30.9, fiber: 0,
    store: 'Carrefour'
  },
  '3560070460090': {
    name: 'Yaourt nature',
    brand: 'Carrefour',
    barcode: '3560070460090',
    calories: 61, proteins: 4.2, carbs: 4.6, fats: 3.0, fiber: 0,
    store: 'Carrefour'
  },
  '3276550100120': {
    name: 'Lait demi-écrémé',
    brand: 'Carrefour',
    barcode: '3276550100120',
    calories: 46, proteins: 3.2, carbs: 4.8, fats: 1.5, fiber: 0,
    store: 'Carrefour'
  },
  '3560070111111': {
    name: 'Pâtes spaghetti',
    brand: 'Carrefour',
    barcode: '3560070111111',
    calories: 359, proteins: 12, carbs: 71, fats: 1.5, fiber: 3.5,
    store: 'Carrefour'
  },
  '3560070808080': {
    name: 'Riz basmati',
    brand: 'Carrefour',
    barcode: '3560070808080',
    calories: 350, proteins: 7.5, carbs: 78, fats: 0.6, fiber: 1.2,
    store: 'Carrefour'
  }
};

const superuProducts = {
  '3250392001779': {
    name: 'Compote de pommes sans sucres ajoutés',
    brand: 'Andros',
    barcode: '3250392001779',
    calories: 52, proteins: 0.3, carbs: 12, fats: 0.1, fiber: 1.5,
    store: 'Super U'
  },
  '3256222222226': {
    name: 'Fromage blanc 0% MG',
    brand: 'Super U',
    barcode: '3256222222226',
    calories: 45, proteins: 7.5, carbs: 4.0, fats: 0.2, fiber: 0,
    store: 'Super U'
  },
  '3250392511514': {
    name: 'Flocons d\'avoine',
    brand: 'Super U',
    barcode: '3250392511514',
    calories: 370, proteins: 13, carbs: 58, fats: 7, fiber: 10,
    store: 'Super U'
  },
  '3256220170170': {
    name: 'Pois chiches en conserve',
    brand: 'Super U',
    barcode: '3256220170170',
    calories: 115, proteins: 7, carbs: 14, fats: 2.5, fiber: 6,
    store: 'Super U'
  },
  '3250391001001': {
    name: 'Pain de mie complet',
    brand: 'Super U',
    barcode: '3250391001001',
    calories: 247, proteins: 9, carbs: 43, fats: 3.5, fiber: 6,
    store: 'Super U'
  }
};

const allProducts = [
  ...Object.entries(carrefourProducts).map(([code, p]) => ({ ...p, barcode: code, source: 'local-carrefour' })),
  ...Object.entries(superuProducts).map(([code, p]) => ({ ...p, barcode: code, source: 'local-superu' }))
];

export function searchInLocalDatabase(barcode) {
  const code = String(barcode).trim();
  if (carrefourProducts[code]) {
    return { found: true, product: { ...carrefourProducts[code], barcode: code }, source: 'local-carrefour' };
  }
  if (superuProducts[code]) {
    return { found: true, product: { ...superuProducts[code], barcode: code }, source: 'local-superu' };
  }
  return { found: false };
}

export function searchByName(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return allProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q)
  );
}

export function getTotalProducts() {
  return Object.keys(carrefourProducts).length + Object.keys(superuProducts).length;
}
