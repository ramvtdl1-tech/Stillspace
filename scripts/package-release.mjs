import { createHash } from 'node:crypto';
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts');
const dist = path.join(root, 'dist');
const sourceFiles = [
  'index.html', 'README.md', 'LICENSE', 'package.json', 'package-lock.json', 'tsconfig.json',
  'vite.config.ts', 'iwsdk.config.json', 'vercel.json', '.nvmrc', '.gitignore',
  'pnpm-workspace.yaml',
];
const requiredSourceFiles = ['index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'iwsdk.config.json'];
const sourceDirectories = ['src', 'public', 'tests', 'docs', 'scripts', 'submission', '.github/workflows'];
const forbiddenNames = new Set(['node_modules', '.git', '.iwsdk', '.vercel', '.netlify', '.DS_Store', 'AGENTS.md', 'CLAUDE.md']);

function allowed(name) {
  return !forbiddenNames.has(name) && name !== '.env' && !name.startsWith('.env.') && !name.endsWith('.log') && !name.endsWith('.map');
}

async function exists(file) {
  try { await stat(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

async function copyTree(from, to) {
  const info = await lstat(from);
  if (info.isSymbolicLink()) throw new Error(`Refusing to package symbolic link: ${path.relative(root, from)}`);
  if (info.isDirectory()) {
    await mkdir(to, { recursive: true });
    for (const name of (await readdir(from)).sort()) {
      if (allowed(name)) await copyTree(path.join(from, name), path.join(to, name));
    }
  } else if (info.isFile()) {
    await mkdir(path.dirname(to), { recursive: true });
    await cp(from, to);
  } else throw new Error(`Unsupported file type: ${path.relative(root, from)}`);
}

async function inventory(directory, prefix = '') {
  const files = [];
  for (const name of (await readdir(directory)).sort()) {
    const absolute = path.join(directory, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    const info = await lstat(absolute);
    if (info.isDirectory()) files.push(...await inventory(absolute, relative));
    else files.push({ path: relative, bytes: info.size });
  }
  return files;
}

function zip(directory, destination) {
  const result = spawnSync('zip', ['-q', '-r', '-X', destination, '.'], { cwd: directory, encoding: 'utf8' });
  if (result.error?.code === 'ENOENT') throw new Error('The system zip program is required. Install zip, then rerun packaging.');
  if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr ?? 'zip failed');
}

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

await mkdir(output, { recursive: true });
if (!await exists(path.join(dist, 'index.html'))) throw new Error('dist/index.html is missing. Run npm run build before packaging.');
for (const name of requiredSourceFiles) {
  if (!await exists(path.join(root, name))) throw new Error(`Required source file is missing: ${name}`);
}
const temporary = await mkdtemp(path.join(tmpdir(), 'stillspace-release-'));
try {
  const deploymentStage = path.join(temporary, 'deployment');
  const sourceStage = path.join(temporary, 'source');
  await copyTree(dist, deploymentStage);
  await mkdir(sourceStage, { recursive: true });

  // Notices and handoff documentation accompany the standalone deployment ZIP.
  await copyTree(path.join(root, 'docs'), path.join(deploymentStage, 'docs'));
  if (await exists(path.join(root, 'LICENSE'))) await copyTree(path.join(root, 'LICENSE'), path.join(deploymentStage, 'LICENSE'));
  await writeFile(path.join(deploymentStage, '.nojekyll'), '');

  for (const name of sourceFiles) {
    if (await exists(path.join(root, name))) await copyTree(path.join(root, name), path.join(sourceStage, name));
  }
  for (const name of sourceDirectories) {
    if (await exists(path.join(root, name))) await copyTree(path.join(root, name), path.join(sourceStage, name));
  }

  const deploymentArchive = path.join(output, 'stillspace-deploy.zip');
  const sourceArchive = path.join(output, 'stillspace-source.zip');
  // zip updates existing archives; removing only these generated outputs avoids stale entries.
  await rm(deploymentArchive, { force: true });
  await rm(sourceArchive, { force: true });
  zip(deploymentStage, deploymentArchive);
  zip(sourceStage, sourceArchive);

  const packageInfo = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  const changes = spawnSync('git', ['status', '--porcelain', '--', '.'], { cwd: root, encoding: 'utf8' });
  const archives = [];
  for (const file of [deploymentArchive, sourceArchive]) archives.push({ file: path.basename(file), bytes: (await stat(file)).size, sha256: await sha256(file) });
  const release = {
    project: 'stillspace', version: packageInfo.version, packagedAt: new Date().toISOString(),
    sourceCommit: revision.status === 0 ? revision.stdout.trim() : null,
    sourceHasUncommittedChanges: changes.status === 0 ? changes.stdout.trim().length > 0 : null,
    note: 'Packages the existing dist build. Does not certify tests, source/build correspondence, headset validation, or deployment.',
    archives, deploymentFiles: await inventory(deploymentStage), sourceFiles: await inventory(sourceStage),
  };
  await writeFile(path.join(output, 'release.json'), `${JSON.stringify(release, null, 2)}\n`);
  await writeFile(path.join(output, 'SHA256SUMS'), archives.map(({ file, sha256: hash }) => `${hash}  ${file}\n`).join(''));
  console.log(JSON.stringify({ directory: output, archives, sourceCommit: release.sourceCommit, sourceHasUncommittedChanges: release.sourceHasUncommittedChanges }, null, 2));
} finally {
  await rm(temporary, { recursive: true, force: true });
}
