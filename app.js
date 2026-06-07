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
async function sbLoad() {
  const {
    data,
    error
  } = await sb.from('app_state').select('data').eq('id', 'main').single();
  if (error || !data || !data.data) throw error || new Error('no data');
  return normalize(data.data);
}
async function sbSave(d) {
  const {
    error
  } = await sb.from('app_state').upsert({
    id: 'main',
    data: d,
    updated_at: new Date().toISOString(),
    device_id: DEVICE_ID
  });
  if (error) throw error;
}
async function sbGetPin(accountId) {
  try {
    const {
      data,
      error
    } = await sb.from('user_accounts').select('pin').eq('id', accountId).single();
    if (error || !data || !data.pin) return null;
    return data.pin;
  } catch (_) {
    return null;
  }
}
async function sbSavePin(accountId, pin) {
  try {
    await sb.from('user_accounts').upsert({
      id: accountId,
      pin,
      updated_at: new Date().toISOString()
    });
  } catch (_) {}
}

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
    role: "Independante transport PL",
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
    maison: {
      checked: {},
      custom: [],
      lastReset: ''
    },
    objMensuels: []
  },
  recipes: [],
  ferments: [],
  games: {
    chess: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', lastBy: '', result: '' },
    crossword: { filled: {}, done: false },
    streak: { count: 0, lastDay: '' },
    badges: []
  }
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
  return base;
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
      fontSize: 14,
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
  return ev;
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
  const [opts, setOpts] = useState({ ferments: true, objMensuels: true, meals: false, sport: false });
  const sources = [
    { key: 'ferments', label: 'Ferments (date « prêt »)', icon: '🫙' },
    { key: 'objMensuels', label: 'Objectifs du mois', icon: '🎯' },
    { key: 'meals', label: 'Repas hebdo (récurrent)', icon: '🍽' },
    { key: 'sport', label: 'Sport hebdo (récurrent)', icon: '💪' }
  ];
  const events = useMemo(() => buildIcsEvents(data, opts), [data, opts]);
  const toggle = key => setOpts(prev => ({ ...prev, [key]: !prev[key] }));
  const exportIcs = () => {
    if (!events.length) { alert('Aucun événement à exporter. Active au moins une source avec des données datées.'); return; }
    const blob = new Blob([eventsToIcs(events)], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'lanmou-douvan.ics'; a.click();
    URL.revokeObjectURL(url);
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

// ─── Auth — Comptes & Login ───
const ACCOUNTS = [{
  id: 'dja',
  name: 'Negus Dja',
  sub: 'Compte principal',
  icon: '◆',
  accent: 'var(--accent-dja)',
  accentBg: 'var(--accent-dja-bg)',
  accentBorder: 'var(--accent-dja-border)',
  grad: 'linear-gradient(135deg,rgba(167,139,250,.14),rgba(139,92,246,.06))'
}, {
  id: 'liika',
  name: 'Purple Moon',
  sub: 'Liika',
  icon: '◇',
  accent: 'var(--accent-liika)',
  accentBg: 'var(--accent-liika-bg)',
  accentBorder: 'var(--accent-liika-border)',
  grad: 'linear-gradient(135deg,rgba(244,114,182,.14),rgba(236,72,153,.06))'
}];
function PinDots({
  count
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'center',
      margin: '6px 0'
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: count > i ? 'var(--gold)' : 'transparent',
      border: `2px solid ${count > i ? 'var(--gold)' : 'var(--border2)'}`,
      transition: 'all .2s'
    }
  })));
}
function LoginScreen({
  onLogin
}) {
  const [sel, setSel] = useState(null);
  const [step, setStep] = useState('pick');
  const [digits, setDigits] = useState([]);
  const [first, setFirst] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const acc = ACCOUNTS.find(a => a.id === sel);
  const doShake = msg => {
    setErr(msg);
    setShake(true);
    setDigits([]);
    setTimeout(() => setShake(false), 500);
  };
  const doLogin = (a, s) => {
    localStorage.setItem('ld-session', JSON.stringify(s));
    localStorage.setItem('ld-username', a.name);
    onLogin(s);
  };
  const handleDigit = d => {
    if (digits.length >= 4 || loading) return;
    const next = [...digits, d];
    setDigits(next);
    if (next.length === 4) {
      const pin = next.join('');
      setTimeout(async () => {
        const key = `ld-pin-${sel}`;
        const stored = localStorage.getItem(key);
        if (step === 'pin') {
          if (pin === stored) {
            doLogin(acc, {
              id: sel,
              name: acc.name,
              loggedAt: Date.now()
            });
            return;
          }

          // Fallback distant : évite les faux "code incorrect" quand le PIN local est périmé.
          setLoading(true);
          const remote = await sbGetPin(sel);
          setLoading(false);
          if (remote && pin === remote) {
            localStorage.setItem(key, remote);
            doLogin(acc, {
              id: sel,
              name: acc.name,
              loggedAt: Date.now()
            });
          } else doShake('Code incorrect, réessaie');
        } else if (step === 'create') {
          setFirst(pin);
          setDigits([]);
          setStep('confirm');
          setErr('');
        } else if (step === 'confirm') {
          if (pin === first) {
            localStorage.setItem(`ld-pin-${sel}`, pin);
            sbSavePin(sel, pin);
            doLogin(acc, {
              id: sel,
              name: acc.name,
              loggedAt: Date.now()
            });
          } else doShake('Les codes ne correspondent pas');
        }
      }, 150);
    }
  };
  const del = () => setDigits(d => d.slice(0, -1));
  const selectAcc = async id => {
    setSel(id);
    setDigits([]);
    setFirst('');
    setErr('');
    const local = localStorage.getItem(`ld-pin-${id}`);
    if (local) {
      setStep('pin');
      return;
    }
    // Pas de PIN local → cherche sur Supabase
    setLoading(true);
    setStep('loading');
    const remote = await sbGetPin(id);
    setLoading(false);
    if (remote) {
      localStorage.setItem(`ld-pin-${id}`, remote);
      setStep('pin');
    } else setStep('create');
  };
  const pinTitle = step === 'create' ? 'Crée ton code PIN (4 chiffres)' : step === 'confirm' ? 'Confirme ton code PIN' : 'Entre ton code PIN';
  const pinSub = step === 'create' ? 'Premier accès sur cet appareil' : step === 'confirm' ? 'Répète le même code' : 'Synchronisé avec Supabase ☁';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 800px 500px at 80% -10%,rgba(217,183,95,.07),transparent),radial-gradient(ellipse 600px 500px at -10% 90%,rgba(74,222,128,.05),transparent),var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      overflow: 'hidden',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -80,
      right: -80,
      width: 300,
      height: 300,
      background: 'radial-gradient(circle,rgba(217,183,95,.07),transparent 70%)',
      borderRadius: '50%',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -60,
      left: -60,
      width: 240,
      height: 240,
      background: 'radial-gradient(circle,rgba(74,222,128,.05),transparent 70%)',
      borderRadius: '50%',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: sel ? 28 : 44,
      animation: 'fadeUp .6s ease both',
      transition: 'margin .3s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginBottom: 10,
      letterSpacing: '.22em'
    }
  }, "\uD83C\uDF34 Guadeloupe \xB7 Mix Vibz"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond',serif",
      lineHeight: 1.1,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gold)',
      fontSize: sel ? 30 : 46,
      fontWeight: 700,
      display: 'block',
      transition: 'font-size .3s'
    }
  }, "Lanmou"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text)',
      fontSize: sel ? 26 : 40,
      fontWeight: 400,
      display: 'block',
      transition: 'font-size .3s'
    }
  }, "Douvan")), /*#__PURE__*/React.createElement("div", {
    className: "gold-rule",
    style: {
      maxWidth: 180,
      margin: '10px auto 0'
    }
  })), step === 'pick' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginBottom: 20,
      textAlign: 'center',
      letterSpacing: '.2em'
    }
  }, "Qui est l\xE0 ?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))',
      gap: 14,
      width: '100%',
      maxWidth: 420
    }
  }, ACCOUNTS.map((a, i) => /*#__PURE__*/React.createElement("button", {
    key: a.id,
    onClick: () => selectAcc(a.id),
    style: {
      background: a.grad,
      borderRadius: 'var(--radius)',
      padding: '30px 18px',
      border: `1px solid ${a.accentBorder}`,
      cursor: 'pointer',
      textAlign: 'center',
      boxShadow: 'var(--shadow)',
      animation: `fadeUp .5s ease ${i * .1}s both`,
      transition: 'transform .2s,box-shadow .2s'
    },
    onMouseEnter: e => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,.55)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = 'var(--shadow)';
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 38,
      marginBottom: 12
    }
  }, a.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond',serif",
      fontSize: 22,
      fontWeight: 600,
      color: a.accent,
      marginBottom: 5
    }
  }, a.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--text3)',
      fontFamily: "'Space Mono',monospace",
      letterSpacing: '.1em'
    }
  }, a.sub))))), step === 'loading' && acc && /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 300,
      animation: 'fadeUp .4s ease both',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: acc.grad,
      borderRadius: 'var(--radius)',
      padding: '16px 18px',
      border: `1px solid ${acc.accentBorder}`,
      marginBottom: 24,
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 26
    }
  }, acc.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond',serif",
      fontSize: 19,
      fontWeight: 600,
      color: acc.accent
    }
  }, acc.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--gold)',
      fontSize: 13,
      animation: 'pulse 1.2s infinite'
    }
  }, "\u2601 V\xE9rification du compte\u2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 11,
      color: 'var(--text3)',
      fontFamily: "'Space Mono',monospace"
    }
  }, "Connexion \xE0 Supabase")), step !== 'pick' && step !== 'loading' && acc && /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 300,
      animation: 'fadeUp .4s ease both'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: acc.grad,
      borderRadius: 'var(--radius)',
      padding: '16px 18px',
      border: `1px solid ${acc.accentBorder}`,
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 26
    }
  }, acc.icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond',serif",
      fontSize: 19,
      fontWeight: 600,
      color: acc.accent
    }
  }, acc.name), /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      color: acc.accent,
      opacity: .65,
      marginTop: 2
    }
  }, pinTitle), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--text3)',
      marginTop: 3,
      fontFamily: "'Space Mono',monospace"
    }
  }, pinSub))), err && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      color: 'var(--danger)',
      fontSize: 12,
      marginBottom: 10,
      animation: 'alertPop .3s ease both'
    }
  }, err), /*#__PURE__*/React.createElement("div", {
    style: {
      animation: shake ? 'alertPop .4s ease both' : 'none'
    }
  }, /*#__PURE__*/React.createElement(PinDots, {
    count: digits.length
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 9,
      marginTop: 14
    }
  }, [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => d === '' ? null : d === '⌫' ? del() : handleDigit(String(d)),
    disabled: d === '' || loading,
    style: {
      height: 58,
      borderRadius: 'var(--radius-sm)',
      border: d === '' ? 'none' : `1px solid var(--border2)`,
      background: d === '' ? 'transparent' : digits.length === 4 ? 'var(--bg2)' : 'var(--bg3)',
      color: 'var(--text)',
      fontSize: d === '⌫' ? 20 : 22,
      fontWeight: 600,
      cursor: d === '' || loading ? 'default' : 'pointer',
      opacity: d === '' ? 0 : 1,
      transition: 'background .12s'
    },
    onMouseEnter: e => {
      if (d !== '' && !loading) e.currentTarget.style.background = 'var(--bg4)';
    },
    onMouseLeave: e => {
      if (d !== '') e.currentTarget.style.background = 'var(--bg3)';
    }
  }, d))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSel(null);
      setStep('pick');
      setDigits([]);
      setErr('');
      setFirst('');
    },
    style: {
      width: '100%',
      marginTop: 16,
      background: 'none',
      border: 'none',
      color: 'var(--text3)',
      cursor: 'pointer',
      fontSize: 11,
      fontFamily: "'Space Mono',monospace",
      letterSpacing: '.08em',
      padding: '8px 0'
    }
  }, "\u2190 Changer de compte")));
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

