const DB_NAME = 'ld-nutrition-db';
const DB_VERSION = 1;

export const STORES = {
  DAILY_MEALS: 'dailyMeals',
  DAILY_EXERCISES: 'dailyExercises'
};

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.DAILY_MEALS)) {
        const meals = db.createObjectStore(STORES.DAILY_MEALS, { keyPath: 'id' });
        meals.createIndex('date', 'date', { unique: false });
        meals.createIndex('profileId', 'profileId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.DAILY_EXERCISES)) {
        const exercises = db.createObjectStore(STORES.DAILY_EXERCISES, { keyPath: 'id' });
        exercises.createIndex('date', 'date', { unique: false });
        exercises.createIndex('profileId', 'profileId', { unique: false });
      }
    };
  });
  return dbPromise;
}

export async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getByIndex(storeName, indexName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const idx = tx.objectStore(storeName).index(indexName);
    const req = idx.getAll(value);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function addItem(storeName, item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function removeItem(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
