import { copyFileSync, existsSync } from 'fs';

const src = 'nutrition/nutrition.html';
const dest = 'nutrition/index.html';

if (!existsSync(src)) {
  console.error('Build nutrition manquant:', src);
  process.exit(1);
}

copyFileSync(src, dest);
console.log('nutrition/index.html créé');
