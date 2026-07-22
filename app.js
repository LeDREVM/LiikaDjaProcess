const {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} = React;
function useWindowWidth() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h, {
      passive: true
    });
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

// ─── Helpers ───
const accent = {
  dja: 'var(--accent-dja)',
  liika: 'var(--accent-liika)',
  couple: 'var(--accent-couple)'
};
const accentBg = {
  dja: 'var(--accent-dja-bg)',
  liika: 'var(--accent-liika-bg)',
  couple: 'var(--accent-couple-bg)'
};
const accentBorder = {
  dja: 'var(--accent-dja-border)',
  liika: 'var(--accent-liika-border)',
  couple: 'var(--accent-couple-border)'
};
const clone = o => typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
const defaultUI = {};

// ─── Supabase ───
const SB_URL = 'https://mvtwotbyphuxdkcwgime.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dHdvdGJ5cGh1eGRrY3dnaW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTA5NTIsImV4cCI6MjA5MDg4Njk1Mn0.pZvyjzD9Qpl4IKjBYJcL4ObqdH-UXu47tHLFIzxfde8';
const sb = supabase.createClient(SB_URL, SB_KEY);

// ID unique de cet appareil (généré une seule fois, persisté en localStorage)
const DEVICE_ID = (() => {
  let id = localStorage.getItem('ld-device-id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('ld-device-id', id);
  }
  return id;
})();
async function sbLoad(token) {
  if (token) {
    try {
      const { data, error } = await sb.rpc('ld_get_app_state', { p_token: token });
      if (!error && data && data.data) return normalize(data.data);
    } catch(_) {}
  }
  // Fallback accès direct (compatible ancienne config sans token)
  const { data, error } = await sb.from('app_state').select('data').eq('id', 'main').single();
  if (error || !data || !data.data) throw error || new Error('no data');
  return normalize(data.data);
}
async function sbSave(d, token) {
  // recipes, ferments, courses & media vivent dans leurs tables dédiées → hors du blob app_state
  const { recipes, ferments, courses, media, ...rest } = d || {};
  if (token) {
    const { error } = await sb.rpc('ld_save_app_state', { p_token: token, p_data: rest, p_device_id: DEVICE_ID });
    if (error) throw error;
    return;
  }
  const { error } = await sb.from('app_state').upsert({ id: 'main', data: rest, updated_at: new Date().toISOString(), device_id: DEVICE_ID });
  if (error) throw error;
}

// ─── DrevmCook : tables dédiées (recipes / ferments) ───
// Les recettes & ferments vivent dans leurs propres tables (pas dans le blob
// app_state). Mapping entre la forme app (camelCase, journal imbriqué) et la
// forme SQL (snake_case).
async function sbLoadRecipes() {
  const { data, error } = await sb.from('recipes').select('*');
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id, nom: r.nom || '', categorie: r.categorie || 'Salés',
    tags: Array.isArray(r.tags) ? r.tags : [],
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    preparation: r.preparation || '', apports: r.apports || '', budget: r.budget || ''
  }));
}
async function sbUpsertRecipe(r) {
  return sb.from('recipes').upsert({
    id: r.id, nom: r.nom || '', categorie: r.categorie || 'Salés',
    tags: Array.isArray(r.tags) ? r.tags : [],
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    preparation: r.preparation || '', apports: r.apports || '', budget: r.budget || '',
    updated_at: new Date().toISOString(), device_id: DEVICE_ID
  });
}
async function sbDeleteRecipe(id) { return sb.from('recipes').delete().eq('id', id); }
async function sbLoadFerments() {
  const { data, error } = await sb.from('ferments').select('*');
  if (error) throw error;
  return (data || []).map(f => ({
    id: f.id, nom: f.nom || '', type: f.type || 'Légumes',
    startDate: f.start_date || '', durationDays: Math.max(1, Number(f.duration_days) || 1),
    notes: f.notes || '', done: !!f.done,
    journal: Array.isArray(f.journal) ? f.journal : []
  }));
}
async function sbUpsertFerment(f) {
  return sb.from('ferments').upsert({
    id: f.id, nom: f.nom || '', type: f.type || 'Légumes',
    start_date: f.startDate || null,
    duration_days: Math.max(1, Number(f.durationDays) || 1),
    notes: f.notes || '', done: !!f.done,
    journal: Array.isArray(f.journal) ? f.journal : [],
    updated_at: new Date().toISOString(), device_id: DEVICE_ID
  });
}
async function sbDeleteFerment(id) { return sb.from('ferments').delete().eq('id', id); }

// ─── Courses : table dédiée ───
async function sbLoadCourses() {
  const { data, error } = await sb.from('courses').select('*');
  if (error) throw error;
  return (data || []).map(c => ({
    id: c.id, nom: c.nom || '', rayon: c.rayon || 'Autre',
    qte: Number(c.qte) || 1, unite: c.unite || '',
    prix: c.prix == null ? '' : Number(c.prix), done: !!c.done
  }));
}
async function sbUpsertCourse(c) {
  return sb.from('courses').upsert({
    id: c.id, nom: c.nom || '', rayon: c.rayon || 'Autre',
    qte: Math.max(0, Number(c.qte) || 1), unite: c.unite || '',
    prix: (c.prix === '' || c.prix == null || isNaN(Number(c.prix))) ? null : Number(c.prix),
    done: !!c.done, updated_at: new Date().toISOString(), device_id: DEVICE_ID
  });
}
async function sbDeleteCourse(id) { return sb.from('courses').delete().eq('id', id); }
async function sbDeleteCoursesByIds(ids) {
  if (!ids || !ids.length) return;
  return sb.from('courses').delete().in('id', ids);
}

// ─── Médias : table dédiée (liens YouTube vidéo/playlist) ───
async function sbLoadMedia() {
  const { data, error } = await sb.from('media').select('*');
  if (error) throw error;
  return (data || []).map(m => ({
    id: m.id, kind: m.kind || 'video', ytId: m.yt_id || '',
    title: m.title || '', thumb: m.thumb || ''
  }));
}
async function sbUpsertMedia(m) {
  return sb.from('media').upsert({
    id: m.id, kind: m.kind || 'video', yt_id: m.ytId || '',
    title: m.title || '', thumb: m.thumb || '',
    updated_at: new Date().toISOString(), device_id: DEVICE_ID
  });
}
async function sbDeleteMedia(id) { return sb.from('media').delete().eq('id', id); }

// ─── Data ───
const defaultData = {
  dja: {
    name: "Negus Dja",
    role: "Directeur artistique & Dev",
    location: "Guadeloupe",
    color: "dja",
    objectives: [{
      id: "d1",
      cat: "Carriere",
      title: "Lancer la suite d'apps pour createurs TDAH",
      desc: "MVP, beta testeurs, premiers abonnes",
      progress: 15,
      done: false
    }, {
      id: "d2",
      cat: "Carriere",
      title: "Identite visuelle caribeenne dans la tech",
      desc: "Se positionner comme DA de reference antillais",
      progress: 20,
      done: false
    }, {
      id: "d3",
      cat: "Sante",
      title: "Routine alimentaire vegetalienne stable",
      desc: "Batch cooking hebdo, produits locaux",
      progress: 30,
      done: false
    }, {
      id: "d4",
      cat: "Sante",
      title: "Systemes adaptes au TDAH",
      desc: "Micro-taches, automatisations, outils perso",
      progress: 25,
      done: false
    }, {
      id: "d5",
      cat: "Finances",
      title: "Atteindre l'independance financiere",
      desc: "40% SaaS, 30% DA, 20% contenu, 10% autres",
      progress: 10,
      done: false
    }, {
      id: "d6",
      cat: "Finances",
      title: "Monetiser la cuisine vegetale",
      desc: "Ateliers, contenu video, recettes",
      progress: 5,
      done: false
    }],
    actions: [{
      id: "da1",
      text: "Definir le MVP de la premiere app",
      cat: "Carriere",
      done: false
    }, {
      id: "da2",
      text: "Lister 10 painpoints TDAH du workflow creatif",
      cat: "Sante",
      done: false
    }, {
      id: "da3",
      text: "Creer un planning batch cooking hebdo",
      cat: "Sante",
      done: false
    }, {
      id: "da4",
      text: "Calculer le revenu minimum pour quitter le freelance",
      cat: "Finances",
      done: false
    }, {
      id: "da5",
      text: "Prototyper l'interface principale",
      cat: "Carriere",
      done: false
    }, {
      id: "da6",
      text: "Tester 3 recettes vegetales guadeloupeennes",
      cat: "Sante",
      done: false
    }],
    notes: [],
    meals: [{
      id: 'dm1',
      jour: 'Lundi',
      type: 'Matin',
      plat: 'Smoothie banane mangue',
      note: ''
    }, {
      id: 'dm2',
      jour: 'Lundi',
      type: 'Midi',
      plat: 'Riz complet haricots rouges',
      note: ''
    }, {
      id: 'dm3',
      jour: 'Lundi',
      type: 'Soir',
      plat: 'Soupe lentilles corail',
      note: ''
    }, {
      id: 'dm4',
      jour: 'Mardi',
      type: 'Midi',
      plat: 'Salade quinoa légumes rôtis',
      note: ''
    }, {
      id: 'dm5',
      jour: 'Mercredi',
      type: 'Midi',
      plat: 'Curry pois chiches',
      note: ''
    }],
    budget: {
      revenus: [{
        id: 'dr1',
        label: 'Freelance DA',
        montant: 2500
      }, {
        id: 'dr2',
        label: 'SaaS / apps',
        montant: 200
      }],
      depenses: [{
        id: 'dd1',
        label: 'Loyer',
        montant: 800,
        cat: 'Logement'
      }, {
        id: 'dd2',
        label: 'Alimentation',
        montant: 350,
        cat: 'Vie'
      }, {
        id: 'dd3',
        label: 'Abonnements tech',
        montant: 80,
        cat: 'Tech'
      }, {
        id: 'dd4',
        label: 'Transport',
        montant: 120,
        cat: 'Transport'
      }]
    },
    vision: "Créer un écosystème d'apps caribéennes pour les créatifs TDAH. Identité visuelle antillaise forte dans la tech. Indépendance financière via le SaaS d'ici 2028. Vivre et créer depuis la Guadeloupe.",
    sport: [{
      id: 'ds1',
      jour: 'Lundi',
      activite: 'Yoga / étirements',
      duree: 30,
      intensite: 'Légère',
      fait: false
    }, {
      id: 'ds2',
      jour: 'Mercredi',
      activite: 'Course à pied',
      duree: 40,
      intensite: 'Modérée',
      fait: false
    }, {
      id: 'ds3',
      jour: 'Vendredi',
      activite: 'Musculation corps',
      duree: 45,
      intensite: 'Intense',
      fait: false
    }, {
      id: 'ds4',
      jour: 'Dimanche',
      activite: 'Marche créative',
      duree: 60,
      intensite: 'Légère',
      fait: false
    }]
  },
  liika: {
    name: "Liika",
    role: "VT — Monitrice PL · RSMA Guadeloupe — indicatif « Purple Moon »",
    location: "",
    color: "liika",
    objectives: [{
      id: "l1",
      cat: "Carriere",
      title: "Stabiliser le CA et fideliser les clients",
      desc: "Optimiser les tournees, negocier de meilleurs contrats",
      progress: 30,
      done: false
    }, {
      id: "l2",
      cat: "Carriere",
      title: "Trouver sa niche de specialisation",
      desc: "Frigorifique, exceptionnel, evenementiel",
      progress: 10,
      done: false
    }, {
      id: "l3",
      cat: "Carriere",
      title: "Passer de conductrice a cheffe de flotte",
      desc: "Second vehicule, recrutement, gestion",
      progress: 5,
      done: false
    }, {
      id: "l4",
      cat: "Sante",
      title: "Routine sante adaptee a la route",
      desc: "Etirements, repas prepares, hydratation, sommeil",
      progress: 20,
      done: false
    }, {
      id: "l5",
      cat: "Perso",
      title: "Equilibre route / maison",
      desc: "Choisir ses tournees, moins de nuits dehors",
      progress: 15,
      done: false
    }, {
      id: "l6",
      cat: "Perso",
      title: "Construire a deux avec Dja",
      desc: "Temps de qualite, projets communs, logement",
      progress: 20,
      done: false
    }],
    actions: [{
      id: "la1",
      text: "Bilan financier des 12 derniers mois",
      cat: "Carriere",
      done: false
    }, {
      id: "la2",
      text: "Identifier 3 niches de specialisation",
      cat: "Carriere",
      done: false
    }, {
      id: "la3",
      text: "Mettre en place un kit repas sains pour la route",
      cat: "Sante",
      done: false
    }, {
      id: "la4",
      text: "Routine etirements de 10 min aux pauses",
      cat: "Sante",
      done: false
    }, {
      id: "la5",
      text: "Planifier un week-end deconnexion avec Dja",
      cat: "Perso",
      done: false
    }, {
      id: "la6",
      text: "Se renseigner sur les formations capacitaire",
      cat: "Carriere",
      done: false
    }],
    notes: [],
    meals: [{
      id: 'lm1',
      jour: 'Lundi',
      type: 'Matin',
      plat: 'Café thermos + pain de mie',
      note: 'Route tôt'
    }, {
      id: 'lm2',
      jour: 'Lundi',
      type: 'Midi',
      plat: 'Tupperware riz poulet légumes',
      note: 'Préparé la veille'
    }, {
      id: 'lm3',
      jour: 'Mardi',
      type: 'Midi',
      plat: 'Salade composée / wrap',
      note: 'Repos aire autoroute'
    }, {
      id: 'lm4',
      jour: 'Mercredi',
      type: 'Matin',
      plat: 'Yaourt fruits secs noix',
      note: ''
    }, {
      id: 'lm5',
      jour: 'Vendredi',
      type: 'Soir',
      plat: 'Repas maison avec Dja',
      note: 'Rentré(e)'
    }],
    budget: {
      revenus: [{
        id: 'lr1',
        label: 'Transport PL',
        montant: 3200
      }],
      depenses: [{
        id: 'ld1',
        label: 'Charges véhicule',
        montant: 900,
        cat: 'Pro'
      }, {
        id: 'ld2',
        label: 'Carburant',
        montant: 400,
        cat: 'Transport'
      }, {
        id: 'ld3',
        label: 'Alimentation route',
        montant: 250,
        cat: 'Vie'
      }, {
        id: 'ld4',
        label: 'Assurances',
        montant: 180,
        cat: 'Pro'
      }]
    },
    vision: "Devenir cheffe de flotte d'ici 2027 avec un second camion. Choisir mes tournées, rentrer chez moi le week-end. Construire un chez-nous solide avec Dja. Santé, équilibre et liberté sur la route.",
    codeRousseau: {
      eleves: [],
      fiches: [],
      notes: ''
    },
    route: { km: 0, checklist: {} },
    sport: [{
      id: 'ls1',
      jour: 'Mardi',
      activite: 'Étirements cabine',
      duree: 15,
      intensite: 'Légère',
      fait: false
    }, {
      id: 'ls2',
      jour: 'Jeudi',
      activite: 'Marche à l\'arrêt',
      duree: 30,
      intensite: 'Légère',
      fait: false
    }, {
      id: 'ls3',
      jour: 'Samedi',
      activite: 'Sport maison',
      duree: 40,
      intensite: 'Modérée',
      fait: false
    }, {
      id: 'ls4',
      jour: 'Dimanche',
      activite: 'Vélo ou natation',
      duree: 45,
      intensite: 'Modérée',
      fait: false
    }]
  },
  couple: {
    objectives: [{
      id: "c1",
      cat: "Couple",
      title: "Definir les objectifs communs 2027",
      desc: "Logement, voyages, finances partagees",
      progress: 10,
      done: false
    }, {
      id: "c2",
      cat: "Couple",
      title: "Synchroniser les rythmes de vie",
      desc: "Adapter les plannings malgre deux metiers differents",
      progress: 15,
      done: false
    }, {
      id: "c3",
      cat: "Couple",
      title: "Investir dans un logement",
      desc: "Creer un cocon solide a deux",
      progress: 5,
      done: false
    }],
    actions: [{
      id: "ca1",
      text: "Planifier une soiree objectifs couple",
      cat: "Couple",
      done: false
    }, {
      id: "ca2",
      text: "Ouvrir un compte commun projets",
      cat: "Couple",
      done: false
    }, {
      id: "ca3",
      text: "Choisir une destination vacances 2027",
      cat: "Couple",
      done: false
    }],
    notes: [],
    meals: [{
      id: 'cm1',
      jour: 'Samedi',
      type: 'Midi',
      plat: 'Brunch maison ensemble',
      note: 'Rituel hebdo'
    }, {
      id: 'cm2',
      jour: 'Samedi',
      type: 'Soir',
      plat: 'Barbecue / plats antillais',
      note: ''
    }, {
      id: 'cm3',
      jour: 'Dimanche',
      type: 'Midi',
      plat: 'Repas en famille ou sortie',
      note: ''
    }],
    budget: {
      revenus: [{
        id: 'cr1',
        label: 'Contribution Dja',
        montant: 800
      }, {
        id: 'cr2',
        label: 'Contribution Liika',
        montant: 800
      }],
      depenses: [{
        id: 'cd1',
        label: 'Fond vacances 2027',
        montant: 500,
        cat: 'Projets'
      }, {
        id: 'cd2',
        label: 'Épargne logement',
        montant: 600,
        cat: 'Épargne'
      }, {
        id: 'cd3',
        label: 'Loisirs couple',
        montant: 200,
        cat: 'Vie'
      }]
    },
    vision: "Un foyer à nous, un voyage par an, des projets créatifs communs. Construire ensemble une vie entre la Guadeloupe et la route — Lanmou Douvan pour toujours.",
    sport: [{
      id: 'cs1',
      jour: 'Samedi',
      activite: 'Sport ensemble / balade',
      duree: 60,
      intensite: 'Légère',
      fait: false
    }, {
      id: 'cs2',
      jour: 'Dimanche',
      activite: 'Randonnée ou plage',
      duree: 90,
      intensite: 'Modérée',
      fait: false
    }],
    planning: {},
    ideeJour: {
      liste: [],
      custom: []
    },
    motivations: [],
    medical: [],
    maison: {
      checked: {},
      custom: [],
      lastReset: ''
    },
    objMensuels: [],
    survie: {
      // Module survie / post-apo — cadre militaire « Purple Moon » (Liika).
      // Stocks du foyer (2 personnes), sacs d'évacuation, plan d'urgence.
      foyer: 2,
      stocks: [
        { id: 'sv-eau', nom: 'Eau potable', cat: 'Eau', qte: 24, unite: 'L', parJour: 3, peremption: '', note: 'Réserve bidons (≈3 L/pers/j)' },
        { id: 'sv-riz', nom: 'Riz', cat: 'Nourriture', qte: 5, unite: 'kg', parJour: 0.25, peremption: '', note: '' },
        { id: 'sv-conserves', nom: 'Conserves diverses', cat: 'Nourriture', qte: 20, unite: 'boîtes', parJour: 1, peremption: '', note: '' },
        { id: 'sv-trousse', nom: 'Trousse de premiers secours', cat: 'Médical', qte: 1, unite: 'kit', parJour: 0, peremption: '', note: 'Vérifier péremptions' },
        { id: 'sv-piles', nom: 'Piles AA', cat: 'Énergie', qte: 12, unite: 'u', parJour: 0, peremption: '', note: '' },
        { id: 'sv-lampe', nom: 'Lampe frontale', cat: 'Outils', qte: 2, unite: 'u', parJour: 0, peremption: '', note: '' }
      ],
      bob: {
        dja: [
          { id: 'bd1', label: 'Eau (1,5 L) + pastilles', done: false },
          { id: 'bd2', label: 'Rations énergétiques 48 h', done: false },
          { id: 'bd3', label: 'Couverture de survie', done: false },
          { id: 'bd4', label: 'Multi-outil + briquet', done: false }
        ],
        liika: [
          { id: 'bl1', label: 'Eau (1,5 L) + pastilles', done: false },
          { id: 'bl2', label: 'Rations énergétiques 48 h', done: false },
          { id: 'bl3', label: 'Trousse médicale perso', done: false },
          { id: 'bl4', label: 'Lampe + radio dynamo', done: false }
        ],
        commun: [
          { id: 'bc1', label: 'Documents (copies) étanches', done: false },
          { id: 'bc2', label: 'Cash en petites coupures', done: false },
          { id: 'bc3', label: 'Carte papier + boussole', done: false }
        ]
      },
      plan: {
        ralliement: [
          { id: 'rp1', nom: 'Point Alpha — domicile', adresse: '', note: 'Premier repli' }
        ],
        contacts: [
          { id: 'pc1', nom: 'Liika (Purple Moon)', role: 'Commandement', tel: '' },
          { id: 'pc2', nom: 'Dja', role: 'Intendance', tel: '' }
        ],
        protocoles: [
          { id: 'pr1', scenario: 'Coupure prolongée (eau/élec)', texte: 'Activer réserves, rationner eau, point Alpha si >72 h.' }
        ]
      }
    }
  },
  recipes: [],
  ferments: [],
  courses: [],
  media: [{
    id: 'pl-seed',
    kind: 'playlist',
    ytId: 'PLniFU1EmwtN-rC-s6vgj_ZdFYi3FcJtWB',
    title: 'Mix Vibz — Playlist',
    thumb: ''
  }],
  games: {
    chess: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', lastBy: '', result: '' },
    crossword: { filled: {}, done: false },
    streak: { count: 0, lastDay: '' },
    badges: []
  },
  album: []
};
// Garantit que les données chargées/reçues ont toujours la forme attendue
// (dja / liika / couple complets). Évite l'écran blanc si Supabase renvoie
// un état partiel, null ou d'une ancienne version.
function normalize(d) {
  if (!d || typeof d !== 'object') return clone(defaultData);
  const base = clone(defaultData);
  for (const k of ['dja', 'liika', 'couple']) {
    base[k] = {
      ...base[k],
      ...(d[k] && typeof d[k] === 'object' ? d[k] : {})
    };
  }
  if (Array.isArray(d.recipes)) base.recipes = d.recipes;
  if (d.games && typeof d.games === 'object') {
    base.games = {
      chess: { ...base.games.chess, ...(d.games.chess || {}) },
      crossword: { ...base.games.crossword, ...(d.games.crossword || {}) },
      streak: { ...base.games.streak, ...(d.games.streak || {}) },
      badges: Array.isArray(d.games.badges) ? d.games.badges : []
    };
  }
  if (Array.isArray(d.ferments)) base.ferments = d.ferments;
  if (Array.isArray(d.courses)) base.courses = d.courses;
  if (Array.isArray(d.media)) base.media = d.media;
  if (Array.isArray(d.album)) base.album = d.album;
  if (!Array.isArray(base.couple.motivations)) base.couple.motivations = [];
  if (!Array.isArray(base.couple.medical)) base.couple.medical = [];
  if (!Array.isArray(base.couple.potager)) base.couple.potager = [];
  if (!base.liika.codeRousseau || typeof base.liika.codeRousseau !== 'object') base.liika.codeRousseau = clone(defaultData.liika.codeRousseau);
  if (!Array.isArray(base.liika.codeRousseau.eleves)) base.liika.codeRousseau.eleves = [];
  if (!Array.isArray(base.liika.codeRousseau.fiches)) base.liika.codeRousseau.fiches = [];
  if (typeof base.liika.codeRousseau.notes !== 'string') base.liika.codeRousseau.notes = '';
  if (!base.liika.route || typeof base.liika.route !== 'object') base.liika.route = { km: 0, checklist: {} };
  if (typeof base.liika.route.km !== 'number') base.liika.route.km = 0;
  if (!base.liika.route.checklist || typeof base.liika.route.checklist !== 'object') base.liika.route.checklist = {};
  // Survie : garantir la forme (le spread couple ci-dessus a pu remplacer survie par une version partielle)
  {
    const sd = (d.couple && typeof d.couple.survie === 'object' && d.couple.survie) ? d.couple.survie : {};
    const sb = base.couple.survie || {};
    const bobIn = sd.bob && typeof sd.bob === 'object' ? sd.bob : {};
    const planIn = sd.plan && typeof sd.plan === 'object' ? sd.plan : {};
    base.couple.survie = {
      foyer: Number(sd.foyer) > 0 ? Number(sd.foyer) : (sb.foyer || 2),
      stocks: Array.isArray(sd.stocks) ? sd.stocks : (sb.stocks || []),
      bob: {
        dja: Array.isArray(bobIn.dja) ? bobIn.dja : ((sb.bob && sb.bob.dja) || []),
        liika: Array.isArray(bobIn.liika) ? bobIn.liika : ((sb.bob && sb.bob.liika) || []),
        commun: Array.isArray(bobIn.commun) ? bobIn.commun : ((sb.bob && sb.bob.commun) || [])
      },
      plan: {
        ralliement: Array.isArray(planIn.ralliement) ? planIn.ralliement : ((sb.plan && sb.plan.ralliement) || []),
        contacts: Array.isArray(planIn.contacts) ? planIn.contacts : ((sb.plan && sb.plan.contacts) || []),
        protocoles: Array.isArray(planIn.protocoles) ? planIn.protocoles : ((sb.plan && sb.plan.protocoles) || [])
      }
    };
  }
  // Métadonnées de synchro : horodatages par section + date globale
  if (d._t && typeof d._t === 'object') base._t = d._t;
  if (typeof d.updatedAt === 'string') base.updatedAt = d.updatedAt;
  return base;
}

// ─── Synchro multi-appareils : fusion par section (le plus récent gagne) ───
// Au lieu d'écraser tout le blob JSON, chaque section éditable porte un
// horodatage dans data._t["chemin.section"]. À la fusion (chargement initial
// ou réception temps réel), on garde pour CHAQUE section la version la plus
// récemment modifiée → les éditions simultanées (Dja sur les repas, Liika sur
// le sport…) ne s'effacent plus.
const SYNC_TOP = ['dja', 'liika', 'couple'];
// recipes & ferments NE sont PAS ici : ils ont leurs propres tables (DrevmCook)
// et ne transitent plus par le blob app_state.
const SYNC_FLAT = ['games'];
function syncPaths(a, b) {
  const set = new Set();
  for (const top of SYNC_TOP) {
    for (const k of Object.keys({ ...((a && a[top]) || {}), ...((b && b[top]) || {}) })) set.add(top + '.' + k);
  }
  for (const k of SYNC_FLAT) set.add(k);
  return set;
}
function getPath(obj, path) {
  const i = path.indexOf('.');
  if (i < 0) return obj ? obj[path] : undefined;
  const a = path.slice(0, i), b = path.slice(i + 1);
  return obj && obj[a] ? obj[a][b] : undefined;
}
function setPath(obj, path, val) {
  const i = path.indexOf('.');
  if (i < 0) { obj[path] = val; return; }
  const a = path.slice(0, i), b = path.slice(i + 1);
  if (!obj[a] || typeof obj[a] !== 'object') obj[a] = {};
  obj[a][b] = val;
}
// Horodate les sections qui ont changé entre prev et next ; met à jour updatedAt.
function stampChanges(prev, next) {
  if (!next || next === prev) return next;
  const now = new Date().toISOString();
  const t = { ...((prev && prev._t) || {}), ...(next._t || {}) };
  let changed = false;
  for (const p of syncPaths(prev, next)) {
    if (JSON.stringify(getPath(prev, p)) !== JSON.stringify(getPath(next, p))) {
      t[p] = now;
      changed = true;
    }
  }
  next._t = t;
  if (changed) next.updatedAt = now;
  else if (!next.updatedAt) next.updatedAt = (prev && prev.updatedAt) || now;
  return next;
}
// Fusionne deux états : pour chaque section, garde la plus récemment modifiée.
function mergeStates(local, remote) {
  if (!remote) return local;
  if (!local) return remote;
  const out = clone(local);
  const lt = local._t || {}, rt = remote._t || {};
  out._t = { ...lt };
  for (const p of syncPaths(local, remote)) {
    const lts = Date.parse(lt[p] || '') || 0;
    const rts = Date.parse(rt[p] || '') || 0;
    if (rts > lts) {
      setPath(out, p, clone(getPath(remote, p)));
      out._t[p] = rt[p];
    }
  }
  const lu = Date.parse(local.updatedAt || '') || 0;
  const ru = Date.parse(remote.updatedAt || '') || 0;
  out.updatedAt = ru > lu ? remote.updatedAt : local.updatedAt;
  return out;
}
function loadData() {
  try {
    const d = localStorage.getItem('dja-liika-goals');
    return normalize(d ? JSON.parse(d) : defaultData);
  } catch (e) {
    return clone(defaultData);
  }
}
function saveData(d) {
  localStorage.setItem('dja-liika-goals', JSON.stringify(d));
}
function loadUI() {
  try {
    const u = localStorage.getItem('dja-liika-ui');
    return u ? {
      ...defaultUI,
      ...JSON.parse(u)
    } : defaultUI;
  } catch (e) {
    return defaultUI;
  }
}
function saveUI(u) {
  localStorage.setItem('dja-liika-ui', JSON.stringify(u));
}

// ─── Components ───

function ProgressRing({
  pct,
  size = 48,
  stroke = 4,
  color
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - pct / 100 * circ;
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--border2)",
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeDasharray: circ,
    strokeDashoffset: off,
    strokeLinecap: "round",
    style: {
      transition: 'stroke-dashoffset .5s ease'
    }
  }));
}
function StatCard({
  label,
  value,
  color,
  icon
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
      borderRadius: 'var(--radius)',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 12,
      background: accentBg[color],
      border: `1px solid ${accentBorder[color]}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18
    }
  }, icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      marginBottom: 3,
      letterSpacing: '.05em'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 600,
      color: 'var(--text)'
    }
  }, value)));
}

function ObjectiveCard({obj,color,onToggle,onProgress,onDelete}){
  const h = React.createElement;
  const av = accent[color];
  const bv = accentBg[color];
  const accentVar = av;
  const bgVar = bv;
  return h('div', {
    style: {
      background: 'var(--bg3)',
      borderRadius: 'var(--radius)',
      padding: '16px 20px',
      borderLeft: `3px solid ${obj.done ? 'var(--success)' : av}`,
      animation: 'fadeUp .4s ease both',
      opacity: obj.done ? 0.6 : 1,
      transition: 'opacity .3s'
    }
  }, h('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12
    }
  }, h('div', {
    style: {
      flex: 1
    }
  }, h('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    }
  }, h('span', {
    style: {
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 20,
      background: bgVar,
      color: accentVar,
      fontWeight: 500
    }
  }, obj.cat), obj.done ? h('span', {
    style: {
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 20,
      background: 'var(--success-bg)',
      color: 'var(--success)',
      fontWeight: 500
    }
  }, 'Fait') : null), h('div', {
    style: {
      fontSize: 15,
      fontWeight: 500,
      marginBottom: 4,
      textDecoration: obj.done ? 'line-through' : 'none'
    }
  }, obj.title), h('div', {
    style: {
      fontSize: 13,
      color: 'var(--text3)'
    }
  }, obj.desc)), h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }
  }, h(ProgressRing, {
    pct: obj.progress,
    color: obj.done ? 'var(--success)' : accentVar
  }), h('span', {
    style: {
      fontSize: 11,
      fontWeight: 500,
      color: obj.done ? 'var(--success)' : accentVar
    }
  }, obj.progress + '%'))), h('div', {
    style: {
      marginTop: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, h('input', {
    type: 'range',
    min: '0',
    max: '100',
    step: '5',
    value: obj.progress,
    onChange: e => onProgress(obj.id, parseInt(e.target.value, 10)),
    style: {
      flex: 1,
      height: 4,
      accentColor: accentVar,
      cursor: 'pointer'
    }
  }), h('button', {
    onClick: () => onToggle(obj.id),
    style: {
      background: obj.done ? 'var(--success-bg)' : 'var(--bg4)',
      border: 'none',
      borderRadius: 'var(--radius-xs)',
      padding: '6px 12px',
      fontSize: 12,
      color: obj.done ? 'var(--success)' : 'var(--text2)',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }
  }, obj.done ? 'Réactiver' : 'Valider'), h('button', {
    onClick: () => onDelete(obj.id),
    'aria-label': 'Supprimer',
    style: {
      background: 'none',
      border: 'none',
      fontSize: 14,
      color: 'var(--text3)',
      cursor: 'pointer',
      padding: '6px'
    }
  }, '✕')));
}
function ActionItem({
  action,
  color,
  onToggle
}) {
  const av = accent[color];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)',
      cursor: 'pointer',
      transition: 'all .15s',
      animation: 'slideIn .3s ease both'
    },
    onClick: () => onToggle(action.id)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 20,
      height: 20,
      minWidth: 20,
      borderRadius: 6,
      border: action.done ? 'none' : `2px solid var(--border2)`,
      background: action.done ? 'var(--success)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all .2s'
    }
  }, action.done && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--bg)',
      fontSize: 12,
      fontWeight: 700
    }
  }, "\u2713")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 14,
      color: action.done ? 'var(--text3)' : 'var(--text)',
      textDecoration: action.done ? 'line-through' : 'none',
      transition: 'all .2s'
    }
  }, action.text), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: '2px 8px',
      borderRadius: 20,
      background: accentBg[color],
      color: av,
      fontWeight: 500
    }
  }, action.cat));
}
function NotesPanel({
  who,
  notes,
  onAdd,
  onDelete
}) {
  const [draft, setDraft] = useState('');
  const av = accent[who];
  const bv = accentBorder[who];
  const fmt = iso => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' ' + d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const submit = () => {
    if (draft.trim()) {
      onAdd(who, draft);
      setDraft('');
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "gold-rule",
    style: {
      marginBottom: 20
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "'Cormorant Garamond',serif",
      fontSize: 18,
      fontWeight: 600,
      marginBottom: 14,
      color: 'var(--gold2)',
      letterSpacing: '.02em'
    }
  }, "Notes"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    value: draft,
    onChange: e => setDraft(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
    },
    placeholder: "Nouvelle note\u2026 (Ctrl+Entr\xE9e pour valider)",
    rows: 3,
    style: {
      flex: 1,
      background: 'var(--bg3)',
      border: `1px solid ${bv}`,
      borderRadius: 'var(--radius-sm)',
      padding: '10px 12px',
      color: 'var(--text)',
      fontSize: 13,
      resize: 'vertical',
      outline: 'none',
      fontFamily: 'inherit',
      lineHeight: 1.6
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    style: {
      alignSelf: 'flex-end',
      padding: '8px 14px',
      borderRadius: 'var(--radius-sm)',
      border: 'none',
      background: `linear-gradient(135deg,${av},${av}cc)`,
      color: '#06120d',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      letterSpacing: '.04em'
    }
  }, "+ Ajouter")), !(notes || []).length && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text3)',
      textAlign: 'center',
      padding: '20px 0',
      fontStyle: 'italic'
    }
  }, "Aucune note pour l'instant."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, (notes || []).map(n => /*#__PURE__*/React.createElement("div", {
    key: n.id,
    style: {
      background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
      border: `1px solid var(--border)`,
      borderLeft: `2px solid ${bv}`,
      borderRadius: 'var(--radius-sm)',
      padding: '12px 14px',
      boxShadow: 'var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text)',
      lineHeight: 1.65,
      whiteSpace: 'pre-wrap',
      marginBottom: 7
    }
  }, n.text), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: 'var(--text3)',
      fontFamily: "'Space Mono',monospace"
    }
  }, fmt(n.date)), /*#__PURE__*/React.createElement("button", {
    onClick: () => onDelete(who, n.id),
    "aria-label": "Supprimer la note",
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--text3)',
      cursor: 'pointer',
      fontSize: 16,
      lineHeight: 1,
      padding: '0 2px'
    }
  }, "\xD7"))))));
}
function AddModal({
  show,
  onClose,
  onAdd,
  type,
  color
}) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('Carriere');
  if (!show) return null;
  const av = accent[color] || accent.dja;
  const cats = color === 'couple' ? ['Couple'] : ['Carriere', 'Sante', 'Finances', 'Perso'];
  const sm = typeof window !== 'undefined' && window.innerWidth <= 600;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: sm ? 'flex-end' : 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: sm ? 0 : 20
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
      borderRadius: sm ? '20px 20px 0 0' : 'var(--radius)',
      padding: sm ? '24px 20px 32px' : 28,
      maxWidth: 440,
      width: '100%',
      border: '1px solid var(--gold-border)',
      boxShadow: '0 -8px 40px rgba(0,0,0,.6)'
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "'Cormorant Garamond',serif",
      fontSize: 20,
      fontWeight: 600,
      marginBottom: 4,
      color: 'var(--gold2)'
    }
  }, type === 'objective' ? 'Nouvel objectif' : 'Nouvelle action'), /*#__PURE__*/React.createElement("div", {
    className: "gold-rule",
    style: {
      marginBottom: 18
    }
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: type === 'objective' ? 'Titre de l\'objectif' : 'Action a realiser',
    value: title,
    onChange: e => setTitle(e.target.value),
    style: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border2)',
      background: 'var(--bg4)',
      color: 'var(--text)',
      fontSize: 14,
      marginBottom: 12,
      outline: 'none'
    }
  }), type === 'objective' && /*#__PURE__*/React.createElement("input", {
    placeholder: "Description",
    value: desc,
    onChange: e => setDesc(e.target.value),
    style: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border2)',
      background: 'var(--bg4)',
      color: 'var(--text)',
      fontSize: 14,
      marginBottom: 12,
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 20,
      flexWrap: 'wrap'
    }
  }, cats.map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setCat(c),
    style: {
      padding: '6px 14px',
      borderRadius: 20,
      border: cat === c ? `1px solid ${av}` : '1px solid var(--border)',
      background: cat === c ? 'rgba(0,0,0,.2)' : 'transparent',
      color: cat === c ? av : 'var(--text3)',
      fontSize: 12,
      cursor: 'pointer',
      transition: 'all .15s'
    }
  }, c))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      padding: '10px 20px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border2)',
      background: 'transparent',
      color: 'var(--text2)',
      cursor: 'pointer',
      fontSize: 13
    }
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (title.trim()) {
        onAdd(title, desc, cat);
        setTitle('');
        setDesc('');
        onClose();
      }
    },
    style: {
      padding: '10px 20px',
      borderRadius: 'var(--radius-sm)',
      border: 'none',
      background: `linear-gradient(135deg,var(--gold),var(--gold2))`,
      color: '#06120d',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '.04em'
    }
  }, "Ajouter"))));
}
function ChartPanel({
  data
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const all = [...data.dja.objectives, ...data.liika.objectives, ...data.couple.objectives];
    const cats = [...new Set(all.map(o => o.cat))];
    const avgByCat = cats.map(c => {
      const items = all.filter(o => o.cat === c);
      return Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length);
    });
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: cats,
        datasets: [{
          data: avgByCat,
          backgroundColor: ['#8b5cf6', '#34d399', '#fbbf24', '#f472b6', '#60a5fa'],
          borderRadius: 8,
          barPercentage: .6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(255,255,255,.04)'
            },
            ticks: {
              color: '#6e6a80',
              font: {
                family: 'Outfit'
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#a8a4b8',
              font: {
                family: 'Outfit',
                weight: 500
              }
            }
          }
        }
      }
    });
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 260
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef
  }));
}
function DoughnutPanel({
  data,
  who
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const src = who === 'couple' ? data.couple.objectives : data[who].objectives;
    const done = src.filter(o => o.done).length;
    const inProgress = src.filter(o => !o.done && o.progress > 0).length;
    const notStarted = src.filter(o => !o.done && o.progress === 0).length;
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Termines', 'En cours', 'A faire'],
        datasets: [{
          data: [done, inProgress, notStarted],
          backgroundColor: ['#34d399', '#8b5cf6', '#2a2a3a'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data, who]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 200
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef
  }));
}

// ─── Default idées du jour ───
const DEFAULT_IDEES = [{
  id: 'di1',
  text: 'Cuisiner ensemble une nouvelle recette DrevmCook'
}, {
  id: 'di2',
  text: 'Planifier une sortie à la plage ce week-end'
}, {
  id: 'di3',
  text: 'Se dire 3 choses qu\'on apprécie l\'un chez l\'autre'
}, {
  id: 'di4',
  text: 'Essayer une nouvelle activité sportive ensemble'
}, {
  id: 'di5',
  text: 'Regarder un film de la liste culture'
}, {
  id: 'di6',
  text: 'Écrire ses objectifs de la semaine ensemble'
}, {
  id: 'di7',
  text: 'Préparer un batch cooking pour la semaine'
}, {
  id: 'di8',
  text: 'Explorer un nouveau coin de la Guadeloupe'
}, {
  id: 'di9',
  text: 'Méditer 10 minutes ensemble au lever'
}, {
  id: 'di10',
  text: 'Préparer un lait végétal maison DrevmCook'
}, {
  id: 'di11',
  text: 'Créer quelque chose ensemble (art, musique, cuisine)'
}, {
  id: 'di12',
  text: 'Appeler de la famille ou des amis proches'
}, {
  id: 'di13',
  text: 'Faire une liste de gratitude à deux'
}, {
  id: 'di14',
  text: 'Prendre soin de soi : bain, soin, relaxation'
}, {
  id: 'di15',
  text: 'Lancer une lactofermentation maison'
}, {
  id: 'di16',
  text: 'Écrire une vision 5 ans ensemble'
}, {
  id: 'di17',
  text: 'Préparer les mini baguettes sans gluten DrevmCook'
}, {
  id: 'di18',
  text: 'Faire une randonnée dans la nature guadeloupéenne'
}, {
  id: 'di19',
  text: 'Planifier les objectifs couple du mois'
}, {
  id: 'di20',
  text: 'Préparer un pique-nique végétalien pour une sortie'
}, {
  id: 'di21',
  text: 'Tester une infusion de feuilles de fruit à pain'
}, {
  id: 'di22',
  text: 'Regarder le coucher de soleil ensemble au Point des Châteaux'
}];

// ─── Phrases de motivation quotidienne ───
const DEFAULT_MOTIVATIONS = [
  { id: 'mo1',  text: 'Chaque jour est une nouvelle page à écrire ensemble ♡' },
  { id: 'mo2',  text: 'La distance entre le rêve et la réalité s\'appelle l\'action.' },
  { id: 'mo3',  text: 'Vous êtes plus forts ensemble que séparément.' },
  { id: 'mo4',  text: 'Petit à petit, l\'oiseau fait son nid — chaque effort compte.' },
  { id: 'mo5',  text: 'La Guadeloupe vous inspire, laissez-la vous nourrir de beauté.' },
  { id: 'mo6',  text: 'Votre vision 2026-2036 commence aujourd\'hui, maintenant.' },
  { id: 'mo7',  text: 'Semer avec intention, récolter avec gratitude.' },
  { id: 'mo8',  text: 'L\'amour grandit quand on l\'arrose de présence et d\'attention.' },
  { id: 'mo9',  text: 'Ce que vous mangez nourrit non seulement le corps, mais l\'esprit.' },
  { id: 'mo10', text: 'Un pas vers vos objectifs vaut mieux que mille paroles.' },
  { id: 'mo11', text: 'La constance bat le talent quand le talent ne travaille pas.' },
  { id: 'mo12', text: 'Votre énergie est votre trésor le plus précieux — protégez-la.' },
  { id: 'mo13', text: 'Ensemble vous transformez les projets en réalités.' },
  { id: 'mo14', text: 'Le soleil des Antilles rappelle que chaque matin est un cadeau.' },
  { id: 'mo15', text: 'Célébrez chaque petite victoire — elles forgent les grandes.' },
  { id: 'mo16', text: 'Votre cuisine est un acte d\'amour envers vos corps et la planète.' },
  { id: 'mo17', text: 'Disciplinés sur les petites choses, libres sur les grandes.' },
  { id: 'mo18', text: 'La santé est la fondation de tous vos rêves — prenez-en soin.' },
  { id: 'mo19', text: 'Chaque ferment que vous créez est une leçon de patience et de vie.' },
  { id: 'mo20', text: 'Ce qui ne vous défie pas ne vous fait pas grandir.' },
  { id: 'mo21', text: 'Vos objectifs ne vous attendent pas — c\'est vous qui devez avancer.' },
  { id: 'mo22', text: 'La gratitude ouvre les portes que l\'inquiétude ferme.' },
  { id: 'mo23', text: 'Restez curieux — chaque jour cache une connaissance à découvrir.' },
  { id: 'mo24', text: 'Votre couple est une œuvre d\'art que vous créez ensemble chaque jour.' },
  { id: 'mo25', text: 'Faire confiance au processus, même quand le résultat n\'est pas visible.' },
  { id: 'mo26', text: 'La nature vous enseigne la résilience — observez, apprenez, croissez.' },
  { id: 'mo27', text: 'Chaque "non" à ce qui vous draine est un "oui" à ce qui vous nourrit.' },
  { id: 'mo28', text: 'Les rêves les plus grands commencent par la discipline la plus humble.' },
  { id: 'mo29', text: 'Votre authenticité est votre plus grande force — ne la trahissez jamais.' },
  { id: 'mo30', text: 'Breathe. Focus. Build. — Ensemble, vous pouvez tout construire.' },
  { id: 'mo31', text: 'Le chemin vers la liberté financière se trace pas à pas, budget après budget.' },
  { id: 'mo32', text: 'Nourrir son corps de plantes vivantes, c\'est nourrir son âme.' },
  { id: 'mo33', text: 'Votre histoire s\'écrit maintenant — faites-en une belle.' },
  { id: 'mo34', text: 'La mer des Antilles vous rappelle l\'infini de vos possibilités.' },
  { id: 'mo35', text: 'Prenez soin de vous pour mieux prendre soin de l\'autre.' },
  { id: 'mo36', text: 'Chaque objectif coché est une promesse tenue envers vous-mêmes.' },
  { id: 'mo37', text: 'La force d\'un couple se mesure dans les moments difficiles.' },
  { id: 'mo38', text: 'Ce que vous semez dans vos habitudes, vous le récoltez dans votre vie.' },
  { id: 'mo39', text: 'L\'art, la cuisine, la nature — votre vie est déjà riche.' },
  { id: 'mo40', text: 'Avancez lentement si nécessaire, mais n\'arrêtez jamais.' },
  { id: 'mo41', text: 'La cohérence est la magie que vous pouvez pratiquer chaque jour.' },
  { id: 'mo42', text: 'Votre jardin intérieur mérite autant de soin que vos ferments.' },
  { id: 'mo43', text: 'Imaginez qui vous serez dans 5 ans si vous agissez dès aujourd\'hui.' },
  { id: 'mo44', text: 'Moins de bruit, plus de profondeur — vous êtes sur la bonne voie.' },
  { id: 'mo45', text: 'Le couple qui crée ensemble, évolue ensemble.' },
  { id: 'mo46', text: 'Votre créativité est inépuisable — laissez-la s\'exprimer.' },
  { id: 'mo47', text: 'Chaque difficulté surmontée ensemble renforce votre lien.' },
  { id: 'mo48', text: 'La simplicité choisie est plus puissante que l\'abondance subie.' },
  { id: 'mo49', text: 'Vous êtes le projet le plus important que vous ayez jamais entrepris.' },
  { id: 'mo50', text: 'Aujourd\'hui est un bon jour pour être fiers de qui vous êtes devenus.' }
];

// ─── Default recipes DrevmCook ───
const DEFAULT_RECIPES = [{
  id: 'r1',
  nom: 'Houmous Vivant',
  categorie: 'Salés',
  tags: ['vegan', 'sans-gluten'],
  ingredients: ['Pois chiches cuits', 'Ail', 'Citron vert', 'Tahini ou graines de courge mixées', 'Huile', 'Sel', 'Jus de lactofermentation (optionnel)'],
  preparation: 'Mixer tous les ingrédients jusqu\'à texture crémeuse. Ajuster l\'huile et le citron selon goût. Servir avec légumes crus ou pain maison.',
  apports: 'Pois chiche : protéines, fibres, fer. Ail : immunité. Citron vert : vitamine C. Graines de courge : zinc, magnésium.',
  budget: '≈ 4 à 7 €'
}, {
  id: 'r2',
  nom: 'Rainbow Salad',
  categorie: 'Salés',
  tags: ['vegan', 'sans-gluten', 'cru'],
  ingredients: ['Chou rouge', 'Carotte', 'Betterave crue', 'Avocat', 'Tofu grillé ou pois chiches', 'Graines de courge', 'Sauce citron gingembre'],
  preparation: 'Assembler tous les ingrédients en bol coloré. Préparer la sauce en mixant citron vert, gingembre, huile et sel. Arroser et servir immédiatement.',
  apports: 'Chou rouge : anthocyanes, vitamine C. Betterave : circulation, fer végétal. Avocat : bons lipides, potassium. Gingembre : digestion, anti-inflammatoire.',
  budget: '≈ 5 à 9 €'
}, {
  id: 'r3',
  nom: 'Mini Baguettes Maison',
  categorie: 'Boulangerie',
  tags: ['vegan', 'sans-gluten'],
  ingredients: ['350 g farine ou mélange sans gluten', '1 sachet levure boulangère', 'Eau tiède', 'Huile de tournesol', 'Sel', 'Herbes aromatiques', 'Graines de courge (optionnel)'],
  preparation: '1. Activer la levure dans l\'eau tiède avec l\'huile. 2. Ajouter farine, sel, herbes. 3. Mélanger. 4. Couvrir 30 min. 5. Faire des rabats toutes les 30 min (x3). 6. Former 4 mini baguettes. 7. Grifier le dessus. 8. Cuire à 200°C pendant 15-20 min.',
  apports: 'Farine : énergie, glucides, fibres. Levure : fermentation. Huile : vitamine E. Herbes : antioxydants. Graines de courge : zinc, magnésium.',
  budget: '≈ 2,40 à 6 € (version SG)'
}, {
  id: 'r4',
  nom: 'Focaccia DrevmCook',
  categorie: 'Boulangerie',
  tags: ['vegan', 'sans-gluten'],
  ingredients: ['300 g farine sans gluten', '100 g levain actif ou levure', '250 ml eau tiède', '3 c.s. huile', 'Sel', 'Ail', 'Thym / romarin / bouquet garni', 'Tomates ou oignons', 'Graines de courge (optionnel)'],
  preparation: '1. Mélanger farine, levain, eau, huile et sel. 2. Laisser pousser 1-2 h. 3. Verser dans un plat huilé. 4. Faire des trous avec les doigts. 5. Ajouter ail, herbes, tomates ou oignons. 6. Cuire 20-25 min à 200°C.',
  apports: 'Ail : allicine, immunité. Tomate : lycopène, vitamine C. Oignon : quercétine, prébiotiques. Romarin/thym : antioxydants, digestion.',
  budget: '≈ 5 à 8 €'
}, {
  id: 'r5',
  nom: 'Galettes Anti-Gaspillage',
  categorie: 'Boulangerie',
  tags: ['vegan', 'sans-gluten'],
  ingredients: ['Reste de levain', 'Farine de pois chiche ou riz', 'Eau', 'Sel', 'Herbes', 'Huile pour cuisson'],
  preparation: '1. Mélanger le levain avec farine et eau. 2. Ajouter sel et herbes. 3. Cuire à la poêle comme une crêpe épaisse.',
  apports: 'Levain : fermentation, digestibilité. Pois chiche : protéines, fibres, fer. Herbes : antioxydants.',
  budget: '≈ 1 à 2 €'
}, {
  id: 'r6',
  nom: 'Carottes Épicées Fermentées',
  categorie: 'Fermentés',
  tags: ['vegan', 'sans-gluten', 'fermenté'],
  ingredients: ['1 kg carottes', '10 g sel marin', 'Gingembre', 'Cannelle', 'Ail'],
  preparation: '1. Râper les carottes. 2. Ajouter sel et épices. 3. Malaxer pour faire sortir le jus. 4. Tasser en bocal. 5. Compléter avec eau si besoin. 6. Garder immergé. 7. Fermenter 2-3 semaines.',
  apports: 'Carotte : bêta-carotène, fibres, potassium. Gingembre : gingérols, digestion. Cannelle : antioxydants. Ail : allicine.',
  budget: '≈ 4 à 6 €'
}, {
  id: 'r7',
  nom: 'Chou Rouge Lactofermenté',
  categorie: 'Fermentés',
  tags: ['vegan', 'sans-gluten', 'fermenté'],
  ingredients: ['Chou rouge', 'Sel marin (2% du poids)', 'Ail (optionnel)', 'Gingembre (optionnel)'],
  preparation: 'Émincer finement le chou, saler, malaxer vigoureusement jusqu\'à ce que le jus sorte. Tasser en bocal, garder immergé sous le liquide. Fermenter 1 à 3 semaines à température ambiante.',
  apports: 'Chou rouge : anthocyanes, vitamine C, fibres, antioxydants. Probiotiques naturels après fermentation.',
  budget: '≈ 3 à 5 €'
}, {
  id: 'r8',
  nom: 'Sauce Piquante Fermentée',
  categorie: 'Fermentés',
  tags: ['vegan', 'sans-gluten', 'fermenté'],
  ingredients: ['Piments locaux (bonda man jak, habanero)', 'Ail', 'Sel', 'Eau filtrée', 'Gingembre (optionnel)'],
  preparation: 'Mettre piments et ail en saumure (eau + sel). Fermenter 1-2 semaines en bocal recouvert d\'un tissu. Mixer finement. Conserver au frais après ouverture.',
  apports: 'Piment : capsaïcine, circulation, métabolisme. Ail : allicine, immunité. Gingembre : anti-inflammatoire.',
  budget: '≈ 4 à 6 €'
}, {
  id: 'r9',
  nom: 'Banane Givrée Cacao',
  categorie: 'Desserts',
  tags: ['vegan', 'sans-gluten', 'cru'],
  ingredients: ['Bananes mûres (congelées)', 'Cacao brut', 'Graines de courge trempées ou torréfiées', 'Cannelle', 'Lait végétal (optionnel)'],
  preparation: '1. Couper les bananes. 2. Congeler 2h minimum. 3. Mixer avec cacao et un peu de lait végétal. 4. Ajouter graines de courge. Servir immédiatement ou remettre 20 min au congélateur.',
  apports: 'Banane : potassium, énergie. Cacao : magnésium, antioxydants. Graines de courge : zinc, protéines, magnésium.',
  budget: '≈ 2 à 4 €'
}, {
  id: 'r10',
  nom: 'Tiramisu Banane Chocolat',
  categorie: 'Desserts',
  tags: ['vegan', 'sans-gluten'],
  ingredients: ['4 bananes mûres', '200 g biscuits SG ou base riz/fruit à pain', 'Cacao brut', 'Café (optionnel)', 'Cannelle', 'Crème de coco ou mascarpone', 'Aquafaba (option vegan)', 'Sucre roux', 'Vanille', 'Chocolat noir fondu'],
  preparation: '1. Préparer la crème (mascarpone + sucre + vanille, ou crème coco + aquafaba fouettée). 2. Préparer base biscuitée, tremper dans café léger. 3. Monter couches : biscuit, banane, crème, cacao. 4. Ajouter chocolat noir fondu. 5. Repos au frais 4h minimum.',
  apports: 'Banane : potassium, énergie, B6. Cacao brut : magnésium, flavonoïdes, fer. Crème de coco : bons lipides. Chocolat noir : antioxydants.',
  budget: '≈ 11 à 18 €'
}, {
  id: 'r11',
  nom: "M&M's Maison Naturels",
  categorie: 'Desserts',
  tags: ['vegan', 'sans-gluten'],
  ingredients: ['120-130 g poudre d\'amande', '50 g cacao 100%', '60 g sucre de coco', 'Pincée de sel', '1 c.s. vanille liquide', '3 c.s. lait végétal', 'Chocolat blanc ou noir + huile de coco (enrobage)', 'Colorants naturels : matcha, spiruline, betterave, maca, phycocyanine'],
  preparation: '1. Mélanger amande, cacao, sucre et sel. 2. Ajouter vanille et lait végétal. 3. Former une boule. 4. Couper en petits morceaux d\'1 cm. 5. Congeler 10-20 min. 6. Fondre chocolat + huile + colorant naturel. 7. Enrober. 8. Congeler 10-30 min.',
  apports: 'Amande : vitamine E, magnésium, protéines. Cacao : magnésium, antioxydants, fer. Colorants : matcha/spiruline/betterave (antioxydants).',
  budget: '≈ 11 à 23 €'
}, {
  id: 'r12',
  nom: 'Snickers DrevmCook',
  categorie: 'Desserts',
  tags: ['vegan', 'sans-gluten'],
  ingredients: ['Base nougat: poudre d\'amande, beurre de cacahuète, lait végétal, sirop naturel, sel, vanille', 'Caramel: dattes, beurre de cacahuète, eau chaude, sel, vanille', 'Cacahuètes grillées', 'Enrobage: chocolat noir + huile de coco'],
  preparation: '1. Mélanger base nougat, étaler dans un moule. 2. Mixer dattes + beurre cacahuète + eau + sel (caramel). 3. Étaler caramel sur la base. 4. Ajouter cacahuètes. 5. Congeler. 6. Couper en barres. 7. Enrober de chocolat noir fondu. 8. Garder au frais.',
  apports: 'Dattes : potassium, énergie, fibres. Cacahuètes : protéines, bons lipides, magnésium. Amande : vitamine E. Chocolat noir : antioxydants.',
  budget: '≈ 14 à 25 € pour 8-10 barres'
}, {
  id: 'r13',
  nom: "Lait d'Amande Maison",
  categorie: 'Boissons',
  tags: ['vegan', 'sans-gluten', 'cru'],
  ingredients: ['100 g amandes (trempées 8-12h)', '700 ml eau filtrée', '1 pincée de sel', 'Vanille (optionnel)'],
  preparation: '1. Faire tremper les amandes 8-12h. 2. Rincer. 3. Mixer avec l\'eau filtrée 2 min à puissance max. 4. Filtrer avec tissu propre ou sac à lait végétal. 5. Conserver 2-3 jours au frais dans une bouteille fermée.',
  apports: 'Amande : vitamine E, magnésium, protéines végétales, bons lipides. Eau filtrée : hydratation, base neutre.',
  budget: '≈ 3,50 à 6 €'
}, {
  id: 'r14',
  nom: 'Lait de Graines de Courge',
  categorie: 'Boissons',
  tags: ['vegan', 'sans-gluten', 'cru'],
  ingredients: ['100 g graines de courge (trempées 4-8h)', '700 ml eau filtrée', '1 pincée de sel', 'Cannelle (optionnel)'],
  preparation: '1. Tremper les graines 4-8h. 2. Rincer. 3. Mixer avec l\'eau. 4. Filtrer. 5. Assaisonner. 6. Conserver au frais 2-3 jours. Bien agiter avant de servir.',
  apports: 'Graines de courge : zinc, magnésium, protéines végétales, bons lipides. Cannelle : antioxydants, soutien glycémique.',
  budget: '≈ 2,50 à 5 €'
}, {
  id: 'r15',
  nom: 'Infusion Feuilles Fruit à Pain',
  categorie: 'Boissons',
  tags: ['vegan', 'sans-gluten', 'tropical'],
  ingredients: ['4-6 feuilles de fruit à pain', '1 L eau', 'Gingembre (optionnel)', 'Cannelle (optionnel)', 'Miel ou sirop de canne (optionnel)'],
  preparation: '1. Nettoyer les feuilles. 2. Faire bouillir l\'eau. 3. Ajouter les feuilles. 4. Laisser frémir 10-15 min. 5. Filtrer. Servir chaud ou refroidi avec citron vert et menthe.',
  apports: 'Feuilles de fruit à pain : polyphénols, flavonoïdes, potassium, usage traditionnel digestif. Gingembre : digestion, anti-inflammatoire.',
  budget: '≈ 0,80 à 1,50 €'
}, {
  id: 'r16',
  nom: 'Plantes & Herbier Créole',
  categorie: 'Référence',
  tags: ['tropical', 'guadeloupe', 'plantes'],
  ingredients: ['Pourpier : oméga-3 végétaux, fibres, minéraux', 'Atoumo : digestion, respiration, infusion traditionnelle créole', 'Moringa : fer, calcium, protéines partielles, chlorophylle', 'Feuilles de goyave : tanins, antioxydants, infusion digestive', 'Feuilles de patate douce : chlorophylle, fibres, brèdes sautées', 'Leaf of Life (Bryophyllum pinnatum) : usage traditionnel – voir précautions'],
  preparation: 'Répertoire des plantes traditionnelles antillaises utilisées en cuisine et médecine populaire DrevmCook. Toujours commencer à petite dose. Ces plantes ne remplacent pas un avis médical. Leaf of Life : contient des glycosides cardiaques — éviter grossesse, problèmes cardiaques, enfants.',
  apports: 'Patrimoine botanique caribéen : antioxydants, huiles essentielles, flavonoïdes, minéraux, polyphénols.',
  budget: 'Gratuit (cueillette) à ≈ 1-2 € (marché local)'
}];

// ─── Tab Views (proper React components to allow local useState) ───
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const TYPES = ['Matin', 'Midi', 'Soir'];
const INTENSITES = ['Légère', 'Modérée', 'Intense'];
const SPORT_CATS = ['Cardio', 'Muscu', 'Souplesse', 'Sport co', 'Plein air', 'Autre'];

// ─── Plan de repas imprimable (PDF via fenêtre d'impression) ───
// Génère un document HTML autonome au thème de l'app (bandeau vert profond,
// or, couleur d'accent par personne) puis déclenche window.print() — l'utilisateur
// enregistre en PDF. Pas de dépendance externe (CDN bloqués hors-ligne).
function htmlEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const MEAL_TYPE_META = { Matin: { c: '#3f9e63', ic: '☀️' }, Midi: { c: '#c79a3e', ic: '🍽️' }, Soir: { c: '#8a63b0', ic: '🌙' } };
const MEAL_PERSON_META = { dja: { label: 'Dja', c: '#7c5cf0' }, liika: { label: 'Liika', c: '#e0559b' }, couple: { label: 'Couple', c: '#c19a3d' } };
function buildMealPlanHtml(who, meals) {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const types = ['Matin', 'Midi', 'Soir'];
  const pm = MEAL_PERSON_META[who] || MEAL_PERSON_META.couple;
  const get = (j, t) => (meals || []).find(m => m.jour === j && m.type === t);
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const headRow = types.map(t => {
    const mt = MEAL_TYPE_META[t];
    return `<th class="th-type" style="border-bottom-color:${mt.c};color:${mt.c}"><span class="ic">${mt.ic}</span> ${t}</th>`;
  }).join('');
  const bodyRows = days.map((j, idx) => {
    const cells = types.map(t => {
      const m = get(j, t);
      if (!m || !(m.plat || '').trim()) return '<td class="cell empty">—</td>';
      const note = (m.note || '').trim();
      return `<td class="cell"><div class="plat">${htmlEsc(m.plat)}</div>${note ? `<div class="note">${htmlEsc(note)}</div>` : ''}</td>`;
    }).join('');
    return `<tr class="${idx % 2 ? 'alt' : ''}"><td class="day" style="border-left-color:${pm.c};color:${pm.c}">${j}</td>${cells}</tr>`;
  }).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Plan de repas — ${pm.label}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Helvetica Neue',Arial,sans-serif;color:#16261c;background:#fff;padding:34px 30px}
.band{background:linear-gradient(135deg,#0c1f16,#122b1e 55%,#0a1a10);border-radius:16px;padding:22px 26px;color:#f3efe2;position:relative;overflow:hidden;border:1px solid rgba(217,183,95,.35)}
.band:after{content:'';position:absolute;top:-50px;right:-30px;width:180px;height:180px;background:radial-gradient(circle,rgba(217,183,95,.18),transparent 70%)}
.eyebrow{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#d9b75f;font-weight:700;margin-bottom:8px}
.title{font-size:27px;font-weight:700;letter-spacing:.5px}
.title b{color:${pm.c}}
.sub{font-size:12px;color:#c2c9b6;margin-top:5px;font-style:italic}
table{width:100%;border-collapse:collapse;margin-top:22px}
th,td{text-align:left;vertical-align:top}
.th-day{padding:0 10px 10px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6b7d70;font-weight:600}
.th-type{padding:0 12px 9px;font-size:13px;font-weight:700;border-bottom:2px solid}
.th-type .ic{font-size:13px}
.day{padding:12px 10px;font-weight:700;font-size:13.5px;border-left:3px solid;white-space:nowrap;width:108px}
.cell{padding:11px 12px;font-size:12.5px;border-bottom:1px solid #ece7d6}
.plat{font-weight:600;color:#1d3326;line-height:1.3}
.note{font-size:10.5px;color:#7d8a7f;font-style:italic;margin-top:3px}
.empty{color:#cbd3c4}
tr.alt .cell{background:#faf8f0}
.foot{margin-top:22px;display:flex;justify-content:space-between;align-items:center;font-size:10.5px;color:#86a08f;border-top:1px solid #ece7d6;padding-top:12px}
.foot .heart{color:${pm.c}}
@page{size:A4 portrait;margin:14mm}
@media print{body{padding:0}}
</style></head>
<body>
<div class="band">
  <div class="eyebrow">🍃 Lanmou Douvan — Mix Vibz</div>
  <div class="title">Plan de repas — <b>${pm.label}</b></div>
  <div class="sub">Planning alimentaire de la semaine</div>
</div>
<table>
<thead><tr><th class="th-day">Jour</th>${headRow}</tr></thead>
<tbody>${bodyRows}</tbody>
</table>
<div class="foot"><span><span class="heart">♡</span> Préparé ensemble · Guadeloupe</span><span>Généré le ${today}</span></div>
</body></html>`;
}
function printMealPlan(who, meals) {
  const html = buildMealPlanHtml(who, meals);
  const w = window.open('', '_blank');
  if (!w) { alert('Autorise les fenêtres pop-up pour imprimer / exporter le plan de repas en PDF.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch (_) {} }, 350);
}
function MealsView({
  data,
  upsertMeal,
  deleteMeal
}) {
  const [who, setWho] = useState('dja');
  const meals = (who === 'couple' ? data.couple.meals : data[who].meals) || [];
  const getMeal = (jour, type) => meals.find(m => m.jour === jour && m.type === type);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const av = accent[who];
  const save = (jour, type, meal) => {
    if (editVal.trim()) {
      upsertMeal(who, {
        id: meal?.id || Date.now().toString(),
        jour,
        type,
        plat: editVal.trim(),
        note: meal?.note || ''
      });
    } else if (meal) {
      deleteMeal(who, meal.id);
    }
    setEditId(null);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      flexWrap: 'wrap',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow",
    style: {
      marginBottom: 6
    }
  }, "\uD83C\uDF43 Semaine en assiette"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      fontFamily: "'Cormorant Garamond',serif",
      marginBottom: 4,
      color: 'var(--text)'
    }
  }, "Plans de repas"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text3)'
    }
  }, "Planning alimentaire de la semaine")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => printMealPlan(who, meals),
    title: 'Imprimer / exporter le plan de repas en PDF',
    style: {
      padding: '5px 14px',
      borderRadius: 20,
      border: '1px solid var(--gold-border)',
      background: 'var(--gold-bg)',
      color: 'var(--gold)',
      fontSize: 12,
      cursor: 'pointer',
      transition: 'all .15s'
    }
  }, "⎙ Imprimer / PDF"), ['dja', 'liika', 'couple'].map(w => /*#__PURE__*/React.createElement("button", {
    key: w,
    onClick: () => setWho(w),
    style: {
      padding: '5px 14px',
      borderRadius: 20,
      border: who === w ? `1px solid ${accent[w]}` : '1px solid var(--border)',
      background: who === w ? accentBg[w] : 'transparent',
      color: who === w ? accent[w] : 'var(--text3)',
      fontSize: 12,
      cursor: 'pointer',
      transition: 'all .15s'
    }
  }, w === 'dja' ? 'Dja' : w === 'liika' ? 'Liika' : 'Couple')))), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px 12px',
      textAlign: 'left',
      color: 'var(--text3)',
      fontWeight: 500,
      borderBottom: '1px solid var(--border)',
      whiteSpace: 'nowrap'
    }
  }, "Jour"), TYPES.map(t => /*#__PURE__*/React.createElement("th", {
    key: t,
    style: {
      padding: '8px 12px',
      textAlign: 'left',
      color: 'var(--text3)',
      fontWeight: 500,
      borderBottom: '1px solid var(--border)',
      minWidth: 180
    }
  }, t)))), /*#__PURE__*/React.createElement("tbody", null, JOURS.map(jour => /*#__PURE__*/React.createElement("tr", {
    key: jour,
    style: {
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 12px',
      fontWeight: 600,
      color: av,
      whiteSpace: 'nowrap',
      width: 100
    }
  }, jour), TYPES.map(type => {
    const meal = getMeal(jour, type);
    const cid = meal?.id || `${jour}-${type}`;
    return /*#__PURE__*/React.createElement("td", {
      key: type,
      style: {
        padding: '4px 6px'
      }
    }, editId === cid ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("input", {
      autoFocus: true,
      value: editVal,
      onChange: e => setEditVal(e.target.value),
      onKeyDown: e => {
        if (e.key === 'Enter') save(jour, type, meal);
        if (e.key === 'Escape') setEditId(null);
      },
      style: {
        flex: 1,
        background: 'var(--bg4)',
        border: `1px solid ${av}`,
        borderRadius: 'var(--radius-xs)',
        padding: '4px 8px',
        color: 'var(--text)',
        fontSize: 12,
        outline: 'none'
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => save(jour, type, meal),
      style: {
        padding: '4px 8px',
        borderRadius: 'var(--radius-xs)',
        border: 'none',
        background: av,
        color: '#fff',
        cursor: 'pointer',
        fontSize: 11
      }
    }, "\u2713"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setEditId(null),
      style: {
        padding: '4px 6px',
        borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--border2)',
        background: 'transparent',
        color: 'var(--text3)',
        cursor: 'pointer',
        fontSize: 11
      }
    }, "\u2715")) : /*#__PURE__*/React.createElement("div", {
      onClick: () => {
        setEditId(cid);
        setEditVal(meal?.plat || '');
      },
      style: {
        padding: '6px 8px',
        borderRadius: 'var(--radius-xs)',
        background: meal ? 'var(--bg3)' : 'transparent',
        border: `1px dashed ${meal ? 'transparent' : 'var(--border)'}`,
        cursor: 'text',
        color: meal ? 'var(--text)' : 'var(--text3)',
        minHeight: 34,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, meal ? meal.plat : /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        opacity: .6
      }
    }, "+ Ajouter")));
  })))))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      marginTop: 10
    }
  }, "Cliquer pour modifier \xB7 Entr\xE9e pour valider \xB7 \xC9chap pour annuler \xB7 Vider pour supprimer"));
}
function BudgetView({
  data,
  upsertBudgetLine,
  deleteBudgetLine
}) {
  const [who, setWho] = useState('dja');
  const budget = (who === 'couple' ? data.couple.budget : data[who].budget) || {
    revenus: [],
    depenses: []
  };
  const revenus = budget.revenus || [];
  const depenses = budget.depenses || [];
  const totRev = revenus.reduce((s, r) => s + Number(r.montant), 0);
  const totDep = depenses.reduce((s, d) => s + Number(d.montant), 0);
  const balance = totRev - totDep;
  const av = accent[who];
  const CATS = ['Logement', 'Vie', 'Transport', 'Tech', 'Pro', 'Projets', 'Épargne', 'Autre'];
  function LineRow({
    line,
    type
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 0',
        borderBottom: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13
      }
    }, line.label), line.cat && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--text3)'
      }
    }, line.cat)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: type === 'revenus' ? 'var(--success)' : '#f87171',
        minWidth: 90,
        textAlign: 'right'
      }
    }, type === 'revenus' ? '+' : '-', Number(line.montant).toLocaleString('fr-FR'), " \u20AC"), /*#__PURE__*/React.createElement("button", {
      onClick: () => deleteBudgetLine(who, type, line.id),
      style: {
        background: 'none',
        border: 'none',
        color: 'var(--text3)',
        cursor: 'pointer',
        fontSize: 16,
        padding: '0 4px'
      }
    }, "\xD7"));
  }
  function AddRow({
    type
  }) {
    const [open, setOpen] = useState(false);
    const [f, setF] = useState({
      label: '',
      montant: '',
      cat: 'Autre'
    });
    if (!open) return /*#__PURE__*/React.createElement("button", {
      onClick: () => setOpen(true),
      style: {
        marginTop: 8,
        width: '100%',
        padding: '6px',
        borderRadius: 'var(--radius-xs)',
        border: `1px dashed ${av}`,
        background: 'transparent',
        color: av,
        cursor: 'pointer',
        fontSize: 12
      }
    }, "+ Ajouter");
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8,
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("input", {
      placeholder: "Libell\xE9",
      value: f.label,
      onChange: e => setF(p => ({
        ...p,
        label: e.target.value
      })),
      style: {
        flex: 2,
        minWidth: 100,
        padding: '5px 8px',
        borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--border2)',
        background: 'var(--bg4)',
        color: 'var(--text)',
        fontSize: 12,
        outline: 'none'
      }
    }), /*#__PURE__*/React.createElement("input", {
      type: "number",
      placeholder: "Montant \u20AC",
      value: f.montant,
      onChange: e => setF(p => ({
        ...p,
        montant: e.target.value
      })),
      style: {
        width: 90,
        padding: '5px 8px',
        borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--border2)',
        background: 'var(--bg4)',
        color: 'var(--text)',
        fontSize: 12,
        outline: 'none'
      }
    }), type === 'depenses' && /*#__PURE__*/React.createElement("select", {
      value: f.cat,
      onChange: e => setF(p => ({
        ...p,
        cat: e.target.value
      })),
      style: {
        padding: '5px 8px',
        borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--border2)',
        background: 'var(--bg4)',
        color: 'var(--text)',
        fontSize: 12,
        outline: 'none'
      }
    }, CATS.map(c => /*#__PURE__*/React.createElement("option", {
      key: c
    }, c))), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        if (f.label && f.montant) {
          upsertBudgetLine(who, type, {
            id: Date.now().toString(),
            label: f.label,
            montant: Number(f.montant),
            cat: f.cat
          });
          setOpen(false);
          setF({
            label: '',
            montant: '',
            cat: 'Autre'
          });
        }
      },
      style: {
        padding: '5px 10px',
        borderRadius: 'var(--radius-xs)',
        border: 'none',
        background: av,
        color: '#fff',
        cursor: 'pointer',
        fontSize: 12
      }
    }, "\u2713"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setOpen(false),
      style: {
        padding: '5px 10px',
        borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--border2)',
        background: 'transparent',
        color: 'var(--text3)',
        cursor: 'pointer',
        fontSize: 12
      }
    }, "\u2715"));
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      flexWrap: 'wrap',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow",
    style: {
      marginBottom: 6
    }
  }, "\uD83D\uDCB0 Finances"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      fontFamily: "'Cormorant Garamond',serif",
      marginBottom: 4,
      color: 'var(--text)'
    }
  }, "Budget"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text3)'
    }
  }, "Revenus, d\xE9penses et balance mensuelle")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, ['dja', 'liika', 'couple'].map(w => /*#__PURE__*/React.createElement("button", {
    key: w,
    onClick: () => setWho(w),
    style: {
      padding: '5px 14px',
      borderRadius: 20,
      border: who === w ? `1px solid ${accent[w]}` : '1px solid var(--border)',
      background: who === w ? accentBg[w] : 'transparent',
      color: who === w ? accent[w] : 'var(--text3)',
      fontSize: 12,
      cursor: 'pointer',
      transition: 'all .15s'
    }
  }, w === 'dja' ? 'Dja' : w === 'liika' ? 'Liika' : 'Couple')))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
      gap: 12,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
      borderRadius: 'var(--radius)',
      padding: 16,
      textAlign: 'center',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      marginBottom: 5,
      letterSpacing: '.06em',
      textTransform: 'uppercase'
    }
  }, "Revenus"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--success)'
    }
  }, "+", totRev.toLocaleString('fr-FR'), " \u20AC")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
      borderRadius: 'var(--radius)',
      padding: 16,
      textAlign: 'center',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      marginBottom: 5,
      letterSpacing: '.06em',
      textTransform: 'uppercase'
    }
  }, "D\xE9penses"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: '#f87171'
    }
  }, "-", totDep.toLocaleString('fr-FR'), " \u20AC")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
      borderRadius: 'var(--radius)',
      padding: 16,
      textAlign: 'center',
      border: `1px solid ${balance >= 0 ? 'var(--gold-border)' : 'rgba(248,113,113,.3)'}`,
      boxShadow: 'var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      marginBottom: 5,
      letterSpacing: '.06em',
      textTransform: 'uppercase'
    }
  }, "Balance"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: balance >= 0 ? 'var(--gold)' : '#f87171'
    }
  }, balance >= 0 ? '+' : '', balance.toLocaleString('fr-FR'), " \u20AC"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
      borderRadius: 'var(--radius)',
      padding: 20,
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      marginBottom: 12,
      color: 'var(--success)',
      letterSpacing: '.04em',
      textTransform: 'uppercase'
    }
  }, "Revenus"), revenus.map(r => /*#__PURE__*/React.createElement(LineRow, {
    key: r.id,
    line: r,
    type: "revenus"
  })), /*#__PURE__*/React.createElement(AddRow, {
    type: "revenus"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
      borderRadius: 'var(--radius)',
      padding: 20,
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontWeight: 600,
      marginBottom: 12,
      color: '#f87171',
      letterSpacing: '.04em',
      textTransform: 'uppercase',
      fontSize: 11
    }
  }, "D\xE9penses"), depenses.map(d => /*#__PURE__*/React.createElement(LineRow, {
    key: d.id,
    line: d,
    type: "depenses"
  })), /*#__PURE__*/React.createElement(AddRow, {
    type: "depenses"
  }))));
}
function VisionView({
  data,
  updateVision
}) {
  const [who, setWho] = useState('dja');
  const vision = (who === 'couple' ? data.couple.vision : data[who]?.vision) || '';
  const name = who === 'dja' ? data.dja.name : who === 'liika' ? data.liika.name : 'Dja & Liika';
  const av = accent[who];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      flexWrap: 'wrap',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow",
    style: {
      marginBottom: 6
    }
  }, "\u2726 Long terme"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      fontFamily: "'Cormorant Garamond',serif",
      marginBottom: 4,
      color: 'var(--text)'
    }
  }, "Vision"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text3)'
    }
  }, "Qui tu veux devenir \u2014 horizon 2027-2036")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, ['dja', 'liika', 'couple'].map(w => /*#__PURE__*/React.createElement("button", {
    key: w,
    onClick: () => setWho(w),
    style: {
      padding: '5px 14px',
      borderRadius: 20,
      border: who === w ? `1px solid ${accent[w]}` : '1px solid var(--border)',
      background: who === w ? accentBg[w] : 'transparent',
      color: who === w ? accent[w] : 'var(--text3)',
      fontSize: 12,
      cursor: 'pointer',
      transition: 'all .15s'
    }
  }, w === 'dja' ? 'Dja' : w === 'liika' ? 'Liika' : 'Couple')))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: `linear-gradient(135deg,${accentBg[who]},var(--bg2))`,
      borderRadius: 'var(--radius)',
      padding: 28,
      border: `1px solid ${accentBorder[who]}`,
      marginBottom: 20,
      boxShadow: 'var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginBottom: 14
    }
  }, "\u2726 Vision de ", name), /*#__PURE__*/React.createElement("textarea", {
    value: vision,
    onChange: e => updateVision(who, e.target.value),
    placeholder: "\xC9cris ta vision long-terme \u2014 qui tu veux \xEAtre, ce que tu veux construire, o\xF9 tu veux aller\u2026",
    rows: 7,
    style: {
      width: '100%',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--text)',
      fontSize: 17,
      lineHeight: 1.95,
      resize: 'none',
      fontFamily: "'Cormorant Garamond',serif",
      fontStyle: 'italic',
      fontWeight: 400
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
      gap: 12
    }
  }, [{
    icon: '🎯',
    label: 'Objectifs actifs',
    value: ((who === 'couple' ? data.couple.objectives : data[who]?.objectives) || []).filter(o => !o.done).length
  }, {
    icon: '✅',
    label: 'Terminés',
    value: ((who === 'couple' ? data.couple.objectives : data[who]?.objectives) || []).filter(o => o.done).length
  }, {
    icon: '💪',
    label: 'Séances sport',
    value: (() => {
      const sp = (who === 'couple' ? data.couple.sport : data[who]?.sport) || [];
      return sp.filter(s => s.fait).length + ' / ' + sp.length;
    })()
  }, {
    icon: '📝',
    label: 'Notes',
    value: ((who === 'couple' ? data.couple.notes : data[who]?.notes) || []).length
  }].map(({
    icon,
    label,
    value
  }) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20
    }
  }, icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--text3)',
      marginBottom: 3,
      letterSpacing: '.04em'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: 'var(--text)'
    }
  }, value))))));
}
function SportView({
  data,
  upsertSport,
  deleteSport
}) {
  const [who, setWho] = useState('dja');
  const sport = (who === 'couple' ? data.couple.sport : data[who]?.sport) || [];
  const av = accent[who];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    jour: 'Lundi',
    activite: '',
    duree: 30,
    intensite: 'Modérée',
    cat: 'Cardio'
  });
  const done = sport.filter(s => s.fait).length;
  const total = sport.length;
  const pctWeek = total ? Math.round(done / total * 100) : 0;
  const colorIntens = {
    Légère: 'var(--success)',
    Modérée: 'var(--accent-couple)',
    Intense: '#f87171'
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      flexWrap: 'wrap',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow",
    style: {
      marginBottom: 6
    }
  }, "\uD83D\uDCAA Corps en mouvement"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      fontFamily: "'Cormorant Garamond',serif",
      marginBottom: 4,
      color: 'var(--text)'
    }
  }, "Planning sportif"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text3)'
    }
  }, "Activit\xE9s physiques de la semaine")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, ['dja', 'liika', 'couple'].map(w => /*#__PURE__*/React.createElement("button", {
    key: w,
    onClick: () => setWho(w),
    style: {
      padding: '5px 14px',
      borderRadius: 20,
      border: who === w ? `1px solid ${accent[w]}` : '1px solid var(--border)',
      background: who === w ? accentBg[w] : 'transparent',
      color: who === w ? accent[w] : 'var(--text3)',
      fontSize: 12,
      cursor: 'pointer',
      transition: 'all .15s'
    }
  }, w === 'dja' ? 'Dja' : w === 'liika' ? 'Liika' : 'Couple')))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
      borderRadius: 'var(--radius)',
      padding: 20,
      marginBottom: 20,
      border: `1px solid ${accentBorder[who]}`,
      boxShadow: 'var(--shadow)',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(ProgressRing, {
    pct: pctWeek,
    size: 72,
    stroke: 6,
    color: av
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      fontWeight: 700
    }
  }, pctWeek, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      marginBottom: 4
    }
  }, done, " / ", total, " s\xE9ances cette semaine"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      background: 'var(--border2)',
      borderRadius: 3,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      width: `${pctWeek}%`,
      background: av,
      borderRadius: 3,
      transition: 'width .4s'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      marginTop: 10,
      fontSize: 12,
      color: 'var(--text3)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDFE2 L\xE9g\xE8re : ", sport.filter(s => s.intensite === 'Légère').length), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDFE1 Mod\xE9r\xE9e : ", sport.filter(s => s.intensite === 'Modérée').length), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD34 Intense : ", sport.filter(s => s.intensite === 'Intense').length))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowForm(p => !p),
    style: {
      padding: '8px 16px',
      borderRadius: 'var(--radius-sm)',
      border: 'none',
      background: av,
      color: '#fff',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 500,
      whiteSpace: 'nowrap'
    }
  }, "+ S\xE9ance")), showForm && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg3)',
      borderRadius: 'var(--radius)',
      padding: 20,
      marginBottom: 20,
      border: `1px solid ${accentBorder[who]}`,
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 2,
      minWidth: 140
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      marginBottom: 4
    }
  }, "Activit\xE9"), /*#__PURE__*/React.createElement("input", {
    value: form.activite,
    onChange: e => setForm(p => ({
      ...p,
      activite: e.target.value
    })),
    placeholder: "Course, yoga, natation\u2026",
    style: {
      width: '100%',
      padding: '7px 10px',
      borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--border2)',
      background: 'var(--bg4)',
      color: 'var(--text)',
      fontSize: 13,
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      marginBottom: 4
    }
  }, "Jour"), /*#__PURE__*/React.createElement("select", {
    value: form.jour,
    onChange: e => setForm(p => ({
      ...p,
      jour: e.target.value
    })),
    style: {
      padding: '7px 10px',
      borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--border2)',
      background: 'var(--bg4)',
      color: 'var(--text)',
      fontSize: 13,
      outline: 'none'
    }
  }, JOURS.map(j => /*#__PURE__*/React.createElement("option", {
    key: j
  }, j)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      marginBottom: 4
    }
  }, "Dur\xE9e (min)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: form.duree,
    onChange: e => setForm(p => ({
      ...p,
      duree: Number(e.target.value)
    })),
    min: 5,
    max: 180,
    style: {
      width: 80,
      padding: '7px 10px',
      borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--border2)',
      background: 'var(--bg4)',
      color: 'var(--text)',
      fontSize: 13,
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      marginBottom: 4
    }
  }, "Intensit\xE9"), /*#__PURE__*/React.createElement("select", {
    value: form.intensite,
    onChange: e => setForm(p => ({
      ...p,
      intensite: e.target.value
    })),
    style: {
      padding: '7px 10px',
      borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--border2)',
      background: 'var(--bg4)',
      color: 'var(--text)',
      fontSize: 13,
      outline: 'none'
    }
  }, INTENSITES.map(i => /*#__PURE__*/React.createElement("option", {
    key: i
  }, i)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (form.activite.trim()) {
        upsertSport(who, {
          id: Date.now().toString(),
          ...form,
          fait: false
        });
        setShowForm(false);
        setForm({
          jour: 'Lundi',
          activite: '',
          duree: 30,
          intensite: 'Modérée',
          cat: 'Cardio'
        });
      }
    },
    style: {
      padding: '7px 14px',
      borderRadius: 'var(--radius-xs)',
      border: 'none',
      background: av,
      color: '#fff',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 500
    }
  }, "Ajouter"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowForm(false),
    style: {
      padding: '7px 10px',
      borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--border2)',
      background: 'transparent',
      color: 'var(--text3)',
      cursor: 'pointer',
      fontSize: 13
    }
  }, "\u2715"))), JOURS.map(jour => {
    const seances = sport.filter(s => s.jour === jour);
    if (!seances.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: jour,
      style: {
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: av,
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", null, jour), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--text3)',
        fontWeight: 400
      }
    }, seances.filter(s => s.fait).length, "/", seances.length, " faites")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gap: 8
      }
    }, seances.map(s => /*#__PURE__*/React.createElement("div", {
      key: s.id,
      style: {
        background: 'var(--bg3)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: s.fait ? .7 : 1,
        transition: 'opacity .2s'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => upsertSport(who, {
        ...s,
        fait: !s.fait
      }),
      style: {
        width: 24,
        height: 24,
        minWidth: 24,
        borderRadius: 6,
        border: s.fait ? 'none' : '2px solid var(--border2)',
        background: s.fait ? 'var(--success)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all .2s'
      }
    }, s.fait && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--bg)',
        fontSize: 13,
        fontWeight: 700
      }
    }, "\u2713")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 500,
        textDecoration: s.fait ? 'line-through' : 'none',
        color: s.fait ? 'var(--text3)' : 'var(--text)'
      }
    }, s.activite), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text3)',
        marginTop: 2
      }
    }, s.duree, " min")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 20,
        background: 'var(--bg4)',
        color: colorIntens[s.intensite],
        fontWeight: 500
      }
    }, s.intensite), /*#__PURE__*/React.createElement("button", {
      onClick: () => deleteSport(who, s.id),
      style: {
        background: 'none',
        border: 'none',
        color: 'var(--text3)',
        cursor: 'pointer',
        fontSize: 16,
        padding: '0 2px'
      }
    }, "\xD7")))));
  }), !sport.length && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: 40,
      color: 'var(--text3)',
      fontSize: 14
    }
  }, "Aucune s\xE9ance planifi\xE9e \u2014 clique sur \"+ S\xE9ance\" pour commencer"));
}

// ─── Planning View ───
const PLAN_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const PLAN_DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const PLAN_CATEGORIES = {
  sport: {
    label: 'Sport',
    color: '#4ade80',
    icon: '💪'
  },
  pro: {
    label: 'Pro',
    color: '#60a5fa',
    icon: '💼'
  },
  famille: {
    label: 'Famille / Couple',
    color: '#f472b6',
    icon: '❤️'
  },
  nature: {
    label: 'Nature & Sorties',
    color: '#facc15',
    icon: '🌿'
  },
  culture: {
    label: 'Culture',
    color: '#c084fc',
    icon: '📚'
  },
  repos: {
    label: 'Récup & Bien-être',
    color: '#fb923c',
    icon: '🌙'
  }
};
const INITIAL_PLANNING = {
  0: [{
    time: '06:00',
    cat: 'sport',
    title: 'Running côtier',
    detail: 'Gosier ou Sainte-Anne, 30–45 min ensemble',
    who: 'both'
  }, {
    time: '08:00',
    cat: 'pro',
    title: 'Départ Liika (PL)',
    detail: 'Route du jour — trajets longue distance',
    who: 'liika'
  }, {
    time: '09:00',
    cat: 'pro',
    title: 'Studio / Direction artistique',
    detail: 'Projets ingé son / vidéaste / applis',
    who: 'dja'
  }, {
    time: '19:00',
    cat: 'famille',
    title: 'Dîner végétalien',
    detail: 'Cuisiner ensemble : recette de la semaine',
    who: 'both'
  }, {
    time: '21:00',
    cat: 'culture',
    title: 'Lecture ou film',
    detail: '15 min livre chacun ou épisode série',
    who: 'both'
  }],
  1: [{
    time: '06:30',
    cat: 'sport',
    title: 'Yoga & Mobilité',
    detail: '30 min chez vous — flexibilité + récup lombaires (PL)',
    who: 'both'
  }, {
    time: '08:00',
    cat: 'pro',
    title: 'Liika en route',
    detail: '',
    who: 'liika'
  }, {
    time: '09:30',
    cat: 'pro',
    title: 'Bloc créatif Dja',
    detail: 'Pomodoro x4 — développement applis / mix',
    who: 'dja'
  }, {
    time: '18:30',
    cat: 'sport',
    title: 'Musculation',
    detail: 'Salle ou cour — haut du corps + gainage',
    who: 'both'
  }, {
    time: '20:30',
    cat: 'famille',
    title: 'Soirée plateau',
    detail: 'Cuisine rapide, détente, échanges du jour',
    who: 'both'
  }],
  2: [{
    time: '06:00',
    cat: 'sport',
    title: 'Natation / Mer',
    detail: 'Plage Caravelle, Sainte-Anne — 45 min nage',
    who: 'both'
  }, {
    time: '09:00',
    cat: 'pro',
    title: 'Réunions / Clients Dja',
    detail: 'Visios, briefs, coordination projets',
    who: 'dja'
  }, {
    time: '10:00',
    cat: 'pro',
    title: 'Admin Liika',
    detail: 'Papiers transport, suivi camion, planning livraisons',
    who: 'liika'
  }, {
    time: '17:00',
    cat: 'nature',
    title: 'Rivière ou mangrove',
    detail: 'Bras-David, Dolé-les-Bains, ou Allée Dumanoir',
    who: 'both'
  }, {
    time: '20:00',
    cat: 'famille',
    title: 'Dîner romantique maison',
    detail: 'Recette végétalienne élaborée + bons ingrédients locaux',
    who: 'both'
  }],
  3: [{
    time: '06:30',
    cat: 'sport',
    title: 'Cardio HIIT',
    detail: '20 min — cour ou bord de mer',
    who: 'both'
  }, {
    time: '08:00',
    cat: 'pro',
    title: 'Liika départ',
    detail: '',
    who: 'liika'
  }, {
    time: '09:00',
    cat: 'pro',
    title: 'Dev & création Dja',
    detail: 'Focus profond — nouvelles features applis',
    who: 'dja'
  }, {
    time: '19:00',
    cat: 'culture',
    title: 'Club lecture / film',
    detail: '30 min lecture + discussion, ou film choisi ensemble',
    who: 'both'
  }, {
    time: '20:30',
    cat: 'famille',
    title: 'Planification semaine+1',
    detail: 'Sorties, courses, objectifs couple',
    who: 'both'
  }],
  4: [{
    time: '06:00',
    cat: 'sport',
    title: 'Randonnée légère',
    detail: 'La Soufrière, Chutes du Carbet, ou Forêt de Sofaïa',
    who: 'both'
  }, {
    time: '10:00',
    cat: 'pro',
    title: 'Wrap-up semaine Dja',
    detail: 'Bilan projets, mise à jour portfolio / GitHub',
    who: 'dja'
  }, {
    time: '10:00',
    cat: 'pro',
    title: 'Bilan Liika',
    detail: 'Km, dépenses, incidents, planning flotte',
    who: 'liika'
  }, {
    time: '18:00',
    cat: 'nature',
    title: 'Coucher de soleil',
    detail: 'Point des Châteaux, Vieux-Fort ou Deshaies',
    who: 'both'
  }, {
    time: '20:00',
    cat: 'famille',
    title: 'Soirée amis',
    detail: 'Inviter des proches ou sortie bar / restaurant vegan-friendly',
    who: 'both'
  }],
  5: [{
    time: '07:00',
    cat: 'sport',
    title: 'Sport intensif',
    detail: 'Vélo côtier, kayak, ou escalade Basse-Terre',
    who: 'both'
  }, {
    time: '10:30',
    cat: 'nature',
    title: 'Plage journée',
    detail: 'Plage de la Perle, Anse-Bertrand ou Petit-Havre',
    who: 'both'
  }, {
    time: '14:00',
    cat: 'culture',
    title: 'Marché / Exposition',
    detail: 'Marché de Saint-François, galerie, brocante ou festival',
    who: 'both'
  }, {
    time: '19:00',
    cat: 'famille',
    title: 'BBQ végétalien',
    detail: 'Légumes grillés, tofu fumé, brochettes banane-plantain',
    who: 'both'
  }, {
    time: '21:30',
    cat: 'culture',
    title: 'Film ou concert',
    detail: 'Cinéma, concert local, ou soirée ciné maison',
    who: 'both'
  }],
  6: [{
    time: '08:00',
    cat: 'repos',
    title: 'Grasse matinée',
    detail: 'Réveil sans alarme, petit-déjeuner élaboré',
    who: 'both'
  }, {
    time: '10:00',
    cat: 'sport',
    title: 'Yoga doux ensemble',
    detail: '45 min — stretching, respiration, connexion',
    who: 'both'
  }, {
    time: '12:00',
    cat: 'famille',
    title: 'Grand repas végétalien',
    detail: 'Recette nouvelle, préparation partagée, musique',
    who: 'both'
  }, {
    time: '15:00',
    cat: 'nature',
    title: 'Balade nature libre',
    detail: 'Jardins botaniques, réserve Cousteau, ou cascade',
    who: 'both'
  }, {
    time: '18:00',
    cat: 'repos',
    title: 'Bain, soin, détente',
    detail: 'Massage maison, huiles essentielles, bain au sel marin',
    who: 'both'
  }, {
    time: '20:00',
    cat: 'famille',
    title: 'Intention semaine',
    detail: 'Écrire chacun ses 3 intentions pour la semaine à venir',
    who: 'both'
  }]
};
const PLAN_WHO = {
  both: {
    label: 'Tous les deux',
    color: '#f472b6'
  },
  dja: {
    label: 'Dja',
    color: '#60a5fa'
  },
  liika: {
    label: 'Liika',
    color: '#4ade80'
  }
};
const OUTINGS = [{
  icon: '🏖️',
  title: 'Plages',
  places: ['Caravelle (Sainte-Anne)', 'Plage de la Perle (Deshaies)', 'Petit-Havre (Le Gosier)', 'Anse-Bertrand', 'Malendure (Bouillante)']
}, {
  icon: '🌊',
  title: 'Rivières & Cascades',
  places: ['Bras-David', 'Chutes du Carbet', 'Dolé-les-Bains', 'Saut de la Lézarde', 'Cascade aux Écrevisses']
}, {
  icon: '🏔️',
  title: 'Randonnées',
  places: ['La Soufrière (sommet)', 'Forêt de Sofaïa', 'Trace des Crêtes', 'Morne à Louis', 'Allée Dumanoir']
}, {
  icon: '🌅',
  title: 'Couchers de soleil',
  places: ['Point des Châteaux', 'Vieux-Fort', 'Désirade (vue)', 'Pointe Noire', 'Anse à la Barque']
}, {
  icon: '🎭',
  title: 'Sorties culturelles',
  places: ['Marché de Saint-François', 'Mémorial ACTe (Pointe-à-Pitre)', 'Festival Gwoka', 'Concerts locaux', 'Galeries Basse-Terre']
}];
const BOOKS = [{
  title: 'La Nourriture végétaliste créole',
  author: 'Collectif antillais',
  cat: 'cuisine'
}, {
  title: 'Atomic Habits',
  author: 'James Clear',
  cat: 'développement'
}, {
  title: 'Moi, Tituba…',
  author: 'Maryse Condé',
  cat: 'littérature'
}, {
  title: "The Artist's Way",
  author: 'Julia Cameron',
  cat: 'créativité'
}, {
  title: 'Daring Greatly',
  author: 'Brené Brown',
  cat: 'couple & croissance'
}];
const FILMS = [{
  title: 'Kirikou et la Sorcière',
  genre: 'Animation africaine — magie & origines'
}, {
  title: 'The Big Sick',
  genre: 'Romance — couple & différences culturelles'
}, {
  title: 'Seaspiracy',
  genre: 'Documentaire — océan & écologie'
}, {
  title: 'Klaus',
  genre: 'Animation — générosité & lien humain'
}, {
  title: 'Okja',
  genre: 'Drame végane — sensibilisation animale'
}, {
  title: 'Marriage Story',
  genre: 'Drame — communication & amour profond'
}];

// ─── Culture Guadeloupe ───
const CULTURE_EVENTS = [{
  id: 'ce1',
  titre: 'Carnaval de Guadeloupe',
  periode: 'Février — Mars',
  mois: 2,
  lieu: 'Pointe-à-Pitre & communes',
  desc: 'Le plus grand carnaval des Antilles françaises : défilés de chars, groupes à pied, masques traditionnels et musique Gwo Ka.',
  cat: 'Festivals',
  icon: '🎭',
  annuel: true
}, {
  id: 'ce2',
  titre: 'Festival Gwoka',
  periode: 'Juillet',
  mois: 7,
  lieu: 'Sainte-Anne',
  desc: 'Célébration du patrimoine immatériel de l\'UNESCO : tambours ka, chants lewòz et danses traditionnelles pendant 5 jours.',
  cat: 'Musique',
  icon: '🥁',
  annuel: true
}, {
  id: 'ce3',
  titre: 'Fête de la Musique',
  periode: '21 Juin',
  mois: 6,
  lieu: 'Guadeloupe entière',
  desc: 'Scènes ouvertes dans toutes les communes : zouk, gwo ka, reggae, jazz créole et musiques du monde au cœur de la Guadeloupe.',
  cat: 'Musique',
  icon: '🎶',
  annuel: true
}, {
  id: 'ce4',
  titre: 'Fête des Cuisinières',
  periode: 'Août',
  mois: 8,
  lieu: 'Pointe-à-Pitre',
  desc: 'Tradition séculaire : les cuisinières en tenue créole défilent vers la cathédrale, puis grand festin de cuisine créole traditionnelle.',
  cat: 'Gastronomie',
  icon: '👩‍🍳',
  annuel: true
}, {
  id: 'ce5',
  titre: 'Course de yoles traditionnelles',
  periode: 'Juillet — Août',
  mois: 7,
  lieu: 'Communes côtières',
  desc: 'Les embarcations de pêcheurs artisanaux en régate, symbole de la culture maritime guadeloupéenne.',
  cat: 'Sport & Mer',
  icon: '⛵',
  annuel: true
}, {
  id: 'ce6',
  titre: 'Festival Jazz aux Antilles',
  periode: 'Décembre',
  mois: 12,
  lieu: 'Pointe-à-Pitre',
  desc: 'Figures internationales et artistes locaux se retrouvent pour une semaine de jazz, blues et soul sur fond de Caraïbe.',
  cat: 'Musique',
  icon: '🎷',
  annuel: true
}, {
  id: 'ce7',
  titre: 'Festival International du Film de Guadeloupe',
  periode: 'Novembre',
  mois: 11,
  lieu: 'Basse-Terre & Pointe-à-Pitre',
  desc: 'Cinéma caribéen et francophone : films, courts-métrages, rencontres avec réalisateurs et projections en plein air.',
  cat: 'Art & Cinéma',
  icon: '🎬',
  annuel: true
}, {
  id: 'ce8',
  titre: 'Semaine Créole',
  periode: 'Octobre',
  mois: 10,
  lieu: 'Guadeloupe entière',
  desc: 'Valorisation de la langue et de la culture créole : contes, lectures, spectacles et gastronomie pendant une semaine.',
  cat: 'Patrimoine',
  icon: '📚',
  annuel: true
}, {
  id: 'ce9',
  titre: 'Mémorial ACTe — Expositions',
  periode: 'Toute l\'année',
  mois: 0,
  lieu: 'Pointe-à-Pitre',
  desc: 'Le plus grand centre caribéen de mémoire des traites et de l\'esclavage. Expositions immersives, ateliers pédagogiques.',
  cat: 'Art & Cinéma',
  icon: '🏛️',
  annuel: false
}, {
  id: 'ce10',
  titre: 'Toussaint créole',
  periode: 'Novembre',
  mois: 11,
  lieu: 'Cimetières de Guadeloupe',
  desc: 'Tradition unique : illumination nocturne des cimetières avec des milliers de bougies, veillée familiale et recueillement.',
  cat: 'Patrimoine',
  icon: '🕯️',
  annuel: true
}, {
  id: 'ce11',
  titre: 'Salon du Livre Guadeloupéen',
  periode: 'Avril',
  mois: 4,
  lieu: 'Pointe-à-Pitre',
  desc: 'Rencontre avec les auteurs antillais et caribéens : dédicaces, conférences et débats autour de la littérature créole.',
  cat: 'Art & Cinéma',
  icon: '📖',
  annuel: true
}, {
  id: 'ce12',
  titre: 'Grand Prix automobile de Guadeloupe',
  periode: 'Juin',
  mois: 6,
  lieu: 'Circuit du Lamentin',
  desc: 'Compétition de rallye et de circuit réunissant pilotes locaux et continentaux, ambiance festive garantie.',
  cat: 'Sport & Mer',
  icon: '🏎️',
  annuel: true
}, {
  id: 'ce13',
  titre: 'Fête de Marie-Galante — La Jeannette',
  periode: 'Juin',
  mois: 6,
  lieu: 'Grand-Bourg, Marie-Galante',
  desc: 'Festival de musique traditionnelle : gwo ka, biguine et quadrille sur l\'île aux cent moulins.',
  cat: 'Musique',
  icon: '🌴',
  annuel: true
}, {
  id: 'ce14',
  titre: 'Festival Couleurs Caraïbe',
  periode: 'Mai',
  mois: 5,
  lieu: 'Basse-Terre',
  desc: 'Rencontre des arts visuels caribéens : peinture, sculpture, photographie et street art dans les rues de Basse-Terre.',
  cat: 'Art & Cinéma',
  icon: '🎨',
  annuel: true
}, {
  id: 'ce15',
  titre: 'Fête Patronale de Sainte-Anne',
  periode: 'Juillet',
  mois: 7,
  lieu: 'Sainte-Anne',
  desc: 'Procession, messe en créole, exposition artisanale, marché nocturne et feux d\'artifice sur la plage.',
  cat: 'Patrimoine',
  icon: '✨',
  annuel: true
}, {
  id: 'ce16',
  titre: 'Rando Nocturne de la Soufrière',
  periode: 'Mai — Juin',
  mois: 5,
  lieu: 'La Soufrière, Basse-Terre',
  desc: 'Randonnée nocturne organisée vers le sommet du volcan, lever du soleil spectaculaire sur l\'archipel.',
  cat: 'Sport & Mer',
  icon: '🌋',
  annuel: true
}, {
  id: 'ce17',
  titre: 'Marché de Noël créole',
  periode: 'Décembre',
  mois: 12,
  lieu: 'Saint-François & communes',
  desc: 'Marchés artisanaux, spécialités locales (boudins, charandon, féroce), musique de Noël antillais.',
  cat: 'Gastronomie',
  icon: '🎄',
  annuel: true
}, {
  id: 'ce18',
  titre: 'Festival du Bœuf de Marie-Galante',
  periode: 'Août',
  mois: 8,
  lieu: 'Marie-Galante',
  desc: 'Fête de l\'élevage bovin traditionnel sur l\'île : concours, défilé de bœufs décorés et gastronomie locale.',
  cat: 'Gastronomie',
  icon: '🐂',
  annuel: true
}];
function CultureGwadView() {
  const CATS = ['Tous', 'Festivals', 'Musique', 'Gastronomie', 'Art & Cinéma', 'Patrimoine', 'Sport & Mer'];
  const CAT_COLORS = {
    Festivals: 'var(--accent-liika)',
    Musique: 'var(--gold)',
    Gastronomie: 'var(--success)',
    'Art & Cinéma': 'var(--accent-dja)',
    Patrimoine: '#fb923c',
    'Sport & Mer': '#38bdf8'
  };
  const [filterCat, setFilterCat] = useState('Tous');
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const filtered = filterCat === 'Tous' ? CULTURE_EVENTS : CULTURE_EVENTS.filter(e => e.cat === filterCat);
  const isCurrent = e => e.mois === currentMonth || e.mois === 0;
  const isSoon = e => !isCurrent(e) && (e.mois === currentMonth + 1 || currentMonth === 12 && e.mois === 1);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(135deg,rgba(217,183,95,.09),rgba(74,222,128,.06))',
      borderRadius: 'var(--radius)',
      padding: '24px',
      marginBottom: 20,
      border: '1px solid var(--gold-border)',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -50,
      right: -50,
      width: 200,
      height: 200,
      background: 'radial-gradient(circle,rgba(217,183,95,.08),transparent 70%)',
      borderRadius: '50%',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("p", {
    className: "eyebrow",
    style: {
      marginBottom: 8
    }
  }, "\uD83C\uDFAD Agenda culturel"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 26,
      fontFamily: "'Cormorant Garamond',serif",
      fontWeight: 600,
      color: 'var(--text)',
      marginBottom: 4,
      lineHeight: 1.2
    }
  }, "Culture Guadeloupe"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text3)',
      fontStyle: 'italic',
      fontFamily: "'Cormorant Garamond',serif"
    }
  }, "Festivals, musique, art et patrimoine de l'archipel \uD83C\uDF34")), /*#__PURE__*/React.createElement("div", {
    className: "scroll-x",
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 20,
      paddingBottom: 4
    }
  }, CATS.map(c => {
    const active = filterCat === c;
    const col = CAT_COLORS[c] || 'var(--text3)';
    return /*#__PURE__*/React.createElement("button", {
      key: c,
      onClick: () => setFilterCat(c),
      style: {
        flexShrink: 0,
        padding: '6px 14px',
        borderRadius: 20,
        border: `1px solid ${active ? col : 'var(--border)'}`,
        background: active ? col + '22' : 'transparent',
        color: active ? col : 'var(--text3)',
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: "'Space Mono',monospace",
        whiteSpace: 'nowrap',
        transition: 'all .2s',
        fontWeight: active ? 700 : 400
      }
    }, c);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 12
    }
  }, filtered.map((e, i) => {
    const col = CAT_COLORS[e.cat] || 'var(--text3)';
    const current = isCurrent(e);
    const soon = isSoon(e);
    return /*#__PURE__*/React.createElement("div", {
      key: e.id,
      style: {
        background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        border: `1px solid ${current ? col + '44' : 'var(--border)'}`,
        borderLeft: `3px solid ${col}`,
        boxShadow: current ? `0 4px 20px ${col}18` : 'var(--shadow)',
        animation: `fadeUp .35s ease ${i * .06}s both`,
        position: 'relative',
        overflow: 'hidden'
      }
    }, current && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 12,
        right: 12,
        fontSize: 9,
        fontFamily: "'Space Mono',monospace",
        background: col + '22',
        color: col,
        padding: '2px 8px',
        borderRadius: 10,
        letterSpacing: '.1em'
      }
    }, "\u25CF CE MOIS"), !current && soon && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 12,
        right: 12,
        fontSize: 9,
        fontFamily: "'Space Mono',monospace",
        background: 'var(--gold-bg)',
        color: 'var(--gold)',
        padding: '2px 8px',
        borderRadius: 10,
        letterSpacing: '.1em'
      }
    }, "\xC0 VENIR"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 24,
        lineHeight: 1,
        flexShrink: 0,
        marginTop: 2
      }
    }, e.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--text)',
        fontFamily: "'Playfair Display',serif",
        lineHeight: 1.2,
        marginBottom: 6,
        paddingRight: current || soon ? 60 : 0
      }
    }, e.titre), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        marginBottom: 8,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--gold)',
        fontFamily: "'Space Mono',monospace"
      }
    }, "\uD83D\uDCC5 ", e.periode), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--text3)',
        fontFamily: "'Space Mono',monospace"
      }
    }, "\uD83D\uDCCD ", e.lieu)), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12,
        color: 'var(--text2)',
        lineHeight: 1.65,
        marginBottom: 8
      }
    }, e.desc), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontFamily: "'Space Mono',monospace",
        color: col,
        background: col + '15',
        padding: '2px 8px',
        borderRadius: 8,
        border: `1px solid ${col}30`
      }
    }, e.cat), e.annuel && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontFamily: "'Space Mono',monospace",
        color: 'var(--text3)',
        background: 'var(--bg4)',
        padding: '2px 8px',
        borderRadius: 8
      }
    }, "Annuel")))));
  }), filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: 40,
      color: 'var(--text3)',
      fontFamily: "'Cormorant Garamond',serif",
      fontStyle: 'italic',
      fontSize: 16
    }
  }, "Aucun \xE9v\xE9nement dans cette cat\xE9gorie.")));
}

// ─── Route Liika ───
const ALERTES_FATIGUE = [{
  km: 200,
  type: 'pause',
  label: 'Pause recommandée',
  detail: '20 min minimum — sortir du camion, marcher, s\'étirer',
  urgent: false
}, {
  km: 400,
  type: 'pause',
  label: 'Grande pause + repas',
  detail: '45 min — manger assis, repos visuel, hydratation 500 ml',
  urgent: false
}, {
  km: 550,
  type: 'warn',
  label: 'Zone de vigilance',
  detail: 'Attention : concentration réduite. Ouvrir la fenêtre, boire de l\'eau, activer musique rythmée.',
  urgent: true
}, {
  km: 600,
  type: 'stop',
  label: 'ARRÊT IMPÉRATIF',
  detail: 'Dormir minimum 30 min. Ne pas ignorer cette alerte. La fatigue = danger réel.',
  urgent: true
}];
const CHECKLIST_DEPART = [{
  id: 'cd1',
  text: 'Thermos eau chaude + bouteille 1,5 L remplie'
}, {
  id: 'cd2',
  text: 'Tupperware repas préparé (recette créole du frigo)'
}, {
  id: 'cd3',
  text: 'Fruits frais + fruits secs + noix (snacks sains)'
}, {
  id: 'cd4',
  text: 'Coussin lombaire positionné dans le siège'
}, {
  id: 'cd5',
  text: 'Playlist ou podcast chargé pour la route'
}, {
  id: 'cd6',
  text: 'Heure de départ + itinéraire partagé avec Dja'
}, {
  id: 'cd7',
  text: 'Routine étirements 5 min faite avant montée'
}, {
  id: 'cd8',
  text: 'Téléphone chargé à 100 % + chargeur embarqué'
}];
const ETIREMENTS_PAUSE = [{
  nom: 'Rotation du cou',
  duree: '30 sec',
  detail: 'Cercles lents, gauche puis droite'
}, {
  nom: 'Épaules en arrière',
  duree: '20 sec',
  detail: '10 rotations lentes vers l\'arrière'
}, {
  nom: 'Étirement lombaires',
  duree: '40 sec',
  detail: 'Mains sur les hanches, inclinaison douce'
}, {
  nom: 'Quadriceps debout',
  duree: '30 sec/jambe',
  detail: 'Tenir la cheville, garder l\'équilibre'
}, {
  nom: 'Marche active',
  duree: '5 min',
  detail: 'Marcher vite autour du camion ou de l\'aire'
}, {
  nom: 'Respiration profonde',
  duree: '1 min',
  detail: '4 sec inspire, 4 sec expire — 3 cycles'
}];

// ─── Objectifs mensuels ───
const MOIS_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const CATS_OBJ_MENSUEL = ['Nature', 'Cuisine', 'Culture', 'Finances', 'Sport', 'Voyage', 'Couple', 'Famille'];

// ─── Maison ───
const DEFAULT_MAISON_TASKS = [
// ── Quotidiennement ──
{
  id: 'ht1',
  titre: 'Faire son lit',
  icon: '🛏️',
  heure: '08:00',
  freq: 'Quotidien',
  who: 'both'
}, {
  id: 'ht2',
  titre: 'Ranger, ramasser, trier, jeter ce qui traîne (sols & tables)',
  icon: '🧹',
  heure: '08:15',
  freq: 'Quotidien',
  who: 'both'
}, {
  id: 'ht3',
  titre: 'Nettoyer la salle de bain (éponge dédiée)',
  icon: '🚿',
  heure: '08:30',
  freq: 'Quotidien',
  who: 'both'
}, {
  id: 'ht4',
  titre: 'Nettoyer les toilettes (éponge dédiée)',
  icon: '🚽',
  heure: '08:45',
  freq: 'Quotidien',
  who: 'both'
}, {
  id: 'ht5',
  titre: 'Faire la vaisselle',
  icon: '🍽️',
  heure: '09:00',
  freq: 'Quotidien',
  who: 'both'
}, {
  id: 'ht6',
  titre: 'Ranger la vaisselle',
  icon: '🍴',
  heure: '09:15',
  freq: 'Quotidien',
  who: 'both'
}, {
  id: 'ht7',
  titre: 'Nettoyer les sols : couloir → salon → cuisine',
  icon: '🧽',
  heure: '09:30',
  freq: 'Quotidien',
  who: 'both'
}, {
  id: 'ht8',
  titre: 'Balayer l\'extérieur (cuisine, fenêtre, chambre, devant la porte)',
  icon: '🧺',
  heure: '10:00',
  freq: 'Quotidien',
  who: 'both'
},
// ── Début de soirée ──
{
  id: 'ht9',
  titre: 'Sortir la poubelle orange (lun. & ven. soir)',
  icon: '🗑️',
  heure: '19:00',
  freq: 'Quotidien',
  who: 'both'
}, {
  id: 'ht10',
  titre: 'Sortir la poubelle jaune (mer. soir)',
  icon: '♻️',
  heure: '19:00',
  freq: 'Quotidien',
  who: 'both'
}, {
  id: 'ht11',
  titre: 'Tri du linge sale — lessive dès 20h (heures creuses)',
  icon: '👕',
  heure: '20:00',
  freq: 'Quotidien',
  who: 'both'
},
// ── Tous les 2 jours (sauf s'il a plu) ──
{
  id: 'ht12',
  titre: 'Arroser les plantes (sauf s\'il a plu)',
  icon: '🪴',
  heure: '09:00',
  freq: 'Tous les 2 jours',
  who: 'both'
},
// ── 1 fois par semaine ──
{
  id: 'ht13',
  titre: 'Nettoyer les gouttières',
  icon: '🪣',
  heure: '10:00',
  freq: 'Hebdomadaire',
  who: 'both'
}, {
  id: 'ht14',
  titre: 'Retirer les toiles d\'araignées',
  icon: '🕸️',
  heure: '10:30',
  freq: 'Hebdomadaire',
  who: 'both'
}, {
  id: 'ht15',
  titre: 'Nettoyer le réfrigérateur',
  icon: '🧊',
  heure: '11:00',
  freq: 'Hebdomadaire',
  who: 'both'
}];
function MaisonView({
  maison,
  toggleMaisonTask,
  addMaisonTask,
  deleteMaisonTask,
  resetMaisonChecked
}) {
  const [activeFreq, setActiveFreq] = useState('Quotidien');
  const [addingTask, setAddingTask] = useState(false);
  const [addForm, setAddForm] = useState({
    titre: '',
    icon: '🏠',
    heure: '09:00',
    freq: 'Quotidien',
    who: 'both'
  });
  const [notifPerm, setNotifPerm] = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const maison_ = maison || {};
  const checked = maison_.checked || {};
  const custom = maison_.custom || [];
  const allTasks = [...DEFAULT_MAISON_TASKS, ...custom.filter(c => !DEFAULT_MAISON_TASKS.some(d => d.id === c.id))];

  // Ref always up-to-date for the interval (avoids stale closures)
  const stateRef = useRef({
    checked,
    allTasks
  });
  useEffect(() => {
    stateRef.current = {
      checked,
      allTasks
    };
  });

  // Daily auto-reset
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if ((maison_.lastReset || '') !== today) resetMaisonChecked(today);
  }, []);

  // Notification interval — runs once, reads fresh values via stateRef
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    const iv = setInterval(() => {
      if (Notification.permission !== 'granted') return;
      const {
        checked: chk,
        allTasks: tasks
      } = stateRef.current;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      tasks.filter(t => t.heure === hhmm && !chk[t.id]).forEach(t => {
        try {
          new Notification(`🏠 ${t.titre}`, {
            body: `Rappel ${t.freq.toLowerCase()} · Lanmou Douvan`
          });
        } catch (_) {}
      });
    }, 60000);
    return () => clearInterval(iv);
  }, []);
  const requestNotif = async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
  };
  const FREQS = ['Quotidien', 'Tous les 2 jours', 'Hebdomadaire', 'Mensuel'];
  const filtered = allTasks.filter(t => t.freq === activeFreq);
  const doneCount = filtered.filter(t => !!checked[t.id]).length;
  const pct = filtered.length ? Math.round(doneCount / filtered.length * 100) : 0;
  const WHO_LABELS = {
    dja: 'Dja',
    liika: 'Liika',
    both: 'Ensemble'
  };
  const WHO_COLORS = {
    dja: 'var(--accent-dja)',
    liika: 'var(--accent-liika)',
    both: 'var(--gold)'
  };
  const FREQ_COLORS = {
    'Quotidien': 'var(--success)',
    'Tous les 2 jours': 'var(--warn)',
    'Hebdomadaire': 'var(--gold)',
    'Mensuel': 'var(--accent-dja)'
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(135deg,rgba(74,222,128,.08),rgba(217,183,95,.06))',
      borderRadius: 'var(--radius)',
      padding: '22px 24px',
      marginBottom: 20,
      border: '1px solid rgba(74,222,128,.22)',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -40,
      right: -40,
      width: 180,
      height: 180,
      background: 'radial-gradient(circle,rgba(74,222,128,.08),transparent 70%)',
      borderRadius: '50%',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("p", {
    className: "eyebrow",
    style: {
      marginBottom: 8,
      color: 'var(--success)'
    }
  }, "\uD83C\uDFE0 Organisation"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 26,
      fontFamily: "'Cormorant Garamond',serif",
      fontWeight: 600,
      color: 'var(--text)',
      marginBottom: 4,
      lineHeight: 1.2
    }
  }, "T\xE2ches de la maison"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text3)',
      fontStyle: 'italic',
      fontFamily: "'Cormorant Garamond',serif",
      marginBottom: 14
    }
  }, "Votre foyer, organis\xE9 ensemble \u2661"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: requestNotif,
    style: {
      padding: '6px 14px',
      borderRadius: 20,
      border: `1px solid ${notifPerm === 'granted' ? 'var(--success)' : 'var(--border2)'}`,
      background: notifPerm === 'granted' ? 'var(--success-bg)' : 'transparent',
      color: notifPerm === 'granted' ? 'var(--success)' : 'var(--text3)',
      fontSize: 11,
      cursor: 'pointer',
      fontFamily: "'Space Mono',monospace",
      transition: 'all .2s'
    }
  }, notifPerm === 'granted' ? '🔔 Rappels actifs' : '🔕 Activer les rappels'), notifPerm === 'denied' && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: '#e05050',
      fontFamily: "'Space Mono',monospace"
    }
  }, "Autoriser dans les param\xE8tres du navigateur"))), /*#__PURE__*/React.createElement("div", {
    className: "scroll-x",
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 18
    }
  }, FREQS.map(f => {
    const active = activeFreq === f;
    const col = FREQ_COLORS[f];
    return /*#__PURE__*/React.createElement("button", {
      key: f,
      onClick: () => setActiveFreq(f),
      style: {
        flexShrink: 0,
        padding: '7px 16px',
        borderRadius: 20,
        border: `1px solid ${active ? col : 'var(--border)'}`,
        background: active ? col + '22' : 'transparent',
        color: active ? col : 'var(--text3)',
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: "'Space Mono',monospace",
        fontWeight: active ? 700 : 400,
        transition: 'all .2s'
      }
    }, f);
  })), filtered.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg3)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 18px',
      marginBottom: 18,
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      fontFamily: "'Space Mono',monospace"
    }
  }, doneCount, "/", filtered.length, " t\xE2ches ", activeFreq.toLowerCase(), "s"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: pct === 100 ? 'var(--success)' : 'var(--gold)',
      fontFamily: "'Space Mono',monospace"
    }
  }, pct, "%", pct === 100 ? ' 🎉' : '')), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 5,
      background: 'var(--bg4)',
      borderRadius: 4,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${pct}%`,
      background: pct === 100 ? 'linear-gradient(90deg,var(--success),#22c55e)' : 'linear-gradient(90deg,var(--gold),var(--gold2))',
      borderRadius: 4,
      transition: 'width .45s ease'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10,
      marginBottom: 20
    }
  }, filtered.map((task, i) => {
    const done = !!checked[task.id];
    const isCustom = !task.id.startsWith('ht');
    const wCol = WHO_COLORS[task.who || 'both'];
    return /*#__PURE__*/React.createElement("div", {
      key: task.id,
      onClick: () => toggleMaisonTask(task.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: done ? 'rgba(74,222,128,.05)' : 'linear-gradient(160deg,var(--bg3),var(--bg2))',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 16px',
        border: `1px solid ${done ? 'rgba(74,222,128,.25)' : 'var(--border)'}`,
        borderLeft: `3px solid ${done ? 'var(--success)' : FREQ_COLORS[task.freq]}`,
        cursor: 'pointer',
        transition: 'all .2s',
        animation: `fadeUp .3s ease ${i * .05}s both`,
        opacity: done ? .65 : 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 22,
        flexShrink: 0
      }
    }, task.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: done ? 'var(--text3)' : 'var(--text)',
        textDecoration: done ? 'line-through' : 'none',
        marginBottom: 4,
        transition: 'all .2s'
      }
    }, task.titre), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: 'var(--gold)',
        fontFamily: "'Space Mono',monospace"
      }
    }, "\u23F0 ", task.heure), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: wCol,
        background: wCol + '18',
        padding: '1px 8px',
        borderRadius: 8,
        fontFamily: "'Space Mono',monospace"
      }
    }, WHO_LABELS[task.who || 'both']))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0
      }
    }, done ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18
      }
    }, "\u2705") : /*#__PURE__*/React.createElement("div", {
      style: {
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: '2px solid var(--border2)',
        flexShrink: 0
      }
    }), isCustom && /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        deleteMaisonTask(task.id);
      },
      style: {
        background: 'none',
        border: 'none',
        color: 'var(--text3)',
        cursor: 'pointer',
        fontSize: 16,
        padding: '0 2px',
        lineHeight: 1
      }
    }, "\xD7")));
  }), filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: 32,
      color: 'var(--text3)',
      fontFamily: "'Cormorant Garamond',serif",
      fontStyle: 'italic',
      fontSize: 15
    }
  }, "Aucune t\xE2che ", activeFreq.toLowerCase(), ".")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAddingTask(p => !p),
    style: {
      padding: '8px 18px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--gold-border)',
      background: 'transparent',
      color: 'var(--gold)',
      cursor: 'pointer',
      fontSize: 12,
      fontFamily: "'Space Mono',monospace",
      letterSpacing: '.04em',
      marginBottom: addingTask ? 12 : 0,
      transition: 'all .2s'
    }
  }, "+ Ajouter une t\xE2che"), addingTask && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(217,183,95,.05)',
      borderRadius: 'var(--radius)',
      padding: 16,
      border: '1px solid var(--gold-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '44px 1fr',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: addForm.icon,
    onChange: e => setAddForm(p => ({
      ...p,
      icon: e.target.value
    })),
    style: {
      padding: '6px',
      borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--border2)',
      background: 'var(--bg3)',
      color: 'var(--text)',
      fontSize: 18,
      outline: 'none',
      textAlign: 'center'
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: addForm.titre,
    onChange: e => setAddForm(p => ({
      ...p,
      titre: e.target.value
    })),
    placeholder: "Nom de la t\xE2che",
    style: {
      padding: '7px 10px',
      borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--border2)',
      background: 'var(--bg3)',
      color: 'var(--text)',
      fontSize: 13,
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: addForm.heure,
    onChange: e => setAddForm(p => ({
      ...p,
      heure: e.target.value
    })),
    type: "time",
    style: {
      padding: '6px 8px',
      borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--border2)',
      background: 'var(--bg3)',
      color: 'var(--text)',
      fontSize: 12,
      outline: 'none',
      fontFamily: "'Space Mono',monospace"
    }
  }), /*#__PURE__*/React.createElement("select", {
    value: addForm.freq,
    onChange: e => setAddForm(p => ({
      ...p,
      freq: e.target.value
    })),
    style: {
      padding: '6px 8px',
      borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--border2)',
      background: 'var(--bg3)',
      color: 'var(--text)',
      fontSize: 12,
      outline: 'none'
    }
  }, FREQS.map(f => /*#__PURE__*/React.createElement("option", {
    key: f,
    value: f
  }, f))), /*#__PURE__*/React.createElement("select", {
    value: addForm.who,
    onChange: e => setAddForm(p => ({
      ...p,
      who: e.target.value
    })),
    style: {
      padding: '6px 8px',
      borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--border2)',
      background: 'var(--bg3)',
      color: 'var(--text)',
      fontSize: 12,
      outline: 'none'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "both"
  }, "Ensemble"), /*#__PURE__*/React.createElement("option", {
    value: "dja"
  }, "Dja"), /*#__PURE__*/React.createElement("option", {
    value: "liika"
  }, "Liika"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!addForm.titre.trim()) return;
      addMaisonTask({
        ...addForm,
        id: Date.now().toString()
      });
      setAddForm({
        titre: '',
        icon: '🏠',
        heure: '09:00',
        freq: 'Quotidien',
        who: 'both'
      });
      setAddingTask(false);
    },
    style: {
      flex: 1,
      padding: '8px',
      borderRadius: 'var(--radius-xs)',
      border: 'none',
      background: 'linear-gradient(135deg,var(--gold),var(--gold2))',
      color: '#06120d',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 700
    }
  }, "\u2713 Ajouter"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAddingTask(false),
    style: {
      padding: '8px 14px',
      borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--text3)',
      cursor: 'pointer',
      fontSize: 12
    }
  }, "\u2715"))));
}
function PlanningView({
  planning,
  togglePlanningCheck,
  addPlanningCustomItem,
  deletePlanningCustomItem
}) {
  const [activeDay, setActiveDay] = useState(0);
  const [activeTab, setActiveTab] = useState('planning');
  const [addingItem, setAddingItem] = useState(false);
  const [addForm, setAddForm] = useState({
    time: '09:00',
    cat: 'repos',
    title: '',
    detail: '',
    who: 'both'
  });
  const planDay = (planning || {})[activeDay] || {
    checked: {},
    custom: []
  };
  const checked = planDay.checked || {};
  const customItems = planDay.custom || [];
  const initItems = (INITIAL_PLANNING[activeDay] || []).map((it, i) => ({
    ...it,
    id: `i${activeDay}-${i}`
  }));
  const dayItems = [...initItems, ...customItems];
  const doneCount = dayItems.filter(it => !!checked[it.id]).length;
  const handleAdd = () => {
    if (!addForm.title.trim()) return;
    addPlanningCustomItem(activeDay, {
      ...addForm,
      id: Date.now().toString()
    });
    setAddForm({
      time: '09:00',
      cat: 'repos',
      title: '',
      detail: '',
      who: 'both'
    });
    setAddingItem(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Playfair Display','Georgia',serif",
      color: '#e8f5e0',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("style", null, `
.plan-tab-btn{transition:all .25s ease;cursor:pointer;border:none;}
.plan-tab-btn:hover{transform:translateY(-2px);}
.plan-day-btn{transition:all .2s ease;cursor:pointer;}
.plan-day-btn:hover{transform:scale(1.05);}
.plan-item-card{transition:all .2s ease;cursor:pointer;}
.plan-item-card:hover{transform:translateX(4px);}
.plan-outing-card{transition:all .25s ease;cursor:pointer;}
.plan-outing-card:hover{transform:translateY(-3px);}
@keyframes planFadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.plan-fade{animation:planFadeIn .4s ease forwards;}
@keyframes planPulse{0%,100%{opacity:1;}50%{opacity:.6;}}
.plan-heartbeat{animation:planPulse 2s infinite;}
`), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 20px 16px',
      borderBottom: '1px solid #1e3a2a',
      background: 'linear-gradient(180deg,#0a150e 0%,transparent 100%)',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 'var(--radius) var(--radius) 0 0',
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -40,
      right: -30,
      width: 180,
      height: 180,
      background: 'radial-gradient(circle,rgba(74,222,128,.08) 0%,transparent 70%)',
      borderRadius: '50%'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 10,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24
    },
    className: "plan-heartbeat"
  }, "\u2764\uFE0F"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Space Mono',monospace",
      fontSize: 9,
      color: '#4ade80',
      letterSpacing: 4,
      textTransform: 'uppercase',
      marginBottom: 2
    }
  }, "Lanmou Douvan"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 700,
      color: '#f0faf0',
      lineHeight: 1
    }
  }, "Liika & Dja"))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      fontSize: 12,
      color: '#6b9e7a',
      fontStyle: 'italic'
    }
  }, "Planning vie de couple \u2022 Guadeloupe \uD83C\uDF34"), /*#__PURE__*/React.createElement("div", {
    className: "scroll-x",
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 16,
      paddingBottom: 4
    }
  }, [{
    id: 'planning',
    label: '📅 Semaine'
  }, {
    id: 'sorties',
    label: '🌿 Sorties GWA'
  }, {
    id: 'culture',
    label: '📚 Culture'
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    className: "plan-tab-btn",
    onClick: () => setActiveTab(t.id),
    style: {
      flexShrink: 0,
      padding: '7px 14px',
      borderRadius: 20,
      fontSize: 11,
      fontFamily: "'Space Mono',monospace",
      whiteSpace: 'nowrap',
      background: activeTab === t.id ? '#4ade80' : 'rgba(255,255,255,.05)',
      color: activeTab === t.id ? '#0a0f0d' : '#8bb89a',
      fontWeight: activeTab === t.id ? 700 : 400,
      border: activeTab === t.id ? 'none' : '1px solid #1e3a2a'
    }
  }, t.label)))), activeTab === 'planning' && /*#__PURE__*/React.createElement("div", {
    className: "plan-fade"
  }, /*#__PURE__*/React.createElement("div", {
    className: "scroll-x",
    style: {
      padding: '14px 16px 8px',
      display: 'flex',
      gap: 6
    }
  }, PLAN_DAYS.map((d, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "plan-day-btn",
    onClick: () => {
      setActiveDay(i);
      setAddingItem(false);
    },
    style: {
      minWidth: 44,
      padding: '9px 5px',
      borderRadius: 10,
      border: 'none',
      background: activeDay === i ? 'linear-gradient(135deg,#4ade80,#22c55e)' : 'rgba(255,255,255,.04)',
      color: activeDay === i ? '#0a0f0d' : '#6b9e7a',
      fontFamily: "'Space Mono',monospace",
      fontSize: 10,
      fontWeight: 700,
      textAlign: 'center',
      boxShadow: activeDay === i ? '0 4px 14px rgba(74,222,128,.3)' : 'none',
      outline: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", null, d), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 7,
      marginTop: 2,
      opacity: .7
    }
  }, activeDay === i ? '●' : '○')))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px 6px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 18,
      color: '#b7f7c8',
      fontWeight: 700
    }
  }, PLAN_DAYS_FULL[activeDay]), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAddingItem(p => !p),
    style: {
      padding: '5px 12px',
      borderRadius: 20,
      border: '1px solid #4ade80',
      background: 'transparent',
      color: '#4ade80',
      cursor: 'pointer',
      fontSize: 11,
      fontFamily: "'Space Mono',monospace"
    }
  }, "+ Ajouter")), addingItem && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '0 16px 12px',
      background: 'rgba(74,222,128,.06)',
      borderRadius: 12,
      padding: 14,
      border: '1px solid #2d5a3d'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: addForm.time,
    onChange: e => setAddForm(p => ({
      ...p,
      time: e.target.value
    })),
    type: "time",
    style: {
      padding: '6px 10px',
      borderRadius: 8,
      border: '1px solid #2d5a3d',
      background: 'rgba(0,0,0,.3)',
      color: '#e8f5e0',
      fontSize: 12,
      outline: 'none',
      fontFamily: "'Space Mono',monospace"
    }
  }), /*#__PURE__*/React.createElement("select", {
    value: addForm.cat,
    onChange: e => setAddForm(p => ({
      ...p,
      cat: e.target.value
    })),
    style: {
      padding: '6px 10px',
      borderRadius: 8,
      border: '1px solid #2d5a3d',
      background: 'rgba(10,20,14,.9)',
      color: '#e8f5e0',
      fontSize: 12,
      outline: 'none'
    }
  }, Object.entries(PLAN_CATEGORIES).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, v.icon, " ", v.label))), /*#__PURE__*/React.createElement("input", {
    value: addForm.title,
    onChange: e => setAddForm(p => ({
      ...p,
      title: e.target.value
    })),
    placeholder: "Titre de l'activit\xE9",
    style: {
      gridColumn: '1/-1',
      padding: '6px 10px',
      borderRadius: 8,
      border: '1px solid #2d5a3d',
      background: 'rgba(0,0,0,.3)',
      color: '#e8f5e0',
      fontSize: 12,
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: addForm.detail,
    onChange: e => setAddForm(p => ({
      ...p,
      detail: e.target.value
    })),
    placeholder: "D\xE9tails (optionnel)",
    style: {
      gridColumn: '1/-1',
      padding: '6px 10px',
      borderRadius: 8,
      border: '1px solid #2d5a3d',
      background: 'rgba(0,0,0,.3)',
      color: '#e8f5e0',
      fontSize: 12,
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement("select", {
    value: addForm.who,
    onChange: e => setAddForm(p => ({
      ...p,
      who: e.target.value
    })),
    style: {
      padding: '6px 10px',
      borderRadius: 8,
      border: '1px solid #2d5a3d',
      background: 'rgba(10,20,14,.9)',
      color: '#e8f5e0',
      fontSize: 12,
      outline: 'none'
    }
  }, Object.entries(PLAN_WHO).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, v.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleAdd,
    style: {
      flex: 1,
      padding: '7px',
      borderRadius: 8,
      border: 'none',
      background: '#4ade80',
      color: '#0a0f0d',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 700
    }
  }, "\u2713 Ajouter"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAddingItem(false),
    style: {
      padding: '7px 12px',
      borderRadius: 8,
      border: '1px solid #2d5a3d',
      background: 'transparent',
      color: '#6b9e7a',
      cursor: 'pointer',
      fontSize: 12
    }
  }, "\u2715")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px 20px'
    }
  }, dayItems.map((item, idx) => {
    const cat = PLAN_CATEGORIES[item.cat] || PLAN_CATEGORIES.repos;
    const who = PLAN_WHO[item.who] || PLAN_WHO.both;
    const isDone = !!checked[item.id];
    const isCustom = !item.id.startsWith('i');
    return /*#__PURE__*/React.createElement("div", {
      key: item.id,
      className: "plan-item-card plan-fade",
      style: {
        display: 'flex',
        gap: 12,
        marginBottom: 12,
        animationDelay: `${idx * .06}s`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 40
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Space Mono',monospace",
        fontSize: 9,
        color: '#4b7a5c',
        marginBottom: 3,
        whiteSpace: 'nowrap'
      }
    }, item.time), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: isDone ? cat.color : 'transparent',
        border: `2px solid ${cat.color}`,
        flexShrink: 0,
        boxShadow: isDone ? `0 0 7px ${cat.color}60` : 'none',
        transition: 'all .2s'
      }
    }), idx < dayItems.length - 1 && /*#__PURE__*/React.createElement("div", {
      style: {
        width: 1,
        flex: 1,
        minHeight: 16,
        background: '#1e3a2a',
        marginTop: 3
      }
    })), /*#__PURE__*/React.createElement("div", {
      onClick: () => togglePlanningCheck(activeDay, item.id),
      style: {
        flex: 1,
        background: isDone ? 'rgba(74,222,128,.05)' : 'rgba(255,255,255,.03)',
        border: `1px solid ${isDone ? cat.color + '40' : '#1a3028'}`,
        borderLeft: `3px solid ${cat.color}`,
        borderRadius: 10,
        padding: '10px 12px',
        opacity: isDone ? .65 : 1,
        transition: 'all .2s',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, cat.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: isDone ? '#4b7a5c' : '#d4f5df',
        textDecoration: isDone ? 'line-through' : 'none',
        fontFamily: "'Playfair Display',serif"
      }
    }, item.title)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 5
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        fontFamily: "'Space Mono',monospace",
        color: who.color,
        background: who.color + '18',
        padding: '2px 7px',
        borderRadius: 10,
        flexShrink: 0
      }
    }, who.label), isCustom && /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        deletePlanningCustomItem(activeDay, item.id);
      },
      style: {
        background: 'none',
        border: 'none',
        color: '#4b7a5c',
        cursor: 'pointer',
        fontSize: 14,
        padding: '0 2px',
        lineHeight: 1
      }
    }, "\xD7"))), item.detail && /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '5px 0 0 21px',
        fontSize: 11,
        color: '#5c8a6e',
        lineHeight: 1.5,
        fontStyle: 'italic'
      }
    }, item.detail), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 7,
        marginLeft: 21,
        display: 'inline-block',
        fontSize: 8,
        fontFamily: "'Space Mono',monospace",
        color: cat.color,
        background: cat.color + '15',
        padding: '2px 7px',
        borderRadius: 7
      }
    }, cat.label)));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(255,255,255,.03)',
      border: '1px solid #1e3a2a',
      borderRadius: 12,
      padding: 14,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Space Mono',monospace",
      fontSize: 9,
      color: '#4ade80',
      marginBottom: 8,
      letterSpacing: 2
    }
  }, "PROGRESSION DU JOUR"), (() => {
    const total = dayItems.length;
    const pct = total > 0 ? Math.round(doneCount / total * 100) : 0;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: '#6b9e7a'
      }
    }, doneCount, "/", total, " activit\xE9s"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Space Mono',monospace",
        fontSize: 13,
        color: '#4ade80',
        fontWeight: 700
      }
    }, pct, "%")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 5,
        background: '#1a3028',
        borderRadius: 4,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        width: `${pct}%`,
        background: 'linear-gradient(90deg,#4ade80,#22c55e)',
        borderRadius: 4,
        transition: 'width .4s ease',
        boxShadow: '0 0 10px rgba(74,222,128,.45)'
      }
    })));
  })()))), activeTab === 'sorties' && /*#__PURE__*/React.createElement("div", {
    className: "plan-fade",
    style: {
      padding: '18px 16px 20px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '0 0 5px',
      fontSize: 18,
      color: '#b7f7c8'
    }
  }, "Sorties Guadeloupe"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 16px',
      fontSize: 12,
      color: '#5c8a6e',
      fontStyle: 'italic'
    }
  }, "Vos spots favoris pour explorer l'archipel ensemble \uD83C\uDF0A"), OUTINGS.map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "plan-outing-card",
    style: {
      background: 'rgba(255,255,255,.03)',
      border: '1px solid #1a3028',
      borderRadius: 14,
      padding: 14,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20
    }
  }, o.icon), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: '#d4f5df'
    }
  }, o.title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7
    }
  }, o.places.map((p, j) => /*#__PURE__*/React.createElement("span", {
    key: j,
    style: {
      fontSize: 10,
      fontFamily: "'Space Mono',monospace",
      background: 'rgba(74,222,128,.1)',
      color: '#4ade80',
      padding: '3px 10px',
      borderRadius: 18,
      border: '1px solid #2d5a3d'
    }
  }, p))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(135deg,rgba(244,114,182,.08),rgba(74,222,128,.05))',
      border: '1px solid #3a1a2a',
      borderRadius: 14,
      padding: 14,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      marginBottom: 7
    }
  }, "\uD83C\uDF89 ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: '#f9c8e0'
    }
  }, "Sorties entre amis")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7
    }
  }, ['Barbecue plage', 'Soirée dominos', 'Rando groupe', 'Pique-nique rivière', 'Karaoké zouk', 'Resto vegan friendly', 'Sortie kayak collectif'].map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontSize: 10,
      background: 'rgba(244,114,182,.12)',
      color: '#f472b6',
      padding: '3px 10px',
      borderRadius: 18,
      fontFamily: "'Space Mono',monospace",
      border: '1px solid #6b1e4a'
    }
  }, s))))), activeTab === 'culture' && /*#__PURE__*/React.createElement("div", {
    className: "plan-fade",
    style: {
      padding: '18px 16px 20px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '0 0 5px',
      fontSize: 18,
      color: '#b7f7c8'
    }
  }, "Espace Culture"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 16px',
      fontSize: 12,
      color: '#5c8a6e',
      fontStyle: 'italic'
    }
  }, "Livres & films \xE0 partager ensemble \uD83C\uDF19"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginBottom: 12,
      fontFamily: "'Space Mono',monospace",
      fontSize: 10,
      color: '#c084fc',
      letterSpacing: 2
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCD6"), " LISTE DE LECTURE"), BOOKS.map((b, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "plan-item-card",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'rgba(192,132,252,.05)',
      border: '1px solid #2a1a3a',
      borderLeft: '3px solid #c084fc',
      borderRadius: 10,
      padding: '11px 12px',
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: '#e8d5ff',
      marginBottom: 2
    }
  }, b.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#7a5a9a',
      fontStyle: 'italic'
    }
  }, b.author)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 8,
      fontFamily: "'Space Mono',monospace",
      color: '#c084fc',
      background: 'rgba(192,132,252,.12)',
      padding: '2px 7px',
      borderRadius: 9
    }
  }, b.cat)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginBottom: 12,
      fontFamily: "'Space Mono',monospace",
      fontSize: 10,
      color: '#facc15',
      letterSpacing: 2
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83C\uDFAC"), " S\xC9LECTION FILMS"), FILMS.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "plan-item-card",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'rgba(250,204,21,.04)',
      border: '1px solid #2a2010',
      borderLeft: '3px solid #facc15',
      borderRadius: 10,
      padding: '11px 12px',
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      minWidth: 24
    }
  }, "\uD83C\uDF9E\uFE0F"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: '#fef9e0',
      marginBottom: 2
    }
  }, f.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#7a6a3a',
      fontStyle: 'italic'
    }
  }, f.genre)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #1a3028',
      padding: '10px 16px',
      display: 'flex',
      justifyContent: 'center',
      gap: 14,
      flexWrap: 'wrap'
    }
  }, Object.entries(PLAN_WHO).map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: v.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontFamily: "'Space Mono',monospace",
      color: '#4b6a55'
    }
  }, v.label)))));
}

// ─── DrevmCook View ───
// ─── CSV recettes (export / import) ───
// Colonnes : id, nom, categorie, tags, ingredients, preparation, apports, budget
// tags séparés par ";"  ·  ingredients séparés par " | "
const RECIPE_CSV_COLS = ['id', 'nom', 'categorie', 'tags', 'ingredients', 'preparation', 'apports', 'budget'];
function csvCell(v) { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function recipesToCsv(list) {
  const rows = (list || []).map(r => [r.id, r.nom, r.categorie, (r.tags || []).join('; '), (r.ingredients || []).join(' | '), r.preparation, r.apports, r.budget].map(csvCell).join(','));
  return [RECIPE_CSV_COLS.join(','), ...rows].join('\r\n');
}
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else { if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c; }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function csvToRecipes(text) {
  const rows = parseCsv(text).filter(r => r.some(c => (c || '').trim() !== ''));
  if (rows.length < 1) return [];
  const head = rows[0].map(c => c.trim().toLowerCase());
  const at = (cols, name) => { const i = head.indexOf(name); return i >= 0 ? (cols[i] || '').trim() : ''; };
  return rows.slice(1).map(cols => {
    const nom = at(cols, 'nom'); if (!nom) return null;
    return {
      id: at(cols, 'id') || ('csv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)),
      nom,
      categorie: at(cols, 'categorie') || 'Salés',
      tags: at(cols, 'tags').split(';').map(t => t.trim()).filter(Boolean),
      ingredients: at(cols, 'ingredients').split(/[|\n]/).map(t => t.trim()).filter(Boolean),
      preparation: at(cols, 'preparation'),
      apports: at(cols, 'apports'),
      budget: at(cols, 'budget')
    };
  }).filter(Boolean);
}

// ─── Export ICS (calendrier) ───
// Rassemble les données datées (ferments, objectifs mensuels, repas & sport hebdo)
// dans un fichier .ics standard importable dans Google/Apple/Outlook Calendar.
const ICS_DAY_CODE = { Lundi: 'MO', Mardi: 'TU', Mercredi: 'WE', Jeudi: 'TH', Vendredi: 'FR', Samedi: 'SA', Dimanche: 'SU' };
const ICS_DAY_INDEX = { Dimanche: 0, Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6 };
const ICS_MEAL_TIME = { Matin: '080000', Midi: '120000', Soir: '193000' };
function icsEscape(v) {
  return String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
function icsFold(line) {
  if (line.length <= 73) return line;
  let out = '', i = 0;
  while (i < line.length) { out += (i === 0 ? '' : '\r\n ') + line.slice(i, i + 73); i += 73; }
  return out;
}
function icsDate(iso) { return String(iso || '').slice(0, 10).replace(/-/g, ''); }
function icsDateAddDays(iso, n) {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}
function icsStamp() { return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function icsNextWeekdayIso(dayName) {
  const target = ICS_DAY_INDEX[dayName];
  if (target == null) return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + ((target - d.getDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}
function buildIcsEvents(data, opts) {
  const o = opts || {};
  const data2 = data || {};
  const ev = [];
  const dayMs = 86400000;
  if (o.ferments) {
    (data2.ferments || []).forEach(f => {
      if (!f.startDate) return;
      const start = new Date(`${f.startDate}T00:00:00`);
      if (isNaN(start.getTime())) return;
      const dur = Math.max(1, Number(f.durationDays) || 1);
      const targetIso = new Date(start.getTime() + dur * dayMs).toISOString().slice(0, 10);
      ev.push({ uid: 'ferment-' + f.id + '@lanmou-douvan', startIso: targetIso, summary: '🫙 ' + (f.nom || 'Ferment') + ' prêt', description: (f.type ? f.type + '. ' : '') + (f.notes || '') });
    });
  }
  if (o.objMensuels) {
    ((data2.couple || {}).objMensuels || []).forEach(m => {
      if (m.mois == null || m.annee == null) return;
      const startIso = `${m.annee}-${String(m.mois + 1).padStart(2, '0')}-01`;
      ev.push({ uid: 'objm-' + m.id + '@lanmou-douvan', startIso, summary: '🎯 ' + (m.titre || 'Objectif'), description: (m.categorie ? m.categorie + '. ' : '') + (m.detail || '') });
    });
  }
  if (o.meals) {
    ['dja', 'liika'].forEach(who => {
      ((data2[who] || {}).meals || []).forEach(m => {
        if (!ICS_DAY_CODE[m.jour]) return;
        ev.push({ uid: 'meal-' + who + '-' + m.id + '@lanmou-douvan', recurDay: m.jour, time: ICS_MEAL_TIME[m.type] || '120000', durationMin: 45, summary: '🍽 ' + (who === 'dja' ? 'Dja' : 'Liika') + ' · ' + (m.plat || 'Repas'), description: (m.type || '') + (m.note ? ' — ' + m.note : '') });
      });
    });
  }
  if (o.sport) {
    ['dja', 'liika'].forEach(who => {
      ((data2[who] || {}).sport || []).forEach(s => {
        if (!ICS_DAY_CODE[s.jour]) return;
        ev.push({ uid: 'sport-' + who + '-' + s.id + '@lanmou-douvan', recurDay: s.jour, time: '180000', durationMin: Math.max(15, Number(s.duree) || 30), summary: '💪 ' + (who === 'dja' ? 'Dja' : 'Liika') + ' · ' + (s.activite || 'Sport'), description: (s.intensite || '') + (s.duree ? ' · ' + s.duree + ' min' : '') });
      });
    });
  }
  if (o.medical) {
    ((data2.couple || {}).medical || []).forEach(m => {
      ev.push(medicalToIcsEvent(m));
    });
  }
  return ev.filter(Boolean);
}
// Convertit un RDV médical en événement ICS (journée entière). Renvoie null si pas de date.
function medicalToIcsEvent(m) {
  if (!m || !m.date) return null;
  const who = m.qui && m.qui !== 'Couple' ? m.qui + ' · ' : '';
  return {
    uid: 'medical-' + m.id + '@lanmou-douvan',
    startIso: m.date,
    summary: '🩺 ' + who + (m.titre || 'RDV médical'),
    description: [m.medecin, m.notes].filter(Boolean).join(' — ')
  };
}
// Télécharge un tableau d'événements sous forme de fichier .ics.
function downloadIcs(events, filename) {
  const blob = new Blob([eventsToIcs(events)], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename || 'lanmou-douvan.ics'; a.click();
  URL.revokeObjectURL(url);
}
function eventsToIcs(events) {
  const stamp = icsStamp();
  const pad = n => String(n).padStart(2, '0');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lanmou Douvan//Mix Vibz//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Lanmou Douvan — Mix Vibz'];
  (events || []).forEach((evnt, idx) => {
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + (evnt.uid || stamp + '-' + idx + '@lanmou-douvan'));
    lines.push('DTSTAMP:' + stamp);
    if (evnt.recurDay) {
      const startIso = icsNextWeekdayIso(evnt.recurDay);
      const time = evnt.time || '090000';
      const startD = new Date(`${startIso}T${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`);
      const endD = new Date(startD.getTime() + Math.max(5, evnt.durationMin || 30) * 60000);
      const endStr = `${endD.getFullYear()}${pad(endD.getMonth() + 1)}${pad(endD.getDate())}T${pad(endD.getHours())}${pad(endD.getMinutes())}00`;
      lines.push('DTSTART:' + startIso.replace(/-/g, '') + 'T' + time);
      lines.push('DTEND:' + endStr);
      lines.push('RRULE:FREQ=WEEKLY;BYDAY=' + ICS_DAY_CODE[evnt.recurDay]);
    } else {
      lines.push('DTSTART;VALUE=DATE:' + icsDate(evnt.startIso));
      lines.push('DTEND;VALUE=DATE:' + icsDateAddDays(evnt.startIso, 1));
    }
    lines.push('SUMMARY:' + icsEscape(evnt.summary));
    if (evnt.description && evnt.description.trim()) lines.push('DESCRIPTION:' + icsEscape(evnt.description.trim()));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.map(icsFold).join('\r\n');
}

function CalendarView({ data }) {
  const h = React.createElement;
  const [opts, setOpts] = useState({ ferments: true, objMensuels: true, meals: false, sport: false, medical: true });
  const sources = [
    { key: 'ferments', label: 'Ferments (date « prêt »)', icon: '🫙' },
    { key: 'objMensuels', label: 'Objectifs du mois', icon: '🎯' },
    { key: 'medical', label: 'Suivi médical (RDV)', icon: '🩺' },
    { key: 'meals', label: 'Repas hebdo (récurrent)', icon: '🍽' },
    { key: 'sport', label: 'Sport hebdo (récurrent)', icon: '💪' }
  ];
  const events = useMemo(() => buildIcsEvents(data, opts), [data, opts]);
  const toggle = key => setOpts(prev => ({ ...prev, [key]: !prev[key] }));
  const exportIcs = () => {
    if (!events.length) { alert('Aucun événement à exporter. Active au moins une source avec des données datées.'); return; }
    downloadIcs(events, 'lanmou-douvan.ics');
  };
  const fmtFr = iso => {
    const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  return h('div', null,
    h('div', { style: { marginBottom: 24 } },
      h('div', { className: 'eyebrow', style: { marginBottom: 8 } }, 'Calendrier'),
      h('h2', { style: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 500, marginBottom: 6 } }, '📅 Calendrier exportable'),
      h('p', { style: { color: 'var(--text3)', fontSize: 14, maxWidth: 560 } }, 'Génère un fichier .ics importable dans Google Agenda, Apple Calendrier ou Outlook. Choisis les sources puis exporte.')
    ),
    h('div', { className: 'lx-card', style: { padding: 20, marginBottom: 20 } },
      h('div', { style: { fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 14 } }, 'Sources à inclure'),
      h('div', { style: { display: 'grid', gap: 10 } },
        sources.map(s => h('label', {
          key: s.key,
          style: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: opts[s.key] ? 'var(--gold-bg)' : 'transparent', border: `1px solid ${opts[s.key] ? 'var(--gold-border)' : 'var(--border)'}`, transition: 'background .15s, border .15s' }
        },
          h('input', { type: 'checkbox', checked: opts[s.key], onChange: () => toggle(s.key), style: { width: 18, height: 18, accentColor: 'var(--gold)', cursor: 'pointer' } }),
          h('span', { style: { fontSize: 18 } }, s.icon),
          h('span', { style: { fontSize: 14, color: opts[s.key] ? 'var(--text)' : 'var(--text2)' } }, s.label)
        ))
      )
    ),
    h('div', { className: 'lx-card', style: { padding: 20, marginBottom: 20 } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 } },
        h('div', { style: { fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text3)' } }, 'Aperçu · ' + events.length + ' événement' + (events.length > 1 ? 's' : '')),
        h('button', {
          onClick: exportIcs,
          disabled: !events.length,
          style: { fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-border)', background: events.length ? 'var(--gold)' : 'var(--bg3)', color: events.length ? '#06120d' : 'var(--text3)', cursor: events.length ? 'pointer' : 'not-allowed' }
        }, '⬇ Exporter .ics')
      ),
      events.length
        ? h('div', { style: { display: 'grid', gap: 8 } },
            events.slice(0, 40).map((evnt, i) => h('div', {
              key: evnt.uid || i,
              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius-xs)', background: 'var(--bg2)', border: '1px solid var(--border)' }
            },
              h('span', { style: { fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, evnt.summary),
              h('span', { style: { fontFamily: "'Space Mono', monospace", fontSize: 12, color: 'var(--gold)', flexShrink: 0 } }, evnt.recurDay ? 'Chaque ' + evnt.recurDay.toLowerCase() : fmtFr(evnt.startIso))
            ))
          )
        : h('div', { style: { padding: '20px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 14 } }, 'Aucun événement. Active une source ou ajoute des données datées.'),
      events.length > 40 ? h('div', { style: { marginTop: 10, fontSize: 12, color: 'var(--text3)', textAlign: 'center' } }, '… et ' + (events.length - 40) + ' de plus dans le fichier.') : null
    )
  );
}

// ─── Module Courses ───
const COURSE_RAYONS = ['Fruits & Légumes', 'Boucherie & Poisson', 'Crèmerie & Frais', 'Épicerie salée', 'Épicerie sucrée', 'Boissons', 'Surgelés', 'Boulangerie', 'Hygiène & Maison', 'Autre'];
const COURSE_RAYON_ICON = { 'Fruits & Légumes': '🥬', 'Boucherie & Poisson': '🥩', 'Crèmerie & Frais': '🧀', 'Épicerie salée': '🥫', 'Épicerie sucrée': '🍫', 'Boissons': '🧃', 'Surgelés': '🧊', 'Boulangerie': '🥖', 'Hygiène & Maison': '🧼', 'Autre': '🛒' };
const COURSE_UNITES = ['', 'u', 'g', 'kg', 'mL', 'L', 'pq', 'boîte', 'botte'];
const RAYON_KEYWORDS = [
  ['Fruits & Légumes', ['tomate', 'salade', 'carotte', 'oignon', 'ail', 'citron', 'pomme', 'banane', 'mangue', 'courgette', 'poivron', 'épinard', 'chou', 'brocoli', 'patate', 'pomme de terre', 'avocat', 'concombre', 'persil', 'coriandre', 'gingembre', 'légume', 'fruit', 'champignon', 'betterave', 'radis', 'céleri', 'poireau', 'piment']],
  ['Boucherie & Poisson', ['poulet', 'boeuf', 'bœuf', 'porc', 'agneau', 'dinde', 'viande', 'steak', 'poisson', 'saumon', 'thon', 'crevette', 'jambon', 'lardon', 'saucisse', 'escalope']],
  ['Crèmerie & Frais', ['lait', 'yaourt', 'fromage', 'beurre', 'crème', 'oeuf', 'œuf', 'tofu', 'mozzarella', 'feta', 'parmesan']],
  ['Épicerie salée', ['riz', 'pâte', 'pates', 'farine', 'huile', 'sel', 'poivre', 'épice', 'conserve', 'haricot', 'lentille', 'pois chiche', 'quinoa', 'semoule', 'bouillon', 'soja', 'vinaigre', 'moutarde', 'olive']],
  ['Épicerie sucrée', ['sucre', 'chocolat', 'miel', 'confiture', 'biscuit', 'gâteau', 'céréale', 'levure', 'vanille', 'cacao', 'compote', 'cannelle']],
  ['Boissons', ['eau', 'jus', 'café', 'thé', 'vin', 'bière', 'soda', 'sirop', 'boisson']],
  ['Surgelés', ['surgelé', 'glace', 'congelé']],
  ['Boulangerie', ['pain', 'baguette', 'focaccia', 'viennoiserie', 'croissant', 'brioche']],
  ['Hygiène & Maison', ['savon', 'shampoing', 'dentifrice', 'éponge', 'papier', 'lessive', 'vaisselle', 'poubelle', 'nettoyant']]
];
function rayonForItem(name) {
  const s = String(name || '').toLowerCase();
  for (const [rayon, kws] of RAYON_KEYWORDS) if (kws.some(k => s.includes(k))) return rayon;
  return 'Autre';
}
const normName = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
// Prix canonique : nombre valide, sinon '' (jamais une chaîne « en cours de frappe » ou NaN).
const numOrEmpty = v => (v === '' || v == null || isNaN(Number(v))) ? '' : Number(v);

function CoursesView({ courses, addCourse, upsertCourse, deleteCourse, toggleCourse, clearChecked, generateFromMeals, mergeDuplicates }) {
  const h = React.createElement;
  const [form, setForm] = useState({ nom: '', qte: '1', unite: '', rayon: 'Autre', prix: '' });
  const list = Array.isArray(courses) ? courses : [];
  const total = list.reduce((s, c) => s + (Number(c.prix) || 0) * (Number(c.qte) || 1), 0);
  const doneCount = list.filter(c => c.done).length;
  const groups = COURSE_RAYONS.map(r => ({ rayon: r, items: list.filter(c => c.rayon === r) })).filter(g => g.items.length);

  const submit = () => {
    const nom = form.nom.trim();
    if (!nom) return;
    addCourse({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nom, qte: Math.max(0, Number(form.qte) || 1), unite: form.unite,
      rayon: form.rayon !== 'Autre' ? form.rayon : rayonForItem(nom),
      prix: form.prix, done: false
    });
    setForm({ nom: '', qte: '1', unite: '', rayon: 'Autre', prix: '' });
  };
  const inputStyle = { padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)', fontSize: 13 };
  const barBtn = (bg, col, bd) => ({ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${bd}`, background: bg, color: col, fontSize: 12.5, cursor: 'pointer', fontWeight: 600 });

  return h('div', null,
    // En-tête
    h('div', { style: { marginBottom: 18 } },
      h('div', { className: 'eyebrow', style: { marginBottom: 8 } }, '🛒 Provisions'),
      h('h2', { style: { fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 500, marginBottom: 6 } }, 'Liste de courses'),
      h('p', { style: { color: 'var(--text3)', fontSize: 14, maxWidth: 560 } }, 'Partagée et synchronisée — triée par rayon pour faire les courses dans l\'ordre.')
    ),
    // Barre d'actions + total
    h('div', { className: 'lx-card', style: { padding: 16, marginBottom: 16 } },
      h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' } },
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          h('button', { onClick: generateFromMeals, style: barBtn('var(--gold-bg)', 'var(--gold)', 'var(--gold-border)') }, '🍽 Générer depuis les repas'),
          h('button', { onClick: mergeDuplicates, style: barBtn('transparent', 'var(--text2)', 'var(--border2)') }, '⊕ Regrouper doublons'),
          h('button', { onClick: () => { if (doneCount && confirm('Retirer les ' + doneCount + ' article(s) coché(s) ?')) clearChecked(); }, style: barBtn('transparent', doneCount ? 'var(--danger)' : 'var(--text3)', doneCount ? 'var(--danger-border)' : 'var(--border)') }, '🗑 Effacer cochés' + (doneCount ? ' (' + doneCount + ')' : ''))
        ),
        h('div', { style: { textAlign: 'right' } },
          h('div', { style: { fontFamily: "'Space Mono',monospace", fontSize: 11, color: 'var(--text3)' } }, list.length + ' article' + (list.length > 1 ? 's' : '') + ' · ' + doneCount + ' ✓'),
          total > 0 ? h('div', { style: { fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: 'var(--gold2)' } }, '≈ ' + total.toFixed(2) + ' €') : null
        )
      )
    ),
    // Formulaire d'ajout
    h('div', { className: 'lx-card', style: { padding: 14, marginBottom: 18 } },
      h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' } },
        h('input', { value: form.nom, placeholder: 'Article (ex: tomates)', onChange: e => setForm(p => ({ ...p, nom: e.target.value })), onKeyDown: e => { if (e.key === 'Enter') submit(); }, style: { ...inputStyle, flex: '2 1 160px' } }),
        h('input', { type: 'number', min: 0, step: 'any', value: form.qte, onChange: e => setForm(p => ({ ...p, qte: e.target.value })), style: { ...inputStyle, width: 64 } }),
        h('select', { value: form.unite, onChange: e => setForm(p => ({ ...p, unite: e.target.value })), style: { ...inputStyle, width: 80 } }, COURSE_UNITES.map(u => h('option', { key: u, value: u }, u || 'unité'))),
        h('select', { value: form.rayon, onChange: e => setForm(p => ({ ...p, rayon: e.target.value })), style: { ...inputStyle, flex: '1 1 130px' } }, COURSE_RAYONS.map(r => h('option', { key: r, value: r }, r))),
        h('input', { type: 'number', min: 0, step: 'any', value: form.prix, placeholder: '€', onChange: e => setForm(p => ({ ...p, prix: e.target.value })), style: { ...inputStyle, width: 70 } }),
        h('button', { onClick: submit, style: { ...barBtn('var(--gold)', '#06120d', 'var(--gold)'), padding: '9px 16px' } }, '+ Ajouter')
      )
    ),
    // Liste groupée par rayon
    groups.length === 0
      ? h('div', { className: 'lx-card', style: { padding: '28px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 } }, 'Liste vide. Ajoute un article ou génère-la depuis tes repas de la semaine.')
      : groups.map(g => h('div', { key: g.rayon, style: { marginBottom: 16 } },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } },
            h('span', { style: { fontSize: 16 } }, COURSE_RAYON_ICON[g.rayon] || '🛒'),
            h('span', { style: { fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold)' } }, g.rayon + ' · ' + g.items.length)
          ),
          h('div', { className: 'lx-card', style: { padding: 6 } },
            g.items.map(c => h('div', {
              key: c.id,
              style: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 'var(--radius-xs)', opacity: c.done ? 0.5 : 1 }
            },
              h('input', { type: 'checkbox', checked: !!c.done, onChange: () => toggleCourse(c.id), style: { width: 18, height: 18, accentColor: 'var(--success)', cursor: 'pointer', flexShrink: 0 } }),
              h('span', { style: { flex: 1, fontSize: 14, color: 'var(--text)', textDecoration: c.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, c.nom),
              h('input', { type: 'number', min: 0, step: 'any', value: c.qte, onChange: e => upsertCourse({ ...c, qte: Math.max(0, Number(e.target.value) || 0) }), title: 'Quantité', style: { width: 52, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, textAlign: 'right' } }),
              c.unite ? h('span', { style: { fontSize: 11, color: 'var(--text3)', width: 28 } }, c.unite) : h('span', { style: { width: 28 } }),
              h('input', { type: 'number', min: 0, step: 'any', value: c.prix === '' || c.prix == null ? '' : c.prix, placeholder: '€', onChange: e => upsertCourse({ ...c, prix: e.target.value }), title: 'Prix unitaire', style: { width: 56, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--gold2)', fontSize: 12, textAlign: 'right' } }),
              h('button', { onClick: () => deleteCourse(c.id), title: 'Supprimer', style: { background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: '0 4px' } }, '×')
            ))
          )
        ))
  );
}

// ─── Helper : extrait l'ID YouTube d'une URL quelconque ──────────────────────
function ytIdFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const listId = u.searchParams.get('list');
    if (listId) return listId; // playlist
  } catch (_) {}
  // fallback regex
  const m = url.match(/(?:v=|youtu\.be\/|list=)([\w-]{11,})/);
  return m ? m[1] : null;
}
function isPlaylistId(id) { return id && id.startsWith('PL'); }

function MediaView({ media, addMedia, deleteMedia }) {
  const [form, setForm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [playing, setPlaying] = React.useState(null); // id de la carte en lecture

  async function handleAdd() {
    const url = form.trim();
    if (!url) return;
    const ytId = ytIdFromUrl(url);
    if (!ytId) { alert('Lien YouTube invalide'); return; }
    const kind = isPlaylistId(ytId) ? 'playlist' : 'video';
    setLoading(true);
    // oEmbed ne gère PAS les playlists → titre par défaut ; pour une vidéo on récupère le vrai titre.
    let title = kind === 'playlist' ? 'Playlist YouTube' : url;
    if (kind === 'video') {
      try {
        const oembed = await fetch(
          'https://www.youtube.com/oembed?url=' + encodeURIComponent(url) + '&format=json'
        ).then(r => r.ok ? r.json() : null);
        if (oembed && oembed.title) title = oembed.title;
      } catch (_) {}
    }
    const thumb = kind === 'video' ? 'https://img.youtube.com/vi/' + ytId + '/mqdefault.jpg' : '';
    addMedia({ id: 'yt-' + Date.now(), kind, ytId, title, thumb });
    setForm('');
    setLoading(false);
  }

  function embedSrc(item) {
    if (item.kind === 'playlist')
      return 'https://www.youtube.com/embed/videoseries?list=' + item.ytId + '&autoplay=1';
    return 'https://www.youtube.com/embed/' + item.ytId + '?autoplay=1';
  }
  // Miniature : thumb stockée, sinon img.youtube.com pour une vidéo, sinon null (playlist → placeholder).
  function thumbUrl(item) {
    if (item.thumb) return item.thumb;
    if (item.kind !== 'playlist') return 'https://img.youtube.com/vi/' + item.ytId + '/mqdefault.jpg';
    return null;
  }

  return React.createElement('div', { style: { maxWidth: 900, margin: '0 auto' } },
    React.createElement('h2', { style: { color: 'var(--gold)', marginBottom: 20 } }, '🎬 Médias'),

    // Formulaire ajout
    React.createElement('div', {
      style: { display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }
    },
      React.createElement('input', {
        type: 'text',
        placeholder: 'Coller un lien YouTube (vidéo ou playlist)…',
        value: form,
        onChange: e => setForm(e.target.value),
        onKeyDown: e => e.key === 'Enter' && handleAdd(),
        style: { flex: 1, minWidth: 240, padding: '10px 14px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'rgba(255,255,255,.07)', color: 'var(--text)' }
      }),
      React.createElement('button', {
        onClick: handleAdd,
        disabled: loading,
        style: { padding: '10px 20px', borderRadius: 8, cursor: loading ? 'default' : 'pointer',
          border: '1px solid var(--accent-couple)', background: 'var(--accent-couple)',
          color: '#1a1208', fontWeight: 600, opacity: loading ? .6 : 1 }
      }, loading ? '…' : '+ Ajouter')
    ),

    // Grille de miniatures
    React.createElement('div', {
      style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }
    },
      (media || []).map(item =>
        React.createElement('div', {
          key: item.id,
          style: { background: 'rgba(255,255,255,.06)', borderRadius: 12,
            overflow: 'hidden', border: '1px solid var(--border)' }
        },
          // Player intégré ou miniature cliquable
          playing === item.id
            ? React.createElement('iframe', {
                src: embedSrc(item),
                width: '100%',
                height: 180,
                frameBorder: '0',
                allow: 'autoplay; encrypted-media',
                allowFullScreen: true,
                style: { display: 'block' }
              })
            : React.createElement('div', {
                onClick: () => setPlaying(item.id),
                style: { position: 'relative', cursor: 'pointer', height: 180,
                  background: '#000', overflow: 'hidden' }
              },
                thumbUrl(item)
                  ? React.createElement('img', {
                      src: thumbUrl(item),
                      alt: item.title,
                      style: { width: '100%', height: '100%', objectFit: 'cover', opacity: .85 }
                    })
                  : React.createElement('div', {
                      style: { width: '100%', height: '100%',
                        background: 'linear-gradient(135deg,#7a1f3d,#2a0d18)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }
                    }, '🎵'),
                React.createElement('div', {
                  style: { position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center' }
                },
                  React.createElement('div', {
                    style: { width: 52, height: 52, borderRadius: '50%',
                      background: 'rgba(255,0,0,.85)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 22 }
                  }, '▶')
                ),
                item.kind === 'playlist' && React.createElement('div', {
                  style: { position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.7)',
                    color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4 }
                }, 'PLAYLIST')
              ),

          // Titre + bouton supprimer
          React.createElement('div', {
            style: { padding: '10px 12px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', gap: 8 }
          },
            React.createElement('span', {
              style: { fontSize: 13, color: 'var(--text)', flex: 1,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
            }, item.title),
            React.createElement('button', {
              onClick: () => { if (playing === item.id) setPlaying(null); deleteMedia(item.id); },
              title: 'Supprimer',
              style: { background: 'none', border: 'none', color: 'var(--text)', opacity: .55,
                cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }
            }, '×')
          )
        )
      )
    )
  );
}

// ─── Module Survie / post-apo — cadre militaire « Purple Moon » (Liika) ───
const SURVIE_CATS = ['Eau', 'Nourriture', 'Médical', 'Énergie', 'Outils', 'Hygiène', 'Autre'];
const SURVIE_CAT_ICON = { Eau: '💧', Nourriture: '🥫', 'Médical': '⚕️', 'Énergie': '🔋', Outils: '🔧', 'Hygiène': '🧼', Autre: '📦' };
const SURVIE_UNITES = ['L', 'kg', 'g', 'u', 'boîtes', 'kit', 'paquet', 'sachet'];

function survieDaysLeft(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return null;
  return Math.round((d - new Date(new Date().toDateString())) / 86400000);
}

function SurvieView({ survie, updateSurvie, ferments, addCourse }) {
  const h = React.createElement;
  const sv = survie || {};
  const foyer = Number(sv.foyer) > 0 ? Number(sv.foyer) : 2;
  const stocks = Array.isArray(sv.stocks) ? sv.stocks : [];
  const bob = sv.bob || { dja: [], liika: [], commun: [] };
  const plan = sv.plan || { ralliement: [], contacts: [], protocoles: [] };
  const fermentsCount = Array.isArray(ferments) ? ferments.filter(f => !f.done).length : 0;

  const [nf, setNf] = useState({ nom: '', cat: 'Nourriture', qte: '1', unite: 'u', parJour: '', peremption: '' });

  // ── Calculs : autonomie & niveau de préparation ──
  const calc = useMemo(() => {
    // parJour = conso PAR PERSONNE et PAR JOUR → conso foyer = parJour × foyer.
    const autoCat = cat => stocks
      .filter(s => s.cat === cat && Number(s.parJour) > 0)
      .reduce((sum, s) => sum + (Number(s.qte) || 0) / ((Number(s.parJour) || 1) * foyer), 0);
    const autonomieEau = autoCat('Eau');
    const autonomieNour = autoCat('Nourriture');
    const aMedical = stocks.some(s => s.cat === 'Médical' && (Number(s.qte) || 0) > 0);
    const allBob = [...(bob.dja || []), ...(bob.liika || []), ...(bob.commun || [])];
    const bobDone = allBob.filter(b => b.done).length;
    const pBob = allBob.length ? bobDone / allBob.length : 0;
    const expired = stocks.filter(s => { const d = survieDaysLeft(s.peremption); return d != null && d < 0; });
    const bientot = stocks.filter(s => { const d = survieDaysLeft(s.peremption); return d != null && d >= 0 && d <= 30; });
    const pEau = Math.min(1, autonomieEau / 14);
    const pNour = Math.min(1, autonomieNour / 14);
    const pMed = aMedical ? 1 : 0;
    let score = Math.round(100 * (0.3 * pEau + 0.3 * pNour + 0.15 * pMed + 0.25 * pBob));
    if (expired.length) score = Math.max(0, score - 15);
    const condition = score >= 75 ? { label: 'CONDITION VERTE', color: '#22c55e' }
      : score >= 45 ? { label: 'CONDITION ORANGE', color: '#f59e0b' }
        : { label: 'CONDITION ROUGE', color: '#ef4444' };
    return { autonomieEau, autonomieNour, aMedical, bobDone, bobTotal: allBob.length, pBob, expired, bientot, score, condition };
  }, [stocks, bob]);

  const inp = { padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'rgba(255,255,255,.07)', color: 'var(--text)', fontSize: 13 };
  const card = { background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 };

  // ── Mutations ──
  const addStock = () => {
    const nom = nf.nom.trim();
    if (!nom) return;
    const item = { id: 'sv-' + Date.now(), nom, cat: nf.cat, qte: Number(nf.qte) || 1, unite: nf.unite, parJour: Number(nf.parJour) || 0, peremption: nf.peremption || '', note: '' };
    updateSurvie(s => { (s.stocks = s.stocks || []).push(item); });
    setNf({ nom: '', cat: nf.cat, qte: '1', unite: nf.unite, parJour: '', peremption: '' });
  };
  const setStock = (id, field, val) => updateSurvie(s => { const i = s.stocks.findIndex(x => x.id === id); if (i >= 0) s.stocks[i][field] = val; });
  const delStock = id => updateSurvie(s => { s.stocks = s.stocks.filter(x => x.id !== id); });
  const reappro = it => addCourse && addCourse({ id: 'c-' + Date.now(), nom: it.nom, qte: 1, unite: it.unite || '', rayon: rayonForItem(it.nom), prix: '', done: false });

  const toggleBob = (who, id) => updateSurvie(s => { const a = (s.bob[who] || []); const i = a.findIndex(x => x.id === id); if (i >= 0) a[i].done = !a[i].done; });
  const addBob = (who, label) => { const l = (label || '').trim(); if (!l) return; updateSurvie(s => { (s.bob[who] = s.bob[who] || []).push({ id: 'b-' + Date.now(), label: l, done: false }); }); };
  const delBob = (who, id) => updateSurvie(s => { s.bob[who] = (s.bob[who] || []).filter(x => x.id !== id); });

  const addPlan = (key, obj) => updateSurvie(s => { (s.plan[key] = s.plan[key] || []).push(obj); });
  const setPlan = (key, id, field, val) => updateSurvie(s => { const i = s.plan[key].findIndex(x => x.id === id); if (i >= 0) s.plan[key][i][field] = val; });
  const delPlan = (key, id) => updateSurvie(s => { s.plan[key] = (s.plan[key] || []).filter(x => x.id !== id); });

  const fmtJours = n => n >= 1 ? Math.floor(n) + ' j' : (n > 0 ? '<1 j' : '0 j');

  // ── Rendu ──
  return h('div', { style: { maxWidth: 1000, margin: '0 auto' } },
    // En-tête + condition
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 } },
      h('div', null,
        h('h2', { style: { color: 'var(--gold)', margin: 0 } }, '🪖 Base Purple Moon'),
        h('div', { style: { fontSize: 12, color: 'var(--text2)', fontFamily: "'Space Mono',monospace", marginTop: 2 } }, 'Protocole survie — foyer ' + foyer + ' pers.')
      ),
      h('div', { style: { textAlign: 'right' } },
        h('div', { style: { display: 'inline-block', padding: '6px 14px', borderRadius: 8, fontWeight: 700, letterSpacing: '.08em', fontSize: 13, color: '#0b0b0b', background: calc.condition.color, fontFamily: "'Space Mono',monospace" } }, calc.condition.label),
        h('div', { style: { fontSize: 11, color: 'var(--text2)', marginTop: 4 } }, 'Préparation : ' + calc.score + '%')
      )
    ),

    // Tableau de bord (cartes)
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 22 } },
      h('div', { style: card },
        h('div', { style: { fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' } }, '💧 Autonomie eau'),
        h('div', { style: { fontSize: 26, fontWeight: 700, color: calc.autonomieEau >= 14 ? '#22c55e' : calc.autonomieEau >= 7 ? '#f59e0b' : '#ef4444' } }, fmtJours(calc.autonomieEau)),
        h('div', { style: { fontSize: 10, color: 'var(--text2)' } }, 'objectif ≥ 14 j')
      ),
      h('div', { style: card },
        h('div', { style: { fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' } }, '🥫 Autonomie vivres'),
        h('div', { style: { fontSize: 26, fontWeight: 700, color: calc.autonomieNour >= 14 ? '#22c55e' : calc.autonomieNour >= 7 ? '#f59e0b' : '#ef4444' } }, fmtJours(calc.autonomieNour)),
        h('div', { style: { fontSize: 10, color: 'var(--text2)' } }, 'objectif ≥ 14 j')
      ),
      h('div', { style: card },
        h('div', { style: { fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' } }, '🎒 Sacs prêts'),
        h('div', { style: { fontSize: 26, fontWeight: 700, color: 'var(--gold)' } }, calc.bobDone + '/' + calc.bobTotal),
        h('div', { style: { fontSize: 10, color: 'var(--text2)' } }, Math.round(calc.pBob * 100) + '% opérationnel')
      ),
      h('div', { style: card },
        h('div', { style: { fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' } }, '🌿 Réserves ferments'),
        h('div', { style: { fontSize: 26, fontWeight: 700, color: 'var(--gold)' } }, fermentsCount),
        h('div', { style: { fontSize: 10, color: 'var(--text2)' } }, 'bocaux en cours (DrevmCook)')
      )
    ),

    // Alertes péremption
    (calc.expired.length || calc.bientot.length)
      ? h('div', { style: { ...card, borderColor: '#ef4444', marginBottom: 22, background: 'rgba(239,68,68,.08)' } },
          h('div', { style: { fontWeight: 700, color: '#ef4444', marginBottom: 6, fontSize: 13 } }, '⚠ Alertes péremption'),
          calc.expired.map(s => h('div', { key: s.id, style: { fontSize: 12, color: 'var(--text)' } }, '• ' + s.nom + ' — PÉRIMÉ')),
          calc.bientot.map(s => h('div', { key: s.id, style: { fontSize: 12, color: 'var(--text2)' } }, '• ' + s.nom + ' — expire dans ' + survieDaysLeft(s.peremption) + ' j'))
        )
      : null,

    // ── STOCKS ──
    h('h3', { style: { color: 'var(--gold)', fontSize: 15, marginBottom: 10 } }, '📦 Stocks & autonomie'),
    h('div', { style: { ...card, marginBottom: 12 } },
      h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' } },
        h('input', { style: { ...inp, flex: 2, minWidth: 140 }, placeholder: 'Article…', value: nf.nom, onChange: e => setNf({ ...nf, nom: e.target.value }), onKeyDown: e => e.key === 'Enter' && addStock() }),
        h('select', { style: inp, value: nf.cat, onChange: e => setNf({ ...nf, cat: e.target.value }) }, SURVIE_CATS.map(c => h('option', { key: c, value: c }, c))),
        h('input', { style: { ...inp, width: 60 }, type: 'number', placeholder: 'Qté', value: nf.qte, onChange: e => setNf({ ...nf, qte: e.target.value }) }),
        h('select', { style: inp, value: nf.unite, onChange: e => setNf({ ...nf, unite: e.target.value }) }, SURVIE_UNITES.map(u => h('option', { key: u, value: u }, u))),
        h('input', { style: { ...inp, width: 90 }, type: 'number', step: 'any', placeholder: '/j/pers', title: 'Conso par jour et par personne (×' + foyer + ' = foyer)', value: nf.parJour, onChange: e => setNf({ ...nf, parJour: e.target.value }) }),
        h('input', { style: { ...inp, width: 140 }, type: 'date', title: 'Péremption', value: nf.peremption, onChange: e => setNf({ ...nf, peremption: e.target.value }) }),
        h('button', { onClick: addStock, style: { padding: '8px 16px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#1a1208', fontWeight: 600, cursor: 'pointer' } }, '+ Ajouter')
      )
    ),
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 26 } },
      SURVIE_CATS.filter(c => stocks.some(s => s.cat === c)).map(cat =>
        h('div', { key: cat },
          h('div', { style: { fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em', margin: '6px 0 4px' } }, (SURVIE_CAT_ICON[cat] || '📦') + ' ' + cat),
          stocks.filter(s => s.cat === cat).map(s => {
            const dl = survieDaysLeft(s.peremption);
            const auto = Number(s.parJour) > 0 ? (Number(s.qte) || 0) / (Number(s.parJour) * foyer) : null;
            return h('div', { key: s.id, style: { ...card, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' } },
              h('span', { style: { flex: 2, minWidth: 120, fontSize: 13, color: 'var(--text)' } }, s.nom),
              h('input', { style: { ...inp, width: 60 }, type: 'number', value: s.qte, onChange: e => setStock(s.id, 'qte', Number(e.target.value) || 0) }),
              h('span', { style: { fontSize: 12, color: 'var(--text2)', width: 50 } }, s.unite),
              auto != null ? h('span', { style: { fontSize: 11, color: 'var(--text2)', width: 70 } }, '≈ ' + fmtJours(auto)) : h('span', { style: { width: 70 } }),
              dl != null ? h('span', { style: { fontSize: 11, fontWeight: 600, color: dl < 0 ? '#ef4444' : dl <= 30 ? '#f59e0b' : 'var(--text2)' } }, dl < 0 ? 'périmé' : dl + ' j') : h('span', null),
              h('button', { onClick: () => reappro(s), title: 'Ajouter aux courses', style: { background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', cursor: 'pointer', fontSize: 11, padding: '3px 8px' } }, '🛒 Réappro'),
              h('button', { onClick: () => delStock(s.id), title: 'Supprimer', style: { background: 'none', border: 'none', color: 'var(--text)', opacity: .5, cursor: 'pointer', fontSize: 16 } }, '×')
            );
          })
        )
      )
    ),

    // ── BOB ──
    h('h3', { style: { color: 'var(--gold)', fontSize: 15, marginBottom: 10 } }, '🎒 Sacs d\'évacuation (BOB)'),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12, marginBottom: 26 } },
      [['dja', 'Dja'], ['liika', 'Liika (Purple Moon)'], ['commun', 'Commun']].map(([key, label]) =>
        h('div', { key: key, style: card },
          h('div', { style: { fontWeight: 700, color: 'var(--gold)', marginBottom: 8, fontSize: 13 } }, label),
          (bob[key] || []).map(b =>
            h('div', { key: b.id, style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 } },
              h('input', { type: 'checkbox', checked: !!b.done, onChange: () => toggleBob(key, b.id), style: { width: 16, height: 16, accentColor: 'var(--gold)', cursor: 'pointer' } }),
              h('span', { style: { flex: 1, fontSize: 13, color: 'var(--text)', textDecoration: b.done ? 'line-through' : 'none', opacity: b.done ? .6 : 1 } }, b.label),
              h('button', { onClick: () => delBob(key, b.id), style: { background: 'none', border: 'none', color: 'var(--text)', opacity: .4, cursor: 'pointer' } }, '×')
            )
          ),
          h('form', { onSubmit: e => { e.preventDefault(); const v = e.target.elements.l.value; addBob(key, v); e.target.reset(); }, style: { marginTop: 6, display: 'flex', gap: 6 } },
            h('input', { name: 'l', style: { ...inp, flex: 1 }, placeholder: '+ élément…' }),
            h('button', { type: 'submit', style: { padding: '0 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'rgba(255,255,255,.08)', color: 'var(--gold)', cursor: 'pointer', fontSize: 16, fontWeight: 700 } }, '+')
          )
        )
      )
    ),

    // ── PLAN D'URGENCE ──
    h('h3', { style: { color: 'var(--gold)', fontSize: 15, marginBottom: 10 } }, '🧭 Plan d\'urgence'),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 } },
      // Points de ralliement
      h('div', { style: card },
        h('div', { style: { fontWeight: 700, color: 'var(--gold)', marginBottom: 8, fontSize: 13 } }, '📍 Points de ralliement'),
        (plan.ralliement || []).map(p =>
          h('div', { key: p.id, style: { marginBottom: 8 } },
            h('div', { style: { display: 'flex', gap: 6 } },
              h('input', { style: { ...inp, flex: 1 }, value: p.nom, placeholder: 'Nom', onChange: e => setPlan('ralliement', p.id, 'nom', e.target.value) }),
              h('button', { onClick: () => delPlan('ralliement', p.id), style: { background: 'none', border: 'none', color: 'var(--text)', opacity: .4, cursor: 'pointer' } }, '×')
            ),
            h('input', { style: { ...inp, width: '100%', marginTop: 4 }, value: p.adresse || '', placeholder: 'Adresse / repère', onChange: e => setPlan('ralliement', p.id, 'adresse', e.target.value) })
          )
        ),
        h('button', { onClick: () => addPlan('ralliement', { id: 'rp-' + Date.now(), nom: '', adresse: '', note: '' }), style: { background: 'none', border: '1px dashed var(--border)', borderRadius: 7, color: 'var(--text2)', cursor: 'pointer', fontSize: 12, padding: '6px 10px', marginTop: 4 } }, '+ Point')
      ),
      // Contacts
      h('div', { style: card },
        h('div', { style: { fontWeight: 700, color: 'var(--gold)', marginBottom: 8, fontSize: 13 } }, '📞 Contacts'),
        (plan.contacts || []).map(c =>
          h('div', { key: c.id, style: { display: 'flex', gap: 6, marginBottom: 6 } },
            h('input', { style: { ...inp, flex: 1 }, value: c.nom, placeholder: 'Nom', onChange: e => setPlan('contacts', c.id, 'nom', e.target.value) }),
            h('input', { style: { ...inp, width: 110 }, value: c.tel || '', placeholder: 'Tél', onChange: e => setPlan('contacts', c.id, 'tel', e.target.value) }),
            h('button', { onClick: () => delPlan('contacts', c.id), style: { background: 'none', border: 'none', color: 'var(--text)', opacity: .4, cursor: 'pointer' } }, '×')
          )
        ),
        h('button', { onClick: () => addPlan('contacts', { id: 'pc-' + Date.now(), nom: '', role: '', tel: '' }), style: { background: 'none', border: '1px dashed var(--border)', borderRadius: 7, color: 'var(--text2)', cursor: 'pointer', fontSize: 12, padding: '6px 10px', marginTop: 4 } }, '+ Contact')
      ),
      // Protocoles
      h('div', { style: card },
        h('div', { style: { fontWeight: 700, color: 'var(--gold)', marginBottom: 8, fontSize: 13 } }, '📋 Protocoles'),
        (plan.protocoles || []).map(p =>
          h('div', { key: p.id, style: { marginBottom: 8 } },
            h('div', { style: { display: 'flex', gap: 6 } },
              h('input', { style: { ...inp, flex: 1 }, value: p.scenario, placeholder: 'Scénario', onChange: e => setPlan('protocoles', p.id, 'scenario', e.target.value) }),
              h('button', { onClick: () => delPlan('protocoles', p.id), style: { background: 'none', border: 'none', color: 'var(--text)', opacity: .4, cursor: 'pointer' } }, '×')
            ),
            h('textarea', { style: { ...inp, width: '100%', marginTop: 4, minHeight: 50, resize: 'vertical' }, value: p.texte || '', placeholder: 'Conduite à tenir…', onChange: e => setPlan('protocoles', p.id, 'texte', e.target.value) })
          )
        ),
        h('button', { onClick: () => addPlan('protocoles', { id: 'pr-' + Date.now(), scenario: '', texte: '' }), style: { background: 'none', border: '1px dashed var(--border)', borderRadius: 7, color: 'var(--text2)', cursor: 'pointer', fontSize: 12, padding: '6px 10px', marginTop: 4 } }, '+ Protocole')
      )
    )
  );
}

function DrevmCookView({
  ferments,
  upsertFerment,
  deleteFerment,
  recipes,
  upsertRecipe,
  deleteRecipe,
  importRecipes
}) {
  const h = React.createElement;
  const allRecipes = [...DEFAULT_RECIPES, ...(recipes || []).filter(r => !DEFAULT_RECIPES.some(dr => dr.id === r.id))];
  const exportCsv = () => {
    const blob = new Blob(['﻿' + recipesToCsv(recipes || [])], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'recettes-drevmcook.csv'; a.click();
    URL.revokeObjectURL(url);
  };
  const onImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv,text/csv';
    input.onchange = e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const list = csvToRecipes(reader.result);
          if (!list.length) { alert('Aucune recette valide trouvée dans le CSV.\nColonnes attendues : ' + RECIPE_CSV_COLS.join(', ')); return; }
          importRecipes(list);
          alert(list.length + ' recette(s) importée(s).');
        } catch (err) { alert('Erreur de lecture du CSV : ' + err.message); }
      };
      reader.readAsText(f);
    };
    input.click();
  };
  const [filterCat, setFilterCat] = useState('Tout');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddFerment, setShowAddFerment] = useState(false);
  const [fermentStatusFilter, setFermentStatusFilter] = useState('Tous');
  const [newReadyAlerts, setNewReadyAlerts] = useState([]);
  const [journalOpenId, setJournalOpenId] = useState(null);
  const [journalDrafts, setJournalDrafts] = useState({});
  const alertedReadyRef = useRef(new Set());
  const [fermentForm, setFermentForm] = useState({
    nom: '',
    type: 'Légumes',
    startDate: new Date().toISOString().slice(0, 10),
    durationDays: 14,
    notes: ''
  });
  const [addForm, setAddForm] = useState({
    nom: '',
    categorie: 'Salés',
    tags: '',
    ingredients: '',
    preparation: '',
    apports: '',
    budget: ''
  });

  const cats = ['Tout', 'Salés', 'Boulangerie', 'Fermentés', 'Desserts', 'Boissons', 'Référence'];
  const fermentStatusFilters = ['Tous', 'En cours', 'Prêts', 'Terminés'];
  const fermentTypes = ['Légumes', 'Sauce', 'Boisson', 'Levain', 'Autre'];
  const filtered = useMemo(() => filterCat === 'Tout' ? allRecipes : allRecipes.filter(r => r.categorie === filterCat), [allRecipes, filterCat]);
  const fermentList = useMemo(() => (ferments || []).slice().sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || ''))), [ferments]);

  const fmtDate = iso => {
    if (!iso) return '—';
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const fermentMetaById = useMemo(() => {
    const dayMs = 86400000;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const map = new Map();

    fermentList.forEach(item => {
      const duration = Math.max(1, Number(item.durationDays) || 1);
      const start = new Date(`${item.startDate || ''}T00:00:00`);
      const startValid = !isNaN(start.getTime());
      const target = startValid ? new Date(start.getTime() + duration * dayMs) : null;
      const targetValid = !!target && !isNaN(target.getTime());
      const targetIso = targetValid ? target.toISOString().slice(0, 10) : '';
      const elapsed = startValid ? Math.max(0, Math.floor((startOfToday.getTime() - start.getTime()) / dayMs)) : 0;
      const left = targetValid ? Math.ceil((target.getTime() - startOfToday.getTime()) / dayMs) : duration;
      const progress = Math.max(0, Math.min(100, Math.round(elapsed / duration * 100)));

      let status = 'En cours';
      let statusColor = 'var(--gold)';
      if (item.done) {
        status = 'Terminé';
        statusColor = 'var(--text3)';
      } else if (targetValid && left <= 0) {
        status = 'Prêt';
        statusColor = 'var(--success)';
      } else if (targetValid && left <= 2) {
        status = 'Bientôt prêt';
        statusColor = 'var(--warn)';
      }

      map.set(item.id, { left, progress, status, statusColor, targetIso });
    });

    return map;
  }, [fermentList]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ld-ferment-ready-alerted');
      const ids = raw ? JSON.parse(raw) : [];
      alertedReadyRef.current = new Set(Array.isArray(ids) ? ids : []);
    } catch (_) {
      alertedReadyRef.current = new Set();
    }
  }, []);

  useEffect(() => {
    const alerted = alertedReadyRef.current;
    const fresh = [];
    fermentList.forEach(item => {
      const meta = fermentMetaById.get(item.id);
      const isReady = !item.done && meta && meta.status === 'Prêt';
      if (isReady && !alerted.has(item.id)) {
        alerted.add(item.id);
        fresh.push({ id: item.id, nom: item.nom, type: item.type });
      }
    });
    if (fresh.length) {
      setNewReadyAlerts(prev => [...fresh, ...prev].slice(0, 6));
      try {
        localStorage.setItem('ld-ferment-ready-alerted', JSON.stringify([...alerted]));
      } catch (_) {}
    }
  }, [fermentList, fermentMetaById]);

  const filteredFerments = useMemo(() => fermentList.filter(item => {
    const s = (fermentMetaById.get(item.id) || {}).status;
    if (fermentStatusFilter === 'En cours') return s === 'En cours' || s === 'Bientôt prêt';
    if (fermentStatusFilter === 'Prêts') return s === 'Prêt';
    if (fermentStatusFilter === 'Terminés') return s === 'Terminé';
    return true;
  }), [fermentList, fermentStatusFilter, fermentMetaById]);

  const fermentStats = useMemo(() => ({
    total: fermentList.length,
    enCours: fermentList.filter(f => {
      const s = (fermentMetaById.get(f.id) || {}).status;
      return s === 'En cours' || s === 'Bientôt prêt';
    }).length,
    pret: fermentList.filter(f => (fermentMetaById.get(f.id) || {}).status === 'Prêt').length
  }), [fermentList, fermentMetaById]);

  if (selected) {
    const r = allRecipes.find(x => x.id === selected);
    if (!r) return h('div', null, h('button', { onClick: () => setSelected(null) }, '← Retour'));
    return h('div', null,
      h('button', { onClick: () => setSelected(null), style: { marginBottom: 12, background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer' } }, '← Retour aux recettes'),
      h('h2', { style: { marginBottom: 8 } }, r.nom),
      h('p', { style: { color: 'var(--text3)', marginBottom: 8 } }, r.categorie),
      h('p', { style: { whiteSpace: 'pre-wrap', color: 'var(--text2)', marginBottom: 10 } }, r.preparation || '—'),
      h('p', { style: { color: 'var(--text2)', marginBottom: 10 } }, r.apports || '—'),
      h('ul', { style: { paddingLeft: 18 } }, (r.ingredients || []).map((x, i) => h('li', { key: i, style: { color: 'var(--text2)' } }, x)))
    );
  }

  return h('div', null,
    h('div', { style: { marginBottom: 16 } },
      h('p', { className: 'eyebrow' }, '🌿 Cuisine végétale & tropicale'),
      h('h2', null, 'DrevmCook')
    ),
    newReadyAlerts.length > 0 && h('div', { style: { display: 'grid', gap: 6, marginBottom: 12 } },
      newReadyAlerts.map(al => h('div', {
        key: `a-${al.id}`,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(74,222,128,.1)',
          border: '1px solid rgba(74,222,128,.28)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 10px'
        }
      },
      h('span', null, '✅'),
      h('span', { style: { flex: 1, color: 'var(--text2)', fontSize: 12 } }, `${al.nom} (${al.type}) est prêt.`),
      h('button', {
        onClick: () => setNewReadyAlerts(prev => prev.filter(x => x.id !== al.id)),
        style: { border: '1px solid rgba(74,222,128,.3)', background: 'transparent', color: 'var(--success)', borderRadius: 8, fontSize: 11, cursor: 'pointer' }
      }, 'OK')))
    ),

    h('div', {
      style: {
        background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        marginBottom: 20,
        border: '1px solid var(--warn-border)'
      }
    },
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' } },
      h('h3', { style: { margin: 0 } }, '🫙 Trackeur de lactofermentation'),
      h('button', {
        onClick: () => setShowAddFerment(v => !v),
        style: { padding: '5px 10px', borderRadius: 20, border: '1px solid var(--warn-border)', background: 'transparent', color: 'var(--warn)', cursor: 'pointer', fontSize: 12 }
      }, showAddFerment ? 'Fermer' : '+ Bocal')
    ),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginBottom: 10 } },
      h('div', { style: { background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' } }, h('small', { style: { color: 'var(--text3)' } }, 'Total'), h('div', { style: { color: 'var(--text2)', fontWeight: 700 } }, fermentStats.total)),
      h('div', { style: { background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' } }, h('small', { style: { color: 'var(--text3)' } }, 'En cours'), h('div', { style: { color: 'var(--warn)', fontWeight: 700 } }, fermentStats.enCours)),
      h('div', { style: { background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' } }, h('small', { style: { color: 'var(--text3)' } }, 'Prêts'), h('div', { style: { color: 'var(--success)', fontWeight: 700 } }, fermentStats.pret))
    ),
    h('div', { className: 'scroll-x', style: { display: 'flex', gap: 6, marginBottom: 10 } },
      fermentStatusFilters.map(s => h('button', {
        key: s,
        onClick: () => setFermentStatusFilter(s),
        style: {
          flexShrink: 0,
          padding: '4px 9px',
          borderRadius: 999,
          border: fermentStatusFilter === s ? '1px solid var(--warn)' : '1px solid var(--border)',
          background: fermentStatusFilter === s ? 'rgba(251,146,60,.12)' : 'transparent',
          color: fermentStatusFilter === s ? 'var(--warn)' : 'var(--text3)',
          fontSize: 10,
          cursor: 'pointer'
        }
      }, s))
    ),
    showAddFerment && h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8, marginBottom: 10 } },
      h('input', { value: fermentForm.nom, onChange: e => setFermentForm(p => ({ ...p, nom: e.target.value })), placeholder: 'Nom du bocal', style: { padding: '7px 9px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)' } }),
      h('select', { value: fermentForm.type, onChange: e => setFermentForm(p => ({ ...p, type: e.target.value })), style: { padding: '7px 9px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)' } }, fermentTypes.map(t => h('option', { key: t }, t))),
      h('input', { type: 'date', value: fermentForm.startDate, onChange: e => setFermentForm(p => ({ ...p, startDate: e.target.value })), style: { padding: '7px 9px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)' } }),
      h('input', { type: 'number', min: 1, max: 120, value: fermentForm.durationDays, onChange: e => setFermentForm(p => ({ ...p, durationDays: e.target.value })), placeholder: 'Jours', style: { padding: '7px 9px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)' } }),
      h('input', { value: fermentForm.notes, onChange: e => setFermentForm(p => ({ ...p, notes: e.target.value })), placeholder: 'Notes', style: { gridColumn: '1/-1', padding: '7px 9px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)' } }),
      h('div', { style: { gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: 8 } },
        h('button', { onClick: () => setShowAddFerment(false), style: { padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer' } }, 'Annuler'),
        h('button', {
          onClick: () => {
            if (!fermentForm.nom.trim() || !fermentForm.startDate) return;
            upsertFerment({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              nom: fermentForm.nom.trim(),
              type: fermentForm.type,
              startDate: fermentForm.startDate,
              durationDays: Math.max(1, Number(fermentForm.durationDays) || 1),
              notes: fermentForm.notes.trim(),
              journal: [],
              done: false
            });
            setShowAddFerment(false);
            setFermentForm({ nom: '', type: 'Légumes', startDate: new Date().toISOString().slice(0, 10), durationDays: 14, notes: '' });
          },
          style: { padding: '6px 10px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,var(--warn),#fdba74)', color: '#06120d', cursor: 'pointer', fontWeight: 700 }
        }, 'Ajouter')
      )
    ),
    filteredFerments.length === 0 ? h('p', { style: { color: 'var(--text3)', fontStyle: 'italic', fontSize: 12 } }, fermentList.length ? 'Aucun bocal pour ce filtre.' : 'Aucun bocal suivi pour l’instant.') : h('div', { style: { display: 'grid', gap: 8 } },
      filteredFerments.map(item => {
        const meta = fermentMetaById.get(item.id) || { left: 0, progress: 0, status: 'En cours', statusColor: 'var(--gold)', targetIso: '' };
        const logs = Array.isArray(item.journal) ? item.journal : [];
        const latestLog = logs[0] || null;
        const jd = journalDrafts[item.id] || { date: new Date().toISOString().slice(0, 10), ph: '', odeur: '', couleur: '', note: '' };
        return h('div', { key: item.id, style: { background: 'var(--bg4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '10px 12px' } },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 } },
            h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
              h('strong', { style: { fontSize: 13 } }, item.nom),
              h('span', { style: { fontSize: 10, color: 'var(--text3)' } }, item.type),
              h('span', { style: { fontSize: 10, color: meta.statusColor, background: `${meta.statusColor}20`, borderRadius: 999, padding: '2px 8px' } }, meta.status)
            ),
            h('div', { style: { display: 'flex', gap: 6 } },
              h('button', { onClick: () => upsertFerment({ ...item, done: !item.done }), style: { padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 11 } }, item.done ? 'Réactiver' : 'Terminer'),
              h('button', { onClick: () => confirm('Supprimer ce bocal ?') && deleteFerment(item.id), style: { padding: '4px 8px', borderRadius: 8, border: '1px solid var(--danger-border)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: 11 } }, 'Supprimer')
            )
          ),
          h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, fontSize: 11, color: 'var(--text3)', marginBottom: 8 } },
            h('span', null, `Départ: ${fmtDate(item.startDate)}`),
            h('span', null, `Prêt le: ${fmtDate(meta.targetIso)}`),
            h('span', null, meta.left > 0 ? `J-${meta.left}` : 'À maturité')
          ),
          h('div', { style: { height: 6, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,.06)', marginBottom: 8 } }, h('div', { style: { width: `${meta.progress}%`, height: '100%', background: 'linear-gradient(90deg,var(--warn),#fdba74)' } })),
          item.notes && h('p', { style: { fontSize: 12, color: 'var(--text2)', marginBottom: 8 } }, item.notes),
          h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 } },
            latestLog ? h('div', { style: { fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 8, flexWrap: 'wrap' } }, h('span', null, `pH: ${latestLog.ph || '—'}`), h('span', null, `Odeur: ${latestLog.odeur || '—'}`), h('span', null, `Couleur: ${latestLog.couleur || '—'}`)) : h('span', { style: { fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' } }, 'Aucun relevé pH/odeur/couleur'),
            h('button', {
              onClick: () => {
                if (journalOpenId === item.id) {
                  setJournalOpenId(null);
                  return;
                }
                setJournalOpenId(item.id);
                setJournalDrafts(prev => ({ ...prev, [item.id]: prev[item.id] || { date: new Date().toISOString().slice(0, 10), ph: '', odeur: '', couleur: '', note: '' } }));
              },
              style: { padding: '4px 8px', borderRadius: 8, border: '1px solid var(--warn-border)', background: 'transparent', color: 'var(--warn)', cursor: 'pointer', fontSize: 11 }
            }, journalOpenId === item.id ? 'Fermer suivi' : '+ Relevé')
          ),
          journalOpenId === item.id && h('div', { style: { marginTop: 8, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,.12)' } },
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 8, marginBottom: 8 } },
              h('input', { type: 'date', value: jd.date, onChange: e => setJournalDrafts(prev => ({ ...prev, [item.id]: { ...jd, date: e.target.value } })), style: { padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)', fontSize: 11 } }),
              h('input', { value: jd.ph, onChange: e => setJournalDrafts(prev => ({ ...prev, [item.id]: { ...jd, ph: e.target.value } })), placeholder: 'pH', style: { padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)', fontSize: 11 } }),
              h('input', { value: jd.odeur, onChange: e => setJournalDrafts(prev => ({ ...prev, [item.id]: { ...jd, odeur: e.target.value } })), placeholder: 'Odeur', style: { padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)', fontSize: 11 } }),
              h('input', { value: jd.couleur, onChange: e => setJournalDrafts(prev => ({ ...prev, [item.id]: { ...jd, couleur: e.target.value } })), placeholder: 'Couleur', style: { padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)', fontSize: 11 } }),
              h('input', { value: jd.note, onChange: e => setJournalDrafts(prev => ({ ...prev, [item.id]: { ...jd, note: e.target.value } })), placeholder: 'Note (optionnel)', style: { gridColumn: '1/-1', padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)', fontSize: 11 } })
            ),
            h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: logs.length ? 8 : 0 } },
              h('button', {
                onClick: () => {
                  if (!jd.ph && !jd.odeur && !jd.couleur) return;
                  const entry = {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    date: jd.date || new Date().toISOString().slice(0, 10),
                    ph: (jd.ph || '').trim(),
                    odeur: (jd.odeur || '').trim(),
                    couleur: (jd.couleur || '').trim(),
                    note: (jd.note || '').trim()
                  };
                  upsertFerment({ ...item, journal: [entry, ...(Array.isArray(item.journal) ? item.journal : [])] });
                  setJournalDrafts(prev => ({ ...prev, [item.id]: { date: new Date().toISOString().slice(0, 10), ph: '', odeur: '', couleur: '', note: '' } }));
                },
                style: { padding: '5px 10px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,var(--warn),#fdba74)', color: '#06120d', cursor: 'pointer', fontSize: 11, fontWeight: 700 }
              }, 'Enregistrer relevé')
            ),
            logs.length > 0 && h('div', { style: { display: 'grid', gap: 6 } }, logs.slice(0, 4).map(log => h('div', {
              key: log.id,
              style: { border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', fontSize: 11, color: 'var(--text3)', background: 'rgba(0,0,0,.08)' }
            },
            h('div', { style: { marginBottom: 4 } }, `${fmtDate(log.date)} · pH ${log.ph || '—'} · Odeur ${log.odeur || '—'} · Couleur ${log.couleur || '—'}`),
            log.note && h('div', null, log.note)
            )))
          )
        );
      })
    )
    ),

    h('div', { style: { display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' } },
      h('div', { className: 'scroll-x', style: { display: 'flex', gap: 6, flex: 1 } },
        cats.map(c => h('button', {
          key: c,
          onClick: () => setFilterCat(c),
          style: {
            flexShrink: 0,
            padding: '5px 14px',
            borderRadius: 20,
            border: filterCat === c ? '1px solid var(--gold)' : '1px solid var(--border)',
            background: filterCat === c ? 'rgba(0,0,0,.15)' : 'transparent',
            color: filterCat === c ? 'var(--gold)' : 'var(--text3)',
            fontSize: 12,
            cursor: 'pointer'
          }
        }, c))
      ),
      h('button', {
        onClick: () => setShowAdd(v => !v),
        style: { flexShrink: 0, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }
      }, '+ Recette'),
      h('button', {
        onClick: exportCsv,
        title: 'Exporter tes recettes en CSV',
        style: { flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }
      }, '⬇ CSV'),
      h('button', {
        onClick: onImportClick,
        title: 'Importer des recettes depuis un CSV',
        style: { flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }
      }, '⬆ CSV')
    ),

    showAdd && h('div', {
      style: {
        background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
        borderRadius: 'var(--radius)',
        padding: 20,
        marginBottom: 20,
        border: '1px solid var(--gold-border)'
      }
    },
    h('h3', { style: { marginBottom: 8 } }, 'Nouvelle recette'),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 12 } },
      h('input', { value: addForm.nom, onChange: e => setAddForm(p => ({ ...p, nom: e.target.value })), placeholder: 'Nom', style: { gridColumn: '1/-1', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)' } }),
      h('select', { value: addForm.categorie, onChange: e => setAddForm(p => ({ ...p, categorie: e.target.value })), style: { padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)' } }, cats.filter(c => c !== 'Tout').map(c => h('option', { key: c }, c))),
      h('input', { value: addForm.tags, onChange: e => setAddForm(p => ({ ...p, tags: e.target.value })), placeholder: 'Tags', style: { padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)' } }),
      h('textarea', { value: addForm.ingredients, onChange: e => setAddForm(p => ({ ...p, ingredients: e.target.value })), rows: 4, placeholder: 'Ingrédients (un par ligne)', style: { padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit' } }),
      h('textarea', { value: addForm.preparation, onChange: e => setAddForm(p => ({ ...p, preparation: e.target.value })), rows: 4, placeholder: 'Préparation', style: { padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit' } }),
      h('input', { value: addForm.apports, onChange: e => setAddForm(p => ({ ...p, apports: e.target.value })), placeholder: 'Apports', style: { padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)' } }),
      h('input', { value: addForm.budget, onChange: e => setAddForm(p => ({ ...p, budget: e.target.value })), placeholder: 'Budget', style: { padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text)' } })
    ),
    h('div', { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' } },
      h('button', { onClick: () => setShowAdd(false), style: { padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer' } }, 'Annuler'),
      h('button', {
        onClick: () => {
          if (!addForm.nom.trim()) return;
          upsertRecipe({
            id: Date.now().toString(),
            nom: addForm.nom,
            categorie: addForm.categorie,
            tags: addForm.tags.split(',').map(t => t.trim()).filter(Boolean),
            ingredients: addForm.ingredients.split('\n').filter(Boolean),
            preparation: addForm.preparation,
            apports: addForm.apports,
            budget: addForm.budget
          });
          setShowAdd(false);
          setAddForm({ nom: '', categorie: 'Salés', tags: '', ingredients: '', preparation: '', apports: '', budget: '' });
        },
        style: { padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,var(--gold),var(--gold2))', color: '#06120d', cursor: 'pointer', fontWeight: 700 }
      }, 'Sauvegarder')
    )
    ),

    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 } },
      filtered.map(r => {
        const isDefault = DEFAULT_RECIPES.some(dr => dr.id === r.id);
        return h('div', {
          key: r.id,
          onClick: () => setSelected(r.id),
          style: { background: 'linear-gradient(160deg,var(--bg3),var(--bg2))', borderRadius: 'var(--radius)', padding: '16px 18px', border: '1px solid var(--border)', cursor: 'pointer' }
        },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
          h('span', { style: { fontSize: 10, color: 'var(--gold)' } }, r.categorie),
          !isDefault && h('button', {
            onClick: e => {
              e.stopPropagation();
              if (confirm('Supprimer cette recette ?')) deleteRecipe(r.id);
            },
            style: { background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }
          }, '×')
        ),
        h('h3', { style: { fontSize: 17, marginBottom: 8 } }, r.nom),
        h('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 } }, (r.tags || []).slice(0, 3).map(t => h('span', { key: t, style: { fontSize: 9, padding: '1px 6px', borderRadius: 20, background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' } }, t))),
        h('div', { style: { fontSize: 11, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between' } }, h('span', null, `${(r.ingredients || []).length} ingrédients`), h('span', { style: { color: 'var(--gold)' } }, r.budget))
        );
      })
    )
  );
}


// ─── Jeux (vue pilote gamifiée) ───
const CHESS_START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const GLYPH = { wp:'♙', wn:'♘', wb:'♗', wr:'♖', wq:'♕', wk:'♔',
                bp:'♟', bn:'♞', bb:'♝', br:'♜', bq:'♛', bk:'♚' };
const BADGES = [
  { id:'first_move',     icon:'♟', label:'Premier coup',  desc:'Jouer ton 1er coup aux échecs' },
  { id:'checkmate',      icon:'♚', label:'Échec et mat', desc:'Gagner une partie d’échecs' },
  { id:'crossword_done', icon:'🧩', label:'Grille bouclée', desc:'Compléter les mots fléchés' },
  { id:'streak3',        icon:'🔥', label:'Série de 3',  desc:'Jouer 3 jours d’affilée' }
];
// Mini grille de mots croisés gwada/couple — les mots se croisent sur AMOUR (vertical)
const CW_WORDS = [
  { num:1, dir:'across', r:0, c:0, answer:'DJA',   clue:'Negus ___, ton nom d’artiste' },
  { num:2, dir:'down',   r:0, c:2, answer:'AMOUR', clue:'Ce qui vous lie ♡' },
  { num:3, dir:'across', r:2, c:0, answer:'GWO',   clue:'« Gros » en créole' },
  { num:4, dir:'across', r:4, c:2, answer:'RIVYE', clue:'« Rivière » en créole' }
];
const CW_SOL = {}, CW_START = {}, CW_ROWS = 5, CW_COLS = 7;
CW_WORDS.forEach(w => {
  CW_START[w.r + '-' + w.c] = w.num;
  for (let i = 0; i < w.answer.length; i++) {
    const r = w.dir === 'down' ? w.r + i : w.r;
    const c = w.dir === 'across' ? w.c + i : w.c;
    CW_SOL[r + '-' + c] = w.answer[i];
  }
});
const todayStr = () => new Date().toISOString().slice(0, 10);
const awardBadge = (g, id) => { if (!g.badges.includes(id)) g.badges = [...g.badges, id]; };
const touchStreak = g => {
  const t = todayStr();
  if (g.streak.lastDay === t) return;
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  g.streak = { count: g.streak.lastDay === y ? (g.streak.count || 0) + 1 : 1, lastDay: t };
  if (g.streak.count >= 3) awardBadge(g, 'streak3');
};

function JeuxView({ games, updateGames }) {
  const h = React.createElement;
  const [tab, setTab] = useState('chess');
  const [sel, setSel] = useState(null);
  const me = localStorage.getItem('ld-username') || 'Joueur';
  const hasChess = typeof window.Chess === 'function';

  // Reconstruit la partie depuis le FEN stocké (sync via Supabase)
  const chess = useMemo(() => {
    if (!hasChess) return null;
    const c = new window.Chess();
    try { c.load(games.chess.fen || CHESS_START); } catch (_) { c.reset(); }
    return c;
  }, [games.chess.fen, hasChess]);

  const turn = chess ? chess.turn() : 'w';
  const legal = chess && sel ? chess.moves({ square: sel, verbose: true }) : [];
  const targets = new Set(legal.map(m => m.to));

  const doMove = (from, to) => {
    const c = new window.Chess();
    try { c.load(games.chess.fen || CHESS_START); } catch (_) {}
    const mv = c.move({ from, to, promotion: 'q' });
    if (!mv) return;
    updateGames(g => {
      const ng = clone(g);
      ng.chess.fen = c.fen();
      ng.chess.lastBy = me;
      awardBadge(ng, 'first_move');
      if (c.in_checkmate()) { ng.chess.result = (c.turn() === 'w' ? 'Noirs' : 'Blancs') + ' gagnent — échec et mat'; awardBadge(ng, 'checkmate'); }
      else if (c.in_draw()) ng.chess.result = 'Partie nulle';
      else ng.chess.result = '';
      touchStreak(ng);
      return ng;
    });
    setSel(null);
  };

  const clickSquare = (sq, piece) => {
    if (games.chess.result) return;
    if (sel && targets.has(sq)) { doMove(sel, sq); return; }
    if (piece && piece.color === turn) { setSel(sq === sel ? null : sq); return; }
    setSel(null);
  };

  const resetChess = () => updateGames(g => {
    const ng = clone(g);
    ng.chess = { fen: CHESS_START, lastBy: me, result: '' };
    return ng;
  });

  const setCell = (key, val) => updateGames(g => {
    const ng = clone(g);
    const f = { ...ng.crossword.filled };
    if (val) f[key] = val; else delete f[key];
    ng.crossword.filled = f;
    const done = Object.keys(CW_SOL).every(k => (f[k] || '') === CW_SOL[k]);
    ng.crossword.done = done;
    if (done) awardBadge(ng, 'crossword_done');
    touchStreak(ng);
    return ng;
  });

  // ── Sous-onglets ──
  const subTabs = [{ id:'chess', label:'♞ Échecs' }, { id:'crossword', label:'🧩 Mots fléchés' }, { id:'rewards', label:'🏆 Récompenses' }];
  const tabBar = h('div', { style:{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' } },
    subTabs.map(t => h('button', {
      key:t.id, onClick:() => setSel(null) || setTab(t.id),
      style:{ padding:'10px 16px', minHeight:44, borderRadius:'var(--radius-sm)', cursor:'pointer',
        fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:'.04em',
        background: tab === t.id ? 'var(--gold-bg)' : 'rgba(255,255,255,.04)',
        color: tab === t.id ? 'var(--gold2)' : 'var(--text3)',
        border: '1px solid ' + (tab === t.id ? 'var(--gold-border)' : 'var(--border)') }
    }, t.label)));

  // ── Échiquier ──
  const renderChess = () => {
    if (!hasChess) return h('div', { className:'lx-card', style:{ padding:20, color:'var(--text2)' } },
      'Le moteur d’échecs n’a pas pu se charger (connexion ?). Réessaie en rechargeant la page.');
    const board = chess.board();
    const status = games.chess.result
      ? games.chess.result
      : (chess.in_check() ? 'Échec — ' : '') + 'Au tour des ' + (turn === 'w' ? 'Blancs ◆ (Dja)' : 'Noirs ◇ (Liika)');
    const cells = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const sq = 'abcdefgh'[c] + (8 - r);
      const p = board[r][c];
      const dark = (r + c) % 2 === 1;
      const isSel = sel === sq;
      const isTarget = targets.has(sq);
      cells.push(h('button', {
        key:sq, onClick:() => clickSquare(sq, p),
        style:{ aspectRatio:'1', border:'none', cursor:'pointer', position:'relative',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'clamp(20px,7vw,34px)', lineHeight:1,
          background: isSel ? 'var(--gold-border)' : dark ? '#2c5740' : '#e7e2cf',
          color: p && p.color === 'b' ? '#1a1a1a' : '#3a3a3a',
          boxShadow: isSel ? 'inset 0 0 0 3px var(--gold2)' : 'none' }
      },
        p ? GLYPH[p.color + p.type] : '',
        isTarget ? h('span', { style:{ position:'absolute', width:p ? '100%' : 14, height:p ? '100%' : 14,
          borderRadius: p ? '0' : '50%',
          background: p ? 'rgba(217,183,95,.30)' : 'rgba(217,183,95,.55)',
          boxShadow: p ? 'inset 0 0 0 3px var(--gold)' : 'none', pointerEvents:'none' } }) : null
      ));
    }
    return h('div', null,
      h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:12, flexWrap:'wrap' } },
        h('span', { style:{ fontFamily:"'Space Mono',monospace", fontSize:13, color: games.chess.result ? 'var(--gold2)' : 'var(--text)', fontWeight:700 } }, status),
        h('button', { onClick:resetChess, style:{ padding:'8px 14px', minHeight:40, borderRadius:'var(--radius-xs)', cursor:'pointer',
          background:'rgba(255,255,255,.05)', color:'var(--text2)', border:'1px solid var(--border2)', fontSize:12 } }, 'Nouvelle partie')),
      h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', maxWidth:440, width:'100%',
        borderRadius:'var(--radius-xs)', overflow:'hidden', border:'1px solid var(--border2)', boxShadow:'var(--shadow)' } }, cells),
      games.chess.lastBy ? h('div', { style:{ marginTop:10, fontSize:11, color:'var(--text3)', fontFamily:"'Space Mono',monospace" } }, 'Dernier coup : ' + games.chess.lastBy) : null);
  };

  // ── Mots fléchés ──
  const renderCrossword = () => {
    const filled = games.crossword.filled || {};
    const rows = [];
    for (let r = 0; r < CW_ROWS; r++) {
      const row = [];
      for (let c = 0; c < CW_COLS; c++) {
        const key = r + '-' + c;
        const active = CW_SOL[key] !== undefined;
        if (!active) { row.push(h('div', { key:c, style:{ aspectRatio:'1', background:'transparent' } })); continue; }
        const num = CW_START[key];
        const val = filled[key] || '';
        const ok = games.crossword.done;
        row.push(h('div', { key:c, style:{ position:'relative', aspectRatio:'1' } },
          num ? h('span', { style:{ position:'absolute', top:2, left:3, fontSize:9, color:'var(--gold)', fontFamily:"'Space Mono',monospace", pointerEvents:'none' } }, num) : null,
          h('input', { value:val, maxLength:1, inputMode:'text',
            onChange:e => setCell(key, (e.target.value || '').toUpperCase().replace(/[^A-Z]/g, '')),
            style:{ width:'100%', height:'100%', textAlign:'center', textTransform:'uppercase',
              fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(16px,5vw,24px)', fontWeight:700,
              border:'1px solid var(--border2)', borderRadius:4, outline:'none',
              background: ok ? 'var(--success-bg)' : 'rgba(243,239,226,.06)',
              color: ok ? 'var(--success)' : 'var(--text)' } })));
      }
      rows.push(h('div', { key:r, style:{ display:'grid', gridTemplateColumns:'repeat(' + CW_COLS + ',1fr)', gap:3 } }, row));
    }
    const clue = (dir) => CW_WORDS.filter(w => w.dir === dir).map(w =>
      h('li', { key:w.num, style:{ marginBottom:6, fontSize:13, color:'var(--text2)' } },
        h('b', { style:{ color:'var(--gold)' } }, w.num + '. '), w.clue));
    return h('div', null,
      games.crossword.done ? h('div', { style:{ marginBottom:14, padding:'10px 14px', borderRadius:'var(--radius-sm)', background:'var(--success-bg)', color:'var(--success)', fontWeight:700, fontSize:13 } }, '✓ Grille complétée ensemble !') : null,
      h('div', { style:{ display:'grid', gap:3, maxWidth:360, width:'100%', marginBottom:20 } }, rows),
      h('div', { style:{ display:'flex', gap:28, flexWrap:'wrap' } },
        h('div', null, h('div', { className:'eyebrow', style:{ marginBottom:8 } }, 'Horizontal'), h('ul', { style:{ listStyle:'none' } }, clue('across'))),
        h('div', null, h('div', { className:'eyebrow', style:{ marginBottom:8 } }, 'Vertical'), h('ul', { style:{ listStyle:'none' } }, clue('down')))));
  };

  // ── Récompenses (streak + badges) ──
  const renderRewards = () => {
    const unlocked = games.badges || [];
    return h('div', null,
      h('div', { className:'lx-card', style:{ padding:'20px 22px', marginBottom:20, display:'flex', alignItems:'center', gap:18 } },
        h('div', { style:{ fontSize:44, lineHeight:1, filter: games.streak.count > 0 ? 'none' : 'grayscale(1) opacity(.4)' } }, '🔥'),
        h('div', null,
          h('div', { style:{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:700, color:'var(--gold2)' } }, (games.streak.count || 0) + (games.streak.count > 1 ? ' jours' : ' jour')),
          h('div', { className:'eyebrow' }, 'Série de jeu à deux'))),
      h('div', { className:'eyebrow', style:{ marginBottom:12 } }, 'Badges — ' + unlocked.length + ' / ' + BADGES.length),
      h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 } },
        BADGES.map(b => {
          const got = unlocked.includes(b.id);
          return h('div', { key:b.id, className:'lx-card', style:{ padding:'16px 14px', textAlign:'center', opacity: got ? 1 : .45,
            border: '1px solid ' + (got ? 'var(--gold-border)' : 'var(--border)') } },
            h('div', { style:{ fontSize:34, marginBottom:8, filter: got ? 'none' : 'grayscale(1)' } }, b.icon),
            h('div', { style:{ fontSize:13, fontWeight:700, color: got ? 'var(--gold2)' : 'var(--text3)', marginBottom:4 } }, b.label),
            h('div', { style:{ fontSize:11, color:'var(--text3)' } }, got ? '✓ Débloqué' : b.desc));
        })));
  };

  return h('div', null,
    h('div', { className:'dash-hero lx-card', style:{ padding:'22px 24px', marginBottom:22 } },
      h('div', { className:'eyebrow', style:{ marginBottom:8 } }, 'Espace jeu — à deux'),
      h('h2', { style:{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, margin:0 } }, 'Jeux 🎮'),
      h('p', { style:{ color:'var(--text2)', marginTop:8, fontSize:14, maxWidth:560 } },
        'Jouez ensemble, chacun de son côté : chaque coup se synchronise en direct. Gagnez des badges et tenez votre série 🔥.')),
    tabBar,
    tab === 'chess' && renderChess(),
    tab === 'crossword' && renderCrossword(),
    tab === 'rewards' && renderRewards());
}

// ─── Guide Formateur Code Rousseau REMC ───
const REMC_DOMAINES = [
  { id:'d1', icon:'🔧', titre:'D1 — Maîtrise du véhicule', competences:[
    { id:'c11', code:'C1.1', titre:'Prise en main du véhicule', detail:'Réglages poste, vérifications ext./int., sécurité des passagers, signaux d\'urgence.' },
    { id:'c12', code:'C1.2', titre:'Direction et vitesse', detail:'Trajectoires en courbe, freinages progressif et d\'urgence, régulation de l\'allure.' },
    { id:'c13', code:'C1.3', titre:'Manœuvres', detail:'Créneaux, demi-tour, marche arrière, stationnement en côte.' },
  ]},
  { id:'d2', icon:'👁', titre:'D2 — Circulation réelle', competences:[
    { id:'c21', code:'C2.1', titre:'Percevoir et analyser', detail:'Balayage visuel, angles morts, anticipation des situations à risque, carrefours.' },
    { id:'c22', code:'C2.2', titre:'Règles de circulation', detail:'Signalisation, priorités, vitesses, distances de sécurité, dépassements.' },
    { id:'c23', code:'C2.3', titre:'Situations particulières', detail:'Nuit, pluie, autoroute, zone urbaine dense, travaux, conditions dégradées.' },
  ]},
  { id:'d3', icon:'🧠', titre:'D3 — Comportements responsables', competences:[
    { id:'c31', code:'C3.1', titre:'Attitude coopérative', detail:'Respect des autres usagers, communication gestuelle et lumineuse, partage de la route.' },
    { id:'c32', code:'C3.2', titre:'États internes', detail:'Fatigue, stress, émotions, alcool/stupéfiants, téléphone — reconnaître et gérer.' },
    { id:'c33', code:'C3.3', titre:'Éco-conduite', detail:'Anticipation, montée en régime économique, rétrogradation douce, réduction des émissions.' },
  ]},
];
const REMC_NIV_LABEL = ['Non évalué','En cours','Acquis (guidé)','Autonome'];
const REMC_NIV_COLOR = ['var(--text-muted)','var(--accent-liika)','var(--gold)','#4ade80'];
const REMC_ETAPES = [
  { id:'pt', label:'PT — Présentation de la tâche', desc:'L\'élève observe et comprend la tâche avant de l\'exécuter.' },
  { id:'et', label:'ET — Exécution de la tâche', desc:'L\'élève s\'exerce sous guidage du formateur.' },
  { id:'ev', label:'EV — Évaluation', desc:'Le formateur évalue l\'acquisition, donne le bilan et fixe les objectifs suivants.' },
];
const REMC_FICHES_REVISION = [
  {
    id:'fr11', code:'C1.1', domaine:'🔧 D1', titre:'Prise en main du véhicule',
    pointsCles:[
      'Réglages poste : siège (bras légèrement fléchis sur le volant), dossier incliné, appuie-tête au niveau des yeux, ceinture',
      'Rétroviseurs : intérieur (cadre complet de la lunette arrière), extérieurs (flancs visibles sur 1/4)',
      'Vérifications extérieures : état des pneus (sculpture ≥ 1,6 mm, pression), éclairages, niveaux (huile, liquide de frein, lave-glace, refroidissement)',
      'Voyants tableau de bord : moteur (orange), batterie (rouge), température (rouge), préchauffage diesel (serpentin orange)',
      'Position de conduite : mains à 9h15, dos appuyé, cuisses légèrement inclinées vers le bas',
    ],
    erreursFrequentes:[
      'Oublier les pneus arrière lors des vérifications extérieures',
      'Rétroviseurs mal réglés → angles morts élargis',
      'Démarrer avec un voyant rouge allumé (batterie, température, pression huile)',
      'Siège trop proche ou trop loin → gêne sur pédale de frein d\'urgence',
    ],
    questionsExamen:[
      'Que signifie le voyant moteur orange allumé en roulant ?',
      'À quelle fréquence vérifier la pression des pneus ?',
      'Quelle est la profondeur de sculpture minimale légale des pneus ?',
      'Comment régler correctement les rétroviseurs extérieurs ?',
    ],
  },
  {
    id:'fr12', code:'C1.2', domaine:'🔧 D1', titre:'Direction et vitesse',
    pointsCles:[
      'Technique de direction : mains en couronne (9h15), pas de croisement des bras, technique shuffle au-dessous de 40 km/h',
      'Trajectoire en courbe : regard loin (point de sortie), décélérer AVANT la courbe, maintenir l\'allure dans la courbe',
      'Freinage progressif : appui ferme et croissant, relâchement doux avant l\'arrêt complet',
      'Freinage d\'urgence : pied fort et maintenu (confier à l\'ABS), garder les roues droites, regarder la sortie',
      'Distances de sécurité : règle des 2 secondes (chronomètre sur repère fixe), × 2 sur route mouillée, × 3 sur verglas',
    ],
    erreursFrequentes:[
      'Accélérer en courbe → sous-virage (sortie de route)',
      'Freiner en courbe → transfert de charge, perte d\'adhérence',
      'Regard fixé devant le capot au lieu de loin (15-20 m minimum)',
      'Relâcher le frein trop tôt en freinage d\'urgence → allongement de la distance d\'arrêt',
    ],
    questionsExamen:[
      'Comment réagir en cas d\'aquaplaning ?',
      'Quelle distance de sécurité en ville à 50 km/h (temps de réaction de 1s) ?',
      'Pourquoi ne pas freiner en courbe avec un véhicule sans ABS ?',
      'Qu\'est-ce que la distance d\'arrêt (réaction + freinage) à 90 km/h ?',
    ],
  },
  {
    id:'fr13', code:'C1.3', domaine:'🔧 D1', titre:'Manœuvres',
    pointsCles:[
      'Créneau : vérification rétros + angle mort, 45° puis braquage opposé, trottoir visible dans le rétro bas',
      'Demi-tour : évaluer la largeur, clignotant gauche, 3 à 5 points si nécessaire, priorité aux piétons',
      'Marche arrière droite : regard par la lunette et les rétros, tête tournée, allure lente (inférieure au pas)',
      'Stationnement en côte : frein à main serré, 1ère (montée) ou marche arrière (descente), roues braquées vers le trottoir',
      'Créneau en bataille : angle 90°, utiliser les lignes peintes comme repères',
    ],
    erreursFrequentes:[
      'Heurter le trottoir lors de la rentrée en créneau (pas assez de braquage)',
      'Oublier l\'angle mort avant de reculer',
      'Repartir sans desserrer le frein à main → surchauffe des garnitures',
      'Trop grande vitesse en marche arrière → réaction tardive',
    ],
    questionsExamen:[
      'Quand le demi-tour est-il interdit ?',
      'Comment stationner en côte montante côté droit ?',
      'Comment vérifier que le créneau est réussi sans descendre du véhicule ?',
    ],
  },
  {
    id:'fr21', code:'C2.1', domaine:'👁 D2', titre:'Percevoir et analyser',
    pointsCles:[
      'Balayage visuel : miroir intérieur toutes les 5-8 secondes, rétros extérieurs à chaque changement de situation',
      'Angle mort : vérification tête (regard par-dessus l\'épaule) avant tout changement de direction ou de voie',
      'Anticipation : lire la route 12 s devant en rase campagne, 4-6 s en ville',
      'Zones à risque : sorties de parking, entrées d\'immeubles, arrêts de bus, arrêts de tramway',
      'Cyclistes et piétons : 1 m d\'écart latéral en agglomération, 1,5 m hors agglomération',
    ],
    erreursFrequentes:[
      'Fixation du regard (regarder uniquement droit devant)',
      'Négliger l\'angle mort lors des insertions sur voie rapide',
      'Sous-estimer la vitesse d\'un cycliste ou d\'un piéton qui traverse',
      'Réagir trop tard à un obstacle lointain (manque d\'anticipation)',
    ],
    questionsExamen:[
      'Qu\'est-ce que l\'angle mort et comment le supprimer ?',
      'Pourquoi regarder loin devant améliore-t-il la conduite ?',
      'Quelle distance latérale respecter lors du dépassement d\'un cycliste ?',
    ],
  },
  {
    id:'fr22', code:'C2.2', domaine:'👁 D2', titre:'Règles de circulation',
    pointsCles:[
      'Priorité à droite : s\'applique sauf signalisation contraire (cédez-le-passage, STOP, voie prioritaire)',
      'Feux tricolores : rouge = arrêt obligatoire, orange = arrêt si possible (pas d\'accélération), vert = passage si sûr',
      'Vitesses max : 50 km/h en agglomération, 80 km/h route, 110 km/h voie express (pluie), 130 km/h autoroute (pluie : 110)',
      'Dépassement interdit : ligne continue, en haut de côte, en courbe, à une intersection, sur passage piéton',
      'Ceinture : obligatoire pour conducteur et tous passagers, enfant < 10 ans = siège homologué',
    ],
    erreursFrequentes:[
      'Confondre une route prioritaire avec une voie prioritaire — la signalisation prime toujours',
      'Passer à l\'orange en accélérant au lieu de s\'arrêter',
      'Dépasser sur ligne discontinue mais dans une zone interdite (virage)',
      'Oublier de baisser la vitesse en cas de pluie sur autoroute (130 → 110)',
    ],
    questionsExamen:[
      'Quelle est la vitesse maximale sur route en France hors agglomération ?',
      'Peut-on dépasser à droite sur autoroute ?',
      'À quelle distance d\'un passage piéton le dépassement est-il interdit ?',
      'Quelle règle s\'applique lorsque deux véhicules arrivent simultanément à une intersection non signalisée ?',
    ],
  },
  {
    id:'fr23', code:'C2.3', domaine:'👁 D2', titre:'Situations particulières',
    pointsCles:[
      'Nuit : feux de croisement dès le coucher du soleil, feux de route dès que route libre, croiser = codes immédiats',
      'Pluie : distances × 2, vitesse adaptée, en cas d\'aquaplaning relâcher l\'accélérateur sans freiner ni braquer brusquement',
      'Verglas / neige : distances × 3, douceur sur tous les organes (gazole, frein, volant), chaînes ou pneus hiver',
      'Autoroute : insertion par accélération sur la bretelle + clignotant, sortie par clignotant précoce + décélération sur bretelle',
      'Zones de travaux : réduire la vitesse (panneau obligatoire), respecter les déviations et la signalétique temporaire',
    ],
    erreursFrequentes:[
      'Freiner brusquement en aquaplaning → aggravation de la perte de contrôle',
      'Garder les feux de route face à un véhicule qui arrive (éblouissement)',
      'Accélérer pour s\'insérer trop tard sur autoroute',
      'Sous-estimer le sol humide après une longue période sèche (premier quart d\'heure de pluie = très glissant)',
    ],
    questionsExamen:[
      'Que faire si votre véhicule part en aquaplaning ?',
      'Quand allumer les feux de brouillard arrière ?',
      'Comment s\'insérer correctement sur autoroute ?',
      'Quelle est la distance de freinage sur verglas à 50 km/h ?',
    ],
  },
  {
    id:'fr31', code:'C3.1', domaine:'🧠 D3', titre:'Attitude coopérative',
    pointsCles:[
      'Clignotants : anticiper ≥ 3 secondes avant la manœuvre, les désactiver après',
      'Piétons : prioritaires sur passage piéton, même si feu vert pour le conducteur',
      'Cyclistes : ne pas les coller, anticiper leur trajectoire (portes, nids-de-poule), les dépasser avec 1,5 m',
      'Klaxon : avertissement uniquement, interdit en agglomération (sauf danger immédiat)',
      'Communication lumineuse : appel de phares = « attention » ou « merci », jamais pour intimider',
    ],
    erreursFrequentes:[
      'Oublier de désactiver le clignotant après un changement de voie',
      'Forcer le passage devant un piéton engagé sur un passage piéton',
      'Intimider un cycliste avec l\'avertisseur sonore',
      'Prendre la priorité sur un piéton au feu vert (manœuvre de tourne-à-droite)',
    ],
    questionsExamen:[
      'Un piéton est sur le passage piéton, votre feu passe au vert. Que faites-vous ?',
      'Un cycliste est devant vous sur une route étroite. Comment le dépasser ?',
      'L\'utilisation du klaxon est-elle toujours autorisée ?',
    ],
  },
  {
    id:'fr32', code:'C3.2', domaine:'🧠 D3', titre:'États internes',
    pointsCles:[
      'Fatigue : pause ≥ 20 min toutes les 2h, signes précurseurs (clignements, dérivées, rêveries)',
      'Alcool : taux légal ≤ 0,5 g/L sang (0,2 g/L jeune conducteur < 3 ans de permis), effet × 2 sur temps de réaction',
      'Téléphone : tenu en main = interdit, kit mains-libres autorisé mais divise l\'attention par 2',
      'Médicaments : vignette 1 (jaune) = prudence, 2 (orange) = ne pas conduire seul, 3 (rouge) = interdiction, 4 (noir) = absolument interdit',
      'Substances : tolérance zéro pour les stupéfiants (infraction pénale)',
    ],
    erreursFrequentes:[
      'Poursuivre la route en cas de somnolence (ouvrir les vitres ne suffit pas)',
      'Croire que le café ou la douche froide élimine les effets de l\'alcool',
      'Utiliser le GPS sur le téléphone en main pendant la conduite',
      'Ne pas lire la notice des médicaments avant de conduire',
    ],
    questionsExamen:[
      'Quelle est la différence de taux d\'alcool autorisé entre un conducteur confirmé et un jeune conducteur ?',
      'À partir de quelle vignette médicament ne doit-on pas conduire ?',
      'La fatigue peut-elle provoquer des réflexes similaires à l\'alcoolémie ?',
      'Quels sont les signes qui indiquent que l\'on doit s\'arrêter pour se reposer ?',
    ],
  },
  {
    id:'fr33', code:'C3.3', domaine:'🧠 D3', titre:'Éco-conduite',
    pointsCles:[
      'Anticipation : lever le pied tôt, laisser le moteur décélérer (frein moteur = 0 carburant avec injection),  éviter les à-coups',
      'Passage des vitesses : monter en vitesse tôt (2 000 tr/min essence, 1 500 tr/min diesel)',
      'Pneus : sous-gonflage de 0,5 bar = +2 % de consommation et usure accélérée',
      'Vitesse : 110 km/h au lieu de 130 km/h → économie de 20 % de carburant',
      'Climatisation : +0,5 à 1 L/100 km, privilégier l\'aération à moins de 80 km/h',
    ],
    erreursFrequentes:[
      'Rouler en sous-régime (moteur « pousse » = consommation excessive et risque de casse)',
      'Laisser chauffer le moteur à l\'arrêt (inutile sur les véhicules modernes)',
      'Garder la climatisation allumée en ville à basse vitesse sans nécessité',
      'Freiner trop tard et rattraper la vitesse perdue — cycle stop-and-go énergivore',
    ],
    questionsExamen:[
      'Pourquoi l\'anticipation est-elle le premier levier de l\'éco-conduite ?',
      'Quelle différence de consommation entre 130 et 110 km/h en autoroute ?',
      'L\'éco-conduite affecte-t-elle la sécurité ? Pourquoi ?',
      'À partir de quelle vitesse fermer les fenêtres est-il préférable à la climatisation ?',
    ],
  },
];

const REMC_FICHES_SECURITE = [
  {
    id:'sec1', icon:'🍺', titre:'Alcool & stupéfiants',
    pointsCles:[
      'Taux légal : 0,5 g/L de sang (0,2 g/L pour les conducteurs novices < 3 ans de permis et les professionnels du transport)',
      'Effets : réduction du champ visuel, allongement du temps de réaction (× 2 à 0,5 g/L), fausse sensation de maîtrise',
      'Élimination : environ 0,10 à 0,15 g/L/h — ni café, ni douche ne l\'accélèrent',
      'Stupéfiants : tolérance zéro (dépistage salivaire ou sanguin), cumul alcool + drogue = circonstance aggravante',
      'Médicaments : pictogramme 3 losanges rouges ou 4 losanges noirs → interdiction de conduire',
    ],
    sanctions:[
      '≥ 0,5 g/L et < 0,8 g/L : contravention de 4ᵉ classe, 6 pts retirés, 750 € d\'amende, suspension jusqu\'à 3 ans',
      '≥ 0,8 g/L : délit pénal, 6 pts, 4 500 € d\'amende, 2 ans d\'emprisonnement, suspension 3 ans',
      'Refus de dépistage : mêmes peines que ≥ 0,8 g/L',
      'Récidive : doublement des peines, annulation possible du permis',
      'Stupéfiants seuls : 2 ans d\'emprisonnement, 4 500 €, 6 pts, suspension 3 ans',
    ],
    conseilsFormateur:[
      'Illustrer l\'effet avec le test du pendule ou la simulation de temps de réaction',
      'Insister sur la fausse lucidité : l\'élève doit comprendre qu\'on ne ressent pas toujours son ivresse',
      'Aborder le lendemain matin (« sleep and sober » est un mythe)',
      'Rappeler que le passager qui laisse conduire un conducteur alcoolisé est en faute également',
    ],
  },
  {
    id:'sec2', icon:'⚡', titre:'Vitesse — risques et limites',
    pointsCles:[
      'Limites légales : 50 km/h agglomération, 80 km/h route (hors voie rapide), 110 km/h voie express (pluie : 100), 130 km/h autoroute (pluie : 110)',
      'Distance d\'arrêt à 50 km/h : ≈ 28 m (réaction 14 m + freinage 14 m) — soit la longueur de 2 bus',
      'Distance d\'arrêt à 90 km/h : ≈ 75 m ; à 130 km/h : ≈ 160 m (× 5,7 vs 50 km/h)',
      'Sur route mouillée : × 1,5 à 2 sur la distance de freinage ; verglas : × 3 à 5',
      'La vitesse est impliquée dans 1 accident mortel sur 3 en France',
    ],
    sanctions:[
      'Excès < 20 km/h hors agglomération : amende 68 €, 1 pt',
      'Excès ≥ 20 et < 30 km/h : amende 135 €, 2 pts',
      'Excès ≥ 30 et < 40 km/h : amende 135 €, 3 pts, suspension possible',
      'Excès ≥ 40 et < 50 km/h : amende 135 €, 4 pts, suspension jusqu\'à 3 ans',
      'Excès ≥ 50 km/h : délit pénal, 6 pts, jusqu\'à 3 750 €, suspension 3 ans, immobilisation possible',
    ],
    conseilsFormateur:[
      'Utiliser l\'exercice des « 3 secondes » pour matérialiser la distance d\'arrêt',
      'Faire calculer à l\'élève le nombre de mètres parcourus pendant 1 seconde à 90 km/h (25 m)',
      'Rappeler que le radar ne sanctionne pas les comportements, mais que la vitesse tue même sans radar',
      'Montrer des clichés d\'accidentologie pour ancrer l\'information émotionnellement',
    ],
  },
  {
    id:'sec3', icon:'😴', titre:'Fatigue & somnolence',
    pointsCles:[
      'La fatigue est impliquée dans 1 accident mortel sur 3 sur autoroute',
      'Micro-sommeil : perte de conscience de 0,5 à 4 secondes — à 130 km/h = 36 à 145 m parcourus les yeux fermés',
      'Signes précurseurs : clignements fréquents, dérivées de trajectoire, yeux qui brûlent, pensées qui s\'égarent',
      'Pause obligatoire : au moins 20 minutes toutes les 2 heures, en s\'arrêtant sur une aire de repos',
      'Faux remèdes : café (15 min d\'effet), ouvrir les vitres, la radio — ne suppriment pas la somnolence',
    ],
    sanctions:[
      'Somnolence caractérisée engageant un accident : mise en danger d\'autrui (1 an, 15 000 €)',
      'Refus de s\'arrêter malgré les signaux → responsabilité pénale en cas d\'accident',
      'Accident mortel lié à la fatigue : homicide involontaire aggravé (5 ans, 75 000 €)',
    ],
    conseilsFormateur:[
      'Rappeler que la sensation de fatigue disparaît parfois lors de longs trajets — c\'est un piège',
      'Enseigner le « power nap » : 20 min de sieste avant de reprendre la route',
      'Mentionner les risques spécifiques aux professionnels du transport (règlementation temps de conduite)',
      'Aborder le syndrome de l\'autoroute (hypnose de la route) et les solutions préventives',
    ],
  },
  {
    id:'sec4', icon:'📱', titre:'Téléphone & distracteurs',
    pointsCles:[
      'Téléphone tenu en main : interdit pendant la conduite (même à l\'arrêt au feu rouge)',
      'Kit mains-libres légal mais divise l\'attention par 2 — conversation téléphonique ≠ conversation passager',
      'Regard détourné 2 secondes à 50 km/h = 28 m parcourus sans regarder la route',
      'Autres distracteurs : GPS mal fixé, enfants, repas, maquillage, radio à fort volume',
      'Effet tunnel : la distraction rétrécit le champ visuel et retarde la détection des dangers',
    ],
    sanctions:[
      'Téléphone tenu en main : contravention de 4ᵉ classe, 135 €, 3 pts retirés',
      'Rétention immédiate du permis si contravention + autre infraction (vitesse, alcool...)',
      'En cas d\'accident causé par l\'usage du téléphone : circonstance aggravante, peines doublées',
    ],
    conseilsFormateur:[
      'Faire mettre le téléphone en mode « conduite » ou dans le vide-poche avant de démarrer — en prendre l\'habitude en leçon',
      'Parler des notifications : chaque buzz génère une tentation, même sans regarder l\'écran',
      'Mentionner les applications de détection de conduite (assurances) comme outil pédagogique',
    ],
  },
  {
    id:'sec5', icon:'🔒', titre:'Ceinture de sécurité & retenue enfant',
    pointsCles:[
      'Ceinture obligatoire : conducteur + tous les passagers, à l\'avant comme à l\'arrière',
      'Efficacité : divise par 4 le risque de décès en cas de choc frontal',
      'Enfant < 10 ans : siège auto homologué obligatoire (groupe selon poids/taille)',
      'Enfant < 10 kg : siège dos à la route obligatoire (même à l\'avant — désactiver l\'airbag passager)',
      'Airbag + passager sans ceinture = risque de décès par projection contre le coussin gonflant',
    ],
    sanctions:[
      'Ceinture non bouclée (conducteur) : contravention de 4ᵉ classe, 135 €, 3 pts',
      'Passager sans ceinture à l\'avant : contravention 4ᵉ classe, amende conducteur',
      'Enfant non attaché < 13 ans : amende 135 €, 3 pts',
      'Non-respect de la réglementation siège enfant : amende 135 €',
    ],
    conseilsFormateur:[
      'Vérifier systématiquement la ceinture de l\'élève avant le démarrage — en faire un réflexe de départ',
      'Montrer les statistiques : 20 % des décès sur la route concernent des occupants non ceinturés',
      'Expliquer le principe de la « seconde collision » (corps qui continue après l\'arrêt du véhicule)',
    ],
  },
  {
    id:'sec6', icon:'🚲', titre:'Usagers vulnérables — piétons, cyclistes, deux-roues',
    pointsCles:[
      'Piétons : prioritaires sur passage piéton, même sans feu. En agglomération, le piéton qui s\'engage doit être laissé passer',
      'Cyclistes : 1 m d\'écart latéral en ville, 1,5 m hors agglomération. Zone de danger à droite : portières, caniveaux',
      'Deux-roues motorisés : filtrage autorisé en expérimentation (2022+), angles morts importants pour les PL',
      'Zone 30 / zone de rencontre : piétons et cyclistes prioritaires, vitesse max 20 km/h (zone de rencontre)',
      'La nuit : 50 % des accidents piétons mortels — éclairage et gilet jaune recommandés pour les piétons',
    ],
    sanctions:[
      'Non-respect de la priorité piéton sur passage : 4ᵉ classe, 135 €, 6 pts',
      'Distance latérale insuffisante lors du dépassement d\'un cycliste : amende 135 €, 3 pts',
      'Renversement piéton avec blessure : mise en danger, voire homicide involontaire selon les circonstances',
    ],
    conseilsFormateur:[
      'Sensibiliser à la « mort subite du cycliste » (choc de portière) : regarder le rétroviseur ET faire les tours de bras',
      'Rappeler que les deux-roues sont surreprésentés dans les accidents mortels (28 % des tués pour 2 % des km)',
      'Exercice : estimer la vitesse d\'un cycliste électrique (peut atteindre 25 km/h silencieusement)',
    ],
  },
  {
    id:'sec7', icon:'🌧', titre:'Conditions météo & environnement',
    pointsCles:[
      'Pluie légère : premier quart d\'heure le plus dangereux (hydrocarbures + eau = surface savonneuse)',
      'Aquaplaning : se produit à partir de 80 km/h sur 3 mm d\'eau — relâcher l\'accélérateur, ne pas braquer',
      'Brouillard : feux de brouillard AVT et ARR si visibilité < 50 m, sinon uniquement ARR si < 150 m',
      'Vent violent : sur autoroute, tenir le volant ferme, ralentir, distance accrue',
      'Soleil rasant : visière ou lunettes, ralentir, se méfier des zones d\'ombre-lumière (sorties de tunnel)',
    ],
    sanctions:[
      'Vitesse inadaptée aux conditions météo (même sous la limite) : 4ᵉ classe si accident, mise en danger',
      'Feux de brouillard allumés hors conditions réglementaires : amende 68 €',
    ],
    conseilsFormateur:[
      'Toujours adapter la leçon aux conditions du jour — la pluie est une opportunité pédagogique, pas un obstacle',
      'Faire ressentir à l\'élève la différence de distance de freinage sur sol mouillé vs sec',
      'Apprendre à détecter l\'aquaplaning : vibration légère, direction qui « flotte »',
    ],
  },
  {
    id:'sec8', icon:'🚗', titre:'Angles morts & chargement',
    pointsCles:[
      'Angle mort latéral : zone non couverte par les rétroviseurs, variable selon le véhicule (1,5 m à 5 m pour un PL)',
      'Chargement : ne pas dépasser le PTAC, arrimer tout objet (même léger — à 50 km/h un objet de 1 kg = 20 kg d\'impact)',
      'Gabarit : hauteur max 4 m, largeur 2,55 m (3 m réfrigéré), longueur selon configuration',
      'Roue de secours, triangle, gilet réfléchissant : obligatoires. Le gilet doit être accessible sans sortir du véhicule',
      'Surcharge → surconsommation, usure des pneus, risque d\'éclatement, distance d\'arrêt allongée',
    ],
    sanctions:[
      'Chargement non arrimé provoquant un danger : amende 135 €, 3 pts, immobilisation possible',
      'PTAC dépassé : amende 1 500 € (PL : jusqu\'à 15 000 €)',
      'Gilet réfléchissant absent : 11 €',
      'Triangle non placé sur la voie lors d\'une panne : 35 € + risque pénal en cas d\'accident',
    ],
    conseilsFormateur:[
      'Faire systématiquement le tour du véhicule avec l\'élève avant de partir (check-list)',
      'Expliquer l\'angle mort PL avec des exemples concrets (accidents de camions en virage)',
      'Pour les formateurs PL : démonstration de l\'angle mort depuis la cabine',
    ],
  },
];

const REMC_LOIS = [
  {
    id:'loi1', icon:'🎯', titre:'Permis à points — capital et récupération',
    contenu:[
      'Capital initial : 12 points (6 pour les conducteurs novices la 1ʳᵉ année)',
      'Probatoire : 6 pts → 8 pts après 2 ans sans infraction, 12 pts après 2 ans supplémentaires (3 ans si stage suivi)',
      'Récupération automatique : +1 pt/an sans infraction (dans la limite de 12 pts)',
      'Stage de sensibilisation volontaire : +4 pts (max 1 fois tous les 2 ans, si capital < 12 pts)',
      'Perte totale des points (0 pt) : invalidation du permis, délai de 6 mois avant repassage + examen médical et psychotechnique',
    ],
    references:['Articles L.223-1 à L.223-9 du Code de la route','Arrêté du 29 juin 1992 relatif au permis à points'],
    notesPratiques:[
      'Le solde de points est consultable sur le site masecuriteroute.gouv.fr avec FranceConnect',
      'Certaines infractions retirent des points sans qu\'il y ait d\'accident : excès de vitesse, téléphone, ceinture...',
      'Un élève peut rater l\'examen sans perdre de points — les points ne concernent que la conduite effective',
    ],
  },
  {
    id:'loi2', icon:'⚖️', titre:'Infractions, contraventions et délits',
    contenu:[
      'Contravention de 1ʳᵉ classe : 11 € (ex : triangle absent)',
      'Contravention de 4ᵉ classe : 135 € minorée 90 €, majorée 375 € (ex : excès < 50 km/h, ceinture, téléphone)',
      'Contravention de 5ᵉ classe : 1 500 € (ex : excès ≥ 40 km/h sur route)',
      'Délit : alcool ≥ 0,8 g/L, excès ≥ 50 km/h, refus d\'obtempérer, délit de fuite — peine privative de liberté possible',
      'Crime routier : homicide volontaire avec véhicule (violence avec arme) → réclusion criminelle',
    ],
    references:['Articles R.610 à R.639 du Code de la route (contraventions)','Articles L.221 à L.236 (délits et crimes)','Code pénal art. 221-6-1 (homicide involontaire aggravé)'],
    notesPratiques:[
      'Le paiement de l\'amende minorée (dans les 15 jours) vaut reconnaissance de l\'infraction',
      'La récidive légale double les peines encourues pour les délits',
      'Un stage de sensibilisation ne supprime pas les points déjà retirés — seule la récupération automatique ou volontaire les rend',
    ],
  },
  {
    id:'loi3', icon:'📜', titre:'Agrément enseignant — BEPECASER / TP ECSR',
    contenu:[
      'Ancien diplôme : BEPECASER (Brevet pour l\'Exercice de la Profession d\'Enseignant de la Conduite Automobile et de la Sécurité Routière) — fermé aux nouvelles inscriptions depuis 2016',
      'Nouveau titre : TP ECSR (Titre Professionnel d\'Enseignant de la Conduite et de la Sécurité Routière) — délivré par le Ministère du Travail (DREETS)',
      'Agrément préfectoral : obligatoire pour enseigner, renouvelable tous les 5 ans — lié à l\'établissement employeur',
      'Formation continue : 14h/an minimum pour maintenir l\'agrément (depuis le décret 2019-1436)',
      'Interdictions : antécédents pénaux (casier judiciaire), suspension > 6 mois du permis → perte d\'agrément',
    ],
    references:['Décret n° 2015-1754 du 23 décembre 2015 (TP ECSR)','Arrêté du 20 avril 2012 (BEPECASER)','Art. L.213-1 à L.213-7 du Code de la route'],
    notesPratiques:[
      'Un enseignant peut enseigner plusieurs catégories de permis s\'il possède les mentions correspondantes',
      'La mention « deux-roues » ou « groupe lourd » nécessite une formation complémentaire',
      'L\'agrément est nominatif et personnel — un auto-école ne peut pas le « prêter »',
    ],
  },
  {
    id:'loi4', icon:'🏫', titre:'Réglementation des établissements d\'enseignement',
    contenu:[
      'Label qualité : arrêté du 19 juillet 2010 — les auto-écoles labellisées doivent afficher les tarifs et résultats aux examens',
      'Livret d\'apprentissage : obligatoire pour chaque élève — retrace les compétences acquises et les heures effectuées',
      'Durée minimale de formation : 20h de conduite pour le permis B (possibilité de dispense partielle avec AAC)',
      'Conduite accompagnée (AAC) : possible dès 15 ans, superviseur ≥ 3 pts, ≥ 5 ans de permis',
      'Conduite supervisée (CS) : ex-conduite encadrée — après 18 ans, 1 an de permis probatoire',
    ],
    references:['Art. L.213-1 à L.213-7 du Code de la route','Arrêté du 22 décembre 2009 (organisation de l\'enseignement)','Décret n° 2014-1295 (formation initiale)'],
    notesPratiques:[
      'Le livret d\'apprentissage numérique (DPC) est désormais recommandé — certaines auto-écoles utilisent des applications dédiées',
      'Le nombre d\'heures de conduite obligatoire ne s\'applique pas à la conduite accompagnée (AAC)',
      'Un établissement peut être fermé administrativement en cas de fraude à l\'examen ou d\'absence de label',
    ],
  },
  {
    id:'loi5', icon:'🛡', titre:'Responsabilité du moniteur',
    contenu:[
      'Pendant la leçon : le moniteur est pénalement responsable si l\'élève commet une infraction (véhicule à double commande)',
      'Assurance obligatoire : le véhicule école doit être assuré en responsabilité civile professionnelle, couvrant l\'élève',
      'Obligation de sécurité : le moniteur doit intervenir si l\'élève met en danger (double commande, consigne verbale)',
      'Secret professionnel : les informations sur l\'élève (état de santé, difficultés) ne peuvent être divulguées',
      'Harcèlement et protection : l\'élève mineur bénéficie de la protection renforcée du Code pénal',
    ],
    references:['Art. L.121-3 du Code de la route (responsabilité du gardien)','Code pénal art. 121-3 (responsabilité pénale non-intentionnelle)','Code civil art. 1242 (responsabilité du fait d\'autrui)'],
    notesPratiques:[
      'En cas d\'accident en leçon avec élève mineur, le moniteur est présumé responsable sauf preuve contraire',
      'Il est conseillé de noter dans le livret chaque séance (compétences abordées, incidents éventuels)',
      'Un moniteur peut refuser de dispenser la leçon si l\'élève est en état apparent d\'ivresse ou de stupéfaction',
    ],
  },
  {
    id:'loi6', icon:'📋', titre:'Examen du permis de conduire',
    contenu:[
      'Code de la route (ETG) : QCM de 40 questions, 35 bonnes réponses requises, centres agréés ou en ligne',
      'Épreuve de conduite (plateau + circulation) : 32 minutes, notation sur grilles REMC, 2 évaluateurs (IPCSR)',
      'Délai entre deux présentations : 10 jours minimum — mais les places étant rares, délai réel souvent > 2 mois',
      'Recours : en cas de désaccord sur les résultats, l\'élève peut demander une révision au CSSR (Comité de Sécurité Routière)',
      'Validité du code : 5 ans à compter de la réussite — doit être valide le jour de l\'examen pratique',
    ],
    references:['Arrêté du 20 avril 2012 modifié (organisation de l\'épreuve)','Note de service DSR/SDE/N°2022 (grilles REMC)','Art. R.221-3 du Code de la route'],
    notesPratiques:[
      'Le moniteur ne peut pas être présent lors de l\'épreuve (sauf en AAC pour la partie accompagnée)',
      'Les grilles REMC sont publiques — les partager avec l\'élève l\'aide à comprendre les critères d\'évaluation',
      'Une erreur éliminatoire (faute grave) entraîne l\'échec immédiat, quelle que soit la qualité du reste de l\'épreuve',
    ],
  },
];

const EDPM_FICHES = [
  {
    id:'edpm1', icon:'🛴', titre:'Trottinette électrique',
    definition:'Véhicule léger à deux roues en ligne, propulsé par un moteur électrique, sans selle. Usage individuel, usage partagé (free-floating) ou personnel.',
    reglementation:[
      'Vitesse maximale autorisée : 25 km/h (bridage constructeur imposé)',
      'Interdit sur trottoirs (amende 135 €) — voie cyclable obligatoire ou chaussée si absente',
      'Interdit sur voies rapides, autoroutes, routes à > 50 km/h sans piste cyclable',
      'Port du casque obligatoire depuis le 01/01/2022 (EPI EN 1078 cycliste, ou moto)',
      'Éclairage avant/arrière + équipement réfléchissant obligatoires de nuit',
      'Gilet rétro-réfléchissant haute visibilité obligatoire de nuit et par mauvaise visibilité',
      'Âge minimum : 12 ans pour espace public. Moins de 12 ans : usage privé uniquement',
      'Assurance responsabilité civile obligatoire (couverte par contrat habitation multi-risques)',
      'Alcool : même tolérance que les automobilistes (0,5 g/L), verbalisation possible',
      'Téléphone en main : amende 135 €, retrait de 3 points si permis',
    ],
    risques:[
      'Chute à l\'arrêt ou au démarrage (instabilité liée aux petites roues)',
      'Perte d\'équilibre sur revêtements dégradés, pavés, rails de tramway',
      'Invisibilité pour les automobilistes (gabarit très réduit, pas de rétroviseurs)',
      'Absence de protection en cas de choc (pas de carrosserie, de ceinture)',
      'Freinage insuffisant en cas de pluie (roues lisses) — distance de freinage × 2 à 3',
      'Risque de conflit avec piétons lors de traversées ou carrefours mal gérés',
      'Batteries lithium : risque d\'incendie en cas de charge inadaptée ou d\'accident',
    ],
    prevention:[
      'Toujours porter le casque + gants + protège-coudes/genoux pour les débutants',
      'Adopter une vitesse adaptée (< 15 km/h en zone dense) et anticiper les obstacles',
      'Regarder loin devant : les ornières, grilles d\'égout et rails se voient à l\'avance',
      'Signaler ses changements de direction à la main comme un cycliste',
      'Éviter la conduite par pluie forte ou verglas — roues non crantées glissent vite',
      'Vérifier la batterie avant chaque trajet (panne soudaine = danger)',
      'Ne jamais dépasser 1 personne par engin — passager = risque de déséquilibre + illégal',
      'Se ranger complètement sur le côté pour s\'arrêter, ne pas bloquer la piste cyclable',
    ],
    conseilsFormateur:[
      'Montrer des statistiques locales d\'accidents EDPM pour ancrer la réalité du risque',
      'Insister sur la règle de l\'anticipation : une trottinette ne protège pas ses occupants',
      'Exercice pratique : faire calculer la distance de freinage à 25 km/h vs 50 km/h pour un vélo',
      'Rappeler que l\'alcool au volant d\'une trottinette est verbalisable — souvent ignoré des élèves',
      'Aborder le risque propre au free-floating : engins mal entretenus, freins usés',
    ],
  },
  {
    id:'edpm2', icon:'🔄', titre:'Monoroue électrique',
    definition:'Engin à une seule roue centrale gyrostabilisée, conduit debout en maintenant l\'équilibre par le poids du corps. Apprentissage long (plusieurs heures).',
    reglementation:[
      'Statut légal identique aux autres EDPM depuis le décret du 25 octobre 2019',
      'Vitesse maximale autorisée : 25 km/h (bridage requis, certains modèles atteignent 50+ km/h sans bridage — illégal)',
      'Même règles de circulation que trottinette : pistes cyclables ou chaussée',
      'Casque obligatoire, éclairage avant/arrière requis la nuit',
      'Assurance RC obligatoire',
      'Interdit sur trottoirs, voies rapides, autoroutes',
      'Âge minimum : 12 ans sur voie publique',
    ],
    risques:[
      'Chute frontale brutale en cas de dépassement de la vitesse limite de la roue (coupure de courant)',
      'Apprentissage sans filet : les premières heures sont très accidentogènes',
      'Absence totale de dispositif de freinage mécanique — freinage par déport du poids',
      'Grande dépendance à l\'électronique embarquée (gyroscope) — panne = chute immédiate',
      'Gabarit très discret — invisibilité forte en trafic dense',
      'Risque de projection si la roue accroche un obstacle (bord de trottoir, caillou)',
    ],
    prevention:[
      'Apprentissage impératif dans un espace fermé avant toute sortie sur voie publique',
      'Équipement complet : casque intégral recommandé, protège-poignets obligatoires',
      'Ne jamais dépasser la vitesse maximale autorisée par le firmware — régler l\'alarme à 20 km/h',
      'Garder une batterie > 20 % : la gyrostabilisation se dégrade sous ce seuil',
      'Éviter les zones à fort trafic les premiers mois',
      'Toujours vérifier firmware et batterie avant chaque sortie longue',
    ],
    conseilsFormateur:[
      'La monoroue est souvent sous-estimée par les élèves à l\'aise avec d\'autres EDPM',
      'Illustrer le « cutoff » (coupure gyro à dépassement de vitesse) avec des vidéos réelles',
      'Rappeler que certains modèles bridés en usine peuvent être dé-bridés — pratique illégale et dangereuse',
    ],
  },
  {
    id:'edpm3', icon:'🤖', titre:'Gyropode (Segway-type)',
    definition:'Engin à deux roues parallèles gyrostabilisé, conduit debout ou assis selon le modèle, dirigé par le poids du corps. Premier EDPM populaire (années 2000).',
    reglementation:[
      'Cadre légal EDPM depuis 2019 : même réglementation que la trottinette électrique',
      'Vitesse maximale : 25 km/h',
      'Interdit sur trottoirs, voies rapides ; autorisé sur pistes cyclables et chaussée',
      'Casque obligatoire, assurance RC obligatoire',
      'Usage professionnel (police, sécurité) : règles spécifiques selon l\'employeur',
      'Anciennement en zone d\'expérimentation jusqu\'au décret 2019 — maintenant intégré au Code de la route',
    ],
    risques:[
      'Chute avant en cas de frein brusque ou obstacle (impossible d\'anticiper avec les mains)',
      'Maniabilité réduite dans les espaces confinés par rapport à une trottinette',
      'Poids élevé (10–15 kg) : difficile à relever ou à dégager rapidement en cas de chute',
      'Rayon de braquage limité : virage serré difficile en intersection',
      'Moins instinctif que la trottinette pour les usagers non initiés',
    ],
    prevention:[
      'Toujours commencer par des exercices de braquage et d\'arrêt d\'urgence',
      'Casque + protections latérales des genoux recommandées',
      'Prévoir plus de place pour s\'arrêter : freinage par déport = distance plus longue',
      'Adapter l\'allure à l\'encombrement de la voie cyclable ou de la chaussée',
    ],
    conseilsFormateur:[
      'Le gyropode est souvent rencontré en contexte professionnel (tourisme, sécurité)',
      'Discuter les cas d\'usage légitimes vs risques pour les élèves qui en ont ou envisagent d\'en avoir',
    ],
  },
  {
    id:'edpm4', icon:'🏄', titre:'Hoverboard',
    definition:'Engin à deux roues parallèles sans guidon, conduit debout, équilibre géré uniquement par le poids du corps. Popularisé à partir de 2015.',
    reglementation:[
      'Statut EDPM depuis décret 2019 — même cadre que trottinette et gyropode',
      'Vitesse maximale : 25 km/h',
      'Interdit sur trottoirs, voies rapides, autoroutes',
      'Casque obligatoire, assurance RC obligatoire, éclairage de nuit requis',
      'Âge minimum : 12 ans pour usage voie publique',
      'Attention : certains hoverboards vendus en France ne respectent pas la norme CE ou les limites de vitesse — illégaux sur voie publique',
    ],
    risques:[
      'Chute fréquente pour les non-initiés : l\'équilibre s\'apprend en 20–60 min mais peut prendre plus',
      'Batteries lithium de qualité variable : nombreux cas d\'incendie sur les premiers modèles bas de gamme',
      'Absence totale de guidon → aucun contrôle de direction fine en urgence',
      'Vitesse difficile à réguler précisément : risque de dépassement involontaire',
      'Ruissellement et flaques : les roulements et circuits électroniques peu protégés sur certains modèles',
    ],
    prevention:[
      'N\'acheter que des hoverboards certifiés UL 2272 (norme sécurité batteries USA) ou CE en Europe',
      'Ne jamais laisser charger sans surveillance, ni sur moquette ou literie',
      'Protections complètes obligatoires pour les débutants : casque, genoux, poignets, coudes',
      'Interdire à l\'enfant de se mettre sur route ou piste cyclable tant que la maîtrise n\'est pas totale',
      'Éviter la pluie : IP insuffisant sur la plupart des modèles grand public',
    ],
    conseilsFormateur:[
      'L\'hoverboard est souvent le premier EDPM découvert par les jeunes → point d\'entrée pédagogique',
      'Insister sur le risque incendie : les batteries bas de gamme sont un vrai danger',
      'Rappeler que l\'engin sans casque en public est verbalizable même si l\'élève le voit comme un jouet',
    ],
  },
  {
    id:'edpm5', icon:'🛹', titre:'Skateboard & longboard électrique',
    definition:'Planche à roulettes motorisée, dirigée par des déplacements du poids du corps sur la planche. Télécommande ou capteurs d\'équilibre selon le modèle.',
    reglementation:[
      'Statut EDPM depuis décret 2019 — même réglementation',
      'Vitesse maximale : 25 km/h (certains modèles atteignent 45+ km/h — illégaux sur voie publique)',
      'Interdit sur trottoirs, voies rapides, autoroutes',
      'Casque obligatoire, assurance RC obligatoire',
      'Télécommande : engin intégralement motorisé → distinction avec le skateboard classique non motorisé (pas soumis à la réglementation EDPM)',
    ],
    risques:[
      'Roues très petites (50–70 mm) : sensibles aux cailloux, joints de dilatation, rails tramway',
      'Fréquence élevée des « wheel bite » (roue bloquée par la planche en virage serré) à haute vitesse',
      'Freinage moteur uniquement : absence de frein mécanique de secours',
      'Chute avant brutale lors d\'obstacle imprévu : vitesse de réaction insuffisante à > 20 km/h',
      'Batteries exposées sous la planche : vulnérables aux chocs et à l\'eau',
      'Modèles « DIY » (bricolés) : fiabilité et bridage inconnus',
    ],
    prevention:[
      'Port du casque + protège-poignets + genoux impératif, même pour les skateurs expérimentés',
      'Vitesse < 20 km/h en zone mixte, < 25 km/h uniquement sur piste cyclable dégagée',
      'Choisir un itinéraire avec revêtement lisse — éviter pavés, gravier, trottoirs abaissés',
      'Vérifier les roues et courroies de transmission avant chaque sortie longue',
      'Recharger sur surface dure et non inflammable, jamais pendant la nuit sans surveillance',
    ],
    conseilsFormateur:[
      'Le skateboard électrique touche souvent un public jeune et sportif qui sous-estime le risque EDPM',
      'Montrer la différence entre la planche classique (non réglementée) et la planche motorisée (EDPM)',
      'Insister sur le fait que les modèles dé-bridés à > 25 km/h sont hors-la-loi et engagent la responsabilité du conducteur en cas d\'accident',
      'Point commun à tous les EDPM : l\'assurance RC est obligatoire et souvent absente — sensibiliser',
    ],
  },
];

const EDPMS_ENTRETIEN = [
  { id:'e1', categorie:'Expérience de conduite', questions:[
    'Avez-vous déjà conduit un véhicule ? (AAC, conduite supervisée, pays étranger, véhicule agricole…)',
    'Si oui, combien d\'heures approximativement ? Sur quel type de voies (ville, route, autoroute) ?',
    'Avez-vous déjà eu un accident ou un incident de conduite ?',
    'Avez-vous déjà passé ou tenté de passer le permis B ? Si oui, combien de fois ?',
  ]},
  { id:'e2', categorie:'Motivations et objectifs', questions:[
    'Pour quelle raison principale souhaitez-vous obtenir le permis B ?',
    'Avez-vous une contrainte de délai (emploi, études, déménagement) ?',
    'Envisagez-vous de conduire régulièrement ? Sur quel type de trajet typiquement ?',
    'Avez-vous un véhicule ou prévoir d\'en acquérir un rapidement ?',
  ]},
  { id:'e3', categorie:'Représentations et freins', questions:[
    'Comment décrieriez-vous votre rapport à la conduite : confiant(e), appréhensif(ve), neutre ?',
    'Avez-vous des appréhensions particulières (autoroute, nuit, parking, stationnement) ?',
    'Avez-vous des contraintes médicales ou physiques à me signaler (vision, mobilité, traitement médicamenteux) ?',
    'Avez-vous déjà ressenti de l\'anxiété au volant ou lors de trajets en tant que passager ?',
  ]},
  { id:'e4', categorie:'Disponibilité et rythme', questions:[
    'Combien de leçons par semaine pensez-vous pouvoir effectuer ?',
    'Avez-vous une préférence pour les horaires (matin, soir, week-end) ?',
    'Quelqu\'un de votre entourage peut-il vous accompagner pour une conduite supervisée entre les leçons ?',
  ]},
];

const EDPMS_AUTOEVAL = [
  { id:'ae1', dom:'D1 — Maîtrise du véhicule',       items:[
    { id:'ae11', label:'Je sais régler le véhicule et faire les vérifications avant départ' },
    { id:'ae12', label:'Je me sens à l\'aise pour accélérer, freiner et diriger le véhicule' },
    { id:'ae13', label:'Je peux effectuer les manœuvres (créneau, demi-tour, marche arrière)' },
  ]},
  { id:'ae2', dom:'D2 — Circulation réelle',          items:[
    { id:'ae21', label:'Je sais observer et anticiper ce qui se passe autour de moi' },
    { id:'ae22', label:'Je connais et respecte les règles de priorité et les limitations de vitesse' },
    { id:'ae23', label:'Je me sens à l\'aise sur route, en ville, de nuit ou sous la pluie' },
  ]},
  { id:'ae3', dom:'D3 — Comportements responsables', items:[
    { id:'ae31', label:'J\'ai une conduite respectueuse envers les autres usagers' },
    { id:'ae32', label:'Je gère bien la fatigue, le stress et les distractions au volant' },
    { id:'ae33', label:'Je conduis de façon économique et écologique' },
  ]},
];

const EDPMS_OBS_FORMATEUR = [
  { id:'of1', code:'C1.1', titre:'Prise en main & réglages', indicateurs:['Réglages siège/rétros corrects sans aide','Vérification avant départ effectuée spontanément','Ceinture bouclée sans rappel'] },
  { id:'of2', code:'C1.2', titre:'Direction & vitesse',       indicateurs:['Trajectoire régulière en ligne droite','Entrée/sortie de courbe maîtrisée','Freinage progressif et anticipé'] },
  { id:'of3', code:'C1.3', titre:'Manœuvres',                 indicateurs:['Créneau : vérification + braquage adapté','Marche arrière : regard et allure maîtrisés','Stationnement : frein à main + vitesse enclenchée'] },
  { id:'of4', code:'C2.1', titre:'Observation & anticipation',indicateurs:['Balayage visuel régulier (≥ toutes les 8s)','Angle mort vérifié avant changement de direction','Réaction anticipée aux situations à risque'] },
  { id:'of5', code:'C2.2', titre:'Règles de circulation',     indicateurs:['Priorités respectées','Limitations de vitesse respectées','Signalisation respectée (feux, stops, cédez)'] },
  { id:'of6', code:'C2.3', titre:'Situations particulières',  indicateurs:['Comportement adapté si conditions dégradées','Distance de sécurité maintenue','Gestion de l\'insertion/sortie d\'axe rapide'] },
  { id:'of7', code:'C3.1', titre:'Attitude coopérative',      indicateurs:['Clignotants anticipés et désactivés','Respect des piétons et cyclistes','Pas de pression sur les autres usagers'] },
  { id:'of8', code:'C3.2', titre:'États internes',            indicateurs:['Calme apparent, sans tension excessive','Pas de distraction visible (téléphone, radio)','Réaction adaptée aux imprévus'] },
  { id:'of9', code:'C3.3', titre:'Éco-conduite',              indicateurs:['Passages de vitesses anticipés','Pas de freinages inutiles','Allure régulière sans à-coups'] },
];

const EDPMS_NIVEAUX = [
  { id:'A', label:'A — Débutant', color:'#f87171', desc:'Peu ou pas d\'expérience. Travail sur les fondamentaux D1 en priorité.' },
  { id:'B', label:'B — En acquisition', color:'var(--gold)', desc:'Bases présentes mais inconstantes. Programme mixte D1/D2.' },
  { id:'C', label:'C — Intermédiaire', color:'var(--accent-liika)', desc:'D1 globalement maîtrisé. Priorité à D2 puis D3.' },
  { id:'D', label:'D — Avancé', color:'#4ade80', desc:'Bonne maîtrise globale. Affiner D3 et préparer l\'examen.' },
];

// ── RSMA Guadeloupe ──────────────────────────────────────────────────────────
const RSMA_CONTEXTE = {
  structure:'Régiment du Service Militaire Adapté (RSMA) — Guadeloupe, rattaché au SMA (Service Militaire Adapté), relevant du ministère des Outre-mer et des Armées.',
  mission:'Former et insérer professionnellement des jeunes volontaires (18–25 ans) des DOM-COM en difficulté d\'insertion, via un cadre militaire structurant associant formation civique, formation professionnelle et accompagnement social.',
  cadre:[
    'Durée du contrat : 12 mois (Volontaire Stagiaire — VS) renouvelable une fois',
    'Encadrement militaire : horaires, discipline, tenue réglementaire, hiérarchie',
    'Formation professionnelle : CAP, CACES, permis B/BE, habilitations professionnelles',
    'Formation civique : éducation à la citoyenneté, valeurs républicaines, vie collective',
    'Accompagnement social : santé, logement, emploi, suivi post-SMA',
    'Partenaires employeurs : collectivités, entreprises locales, Pôle Emploi, LADOM',
  ],
  profilTypique:[
    'Âge : 18–25 ans, majorité entre 18 et 21 ans',
    'Niveau scolaire : souvent CAP/BEP ou abandon scolaire — écrit parfois fragile',
    'Expérience de conduite : très variable — nombreux conduits en zone rurale (Guadeloupe, Martinique, Guyane, Réunion) sans permis',
    'Profil motivationnel : fort désir d\'emploi et d\'autonomie, réponse positive au cadre structurant',
    'Freins fréquents : anxiété face à l\'examen théorique (écrit), difficulté de concentration, représentations négatives de soi ("je suis nul à l\'école")',
    'Atouts : sérieux, ponctualité imposée par le cadre militaire, entraide entre camarades, motivation concrète (permis = emploi)',
    'Particularité antillaise : familiarité avec la conduite de scooter / deux-roues → bonne perception des risques mais mauvaises habitudes de positionnement',
  ],
  adaptationsPedagogiques:[
    'Privilégier l\'oral sur l\'écrit lors des évaluations formatives',
    'Relier chaque compétence REMC à un bénéfice concret : "C1.1 → tu passes l\'examen → tu trouves un emploi"',
    'Utiliser des exemples locaux : rond-points de Pointe-à-Pitre, Basse-Terre, routes en lacets Basse-Terre/Bouillante',
    'Faire appel aux valeurs SMA : rigueur, discipline, respect, esprit d\'équipe → les transposer à la conduite',
    'Séances courtes et rythmées (45 min conduite + bilan) plutôt que longues sessions',
    'Valoriser les acquis de conduite informelle tout en recadrant les mauvaises habitudes',
    'Créer un bilan écrit simple (pictogrammes REMC) lisible même si niveau de lecture faible',
  ],
};

const REMC_RSMA_CORRELATIONS = [
  {
    comp:'C1.1', titre:'Prise en main du véhicule',
    valeurSMA:'Rigueur & discipline',
    lien:'La vérification du véhicule avant départ est un geste militaire : on ne part pas en mission sans avoir inspecté son matériel. Le VS comprend instinctivement le "check-list" pré-départ.',
    adaptationRSMA:[
      'Présenter la vérification comme une "revue de matériel" : habitude militaire = levier d\'apprentissage puissant',
      'Parallèle avec l\'entretien de l\'équipement militaire (tenue, arme, véhicule tactique) — les VS du RSMA reçoivent déjà des bases en maintenance',
      'Insister sur la responsabilité envers les autres occupants : valeur SMA du collectif',
    ],
    risquesSpecifiques:'Le VS peut avoir conduit en zone rurale antillaise sans jamais faire de vérification du véhicule. Réapprentissage total des niveaux et de la pression des pneus.',
    pisTeEvaluation:'Demander la procédure de vérification à l\'oral — schéma illustré si lecture difficile.',
  },
  {
    comp:'C1.2', titre:'Direction et vitesse',
    valeurSMA:'Maîtrise de soi & sang-froid',
    lien:'La régulation de l\'allure en conduite est la même compétence que la gestion du stress en situation militaire : observer, anticiper, agir avec mesure. Ne pas sur-réagir = qualité militaire ET qualité de conduite.',
    adaptationRSMA:[
      'Utiliser l\'analogie "pas de précipitation en mission → pas de précipitation sur la route"',
      'Les routes de Basse-Terre (lacets, pentes, jungle) sont un terrain de formation idéal pour la régulation de vitesse',
      'Exercices avec comptage vocal des 2 secondes de sécurité : ancrage par la répétition (méthode SMA)',
    ],
    risquesSpecifiques:'Habitude antillaise de vitesse élevée en agglomération, grillage de feux aux heures creuses. Fort risque de récidive une fois hors du cadre de la formation.',
    pisTeEvaluation:'Exercice de freinage progressif sur parking : la distance d\'arrêt parlante est mesurée par cônes.',
  },
  {
    comp:'C1.3', titre:'Manœuvres',
    valeurSMA:'Persévérance & tolérance à l\'échec',
    lien:'Les manœuvres sont souvent l\'étape où le VS échoue à l\'examen. La persistance face aux difficultés est une valeur SMA centrale. Le formateur doit cadrer l\'erreur comme une étape normale, pas une honte.',
    adaptationRSMA:[
      'Normaliser l\'erreur : "Au SMA tu recommences l\'exercice jusqu\'à réussite — c\'est pareil ici"',
      'Pratique intensive du créneau : 3 répétitions minimum par séance jusqu\'à automatisation',
      'Encourager la verbalisation de la difficulté — la culture militaire peut freiner l\'expression du doute',
    ],
    risquesSpecifiques:'Gêne à demander de l\'aide (culture masculine et militaire). Le VS masque parfois une incompréhension.',
    pisTeEvaluation:'Observation de la posture du regard pendant la manœuvre (rétroviseurs ou pas) — indicateur comportemental fiable.',
  },
  {
    comp:'C2.1', titre:'Percevoir et analyser',
    valeurSMA:'Vigilance & perception de l\'environnement',
    lien:'La lecture du terrain est une compétence militaire fondamentale. Balayer visuellement l\'espace, identifier les zones d\'ombre, anticiper les mouvements : le VS RSMA a souvent des prédispositions si cet ancrage est fait explicitement.',
    adaptationRSMA:[
      'Utiliser le vocabulaire militaire : "zone à risque", "angle mort = angle non couvert", "fenêtre de vulnérabilité"',
      'Exercices de perception sur les carrefours complexes de Pointe-à-Pitre (nombreux ronds-points, trafic dense)',
      'Travailler l\'analyse des comportements des autres usagers : 2RM, piétons traversant hors passage',
    ],
    risquesSpecifiques:'Le VS qui a conduit un scooter peut avoir une bonne perception mais une mauvaise anticipation à 4 roues (gabarit, distance de freinage différents).',
    pisTeEvaluation:'Exercice de commentaire de conduite à voix haute : "je vois… j\'anticipe… je décide…".',
  },
  {
    comp:'C2.2', titre:'Règles de circulation',
    valeurSMA:'Respect des règles & des hiérarchies',
    lien:'Le Code de la route est la "réglementation" de la route. Le VS RSMA est très réceptif à la notion de règle claire et de sanction définie — cadre qu\'il vit au quotidien.',
    adaptationRSMA:[
      'Présenter le Code comme un règlement militaire : "chaque panonceau est un ordre"',
      'Les sanctions (points, amendes) = conséquences réelles sur l\'emploi visé → motivation forte',
      'Connexion avec la loi (fiches légales) : le VS doit comprendre pourquoi la règle existe, pas seulement l\'apprendre',
    ],
    risquesSpecifiques:'La conduite informelle en Guadeloupe (feux grillés, sens uniques non respectés) crée des automatismes négatifs forts à déconstruire.',
    pisTeEvaluation:'Quiz oral avant la séance de conduite : 3 questions de code — permet de mesurer la mémorisation sans mettre en difficulté à l\'écrit.',
  },
  {
    comp:'C2.3', titre:'Situations particulières',
    valeurSMA:'Adaptabilité & gestion des conditions dégradées',
    lien:'Le SMA forme à agir dans des conditions difficiles. Les situations de conduite dégradées (pluie tropicale, nuit, route en lacets, chantier) sont l\'équivalent routier des exercices de terrain militaire.',
    adaptationRSMA:[
      'La pluie tropicale soudaine est une réalité locale quotidienne → intégrer des séances par temps de pluie dès le niveau B',
      'Les routes de montagne de Basse-Terre sont un terrain parfait pour les "situations particulières" (lacets, pente, brouillard matinal)',
      'Nuit : les zones péri-urbaines sans éclairage de Guadeloupe sont des terrains naturels',
    ],
    risquesSpecifiques:'Le VS sous-estime souvent la pluie tropicale sur route (glissance immédiate, aquaplanage dès les premières gouttes sur bitume chaud).',
    pisTeEvaluation:'Bilan oral post-séance pluie : "qu\'est-ce qui a changé dans ta conduite ?".',
  },
  {
    comp:'C3.1', titre:'Attitude coopérative',
    valeurSMA:'Esprit d\'équipe & respect des autres',
    lien:'La coopération est une valeur cardinale du SMA : "pas de soldat laissé pour compte". Sur la route, cela se traduit par le respect des usagers vulnérables (piétons, cyclistes, 2RM) et la communication non agressive.',
    adaptationRSMA:[
      'Faire le lien avec les valeurs du collectif militaire : "protéger les autres usagers = protéger son équipe"',
      'Travailler spécifiquement les comportements envers les piétons antillais (traversées en dehors des passages protégés très fréquentes)',
      'Jeux de rôle : "tu es piéton / cycliste — qu\'est-ce que tu voudrais que le conducteur fasse ?"',
    ],
    risquesSpecifiques:'La "conduite à l\'antillaise" peut inclure des gestes d\'intimidation ou de klaxon excessif — à recadrer explicitement dans le cadre RSMA.',
    pisTeEvaluation:'Observation comportementale : cède-t-il la priorité aux piétons spontanément ? Donne-t-il les indications de changement de direction ?',
  },
  {
    comp:'C3.2', titre:'États internes',
    valeurSMA:'Connaissance de soi & gestion du stress',
    lien:'La maîtrise de ses états internes est au cœur de la formation militaire : le VS apprend à gérer la fatigue, la pression, la peur lors des exercices physiques et tactiques. La transposition à la conduite est naturelle.',
    adaptationRSMA:[
      'Aborder la fatigue avec honnêteté : les VS ont un rythme militaire intensif — la privation de sommeil est réelle et influente sur la conduite',
      'Alcool et cannabis : tolérance zéro imposée par le cadre militaire RSMA — mais contexte festif guadeloupéen à aborder sans tabou',
      'Stress d\'examen : les VS anxieux à l\'oral/écrit le sont aussi en conduite surveillance — préparation spécifique nécessaire',
    ],
    risquesSpecifiques:'Le VS peut minimiser l\'effet de la fatigue (culture "dur à la tâche" militaire). Insister sur la dangerosité au volant sans culpabiliser.',
    pisTeEvaluation:'Auto-évaluation avant chaque séance : "comment tu te sens aujourd\'hui ? 1 à 5" — le formateur adapte l\'objectif.',
  },
  {
    comp:'C3.3', titre:'Éco-conduite',
    valeurSMA:'Économie de moyens & responsabilité environnementale',
    lien:'L\'armée française a des objectifs de réduction d\'empreinte carbone. Le SMA sensibilise à la préservation de l\'environnement (Guadeloupe = biodiversité exceptionnelle, Parc National). L\'éco-conduite s\'inscrit dans cette mission.',
    adaptationRSMA:[
      'Lien avec la biodiversité locale : "conduire doux = moins de CO₂ sur les mangroves de Guadeloupe"',
      'Calcul concret : éco-conduite = 15 à 20 % d\'économie de carburant → argument financier fort pour des VS aux revenus modestes',
      'Exercices d\'anticipation longue distance sur les routes nationales de Grande-Terre (ligne droite, vent de face)',
    ],
    risquesSpecifiques:'L\'éco-conduite est perçue comme anecdotique par certains VS. Le formateur doit relier à un bénéfice immédiat (coût carburant post-permis).',
    pisTeEvaluation:'Mesure du régime moteur : objectif < 2500 tr/min en conduite normale — bipper ou voyant indicateur de passage de vitesse.',
  },
];

const EDPMS_RSMA_ENTRETIEN = [
  { id:'er1', categorie:'Parcours SMA & motivations', questions:[
    'Depuis combien de temps es-tu au RSMA ? Comment se passe ta formation globalement ?',
    'Pourquoi as-tu demandé à passer le permis dans le cadre du RSMA ?',
    'Qu\'est-ce que le permis va changer pour toi une fois que tu seras sorti(e) du RSMA ?',
    'Tu as déjà un projet professionnel précis qui nécessite le permis ? Lequel ?',
    'Quelqu\'un dans ta famille ou ton entourage t\'aide à préparer le permis en dehors des séances ?',
  ]},
  { id:'er2', categorie:'Expérience de conduite (milieu antillais)', questions:[
    'Tu as déjà conduit quelque chose ? (voiture, scooter, quad, véhicule agricole, bateau…)',
    'Dans quel contexte tu conduisais ? (zone rurale, commune, rue principale…) Comment tu apprenais ? Quelqu\'un t\'a appris ?',
    'Tu connais les routes de Guadeloupe : Grande-Terre, Basse-Terre, les deux ? Sur quel type de route te sens-tu le moins à l\'aise ?',
    'Tu as déjà eu un accident ou un accrochage ? Tu peux me raconter ce qui s\'est passé ?',
    'Tu penses que la conduite en Guadeloupe c\'est différent de la métropole ? En quoi ?',
  ]},
  { id:'er3', categorie:'Rapport aux règles & à l\'examen', questions:[
    'Le code de la route en théorie, tu t\'es mis(e) à réviser comment ? Application, livret, avec quelqu\'un ?',
    'Qu\'est-ce qui te semble le plus dur dans le code ? (panneaux, priorités, distances…)',
    'L\'examen du permis, tu y penses comment ? (stressant, confiant, appréhension…)',
    'Si tu rates l\'examen, qu\'est-ce que tu feras ?',
    'Dans ta tête, c\'est quoi un bon conducteur ?',
  ]},
  { id:'er4', categorie:'Disponibilité & organisation', questions:[
    'Tes créneaux de conduite s\'intègrent bien à ton emploi du temps au régiment ?',
    'Tu as du temps pour réviser le code le soir ou le week-end ?',
    'Est-ce qu\'il y a des moments où tu es très fatigué(e) (exercices physiques, garde) et qui pourraient affecter tes séances de conduite ?',
    'Si la formation devait s\'allonger de quelques mois, c\'est compatible avec ton contrat RSMA ?',
  ]},
];

const EDPMS_RSMA_NIVEAUX = [
  {
    id:'A', label:'A — Débutant', color:'#f87171',
    profilRSMA:'VS sans expérience de conduite ou avec uniquement 2RM. Représente souvent 30 à 40 % des VS en début de formation.',
    priorites:['D1 : prise en main, direction, manœuvres (base minimum 15 h avant D2)', 'Travail oral intensif sur le Code', 'Séances courtes avec objectif unique par sortie'],
    dureeEstimee:'35–45 h de conduite estimées avant examen.',
    alertes:['Vérifier la capacité de lecture du code (livret ou appli avec audio)', 'Surveiller le niveau de stress en examen (peut invalider les acquis en conduite)'],
  },
  {
    id:'B', label:'B — En acquisition', color:'var(--gold)',
    profilRSMA:'VS avec expérience 2RM ou conduite informelle (routes rurales). Profil le plus fréquent au RSMA Guadeloupe (50–55 %).',
    priorites:['Consolider D1 (freinage, trajectoires)', 'Introduire D2 : carrefours Pointe-à-Pitre, priorités, dépassements', 'Déconstruire les habitudes "scooteriste" (angles morts, position sur la voie)'],
    dureeEstimee:'20–30 h estimées.',
    alertes:['Ne pas progresser vers D2 trop vite : les automatismes négatifs reviennent sous stress d\'examen', 'Travail spécifique rond-points (nombreux à Grande-Terre)'],
  },
  {
    id:'C', label:'C — Intermédiaire', color:'var(--accent-liika)',
    profilRSMA:'VS avec expérience de conduite auto (AAC, conduite supervisée, permis étranger caduc). Minoritaire mais valorisant pour l\'individu.',
    priorites:['D2 : situations complexes, nuit, pluie tropicale', 'D3 : coopération, états internes, alcool/fatigue', 'Préparation examen : séances "blanches" + code'],
    dureeEstimee:'12–20 h estimées.',
    alertes:['Le VS "C" peut sous-estimer certaines règles locales (signalisation spécifique DOM)', 'Rappeler que l\'éco-conduite est évaluée à l\'examen'],
  },
  {
    id:'D', label:'D — Avancé', color:'#4ade80',
    profilRSMA:'Rare au RSMA (< 10 %). VS ayant déjà eu le permis (annulé, expiré, étranger) ou ayant eu beaucoup d\'heures en AAC.',
    priorites:['Mise à niveau réglementaire et reflex D3', 'Préparation directe à l\'examen', 'Éventuellement : formation remorque BE si projet professionnel lié (TP, agriculture)'],
    dureeEstimee:'6–12 h estimées.',
    alertes:['Ne pas négliger l\'examen théorique même si conduite bonne', 'Vérifier la conformité des acquis antérieurs aux règles françaises actuelles'],
  },
];

// ── Permis Poids Lourd (C / CE) — RSMA Guadeloupe ───────────────────────────
const PL_REFERENTIEL = {
  role:'VT Monitrice PL au RSMA Guadeloupe : former les Volontaires Stagiaires au permis C (porteur rigide) et CE (véhicule articulé) dans le cadre d\'une insertion professionnelle dans le transport routier.',
  categories:[
    { cat:'C',  label:'Porteur rigide',         ptac:'> 3,5 t', remorque:'≤ 750 kg PTAC', prerequis:'Permis B (pas de délai)', age:'18 ans (21 ans sans FIMO)', usage:'Camions benne, camions-grue, bétaillères, camions frigorifiques rigides' },
    { cat:'CE', label:'Véhicule articulé',       ptac:'> 3,5 t + remorque > 750 kg', remorque:'> 750 kg PTAC', prerequis:'Permis C', age:'18 ans (21 ans sans FIMO)', usage:'Semi-remorques, ensembles routiers, doubles-ponts' },
    { cat:'C1', label:'Porteur léger',           ptac:'3,5 à 7,5 t', remorque:'≤ 750 kg PTAC', prerequis:'Permis B', age:'18 ans', usage:'Ambulances, véhicules de livraison lourds, bétaillères légères' },
  ],
  epreuves:[
    { code:'B96/ETAM', label:'Épreuve théorique générale (code)', desc:'80 questions QCM en 40 min (même base que permis B + questions spécifiques PL). Seuil de réussite : ≥ 35/40.' },
    { code:'ETAM PL', label:'Épreuve théorique spécifique PL', desc:'Questions spécifiques au PL : réglementation sociale, tachygraphe, arrimage, masses et charges, transport de matières dangereuses.' },
    { code:'EPAM', label:'Épreuve pratique hors circulation', desc:'Vérifications sécurité extérieure et intérieure, manœuvres : recul, demi-tour, créneau, couplage/découplage (CE).' },
    { code:'ECAM', label:'Épreuve de conduite en circulation', desc:'45 min minimum de conduite réelle en milieu varié (urbain, route, autoroute si disponible). Évaluation des compétences REMC adaptées PL.' },
  ],
  formations:[
    { sigle:'FIMO', nom:'Formation Initiale Minimale Obligatoire', duree:'280 h (7 semaines)', obligatoire:true, desc:'Obligatoire pour toute activité salariée de transport routier de marchandises. Valable 5 ans. Donne droit à la carte de conducteur CQC.' },
    { sigle:'FCOS', nom:'Formation Continue Obligatoire de Sécurité', duree:'35 h (1 semaine)', obligatoire:true, desc:'Recyclage tous les 5 ans après la FIMO. Maintien de la validité du CQC.' },
    { sigle:'CQC',  nom:'Certificat de Qualification Conducteur', duree:'Carte valable 5 ans', obligatoire:true, desc:'Carte délivrée après FIMO ou FCO. Obligatoire pour tout conducteur salarié PL. Incluse dans l\'agenda RSMA pour les VS candidats au transport.' },
    { sigle:'ADR',  nom:'Transport de marchandises dangereuses', duree:'4 jours (base) + options', obligatoire:false, desc:'Habilitation requise pour transporter des matières dangereuses (classes 1 à 9). Recyclage tous les 5 ans.' },
    { sigle:'CACES', nom:'Certificat d\'Aptitude à la Conduite En Sécurité', duree:'1 à 5 jours selon catégorie', obligatoire:false, desc:'Pour la conduite d\'engins de chantier, chariots élévateurs, nacelles. Complément fréquent au PL pour l\'employabilité au RSMA.' },
  ],
};

const PL_REGLEMENTATION = [
  {
    id:'pl1', icon:'⏱️', titre:'Temps de conduite et de repos (Règlement CE 561/2006)',
    pointsCles:[
      'Temps de conduite journalier : 9 h max (dérogation 10 h deux fois par semaine)',
      'Temps de conduite hebdomadaire : 56 h max',
      'Temps de conduite bi-hebdomadaire : 90 h max sur 2 semaines consécutives',
      'Pause obligatoire : 45 min après 4h30 de conduite (fractionnables : 15 min + 30 min)',
      'Repos journalier : 11 h min (réductible à 9 h max 3 fois/semaine avec compensation)',
      'Repos hebdomadaire : 45 h min (réductible à 24 h si compensation dans les 3 semaines suivantes)',
      'Repos hebdomadaire : ne peut pas être pris dans la cabine si le véhicule est en mouvement ou à quai',
    ],
    sanctions:[
      'Dépassement temps conduite journalier : contravention 4ᵉ classe (750 €)',
      'Non-respect du repos journalier : même sanction',
      'Infraction grave : immobilisation du véhicule et mise en demeure de respecter le repos',
      'Employeur complice : responsabilité partagée si la société impose des objectifs incompatibles',
    ],
    conseilsMonitrice:[
      'Faire calculer les temps de conduite sur des exemples de tournées réelles antillaises (Pointe-à-Pitre → Basse-Terre → retour)',
      'Insister sur la différence entre temps de conduite et temps de travail (manutention, attentes, chargement ne comptent pas en conduite)',
      'Exercice pratique : lire les données d\'un disque tachygraphe ou d\'un fichier numérique DDD',
    ],
  },
  {
    id:'pl2', icon:'📟', titre:'Tachygraphe (analogique & numérique)',
    pointsCles:[
      'Obligation légale depuis 1985 (analogique), 2006 (numérique) pour les véhicules > 3,5 t en transport professionnel',
      'Tachygraphe numérique : carte conducteur individuelle (valable 5 ans) obligatoire',
      'Modes d\'activité à enregistrer : CONDUITE ◎ | DISPONIBILITÉ ☐ | AUTRES TRAVAUX ✕ | REPOS ▬',
      'Téléchargement obligatoire : carte conducteur tous les 28 jours, unité véhicule tous les 90 jours',
      'Tachygraphe intelligent (V2, SMART) : obligatoire sur les véhicules neufs depuis 2023, géolocalisation automatique',
      'Toute manipulation frauduleuse (aimant, débranchement) = délit pénal',
    ],
    sanctions:[
      'Absence de carte conducteur : 1 500 € d\'amende + immobilisation',
      'Falsification des données : 2 ans d\'emprisonnement + 30 000 €',
      'Absence de téléchargement dans les délais : 1 500 €',
      'Disque ou fichier non présenté aux forces de l\'ordre : 750 €',
    ],
    conseilsMonitrice:[
      'Exercice d\'insertion et de retrait de la carte conducteur avant chaque séance de conduite',
      'Faire lire les pictogrammes d\'activité sur la face avant du tachygraphe numérique',
      'Expliquer l\'historique des 28 derniers jours : les forces de l\'ordre peuvent le consulter à tout moment',
      'Aborder la fraude : le VS doit comprendre que les conséquences dépassent largement le gain de temps',
    ],
  },
  {
    id:'pl3', icon:'⚖️', titre:'Masses et charges — PTAC, PTRA, essieux',
    pointsCles:[
      'PTAC (Poids Total Autorisé en Charge) : poids maximal du véhicule chargé inscrit à la carte grise',
      'PTRA (Poids Total Roulant Autorisé) : PTAC tracteur + PTAC remorque pour les ensembles CE',
      'Charge à l\'essieu : 13 t max sur essieu moteur, 10 t sur essieu directeur, 20 t sur tandem',
      'Hauteur maximale : 4 m (attention aux ponts guadeloupéens, nombreux ponts < 4,5 m)',
      'Largeur maximale : 2,55 m (2,60 m pour véhicules réfrigérés)',
      'Longueur maximale : 12 m (porteur), 16,5 m (semi-remorque), 18,75 m (ensemble routier)',
      'Dépassement de charge → amende proportionnelle + consignation du chargement excédentaire',
    ],
    sanctions:[
      'Dépassement PTAC de 1 à 5 % : 135 €',
      'Dépassement > 5 % : amende proportionnelle au surplus, mise en fourrière possible',
      'Dépassement essieu : amende + consignation + immobilisation jusqu\'à déchargement',
      'Transport exceptionnel sans autorisation : 1 500 € à 15 000 €',
    ],
    conseilsMonitrice:[
      'Exercice : lire la carte grise d\'un PL et identifier le PTAC, le PTRA, la masse à vide',
      'Rappeler les spécificités des routes guadeloupéennes : virages serrés Basse-Terre, rond-points urbains de Pointe-à-Pitre, ponts étroits',
      'Insister sur le gabarit en marche arrière et en virage : erreur fréquente sur les livraisons en ville antillaise',
    ],
  },
  {
    id:'pl4', icon:'🔗', titre:'Arrimage et sécurisation du chargement',
    pointsCles:[
      'Base légale : Arrêté du 22 juin 1998 + norme NF EN 12195-1 (calcul des forces)',
      'Règle fondamentale : le chargement ne doit pas se déplacer lors d\'un freinage d\'urgence (frein à 8 m/s²)',
      'Techniques d\'arrimage : sangles, chaînes, calage, filets, bâchage (selon le type de marchandise)',
      'Antidérapage : tapis antidérapants sous charges légères et volumineuses',
      'Nombre de sangles : ≥ 1 sangle pour 1 500 kg de charge (règle simplifiée — dépend de l\'angle et du type)',
      'Vérification : le conducteur est responsable de l\'état de l\'arrimage avant départ et en cours de trajet',
      'Chargement frigorifique : vérification de la température de soute avant chargement (chaîne du froid)',
    ],
    sanctions:[
      'Chargement non arrimé : 135 € par défaut constaté, immobilisation possible',
      'Accident causé par un objet tombé du chargement : responsabilité pénale du conducteur',
      'Bâchage défectueux : verbalisation pour pollution de la voie publique (déchets)',
    ],
    conseilsMonitrice:[
      'Exercice pratique d\'arrimage sur plateau de formation avant toute sortie route',
      'Insister sur la responsabilité personnelle du conducteur : même si le chargeur a tout mis, le conducteur signe',
      'Cas concret guadeloupéen : chargement de matériaux de construction (blocs, sacs de ciment) — très courant au RSMA pour les chantiers de formation',
    ],
  },
  {
    id:'pl5', icon:'🔧', titre:'Vérifications sécurité PL (RSVERO)',
    pointsCles:[
      'RSVERO = Routine de Sécurité Véhicule et de l\'Environnement ROute — check-list avant départ obligatoire',
      'Tour extérieur : feux (codes, route, stop, clignotants), pneumatiques (sculpture, pression, état flanc), niveaux visibles (huile, eau), réservoir, couplage attelage (CE)',
      'Cabine : mirrors correctement réglés (grande glace + petit miroir anti-angle mort), ceinture, siège, avertisseur sonore',
      'Commandes : frein de service (test basse pression), frein de stationnement, frein moteur, frein ralentisseur (retarder)',
      'Pneumatiques PL : pression entre 8 et 10 bars (contre 2,5 bars pour une voiture) — à vérifier à froid',
      'Attelage (CE) : sellette verrouillée (2 cliquets visibles), sabots d\'attelage, câble électrique et flexibles frein connectés',
      'Extincteur : obligatoire à bord, accessible, non périmé',
    ],
    sanctions:[
      'Défaut d\'éclairage constaté : 90 €',
      'Pneu lisse (sculpture < 1 mm) : 135 € par pneu + immobilisation si risque grave',
      'Attelage défectueux : immobilisation immédiate',
    ],
    conseilsMonitrice:[
      'Faire le RSVERO systématiquement au début de chaque séance — devient un automatisme',
      'Lier le RSVERO aux valeurs RSMA : "revue de matériel militaire" avant chaque mission',
      'Exercice noté : VS effectue le RSVERO seul, monitrice évalue sans intervenir → prise de responsabilité',
    ],
  },
  {
    id:'pl6', icon:'🏙️', titre:'Conduite en milieu urbain — spécificités PL',
    pointsCles:[
      'Angle mort latéral droit : jusqu\'à 5 m (cyclistes, 2RM, piétons) — miroir grand angle obligatoire',
      'Angle mort avant : sous le pare-brise, 2 à 3 m devant le camion — invisible depuis la cabine',
      'Rayon de braquage : 12 m pour un porteur C, 18 m pour un semi CE — planifier l\'approche des carrefours',
      'Virage à droite PL : déborder légèrement sur la gauche avant le virage pour ne pas couper le trottoir',
      'Marche arrière : utiliser un signaleur (VS RSMA = co-équipiers disponibles) — guidage standardisé',
      'Zone urbaine guadeloupéenne : rond-points de Pointe-à-Pitre (Jarry, Le Gosier) très contraints — pratique obligatoire',
      'Stationnement en double file : interdit même pour la livraison sauf exception et bref arrêt',
    ],
    conseilsMonitrice:[
      'Séances en zone de Jarry (zone industrielle de Pointe-à-Pitre) : idéal pour les livraisons et ronds-points PL',
      'Exercice signaleur : VS guidant en marche arrière sur le terrain du RSMA avant les sorties route',
      'Insister sur le miroir anti-angle mort : réglage et lecture systématiques en tournant à droite',
    ],
  },
];

const PL_REMC_ADAPTATIONS = [
  { comp:'C1.1', titre:'Prise en main véhicule PL', specificite:'Le RSVERO PL remplace la simple vérification voiture. Bien plus complexe : attelage, pneumatiques haute pression, niveau AdBlue, tachygraphe.', exercice:'RSVERO complet chronométré (objectif < 12 min avant épreuve EPAM).' },
  { comp:'C1.2', titre:'Direction et vitesse PL', specificite:'Distance de freinage d\'un PL chargé à 60 km/h : ≈ 75 m (vs 35 m pour une voiture). La régulation d\'allure est critique. Frein moteur et retarder à intégrer systématiquement.', exercice:'Freinage progressif avec charge : observer et verbaliser la différence vs véhicule léger.' },
  { comp:'C1.3', titre:'Manœuvres PL', specificite:'Créneau PL sur 4 emplacements de voiture. Couplage/découplage attelage CE (épreuve EPAM notée). Marche arrière sur longue distance en surveillance miroir.', exercice:'Couplage/découplage 3 fois minimum par séance jusqu\'à automatisme total.' },
  { comp:'C2.1', titre:'Percevoir et analyser PL', specificite:'Les angles morts PL sont démultipliés. Balayage visuel obligatoire des 4 miroirs (grande glace gauche/droite, miroir anti-angle mort droit, miroir de manœuvre). Hauteur de cabine = champ visuel différent.', exercice:'Commentaire de conduite à voix haute sur les 4 miroirs en circulation : "miroir droit — dégagé".' },
  { comp:'C2.2', titre:'Règles spécifiques PL', specificite:'Vitesses PL : 80 km/h route (au lieu de 80 pour VP), 90 km/h voie express, 90 km/h autoroute (au lieu de 130). Interdictions de circuler (week-ends, jours fériés, 22h–6h selon saison). Voie réservée aux VL en agglomération.', exercice:'Quiz oral : "tu es sur une voie express, quelle vitesse max ?" + cas concrets interdictions de circuler.' },
  { comp:'C2.3', titre:'Situations particulières PL', specificite:'Pluie tropicale : distance de freinage × 3 sur PL chargé. Côtes de Basse-Terre : frein moteur obligatoire, pas de frein de service continu (échauffement tambours). Vent de face en sortie de zone maritime (Jarry).', exercice:'Descente de côte Basse-Terre : frein moteur exclusif jusqu\'à vitesse stabilisée, frein de service bref si nécessaire.' },
  { comp:'C3.1', titre:'Attitude coopérative PL', specificite:'Le PL est perçu comme menaçant par les autres usagers. La coopération active (laisser la place aux cyclistes, aux 2RM qui passent à droite) est une compétence professionnelle différenciante.', exercice:'Débriefing après circulation : "combien de fois tu as vu un 2RM à ta droite ? Qu\'as-tu fait ?"' },
  { comp:'C3.2', titre:'États internes PL', specificite:'La conduite de nuit est fréquente en transport routier. La fatigue au volant d\'un PL est une question de sécurité publique majeure. Les VS RSMA ont un rythme militaire intensif → surveillance accrue.', exercice:'Auto-évaluation fatigue avant chaque séance. Calculer ensemble quand le VS peut conduire selon un planning de tournée fictif.' },
  { comp:'C3.3', titre:'Éco-conduite PL', specificite:'L\'éco-conduite PL représente 20 à 30 % d\'économie de carburant (impact économique majeur pour l\'entreprise). Anticipation longue distance, montée en régime économique (< 1 500 tr/min diesel), rétrogradation douce, vent de face = pied levé 500 m avant.', exercice:'Comparaison de consommation sur même trajet : conduite normale vs éco-conduite → affichage ordinateur de bord.' },
];

// ── CATEGORIES ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id:'lifestyle', label:'Lifestyle', emoji:'🌺',
    color:'#e91e8c',
    grad:'linear-gradient(135deg,#7c2257 0%,#c2185b 55%,#e91e8c 100%)',
    desc:'Sorties · Photos · Idées · Maison · Culture',
    views:[
      { id:'sortie',  label:'Sorties',     icon:'🎉' },
      { id:'album',   label:'Album photo', icon:'📸' },
      { id:'idees',   label:'Idées',       icon:'💡' },
      { id:'maison',  label:'Maison',      icon:'🏠' },
      { id:'couple',  label:'Nous deux',   icon:'♡'  },
      { id:'culture', label:'Culture GWA', icon:'🎭' },
      { id:'vision',  label:'Vision',      icon:'✦'  },
    ],
  },
  {
    id:'sante', label:'Santé & Finance', emoji:'💚',
    color:'#10b981',
    grad:'linear-gradient(135deg,#064e3b 0%,#059669 55%,#10b981 100%)',
    desc:'Sport · Budget · Repas · Médical · Voyages',
    views:[
      { id:'sport',    label:'Sport',         icon:'💪' },
      { id:'budget',   label:'Budget',        icon:'💰' },
      { id:'repas',    label:'Repas',         icon:'🍽'  },
      { id:'courses',  label:'Courses',       icon:'🛒' },
      { id:'medical',  label:'Suivi médical', icon:'🩺' },
      { id:'drevmcook',label:'DrevmCook',     icon:'🌿' },
      { id:'potager',  label:'Potager GWA',   icon:'🌱' },
      { id:'voyages',  label:'Voyages',       icon:'✈️' },
      { id:'charts',   label:'Stats',         icon:'▤'  },
    ],
  },
  {
    id:'prolia', label:'Pro · Purple Moon', emoji:'🎖️',
    color:'#f472b6',
    grad:'linear-gradient(135deg,#831843 0%,#be185d 55%,#f472b6 100%)',
    desc:'Planning · REMC · Route · Survie',
    views:[
      { id:'planning',     label:'Planning',       icon:'🗓' },
      { id:'objmensuel',   label:'Objectifs mois', icon:'🎯' },
      { id:'coderousseau', label:'REMC',           icon:'🎓' },
      { id:'route',        label:'Route Liika',    icon:'🚛' },
      { id:'survie',       label:'Survie',         icon:'🪖' },
      { id:'calendar',     label:'Calendrier',     icon:'📅' },
      { id:'liika',        label:'Profil Liika',   icon:'◇'  },
    ],
  },
  {
    id:'prodja', label:'Pro · Negus Dja', emoji:'🎨',
    color:'#a78bfa',
    grad:'linear-gradient(135deg,#2e1065 0%,#6d28d9 55%,#a78bfa 100%)',
    desc:'Art · Création · Direction artistique',
    views:[
      { id:'artiste', label:'Art & Projets',  icon:'🎨' },
      { id:'dja',     label:'Profil Dja',     icon:'◆'  },
      { id:'vision',  label:'Vision board',   icon:'✦'  },
      { id:'calendar',label:'Calendrier',     icon:'📅' },
    ],
  },
  {
    id:'media', label:'Multimédia', emoji:'🎬',
    color:'#d9b75f',
    grad:'linear-gradient(135deg,#78350f 0%,#b45309 55%,#d9b75f 100%)',
    desc:'Playlist · Jeux · Recettes · Culture',
    views:[
      { id:'media',    label:'Playlist',    icon:'🎬' },
      { id:'jeux',     label:'Jeux',        icon:'🎮' },
      { id:'recettes', label:'Recettes',    icon:'🍳', target:'drevmcook' },
      { id:'culture',  label:'Culture GWA', icon:'🎭' },
    ],
  },
];

function CategoryHome({ catIdx, prevCatIdx, setView, goToCategory }) {
  var cat = CATEGORIES[catIdx] || CATEGORIES[0];
  var dir = catIdx >= prevCatIdx ? 'right' : 'left';
  var [touchX, setTouchX] = React.useState(null);
  var [paused, setPaused] = React.useState(false);
  var [progKey, setProgKey] = React.useState(0); // force re-mount de la barre
  var timerRef = React.useRef(null);

  var goTo = React.useCallback(function(newIdx) {
    goToCategory(CATEGORIES[newIdx].id);
    setPaused(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(function() { setPaused(false); }, 12000);
  }, [goToCategory]);

  var goPrev = function() { goTo((catIdx - 1 + CATEGORIES.length) % CATEGORIES.length); };
  var goNext = function() { goTo((catIdx + 1) % CATEGORIES.length); };

  // Auto-avance toutes les 5s
  React.useEffect(function() {
    setProgKey(function(k) { return k + 1; }); // reset barre de progression
    if (paused) return;
    var t = setTimeout(function() {
      goToCategory(CATEGORIES[(catIdx + 1) % CATEGORIES.length].id);
    }, 5000);
    return function() { clearTimeout(t); };
  }, [catIdx, paused]);

  // Nettoyage timer au démontage
  React.useEffect(function() { return function() { clearTimeout(timerRef.current); }; }, []);

  var onTouchStart = function(e) { setTouchX(e.touches[0].clientX); };
  var onTouchEnd = function(e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 48) { if (dx < 0) goNext(); else goPrev(); }
    setTouchX(null);
  };

  return React.createElement('div', null,
    // ── Heure + météo Guadeloupe + accès Tableau de bord (visible dès l'accueil) ──
    React.createElement('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginBottom:14 } },
      React.createElement(GuadeloupeMeteo, null),
      React.createElement('button', {
        onClick: function(){ setView('dashboard'); },
        style: { display:'inline-flex', alignItems:'center', gap:8, padding:'8px 18px', borderRadius:20, border:'1px solid var(--gold-border)', background:'var(--gold-bg)', color:'var(--gold2)', cursor:'pointer', fontWeight:700, fontSize:13 }
      }, '◈ Ouvrir le tableau de bord')
    ),
    // ── Hero slider ──
    React.createElement('div', {
      className: 'hero-slider',
      onTouchStart: onTouchStart, onTouchEnd: onTouchEnd,
      onMouseEnter: function() { setPaused(true); },
      onMouseLeave: function() { setPaused(false); }
    },
      // Slide
      React.createElement('div', {
        key: cat.id,
        className: 'hero-slide hero-slide-enter-' + dir,
        style: { background: cat.grad }
      },
        // Blobs flottants (parallax décoratif)
        React.createElement('div', { className:'hero-blob hero-blob-1', style:{ background:'rgba(255,255,255,.07)' } }),
        React.createElement('div', { className:'hero-blob hero-blob-2', style:{ background:'rgba(0,0,0,.12)' } }),
        React.createElement('div', { className:'hero-blob hero-blob-3', style:{ background:'rgba(255,255,255,.05)' } }),
        // Contenu
        React.createElement('div', { style:{ position:'relative', zIndex:2 } },
          React.createElement('div', { className:'hero-emoji', style:{ fontSize:60, lineHeight:1, marginBottom:14 } }, cat.emoji),
          React.createElement('h1', { style:{ color:'#fff', margin:'0 0 6px', fontSize:28, fontWeight:900, letterSpacing:'-.5px', textShadow:'0 2px 12px rgba(0,0,0,.4)', lineHeight:1.1 } }, cat.label),
          React.createElement('p', { style:{ color:'rgba(255,255,255,.75)', margin:'0 0 18px', fontSize:13, lineHeight:1.5, fontStyle:'italic' } }, cat.desc),
          // Pills raccourcis
          React.createElement('div', { style:{ display:'flex', gap:7, flexWrap:'wrap' } },
            cat.views.slice(0, 4).map(function(v) {
              return React.createElement('button', {
                key: v.id, className:'hero-pill',
                onClick: function() { setView(v.target || v.id); }
              }, v.icon, ' ', v.label);
            })
          )
        ),
        // Barre de progression auto-avance
        !paused && React.createElement('div', { key: 'prog-' + progKey, className:'hero-progress hero-progress-anim' })
      ),
      // Flèche gauche
      React.createElement('button', { className:'hero-arrow hero-arrow-left', onClick:goPrev, 'aria-label':'Précédent' }, '‹'),
      // Flèche droite
      React.createElement('button', { className:'hero-arrow hero-arrow-right', onClick:goNext, 'aria-label':'Suivant' }, '›'),
      // Points de navigation
      React.createElement('div', { className:'hero-dots' },
        CATEGORIES.map(function(c, i) {
          return React.createElement('button', {
            key: c.id,
            className: 'hero-dot' + (i === catIdx ? ' active' : ''),
            onClick: function() { goTo(i); },
            'aria-label': c.label
          });
        })
      )
    ),
    // ── Grille de tuiles ──
    React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(96px,1fr))', gap:12 } },
      cat.views.map(function(v, i) {
        return React.createElement('button', {
          key: v.id, className:'view-tile',
          style: { animationDelay: i * 55 + 'ms' },
          onClick: function() { setView(v.target || v.id); }
        },
          React.createElement('span', { className:'view-tile-icon' }, v.icon),
          React.createElement('span', { className:'view-tile-label' }, v.label)
        );
      })
    )
  );
}

// ── Stub views ────────────────────────────────────────────────────────────────
function SortieView() {
  const [list, setList] = React.useState(() => { try { return JSON.parse(localStorage.getItem('ld-sorties')||'[]'); } catch { return []; } });
  const [form, setForm] = React.useState({ titre:'', date:'', lieu:'', notes:'' });
  const [show, setShow] = React.useState(false);
  const save = l => { setList(l); localStorage.setItem('ld-sorties', JSON.stringify(l)); };
  const add = () => { if (!form.titre.trim()) return; save([{ id:Date.now().toString(), ...form }, ...list]); setForm({ titre:'', date:'', lieu:'', notes:'' }); setShow(false); };
  const del = id => save(list.filter(x => x.id !== id));
  const inp = { background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:13, width:'100%', boxSizing:'border-box' };
  const btnPrimary = { padding:'8px 20px', borderRadius:12, border:'none', background:'#e91e8c', color:'#fff', cursor:'pointer', fontWeight:700 };
  return React.createElement('div', null,
    React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 } },
      React.createElement('h2', { style:{ margin:0, fontSize:20 } }, '🎉 Sorties & Événements'),
      React.createElement('button', { onClick:()=>setShow(!show), style:{ ...btnPrimary, borderRadius:20, fontSize:13 } }, show ? '✕ Fermer' : '+ Ajouter')
    ),
    show && React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid rgba(233,30,140,.35)', borderRadius:'var(--radius)', padding:16, marginBottom:16 } },
      React.createElement('input', { placeholder:'Titre *', value:form.titre, onChange:e=>setForm(p=>({...p,titre:e.target.value})), style:{ ...inp, marginBottom:8 } }),
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 } },
        React.createElement('input', { type:'date', value:form.date, onChange:e=>setForm(p=>({...p,date:e.target.value})), style:inp }),
        React.createElement('input', { placeholder:'Lieu', value:form.lieu, onChange:e=>setForm(p=>({...p,lieu:e.target.value})), style:inp })
      ),
      React.createElement('textarea', { placeholder:'Notes...', value:form.notes, onChange:e=>setForm(p=>({...p,notes:e.target.value})), style:{ ...inp, minHeight:60, marginBottom:10, resize:'vertical' } }),
      React.createElement('button', { onClick:add, style:btnPrimary }, 'Enregistrer')
    ),
    list.length === 0 && !show && React.createElement('div', { style:{ textAlign:'center', padding:'50px 0', color:'var(--text3)', fontSize:14 } }, '🌴 Ajoutez vos sorties et événements'),
    list.map(s => React.createElement('div', { key:s.id, style:{ background:'var(--glass)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 16px', marginBottom:10, display:'flex', gap:12, alignItems:'flex-start' } },
      React.createElement('div', { style:{ flex:1 } },
        React.createElement('div', { style:{ fontWeight:700, color:'var(--text)', marginBottom:3, fontSize:14 } }, s.titre),
        (s.date||s.lieu) && React.createElement('div', { style:{ fontSize:12, color:'var(--text3)' } }, [s.date,s.lieu].filter(Boolean).join(' · ')),
        s.notes && React.createElement('div', { style:{ fontSize:12, color:'var(--text3)', fontStyle:'italic', marginTop:4 } }, s.notes)
      ),
      React.createElement('button', { onClick:()=>del(s.id), style:{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:18 } }, '×')
    ))
  );
}

function compressImage(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onerror = reject;
    reader.onload = function(e) {
      var img = new Image();
      img.onerror = reject;
      img.onload = function() {
        var maxW = 1080;
        var ratio = Math.min(maxW / img.width, maxW / img.height, 1);
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
function AlbumView({ album, addAlbumPhoto, deleteAlbumPhoto }) {
  const photos = album || [];
  const [url, setUrl] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [slideIdx, setSlideIdx] = React.useState(null);
  const [autoPlay, setAutoPlay] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // Migration unique : photos URL existantes depuis ld-album localStorage → app_state synced
  React.useEffect(function() {
    try {
      var local = JSON.parse(localStorage.getItem('ld-album') || '[]');
      var syncedIds = new Set((album || []).map(function(p) { return p.id; }));
      var toMigrate = local.filter(function(p) {
        if (syncedIds.has(p.id)) return false;
        var src = p.src || p.url || '';
        return src.startsWith('http'); // URLs seulement (pas base64)
      });
      toMigrate.forEach(function(p) { addAlbumPhoto(p); });
      if (local.length > 0) localStorage.removeItem('ld-album');
    } catch(_) {}
  }, []); // eslint-disable-line

  var ALBUM_BASE = SB_URL + '/storage/v1/object/public/album-photos/';
  function dataURLtoBlob(dataURL) {
    var parts = dataURL.split(',');
    var mime = parts[0].match(/:(.*?);/)[1];
    var binary = atob(parts[1]);
    var arr = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  const addPhoto = function(srcOrMeta) {
    var photo = typeof srcOrMeta === 'string'
      ? { id: Date.now().toString(), src: srcOrMeta, caption: caption.trim(), date: new Date().toISOString().slice(0,10) }
      : srcOrMeta;
    addAlbumPhoto(photo);
    setCaption(''); setUrl(''); setShow(false);
  };
  const addUrl = () => { if (!url.trim()) return; addPhoto(url.trim()); };
  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      const blob = dataURLtoBlob(dataUrl);
      const path = 'photos/' + Date.now() + '-' + Math.random().toString(36).slice(2,8) + '.jpg';
      const { error } = await sb.storage.from('album-photos').upload(path, blob, { contentType:'image/jpeg', upsert:false });
      if (error) throw error;
      const { data: urlData } = sb.storage.from('album-photos').getPublicUrl(path);
      addPhoto({ id: Date.now().toString(), src: urlData.publicUrl, caption: caption.trim(), date: new Date().toISOString().slice(0,10) });
    } catch(err) {
      alert('Impossible d\'envoyer cette photo : ' + ((err && err.message) || 'erreur réseau'));
    } finally { setUploading(false); if(e.target) e.target.value = ''; }
  };
  const del = id => {
    const photo = photos.find(p => p.id === id);
    const next = photos.filter(p => p.id !== id);
    if (slideIdx !== null && slideIdx >= next.length) setSlideIdx(Math.max(0, next.length - 1));
    var storagePath = null;
    if (photo) {
      const src = photo.src || photo.url || '';
      const marker = '/album-photos/';
      const idx = src.indexOf(marker);
      if (idx >= 0) storagePath = src.slice(idx + marker.length);
    }
    deleteAlbumPhoto(id, storagePath);
  };

  // Slideshow auto-play
  React.useEffect(() => {
    if (!autoPlay || slideIdx === null || photos.length <= 1) return;
    const id = setInterval(() => setSlideIdx(i => i === null ? null : (i + 1) % photos.length), 3500);
    return () => clearInterval(id);
  }, [autoPlay, photos.length]);

  // Keyboard navigation
  React.useEffect(() => {
    if (slideIdx === null) return;
    const n = photos.length;
    const h = e => {
      if (e.key === 'ArrowLeft')  setSlideIdx(i => (i - 1 + n) % n);
      else if (e.key === 'ArrowRight') setSlideIdx(i => (i + 1) % n);
      else if (e.key === 'Escape') { setSlideIdx(null); setAutoPlay(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [slideIdx, photos.length]);

  const inp = { background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:13, width:'100%', boxSizing:'border-box' };
  const cur = slideIdx !== null ? photos[slideIdx] : null;
  const btnSlide = { padding:'8px 18px', borderRadius:20, border:'1px solid rgba(255,255,255,.25)', background:'rgba(255,255,255,.12)', color:'#fff', cursor:'pointer', fontSize:20, lineHeight:1 };

  return React.createElement('div', null,
    // Header
    React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, gap:8, flexWrap:'wrap' } },
      React.createElement('h2', { style:{ margin:0, fontSize:20 } }, '📸 Album photo'),
      React.createElement('div', { style:{ display:'flex', gap:8 } },
        photos.length > 0 && React.createElement('button', {
          onClick: () => { setSlideIdx(0); setAutoPlay(false); },
          style:{ padding:'8px 14px', borderRadius:20, border:'1px solid rgba(233,30,140,.45)', background:'transparent', color:'#e91e8c', cursor:'pointer', fontSize:12, fontWeight:700 }
        }, '▶ Slideshow'),
        React.createElement('button', { onClick:()=>setShow(s=>!s), style:{ padding:'8px 18px', borderRadius:20, border:'none', background:'#e91e8c', color:'#fff', cursor:'pointer', fontWeight:700 } }, show ? '✕ Fermer' : '+ Photo')
      )
    ),
    // Add form
    show && React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid rgba(233,30,140,.35)', borderRadius:'var(--radius)', padding:16, marginBottom:16 } },
      // Upload buttons — <label htmlFor> universellement supporté iOS/Android/desktop
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 } },
        React.createElement('label', {
          htmlFor: 'album-gallery-input',
          style:{ display:'block', padding:'14px 10px', borderRadius:12, border:'2px dashed rgba(233,30,140,.4)', background:'rgba(233,30,140,.06)', color:uploading?'var(--text3)':'#e91e8c', cursor:uploading?'not-allowed':'pointer', fontSize:13, fontWeight:700, textAlign:'center', userSelect:'none' }
        }, uploading ? '⏳ Compression...' : React.createElement(React.Fragment, null, React.createElement('div', { style:{ fontSize:26, marginBottom:4 } }, '🖼'), 'Galerie')),
        React.createElement('label', {
          htmlFor: 'album-camera-input',
          style:{ display:'block', padding:'14px 10px', borderRadius:12, border:'2px dashed rgba(233,30,140,.4)', background:'rgba(233,30,140,.06)', color:uploading?'var(--text3)':'#e91e8c', cursor:uploading?'not-allowed':'pointer', fontSize:13, fontWeight:700, textAlign:'center', userSelect:'none' }
        }, React.createElement(React.Fragment, null, React.createElement('div', { style:{ fontSize:26, marginBottom:4 } }, '📷'), 'Caméra'))
      ),
      React.createElement('input', { id:'album-gallery-input', type:'file', accept:'image/*', onChange:uploading?null:handleFile, style:{ display:'none' } }),
      React.createElement('input', { id:'album-camera-input', type:'file', accept:'image/*', capture:'environment', onChange:uploading?null:handleFile, style:{ display:'none' } }),
      // OR separator
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8, margin:'10px 0' } },
        React.createElement('div', { style:{ flex:1, height:1, background:'var(--border)' } }),
        React.createElement('span', { style:{ fontSize:11, color:'var(--text3)' } }, 'ou ajouter par URL'),
        React.createElement('div', { style:{ flex:1, height:1, background:'var(--border)' } })
      ),
      React.createElement('input', { placeholder:'https://...', value:url, onChange:e=>setUrl(e.target.value), style:{ ...inp, marginBottom:8 } }),
      React.createElement('input', { placeholder:'Légende (optionnel)...', value:caption, onChange:e=>setCaption(e.target.value), onKeyDown:e=>e.key==='Enter'&&addUrl(), style:{ ...inp, marginBottom:10 } }),
      url.trim() && React.createElement('button', { onClick:addUrl, style:{ padding:'8px 20px', borderRadius:12, border:'none', background:'#e91e8c', color:'#fff', cursor:'pointer', fontWeight:700 } }, 'Ajouter l\'URL')
    ),
    // Empty state
    photos.length === 0 && !show && React.createElement('div', { style:{ textAlign:'center', padding:'60px 0', color:'var(--text3)' } },
      React.createElement('div', { style:{ fontSize:48, marginBottom:12 } }, '📷'),
      React.createElement('div', null, 'Album vide — immortalisez vos souvenirs !')
    ),
    // Photo grid
    React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:10 } },
      photos.map((p, i) => React.createElement('div', {
        key: p.id,
        style:{ borderRadius:'var(--radius)', overflow:'hidden', background:'var(--bg2)', position:'relative', cursor:'pointer' },
        onClick: () => setSlideIdx(i)
      },
        React.createElement('img', { src: p.src || p.url, alt: p.caption||'', style:{ width:'100%', aspectRatio:'1', objectFit:'cover', display:'block' }, onError: e => { e.target.style.background='var(--bg3)'; } }),
        React.createElement('div', { style:{ padding:'6px 10px' } },
          p.caption && React.createElement('div', { style:{ fontSize:11, color:'var(--text)', marginBottom:2, lineHeight:1.3 } }, p.caption),
          React.createElement('div', { style:{ fontSize:10, color:'var(--text3)' } }, p.date)
        ),
        React.createElement('button', { onClick:e=>{ e.stopPropagation(); del(p.id); }, style:{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,.70)', border:'none', color:'#fff', borderRadius:'50%', width:24, height:24, cursor:'pointer', fontSize:13, lineHeight:'24px', textAlign:'center' } }, '×')
      ))
    ),
    // Slideshow overlay
    cur && React.createElement('div', {
      style:{ position:'fixed', inset:0, background:'rgba(0,0,0,.96)', zIndex:1000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'16px 0' },
      onClick: () => { setSlideIdx(null); setAutoPlay(false); }
    },
      // Close
      React.createElement('button', {
        onClick: e => { e.stopPropagation(); setSlideIdx(null); setAutoPlay(false); },
        style:{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,.15)', border:'none', color:'#fff', borderRadius:'50%', width:38, height:38, cursor:'pointer', fontSize:20, lineHeight:'38px', textAlign:'center' }
      }, '×'),
      // Photo counter
      React.createElement('div', { style:{ position:'absolute', top:18, left:18, color:'rgba(255,255,255,.55)', fontSize:12, fontFamily:"'Space Mono',monospace" } }, `${slideIdx+1} / ${photos.length}`),
      // Image
      React.createElement('img', {
        src: cur.src || cur.url,
        alt: cur.caption || '',
        onClick: e => e.stopPropagation(),
        style:{ maxWidth:'94vw', maxHeight:'68vh', objectFit:'contain', borderRadius:8, boxShadow:'0 8px 40px rgba(0,0,0,.8)' }
      }),
      // Caption
      cur.caption && React.createElement('div', {
        onClick: e => e.stopPropagation(),
        style:{ color:'rgba(255,255,255,.85)', fontSize:14, fontWeight:500, textAlign:'center', marginTop:12, padding:'0 24px', lineHeight:1.4 }
      }, cur.caption),
      React.createElement('div', { style:{ color:'rgba(255,255,255,.35)', fontSize:11, marginTop:4 } }, cur.date),
      // Nav controls
      React.createElement('div', { onClick:e=>e.stopPropagation(), style:{ display:'flex', gap:10, marginTop:16, alignItems:'center' } },
        React.createElement('button', { onClick:()=>setSlideIdx(i=>(i-1+photos.length)%photos.length), style:btnSlide }, '‹'),
        React.createElement('button', {
          onClick: () => setAutoPlay(a=>!a),
          style:{ ...btnSlide, fontSize:12, padding:'8px 16px', background: autoPlay?'#e91e8c':'rgba(255,255,255,.12)', border:'none' }
        }, autoPlay ? '⏸ Pause' : '▶ Auto'),
        React.createElement('button', { onClick:()=>setSlideIdx(i=>(i+1)%photos.length), style:btnSlide }, '›')
      )
    )
  );
}

function IdeesView() {
  const [idees, setIdees] = React.useState(() => { try { return JSON.parse(localStorage.getItem('ld-idees')||'[]'); } catch { return []; } });
  const [text, setText] = React.useState('');
  const [cat, setCat] = React.useState('Idée');
  const CATS = ['Idée','Projet','Rêve','Question','À explorer'];
  const CAT_C = { 'Idée':'var(--gold)', 'Projet':'var(--accent-liika)', 'Rêve':'var(--accent-dja)', 'Question':'var(--warn)', 'À explorer':'var(--success)' };
  const save = l => { setIdees(l); localStorage.setItem('ld-idees', JSON.stringify(l)); };
  const add = () => { if (!text.trim()) return; save([{ id:Date.now().toString(), text:text.trim(), cat, date:new Date().toISOString().slice(0,10) }, ...idees]); setText(''); };
  const del = id => save(idees.filter(i => i.id !== id));
  return React.createElement('div', null,
    React.createElement('h2', { style:{ margin:'0 0 16px', fontSize:20 } }, '💡 Idées & Inspirations'),
    React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:16, marginBottom:20 } },
      React.createElement('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 } },
        CATS.map(c => React.createElement('button', { key:c, onClick:()=>setCat(c), style:{ padding:'4px 12px', borderRadius:16, border:`1px solid ${cat===c?CAT_C[c]:'var(--border)'}`, background:'transparent', color:cat===c?CAT_C[c]:'var(--text3)', fontSize:12, cursor:'pointer', fontWeight:cat===c?700:400 } }, c))
      ),
      React.createElement('div', { style:{ display:'flex', gap:8 } },
        React.createElement('input', { placeholder:'Votre idée... (Entrée pour valider)', value:text, onChange:e=>setText(e.target.value), onKeyDown:e=>e.key==='Enter'&&add(), style:{ flex:1, background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'9px 12px', fontSize:13 } }),
        React.createElement('button', { onClick:add, style:{ padding:'9px 16px', borderRadius:8, border:'none', background:'var(--gold)', color:'#000', cursor:'pointer', fontWeight:800 } }, '+')
      )
    ),
    idees.length === 0 && React.createElement('div', { style:{ textAlign:'center', padding:'40px 0', color:'var(--text3)' } }, '🌱 Vos idées s\'afficheront ici'),
    idees.map(id => React.createElement('div', { key:id.id, style:{ background:'var(--glass)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:8, display:'flex', gap:10, alignItems:'center' } },
      React.createElement('span', { style:{ fontSize:10, fontWeight:700, color:CAT_C[id.cat]||'var(--gold)', background:'var(--bg2)', borderRadius:10, padding:'2px 8px', whiteSpace:'nowrap' } }, id.cat),
      React.createElement('span', { style:{ flex:1, fontSize:13, color:'var(--text)', lineHeight:1.5 } }, id.text),
      React.createElement('span', { style:{ fontSize:10, color:'var(--text3)', whiteSpace:'nowrap' } }, id.date),
      React.createElement('button', { onClick:()=>del(id.id), style:{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:16 } }, '×')
    ))
  );
}

function MedicalView({ rdvs, addMedical, deleteMedical }) {
  const [form, setForm] = React.useState({ titre:'', date:'', medecin:'', notes:'', qui:'Couple' });
  const [show, setShow] = React.useState(false);
  const QUIS = ['Dja','Liika','Couple'];
  const QUI_C = { 'Dja':'var(--accent-dja)', 'Liika':'var(--accent-liika)', 'Couple':'var(--gold)' };
  // Migration unique depuis localStorage
  React.useEffect(function() {
    try {
      var local = JSON.parse(localStorage.getItem('ld-medical') || '[]');
      if (!local.length) return;
      var syncedIds = new Set((rdvs || []).map(function(r) { return r.id; }));
      local.filter(function(r) { return !syncedIds.has(r.id); }).forEach(function(r) { addMedical(r); });
      localStorage.removeItem('ld-medical');
    } catch(_) {}
  }, []);
  const add = () => { if (!form.titre.trim()) return; addMedical({ id:Date.now().toString(), ...form }); setForm({ titre:'', date:'', medecin:'', notes:'', qui:'Couple' }); setShow(false); };
  const del = id => deleteMedical(id);
  const inp = { background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:13, width:'100%', boxSizing:'border-box' };

  // Compte à rebours en jours (0 = aujourd'hui, >0 à venir, <0 passé). null si pas de date.
  const daysUntil = iso => {
    if (!iso) return null;
    const d = new Date(String(iso).slice(0,10) + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    const t = new Date(); t.setHours(0,0,0,0);
    return Math.round((d.getTime() - t.getTime()) / 86400000);
  };
  const fmtFr = iso => {
    const d = new Date(String(iso).slice(0,10) + 'T00:00:00');
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
  };
  const countdownLabel = n => n === null ? '' : n === 0 ? "Aujourd'hui" : n === 1 ? 'Demain' : n > 1 ? 'Dans ' + n + ' j' : n === -1 ? 'Hier' : 'Il y a ' + (-n) + ' j';

  // Tri : à venir (dates avec compte à rebours >= 0, plus proche en premier) + non datés,
  // puis passés (plus récent en premier).
  const withMeta = (rdvs || []).map(r => ({ r, d: daysUntil(r.date) }));
  const aVenir = withMeta.filter(x => x.d === null || x.d >= 0)
    .sort((a,b) => (a.d === null ? Infinity : a.d) - (b.d === null ? Infinity : b.d));
  const passes = withMeta.filter(x => x.d !== null && x.d < 0).sort((a,b) => b.d - a.d);
  const prochain = aVenir.find(x => x.d !== null) || null;
  const exportOne = r => { const ev = medicalToIcsEvent(r); if (!ev) { alert("Ajoute une date à ce RDV pour l'exporter au calendrier."); return; } downloadIcs([ev], 'rdv-' + (r.titre||'medical').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30) + '.ics'); };
  const exportAll = () => { const evs = (rdvs || []).map(medicalToIcsEvent).filter(Boolean); if (!evs.length) { alert('Aucun RDV daté à exporter.'); return; } downloadIcs(evs, 'suivi-medical.ics'); };

  const renderCard = (r, d) => {
    const past = d !== null && d < 0;
    return React.createElement('div', { key:r.id, style:{ background:'var(--glass)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 16px', marginBottom:10, display:'flex', gap:12, alignItems:'flex-start', opacity: past ? .6 : 1 } },
      React.createElement('div', { style:{ flex:1, minWidth:0 } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' } },
          React.createElement('span', { style:{ fontSize:10, fontWeight:700, color:QUI_C[r.qui]||'var(--gold)', background:'var(--bg2)', borderRadius:10, padding:'2px 7px' } }, r.qui),
          React.createElement('span', { style:{ fontWeight:700, color:'var(--text)', fontSize:14 } }, r.titre),
          d !== null && React.createElement('span', { style:{ fontSize:10, fontWeight:700, color: past ? 'var(--text3)' : (d<=2 ? '#f59e0b' : '#10b981'), background:'var(--bg2)', borderRadius:10, padding:'2px 7px' } }, countdownLabel(d))
        ),
        (r.date||r.medecin) && React.createElement('div', { style:{ fontSize:12, color:'var(--text3)', marginBottom:3 } }, [r.date&&fmtFr(r.date), r.medecin].filter(Boolean).join(' · ')),
        r.notes && React.createElement('div', { style:{ fontSize:12, color:'var(--text3)', fontStyle:'italic' } }, r.notes)
      ),
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' } },
        React.createElement('button', { onClick:()=>exportOne(r), title:'Ajouter au calendrier (.ics)', style:{ background:'none', border:'1px solid var(--border)', borderRadius:8, color:'var(--text2)', cursor:'pointer', fontSize:14, padding:'2px 8px' } }, '📅'),
        React.createElement('button', { onClick:()=>del(r.id), style:{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:18 } }, '×')
      )
    );
  };

  return React.createElement('div', null,
    React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, gap:8, flexWrap:'wrap' } },
      React.createElement('h2', { style:{ margin:0, fontSize:20 } }, '🩺 Suivi médical'),
      React.createElement('div', { style:{ display:'flex', gap:8 } },
        (rdvs||[]).some(r => r.date) && React.createElement('button', { onClick:exportAll, title:'Exporter tous les RDV au format .ics', style:{ padding:'8px 14px', borderRadius:20, border:'1px solid var(--border)', background:'transparent', color:'var(--text2)', cursor:'pointer', fontWeight:700, fontSize:13 } }, '📅 Exporter'),
        React.createElement('button', { onClick:()=>setShow(!show), style:{ padding:'8px 18px', borderRadius:20, border:'none', background:'#10b981', color:'#fff', cursor:'pointer', fontWeight:700 } }, show ? '✕' : '+ RDV')
      )
    ),
    prochain && !show && React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid rgba(16,185,129,.35)', borderRadius:'var(--radius)', padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 } },
      React.createElement('span', { style:{ fontSize:24 } }, '⏰'),
      React.createElement('div', null,
        React.createElement('div', { style:{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em' } }, 'Prochain rendez-vous'),
        React.createElement('div', { style:{ fontWeight:700, color:'var(--text)', fontSize:15 } }, countdownLabel(prochain.d) + ' · ' + prochain.r.titre),
        React.createElement('div', { style:{ fontSize:12, color:'var(--text3)' } }, [fmtFr(prochain.r.date), prochain.r.medecin].filter(Boolean).join(' · '))
      )
    ),
    show && React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid rgba(16,185,129,.35)', borderRadius:'var(--radius)', padding:16, marginBottom:16 } },
      React.createElement('input', { placeholder:'Motif / titre *', value:form.titre, onChange:e=>setForm(p=>({...p,titre:e.target.value})), style:{ ...inp, marginBottom:8 } }),
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 } },
        React.createElement('input', { type:'date', value:form.date, onChange:e=>setForm(p=>({...p,date:e.target.value})), style:inp }),
        React.createElement('input', { placeholder:'Médecin / spécialiste', value:form.medecin, onChange:e=>setForm(p=>({...p,medecin:e.target.value})), style:inp })
      ),
      React.createElement('div', { style:{ display:'flex', gap:6, marginBottom:8 } },
        QUIS.map(q => React.createElement('button', { key:q, onClick:()=>setForm(p=>({...p,qui:q})), style:{ padding:'5px 14px', borderRadius:16, border:`1px solid ${form.qui===q?QUI_C[q]:'var(--border)'}`, background:'transparent', color:form.qui===q?QUI_C[q]:'var(--text3)', cursor:'pointer', fontWeight:form.qui===q?700:400, fontSize:12 } }, q))
      ),
      React.createElement('textarea', { placeholder:'Notes / ordonnance...', value:form.notes, onChange:e=>setForm(p=>({...p,notes:e.target.value})), style:{ ...inp, minHeight:60, marginBottom:10, resize:'vertical' } }),
      React.createElement('button', { onClick:add, style:{ padding:'8px 20px', borderRadius:12, border:'none', background:'#10b981', color:'#fff', cursor:'pointer', fontWeight:700 } }, 'Enregistrer')
    ),
    rdvs.length === 0 && !show && React.createElement('div', { style:{ textAlign:'center', padding:'50px 0', color:'var(--text3)' } }, '💊 Aucun suivi — ajoutez vos rendez-vous médicaux'),
    aVenir.length > 0 && React.createElement('div', { style:{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', margin:'4px 0 8px' } }, 'À venir'),
    aVenir.map(x => renderCard(x.r, x.d)),
    passes.length > 0 && React.createElement('div', { style:{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', margin:'16px 0 8px' } }, 'Passés'),
    passes.map(x => renderCard(x.r, x.d))
  );
}

// ─── Horloge + météo Guadeloupe (Open-Meteo, sans clé API) ───
// Code météo WMO → icône + libellé FR.
function wmoInfo(code) {
  const c = Number(code);
  if (c === 0) return { icon: '☀️', label: 'Ensoleillé' };
  if (c === 1) return { icon: '🌤', label: 'Peu nuageux' };
  if (c === 2) return { icon: '⛅', label: 'Partiellement nuageux' };
  if (c === 3) return { icon: '☁️', label: 'Couvert' };
  if (c === 45 || c === 48) return { icon: '🌫', label: 'Brouillard' };
  if (c >= 51 && c <= 57) return { icon: '🌦', label: 'Bruine' };
  if (c >= 61 && c <= 67) return { icon: '🌧', label: 'Pluie' };
  if (c >= 71 && c <= 77) return { icon: '❄️', label: 'Neige' };
  if (c >= 80 && c <= 82) return { icon: '🌦', label: 'Averses' };
  if (c === 85 || c === 86) return { icon: '🌨', label: 'Averses de neige' };
  if (c === 95) return { icon: '⛈', label: 'Orage' };
  if (c === 96 || c === 99) return { icon: '⛈', label: 'Orage + grêle' };
  return { icon: '🌡', label: 'Météo' };
}
function GuadeloupeMeteo() {
  const h = React.createElement;
  const TZ = 'America/Guadeloupe';
  const [now, setNow] = React.useState(() => new Date());
  const [meteo, setMeteo] = React.useState(null); // {temp, code} | 'error' | null (chargement)
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  React.useEffect(() => {
    let alive = true;
    const load = () => {
      fetch('https://api.open-meteo.com/v1/forecast?latitude=16.24&longitude=-61.53&current=temperature_2m,weather_code&timezone=America%2FGuadeloupe')
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(d => { if (alive && d && d.current) setMeteo({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code }); })
        .catch(() => { if (alive) setMeteo('error'); });
    };
    load();
    const iv = setInterval(load, 1800000); // rafraîchit toutes les 30 min
    return () => { alive = false; clearInterval(iv); };
  }, []);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const dateStr = cap(now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ }));
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  const pill = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)' };
  const w = meteo && meteo !== 'error' ? wmoInfo(meteo.code) : null;
  return h('div', { style: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 12 } },
    h('span', { style: pill }, h('span', null, '🗓'), h('span', { style: { fontWeight: 600, color: 'var(--text)' } }, dateStr)),
    h('span', { style: pill }, h('span', null, '🕐'), h('span', { style: { fontFamily: "'Space Mono', monospace", fontWeight: 700, color: 'var(--gold2)' } }, timeStr)),
    w && h('span', { style: pill, title: w.label }, h('span', { style: { fontSize: 15 } }, w.icon), h('span', { style: { fontWeight: 600, color: 'var(--text)' } }, meteo.temp + '°C'), h('span', { style: { color: 'var(--text3)' } }, w.label)),
    meteo === 'error' && h('span', { style: { ...pill, color: 'var(--text3)' } }, '🌡 Météo indisponible')
  );
}

// Almanach lunaire potager (concombre/giraumon) — page statique intégrée via iframe.
const POTAGER_URL = 'kalandriye-lalin-concombre-giraumon.html';
const POTAGER_CATS = [
  { key:'Légume',  icon:'🥬' },
  { key:'Fruit',   icon:'🍅' },
  { key:'Racine',  icon:'🥕' },
  { key:'Aromate', icon:'🌿' },
  { key:'Fleur',   icon:'🌸' },
  { key:'Autre',   icon:'🌱' }
];
const POTAGER_CAT_ICON = POTAGER_CATS.reduce((o, c) => { o[c.key] = c.icon; return o; }, {});
const POTAGER_STADES = ['Semis', 'Croissance', 'Floraison', 'Récolte', 'Terminé'];
const POTAGER_STADE_C = { 'Semis':'#93c5fd', 'Croissance':'#4ade80', 'Floraison':'#f0abfc', 'Récolte':'var(--gold)', 'Terminé':'var(--text3)' };

// ─── Bible du maraîchage guadeloupéen (compagnonnage + saisons) ───
// Données agronomiques adaptées à la Guadeloupe : saison (carême sec ≈ déc→mai /
// hivernage humide ≈ juin→nov, cyclones août–oct), associations, ravageurs, conseil GWA.
// Le compagnonnage relève du savoir agronomique commun (non couvert par la licence de MonPotager).
const POTAGER_BIBLE = [
  { nom:'Tomate', emoji:'🍅', famille:'Solanacées', saison:'Carême (sec)', cycle:'3–4 mois', bons:['Basilic','Œillet d\'Inde','Persil','Cive','Carotte','Laitue','Ail'], eviter:['Concombre','Chou','Pomme de terre','Fenouil'], ravageurs:'Aleurodes, mildiou (hivernage), nématodes', conseil:'Planter au carême : l\'hivernage humide favorise le mildiou. Tuteurer et pailler le pied.' },
  { nom:'Concombre', emoji:'🥒', famille:'Cucurbitacées', saison:'Carême (sec)', cycle:'2–3 mois', bons:['Maïs','Haricot','Laitue','Radis','Capucine'], eviter:['Tomate (sous abri)','Pomme de terre','Sauge'], ravageurs:'Oïdium, mildiou, mouche des cucurbitacées', conseil:'Grande fenêtre au carême sec. Palisser pour aérer le feuillage, arroser au pied.' },
  { nom:'Giraumon', emoji:'🎃', famille:'Cucurbitacées', saison:'Hivernage / toute l\'année', cycle:'3–5 mois', bons:['Maïs','Haricot','Capucine'], eviter:['Pomme de terre','Concombre'], ravageurs:'Oïdium, mouche des cucurbitacées', conseil:'Rustique, idéal en hivernage. Laisser courir au sol : prévoir de la place.' },
  { nom:'Christophine', emoji:'🥭', famille:'Cucurbitacées', saison:'Toute l\'année', cycle:'Vivace grimpante', bons:['Maïs','Haricot'], eviter:[], ravageurs:'Limaces sur jeunes plants', conseil:'Le fruit entier germé se met en terre. Très vigoureuse → treillage solide, isoler.' },
  { nom:'Gombo', emoji:'🫛', famille:'Malvacées', saison:'Hivernage (chaud/humide)', cycle:'2–3 mois', bons:['Basilic','Piment','Poivron','Melon','Concombre'], eviter:[], ravageurs:'Pucerons, aleurodes', conseil:'Aime chaleur et humidité de l\'hivernage. Récolter jeune, tous les 2–3 jours.' },
  { nom:'Piment', emoji:'🌶️', famille:'Solanacées', saison:'Toute l\'année', cycle:'4–6 mois', bons:['Basilic','Carotte','Oignon','Tomate'], eviter:['Haricot','Fenouil'], ravageurs:'Pucerons, aleurodes, thrips', conseil:'Vivace sous les tropiques : peut produire plusieurs années. Plein soleil.' },
  { nom:'Aubergine', emoji:'🍆', famille:'Solanacées', saison:'Carême → début hivernage', cycle:'3–4 mois', bons:['Haricot','Poivron','Thym','Estragon'], eviter:['Pomme de terre'], ravageurs:'Aleurodes, araignées rouges', conseil:'Aime la chaleur. Tuteurer, pailler pour garder la fraîcheur du sol.' },
  { nom:'Laitue', emoji:'🥬', famille:'Astéracées', saison:'Carême (périodes fraîches)', cycle:'1,5–2 mois', bons:['Carotte','Radis','Concombre','Fraise','Cive'], eviter:['Persil','Tournesol'], ravageurs:'Limaces, pucerons, montaison à la chaleur', conseil:'Préférer la mi-ombre : monte vite en graine à la chaleur. Semis échelonnés.' },
  { nom:'Chou', emoji:'🥦', famille:'Brassicacées', saison:'Carême (sec)', cycle:'2–3 mois', bons:['Haricot','Betterave','Thym','Menthe','Céleri'], eviter:['Tomate','Fraise','Oignon','Ail'], ravageurs:'Chenilles (piéride), altises, pucerons cendrés', conseil:'Filet anti-insectes utile. Aromatiques autour pour brouiller les ravageurs.' },
  { nom:'Carotte', emoji:'🥕', famille:'Apiacées', saison:'Carême (sec)', cycle:'2,5–3 mois', bons:['Oignon','Cive','Poireau','Radis','Laitue','Tomate'], eviter:['Aneth','Persil'], ravageurs:'Mouche de la carotte', conseil:'Sol meuble sans cailloux. L\'oignon/cive à côté éloigne la mouche.' },
  { nom:'Radis', emoji:'🌱', famille:'Brassicacées', saison:'Carême (sec)', cycle:'~1 mois', bons:['Carotte','Laitue','Concombre','Haricot'], eviter:[], ravageurs:'Altises', conseil:'Culture express (~4 semaines). Sème entre carotte et laitue pour occuper l\'espace.' },
  { nom:'Haricot', emoji:'🫘', famille:'Fabacées', saison:'Carême → hivernage', cycle:'2–3 mois', bons:['Maïs','Concombre','Carotte','Laitue','Chou','Giraumon'], eviter:['Ail','Oignon','Cive','Poireau'], ravageurs:'Pucerons, mouche des semis', conseil:'Fixe l\'azote → enrichit le sol pour les voisins. Éviter les alliacées (ail, oignon).' },
  { nom:'Pois d\'Angole', emoji:'🌾', famille:'Fabacées', saison:'Hivernage', cycle:'6–8 mois', bons:['Maïs','Tubercules'], eviter:[], ravageurs:'Pucerons', conseil:'Arbuste fixateur d\'azote : brise-vent et ombrage léger pour le jardin créole.' },
  { nom:'Maïs', emoji:'🌽', famille:'Poacées', saison:'Hivernage (pluies)', cycle:'3–4 mois', bons:['Haricot','Giraumon','Concombre'], eviter:['Tomate','Céleri'], ravageurs:'Chenille légionnaire, foreurs de tige', conseil:'Trio créole maïs-haricot-giraumon : le maïs tuteure, le haricot nourrit, la courge couvre le sol.' },
  { nom:'Patate douce', emoji:'🍠', famille:'Convolvulacées', saison:'Plant en hivernage', cycle:'4–5 mois', bons:['Maïs','Tubercules'], eviter:[], ravageurs:'Charançon de la patate douce', conseil:'Se plante en boutures de tige. Couvre-sol qui étouffe les adventices.' },
  { nom:'Igname', emoji:'🥔', famille:'Dioscoréacées', saison:'Plant au carême', cycle:'8–10 mois', bons:['Dachine','Maïs'], eviter:[], ravageurs:'Cochenilles, nématodes', conseil:'Cycle long (8–10 mois). Tuteurer la liane. Base du jardin créole étagé.' },
  { nom:'Dachine (Madère)', emoji:'🍃', famille:'Aracées', saison:'Hivernage (aime l\'eau)', cycle:'6–9 mois', bons:['Igname','Banane'], eviter:[], ravageurs:'Pucerons, mildiou du taro', conseil:'Aime les sols humides / bords d\'eau. Les feuilles font le calalou.' },
  { nom:'Manioc', emoji:'🌳', famille:'Euphorbiacées', saison:'Toute l\'année', cycle:'8–12 mois', bons:['Maïs','Haricot'], eviter:[], ravageurs:'Cochenille farineuse, acariens', conseil:'Boutures de tige. Très rustique, tolère la sécheresse. Privilégier les variétés douces.' },
  { nom:'Cive (oignon-pays)', emoji:'🧅', famille:'Alliacées', saison:'Toute l\'année', cycle:'Repousse à la coupe', bons:['Carotte','Tomate','Laitue','Betterave','Fraise'], eviter:['Haricot','Pois'], ravageurs:'Thrips, mildiou de l\'oignon', conseil:'Repousse après chaque coupe. Éloigne la mouche de la carotte. Indispensable en cuisine créole.' },
  { nom:'Ail', emoji:'🧄', famille:'Alliacées', saison:'Carême (sec)', cycle:'4–5 mois', bons:['Tomate','Carotte','Laitue','Fraise'], eviter:['Haricot','Pois','Chou'], ravageurs:'Rouille', conseil:'Répulsif naturel (pucerons, acariens). À éloigner des légumineuses.' },
  { nom:'Basilic', emoji:'🌿', famille:'Lamiacées', saison:'Toute l\'année', cycle:'Continu', bons:['Tomate','Poivron','Piment','Aubergine','Gombo'], eviter:['Rue'], ravageurs:'Pucerons, limaces', conseil:'Protège la tomate (aleurodes) et en relève le goût. Pincer les fleurs pour prolonger.' },
  { nom:'Thym-pays', emoji:'🪴', famille:'Lamiacées', saison:'Toute l\'année', cycle:'Vivace', bons:['Chou','Aubergine','Tomate'], eviter:[], ravageurs:'Peu sensible', conseil:'Aromatique répulsive : borde les planches. Résiste très bien à la sécheresse.' },
  { nom:'Melon', emoji:'🍈', famille:'Cucurbitacées', saison:'Carême (sec, sucré)', cycle:'~3 mois', bons:['Maïs','Haricot','Capucine'], eviter:['Concombre','Giraumon'], ravageurs:'Oïdium, mouche des cucurbitacées', conseil:'La chaleur sèche du carême concentre le sucre. Pailler sous les fruits.' }
];
const normPot = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// Retrouve la fiche bible correspondant au nom d'une plante (ex. « Tomate cerise » → Tomate).
function findBible(nom) {
  const n = normPot(nom);
  if (!n) return null;
  return POTAGER_BIBLE.find(b => { const k = normPot(b.nom.replace(/\s*\(.*\)/, '')); return n.indexOf(k) !== -1 || k.indexOf(n) !== -1; }) || null;
}

function PlanteForm({ onSave, onCancel }) {
  const h = React.createElement;
  const [form, setForm] = React.useState({ nom:'', variete:'', categorie:'Légume', datePlantation:'', stade:'Semis', arrosage:'', notes:'' });
  const inp = { background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:13, width:'100%', boxSizing:'border-box' };
  const save = () => { if (!form.nom.trim()) return; onSave({ id:Date.now().toString(), ...form }); };
  return h('div', { style:{ background:'var(--glass)', border:'1px solid rgba(16,185,129,.35)', borderRadius:'var(--radius)', padding:16, marginBottom:16 } },
    h('input', { placeholder:'Nom de la plante * (ex : Tomate, Concombre)', value:form.nom, onChange:e=>setForm(p=>({...p,nom:e.target.value})), style:{ ...inp, marginBottom:8 } }),
    h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 } },
      h('input', { placeholder:'Variété (ex : cœur de bœuf)', value:form.variete, onChange:e=>setForm(p=>({...p,variete:e.target.value})), style:inp }),
      h('input', { placeholder:'Arrosage (ex : 2×/sem)', value:form.arrosage, onChange:e=>setForm(p=>({...p,arrosage:e.target.value})), style:inp })
    ),
    h('div', { style:{ fontSize:11, color:'var(--text3)', margin:'4px 0 6px' } }, 'Catégorie'),
    h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 } },
      POTAGER_CATS.map(c => h('button', { key:c.key, onClick:()=>setForm(p=>({...p,categorie:c.key})), style:{ padding:'5px 12px', borderRadius:16, border:`1px solid ${form.categorie===c.key?'var(--gold)':'var(--border)'}`, background:'transparent', color:form.categorie===c.key?'var(--gold)':'var(--text3)', cursor:'pointer', fontWeight:form.categorie===c.key?700:400, fontSize:12 } }, c.icon + ' ' + c.key))
    ),
    h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8, alignItems:'center' } },
      h('label', { style:{ fontSize:11, color:'var(--text3)' } }, 'Planté le', h('input', { type:'date', value:form.datePlantation, onChange:e=>setForm(p=>({...p,datePlantation:e.target.value})), style:{ ...inp, marginTop:3 } })),
      h('label', { style:{ fontSize:11, color:'var(--text3)' } }, 'Stade', h('select', { value:form.stade, onChange:e=>setForm(p=>({...p,stade:e.target.value})), style:{ ...inp, marginTop:3 } }, POTAGER_STADES.map(s => h('option', { key:s, value:s }, s))))
    ),
    h('textarea', { placeholder:'Notes (emplacement, engrais, observations…)', value:form.notes, onChange:e=>setForm(p=>({...p,notes:e.target.value})), style:{ ...inp, minHeight:56, marginBottom:10, resize:'vertical' } }),
    h('div', { style:{ display:'flex', gap:8 } },
      h('button', { onClick:save, style:{ padding:'8px 20px', borderRadius:12, border:'none', background:'#10b981', color:'#fff', cursor:'pointer', fontWeight:700 } }, 'Enregistrer'),
      h('button', { onClick:onCancel, style:{ padding:'8px 16px', borderRadius:12, border:'1px solid var(--border)', background:'transparent', color:'var(--text3)', cursor:'pointer' } }, 'Annuler')
    )
  );
}

function PotagerView({ plantes, addPlante, updatePlante, deletePlante }) {
  const h = React.createElement;
  const [tab, setTab] = React.useState('plantes');
  const [show, setShow] = React.useState(false);
  const [filtre, setFiltre] = React.useState('encours'); // encours | tous
  const [bibleOpen, setBibleOpen] = React.useState(null); // nom de la fiche ouverte
  const [q, setQ] = React.useState('');

  const joursDepuis = iso => {
    if (!iso) return null;
    const d = new Date(String(iso).slice(0,10) + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    const t = new Date(); t.setHours(0,0,0,0);
    return Math.max(0, Math.round((t.getTime() - d.getTime()) / 86400000));
  };
  const list = plantes || [];
  const enRecolte = list.filter(p => p.stade === 'Récolte').length;
  const actives = list.filter(p => p.stade !== 'Terminé').length;
  const shown = filtre === 'encours' ? list.filter(p => p.stade !== 'Terminé') : list;

  const tabBtn = (id, label) => h('button', { key:id, onClick:()=>setTab(id), style:{ padding:'7px 16px', borderRadius:18, border:`1px solid ${tab===id?'#10b981':'var(--border)'}`, background:tab===id?'rgba(16,185,129,.15)':'transparent', color:tab===id?'#10b981':'var(--text3)', cursor:'pointer', fontWeight:700, fontSize:13 } }, label);

  const carte = p => {
    const j = joursDepuis(p.datePlantation);
    const idx = POTAGER_STADES.indexOf(p.stade);
    return h('div', { key:p.id, style:{ background:'var(--glass)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 16px', marginBottom:10, opacity:p.stade==='Terminé'?.6:1 } },
      h('div', { style:{ display:'flex', gap:12, alignItems:'flex-start' } },
        h('div', { style:{ fontSize:26, lineHeight:1 } }, POTAGER_CAT_ICON[p.categorie] || '🌱'),
        h('div', { style:{ flex:1, minWidth:0 } },
          h('div', { style:{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 } },
            h('span', { style:{ fontWeight:700, color:'var(--text)', fontSize:15 } }, p.nom),
            p.variete && h('span', { style:{ fontSize:12, color:'var(--text3)', fontStyle:'italic' } }, p.variete)
          ),
          h('div', { style:{ fontSize:12, color:'var(--text3)', marginBottom:6 } },
            [ j!=null && ('🌱 planté il y a ' + j + ' j'), p.arrosage && ('💧 ' + p.arrosage) ].filter(Boolean).join('  ·  ') || 'Pas de date de plantation'
          ),
          h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap', marginBottom: (p.notes||findBible(p.nom))?8:0 } },
            POTAGER_STADES.map((s, i) => h('button', { key:s, onClick:()=>updatePlante(p.id, { stade:s }), title:'Marquer : '+s, style:{ padding:'3px 10px', borderRadius:12, border:`1px solid ${p.stade===s?POTAGER_STADE_C[s]:'var(--border)'}`, background:p.stade===s?POTAGER_STADE_C[s]+'22':'transparent', color:p.stade===s?POTAGER_STADE_C[s]:(i<=idx?'var(--text2)':'var(--text3)'), cursor:'pointer', fontSize:11, fontWeight:p.stade===s?700:400 } }, s))
          ),
          (() => { const b = findBible(p.nom); return b && h('div', { style:{ fontSize:11, color:'var(--text3)', marginBottom: p.notes?8:0, cursor:'pointer' }, onClick:()=>{ setTab('bible'); setBibleOpen(b.nom); } },
            b.bons.length ? h('span', null, '🤝 ', h('span', { style:{ color:'#4ade80' } }, b.bons.slice(0,4).join(', '))) : null,
            b.eviter.length ? h('span', null, '   ⛔ ', h('span', { style:{ color:'#f87171' } }, b.eviter.slice(0,3).join(', '))) : null
          ); })(),
          p.notes && h('div', { style:{ fontSize:12, color:'var(--text3)', fontStyle:'italic' } }, p.notes)
        ),
        h('button', { onClick:()=>{ if (confirm('Supprimer « '+p.nom+' » ?')) deletePlante(p.id); }, style:{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:18 } }, '×')
      )
    );
  };

  return h('div', null,
    h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, gap:8, flexWrap:'wrap' } },
      h('h2', { style:{ margin:0, fontSize:20 } }, '🌱 Potager GWA'),
      tab === 'plantes' && h('button', { onClick:()=>setShow(!show), style:{ padding:'8px 18px', borderRadius:20, border:'none', background:'#10b981', color:'#fff', cursor:'pointer', fontWeight:700 } }, show ? '✕' : '+ Plante')
    ),
    h('div', { style:{ display:'flex', gap:8, marginBottom:16 } },
      tabBtn('plantes', '🌱 Mes plantes' + (list.length ? ' ('+list.length+')' : '')),
      tabBtn('bible', '🪴 Bible'),
      tabBtn('almanach', '🌙 Almanach')
    ),

    tab === 'plantes' && h('div', null,
      show && h(PlanteForm, { onSave:p=>{ addPlante(p); setShow(false); }, onCancel:()=>setShow(false) }),
      list.length > 0 && h('div', { style:{ display:'flex', gap:14, marginBottom:12, fontSize:12, color:'var(--text3)', flexWrap:'wrap' } },
        h('span', null, '🌿 ' + actives + ' en culture'),
        enRecolte > 0 && h('span', { style:{ color:'var(--gold)', fontWeight:700 } }, '🧺 ' + enRecolte + ' à récolter'),
        h('span', { style:{ marginLeft:'auto', display:'flex', gap:6 } },
          ['encours','tous'].map(f => h('button', { key:f, onClick:()=>setFiltre(f), style:{ padding:'2px 10px', borderRadius:12, border:`1px solid ${filtre===f?'#10b981':'var(--border)'}`, background:'transparent', color:filtre===f?'#10b981':'var(--text3)', cursor:'pointer', fontSize:11, fontWeight:filtre===f?700:400 } }, f==='encours'?'En cours':'Tous'))
        )
      ),
      shown.length === 0 && !show && h('div', { style:{ textAlign:'center', padding:'50px 0', color:'var(--text3)' } },
        list.length === 0 ? '🌱 Aucune plante — ajoutez votre première culture !' : 'Aucune plante dans ce filtre.'),
      shown.map(carte)
    ),

    tab === 'bible' && (() => {
      const chip = (txt, col) => h('span', { key:txt, style:{ fontSize:11, padding:'2px 8px', borderRadius:10, background:col+'22', color:col, border:'1px solid '+col+'55' } }, txt);
      const fiche = b => h('div', { style:{ background:'var(--glass)', border:'1px solid var(--gold-border)', borderRadius:'var(--radius)', padding:16, marginBottom:14 } },
        h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:10 } },
          h('span', { style:{ fontSize:30 } }, b.emoji),
          h('div', { style:{ flex:1, minWidth:0 } },
            h('div', { style:{ fontWeight:700, fontSize:17, color:'var(--text)' } }, b.nom),
            h('div', { style:{ fontSize:12, color:'var(--text3)' } }, b.famille)
          ),
          h('button', { onClick:()=>setBibleOpen(null), style:{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:20 } }, '×')
        ),
        h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 } }, chip('📅 ' + b.saison, 'var(--gold)'), chip('⏳ ' + b.cycle, 'var(--text2)')),
        b.bons.length > 0 && h('div', { style:{ marginBottom:8 } },
          h('div', { style:{ fontSize:11, fontWeight:700, color:'#4ade80', marginBottom:5 } }, '🤝 Bons voisins'),
          h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap' } }, b.bons.map(v => chip(v, '#4ade80')))
        ),
        b.eviter.length > 0 && h('div', { style:{ marginBottom:8 } },
          h('div', { style:{ fontSize:11, fontWeight:700, color:'#f87171', marginBottom:5 } }, '⛔ À éviter à côté'),
          h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap' } }, b.eviter.map(v => chip(v, '#f87171')))
        ),
        h('div', { style:{ fontSize:12, color:'var(--text2)', marginBottom:6 } }, h('span', { style:{ color:'var(--text3)' } }, '🐛 Ravageurs : '), b.ravageurs),
        h('div', { style:{ fontSize:12, color:'var(--text2)', background:'var(--bg2)', borderRadius:8, padding:'8px 10px' } }, h('span', { style:{ color:'var(--gold)' } }, '💡 '), b.conseil)
      );
      const nq = normPot(q);
      const liste = POTAGER_BIBLE.filter(b => !nq || normPot(b.nom).indexOf(nq) !== -1 || normPot(b.famille).indexOf(nq) !== -1);
      const ouverte = POTAGER_BIBLE.find(b => b.nom === bibleOpen);
      return h('div', null,
        h('div', { style:{ fontSize:12, color:'var(--text3)', marginBottom:10 } }, 'Touche un pot 🪴 pour la fiche : saison (carême/hivernage), bons & mauvais voisins, ravageurs, conseil — adapté à la Guadeloupe.'),
        h('input', { placeholder:'🔎 Chercher (nom, famille…)', value:q, onChange:e=>setQ(e.target.value), style:{ background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:13, width:'100%', boxSizing:'border-box', marginBottom:14 } }),
        ouverte && fiche(ouverte),
        h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(92px, 1fr))', gap:10 } },
          liste.map(b => h('button', { key:b.nom, onClick:()=>setBibleOpen(bibleOpen===b.nom?null:b.nom), title:b.nom,
            style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'12px 6px 8px', borderRadius:14, cursor:'pointer',
              border:`1px solid ${bibleOpen===b.nom?'var(--gold)':'var(--border)'}`,
              background:bibleOpen===b.nom?'var(--gold-bg)':'linear-gradient(180deg, transparent 55%, rgba(120,72,40,.22) 55%)' } },
            h('span', { style:{ fontSize:30, lineHeight:1 } }, b.emoji),
            h('span', { style:{ fontSize:11, fontWeight:700, color:'var(--text2)', textAlign:'center', lineHeight:1.15 } }, b.nom)
          ))
        ),
        liste.length === 0 && h('div', { style:{ textAlign:'center', padding:'30px 0', color:'var(--text3)' } }, 'Aucune plante trouvée.')
      );
    })(),

    tab === 'almanach' && h('div', null,
      h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, gap:8, flexWrap:'wrap' } },
        h('div', { style:{ fontSize:12, color:'var(--text3)' } }, 'Concombre & giraumon calés sur le carême, l\'hivernage et la lune.'),
        h('a', { href:POTAGER_URL, target:'_blank', rel:'noopener', style:{ padding:'6px 12px', borderRadius:16, border:'1px solid var(--border)', background:'transparent', color:'var(--text2)', cursor:'pointer', fontWeight:700, fontSize:12, textDecoration:'none', whiteSpace:'nowrap' } }, '↗ Plein écran')
      ),
      h('iframe', {
        src: POTAGER_URL,
        title: 'Almanach potager Guadeloupe',
        loading: 'lazy',
        style:{ width:'100%', height:'calc(100vh - 260px)', minHeight:480, border:'1px solid var(--border)', borderRadius:'var(--radius)', background:'#0b1a12', display:'block' }
      })
    )
  );
}

function VoyagesView() {
  const [voyages, setVoyages] = React.useState(() => { try { return JSON.parse(localStorage.getItem('ld-voyages')||'[]'); } catch { return []; } });
  const [form, setForm] = React.useState({ dest:'', periode:'', budget:'', notes:'', statut:'Rêve' });
  const [show, setShow] = React.useState(false);
  const STATUTS = ['Rêve','Planifié','Réservé','Fait ✓'];
  const STAT_C = { 'Rêve':'var(--accent-dja)', 'Planifié':'var(--gold)', 'Réservé':'var(--accent-liika)', 'Fait ✓':'var(--success)' };
  const save = l => { setVoyages(l); localStorage.setItem('ld-voyages', JSON.stringify(l)); };
  const add = () => { if (!form.dest.trim()) return; save([{ id:Date.now().toString(), ...form }, ...voyages]); setForm({ dest:'', periode:'', budget:'', notes:'', statut:'Rêve' }); setShow(false); };
  const del = id => save(voyages.filter(v => v.id !== id));
  const upd = (id, statut) => save(voyages.map(v => v.id===id ? { ...v, statut } : v));
  const inp = { background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:13, width:'100%', boxSizing:'border-box' };
  return React.createElement('div', null,
    React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 } },
      React.createElement('h2', { style:{ margin:0, fontSize:20 } }, '✈️ Voyages & Destinations'),
      React.createElement('button', { onClick:()=>setShow(!show), style:{ padding:'8px 18px', borderRadius:20, border:'none', background:'#10b981', color:'#fff', cursor:'pointer', fontWeight:700 } }, show ? '✕' : '+ Voyage')
    ),
    show && React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid rgba(16,185,129,.35)', borderRadius:'var(--radius)', padding:16, marginBottom:16 } },
      React.createElement('input', { placeholder:'Destination *', value:form.dest, onChange:e=>setForm(p=>({...p,dest:e.target.value})), style:{ ...inp, marginBottom:8 } }),
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 } },
        React.createElement('input', { placeholder:'Période (ex: été 2026)', value:form.periode, onChange:e=>setForm(p=>({...p,periode:e.target.value})), style:inp }),
        React.createElement('input', { placeholder:'Budget estimé', value:form.budget, onChange:e=>setForm(p=>({...p,budget:e.target.value})), style:inp })
      ),
      React.createElement('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 } },
        STATUTS.map(s => React.createElement('button', { key:s, onClick:()=>setForm(p=>({...p,statut:s})), style:{ padding:'4px 12px', borderRadius:16, border:`1px solid ${form.statut===s?STAT_C[s]:'var(--border)'}`, background:'transparent', color:form.statut===s?STAT_C[s]:'var(--text3)', cursor:'pointer', fontWeight:form.statut===s?700:400, fontSize:12 } }, s))
      ),
      React.createElement('textarea', { placeholder:"Notes, idées d'activités...", value:form.notes, onChange:e=>setForm(p=>({...p,notes:e.target.value})), style:{ ...inp, minHeight:60, marginBottom:10, resize:'vertical' } }),
      React.createElement('button', { onClick:add, style:{ padding:'8px 20px', borderRadius:12, border:'none', background:'#10b981', color:'#fff', cursor:'pointer', fontWeight:700 } }, 'Enregistrer')
    ),
    voyages.length === 0 && !show && React.createElement('div', { style:{ textAlign:'center', padding:'50px 0', color:'var(--text3)' } }, '🌍 Ajoutez vos destinations de rêve !'),
    voyages.map(v => React.createElement('div', { key:v.id, style:{ background:'var(--glass)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 16px', marginBottom:10, display:'flex', gap:12, alignItems:'flex-start' } },
      React.createElement('div', { style:{ flex:1 } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:6 } },
          React.createElement('span', { style:{ fontSize:22 } }, '✈️'),
          React.createElement('span', { style:{ fontWeight:700, color:'var(--text)', fontSize:15 } }, v.dest)
        ),
        (v.periode||v.budget) && React.createElement('div', { style:{ fontSize:12, color:'var(--text3)', marginBottom:4 } }, [v.periode, v.budget&&'Budget : '+v.budget].filter(Boolean).join(' · ')),
        v.notes && React.createElement('div', { style:{ fontSize:12, color:'var(--text3)', fontStyle:'italic', marginBottom:8 } }, v.notes),
        React.createElement('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
          STATUTS.map(s => React.createElement('button', { key:s, onClick:()=>upd(v.id,s), style:{ padding:'3px 10px', borderRadius:12, border:`1px solid ${v.statut===s?STAT_C[s]:'var(--border)'}`, background:v.statut===s?STAT_C[s]+'22':'transparent', color:v.statut===s?STAT_C[s]:'var(--text3)', cursor:'pointer', fontSize:11, fontWeight:v.statut===s?700:400 } }, s))
        )
      ),
      React.createElement('button', { onClick:()=>del(v.id), style:{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:18 } }, '×')
    ))
  );
}

function ArtView() {
  const [projets, setProjets] = React.useState(() => { try { return JSON.parse(localStorage.getItem('ld-artiste')||'[]'); } catch { return []; } });
  const [form, setForm] = React.useState({ titre:'', type:'Musique', statut:'En cours', desc:'' });
  const [show, setShow] = React.useState(false);
  const TYPES = ['Musique','Visuel','Vidéo','Texte','Collab','Autre'];
  const STATUTS = ['Idée','En cours','Terminé','Publié 🎉'];
  const STAT_C = { 'Idée':'var(--text3)', 'En cours':'var(--gold)', 'Terminé':'var(--accent-liika)', 'Publié 🎉':'var(--success)' };
  const save = l => { setProjets(l); localStorage.setItem('ld-artiste', JSON.stringify(l)); };
  const add = () => { if (!form.titre.trim()) return; save([{ id:Date.now().toString(), date:new Date().toISOString().slice(0,10), ...form }, ...projets]); setForm({ titre:'', type:'Musique', statut:'En cours', desc:'' }); setShow(false); };
  const del = id => save(projets.filter(p => p.id !== id));
  const upd = (id, statut) => save(projets.map(p => p.id===id ? { ...p, statut } : p));
  const inp = { background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:13, width:'100%', boxSizing:'border-box' };
  return React.createElement('div', null,
    React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 } },
      React.createElement('h2', { style:{ margin:0, fontSize:20 } }, '🎨 Art & Projets — Negus Dja'),
      React.createElement('button', { onClick:()=>setShow(!show), style:{ padding:'8px 18px', borderRadius:20, border:'none', background:'var(--accent-dja)', color:'#fff', cursor:'pointer', fontWeight:700 } }, show ? '✕' : '+ Projet')
    ),
    show && React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--accent-dja-border)', borderRadius:'var(--radius)', padding:16, marginBottom:16 } },
      React.createElement('input', { placeholder:'Titre du projet *', value:form.titre, onChange:e=>setForm(p=>({...p,titre:e.target.value})), style:{ ...inp, marginBottom:8 } }),
      React.createElement('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 } },
        TYPES.map(t => React.createElement('button', { key:t, onClick:()=>setForm(p=>({...p,type:t})), style:{ padding:'4px 10px', borderRadius:12, border:`1px solid ${form.type===t?'var(--accent-dja)':'var(--border)'}`, background:'transparent', color:form.type===t?'var(--accent-dja)':'var(--text3)', cursor:'pointer', fontSize:12, fontWeight:form.type===t?700:400 } }, t))
      ),
      React.createElement('textarea', { placeholder:'Description, notes, liens...', value:form.desc, onChange:e=>setForm(p=>({...p,desc:e.target.value})), style:{ ...inp, minHeight:70, marginBottom:10, resize:'vertical' } }),
      React.createElement('button', { onClick:add, style:{ padding:'8px 20px', borderRadius:12, border:'none', background:'var(--accent-dja)', color:'#fff', cursor:'pointer', fontWeight:700 } }, 'Créer')
    ),
    projets.length === 0 && !show && React.createElement('div', { style:{ textAlign:'center', padding:'50px 0', color:'var(--text3)' } }, '🎭 Vos projets artistiques s\'afficheront ici'),
    projets.map(p => React.createElement('div', { key:p.id, style:{ background:'var(--glass)', border:'1px solid var(--accent-dja-border)', borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:10, display:'flex', gap:12, alignItems:'flex-start' } },
      React.createElement('div', { style:{ flex:1 } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8, marginBottom:6 } },
          React.createElement('span', { style:{ fontSize:11, fontWeight:700, color:'var(--accent-dja)', background:'var(--accent-dja-bg)', borderRadius:8, padding:'2px 8px' } }, p.type),
          React.createElement('span', { style:{ fontWeight:700, color:'var(--text)', fontSize:14 } }, p.titre)
        ),
        p.desc && React.createElement('div', { style:{ fontSize:12, color:'var(--text3)', lineHeight:1.5, marginBottom:8 } }, p.desc),
        React.createElement('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
          STATUTS.map(s => React.createElement('button', { key:s, onClick:()=>upd(p.id,s), style:{ padding:'3px 10px', borderRadius:12, border:`1px solid ${p.statut===s?STAT_C[s]:'var(--border)'}`, background:p.statut===s?STAT_C[s]+'22':'transparent', color:p.statut===s?STAT_C[s]:'var(--text3)', cursor:'pointer', fontSize:11, fontWeight:p.statut===s?700:400 } }, s))
        )
      ),
      React.createElement('button', { onClick:()=>del(p.id), style:{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:18 } }, '×')
    ))
  );
}

function CodeRousseauView({ codeRousseau, updateCodeRousseau }) {
  const cr = codeRousseau || { eleves: [], fiches: [], notes: '' };
  const [tab, setTab] = React.useState('referentiel');
  const [expandDom, setExpandDom] = React.useState({});
  const [expandFiche, setExpandFiche] = React.useState({});
  const [expandSec, setExpandSec] = React.useState({});
  const [expandLoi, setExpandLoi] = React.useState({});
  const [expandEdpm, setExpandEdpm] = React.useState({});
  const [rsmaTab, setRsmaTab] = React.useState('contexte'); // contexte | correlations | edpms
  const [expandCorr, setExpandCorr] = React.useState({});
  const [plTab, setPlTab] = React.useState('referentiel'); // referentiel | reglementation | remc
  const [expandPl, setExpandPl] = React.useState({});
  const [edpmsEleveId, setEdpmsEleveId] = React.useState('');
  const [edpmsStep, setEdpmsStep] = React.useState('guide'); // guide | entretien | grille | synthese
  const [showAddEleve, setShowAddEleve] = React.useState(false);
  const [eleveName, setEleveName] = React.useState('');
  const [elevePerm, setElevePerm] = React.useState('B');
  const [selectedEleveId, setSelectedEleveId] = React.useState(null);
  const [showAddFiche, setShowAddFiche] = React.useState(false);
  const [ficheTheme, setFicheTheme] = React.useState('');
  const [ficheObj, setFicheObj] = React.useState('');
  const [ficheBilan, setFicheBilan] = React.useState('');

  const addEleve = () => {
    if (!eleveName.trim()) return;
    const next = [...(cr.eleves || []), {
      id: Date.now().toString(), nom: eleveName.trim(), niveau: elevePerm,
      dateDebut: new Date().toISOString().slice(0, 10), notes: '', progression: {}
    }];
    updateCodeRousseau({ eleves: next });
    setEleveName(''); setElevePerm('B'); setShowAddEleve(false);
  };
  const deleteEleve = id => {
    if (!window.confirm('Supprimer cet élève ?')) return;
    updateCodeRousseau({ eleves: (cr.eleves || []).filter(e => e.id !== id) });
    if (selectedEleveId === id) setSelectedEleveId(null);
  };
  const setNiveau = (eleveId, compId, niv) => {
    const next = (cr.eleves || []).map(e => e.id !== eleveId ? e :
      { ...e, progression: { ...e.progression, [compId]: niv } });
    updateCodeRousseau({ eleves: next });
  };
  const addFiche = () => {
    if (!ficheTheme.trim()) return;
    const next = [...(cr.fiches || []), {
      id: Date.now().toString(), date: new Date().toISOString().slice(0, 10),
      theme: ficheTheme.trim(), objectif: ficheObj.trim(), bilan: ficheBilan.trim()
    }];
    updateCodeRousseau({ fiches: next });
    setFicheTheme(''); setFicheObj(''); setFicheBilan(''); setShowAddFiche(false);
  };
  const deleteFiche = id => updateCodeRousseau({ fiches: (cr.fiches || []).filter(f => f.id !== id) });

  const selectedEleve = selectedEleveId ? (cr.eleves || []).find(e => e.id === selectedEleveId) : null;
  const TABS = [
    { id: 'referentiel', label: '📋 Référentiel' },
    { id: 'revision',    label: '📚 Révision (9)' },
    { id: 'securite',    label: '🛡 Sécurité (8)' },
    { id: 'loi',         label: '⚖️ Loi (6)' },
    { id: 'edpm',        label: '🛴 EDPM (5)' },
    { id: 'pl',          label: '🚛 Permis PL' },
    { id: 'rsma',        label: '🎖️ RSMA' },
    { id: 'edpms',       label: '📊 EDPMS' },
    { id: 'eleves',      label: `👥 Élèves (${(cr.eleves||[]).length})` },
    { id: 'fiches',      label: `📝 Fiches (${(cr.fiches||[]).length})` },
    { id: 'notes',       label: '✏️ Notes' },
  ];
  const cardStyle = { background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:'16px', marginBottom:12 };
  const btnStyle = (active) => ({
    padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:13,
    background: active ? 'var(--accent-liika)' : 'var(--glass)',
    color: active ? '#fff' : 'var(--text)', transition:'background .2s'
  });

  return React.createElement('div', null,
    // En-tête
    React.createElement('div', { style:{ ...cardStyle, background:'var(--grad-hero)', marginBottom:20 } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:12 } },
        React.createElement('span', { style:{ fontSize:28 } }, '🎓'),
        React.createElement('div', null,
          React.createElement('h2', { style:{ margin:0, color:'var(--accent-liika)', fontSize:18 } }, 'Guide Monitrice — REMC & Permis PL'),
          React.createElement('p', { style:{ margin:0, fontSize:13, color:'var(--text-muted)' } }, 'VT · RSMA Guadeloupe · Monitrice Poids Lourd (C/CE) ◇ Purple Moon')
        )
      )
    ),
    // Tabs
    React.createElement('div', { style:{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 } },
      TABS.map(t => React.createElement('button', { key:t.id, style:btnStyle(tab===t.id), onClick:()=>setTab(t.id) }, t.label))
    ),

    // ── TAB : Référentiel ──
    tab === 'referentiel' && React.createElement('div', null,
      React.createElement('div', { style:cardStyle },
        React.createElement('h3', { style:{ margin:'0 0 8px', fontSize:14, color:'var(--gold)' } }, '⚙️ Méthode pédagogique — 3 étapes REMC'),
        REMC_ETAPES.map(e => React.createElement('div', { key:e.id, style:{ marginBottom:8 } },
          React.createElement('strong', { style:{ color:'var(--accent-liika)', fontSize:13 } }, e.label),
          React.createElement('p', { style:{ margin:'2px 0 0 12px', fontSize:12, color:'var(--text-muted)' } }, e.desc)
        ))
      ),
      REMC_DOMAINES.map(dom => React.createElement('div', { key:dom.id, style:cardStyle },
        React.createElement('div', {
          style:{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' },
          onClick: () => setExpandDom(prev => ({ ...prev, [dom.id]: !prev[dom.id] }))
        },
          React.createElement('h3', { style:{ margin:0, fontSize:15, color:'var(--text)' } },
            dom.icon + ' ' + dom.titre
          ),
          React.createElement('span', { style:{ color:'var(--text-muted)', fontSize:18 } }, expandDom[dom.id] ? '▾' : '▸')
        ),
        expandDom[dom.id] && dom.competences.map(c => React.createElement('div', {
          key:c.id, style:{ marginTop:10, paddingLeft:12, borderLeft:'2px solid var(--accent-liika-border)' }
        },
          React.createElement('div', { style:{ fontWeight:600, fontSize:13, color:'var(--accent-liika)' } }, c.code + ' — ' + c.titre),
          React.createElement('div', { style:{ fontSize:12, color:'var(--text-muted)', marginTop:2 } }, c.detail)
        ))
      ))
    ),

    // ── TAB : Sécurité routière ──
    tab === 'securite' && React.createElement('div', null,
      React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', marginBottom:14, fontStyle:'italic' } },
        '8 fiches thématiques sécurité routière — points clés, sanctions et conseils pédagogiques pour le formateur.'
      ),
      REMC_FICHES_SECURITE.map(f => {
        const open = !!expandSec[f.id];
        return React.createElement('div', { key:f.id, style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', marginBottom:10, overflow:'hidden' } },
          React.createElement('div', {
            onClick: () => setExpandSec(prev => ({ ...prev, [f.id]: !prev[f.id] })),
            style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', cursor:'pointer' }
          },
            React.createElement('span', { style:{ fontSize:14 } }, f.icon + ' '),
            React.createElement('span', { style:{ color:'var(--text)', fontWeight:600, fontSize:13, flex:1, marginLeft:8 } }, f.titre),
            React.createElement('span', { style:{ color:'var(--text-muted)', fontSize:16 } }, open ? '▾' : '▸')
          ),
          open && React.createElement('div', { style:{ padding:'0 16px 16px', borderTop:'1px solid var(--accent-liika-border)' } },
            React.createElement('div', { style:{ marginTop:12 } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--gold)', marginBottom:6 } }, '✦ Points clés'),
              React.createElement('ul', { style:{ margin:0, paddingLeft:18 } },
                f.pointsCles.map((p,i) => React.createElement('li', { key:i, style:{ fontSize:12, color:'var(--text)', lineHeight:1.6, marginBottom:4 } }, p))
              )
            ),
            React.createElement('div', { style:{ marginTop:12 } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'#f87171', marginBottom:6 } }, '🚫 Sanctions'),
              React.createElement('ul', { style:{ margin:0, paddingLeft:18 } },
                f.sanctions.map((s,i) => React.createElement('li', { key:i, style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, marginBottom:4 } }, s))
              )
            ),
            React.createElement('div', { style:{ marginTop:12, background:'var(--bg2)', borderRadius:8, padding:'10px 12px' } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--accent-liika)', marginBottom:6 } }, '🎓 Conseils formateur'),
              f.conseilsFormateur.map((c,i) => React.createElement('div', { key:i, style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, marginBottom: i < f.conseilsFormateur.length-1 ? 6 : 0, paddingLeft:8, borderLeft:'2px solid var(--accent-liika-border)' } }, c))
            )
          )
        );
      })
    ),

    // ── TAB : Loi ──
    tab === 'loi' && React.createElement('div', null,
      React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', marginBottom:14, fontStyle:'italic' } },
        '6 fiches légales — textes de référence, infractions, agrément enseignant et responsabilité du moniteur.'
      ),
      REMC_LOIS.map(f => {
        const open = !!expandLoi[f.id];
        return React.createElement('div', { key:f.id, style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', marginBottom:10, overflow:'hidden' } },
          React.createElement('div', {
            onClick: () => setExpandLoi(prev => ({ ...prev, [f.id]: !prev[f.id] })),
            style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', cursor:'pointer' }
          },
            React.createElement('span', { style:{ fontSize:14 } }, f.icon + ' '),
            React.createElement('span', { style:{ color:'var(--text)', fontWeight:600, fontSize:13, flex:1, marginLeft:8 } }, f.titre),
            React.createElement('span', { style:{ color:'var(--text-muted)', fontSize:16 } }, open ? '▾' : '▸')
          ),
          open && React.createElement('div', { style:{ padding:'0 16px 16px', borderTop:'1px solid var(--accent-liika-border)' } },
            React.createElement('div', { style:{ marginTop:12 } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--gold)', marginBottom:6 } }, '📑 Contenu'),
              React.createElement('ul', { style:{ margin:0, paddingLeft:18 } },
                f.contenu.map((c,i) => React.createElement('li', { key:i, style:{ fontSize:12, color:'var(--text)', lineHeight:1.6, marginBottom:4 } }, c))
              )
            ),
            React.createElement('div', { style:{ marginTop:12, background:'var(--bg2)', borderRadius:8, padding:'10px 12px' } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:6 } }, '📎 Références légales'),
              f.references.map((r,i) => React.createElement('div', { key:i, style:{ fontSize:11, color:'var(--text-muted)', lineHeight:1.5, fontStyle:'italic', marginBottom:2 } }, '• ' + r))
            ),
            React.createElement('div', { style:{ marginTop:12 } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--accent-liika)', marginBottom:6 } }, '💡 Notes pratiques'),
              f.notesPratiques.map((n,i) => React.createElement('div', { key:i, style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, marginBottom: i < f.notesPratiques.length-1 ? 6 : 0, paddingLeft:8, borderLeft:'2px solid var(--accent-liika-border)' } }, n))
            )
          )
        );
      })
    ),

    // ── TAB : EDPM ──
    tab === 'edpm' && React.createElement('div', null,
      React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', marginBottom:6, fontStyle:'italic' } },
        '5 fiches EDPM — Engins de Déplacement Personnel Motorisé : réglementation, risques et prévention routière.'
      ),
      React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--gold)', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:14, fontSize:12 } },
        React.createElement('span', { style:{ fontWeight:700, color:'var(--gold)', marginRight:8 } }, '⚡ Cadre légal commun'),
        'Tous les EDPM relèvent du décret n°2019-1082 du 23 octobre 2019. Vitesse max : 25 km/h, piste cyclable ou chaussée uniquement, casque obligatoire, assurance RC obligatoire, âge min 12 ans, interdit sur trottoirs et voies rapides.'
      ),
      EDPM_FICHES.map(f => {
        const open = !!expandEdpm[f.id];
        return React.createElement('div', { key:f.id, style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', marginBottom:10, overflow:'hidden' } },
          React.createElement('div', {
            onClick: () => setExpandEdpm(prev => ({ ...prev, [f.id]: !prev[f.id] })),
            style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', cursor:'pointer' }
          },
            React.createElement('span', { style:{ fontSize:20 } }, f.icon),
            React.createElement('span', { style:{ color:'var(--text)', fontWeight:700, fontSize:13, flex:1, marginLeft:10 } }, f.titre),
            React.createElement('span', { style:{ color:'var(--text-muted)', fontSize:16 } }, open ? '▾' : '▸')
          ),
          open && React.createElement('div', { style:{ padding:'0 16px 16px', borderTop:'1px solid var(--accent-liika-border)' } },
            React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', margin:'10px 0 12px', fontStyle:'italic', lineHeight:1.5 } }, f.definition),
            React.createElement('div', { style:{ marginBottom:12 } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--gold)', marginBottom:6 } }, '⚖️ Réglementation spécifique'),
              React.createElement('ul', { style:{ margin:0, paddingLeft:18 } },
                f.reglementation.map((r,i) => React.createElement('li', { key:i, style:{ fontSize:12, color:'var(--text)', lineHeight:1.6, marginBottom:3 } }, r))
              )
            ),
            React.createElement('div', { style:{ marginBottom:12 } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'#e74c3c', marginBottom:6 } }, '⚠️ Risques principaux'),
              React.createElement('ul', { style:{ margin:0, paddingLeft:18 } },
                f.risques.map((r,i) => React.createElement('li', { key:i, style:{ fontSize:12, color:'var(--text)', lineHeight:1.6, marginBottom:3 } }, r))
              )
            ),
            React.createElement('div', { style:{ marginBottom:12 } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'#27ae60', marginBottom:6 } }, '✅ Prévention & bons réflexes'),
              React.createElement('ul', { style:{ margin:0, paddingLeft:18 } },
                f.prevention.map((p,i) => React.createElement('li', { key:i, style:{ fontSize:12, color:'var(--text)', lineHeight:1.6, marginBottom:3 } }, p))
              )
            ),
            React.createElement('div', { style:{ background:'var(--bg2)', borderRadius:8, padding:'10px 12px' } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--accent-liika)', marginBottom:6 } }, '💡 Conseils formateur'),
              f.conseilsFormateur.map((c,i) => React.createElement('div', { key:i, style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, marginBottom: i < f.conseilsFormateur.length-1 ? 5 : 0, paddingLeft:8, borderLeft:'2px solid var(--accent-liika-border)' } }, c))
            )
          )
        );
      })
    ),

    // ── TAB : Permis PL ──
    tab === 'pl' && React.createElement('div', null,
      // sous-nav PL
      React.createElement('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 } },
        [
          { id:'referentiel',   label:'📋 Référentiel C/CE' },
          { id:'reglementation',label:'⚖️ Réglementation PL (6)' },
          { id:'remc',          label:'🔗 REMC en contexte PL' },
        ].map(s => React.createElement('button', {
          key:s.id, onClick:()=>setPlTab(s.id),
          style:{ padding:'5px 12px', borderRadius:16, border:'none', cursor:'pointer', fontSize:12,
            background: plTab===s.id ? 'var(--accent-liika)' : 'var(--glass)',
            color: plTab===s.id ? '#fff' : 'var(--text)', fontWeight: plTab===s.id ? 700 : 400 }
        }, s.label))
      ),

      // ── Référentiel C/CE ──
      plTab === 'referentiel' && React.createElement('div', null,
        React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:14 } },
          React.createElement('div', { style:{ fontSize:13, fontWeight:700, color:'var(--accent-liika)', marginBottom:6 } }, '🎖️ Rôle VT Monitrice PL — RSMA Guadeloupe'),
          React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', margin:0, lineHeight:1.6 } }, PL_REFERENTIEL.role)
        ),
        // Catégories
        React.createElement('div', { style:{ fontSize:13, fontWeight:700, color:'var(--gold)', marginBottom:10 } }, '📁 Catégories de permis'),
        PL_REFERENTIEL.categories.map(c => React.createElement('div', { key:c.cat, style:{ background:'var(--glass)', border:`2px solid var(--accent-liika-border)`, borderRadius:'var(--radius)', padding:'12px 14px', marginBottom:10, display:'flex', gap:14, alignItems:'flex-start' } },
          React.createElement('div', { style:{ minWidth:40, height:40, borderRadius:8, background:'var(--accent-liika)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18 } }, c.cat),
          React.createElement('div', { style:{ flex:1 } },
            React.createElement('div', { style:{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:4 } }, c.label),
            React.createElement('div', { style:{ fontSize:11, color:'var(--text-muted)', lineHeight:1.6 } },
              React.createElement('span', { style:{ color:'var(--gold)' } }, 'PTAC : '), c.ptac + ' · ',
              React.createElement('span', { style:{ color:'var(--gold)' } }, 'Remorque : '), c.remorque + ' · ',
              React.createElement('span', { style:{ color:'var(--gold)' } }, 'Prérequis : '), c.prerequis + ' · ',
              React.createElement('span', { style:{ color:'var(--gold)' } }, 'Âge min : '), c.age
            ),
            React.createElement('div', { style:{ fontSize:11, color:'var(--text-muted)', marginTop:4, fontStyle:'italic' } }, c.usage)
          )
        )),
        // Épreuves
        React.createElement('div', { style:{ fontSize:13, fontWeight:700, color:'var(--gold)', margin:'16px 0 10px' } }, '📝 Épreuves d\'examen'),
        PL_REFERENTIEL.epreuves.map(e => React.createElement('div', { key:e.code, style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:8, display:'flex', gap:12, alignItems:'flex-start' } },
          React.createElement('div', { style:{ fontSize:11, fontWeight:700, color:'var(--accent-liika)', background:'var(--accent-liika-bg)', borderRadius:6, padding:'3px 8px', whiteSpace:'nowrap', marginTop:2 } }, e.code),
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:3 } }, e.label),
            React.createElement('div', { style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 } }, e.desc)
          )
        )),
        // Formations
        React.createElement('div', { style:{ fontSize:13, fontWeight:700, color:'var(--gold)', margin:'16px 0 10px' } }, '🎓 Formations complémentaires'),
        PL_REFERENTIEL.formations.map(f => React.createElement('div', { key:f.sigle, style:{ background:'var(--glass)', border:`1px solid ${f.obligatoire ? 'var(--accent-liika-border)' : 'var(--border)'}`, borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:8 } },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8, marginBottom:4 } },
            React.createElement('span', { style:{ fontSize:12, fontWeight:800, color: f.obligatoire ? 'var(--accent-liika)' : 'var(--text-muted)', background:'var(--bg2)', borderRadius:6, padding:'2px 8px' } }, f.sigle),
            React.createElement('span', { style:{ fontSize:12, fontWeight:600, color:'var(--text)' } }, f.nom),
            f.obligatoire && React.createElement('span', { style:{ fontSize:10, color:'#e74c3c', fontWeight:700, marginLeft:'auto' } }, '● OBLIGATOIRE')
          ),
          React.createElement('div', { style:{ fontSize:11, color:'var(--gold)', marginBottom:3 } }, '⏱ ' + f.duree),
          React.createElement('div', { style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 } }, f.desc)
        ))
      ),

      // ── Réglementation PL ──
      plTab === 'reglementation' && React.createElement('div', null,
        React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', marginBottom:14, fontStyle:'italic' } },
          '6 fiches réglementation spécifique PL — tachygraphe, temps de conduite, masses, arrimage, RSVERO, conduite urbaine.'
        ),
        PL_REGLEMENTATION.map(f => {
          const open = !!expandPl[f.id];
          return React.createElement('div', { key:f.id, style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', marginBottom:10, overflow:'hidden' } },
            React.createElement('div', {
              onClick: () => setExpandPl(prev => ({ ...prev, [f.id]: !prev[f.id] })),
              style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', cursor:'pointer' }
            },
              React.createElement('span', { style:{ fontSize:18 } }, f.icon),
              React.createElement('span', { style:{ color:'var(--text)', fontWeight:700, fontSize:13, flex:1, marginLeft:10 } }, f.titre),
              React.createElement('span', { style:{ color:'var(--text-muted)', fontSize:16 } }, open ? '▾' : '▸')
            ),
            open && React.createElement('div', { style:{ padding:'0 16px 16px', borderTop:'1px solid var(--accent-liika-border)' } },
              React.createElement('div', { style:{ marginTop:12, marginBottom:12 } },
                React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--gold)', marginBottom:6 } }, '📌 Points clés'),
                React.createElement('ul', { style:{ margin:0, paddingLeft:18 } },
                  f.pointsCles.map((p,i) => React.createElement('li', { key:i, style:{ fontSize:12, color:'var(--text)', lineHeight:1.6, marginBottom:3 } }, p))
                )
              ),
              f.sanctions && React.createElement('div', { style:{ background:'rgba(231,76,60,0.07)', borderRadius:8, padding:'10px 12px', marginBottom:12 } },
                React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'#e74c3c', marginBottom:6 } }, '🚨 Sanctions'),
                f.sanctions.map((s,i) => React.createElement('div', { key:i, style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, marginBottom:3 } }, '• ' + s))
              ),
              React.createElement('div', { style:{ background:'var(--bg2)', borderRadius:8, padding:'10px 12px' } },
                React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--accent-liika)', marginBottom:6 } }, '💡 Conseils monitrice'),
                f.conseilsMonitrice.map((c,i) => React.createElement('div', { key:i, style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, marginBottom: i < f.conseilsMonitrice.length-1 ? 5 : 0, paddingLeft:8, borderLeft:'2px solid var(--accent-liika-border)' } }, c))
              )
            )
          );
        })
      ),

      // ── REMC en contexte PL ──
      plTab === 'remc' && React.createElement('div', null,
        React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', marginBottom:14, fontStyle:'italic' } },
          'Les 9 compétences REMC adaptées à la conduite PL — spécificités techniques et exercices concrets en contexte RSMA Guadeloupe.'
        ),
        PL_REMC_ADAPTATIONS.map(a => React.createElement('div', { key:a.comp, style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:'12px 14px', marginBottom:10 } },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:8 } },
            React.createElement('span', { style:{ fontSize:11, fontWeight:700, color:'var(--gold)', background:'rgba(212,175,55,0.15)', borderRadius:8, padding:'2px 7px' } }, a.comp),
            React.createElement('span', { style:{ fontSize:13, fontWeight:700, color:'var(--text)' } }, a.titre)
          ),
          React.createElement('p', { style:{ fontSize:12, color:'var(--text)', lineHeight:1.6, margin:'0 0 8px' } }, a.specificite),
          React.createElement('div', { style:{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic', paddingLeft:10, borderLeft:'2px solid var(--gold)' } },
            React.createElement('span', { style:{ fontWeight:700, fontStyle:'normal', color:'var(--gold)', marginRight:6 } }, '🎯 Exercice :'),
            a.exercice
          )
        ))
      )
    ),

    // ── TAB : RSMA ──
    tab === 'rsma' && React.createElement('div', null,
      // sous-nav RSMA
      React.createElement('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 } },
        [
          { id:'contexte',      label:'🏛️ Contexte SMA/RSMA' },
          { id:'correlations',  label:'🔗 Corrélations REMC ↔ SMA' },
          { id:'edpms',         label:'📊 EDPMS adapté RSMA' },
        ].map(s => React.createElement('button', {
          key:s.id, onClick:()=>setRsmaTab(s.id),
          style:{ padding:'5px 12px', borderRadius:16, border:'none', cursor:'pointer', fontSize:12,
            background: rsmaTab===s.id ? 'var(--gold)' : 'var(--glass)',
            color: rsmaTab===s.id ? '#000' : 'var(--text)', fontWeight: rsmaTab===s.id ? 700 : 400 }
        }, s.label))
      ),

      // ── Contexte ──
      rsmaTab === 'contexte' && React.createElement('div', null,
        React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--gold)', borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:14 } },
          React.createElement('div', { style:{ fontSize:13, fontWeight:700, color:'var(--gold)', marginBottom:6 } }, '🎖️ ' + RSMA_CONTEXTE.structure),
          React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', margin:'0 0 10px', lineHeight:1.6 } }, RSMA_CONTEXTE.mission),
          React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:6 } }, '📋 Cadre réglementaire'),
          React.createElement('ul', { style:{ margin:0, paddingLeft:18 } },
            RSMA_CONTEXTE.cadre.map((c,i) => React.createElement('li', { key:i, style:{ fontSize:12, color:'var(--text)', lineHeight:1.7, marginBottom:2 } }, c))
          )
        ),
        React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:14 } },
          React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--accent-liika)', marginBottom:8 } }, '👤 Profil type du Volontaire Stagiaire (VS)'),
          RSMA_CONTEXTE.profilTypique.map((p,i) => React.createElement('div', { key:i, style:{ fontSize:12, color:'var(--text)', lineHeight:1.6, marginBottom:6, paddingLeft:10, borderLeft:'2px solid var(--accent-liika-border)' } }, p))
        ),
        React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:'14px 16px' } },
          React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--gold)', marginBottom:8 } }, '💡 Adaptations pédagogiques clés'),
          RSMA_CONTEXTE.adaptationsPedagogiques.map((a,i) => React.createElement('div', { key:i, style:{ display:'flex', gap:8, fontSize:12, color:'var(--text)', lineHeight:1.6, marginBottom:7 } },
            React.createElement('span', { style:{ color:'var(--gold)', minWidth:16 } }, '→'),
            React.createElement('span', null, a)
          ))
        )
      ),

      // ── Corrélations REMC ↔ SMA ──
      rsmaTab === 'correlations' && React.createElement('div', null,
        React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', marginBottom:14, fontStyle:'italic' } },
          'Pour chaque compétence REMC : valeur SMA associée, lien pédagogique, adaptation au public RSMA Guadeloupe et piste d\'évaluation.'
        ),
        REMC_RSMA_CORRELATIONS.map(c => {
          const open = !!expandCorr[c.comp];
          return React.createElement('div', { key:c.comp, style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', marginBottom:10, overflow:'hidden' } },
            React.createElement('div', {
              onClick: () => setExpandCorr(prev => ({ ...prev, [c.comp]: !prev[c.comp] })),
              style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', cursor:'pointer' }
            },
              React.createElement('span', { style:{ fontSize:11, fontWeight:700, color:'var(--gold)', background:'rgba(212,175,55,0.15)', borderRadius:8, padding:'2px 7px', minWidth:38, textAlign:'center' } }, c.comp),
              React.createElement('span', { style:{ color:'var(--text)', fontWeight:600, fontSize:13, flex:1, marginLeft:10 } }, c.titre),
              React.createElement('span', { style:{ fontSize:11, color:'var(--accent-liika)', background:'var(--bg2)', borderRadius:20, padding:'2px 8px', marginRight:8 } }, c.valeurSMA),
              React.createElement('span', { style:{ color:'var(--text-muted)', fontSize:16 } }, open ? '▾' : '▸')
            ),
            open && React.createElement('div', { style:{ padding:'0 16px 16px', borderTop:'1px solid var(--accent-liika-border)' } },
              React.createElement('div', { style:{ marginTop:12, background:'var(--bg2)', borderRadius:8, padding:'10px 12px', marginBottom:12 } },
                React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--gold)', marginBottom:6 } }, '🔗 Lien REMC ↔ valeur SMA'),
                React.createElement('p', { style:{ fontSize:12, color:'var(--text)', lineHeight:1.6, margin:0 } }, c.lien)
              ),
              React.createElement('div', { style:{ marginBottom:12 } },
                React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--accent-liika)', marginBottom:6 } }, '🎯 Adaptation au public RSMA'),
                c.adaptationRSMA.map((a,i) => React.createElement('div', { key:i, style:{ display:'flex', gap:8, fontSize:12, color:'var(--text)', lineHeight:1.6, marginBottom:5 } },
                  React.createElement('span', { style:{ color:'var(--accent-liika)', minWidth:14 } }, '•'),
                  React.createElement('span', null, a)
                ))
              ),
              React.createElement('div', { style:{ background:'rgba(231,76,60,0.08)', borderRadius:8, padding:'8px 12px', marginBottom:10 } },
                React.createElement('span', { style:{ fontSize:11, fontWeight:700, color:'#e74c3c' } }, '⚠️ Risques spécifiques : '),
                React.createElement('span', { style:{ fontSize:12, color:'var(--text-muted)' } }, c.risquesSpecifiques)
              ),
              React.createElement('div', { style:{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic', paddingLeft:10, borderLeft:'2px solid var(--gold)' } },
                React.createElement('span', { style:{ fontWeight:700, fontStyle:'normal', color:'var(--gold)', marginRight:6 } }, '📝 Piste d\'évaluation :'),
                c.pisTeEvaluation
              )
            )
          );
        })
      ),

      // ── EDPMS adapté RSMA ──
      rsmaTab === 'edpms' && React.createElement('div', null,
        React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', marginBottom:14, fontStyle:'italic' } },
          'Entretien initial et positionnement EDPMS adaptés au profil des Volontaires Stagiaires du RSMA Guadeloupe.'
        ),
        // Entretien RSMA
        React.createElement('div', { style:{ fontSize:13, fontWeight:700, color:'var(--gold)', marginBottom:10 } }, '💬 Entretien initial adapté RSMA'),
        EDPMS_RSMA_ENTRETIEN.map(sec => React.createElement('div', { key:sec.id, style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:14, marginBottom:10 } },
          React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--accent-liika)', marginBottom:8 } }, sec.categorie),
          sec.questions.map((q,i) => React.createElement('div', { key:i, style:{ display:'flex', gap:8, fontSize:12, color:'var(--text)', lineHeight:1.6, marginBottom:5 } },
            React.createElement('span', { style:{ color:'var(--text-muted)', minWidth:18, fontWeight:700 } }, (i+1) + '.'),
            React.createElement('span', null, q)
          ))
        )),
        // Niveaux RSMA
        React.createElement('div', { style:{ fontSize:13, fontWeight:700, color:'var(--gold)', margin:'20px 0 10px' } }, '📊 Positionnement EDPMS — profils typiques RSMA'),
        EDPMS_RSMA_NIVEAUX.map(n => React.createElement('div', { key:n.id, style:{ background:'var(--glass)', border:`2px solid ${n.color}`, borderRadius:'var(--radius)', padding:14, marginBottom:12 } },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:8 } },
            React.createElement('span', { style:{ fontSize:18, fontWeight:700, color:n.color } }, n.id),
            React.createElement('span', { style:{ fontSize:13, fontWeight:700, color:'var(--text)' } }, n.label.split('—')[1].trim())
          ),
          React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', marginBottom:8, fontStyle:'italic' } }, n.profilRSMA),
          React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:4 } }, '🎯 Priorités de formation'),
          n.priorites.map((p,i) => React.createElement('div', { key:i, style:{ fontSize:12, color:'var(--text)', lineHeight:1.6, paddingLeft:10, borderLeft:`2px solid ${n.color}`, marginBottom:4 } }, p)),
          React.createElement('div', { style:{ fontSize:12, color:'var(--text-muted)', marginTop:8 } }, '⏱ ' + n.dureeEstimee),
          n.alertes.length > 0 && React.createElement('div', { style:{ marginTop:8, background:'rgba(231,76,60,0.08)', borderRadius:6, padding:'6px 10px' } },
            n.alertes.map((a,i) => React.createElement('div', { key:i, style:{ fontSize:11, color:'#e74c3c', lineHeight:1.5, marginBottom: i < n.alertes.length-1 ? 4 : 0 } }, '⚠️ ' + a))
          )
        ))
      )
    ),

    // ── TAB : EDPMS ──
    tab === 'edpms' && React.createElement('div', null,
      // Sous-navigation EDPMS
      React.createElement('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 } },
        [
          { id:'guide',     label:'📖 Guide' },
          { id:'entretien', label:'💬 Entretien initial' },
          { id:'grille',    label:'📋 Grille d\'observation' },
          { id:'synthese',  label:'🎯 Synthèse & PFI' },
        ].map(s => React.createElement('button', {
          key:s.id, onClick:()=>setEdpmsStep(s.id),
          style:{ padding:'5px 12px', borderRadius:16, border:'none', cursor:'pointer', fontSize:12,
            background: edpmsStep===s.id ? 'var(--accent-liika)' : 'var(--glass)',
            color: edpmsStep===s.id ? '#fff' : 'var(--text)' }
        }, s.label))
      ),

      // ── Guide ──
      edpmsStep === 'guide' && React.createElement('div', null,
        React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:16, marginBottom:12 } },
          React.createElement('h3', { style:{ margin:'0 0 8px', color:'var(--gold)', fontSize:15 } }, '📊 Qu\'est-ce que l\'EDPMS ?'),
          React.createElement('p', { style:{ margin:'0 0 8px', fontSize:13, color:'var(--text)', lineHeight:1.7 } },
            'L\'Évaluation Diagnostique et de Positionnement en Maîtrise de la Sécurité (EDPMS) est l\'outil d\'entrée dans la formation REMC. Elle permet au formateur de :'
          ),
          React.createElement('ul', { style:{ margin:'0 0 8px', paddingLeft:18 } },
            ['Identifier le niveau réel de l\'élève dans les 3 domaines REMC',
             'Cerner ses représentations, motivations et freins éventuels',
             'Positionner l\'élève dans le parcours de formation',
             'Co-construire un Plan de Formation Individualisé (PFI)',
             'Établir une relation de confiance dès la première leçon',
            ].map((t,i) => React.createElement('li', { key:i, style:{ fontSize:13, color:'var(--text)', lineHeight:1.7 } }, t))
          )
        ),
        React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:16, marginBottom:12 } },
          React.createElement('h3', { style:{ margin:'0 0 10px', color:'var(--gold)', fontSize:14 } }, '⏱ Organisation de la séance EDPMS'),
          [
            { temps:'0–5 min',   icon:'👋', etape:'Accueil & présentation', desc:'Accueillir l\'élève, se présenter, présenter l\'auto-école et le déroulé de la séance.' },
            { temps:'5–20 min',  icon:'💬', etape:'Entretien initial',       desc:'Utiliser la grille d\'entretien pour cerner expérience, motivations, représentations et disponibilités.' },
            { temps:'20–25 min', icon:'✍️', etape:'Auto-évaluation élève',  desc:'Faire remplir par l\'élève sa propre perception de ses compétences (1 = aucune idée → 5 = très confiant).' },
            { temps:'25–50 min', icon:'🚗', etape:'Mise en situation réelle',desc:'Leçon de conduite diagnostique : observer chaque compétence REMC sans intervenir sauf danger.' },
            { temps:'50–60 min', icon:'🎯', etape:'Synthèse & PFI',         desc:'Débriefing bienveillant, positionnement, fixation des 3 objectifs prioritaires et planning.' },
          ].map((e,i) => React.createElement('div', { key:i, style:{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 } },
            React.createElement('div', { style:{ minWidth:60, fontSize:10, color:'var(--text-muted)', paddingTop:2, flexShrink:0 } }, e.temps),
            React.createElement('span', { style:{ fontSize:16, flexShrink:0 } }, e.icon),
            React.createElement('div', null,
              React.createElement('div', { style:{ fontWeight:700, fontSize:13, color:'var(--accent-liika)' } }, e.etape),
              React.createElement('div', { style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6 } }, e.desc)
            )
          ))
        ),
        React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:16 } },
          React.createElement('h3', { style:{ margin:'0 0 10px', color:'var(--gold)', fontSize:14 } }, '💡 Posture du formateur pendant l\'EDPMS'),
          [
            'Observation non interventionniste pendant la conduite diagnostique (sauf danger réel)',
            'Langage bienveillant et non jugeant — l\'élève ne doit pas se sentir évalué de façon scolaire',
            'Prendre des notes discrètes sur la grille d\'observation pendant la conduite',
            'Valoriser les points forts avant d\'aborder les axes d\'amélioration dans la synthèse',
            'La synthèse doit être une co-construction : interroger l\'élève sur sa propre perception',
            'Ne pas surcharger le PFI — 3 objectifs maximum pour la prochaine leçon',
          ].map((t,i) => React.createElement('div', { key:i, style:{ display:'flex', gap:8, marginBottom:6 } },
            React.createElement('span', { style:{ color:'var(--accent-liika)', flexShrink:0 } }, '◇'),
            React.createElement('span', { style:{ fontSize:12, color:'var(--text)', lineHeight:1.6 } }, t)
          ))
        )
      ),

      // ── Entretien initial ──
      edpmsStep === 'entretien' && React.createElement('div', null,
        React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', marginBottom:14, fontStyle:'italic' } },
          'Guide d\'entretien structuré à conduire avant la mise en situation. Adapter librement selon le profil de l\'élève.'
        ),
        EDPMS_ENTRETIEN.map(sec => React.createElement('div', { key:sec.id, style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:16, marginBottom:12 } },
          React.createElement('h3', { style:{ margin:'0 0 10px', color:'var(--accent-liika)', fontSize:14 } }, '💬 ' + sec.categorie),
          sec.questions.map((q,i) => React.createElement('div', { key:i, style:{ display:'flex', gap:8, marginBottom:8 } },
            React.createElement('span', { style:{ color:'var(--gold)', fontWeight:700, flexShrink:0, fontSize:13 } }, (i+1) + '.'),
            React.createElement('span', { style:{ fontSize:13, color:'var(--text)', lineHeight:1.6 } }, q)
          ))
        )),
        // Auto-évaluation élève
        React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--gold-border)', borderRadius:'var(--radius)', padding:16, marginBottom:12 } },
          React.createElement('h3', { style:{ margin:'0 0 6px', color:'var(--gold)', fontSize:14 } }, '✍️ Auto-évaluation guidée de l\'élève'),
          React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', margin:'0 0 12px' } },
            'Faire noter de 1 (pas du tout) à 5 (très confiant) par l\'élève lui-même, avant la mise en situation.'
          ),
          EDPMS_AUTOEVAL.map(dom => React.createElement('div', { key:dom.id, style:{ marginBottom:12 } },
            React.createElement('div', { style:{ fontWeight:700, fontSize:13, color:'var(--text)', marginBottom:6 } }, dom.dom),
            dom.items.map((it,i) => React.createElement('div', { key:it.id, style:{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'var(--text-muted)', marginBottom:6, paddingLeft:8, borderLeft:'2px solid var(--accent-liika-border)' } },
              React.createElement('span', { style:{ flex:1, lineHeight:1.5 } }, it.label),
              React.createElement('div', { style:{ display:'flex', gap:4, marginLeft:8 } },
                [1,2,3,4,5].map(n => React.createElement('div', { key:n, style:{ width:22, height:22, borderRadius:'50%', border:'1px solid var(--accent-liika-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--text-muted)', background:'var(--bg2)' } }, n))
              )
            ))
          ))
        )
      ),

      // ── Grille d'observation formateur ──
      edpmsStep === 'grille' && React.createElement('div', null,
        React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', marginBottom:14, fontStyle:'italic' } },
          'Grille d\'observation à renseigner pendant ou immédiatement après la mise en situation diagnostique. Notation : ✓ observé / ~ partiel / ✗ absent / — non observé.'
        ),
        // Sélecteur d'élève
        (cr.eleves||[]).length > 0 && React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:14 } },
          React.createElement('label', { style:{ fontSize:12, color:'var(--text-muted)' } }, 'Élève évalué :'),
          React.createElement('select', {
            value: edpmsEleveId, onChange: e => setEdpmsEleveId(e.target.value),
            style:{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'5px 10px', color:'var(--text)', fontSize:13 }
          },
            React.createElement('option', { value:'' }, '— choisir un élève —'),
            (cr.eleves||[]).map(e => React.createElement('option', { key:e.id, value:e.id }, e.nom + ' (permis ' + e.niveau + ')'))
          )
        ),
        EDPMS_OBS_FORMATEUR.map(c => React.createElement('div', { key:c.id, style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:'12px 14px', marginBottom:10 } },
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 } },
            React.createElement('div', null,
              React.createElement('span', { style:{ color:'var(--accent-liika)', fontWeight:700, fontSize:12 } }, c.code + ' — '),
              React.createElement('span', { style:{ color:'var(--text)', fontWeight:600, fontSize:13 } }, c.titre)
            ),
            React.createElement('div', { style:{ display:'flex', gap:6, flexShrink:0 } },
              ['✓','~','✗','—'].map(s => React.createElement('div', { key:s, style:{ width:26, height:26, borderRadius:6, border:'1px solid var(--accent-liika-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'var(--text-muted)', background:'var(--bg2)', cursor:'pointer' } }, s))
            )
          ),
          React.createElement('ul', { style:{ margin:0, paddingLeft:16 } },
            c.indicateurs.map((ind,i) => React.createElement('li', { key:i, style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, marginBottom:2 } }, ind))
          )
        ))
      ),

      // ── Synthèse & PFI ──
      edpmsStep === 'synthese' && React.createElement('div', null,
        React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', marginBottom:14, fontStyle:'italic' } },
          'À compléter avec l\'élève lors du débriefing final. Co-construire le Plan de Formation Individualisé (PFI).'
        ),
        // Niveaux de positionnement
        React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:16, marginBottom:12 } },
          React.createElement('h3', { style:{ margin:'0 0 10px', color:'var(--gold)', fontSize:14 } }, '🎯 Positionnement REMC'),
          EDPMS_NIVEAUX.map(n => React.createElement('div', { key:n.id, style:{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:10, padding:'10px 12px', borderRadius:8, border:'1px solid var(--accent-liika-border)', background:'var(--bg2)' } },
            React.createElement('div', { style:{ width:36, height:36, borderRadius:8, background:n.color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:16, color:'#111', flexShrink:0 } }, n.id),
            React.createElement('div', null,
              React.createElement('div', { style:{ fontWeight:700, fontSize:13, color:'var(--text)', marginBottom:2 } }, n.label),
              React.createElement('div', { style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 } }, n.desc)
            )
          ))
        ),
        // Structure du PFI
        React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:16, marginBottom:12 } },
          React.createElement('h3', { style:{ margin:'0 0 10px', color:'var(--gold)', fontSize:14 } }, '📋 Plan de Formation Individualisé (PFI) — éléments à renseigner'),
          [
            { label:'Niveau de positionnement retenu (A / B / C / D)', type:'select' },
            { label:'3 points forts identifiés pendant la séance',     type:'text3' },
            { label:'3 axes prioritaires de travail',                   type:'text3' },
            { label:'Estimation du nombre d\'heures restantes',         type:'number' },
            { label:'Prochain objectif de leçon (compétence REMC cible)', type:'text' },
            { label:'Observations libres & remarques formateur',        type:'textarea' },
          ].map((f,i) => React.createElement('div', { key:i, style:{ marginBottom:12 } },
            React.createElement('label', { style:{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:4 } }, f.label),
            f.type === 'textarea'
              ? React.createElement('textarea', { rows:3, placeholder:'…', style:{ width:'100%', boxSizing:'border-box', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'7px 10px', color:'var(--text)', fontSize:12, resize:'vertical' } })
              : f.type === 'text3'
                ? React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:4 } },
                    [1,2,3].map(n => React.createElement('input', { key:n, placeholder:'— ' + n, style:{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontSize:12 } }))
                  )
                : React.createElement('input', { type: f.type === 'number' ? 'number' : 'text', placeholder:'…', style:{ width:'100%', boxSizing:'border-box', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontSize:12 } })
          ))
        ),
        // Conseils de conclusion
        React.createElement('div', { style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', padding:16 } },
          React.createElement('h3', { style:{ margin:'0 0 10px', color:'var(--gold)', fontSize:14 } }, '✦ Conduire le débriefing — points clés'),
          [
            'Commencer par demander à l\'élève son propre ressenti : « Comment vous êtes-vous senti(e) ? »',
            'Valider les perceptions justes, recadrer doucement les représentations erronées',
            'Annoncer le positionnement avec des mots positifs : « Vous êtes au niveau B, ce qui signifie que les bases sont là… »',
            'Présenter le PFI comme un outil vivant : il peut évoluer au fil des leçons',
            'Terminer sur un point de motivation : rappeler la progression normale et les délais réalistes',
            'Conserver une copie du PFI dans le livret d\'apprentissage de l\'élève',
          ].map((t,i) => React.createElement('div', { key:i, style:{ display:'flex', gap:8, marginBottom:7 } },
            React.createElement('span', { style:{ color:'var(--accent-liika)', flexShrink:0, marginTop:1 } }, '◇'),
            React.createElement('span', { style:{ fontSize:12, color:'var(--text)', lineHeight:1.6 } }, t)
          ))
        )
      )
    ),

    // ── TAB : Élèves ──
    tab === 'eleves' && React.createElement('div', null,
      // Liste élèves (gauche) + détail progression (droite si sélectionné)
      !selectedEleve && React.createElement('div', null,
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 } },
          React.createElement('span', { style:{ fontWeight:600, color:'var(--text)' } }, 'Mes élèves'),
          React.createElement('button', {
            onClick: () => setShowAddEleve(s => !s),
            style:{ ...btnStyle(showAddEleve), background:'var(--accent-liika)', color:'#fff' }
          }, showAddEleve ? '✕ Annuler' : '+ Élève')
        ),
        showAddEleve && React.createElement('div', { style:{ ...cardStyle, display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end', marginBottom:12 } },
          React.createElement('div', null,
            React.createElement('label', { style:{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:4 } }, 'Nom complet'),
            React.createElement('input', {
              value: eleveName, onChange: e => setEleveName(e.target.value),
              placeholder: 'Prénom NOM', onKeyDown: e => e.key==='Enter'&&addEleve(),
              style:{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontSize:13, width:180 }
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { style:{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:4 } }, 'Permis'),
            React.createElement('select', {
              value: elevePerm, onChange: e => setElevePerm(e.target.value),
              style:{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontSize:13 }
            }, ['B','B96','BE','A','AM','C','CE','D'].map(p => React.createElement('option', { key:p, value:p }, p)))
          ),
          React.createElement('button', { onClick:addEleve, style:{ ...btnStyle(false), background:'var(--accent-liika)', color:'#fff' } }, 'Ajouter')
        ),
        (cr.eleves || []).length === 0
          ? React.createElement('p', { style:{ color:'var(--text-muted)', fontStyle:'italic', textAlign:'center', padding:24 } }, 'Aucun élève pour l\'instant.')
          : (cr.eleves || []).map(e => React.createElement('div', {
              key: e.id,
              style:{ ...cardStyle, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' },
              onClick: () => setSelectedEleveId(e.id)
            },
              React.createElement('div', null,
                React.createElement('div', { style:{ fontWeight:600, color:'var(--accent-liika)', fontSize:14 } }, '◇ ' + e.nom),
                React.createElement('div', { style:{ fontSize:12, color:'var(--text-muted)', marginTop:2 } },
                  'Permis ' + e.niveau + ' · Début : ' + e.dateDebut +
                  ' · ' + REMC_DOMAINES.flatMap(d=>d.competences).filter(c=>(e.progression||{})[c.id]===3).length + '/9 autonomes'
                )
              ),
              React.createElement('div', { style:{ display:'flex', gap:8, alignItems:'center' } },
                React.createElement('span', { style:{ color:'var(--text-muted)', fontSize:20 } }, '›'),
                React.createElement('button', {
                  onClick: ev => { ev.stopPropagation(); deleteEleve(e.id); },
                  style:{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:16, padding:'2px 6px' }
                }, '×')
              )
            ))
      ),
      // Détail élève sélectionné
      selectedEleve && React.createElement('div', null,
        React.createElement('button', { onClick:()=>setSelectedEleveId(null), style:{ ...btnStyle(false), marginBottom:12 } }, '← Retour'),
        React.createElement('h3', { style:{ color:'var(--accent-liika)', marginBottom:16 } }, '◇ ' + selectedEleve.nom + ' — Progression REMC'),
        REMC_DOMAINES.map(dom => React.createElement('div', { key:dom.id, style:cardStyle },
          React.createElement('h4', { style:{ margin:'0 0 10px', fontSize:14, color:'var(--text)' } }, dom.icon + ' ' + dom.titre),
          dom.competences.map(c => React.createElement('div', { key:c.id, style:{ marginBottom:10 } },
            React.createElement('div', { style:{ fontSize:13, marginBottom:6, color:'var(--text)' } },
              React.createElement('span', { style:{ color:'var(--accent-liika)', fontWeight:600 } }, c.code),
              ' ' + c.titre
            ),
            React.createElement('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
              REMC_NIV_LABEL.map((lbl, idx) => {
                const cur = (selectedEleve.progression || {})[c.id] || 0;
                return React.createElement('button', {
                  key: idx,
                  onClick: () => setNiveau(selectedEleve.id, c.id, idx),
                  style:{
                    padding:'4px 10px', borderRadius:12, border:'none', cursor:'pointer', fontSize:11,
                    background: cur === idx ? REMC_NIV_COLOR[idx] : 'var(--bg3)',
                    color: cur === idx ? (idx===0?'#aaa':'#111') : 'var(--text-muted)',
                    fontWeight: cur === idx ? 700 : 400, transition:'background .2s'
                  }
                }, lbl);
              })
            )
          ))
        ))
      )
    ),

    // ── TAB : Fiches ──
    // ── TAB : Révision ──
    tab === 'revision' && React.createElement('div', null,
      React.createElement('p', { style:{ fontSize:12, color:'var(--text-muted)', marginBottom:14, fontStyle:'italic' } },
        '9 fiches de révision — une par compétence REMC. Cliquez pour dérouler points clés, erreurs fréquentes et questions d\'examen.'
      ),
      REMC_FICHES_REVISION.map(f => {
        const open = !!expandFiche[f.id];
        return React.createElement('div', { key:f.id, style:{ background:'var(--glass)', border:'1px solid var(--accent-liika-border)', borderRadius:'var(--radius)', marginBottom:10, overflow:'hidden' } },
          // En-tête accordéon
          React.createElement('div', {
            onClick: () => setExpandFiche(prev => ({ ...prev, [f.id]: !prev[f.id] })),
            style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', cursor:'pointer' }
          },
            React.createElement('div', null,
              React.createElement('span', { style:{ fontSize:11, color:'var(--text-muted)', marginRight:8 } }, f.domaine),
              React.createElement('span', { style:{ color:'var(--accent-liika)', fontWeight:700, fontSize:13, marginRight:6 } }, f.code),
              React.createElement('span', { style:{ color:'var(--text)', fontSize:13 } }, f.titre)
            ),
            React.createElement('span', { style:{ color:'var(--text-muted)', fontSize:16, flexShrink:0 } }, open ? '▾' : '▸')
          ),
          // Contenu déroulable
          open && React.createElement('div', { style:{ padding:'0 16px 16px', borderTop:'1px solid var(--accent-liika-border)' } },
            // Points clés
            React.createElement('div', { style:{ marginTop:12 } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--gold)', marginBottom:6 } }, '✦ Points clés'),
              React.createElement('ul', { style:{ margin:0, paddingLeft:18 } },
                f.pointsCles.map((p, i) => React.createElement('li', { key:i, style:{ fontSize:12, color:'var(--text)', lineHeight:1.6, marginBottom:4 } }, p))
              )
            ),
            // Erreurs fréquentes
            React.createElement('div', { style:{ marginTop:12 } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--accent-liika)', marginBottom:6 } }, '⚠ Erreurs fréquentes'),
              React.createElement('ul', { style:{ margin:0, paddingLeft:18 } },
                f.erreursFrequentes.map((e, i) => React.createElement('li', { key:i, style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, marginBottom:4 } }, e))
              )
            ),
            // Questions d'examen
            React.createElement('div', { style:{ marginTop:12, background:'var(--bg2)', borderRadius:8, padding:'10px 12px' } },
              React.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:6 } }, '❓ Questions d\'examen'),
              f.questionsExamen.map((q, i) => React.createElement('div', { key:i, style:{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, marginBottom:i < f.questionsExamen.length-1 ? 4 : 0, paddingLeft:8, borderLeft:'2px solid var(--accent-liika-border)' } }, q))
            )
          )
        );
      })
    ),

    tab === 'fiches' && React.createElement('div', null,
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 } },
        React.createElement('span', { style:{ fontWeight:600, color:'var(--text)' } }, 'Fiches de leçon'),
        React.createElement('button', {
          onClick: () => setShowAddFiche(s => !s),
          style:{ ...btnStyle(false), background:'var(--accent-liika)', color:'#fff' }
        }, showAddFiche ? '✕ Annuler' : '+ Fiche')
      ),
      showAddFiche && React.createElement('div', { style:{ ...cardStyle, marginBottom:12 } },
        ['Thème / Compétence REMC','Objectif de la leçon','Bilan & points à retravailler'].map((lbl, i) => {
          const vals = [ficheTheme, ficheObj, ficheBilan];
          const setters = [setFicheTheme, setFicheObj, setFicheBilan];
          return React.createElement('div', { key:i, style:{ marginBottom:8 } },
            React.createElement('label', { style:{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:4 } }, lbl),
            React.createElement('input', {
              value: vals[i], onChange: e => setters[i](e.target.value),
              style:{ width:'100%', boxSizing:'border-box', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'7px 10px', color:'var(--text)', fontSize:13 }
            })
          );
        }),
        React.createElement('button', { onClick:addFiche, style:{ ...btnStyle(false), marginTop:4, background:'var(--accent-liika)', color:'#fff' } }, 'Enregistrer')
      ),
      (cr.fiches || []).length === 0
        ? React.createElement('p', { style:{ color:'var(--text-muted)', fontStyle:'italic', textAlign:'center', padding:24 } }, 'Aucune fiche pour l\'instant.')
        : [...(cr.fiches || [])].reverse().map(f => React.createElement('div', { key:f.id, style:cardStyle },
            React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' } },
              React.createElement('div', null,
                React.createElement('div', { style:{ fontWeight:600, color:'var(--accent-liika)', fontSize:14 } }, f.theme),
                React.createElement('div', { style:{ fontSize:11, color:'var(--text-muted)', marginBottom:6 } }, f.date),
                f.objectif && React.createElement('div', { style:{ fontSize:12, color:'var(--text)', marginBottom:4 } },
                  React.createElement('strong', null, 'Objectif : '), f.objectif
                ),
                f.bilan && React.createElement('div', { style:{ fontSize:12, color:'var(--text-muted)' } },
                  React.createElement('strong', null, 'Bilan : '), f.bilan
                )
              ),
              React.createElement('button', {
                onClick: () => deleteFiche(f.id),
                style:{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:16, padding:'0 4px', flexShrink:0 }
              }, '×')
            )
          ))
    ),

    // ── TAB : Notes ──
    tab === 'notes' && React.createElement('div', { style:cardStyle },
      React.createElement('h3', { style:{ margin:'0 0 10px', fontSize:14, color:'var(--gold)' } }, '✏️ Notes formateur'),
      React.createElement('textarea', {
        value: cr.notes || '',
        onChange: e => updateCodeRousseau({ notes: e.target.value }),
        placeholder: 'Observations générales, rappels, ressources pédagogiques…',
        style:{
          width:'100%', boxSizing:'border-box', minHeight:200, background:'var(--bg2)',
          border:'1px solid var(--border)', borderRadius:8, padding:'10px', color:'var(--text)',
          fontSize:13, lineHeight:1.6, resize:'vertical'
        }
      })
    )
  );
}

// ─── Toast motivation quotidienne ───
function MotivationToast({ message, onClose }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    // fondu entrant
    const t1 = setTimeout(() => setVisible(true), 50);
    // auto-fermeture après 8 s
    const t2 = setTimeout(() => { setVisible(false); setTimeout(onClose, 400); }, 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 400); };
  return React.createElement('div', {
    onClick: handleClose,
    style: {
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0,
      transition: 'opacity .4s ease, transform .4s ease',
      zIndex: 9999,
      maxWidth: 420,
      width: 'calc(100vw - 40px)',
      background: 'rgba(18,28,18,.92)',
      border: '1px solid var(--gold-border)',
      borderRadius: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,.6)',
      padding: '14px 44px 14px 16px',
      backdropFilter: 'blur(10px)',
      cursor: 'pointer'
    }
  },
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'flex-start', gap: 10 }
    },
      React.createElement('span', { style: { fontSize: 18, lineHeight: 1.2, flexShrink: 0 } }, '✨'),
      React.createElement('p', {
        style: {
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--text)',
          fontStyle: 'italic'
        }
      }, message)
    ),
    React.createElement('button', {
      onClick: e => { e.stopPropagation(); handleClose(); },
      style: {
        position: 'absolute',
        top: 8, right: 10,
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        fontSize: 16,
        cursor: 'pointer',
        lineHeight: 1,
        padding: '2px 4px'
      }
    }, '×')
  );
}

// ─── Main App ───
function App(){
const vw=useWindowWidth();
const isMobile=vw<=768;
const isTablet=vw>768&&vw<=1024;
const isSmall=vw<=1024;
const [data,setDataRaw]=useState(loadData);
// Tout changement d'état passe par ce wrapper : il horodate les sections
// modifiées (data._t) pour que la fusion multi-appareils sache qui est le plus récent.
const setData=useCallback((updater)=>{
  setDataRaw(prev=>stampChanges(prev, typeof updater==='function'?updater(prev):updater));
},[]);
// Vrai juste après l'application d'un état reçu en temps réel → évite de le re-pousser (anti-écho).
const remoteApplyRef=useRef(false);
const [ui,setUI]=useState(loadUI);
const [session,setSession]=useState({id:'couple',name:'Dja & Liika',loggedAt:Date.now(),token:null});
const [view,setView]=useState(null);
const [activeCat,setActiveCat]=useState('lifestyle');
const [prevCatIdx,setPrevCatIdx]=useState(0);
const [modal,setModal]=useState(null);
const [syncStatus,setSyncStatus]=useState('idle'); // idle | syncing | ok | error
const [initialSyncDone,setInitialSyncDone]=useState(false);
const [onlineCount,setOnlineCount]=useState(0); // nb d'appareils connectés (présence)
// État de la vue "Objectifs du mois" (perdu lors d'une fusion, restauré ici au niveau App)
const [objMoisFilter,setObjMoisFilter]=useState(()=>new Date().getMonth());
const [showAddObjM,setShowAddObjM]=useState(false);
const [newObjM,setNewObjM]=useState({titre:'',detail:'',categorie:'Nature'});
// État de la vue "Route Liika" — persisté dans data.liika.route → synchro Supabase
const routeKm=(data.liika&&data.liika.route&&typeof data.liika.route.km==='number')?data.liika.route.km:0;
const routeChecklist=(data.liika&&data.liika.route&&data.liika.route.checklist)||{};
const setRouteKm=useCallback(fn=>{
  setData(prev=>{
    const next=clone(prev);
    if(!next.liika.route||typeof next.liika.route!=='object') next.liika.route={km:0,checklist:{}};
    const cur=typeof next.liika.route.km==='number'?next.liika.route.km:0;
    next.liika.route.km=Math.max(0,typeof fn==='function'?fn(cur):fn);
    return next;
  });
},[]);
const setRouteChecklist=useCallback(fn=>{
  setData(prev=>{
    const next=clone(prev);
    if(!next.liika.route||typeof next.liika.route!=='object') next.liika.route={km:0,checklist:{}};
    if(!next.liika.route.checklist||typeof next.liika.route.checklist!=='object') next.liika.route.checklist={};
    next.liika.route.checklist=typeof fn==='function'?fn(next.liika.route.checklist):fn;
    return next;
  });
},[]);
const [showMotivation,setShowMotivation]=useState(false);
const [motivationMsg,setMotivationMsg]=useState('');
const activeProfile=ui?.activeProfile||'dja';
const profileLabel=activeProfile==='dja'?'Dja':activeProfile==='liika'?'Liika':'Couple';
const setActiveProfile=useCallback((who)=>setUI(prev=>({...prev,activeProfile:who})),[]);
const goToCategory=useCallback((catId)=>{
  const newIdx=CATEGORIES.findIndex(c=>c.id===catId);
  const oldIdx=CATEGORIES.findIndex(c=>c.id===activeCat);
  setPrevCatIdx(oldIdx);
  setActiveCat(catId);
  setView(null);
},[activeCat]);

// Parallax cinématique du fond (preset 2)
useEffect(()=>{
  if(typeof window==='undefined' || !document?.body) return;
  const prefersReduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReduced){
    document.body.style.setProperty('--bg-parallax-y','0px');
    return;
  }

  let rafId=0;
  const getFactor=()=>window.innerWidth<=480?-0.12:window.innerWidth<=1024?-0.18:-0.24;
  const update=()=>{
    rafId=0;
    const y=window.scrollY||window.pageYOffset||0;
    const offset=Math.max(-260,Math.round(y*getFactor()));
    document.body.style.setProperty('--bg-parallax-y',`${offset}px`);
  };
  const onScroll=()=>{
    if(!rafId) rafId=window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',update,{passive:true});
  return ()=>{
    window.removeEventListener('scroll',onScroll);
    window.removeEventListener('resize',update);
    if(rafId) window.cancelAnimationFrame(rafId);
  };
},[]);

// Popup de motivation — une seule fois par jour, après synchro Supabase
useEffect(()=>{
  if(!initialSyncDone) return; // attendre les données Supabase (motivations custom)
  const today=new Date().toDateString();
  if(localStorage.getItem('ld-motivation-date')===today) return;
  localStorage.setItem('ld-motivation-date',today); // marquer avant le timer (survit à un démontage rapide)
  const custom=((data.couple||{}).motivations||[]).filter(Boolean); // filtrer les entrées null
  const all=[...DEFAULT_MOTIVATIONS,...custom];
  const now=new Date();
  const dayOfYear=Math.floor((now-new Date(now.getFullYear(),0,0))/864e5);
  const item=all[dayOfYear%all.length];
  setMotivationMsg(typeof item==='string'?item:((item&&item.text)||''));
  const t=setTimeout(()=>{ setShowMotivation(true); },2000);
  return ()=>clearTimeout(t);
},[initialSyncDone]);

// Persiste localStorage à chaque changement
useEffect(()=>saveData(data),[data]);

// Hydrate depuis Supabase au démarrage (si plus récent que le local)
useEffect(()=>{
let alive=true;
(async()=>{
  setSyncStatus('syncing');
  let _token=null;
  try{const{data:_sd}=await sb.rpc('ld_open_session',{p_device_id:DEVICE_ID});if(_sd&&_sd.ok){_token=_sd.token;if(alive)setSession(s=>({...s,token:_token}));}}catch(_){}
  const remote=await sbLoad(_token);
  if(!alive||!remote){
    if(alive){
      setSyncStatus('ok');
      setInitialSyncDone(true);
    }
    return;
  }

  const remoteData=normalize(remote);
  remoteApplyRef.current=true; // état appliqué depuis le serveur → ne pas le re-pousser
  setDataRaw(prev=>{
    // Appareil sans historique d'édition local (_t vide) → le serveur fait foi.
    const hasLocalEdits=prev&&prev._t&&Object.keys(prev._t).length>0;
    return hasLocalEdits?mergeStates(prev,remoteData):remoteData;
  });

  // ── DrevmCook : charge les tables dédiées (+ migration depuis le blob si vides) ──
  // Fait ICI car remoteData (ancien blob) contient encore recipes/ferments avant strip.
  try{
    let [recs,ferms,crs,meds]=await Promise.all([sbLoadRecipes(),sbLoadFerments(),sbLoadCourses().catch(()=>[]),sbLoadMedia().catch(()=>[])]);
    const srcRecs=(Array.isArray(remoteData.recipes)&&remoteData.recipes.length)?remoteData.recipes:(Array.isArray(data.recipes)?data.recipes:[]);
    const srcFerms=(Array.isArray(remoteData.ferments)&&remoteData.ferments.length)?remoteData.ferments:(Array.isArray(data.ferments)?data.ferments:[]);
    // Migration média : si la table est vide, on y verse le blob/seed (dont la playlist Mix Vibz par défaut).
    const srcMeds=(Array.isArray(remoteData.media)&&remoteData.media.length)?remoteData.media:(Array.isArray(data.media)?data.media:[]);
    if(recs.length===0&&srcRecs.length>0){ await Promise.all(srcRecs.map(r=>sbUpsertRecipe(r).catch(()=>{}))); recs=srcRecs; }
    if(ferms.length===0&&srcFerms.length>0){ await Promise.all(srcFerms.map(f=>sbUpsertFerment(f).catch(()=>{}))); ferms=srcFerms; }
    if(meds.length===0&&srcMeds.length>0){ await Promise.all(srcMeds.map(m=>sbUpsertMedia(m).catch(()=>{}))); meds=srcMeds; }
    if(alive){ remoteApplyRef.current=true; setDataRaw(prev=>({...prev,recipes:recs,ferments:ferms,courses:crs,media:meds})); }
  }catch(_){}

  setSyncStatus('ok');
  setInitialSyncDone(true);
})().catch(()=>{
  setSyncStatus('error');
  setInitialSyncDone(true);
});

return ()=>{alive=false;};
},[]);

// Sync Supabase debounce 1.5s
useEffect(()=>{
if(!initialSyncDone)return;
// Cet état vient d'être reçu/fusionné depuis le serveur → déjà à jour côté distant, pas de re-push.
if(remoteApplyRef.current){remoteApplyRef.current=false;return;}
const t=setTimeout(()=>{
  setSyncStatus('syncing');
  sbSave(data, session?.token).then(()=>setSyncStatus('ok')).catch(()=>setSyncStatus('error'));
},1500);
return ()=>clearTimeout(t);
},[data,initialSyncDone]);

// ─── Realtime cross-device sync + présence ───
useEffect(()=>{
// Présence : lit les sessions actives (<5 min)
const refreshOnline=()=>sb.from('app_sessions')
  .select('id').gte('last_seen',new Date(Date.now()-300000).toISOString())
  .then(({data:rows})=>rows&&setOnlineCount(rows.length)).catch(()=>{});
// Ping : enregistre / met à jour cet appareil
const ping=()=>sb.from('app_sessions').upsert({
  id:DEVICE_ID,
  user_name:localStorage.getItem('ld-username')||'Appareil',
  last_seen:new Date().toISOString(),
  is_online:true
}).then(undefined,()=>{});

ping();refreshOnline();
const iv=setInterval(()=>{ping();refreshOnline();},60000);

const ch=sb.channel('ld-realtime')
  // Réception des changements d'un AUTRE appareil
  .on('postgres_changes',
    {event:'UPDATE',schema:'public',table:'app_state',filter:'id=eq.main'},
    (payload)=>{
      if(!payload.new?.data)return;
      if(payload.new.device_id===DEVICE_ID)return; // notre propre save → ignorer
      const remote=normalize(payload.new.data);
      remoteApplyRef.current=true; // anti-écho : ne pas re-pousser ce qu'on vient de recevoir
      setDataRaw(prev=>mergeStates(prev,remote)); // fusion par section, pas d'écrasement global
      setSyncStatus('ok');
    })
    // Mise à jour du compteur d'appareils en ligne
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'app_sessions'
    }, () => refreshOnline()).subscribe();
    return () => {
      clearInterval(iv);
      sb.removeChannel(ch);
    };
  }, []);

  // ─── DrevmCook : temps réel (refetch simple sur tout changement) ───
  useEffect(() => {
    const ch = sb.channel('ld-drevmcook')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' },
        async () => { try { const recs = await sbLoadRecipes(); remoteApplyRef.current = true; setDataRaw(prev => ({ ...prev, recipes: recs })); } catch (_) {} })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ferments' },
        async () => { try { const ferms = await sbLoadFerments(); remoteApplyRef.current = true; setDataRaw(prev => ({ ...prev, ferments: ferms })); } catch (_) {} })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' },
        async () => { try { const crs = await sbLoadCourses(); remoteApplyRef.current = true; setDataRaw(prev => ({ ...prev, courses: crs })); } catch (_) {} })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media' },
        async () => { try { const meds = await sbLoadMedia(); remoteApplyRef.current = true; setDataRaw(prev => ({ ...prev, media: meds })); } catch (_) {} })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, []);
  const updateGames = useCallback(fn => {
    setData(prev => {
      const next = clone(prev);
      next.games = fn(next.games);
      return next;
    });
  }, []);
  const updateObj = useCallback((who, id, updates) => {
    setData(prev => {
      const next = clone(prev);
      const list = who === 'couple' ? next.couple.objectives : next[who].objectives;
      const idx = list.findIndex(o => o.id === id);
      if (idx >= 0) Object.assign(list[idx], updates);
      return next;
    });
  }, []);
  const toggleAction = useCallback((who, id) => {
    setData(prev => {
      const next = clone(prev);
      const list = who === 'couple' ? next.couple.actions : next[who].actions;
      const idx = list.findIndex(a => a.id === id);
      if (idx >= 0) list[idx].done = !list[idx].done;
      return next;
    });
  }, []);
  const deleteObj = useCallback((who, id) => {
    setData(prev => {
      const next = clone(prev);
      if (who === 'couple') next.couple.objectives = next.couple.objectives.filter(o => o.id !== id);else next[who].objectives = next[who].objectives.filter(o => o.id !== id);
      return next;
    });
  }, []);
  const addObjective = useCallback((who, title, desc, cat) => {
    setData(prev => {
      const next = clone(prev);
      const obj = {
        id: Date.now().toString(),
        cat,
        title,
        desc,
        progress: 0,
        done: false
      };
      if (who === 'couple') next.couple.objectives.push(obj);else next[who].objectives.push(obj);
      return next;
    });
  }, []);
  const addAction = useCallback((who, text, _, cat) => {
    setData(prev => {
      const next = clone(prev);
      const act = {
        id: Date.now().toString(),
        text,
        cat,
        done: false
      };
      if (who === 'couple') next.couple.actions.push(act);else next[who].actions.push(act);
      return next;
    });
  }, []);
  const addNote = useCallback((who, text) => {
    if (!text.trim()) return;
    setData(prev => {
      const next = clone(prev);
      const note = {
        id: Date.now().toString(),
        text: text.trim(),
        date: new Date().toISOString()
      };
      if (who === 'couple') next.couple.notes = [note, ...(next.couple.notes || [])];else next[who].notes = [note, ...(next[who].notes || [])];
      return next;
    });
  }, []);
  const deleteNote = useCallback((who, id) => {
    setData(prev => {
      const next = clone(prev);
      if (who === 'couple') next.couple.notes = (next.couple.notes || []).filter(n => n.id !== id);else next[who].notes = (next[who].notes || []).filter(n => n.id !== id);
      return next;
    });
  }, []);
  const upsertMeal = useCallback((who, meal) => {
    setData(prev => {
      const next = clone(prev);
      const src = next[who]?.meals || next.couple?.meals || [];
      const idx = src.findIndex(m => m.id === meal.id);
      if (idx >= 0) src[idx] = meal;else src.push(meal);
      return next;
    });
  }, []);
  const deleteMeal = useCallback((who, id) => {
    setData(prev => {
      const next = clone(prev);
      if (who === 'couple') next.couple.meals = (next.couple.meals || []).filter(m => m.id !== id);else next[who].meals = (next[who].meals || []).filter(m => m.id !== id);
      return next;
    });
  }, []);
  const upsertBudgetLine = useCallback((who, type, line) => {
    setData(prev => {
      const next = clone(prev);
      const src = who === 'couple' ? next.couple.budget : next[who].budget;
      const arr = src[type];
      const idx = arr.findIndex(l => l.id === line.id);
      if (idx >= 0) arr[idx] = line;else arr.push(line);
      return next;
    });
  }, []);
  const deleteBudgetLine = useCallback((who, type, id) => {
    setData(prev => {
      const next = clone(prev);
      const src = who === 'couple' ? next.couple.budget : next[who].budget;
      src[type] = src[type].filter(l => l.id !== id);
      return next;
    });
  }, []);
  const updateVision = useCallback((who, text) => {
    setData(prev => {
      const next = clone(prev);
      if (who === 'couple') next.couple.vision = text;else next[who].vision = text;
      return next;
    });
  }, []);
  const upsertSport = useCallback((who, item) => {
    setData(prev => {
      const next = clone(prev);
      const src = who === 'couple' ? next.couple.sport : next[who].sport || [];
      const idx = src.findIndex(s => s.id === item.id);
      if (idx >= 0) src[idx] = item;else src.push(item);
      if (who === 'couple') next.couple.sport = src;else next[who].sport = src;
      return next;
    });
  }, []);
  const deleteSport = useCallback((who, id) => {
    setData(prev => {
      const next = clone(prev);
      if (who === 'couple') next.couple.sport = (next.couple.sport || []).filter(s => s.id !== id);else next[who].sport = (next[who].sport || []).filter(s => s.id !== id);
      return next;
    });
  }, []);
  // recipes/ferments : état local immédiat (setDataRaw, hors synchro blob) + écriture table dédiée.
  const upsertRecipe = useCallback(recipe => {
    setDataRaw(prev => {
      const next = clone(prev);
      if (!Array.isArray(next.recipes)) next.recipes = [];
      const idx = next.recipes.findIndex(r => r.id === recipe.id);
      if (idx >= 0) next.recipes[idx] = recipe;else next.recipes.push(recipe);
      return next;
    });
    sbUpsertRecipe(recipe).catch(() => {});
  }, []);
  const deleteRecipe = useCallback(id => {
    setDataRaw(prev => {
      const next = clone(prev);
      next.recipes = (next.recipes || []).filter(r => r.id !== id);
      return next;
    });
    sbDeleteRecipe(id).catch(() => {});
  }, []);
  // Import CSV : fusionne (ajoute / met à jour par id), n'efface jamais
  const importRecipes = useCallback(list => {
    setDataRaw(prev => {
      const next = clone(prev);
      if (!Array.isArray(next.recipes)) next.recipes = [];
      for (const r of list) {
        const idx = next.recipes.findIndex(x => x.id === r.id);
        if (idx >= 0) next.recipes[idx] = r;else next.recipes.push(r);
      }
      return next;
    });
    (list || []).forEach(r => sbUpsertRecipe(r).catch(() => {}));
  }, []);
  const upsertFerment = useCallback(ferment => {
    setDataRaw(prev => {
      const next = clone(prev);
      if (!Array.isArray(next.ferments)) next.ferments = [];
      const idx = next.ferments.findIndex(f => f.id === ferment.id);
      if (idx >= 0) next.ferments[idx] = ferment;else next.ferments.push(ferment);
      return next;
    });
    sbUpsertFerment(ferment).catch(() => {});
  }, []);
  const deleteFerment = useCallback(id => {
    setDataRaw(prev => {
      const next = clone(prev);
      next.ferments = (next.ferments || []).filter(f => f.id !== id);
      return next;
    });
    sbDeleteFerment(id).catch(() => {});
  }, []);
  // ── Courses (table dédiée) ──
  const addCourse = useCallback(raw => {
    const item = { ...raw, qte: Math.max(0, Number(raw.qte) || 1), prix: numOrEmpty(raw.prix) };
    setDataRaw(prev => {
      const next = clone(prev);
      if (!Array.isArray(next.courses)) next.courses = [];
      // Regroupement : même nom (normalisé) + même unité + non coché → cumuler la quantité
      const i = next.courses.findIndex(c => !c.done && normName(c.nom) === normName(item.nom) && (c.unite || '') === (item.unite || ''));
      let row;
      if (i >= 0) {
        row = { ...next.courses[i], qte: (Number(next.courses[i].qte) || 0) + item.qte };
        if (item.prix !== '') row.prix = item.prix;
        next.courses[i] = row;
      } else {
        row = item;
        next.courses.push(row);
      }
      sbUpsertCourse(row).catch(() => {});
      return next;
    });
  }, []);
  const upsertCourse = useCallback(raw => {
    const c = { ...raw, qte: Math.max(0, Number(raw.qte) || 0), prix: numOrEmpty(raw.prix) };
    setDataRaw(prev => {
      const next = clone(prev);
      if (!Array.isArray(next.courses)) next.courses = [];
      const i = next.courses.findIndex(x => x.id === c.id);
      if (i >= 0) next.courses[i] = c;else next.courses.push(c);
      return next;
    });
    sbUpsertCourse(c).catch(() => {});
  }, []);
  const deleteCourse = useCallback(id => {
    setDataRaw(prev => {
      const next = clone(prev);
      next.courses = (next.courses || []).filter(c => c.id !== id);
      return next;
    });
    sbDeleteCourse(id).catch(() => {});
  }, []);
  const toggleCourse = useCallback(id => {
    setDataRaw(prev => {
      const next = clone(prev);
      const i = (next.courses || []).findIndex(c => c.id === id);
      if (i >= 0) {
        next.courses[i] = { ...next.courses[i], done: !next.courses[i].done };
        sbUpsertCourse(next.courses[i]).catch(() => {});
      }
      return next;
    });
  }, []);
  const clearCheckedCourses = useCallback(() => {
    setDataRaw(prev => {
      const next = clone(prev);
      const checked = (next.courses || []).filter(c => c.done).map(c => c.id);
      next.courses = (next.courses || []).filter(c => !c.done);
      sbDeleteCoursesByIds(checked).catch(() => {});
      return next;
    });
  }, []);
  const mergeDuplicateCourses = useCallback(() => {
    setDataRaw(prev => {
      const next = clone(prev);
      const map = new Map();
      const result = [];
      const toDelete = [];
      for (const c of next.courses || []) {
        const key = c.done ? 'done:' + c.id : normName(c.nom) + '|' + (c.unite || '');
        if (!c.done && map.has(key)) {
          const ex = map.get(key);
          ex.qte = (Number(ex.qte) || 0) + (Number(c.qte) || 1);
          if ((ex.prix === '' || ex.prix == null) && c.prix !== '' && c.prix != null) ex.prix = c.prix;
          toDelete.push(c.id);
          sbUpsertCourse(ex).catch(() => {});
        } else {
          map.set(key, c);
          result.push(c);
        }
      }
      next.courses = result;
      sbDeleteCoursesByIds(toDelete).catch(() => {});
      return next;
    });
  }, []);
  const generateCoursesFromMeals = useCallback(() => {
    setDataRaw(prev => {
      const next = clone(prev);
      if (!Array.isArray(next.courses)) next.courses = [];
      const allRecipes = [...DEFAULT_RECIPES, ...(next.recipes || [])];
      const recByName = new Map(allRecipes.map(r => [normName(r.nom), r]));
      const meals = [...((next.dja && next.dja.meals) || []), ...((next.liika && next.liika.meals) || []), ...((next.couple && next.couple.meals) || [])];
      const existing = new Set((next.courses || []).filter(c => !c.done).map(c => normName(c.nom)));
      const added = [];
      let seq = 0;
      const addItem = nom => {
        const key = normName(nom);
        if (!nom || existing.has(key)) return;
        existing.add(key);
        const item = { id: Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 7), nom, qte: 1, unite: '', rayon: rayonForItem(nom), prix: '', done: false };
        next.courses.push(item);
        added.push(item);
      };
      for (const m of meals) {
        const plat = (m.plat || '').trim();
        if (!plat) continue;
        const rec = recByName.get(normName(plat));
        if (rec && Array.isArray(rec.ingredients) && rec.ingredients.length) rec.ingredients.forEach(addItem);else addItem(plat);
      }
      if (!added.length) { try { alert('Aucun nouvel article à ajouter depuis les repas (déjà dans la liste, ou plans de repas vides).'); } catch (_) {} }
      added.forEach(it => sbUpsertCourse(it).catch(() => {}));
      return next;
    });
  }, []);
  const addMedia = useCallback(item => {
    setDataRaw(prev => {
      const next = clone(prev);
      next.media = [...(next.media || []), item];
      return next;
    });
    sbUpsertMedia(item).catch(() => {});
  }, []);
  const deleteMedia = useCallback(id => {
    setDataRaw(prev => {
      const next = clone(prev);
      next.media = (next.media || []).filter(m => m.id !== id);
      return next;
    });
    sbDeleteMedia(id).catch(() => {});
  }, []);
  const addAlbumPhoto = useCallback(photo => {
    setData(prev => {
      const next = clone(prev);
      next.album = [photo, ...(next.album || [])];
      return next;
    });
  }, []);
  const deleteAlbumPhoto = useCallback((id, storagePath) => {
    setData(prev => {
      const next = clone(prev);
      next.album = (next.album || []).filter(p => p.id !== id);
      return next;
    });
    if (storagePath) sb.storage.from('album-photos').remove([storagePath]).catch(function(){});
  }, []);
  const addMedical = useCallback(rdv => {
    setData(prev => {
      const next = clone(prev);
      next.couple.medical = [rdv, ...(next.couple.medical || [])];
      return next;
    });
  }, []);
  const deleteMedical = useCallback(id => {
    setData(prev => {
      const next = clone(prev);
      next.couple.medical = (next.couple.medical || []).filter(r => r.id !== id);
      return next;
    });
  }, []);
  const addPlante = useCallback(p => {
    setData(prev => {
      const next = clone(prev);
      next.couple.potager = [p, ...(next.couple.potager || [])];
      return next;
    });
  }, []);
  const updatePlante = useCallback((id, patch) => {
    setData(prev => {
      const next = clone(prev);
      next.couple.potager = (next.couple.potager || []).map(x => x.id === id ? { ...x, ...patch } : x);
      return next;
    });
  }, []);
  const deletePlante = useCallback(id => {
    setData(prev => {
      const next = clone(prev);
      next.couple.potager = (next.couple.potager || []).filter(x => x.id !== id);
      return next;
    });
  }, []);
  // Survie : mutateur générique sur couple.survie (passe par setData → stamp + synchro section)
  const updateSurvie = useCallback(fn => {
    setData(prev => {
      const next = clone(prev);
      if (!next.couple.survie || typeof next.couple.survie !== 'object') next.couple.survie = clone(defaultData.couple.survie);
      if (!next.couple.survie.bob) next.couple.survie.bob = { dja: [], liika: [], commun: [] };
      if (!next.couple.survie.plan) next.couple.survie.plan = { ralliement: [], contacts: [], protocoles: [] };
      if (!Array.isArray(next.couple.survie.stocks)) next.couple.survie.stocks = [];
      fn(next.couple.survie);
      return next;
    });
  }, []);
  const updateCodeRousseau = useCallback(patch => {
    setData(prev => {
      const next = clone(prev);
      if (!next.liika.codeRousseau || typeof next.liika.codeRousseau !== 'object') next.liika.codeRousseau = clone(defaultData.liika.codeRousseau);
      next.liika.codeRousseau = { ...next.liika.codeRousseau, ...patch };
      return next;
    });
  }, []);
  const togglePlanningCheck = useCallback((day, itemId) => {
    setData(prev => {
      const next = clone(prev);
      if (!next.couple.planning) next.couple.planning = {};
      const d = next.couple.planning[day] || {
        checked: {},
        custom: []
      };
      d.checked = {
        ...d.checked,
        [itemId]: !d.checked[itemId]
      };
      next.couple.planning[day] = d;
      return next;
    });
  }, []);
  const addPlanningCustomItem = useCallback((day, item) => {
    setData(prev => {
      const next = clone(prev);
      if (!next.couple.planning) next.couple.planning = {};
      const d = next.couple.planning[day] || {
        checked: {},
        custom: []
      };
      d.custom = [...(d.custom || []), item];
      next.couple.planning[day] = d;
      return next;
    });
  }, []);
  const deletePlanningCustomItem = useCallback((day, id) => {
    setData(prev => {
      const next = clone(prev);
      if (next.couple.planning && next.couple.planning[day]) {
        next.couple.planning[day].custom = (next.couple.planning[day].custom || []).filter(i => i.id !== id);
      }
      return next;
    });
  }, []);
  const addIdeeCustom = useCallback(text => {
    if (!text.trim()) return;
    setData(prev => {
      const next = clone(prev);
      if (!next.couple.ideeJour) next.couple.ideeJour = {
        liste: [],
        custom: []
      };
      next.couple.ideeJour.custom = [...(next.couple.ideeJour.custom || []), {
        id: Date.now().toString(),
        text: text.trim()
      }];
      return next;
    });
  }, []);
  const deleteIdeeCustom = useCallback(id => {
    setData(prev => {
      const next = clone(prev);
      if (next.couple.ideeJour) {
        next.couple.ideeJour.custom = (next.couple.ideeJour.custom || []).filter(i => i.id !== id);
      }
      return next;
    });
  }, []);
  const toggleMaisonTask = useCallback(id => {
    setData(prev => {
      const next = clone(prev);
      if (!next.couple.maison) next.couple.maison = {
        checked: {},
        custom: [],
        lastReset: ''
      };
      const c = next.couple.maison.checked || {};
      next.couple.maison.checked = {
        ...c,
        [id]: !c[id]
      };
      return next;
    });
  }, []);
  const addMaisonTask = useCallback(task => {
    setData(prev => {
      const next = clone(prev);
      if (!next.couple.maison) next.couple.maison = {
        checked: {},
        custom: [],
        lastReset: ''
      };
      next.couple.maison.custom = [...(next.couple.maison.custom || []), task];
      return next;
    });
  }, []);
  const deleteMaisonTask = useCallback(id => {
    setData(prev => {
      const next = clone(prev);
      if (next.couple.maison) next.couple.maison.custom = (next.couple.maison.custom || []).filter(t => t.id !== id);
      return next;
    });
  }, []);
  const resetMaisonChecked = useCallback(dateStr => {
    setData(prev => {
      const next = clone(prev);
      if (!next.couple.maison) next.couple.maison = {
        checked: {},
        custom: [],
        lastReset: ''
      };
      next.couple.maison.checked = {};
      next.couple.maison.lastReset = dateStr;
      return next;
    });
  }, []);
  const updateObjMensuel = useCallback((id, updates) => {
    setData(prev => {
      const next = clone(prev);
      const list = next.couple.objMensuels || [];
      const idx = list.findIndex(o => o.id === id);
      if (idx >= 0) Object.assign(list[idx], updates);
      return next;
    });
  }, []);
  const addObjMensuel = useCallback((titre, detail, cat, mois) => {
    setData(prev => {
      const next = clone(prev);
      if (!next.couple.objMensuels) next.couple.objMensuels = [];
      next.couple.objMensuels.push({
        id: Date.now().toString(),
        mois,
        annee: new Date().getFullYear(),
        titre,
        detail,
        categorie: cat,
        statut: 'en_cours',
        progress: 0
      });
      return next;
    });
  }, []);
  const deleteObjMensuel = useCallback(id => {
    setData(prev => {
      const next = clone(prev);
      next.couple.objMensuels = (next.couple.objMensuels || []).filter(o => o.id !== id);
      return next;
    });
  }, []);
  const {
    totalObj,
    totalDone,
    avgProgress,
    totalActions,
    actionsDone
  } = useMemo(() => {
    const totalObj = [...(data.dja?.objectives || []), ...(data.liika?.objectives || []), ...(data.couple?.objectives || [])];
    const totalDone = totalObj.filter(o => o.done).length;
    const avgProgress = totalObj.length ? Math.round(totalObj.reduce((s, o) => s + (o.progress || 0), 0) / totalObj.length) : 0;
    const totalActions = [...(data.dja?.actions || []), ...(data.liika?.actions || []), ...(data.couple?.actions || [])];
    const actionsDone = totalActions.filter(a => a.done).length;
    return {
      totalObj,
      totalDone,
      avgProgress,
      totalActions,
      actionsDone
    };
  }, [data]);
  const navItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: '◈'
  }, {
    id: 'dja',
    label: 'Dja',
    icon: '◆'
  }, {
    id: 'liika',
    label: 'Liika',
    icon: '◇'
  }, {
    id: 'couple',
    label: 'Couple',
    icon: '♡'
  }, {
    id: 'jeux',
    label: 'Jeux',
    icon: '🎮'
  }, {
    id: 'maison',
    label: 'Maison',
    icon: '🏠'
  }, {
    id: 'repas',
    label: 'Repas',
    icon: '🍽'
  }, {
    id: 'courses',
    label: 'Courses',
    icon: '🛒'
  }, {
    id: 'sport',
    label: 'Sport',
    icon: '💪'
  }, {
    id: 'budget',
    label: 'Budget',
    icon: '💰'
  }, {
    id: 'vision',
    label: 'Vision',
    icon: '✦'
  }, {
    id: 'planning',
    label: 'Planning',
    icon: '🗓'
  }, {
    id: 'drevmcook',
    label: 'DrevmCook',
    icon: '🌿'
  }, {
    id: 'survie',
    label: 'Survie',
    icon: '🪖'
  }, {
    id: 'culture',
    label: 'Culture GWA',
    icon: '🎭'
  }, {
    id: 'route',
    label: 'Route Liika',
    icon: '🚛'
  }, {
    id: 'coderousseau',
    label: 'REMC',
    icon: '🎓'
  }, {
    id: 'objmensuel',
    label: 'Objectifs mois',
    icon: '🎯'
  }, {
    id: 'calendar',
    label: 'Calendrier',
    icon: '📅'
  }, {
    id: 'media',
    label: 'Médias',
    icon: '🎬'
  }, {
    id: 'charts',
    label: 'Stats',
    icon: '▤'
  }];
  const renderPerson = who => {
    const person = data[who];
    const color = who;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "eyebrow",
      style: {
        marginBottom: 6
      }
    }, who === 'dja' ? '◆' : '◇', " Profil"), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 26,
        fontWeight: 600,
        fontFamily: "'Cormorant Garamond',serif",
        color: 'var(--text)',
        lineHeight: 1.1
      }
    }, person.name), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        color: 'var(--text3)',
        marginTop: 4
      }
    }, person.role, person.location ? ` · ${person.location}` : '')), /*#__PURE__*/React.createElement("div", {
      className: "person-actions",
      style: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setModal({
        type: 'objective',
        who
      }),
      style: {
        padding: '8px 16px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: `linear-gradient(135deg,${accent[who]},${accent[who]}cc)`,
        color: '#06120d',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '.04em'
      }
    }, "+ Objectif"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setModal({
        type: 'action',
        who
      }),
      style: {
        padding: '8px 16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: 'transparent',
        color: 'var(--text3)',
        cursor: 'pointer',
        fontSize: 12,
        transition: 'all .15s'
      }
    }, "+ Action"))), /*#__PURE__*/React.createElement("div", {
      className: "gold-rule",
      style: {
        marginBottom: 20
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gap: 12,
        marginBottom: 28
      }
    }, person.objectives.map(o => /*#__PURE__*/React.createElement(ObjectiveCard, {
      key: o.id,
      obj: o,
      color: color,
      onToggle: id => updateObj(who, id, {
        done: !o.done,
        progress: !o.done ? 100 : o.progress
      }),
      onProgress: (id, p) => updateObj(who, id, {
        progress: p,
        done: p >= 100
      }),
      onDelete: id => deleteObj(who, id)
    }))), /*#__PURE__*/React.createElement("p", {
      className: "eyebrow",
      style: {
        marginBottom: 12
      }
    }, "\u25B8 Actions"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gap: 8
      }
    }, person.actions.map(a => /*#__PURE__*/React.createElement(ActionItem, {
      key: a.id,
      action: a,
      color: color,
      onToggle: id => toggleAction(who, id)
    }))), /*#__PURE__*/React.createElement(NotesPanel, {
      who: who,
      notes: person.notes,
      onAdd: addNote,
      onDelete: deleteNote
    }));
  };
  const renderCouple = () => {
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "eyebrow",
      style: {
        marginBottom: 6
      }
    }, "\u2661 Lanmou"), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 26,
        fontWeight: 600,
        fontFamily: "'Cormorant Garamond',serif",
        color: 'var(--gold)',
        lineHeight: 1.1
      }
    }, "Dja & Liika"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        color: 'var(--text3)',
        marginTop: 4,
        fontFamily: "'Cormorant Garamond',serif",
        fontStyle: 'italic'
      }
    }, "Lanmou Douvan \u2014 Vision commune")), /*#__PURE__*/React.createElement("div", {
      className: "person-actions",
      style: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setModal({
        type: 'objective',
        who: 'couple'
      }),
      style: {
        padding: '8px 16px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: `linear-gradient(135deg,var(--gold),var(--gold2))`,
        color: '#06120d',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '.04em'
      }
    }, "+ Objectif"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setModal({
        type: 'action',
        who: 'couple'
      }),
      style: {
        padding: '8px 16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: 'transparent',
        color: 'var(--text3)',
        cursor: 'pointer',
        fontSize: 12
      }
    }, "+ Action"))), /*#__PURE__*/React.createElement("div", {
      className: "gold-rule",
      style: {
        marginBottom: 20
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gap: 12,
        marginBottom: 28
      }
    }, data.couple.objectives.map(o => /*#__PURE__*/React.createElement(ObjectiveCard, {
      key: o.id,
      obj: o,
      color: "couple",
      onToggle: id => updateObj('couple', id, {
        done: !o.done,
        progress: !o.done ? 100 : o.progress
      }),
      onProgress: (id, p) => updateObj('couple', id, {
        progress: p,
        done: p >= 100
      }),
      onDelete: id => deleteObj('couple', id)
    }))), /*#__PURE__*/React.createElement("p", {
      className: "eyebrow",
      style: {
        marginBottom: 12
      }
    }, "\u25B8 Actions"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gap: 8
      }
    }, data.couple.actions.map(a => /*#__PURE__*/React.createElement(ActionItem, {
      key: a.id,
      action: a,
      color: "couple",
      onToggle: id => toggleAction('couple', id)
    }))), /*#__PURE__*/React.createElement(NotesPanel, {
      who: "couple",
      notes: data.couple.notes,
      onAdd: addNote,
      onDelete: deleteNote
    }));
  };
  const renderDashboard = () => {
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "dash-hero",
      style: {
        background: 'var(--grad-hero)',
        borderRadius: 'var(--radius)',
        padding: '28px 28px 24px',
        marginBottom: 24,
        border: '1px solid var(--gold-border)',
        boxShadow: '0 12px 40px rgba(0,0,0,.5)',
        position: 'relative',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 240,
        height: 240,
        background: 'radial-gradient(circle,rgba(217,183,95,.10) 0%,transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "eyebrow",
      style: {
        marginBottom: 10
      }
    }, "\uD83C\uDF34 Lanmou Douvan \xB7 Guadeloupe"), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 30,
        fontWeight: 600,
        fontFamily: "'Cormorant Garamond',serif",
        marginBottom: 6,
        color: 'var(--text)',
        lineHeight: 1.2
      }
    }, "Tableau de bord"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        color: 'var(--text3)',
        marginBottom: 0
      }
    }, "Vue d'ensemble \u2014 Vision 2026-2036"), /*#__PURE__*/React.createElement(GuadeloupeMeteo, null), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16,
        height: 1,
        background: 'linear-gradient(90deg,var(--gold-border),transparent)'
      }
    })), (() => {
      const ideeJour = (data.couple || {}).ideeJour || {
        liste: [],
        custom: []
      };
      const allIdees = [...DEFAULT_IDEES, ...(ideeJour.custom || [])];
      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 864e5);
      const idee = allIdees.length ? allIdees[dayOfYear % allIdees.length] : {
        text: 'Prenez soin de vous aujourd\'hui ♡'
      };
      return /*#__PURE__*/React.createElement("div", {
        style: {
          background: 'linear-gradient(135deg,var(--bg3),var(--bg4))',
          borderRadius: 'var(--radius)',
          padding: '20px 24px',
          marginBottom: 24,
          border: '1px solid var(--gold-border)',
          boxShadow: 'var(--shadow)',
          position: 'relative',
          overflow: 'hidden'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'absolute',
          top: 0,
          right: 0,
          width: 140,
          height: 140,
          background: 'radial-gradient(circle,rgba(217,183,95,.08),transparent 70%)',
          borderRadius: '50%',
          transform: 'translate(35%,-35%)',
          pointerEvents: 'none'
        }
      }), /*#__PURE__*/React.createElement("div", {
        className: "eyebrow",
        style: {
          marginBottom: 10
        }
      }, "\u2728 Id\xE9e du jour"), /*#__PURE__*/React.createElement("p", {
        style: {
          fontSize: 18,
          fontFamily: "'Cormorant Garamond',serif",
          fontStyle: 'italic',
          color: 'var(--text)',
          lineHeight: 1.55,
          marginBottom: 14
        }
      }, idee.text), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap'
        }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => setView('planning'),
        style: {
          padding: '5px 14px',
          borderRadius: 20,
          border: '1px solid var(--gold-border)',
          background: 'transparent',
          color: 'var(--gold)',
          fontSize: 11,
          cursor: 'pointer',
          fontFamily: "'Space Mono',monospace",
          letterSpacing: '.04em'
        }
      }, "Voir planning \u2192"), /*#__PURE__*/React.createElement("button", {
        onClick: () => setView('drevmcook'),
        style: {
          padding: '5px 14px',
          borderRadius: 20,
          border: '1px solid var(--border2)',
          background: 'transparent',
          color: 'var(--text3)',
          fontSize: 11,
          cursor: 'pointer',
          fontFamily: "'Space Mono',monospace",
          letterSpacing: '.04em'
        }
      }, "\uD83C\uDF3F DrevmCook"), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          color: 'var(--text3)',
          marginLeft: 'auto',
          fontFamily: "'Space Mono',monospace"
        }
      }, today.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }))));
    })(), /*#__PURE__*/React.createElement("div", {
      className: "stat-grid",
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
        gap: 12,
        marginBottom: 28
      }
    }, /*#__PURE__*/React.createElement(StatCard, {
      label: "Progression moyenne",
      value: `${avgProgress}%`,
      color: "dja",
      icon: "\u25C8"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Objectifs termin\xE9s",
      value: `${totalDone}/${totalObj.length}`,
      color: "liika",
      icon: "\u2713"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Actions faites",
      value: `${actionsDone}/${totalActions.length}`,
      color: "couple",
      icon: "\u25B8"
    }), (() => {
      const totRev = ['dja', 'liika', 'couple'].reduce((s, w) => {
        const b = w === 'couple' ? data.couple.budget : data[w].budget;
        return s + (b?.revenus || []).reduce((a, r) => a + Number(r.montant), 0);
      }, 0);
      const totDep = ['dja', 'liika', 'couple'].reduce((s, w) => {
        const b = w === 'couple' ? data.couple.budget : data[w].budget;
        return s + (b?.depenses || []).reduce((a, d) => a + Number(d.montant), 0);
      }, 0);
      return /*#__PURE__*/React.createElement(StatCard, {
        label: "Balance totale",
        value: `${totRev - totDep >= 0 ? '+' : ''}${(totRev - totDep).toLocaleString('fr-FR')} €`,
        color: totRev - totDep >= 0 ? 'dja' : 'couple',
        icon: "\uD83D\uDCB0"
      });
    })()), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))',
        gap: 12,
        marginBottom: 28
      }
    }, ['dja', 'liika', 'couple'].map(w => {
      const v = w === 'couple' ? data.couple.vision : data[w].vision;
      const name = w === 'dja' ? data.dja.name : w === 'liika' ? data.liika.name : 'Couple';
      return v ? /*#__PURE__*/React.createElement("div", {
        key: w,
        onClick: () => setView('vision'),
        style: {
          background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
          borderRadius: 'var(--radius)',
          padding: 18,
          border: `1px solid ${accentBorder[w]}`,
          cursor: 'pointer',
          transition: 'all .2s',
          boxShadow: 'var(--shadow)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9,
          color: accent[w],
          letterSpacing: '.15em',
          textTransform: 'uppercase',
          marginBottom: 8,
          fontFamily: "'Space Mono',monospace"
        }
      }, "\u2726 Vision ", name), /*#__PURE__*/React.createElement("p", {
        style: {
          color: 'var(--text2)',
          lineHeight: 1.65,
          fontFamily: "'Cormorant Garamond',serif",
          fontStyle: 'italic',
          fontSize: 15,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }
      }, v)) : null;
    })), /*#__PURE__*/React.createElement("h3", {
      className: "eyebrow",
      style: {
        marginBottom: 16
      }
    }, "\u25C8 C\xF4te \xE0 c\xF4te"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))',
        gap: 16,
        marginBottom: 28
      }
    }, ['dja', 'liika'].map(who => {
      const p = data[who];
      const avg = p.objectives.length ? Math.round(p.objectives.reduce((s, o) => s + o.progress, 0) / p.objectives.length) : 0;
      const av = accent[who];
      return /*#__PURE__*/React.createElement("div", {
        key: who,
        style: {
          background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
          borderRadius: 'var(--radius)',
          padding: 20,
          border: `1px solid ${accentBorder[who]}`,
          boxShadow: 'var(--shadow)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 16,
          fontWeight: 600
        }
      }, p.name), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: 'var(--text3)'
        }
      }, p.role)), /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, /*#__PURE__*/React.createElement(ProgressRing, {
        pct: avg,
        size: 56,
        stroke: 5,
        color: av
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          position: 'absolute',
          fontSize: 13,
          fontWeight: 600
        }
      }, avg, "%"))), p.objectives.slice(0, 3).map(o => /*#__PURE__*/React.createElement("div", {
        key: o.id,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 6,
          height: 6,
          borderRadius: 3,
          background: o.done ? 'var(--success)' : av,
          minWidth: 6
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13,
          color: o.done ? 'var(--text3)' : 'var(--text)',
          flex: 1,
          textDecoration: o.done ? 'line-through' : 'none'
        }
      }, o.title), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: 'var(--text3)'
        }
      }, o.progress, "%"))), /*#__PURE__*/React.createElement("button", {
        onClick: () => setView(who),
        style: {
          marginTop: 12,
          width: '100%',
          padding: '8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border2)',
          background: 'transparent',
          color: 'var(--text2)',
          cursor: 'pointer',
          fontSize: 13
        }
      }, "Voir tout \u2192"));
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--bg2)',
        borderRadius: 'var(--radius)',
        padding: 20,
        border: '1px solid var(--accent-couple-border)',
        marginBottom: 28
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 600,
        marginBottom: 4
      }
    }, "Objectifs couple"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text3)',
        marginBottom: 16
      }
    }, "Lanmou Douvan \u2014 projets communs"), data.couple.objectives.map(o => /*#__PURE__*/React.createElement("div", {
      key: o.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 3,
        background: o.done ? 'var(--success)' : 'var(--accent-couple)',
        minWidth: 6
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: o.done ? 'var(--text3)' : 'var(--text)',
        flex: 1
      }
    }, o.title), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--text3)'
      }
    }, o.progress, "%"))), /*#__PURE__*/React.createElement("button", {
      onClick: () => setView('couple'),
      style: {
        marginTop: 12,
        width: '100%',
        padding: '8px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border2)',
        background: 'transparent',
        color: 'var(--text2)',
        cursor: 'pointer',
        fontSize: 13
      }
    }, "Voir tout \u2192")));
  };
  const renderCharts = () => {
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "eyebrow",
      style: {
        marginBottom: 8
      }
    }, "\u25A4 Donn\xE9es"), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 26,
        fontWeight: 600,
        fontFamily: "'Cormorant Garamond',serif",
        marginBottom: 4,
        color: 'var(--text)'
      }
    }, "Statistiques"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        color: 'var(--text3)',
        marginBottom: 24
      }
    }, "Progression par cat\xE9gorie et par personne"), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
        borderRadius: 'var(--radius)',
        padding: 20,
        marginBottom: 20,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)'
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "eyebrow",
      style: {
        marginBottom: 14
      }
    }, "Progression par cat\xE9gorie"), /*#__PURE__*/React.createElement(ChartPanel, {
      data: data
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))',
        gap: 16
      }
    }, ['dja', 'liika', 'couple'].map(who => {
      const label = who === 'dja' ? 'Dja' : who === 'liika' ? 'Liika' : 'Couple';
      return /*#__PURE__*/React.createElement("div", {
        key: who,
        style: {
          background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
          borderRadius: 'var(--radius)',
          padding: 20,
          border: `1px solid ${accentBorder[who]}`,
          boxShadow: 'var(--shadow)'
        }
      }, /*#__PURE__*/React.createElement("p", {
        className: "eyebrow",
        style: {
          marginBottom: 14,
          color: accent[who]
        }
      }, label), /*#__PURE__*/React.createElement(DoughnutPanel, {
        data: data,
        who: who
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginTop: 12,
          fontSize: 10,
          color: 'var(--text3)',
          fontFamily: "'Space Mono',monospace"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 7,
          height: 7,
          borderRadius: 2,
          background: 'var(--success)',
          display: 'inline-block'
        }
      }), " Fait"), /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 7,
          height: 7,
          borderRadius: 2,
          background: 'var(--accent-dja)',
          display: 'inline-block'
        }
      }), " En cours"), /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 7,
          height: 7,
          borderRadius: 2,
          background: 'var(--bg4)',
          display: 'inline-block'
        }
      }), " \xC0 faire")));
    })));
  };

  // ─── Route Liika ───
  const renderRoute = () => {
    const alertesActives = ALERTES_FATIGUE.filter(a => routeKm >= a.km);
    const prochaine = ALERTES_FATIGUE.find(a => routeKm < a.km);
    const pctRoute = Math.min(100, Math.round(routeKm / 600 * 100));
    const checkDone = Object.values(routeChecklist).filter(Boolean).length;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'linear-gradient(135deg,rgba(244,114,182,.08),rgba(167,139,250,.06))',
        borderRadius: 'var(--radius)',
        padding: '22px 24px',
        marginBottom: 20,
        border: '1px solid var(--accent-liika-border)',
        position: 'relative',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 160,
        height: 160,
        background: 'radial-gradient(circle,rgba(244,114,182,.08),transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }
    }), /*#__PURE__*/React.createElement("p", {
      className: "eyebrow",
      style: {
        marginBottom: 8,
        color: 'var(--accent-liika)'
      }
    }, "\uD83D\uDE9B S\xE9curit\xE9 & Bien-\xEAtre"), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 26,
        fontFamily: "'Cormorant Garamond',serif",
        fontWeight: 600,
        color: 'var(--text)',
        marginBottom: 4,
        lineHeight: 1.2
      }
    }, "Mode Route \u2014 Liika"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        color: 'var(--text3)',
        fontStyle: 'italic',
        fontFamily: "'Cormorant Garamond',serif"
      }
    }, "Pauses intelligentes, alertes fatigue, checklist d\xE9part \u2661")), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
        borderRadius: 'var(--radius)',
        padding: '20px 22px',
        marginBottom: 16,
        border: `1px solid ${pctRoute >= 92 ? 'var(--danger-border)' : pctRoute >= 67 ? 'var(--warn-border)' : 'var(--accent-liika-border)'}`,
        boxShadow: 'var(--shadow)'
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 11,
        color: 'var(--text3)',
        marginBottom: 10,
        fontFamily: "'Space Mono',monospace",
        letterSpacing: '.1em'
      }
    }, "KILOM\xC8TRES PARCOURUS AUJOURD'HUI"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 14,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 40,
        fontWeight: 700,
        color: pctRoute >= 92 ? 'var(--danger)' : pctRoute >= 67 ? 'var(--warn)' : 'var(--accent-liika)',
        fontFamily: "'Space Mono',monospace",
        lineHeight: 1
      }
    }, routeKm, " km"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setRouteKm(k => k + 50),
      style: {
        padding: '6px 14px',
        borderRadius: 'var(--radius-xs)',
        background: 'var(--accent-liika-bg)',
        color: 'var(--accent-liika)',
        border: '1px solid var(--accent-liika-border)',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600
      }
    }, "+50 km"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setRouteKm(k => Math.max(0, k - 50)),
      style: {
        padding: '6px 14px',
        borderRadius: 'var(--radius-xs)',
        background: 'var(--bg4)',
        color: 'var(--text3)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        fontSize: 12
      }
    }, "-50 km")), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setRouteKm(0);
        setRouteChecklist({});
      },
      style: {
        marginLeft: 'auto',
        padding: '8px 14px',
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        color: 'var(--text3)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        fontSize: 11,
        fontFamily: "'Space Mono',monospace"
      }
    }, "Reset journ\xE9e")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 8,
        background: 'var(--bg4)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        width: `${pctRoute}%`,
        background: pctRoute >= 92 ? 'linear-gradient(90deg,var(--warn),var(--danger))' : pctRoute >= 67 ? 'linear-gradient(90deg,var(--gold),var(--warn))' : 'linear-gradient(90deg,var(--accent-liika),var(--accent-liika2))',
        borderRadius: 4,
        transition: 'width .4s ease,background .4s ease'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10,
        color: 'var(--text3)',
        fontFamily: "'Space Mono',monospace"
      }
    }, /*#__PURE__*/React.createElement("span", null, "0 km"), /*#__PURE__*/React.createElement("span", null, "Limite : 600 km/jour")), prochaine && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        background: 'var(--bg4)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, "\uD83D\uDD50"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--text3)'
      }
    }, "Prochaine alerte : "), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text)'
      }
    }, prochaine.label)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--success)',
        fontFamily: "'Space Mono',monospace",
        fontWeight: 700
      }
    }, "dans ", prochaine.km - routeKm, " km"))), alertesActives.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "eyebrow",
      style: {
        marginBottom: 10
      }
    }, "\u26A0 Alertes en cours"), alertesActives.map((a, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: a.type === 'stop' ? 'var(--danger-bg)' : a.urgent ? 'var(--warn-bg)' : 'var(--bg3)',
        border: `1px solid ${a.type === 'stop' ? 'var(--danger-border)' : a.urgent ? 'var(--warn-border)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '14px 18px',
        marginBottom: 10,
        animation: 'alertPop .4s ease both'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 20
      }
    }, a.type === 'stop' ? '🛑' : a.urgent ? '⚠️' : '⏸️'), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 600,
        color: a.type === 'stop' ? 'var(--danger)' : a.urgent ? 'var(--warn)' : 'var(--text)',
        flex: 1
      }
    }, a.label), a.urgent && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontFamily: "'Space Mono',monospace",
        background: a.type === 'stop' ? 'var(--danger-bg)' : 'var(--warn-bg)',
        color: a.type === 'stop' ? 'var(--danger)' : 'var(--warn)',
        padding: '2px 8px',
        borderRadius: 8,
        border: `1px solid ${a.type === 'stop' ? 'var(--danger-border)' : 'var(--warn-border)'}`,
        animation: 'blink 1.5s infinite'
      }
    }, "ACTIF")), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12,
        color: 'var(--text2)',
        lineHeight: 1.65
      }
    }, a.detail)))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
        borderRadius: 'var(--radius)',
        padding: '18px 20px',
        marginBottom: 16,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)'
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "eyebrow",
      style: {
        marginBottom: 4,
        color: 'var(--success)'
      }
    }, "\uD83E\uDDD8 Routine pause \u2014 10 min"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12,
        color: 'var(--text3)',
        marginBottom: 14,
        fontFamily: "'Cormorant Garamond',serif",
        fontStyle: 'italic'
      }
    }, "Prot\xE8ge ton corps sur la longue distance"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gap: 8
      }
    }, ETIREMENTS_PAUSE.map((e, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: 'var(--bg4)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 16,
        minWidth: 22
      }
    }, "\uD83D\uDCAA"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text)'
      }
    }, e.nom), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--text3)'
      }
    }, e.detail)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontFamily: "'Space Mono',monospace",
        color: 'var(--accent-liika)',
        background: 'var(--accent-liika-bg)',
        padding: '3px 10px',
        borderRadius: 10,
        flexShrink: 0
      }
    }, e.duree))))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
        borderRadius: 'var(--radius)',
        padding: '18px 20px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)'
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "eyebrow",
      style: {
        marginBottom: 4,
        color: 'var(--gold)'
      }
    }, "\u2705 Checklist d\xE9part"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12,
        color: 'var(--text3)',
        marginBottom: 14,
        fontFamily: "'Cormorant Garamond',serif",
        fontStyle: 'italic'
      }
    }, "\xC0 cocher avant chaque prise de route"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gap: 8,
        marginBottom: 14
      }
    }, CHECKLIST_DEPART.map(item => /*#__PURE__*/React.createElement("div", {
      key: item.id,
      onClick: () => setRouteChecklist(p => ({
        ...p,
        [item.id]: !p[item.id]
      })),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        background: routeChecklist[item.id] ? 'rgba(74,222,128,.05)' : 'var(--bg4)',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${routeChecklist[item.id] ? 'rgba(74,222,128,.25)' : 'var(--border)'}`,
        cursor: 'pointer',
        transition: 'all .2s',
        opacity: routeChecklist[item.id] ? .7 : 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 20,
        height: 20,
        borderRadius: 6,
        border: routeChecklist[item.id] ? 'none' : '2px solid var(--border2)',
        background: routeChecklist[item.id] ? 'var(--success)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all .2s'
      }
    }, routeChecklist[item.id] && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--bg)',
        fontSize: 12,
        fontWeight: 700
      }
    }, "\u2713")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        textDecoration: routeChecklist[item.id] ? 'line-through' : 'none',
        color: routeChecklist[item.id] ? 'var(--text3)' : 'var(--text)',
        transition: 'all .2s'
      }
    }, item.text)))), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 5,
        background: 'var(--bg4)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        width: `${checkDone / CHECKLIST_DEPART.length * 100}%`,
        background: 'linear-gradient(90deg,var(--gold),var(--gold2))',
        borderRadius: 4,
        transition: 'width .4s'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        color: 'var(--text3)',
        fontFamily: "'Space Mono',monospace"
      }
    }, /*#__PURE__*/React.createElement("span", null, checkDone, "/", CHECKLIST_DEPART.length, " coch\xE9s"), checkDone === CHECKLIST_DEPART.length && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--success)',
        fontWeight: 700
      }
    }, "Pr\xEAte \xE0 partir \uD83D\uDE9B"))));
  };

  // ─── Objectifs mensuels ───
  const renderObjMensuel = () => {
    const annee = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const objDuMois = (data.couple.objMensuels || []).filter(o => o.mois === objMoisFilter && o.annee === annee);
    const STATUTS = {
      en_cours: {
        label: 'En cours',
        color: 'var(--gold)'
      },
      termine: {
        label: 'Terminé ✓',
        color: 'var(--success)'
      },
      reporte: {
        label: 'Reporté',
        color: 'var(--text3)'
      }
    };
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'linear-gradient(135deg,rgba(217,183,95,.09),rgba(74,222,128,.05))',
        borderRadius: 'var(--radius)',
        padding: '22px 24px',
        marginBottom: 20,
        border: '1px solid var(--gold-border)',
        position: 'relative',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 160,
        height: 160,
        background: 'radial-gradient(circle,rgba(217,183,95,.08),transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }
    }), /*#__PURE__*/React.createElement("p", {
      className: "eyebrow",
      style: {
        marginBottom: 8
      }
    }, "\uD83C\uDFAF Vision mensuelle"), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 26,
        fontFamily: "'Cormorant Garamond',serif",
        fontWeight: 600,
        color: 'var(--text)',
        marginBottom: 4,
        lineHeight: 1.2
      }
    }, "Objectifs du mois"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        color: 'var(--text3)',
        fontStyle: 'italic',
        fontFamily: "'Cormorant Garamond',serif"
      }
    }, "Ce qu'on construit ensemble, mois apr\xE8s mois \u2661")), /*#__PURE__*/React.createElement("div", {
      className: "scroll-x",
      style: {
        display: 'flex',
        gap: 6,
        marginBottom: 20,
        paddingBottom: 4
      }
    }, MOIS_LABELS.map((m, i) => /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => setObjMoisFilter(i),
      style: {
        flexShrink: 0,
        padding: '6px 12px',
        borderRadius: 20,
        border: `1px solid ${objMoisFilter === i ? 'var(--gold)' : 'var(--border)'}`,
        background: objMoisFilter === i ? 'var(--gold-bg)' : 'transparent',
        color: objMoisFilter === i ? 'var(--gold)' : 'var(--text3)',
        fontSize: 11,
        fontWeight: objMoisFilter === i ? 700 : 400,
        cursor: 'pointer',
        fontFamily: "'Space Mono',monospace",
        whiteSpace: 'nowrap',
        transition: 'all .2s'
      }
    }, m, i === currentMonth ? /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 3,
        fontSize: 8,
        opacity: .7
      }
    }, "\u25CF") : null))), objDuMois.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        gap: 10,
        marginBottom: 20
      }
    }, [{
      l: 'Total',
      v: objDuMois.length,
      c: 'var(--text2)'
    }, {
      l: 'Terminés',
      v: objDuMois.filter(o => o.statut === 'termine').length,
      c: 'var(--success)'
    }, {
      l: 'En cours',
      v: objDuMois.filter(o => o.statut === 'en_cours').length,
      c: 'var(--gold)'
    }].map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: 'var(--bg3)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        border: '1px solid var(--border)',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 700,
        color: s.c,
        fontFamily: "'Space Mono',monospace"
      }
    }, s.v), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: 'var(--text3)',
        fontFamily: "'Space Mono',monospace",
        marginTop: 2
      }
    }, s.l)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gap: 12,
        marginBottom: 16
      }
    }, objDuMois.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        padding: '32px 20px',
        color: 'var(--text3)',
        fontSize: 15,
        fontFamily: "'Cormorant Garamond',serif",
        fontStyle: 'italic'
      }
    }, "Aucun objectif pour ", MOIS_LABELS[objMoisFilter], ".", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12
      }
    }, "Ajoutez le premier objectif de ce mois \u2193")), objDuMois.map((obj, i) => {
      const st = STATUTS[obj.statut] || STATUTS.en_cours;
      return /*#__PURE__*/React.createElement("div", {
        key: obj.id,
        style: {
          background: 'linear-gradient(160deg,var(--bg3),var(--bg2))',
          borderRadius: 'var(--radius)',
          padding: '16px 18px',
          border: `1px solid ${obj.statut === 'termine' ? 'rgba(74,222,128,.25)' : 'var(--border)'}`,
          borderLeft: `3px solid ${st.color}`,
          boxShadow: 'var(--shadow)',
          animation: `fadeUp .3s ease ${i * .06}s both`
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 7,
          marginBottom: 6,
          flexWrap: 'wrap'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          fontFamily: "'Space Mono',monospace",
          color: 'var(--gold)',
          background: 'var(--gold-bg)',
          padding: '2px 8px',
          borderRadius: 8,
          border: '1px solid var(--gold-border)'
        }
      }, obj.categorie), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          fontFamily: "'Space Mono',monospace",
          color: st.color,
          background: st.color + '18',
          padding: '2px 8px',
          borderRadius: 8
        }
      }, st.label)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: obj.detail ? 3 : 0
        }
      }, obj.titre), obj.detail && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: 'var(--text3)',
          fontStyle: 'italic'
        }
      }, obj.detail)), /*#__PURE__*/React.createElement("button", {
        onClick: () => deleteObjMensuel(obj.id),
        style: {
          background: 'none',
          border: 'none',
          color: 'var(--text3)',
          cursor: 'pointer',
          fontSize: 16,
          padding: '2px 4px',
          flexShrink: 0
        }
      }, "\xD7")), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("input", {
        type: "range",
        min: "0",
        max: "100",
        step: "10",
        value: obj.progress,
        onChange: e => {
          const v = parseInt(e.target.value);
          updateObjMensuel(obj.id, {
            progress: v,
            statut: v >= 100 ? 'termine' : 'en_cours'
          });
        },
        style: {
          flex: 1,
          height: 4,
          accentColor: st.color,
          cursor: 'pointer'
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          fontWeight: 700,
          color: obj.statut === 'termine' ? 'var(--success)' : 'var(--gold)',
          fontFamily: "'Space Mono',monospace",
          minWidth: 34
        }
      }, obj.progress, "%"), /*#__PURE__*/React.createElement("button", {
        onClick: () => updateObjMensuel(obj.id, {
          statut: obj.statut === 'termine' ? 'en_cours' : 'termine',
          progress: obj.statut === 'termine' ? obj.progress : 100
        }),
        style: {
          fontSize: 10,
          fontFamily: "'Space Mono',monospace",
          background: 'var(--bg4)',
          border: '1px solid var(--border2)',
          borderRadius: 'var(--radius-xs)',
          padding: '4px 10px',
          cursor: 'pointer',
          color: 'var(--text2)',
          whiteSpace: 'nowrap'
        }
      }, obj.statut === 'termine' ? 'Réactiver' : 'Marquer fait')));
    })), showAddObjM ? /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--bg3)',
        borderRadius: 'var(--radius)',
        padding: 18,
        border: '1px solid var(--gold-border)'
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "eyebrow",
      style: {
        marginBottom: 12,
        color: 'var(--gold)'
      }
    }, "+ Objectif \u2014 ", MOIS_LABELS[objMoisFilter]), /*#__PURE__*/React.createElement("input", {
      placeholder: "Titre de l'objectif",
      value: newObjM.titre,
      onChange: e => setNewObjM(p => ({
        ...p,
        titre: e.target.value
      })),
      style: {
        width: '100%',
        padding: '9px 12px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border2)',
        background: 'var(--bg2)',
        color: 'var(--text)',
        fontSize: 13,
        marginBottom: 8,
        outline: 'none'
      }
    }), /*#__PURE__*/React.createElement("input", {
      placeholder: "D\xE9tails (optionnel)",
      value: newObjM.detail,
      onChange: e => setNewObjM(p => ({
        ...p,
        detail: e.target.value
      })),
      style: {
        width: '100%',
        padding: '9px 12px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border2)',
        background: 'var(--bg2)',
        color: 'var(--text)',
        fontSize: 13,
        marginBottom: 12,
        outline: 'none'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "scroll-x",
      style: {
        display: 'flex',
        gap: 6,
        marginBottom: 14,
        paddingBottom: 4
      }
    }, CATS_OBJ_MENSUEL.map(c => /*#__PURE__*/React.createElement("button", {
      key: c,
      onClick: () => setNewObjM(p => ({
        ...p,
        categorie: c
      })),
      style: {
        flexShrink: 0,
        padding: '5px 12px',
        borderRadius: 20,
        border: `1px solid ${newObjM.categorie === c ? 'var(--gold)' : 'var(--border)'}`,
        background: newObjM.categorie === c ? 'var(--gold-bg)' : 'transparent',
        color: newObjM.categorie === c ? 'var(--gold)' : 'var(--text3)',
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: "'Space Mono',monospace"
      }
    }, c))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setShowAddObjM(false);
        setNewObjM({
          titre: '',
          detail: '',
          categorie: 'Nature'
        });
      },
      style: {
        flex: 1,
        padding: '9px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: 'transparent',
        color: 'var(--text3)',
        cursor: 'pointer',
        fontSize: 13
      }
    }, "Annuler"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        if (!newObjM.titre.trim()) return;
        addObjMensuel(newObjM.titre, newObjM.detail, newObjM.categorie, objMoisFilter);
        setNewObjM({
          titre: '',
          detail: '',
          categorie: 'Nature'
        });
        setShowAddObjM(false);
      },
      style: {
        flex: 2,
        padding: '9px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: 'linear-gradient(135deg,var(--gold),var(--gold2))',
        color: '#06120d',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 700
      }
    }, "Ajouter"))) : /*#__PURE__*/React.createElement("button", {
      onClick: () => setShowAddObjM(true),
      style: {
        width: '100%',
        padding: '12px',
        borderRadius: 'var(--radius-sm)',
        border: '1px dashed var(--gold-border)',
        background: 'transparent',
        color: 'var(--gold)',
        cursor: 'pointer',
        fontSize: 13,
        fontFamily: "'Space Mono',monospace",
        letterSpacing: '.04em'
      }
    }, "+ Ajouter un objectif pour ", MOIS_LABELS[objMoisFilter]));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "app-layout"
  }, /*#__PURE__*/React.createElement("nav", {
    className: "app-sidebar",
    style: {
      background: 'var(--glass)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRight: '1px solid var(--gold-border)',
      padding: '28px 0',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px',
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond',serif",
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '.01em',
      lineHeight: 1.15
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gold)'
    }
  }, "Lanmou"), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text)'
    }
  }, "Douvan")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      height: 1,
      background: 'linear-gradient(90deg,var(--gold-border),transparent)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: 'var(--gold-bg)',
      border: '1px solid var(--gold-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      flexShrink: 0
    }
  }, '❤'), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--text)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, 'Dja & Liika'), /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      opacity: .55,
      marginTop: 1
    }
  }, 'Tableau de bord')))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto'
    }
  }, CATEGORIES.flatMap(cat=>{
    const isCatActive=activeCat===cat.id;
    const items=[
      React.createElement('button',{
        key:'cat-'+cat.id,
        onClick:()=>goToCategory(cat.id),
        className:'cat-nav-btn'+(isCatActive?' active':'')
      },
        React.createElement('span',{className:'cat-nav-emoji'},cat.emoji),
        React.createElement('span',null,cat.label)
      )
    ];
    if(isCatActive){
      cat.views.forEach(v=>items.push(
        React.createElement('button',{
          key:'sv-'+v.id,
          onClick:()=>setView(v.target||v.id),
          className:'cat-subview-btn'+(view===(v.target||v.id)?' active':'')
        },
          React.createElement('span',null,v.icon),
          React.createElement('span',null,' '+v.label)
        )
      ));
    }
    return items;
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '7px 10px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--gold-border)',
      background: 'var(--gold-bg)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, "\uD83D\uDDC4"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--gold)',
      flex: 1,
      letterSpacing: '.03em'
    }
  }, "Supabase"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 600,
      fontFamily: "'Space Mono',monospace",
      color: syncStatus === 'ok' ? 'var(--success)' : syncStatus === 'error' ? '#f87171' : syncStatus === 'syncing' ? 'var(--gold)' : 'var(--text3)'
    }
  }, syncStatus === 'ok' ? '✓ sync' : syncStatus === 'error' ? '✗ err' : syncStatus === 'syncing' ? 'sync…' : 'idle'), onlineCount > 0 && /*#__PURE__*/React.createElement("span", {
    title: `${onlineCount} appareil(s) connecté(s)`,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      fontSize: 9,
      fontFamily: "'Space Mono',monospace",
      color: 'var(--success)',
      background: 'var(--success-bg)',
      padding: '1px 6px',
      borderRadius: 8,
      marginLeft: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: 'var(--success)',
      display: 'inline-block',
      animation: 'pulse 2s infinite'
    }
  }), onlineCount)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (confirm('Réinitialiser toutes les données ?')) {
        localStorage.removeItem('dja-liika-goals');
        setData(defaultData);
      }
    },
    style: {
      width: '100%',
      padding: '7px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--text3)',
      cursor: 'pointer',
      fontSize: 11,
      letterSpacing: '.03em'
    }
  }, "R\xE9initialiser"))), React.createElement('nav',{className:'cat-mobile-nav'},
    React.createElement('div',{className:'cat-mobile-nav-inner'},
      CATEGORIES.map(cat=>React.createElement('button',{
        key:cat.id,
        onClick:()=>goToCategory(cat.id),
        className:'cat-mobile-btn'+(activeCat===cat.id?' active':'')
      },
        React.createElement('span',{className:'cat-m-emoji'},cat.emoji),
        React.createElement('span',{className:'cat-m-label'},cat.label)
      ))
    )
  ), React.createElement("main", {className:"app-main"},
    view !== null && React.createElement('button',{
      className:'view-back-btn',
      onClick:()=>setView(null)
    },'← Retour'),
    !view && React.createElement(CategoryHome,{
      catIdx:CATEGORIES.findIndex(c=>c.id===activeCat),
      prevCatIdx,
      setView,
      goToCategory
    }),
    view === 'dashboard' && renderDashboard(),
    view === 'dja' && renderPerson('dja'),
    view === 'liika' && renderPerson('liika'),
    view === 'couple' && renderCouple(),
    view === 'jeux' && React.createElement(JeuxView,{games:data.games,updateGames}),
    view === 'maison' && React.createElement(MaisonView,{maison:(data.couple||{}).maison,toggleMaisonTask,addMaisonTask,deleteMaisonTask,resetMaisonChecked}),
    view === 'repas' && React.createElement(MealsView,{data,upsertMeal,deleteMeal}),
    view === 'courses' && React.createElement(CoursesView,{courses:data.courses||[],addCourse,upsertCourse,deleteCourse,toggleCourse,clearChecked:clearCheckedCourses,generateFromMeals:generateCoursesFromMeals,mergeDuplicates:mergeDuplicateCourses}),
    view === 'sport' && React.createElement(SportView,{data,upsertSport,deleteSport}),
    view === 'budget' && React.createElement(BudgetView,{data,upsertBudgetLine,deleteBudgetLine}),
    view === 'vision' && React.createElement(VisionView,{data,updateVision}),
    view === 'planning' && React.createElement(PlanningView,{planning:(data.couple||{}).planning||{},togglePlanningCheck,addPlanningCustomItem,deletePlanningCustomItem}),
    view === 'drevmcook' && React.createElement(DrevmCookView,{ferments:data.ferments||[],upsertFerment,deleteFerment,recipes:data.recipes||[],upsertRecipe,deleteRecipe,importRecipes}),
    view === 'culture' && React.createElement(CultureGwadView,null),
    view === 'route' && renderRoute(),
    view === 'coderousseau' && React.createElement(CodeRousseauView,{codeRousseau:(data.liika||{}).codeRousseau,updateCodeRousseau}),
    view === 'objmensuel' && renderObjMensuel(),
    view === 'calendar' && React.createElement(CalendarView,{data}),
    view === 'survie' && React.createElement(SurvieView,{survie:(data.couple||{}).survie||{},updateSurvie,ferments:data.ferments||[],addCourse}),
    view === 'media' && React.createElement(MediaView,{media:data.media||[],addMedia,deleteMedia}),
    view === 'charts' && renderCharts(),
    view === 'sortie' && React.createElement(SortieView,null),
    view === 'album' && React.createElement(AlbumView,{album:data.album||[],addAlbumPhoto,deleteAlbumPhoto}),
    view === 'idees' && React.createElement(IdeesView,null),
    view === 'medical' && React.createElement(MedicalView,{rdvs:data.couple.medical||[],addMedical,deleteMedical}),
    view === 'potager' && React.createElement(PotagerView,{plantes:(data.couple||{}).potager||[],addPlante,updatePlante,deletePlante}),
    view === 'voyages' && React.createElement(VoyagesView,null),
    view === 'artiste' && React.createElement(ArtView,null)
  ), /*#__PURE__*/React.createElement(AddModal, {
    show: !!modal,
    onClose: () => setModal(null),
    type: modal?.type,
    color: modal?.who,
    onAdd: (t, d, c) => {
      if (modal.type === 'objective') addObjective(modal.who, t, d, c);else addAction(modal.who, t, d, c);
    }
  }), showMotivation && React.createElement(MotivationToast, {
    message: motivationMsg,
    onClose: () => setShowMotivation(false)
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
