// Assemble le dossier publié — LISTE BLANCHE.
//
// POURQUOI : `publish = "."` servait tout le dépôt. Le site marchait, mais
// .claude/, claude-config-kit-drevm/, src/, scripts/, supabase/, les fichiers de
// configuration et les notes de travail étaient téléchargeables par n'importe qui.
// Aucun secret dedans — c'est une question d'hygiène, pas une fuite — mais publier
// le schéma SQL et ses politiques RLS quand elles sont en `allow_all`, c'est une
// invitation gratuite.
//
// LISTE BLANCHE ET NON LISTE NOIRE : une liste noire laisse passer le prochain
// dossier ajouté au dépôt. Ici, ce qui n'est pas nommé n'est pas publié.
//
// Ce script est appelé par scripts/netlify-build.js et par les workflows Pages.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DEST = '_site';

// Fichiers sans lesquels le site est cassé : leur absence fait ÉCHOUER le build.
const REQUIS = [
  'index.html',
  'app.js',
  'styles.css',
  'liika sample.jpeg'                        // fond de page, référencé par styles.css
];
// Pages et dossiers publics en plus. Absents = simplement ignorés.
const OPTIONNELS = [
  'kalandriye-lalin-concombre-giraumon.html', // liée depuis le Potager
  'planrepasdja.html',                        // page autonome
  'highdrevm/index.html',                     // démo publique (charge /app.js et /styles.css)
  'nutrition'                                 // sortie du build Vite, si elle existe
];

const listeFichiers = d => readdirSync(d, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? listeFichiers(join(d, e.name)) : [join(d, e.name)]);

export function buildSite() {
  const manquants = REQUIS.filter(f => !existsSync(f));
  if (manquants.length) {
    console.error('\nARRÊT — fichiers indispensables absents : ' + manquants.join(', '));
    console.error('Publier sans eux donnerait un site cassé.\n');
    return null;
  }

  rmSync(DEST, { recursive: true, force: true });
  mkdirSync(DEST, { recursive: true });

  const copies = [];
  for (const entree of REQUIS.concat(OPTIONNELS)) {
    if (!existsSync(entree)) continue;
    const cible = join(DEST, entree);
    const parent = cible.slice(0, cible.lastIndexOf('/'));
    if (parent && parent !== DEST) mkdirSync(parent, { recursive: true });
    cpSync(entree, cible, { recursive: true });
    copies.push(entree);
  }

  // Pages sert le dossier tel quel : on garde le marqueur qui désactive Jekyll,
  // sinon les fichiers commençant par « _ » seraient ignorés.
  writeFileSync(join(DEST, '.nojekyll'), '');

  const fichiers = listeFichiers(DEST);
  const octets = fichiers.reduce((n, f) => n + statSync(f).size, 0);
  console.log('Dossier publié « ' + DEST + ' » : ' + fichiers.length + ' fichiers, ' +
    (octets / 1024 / 1024).toFixed(2) + ' Mo');
  copies.forEach(c => console.log('  + ' + c));
  return { fichiers, copies };
}

// Exécution directe : node scripts/build-site.js
if (process.argv[1] && process.argv[1].endsWith('build-site.js')) {
  process.exit(buildSite() ? 0 : 1);
}
