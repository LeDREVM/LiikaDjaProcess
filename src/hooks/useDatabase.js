import { useState, useEffect, useCallback } from 'react';
import { getAll, addItem, removeItem, STORES } from '../utils/database';

function useStore(storeName) {
  const [data, setData] = useState([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const items = await getAll(storeName);
    setData(items);
    setReady(true);
  }, [storeName]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (item) => {
    await addItem(storeName, item);
    await refresh();
    return item;
  }, [storeName, refresh]);

  const remove = useCallback(async (id) => {
    await removeItem(storeName, id);
    await refresh();
  }, [storeName, refresh]);

  return { data, ready, addItem: add, removeItem: remove, refresh };
}

export function useDailyMeals() {
  return useStore(STORES.DAILY_MEALS);
}

export function useDailyExercises() {
  return useStore(STORES.DAILY_EXERCISES);
}
