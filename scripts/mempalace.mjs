import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const generated = join(root, '.atlas-contexto');
const environment = join(generated, 'venv');
const python = process.platform === 'win32'
  ? join(environment, 'Scripts', 'python.exe')
  : join(environment, 'bin', 'python');
const wrapper = join(root, 'scripts', 'mempalace_atlas.py');
const palace = join(generated, 'palace');
const stamp = join(generated, 'mempalace.sha256');
const version = '3.12.0';
const model = 'embeddinggemma';
const wing = 'atlas-viral';
const namespaceArgs = ['--user', '--map-root-user', '--net', '--'];
const env = {
  ...process.env,
  HF_HUB_DISABLE_IMPLICIT_TOKEN: '1',
  HF_HUB_DISABLE_TELEMETRY: '1',
  HF_HUB_DISABLE_XET: '1',
  ORT_DISABLE_TELEMETRY: '1',
  ANONYMIZED_TELEMETRY: 'FALSE',
};

export function exportMemPalace(corpus) {
  const directory = join(generated, 'mempalace');
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'atlas-viral.md'), corpus);
  return directory;
}

function runMemPalace(command, args) {
  if (!existsSync(python)) {
    console.error('Prepare o MemPalace com npm run contexto -- preparar.');
    return false;
  }
  const cli = [wrapper, '--backend', 'chroma', '--palace', palace, command, '--wing', wing, ...args];
  const options = {
    cwd: root,
    stdio: 'inherit',
    env: { ...env, HF_HUB_OFFLINE: '1', MEMPALACE_EMBEDDING_MODEL: model },
  };
  const canIsolateNetwork = process.platform === 'linux'
    && spawnSync('unshare', [...namespaceArgs, 'true'], { stdio: 'ignore' }).status === 0;
  const result = canIsolateNetwork
    ? spawnSync('unshare', [...namespaceArgs, python, ...cli], options)
    : spawnSync(python, cli, options);
  if (result.error) console.error('Falha ao iniciar o MemPalace.');
  return result.status === 0;
}

function ensureIndex(corpus) {
  const hash = createHash('sha256').update(version + '\n' + model + '\n' + corpus).digest('hex');
  if (existsSync(palace) && existsSync(stamp) && readFileSync(stamp, 'utf8') === hash) return true;
  const folder = exportMemPalace(corpus);
  if (!runMemPalace('mine', ['--no-gitignore', folder])) return false;
  writeFileSync(stamp, hash);
  return true;
}

export function searchMemPalace(corpus, query, limit = 5) {
  return ensureIndex(corpus) && runMemPalace('search', ['--results', String(limit), '--', query]);
}

export function prepareMemPalace(corpus) {
  const options = { cwd: root, stdio: 'inherit' };
  const venv = spawnSync('uv', ['venv', '--allow-existing', '--python', '3.12', environment], options);
  if (venv.error?.code === 'ENOENT') console.error('Instale o uv e execute npm run contexto -- preparar novamente.');
  if (venv.status !== 0) return false;
  const install = spawnSync('uv', [
    'pip', 'install', '--python', python, 'mempalace==' + version, 'socksio==1.0.0',
  ], options);
  if (install.status !== 0) return false;
  const download = spawnSync(python, [wrapper, '--baixar-modelo'], { cwd: tmpdir(), stdio: 'inherit', env });
  if (download.status !== 0) return false;
  if (!searchMemPalace(corpus, 'preservar o recorde de cada curso', 1)) return false;
  console.log('MemPalace pronto para consultar o Atlas Viral.');
  return true;
}
