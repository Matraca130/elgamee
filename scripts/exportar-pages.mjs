import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , destination] = process.argv;
if (!destination) throw new Error('Informe o diretório de saída para o GitHub Pages.');
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const output = resolve(destination);
if (output === resolve(dist, '..') || (output + '/').startsWith(dist)) {
  throw new Error('Exporte para um diretório separado do código do jogo.');
}
await mkdir(output, { recursive: true });
const extensions = new Set(['.html', '.css', '.js', '.webp']);
for (const entry of await readdir(dist, { withFileTypes: true })) {
  if (!entry.isFile() || !extensions.has(extname(entry.name))) continue;
  const from = join(dist, entry.name);
  const to = join(output, entry.name);
  if (entry.name === 'index.html') {
    const page = await readFile(from, 'utf8');
    await writeFile(to, page.replace('</head>', '<meta name="atlas-progresso-local">\n</head>'));
  } else {
    await copyFile(from, to);
  }
}
await writeFile(join(output, '.nojekyll'), '');