// ─── Main App ───
function App(){
const vw=useWindowWidth();
const isMobile=vw<=768;
const isTablet=vw>768&&vw<=1024;
const isSmall=vw<=1024;
const [data,setData]=useState(loadData);
const [ui,setUI]=useState(loadUI);
const [session,setSession]=useState(()=>{
  try{return JSON.parse(localStorage.getItem('ld-session')||'null');}
  catch(_){return null;}
});
const [view,setView]=useState('dashboard');
const [modal,setModal]=useState(null);
const [syncStatus,setSyncStatus]=useState('idle'); // idle | syncing | ok | error
const [initialSyncDone,setInitialSyncDone]=useState(false);
const [onlineCount,setOnlineCount]=useState(0); // nb d'appareils connectés (présence)
// État de la vue "Objectifs du mois" (perdu lors d'une fusion, restauré ici au niveau App)
const [objMoisFilter,setObjMoisFilter]=useState(()=>new Date().getMonth());
const [showAddObjM,setShowAddObjM]=useState(false);
const [newObjM,setNewObjM]=useState({titre:'',detail:'',categorie:'Nature'});
// État de la vue "Route Liika" (perdu lors d'une fusion, restauré ici au niveau App)
const [routeKm,setRouteKm]=useState(0);
const [routeChecklist,setRouteChecklist]=useState({});
const activeProfile=ui?.activeProfile||'dja';
const profileLabel=activeProfile==='dja'?'Dja':activeProfile==='liika'?'Liika':'Couple';
const setActiveProfile=useCallback((who)=>setUI(prev=>({...prev,activeProfile:who})),[]);

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

// Persiste localStorage à chaque changement
useEffect(()=>saveData(data),[data]);

// Hydrate depuis Supabase au démarrage (si plus récent que le local)
useEffect(()=>{
let alive=true;
(async()=>{
  setSyncStatus('syncing');
  const remote=await sbLoad();
  if(!alive||!remote){
    if(alive){
      setSyncStatus('ok');
      setInitialSyncDone(true);
    }
    return;
  }

  const localUpdated=Date.parse(data?.updatedAt||'')||0;
  const remoteData=normalize(remote);
  const remoteUpdated=Date.parse(remoteData?.updatedAt||'')||0;

  if(remoteUpdated>=localUpdated){
    setData(remoteData);
    saveData(remoteData);
  }
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
const t=setTimeout(()=>{
  setSyncStatus('syncing');
  sbSave(data).then(()=>setSyncStatus('ok')).catch(()=>setSyncStatus('error'));
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
      setData(remote);
      saveData(remote);
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
  const upsertRecipe = useCallback(recipe => {
    setData(prev => {
      const next = clone(prev);
      if (!Array.isArray(next.recipes)) next.recipes = [];
      const idx = next.recipes.findIndex(r => r.id === recipe.id);
      if (idx >= 0) next.recipes[idx] = recipe;else next.recipes.push(recipe);
      return next;
    });
  }, []);
  const deleteRecipe = useCallback(id => {
    setData(prev => {
      const next = clone(prev);
      next.recipes = (next.recipes || []).filter(r => r.id !== id);
      return next;
    });
  }, []);
  // Import CSV : fusionne (ajoute / met à jour par id), n'efface jamais
  const importRecipes = useCallback(list => {
    setData(prev => {
      const next = clone(prev);
      if (!Array.isArray(next.recipes)) next.recipes = [];
      for (const r of list) {
        const idx = next.recipes.findIndex(x => x.id === r.id);
        if (idx >= 0) next.recipes[idx] = r;else next.recipes.push(r);
      }
      return next;
    });
  }, []);
  const upsertFerment = useCallback(ferment => {
    setData(prev => {
      const next = clone(prev);
      if (!Array.isArray(next.ferments)) next.ferments = [];
      const idx = next.ferments.findIndex(f => f.id === ferment.id);
      if (idx >= 0) next.ferments[idx] = ferment;else next.ferments.push(ferment);
      return next;
    });
  }, []);
  const deleteFerment = useCallback(id => {
    setData(prev => {
      const next = clone(prev);
      next.ferments = (next.ferments || []).filter(f => f.id !== id);
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
    id: 'culture',
    label: 'Culture GWA',
    icon: '🎭'
  }, {
    id: 'route',
    label: 'Route Liika',
    icon: '🚛'
  }, {
    id: 'objmensuel',
    label: 'Objectifs mois',
    icon: '🎯'
  }, {
    id: 'calendar',
    label: 'Calendrier',
    icon: '📅'
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
    }, "Vue d'ensemble \u2014 Vision 2026-2036"), /*#__PURE__*/React.createElement("div", {
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
          fontSize: 13,
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
  if (!session) return /*#__PURE__*/React.createElement(LoginScreen, {
    onLogin: s => {
      setSession(s);
    }
  });
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
      background: session?.id === 'dja' ? 'var(--accent-dja-bg)' : 'var(--accent-liika-bg)',
      border: `1px solid ${session?.id === 'dja' ? 'var(--accent-dja-border)' : 'var(--accent-liika-border)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 13,
      color: session?.id === 'dja' ? 'var(--accent-dja)' : 'var(--accent-liika)',
      flexShrink: 0
    }
  }, session?.id === 'dja' ? '◆' : '◇'), /*#__PURE__*/React.createElement("div", {
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
  }, session?.name || '—'), /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      opacity: .55,
      marginTop: 1
    }
  }, session?.id === 'dja' ? 'Principal' : 'Liika')))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto'
    }
  }, navItems.map(n => {
    const active = view === n.id;
    return /*#__PURE__*/React.createElement("button", {
      key: n.id,
      onClick: () => setView(n.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 20px',
        border: 'none',
        borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
        background: active ? 'rgba(217,183,95,.08)' : 'transparent',
        color: active ? 'var(--gold)' : 'var(--text3)',
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        transition: 'all .15s'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        width: 20,
        textAlign: 'center',
        opacity: active ? 1 : .7
      }
    }, n.icon), /*#__PURE__*/React.createElement("span", null, n.label));
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
      localStorage.removeItem('ld-session');
      setSession(null);
    },
    style: {
      width: '100%',
      padding: '7px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--accent-dja-border)',
      background: 'transparent',
      color: 'var(--text3)',
      cursor: 'pointer',
      fontSize: 11,
      letterSpacing: '.03em',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, "\u21C4"), " Changer de compte"), /*#__PURE__*/React.createElement("button", {
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
  }, "R\xE9initialiser"))), /*#__PURE__*/React.createElement("div", {
    className: "mobile-nav"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mobile-nav-inner"
  }, navItems.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    onClick: () => setView(n.id),
    className: `mnav-btn${view === n.id ? ' active' : ''}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "mnav-icon"
  }, n.icon), /*#__PURE__*/React.createElement("span", {
    className: "mnav-label"
  }, n.label))))), /*#__PURE__*/React.createElement("main", {
    className: "app-main"
  }, view === 'dashboard' && renderDashboard(), view === 'dja' && renderPerson('dja'), view === 'liika' && renderPerson('liika'), view === 'couple' && renderCouple(), view === 'jeux' && /*#__PURE__*/React.createElement(JeuxView, {
    games: data.games,
    updateGames: updateGames
  }), view === 'maison' && /*#__PURE__*/React.createElement(MaisonView, {
    maison: (data.couple || {}).maison,
    toggleMaisonTask: toggleMaisonTask,
    addMaisonTask: addMaisonTask,
    deleteMaisonTask: deleteMaisonTask,
    resetMaisonChecked: resetMaisonChecked
  }), view === 'repas' && /*#__PURE__*/React.createElement(MealsView, {
    data: data,
    upsertMeal: upsertMeal,
    deleteMeal: deleteMeal
  }), view === 'sport' && /*#__PURE__*/React.createElement(SportView, {
    data: data,
    upsertSport: upsertSport,
    deleteSport: deleteSport
  }), view === 'budget' && /*#__PURE__*/React.createElement(BudgetView, {
    data: data,
    upsertBudgetLine: upsertBudgetLine,
    deleteBudgetLine: deleteBudgetLine
  }), view === 'vision' && /*#__PURE__*/React.createElement(VisionView, {
    data: data,
    updateVision: updateVision
  }), view === 'planning' && /*#__PURE__*/React.createElement(PlanningView, {
    planning: (data.couple || {}).planning || {},
    togglePlanningCheck: togglePlanningCheck,
    addPlanningCustomItem: addPlanningCustomItem,
    deletePlanningCustomItem: deletePlanningCustomItem
  }), view === 'drevmcook' && /*#__PURE__*/React.createElement(DrevmCookView, {
    ferments: data.ferments || [],
    upsertFerment: upsertFerment,
    deleteFerment: deleteFerment,
    recipes: data.recipes || [],
    upsertRecipe: upsertRecipe,
    deleteRecipe: deleteRecipe,
    importRecipes: importRecipes
  }), view === 'culture' && /*#__PURE__*/React.createElement(CultureGwadView, null), view === 'route' && renderRoute(), view === 'objmensuel' && renderObjMensuel(), view === 'calendar' && /*#__PURE__*/React.createElement(CalendarView, {
    data: data
  }), view === 'charts' && renderCharts()), /*#__PURE__*/React.createElement(AddModal, {
    show: !!modal,
    onClose: () => setModal(null),
    type: modal?.type,
    color: modal?.who,
    onAdd: (t, d, c) => {
      if (modal.type === 'objective') addObjective(modal.who, t, d, c);else addAction(modal.who, t, d, c);
    }
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
