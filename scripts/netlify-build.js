// Build Netlify — le tableau de bord ne doit pas tomber avec le sous-projet nutrition.
//
// POURQUOI : le site principal (index.html + app.js + styles.css) ne demande AUCUNE
// compilation — c'est pour ça que netlify.toml publie la racine. Seule l'app
// « nutrition » (src/ + vite) se compile. Tant que la commande de build était
// `npm run build`, un échec de cette compilation annulait tout le déploiement,
// y compris le tableau de bord qui n'avait rien demandé.
//
// CE QUE FAIT CE SCRIPT :
//   1. Vérifie que le site principal est bien là. S'il manque, on ÉCHOUE — publier
//      un site vide serait pire que ne pas publier.
//   2. Lance la compilation nutrition. Si elle passe : rien de spécial.
//   3. Si elle échoue : on l'affiche en toutes lettres dans le log et on continue.
//      Le déploiement a lieu, sans /nutrition/ (le dossier est généré, pas versionné).
//
// Ce script n'est utilisé QUE par Netlify. En local, `npm run build` reste strict
// et échoue normalement — on veut voir les erreurs quand on développe.
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';

const ESSENTIELS = ['index.html', 'app.js', 'styles.css'];
const bandeau = l => console.log('\n' + '─'.repeat(70) + '\n' + l + '\n' + '─'.repeat(70) + '\n');

const manquants = ESSENTIELS.filter(f => !existsSync(f));
if (manquants.length) {
  bandeau('ARRÊT — le site principal est incomplet : ' + manquants.join(', ') +
    '\nPublier dans cet état donnerait un site cassé. Rien n\'est déployé.');
  process.exit(1);
}

console.log('Site principal présent (' + ESSENTIELS.join(', ') + ') — aucune compilation nécessaire.');
console.log('Compilation du sous-projet nutrition…\n');

const r = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });

if (r.status === 0 && existsSync('nutrition/index.html')) {
  console.log('\nSous-projet nutrition compilé.');
  process.exit(0);
}

const cause = r.error ? r.error.message
  : r.status !== 0 ? 'la commande a renvoyé le code ' + r.status
  : 'nutrition/index.html est absent après la compilation';

bandeau(
  'LE SOUS-PROJET NUTRITION N\'A PAS PU ÊTRE COMPILÉ (' + cause + ').\n' +
  '\n' +
  'Le déploiement CONTINUE quand même : le tableau de bord (index.html, app.js,\n' +
  'styles.css) ne dépend pas de cette compilation et sera publié normalement.\n' +
  '\n' +
  'Conséquence : la page /nutrition/ sera absente de ce déploiement, le dossier\n' +
  'étant généré au build et non versionné. Les lignes ci-dessus disent pourquoi.'
);
process.exit(0);
