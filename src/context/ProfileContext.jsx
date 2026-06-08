import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DEFAULT_GOALS = {
  dailyCalories: 2000,
  dailyProteins: 80,
  dailyCarbs: 250,
  dailyFats: 65
};

export const PROFILES = [
  { id: 'dja', name: 'Dja', emoji: '◆' },
  { id: 'liika', name: 'Liika', emoji: '◇' }
];

const ProfileContext = createContext(null);

function loadGoals(profileId) {
  try {
    const saved = localStorage.getItem(`ld-nutrition-goals-${profileId}`);
    return saved ? { ...DEFAULT_GOALS, ...JSON.parse(saved) } : { ...DEFAULT_GOALS };
  } catch {
    return { ...DEFAULT_GOALS };
  }
}

export function ProfileProvider({ children, initialProfileId }) {
  const urlProfile = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('profile')
    : null;

  const [activeProfileId, setActiveProfileId] = useState(() => {
    if (initialProfileId && PROFILES.some(p => p.id === initialProfileId)) return initialProfileId;
    if (urlProfile && PROFILES.some(p => p.id === urlProfile)) return urlProfile;
    const stored = localStorage.getItem('ld-active-profile');
    if (stored && PROFILES.some(p => p.id === stored)) return stored;
    return 'dja';
  });

  const [goalsByProfile, setGoalsByProfile] = useState(() => {
    const loaded = {};
    for (const p of PROFILES) loaded[p.id] = loadGoals(p.id);
    return loaded;
  });

  useEffect(() => {
    localStorage.setItem('ld-active-profile', activeProfileId);
  }, [activeProfileId]);

  const setGoals = useCallback((goals) => {
    setGoalsByProfile(prev => {
      const updated = { ...prev[activeProfileId], ...goals };
      localStorage.setItem(`ld-nutrition-goals-${activeProfileId}`, JSON.stringify(updated));
      return { ...prev, [activeProfileId]: updated };
    });
  }, [activeProfileId]);

  const getGoals = useCallback(() => {
    return goalsByProfile[activeProfileId] || DEFAULT_GOALS;
  }, [goalsByProfile, activeProfileId]);

  const activeProfile = PROFILES.find(p => p.id === activeProfileId) || PROFILES[0];

  return (
    <ProfileContext.Provider value={{
      profiles: PROFILES,
      activeProfileId,
      activeProfile,
      setActiveProfileId,
      setGoals,
      getGoals
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile doit être utilisé dans ProfileProvider');
  return ctx;
}
