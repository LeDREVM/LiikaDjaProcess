// Build Netlify — le tableau de bord ne doit pas tomber avec le sous-projet nutrition.
//
// POURQUOI : le site principal (index.html + app.js + styles.css) ne demande AUCUNE
// compilation. Seule l'app « nutrition » (src/ + vite) se compile. Tant que la
// commande de build était `npm run build`, un échec de cette compilation annulait
// tout le déploiement, y compris le tableau de bord qui n'avait rien demandé.
//
// CE QUE FAIT CE SCRIPT :
//   1. Compile le sous-projet nutrition. En cas d'échec, l'affiche en toutes lettres
//      et CONTINUE — le déploiement a lieu, simplement sans /nutrition/.
//   2. Assemble le dossier publié `_site` à partir d'une liste blanche
//      (voir scripts/build-site.js). Si un fichier indispensable manque, on ÉCHOUE :
//      publier un site vide serait pire que ne pas publier.
//
// Ce script n'est utilisé QUE par Netlify et les workflows Pages. En local,
// `npm run build` reste strict et échoue normalement — on veut voir les erreurs
// quand on développe.
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { buildSite } from './build-site.js';

const bandeau = l => console.log('\n' + '─'.repeat(70) + '\n' + l + '\n' + '─'.repeat(70) + '\n');

console.log('Compilation du sous-projet nutrition…\n');
const r = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });

if (r.status === 0 && existsSync('nutrition/index.html')) {
  console.log('\nSous-projet nutrition compilé.');
} else {
  const cause = r.error ? r.error.message
    : r.status !== 0 ? 'la commande a renvoyé le code ' + r.status
    : 'nutrition/index.html est absent après la compilation';
  bandeau(
    'LE SOUS-PROJET NUTRITION N\'A PAS PU ÊTRE COMPILÉ (' + cause + ').\n' +
    '\n' +
    'Le déploiement CONTINUE quand même : le tableau de bord (index.html, app.js,\n' +
    'styles.css) ne dépend pas de cette compilation et sera publié normalement.\n' +
    '\n' +
    'Conséquence : la page /nutrition/ sera absente de ce déploiement. Les lignes\n' +
    'ci-dessus disent pourquoi.'
  );
}

console.log('\nAssemblage du dossier publié…');
if (!buildSite()) {
  bandeau('ARRÊT — le site principal est incomplet. Rien n\'est déployé.');
  process.exit(1);
}
process.exit(0);
