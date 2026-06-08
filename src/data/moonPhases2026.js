const PHASES = [
  'Nouvelle Lune', 'Premier Croissant', 'Premier Quartier', 'Gibbeuse Croissante',
  'Pleine Lune', 'Gibbeuse Décroissante', 'Dernier Quartier', 'Dernier Croissant'
];

export function getAccurateMoonPhase(date = new Date()) {
  const synodic = 29.53058867;
  const ref = new Date('2026-01-06T18:00:00Z');
  const days = (date - ref) / 86400000;
  const age = ((days % synodic) + synodic) % synodic;
  const idx = Math.floor((age / synodic) * 8) % 8;
  return { name: PHASES[idx], age: Math.round(age * 10) / 10 };
}
