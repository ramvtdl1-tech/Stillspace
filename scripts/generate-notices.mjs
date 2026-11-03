import { readFile, readdir, realpath, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Deliberately offline: inspect only package locations named by this lockfile.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
const output = path.join(root, 'public', 'third-party-licenses.txt');
const overridesDirectory = path.join(root, 'scripts', 'license-overrides');
const overrides = JSON.parse(await readFile(path.join(overridesDirectory, 'manifest.json'), 'utf8'));
const noticeName = /^(?:licen[cs]es?|copying|notices?|third[-_ ]?party[-_ ]?(?:licen[cs]es?|notices?)|ofl|unlicense)(?:$|[._-])/i;
const ignoredDirectories = new Set(['node_modules', '.git', 'test', 'tests', '__tests__', 'coverage']);
const missing = [];
let packageCount = 0;
let fileCount = 0;
let excludedCount = 0;
const sections = [
  'STILLSPACE — THIRD-PARTY LICENSES AND NOTICES',
  '',
  'Generated offline by scripts/generate-notices.mjs from package-lock.json.',
  'Scope: installed packages whose lockfile record is not marked dev=true.',
  'This conservative inventory can include packages removed by bundling/tree shaking.',
  'Available package license and notice files follow verbatim. Metadata is descriptive,',
  'not a replacement for license text. Missing texts are marked explicitly below.',
  'Version-matched upstream texts are included from scripts/license-overrides.',
  'Explicit client distribution exclusions require the corresponding build gate;',
  'they do not assert a license or grant permission to reuse excluded code.',
  'No network requests, environment files, or credentials are read by this script.',
  '',
];
const headerLength = sections.length;

async function collectFiles(directory, relative = '', depth = 0, inLicenseDirectory = false) {
  const found = [];
  const entries = (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const relativeName = path.posix.join(relative.replaceAll(path.sep, '/'), entry.name);
    const fullPath = path.join(directory, entry.name);
    const isNotice = noticeName.test(entry.name) || /\.licen[cs]e(?:\.(?:txt|md))?$/i.test(entry.name);
    if (entry.isDirectory()) {
      if (depth < 3 && !ignoredDirectories.has(entry.name)) {
        found.push(...await collectFiles(fullPath, relativeName, depth + 1, inLicenseDirectory || isNotice));
      }
    } else if (entry.isFile() && (isNotice || inLicenseDirectory)) {
      const bytes = await readFile(fullPath);
      // A license-named directory could also contain images. Never treat binary as text.
      if (bytes.includes(0)) continue;
      found.push({ name: relativeName, text: bytes.toString('utf8'), primaryLicense: /^(?:licen[cs]e|copying|ofl|unlicense)(?:$|[._-])/i.test(entry.name) });
    }
  }
  return found;
}

for (const [location, record] of Object.entries(lock.packages ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
  if (!location.startsWith('node_modules/') || record.dev === true) continue;
  const parts = location.split('/');
  if (parts.some((part) => part === '..' || part === '.' || part === '') || path.isAbsolute(location)) {
    throw new Error(`Unsafe package location in lockfile: ${location}`);
  }
  const directory = path.resolve(root, ...parts);
  const resolvedDirectory = await realpath(directory);
  if (!resolvedDirectory.startsWith(`${path.join(root, 'node_modules')}${path.sep}`)) {
    throw new Error(`Package location resolves outside project node_modules: ${location}`);
  }
  const metadata = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
  const name = `${metadata.name ?? location}@${metadata.version ?? record.version ?? 'unknown'}`;
  const license = metadata.license ?? record.license ?? 'UNDECLARED';
  const files = await collectFiles(directory);
  const override = overrides[name];
  if (override?.file) {
    if (path.basename(override.file) !== override.file) throw new Error(`Unsafe license override: ${name}`);
    const text = await readFile(path.join(overridesDirectory, override.file), 'utf8');
    files.push({ name: `upstream/${override.file}`, text, primaryLicense: true });
  }
  packageCount++;
  sections.push('='.repeat(80), name, `Installed path: ${location}`, `Declared license: ${typeof license === 'string' ? license : JSON.stringify(license)}`, '');
  if (override?.source) sections.push(`Verified source: ${override.source}`, ...(override.evidence ? [override.evidence] : []), '');
  if (override?.distribution === 'excluded-client') {
    excludedCount++;
    sections.push('NOT DISTRIBUTED IN CLIENT BUILD.', override.reason,
      'The installed package has no verified license declaration. No license is inferred.', '');
  } else if (!files.some((file) => file.primaryLicense)) {
    missing.push(name);
    sections.push('MISSING LICENSE TEXT: No standalone package license text was found.',
      'Resolve licensing evidence and required notices before distributing this package.', '');
  }
  for (const file of files) {
    fileCount++;
    sections.push(`--- ${location}/${file.name} ---`, file.text, '');
  }
}

sections.splice(headerLength, 0, `Inventory: ${packageCount} packages; ${fileCount} license/notice files.`,
  `Client distribution exclusions: ${excludedCount}.`,
  `Packages without a detected license text: ${missing.length}.`,
  ...(missing.length ? missing.map((name) => `MISSING: ${name}`) : ['No missing files detected within the stated inventory scope.']), '');
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${sections.join('\n')}\n`, 'utf8');
console.log(`Generated public/third-party-licenses.txt: ${packageCount} packages, ${fileCount} files.`);
for (const name of missing) console.warn(`MISSING LICENSE TEXT: ${name}`);
if (missing.length) {
  console.warn(`${missing.length} package(s) need licensing review; notices are not complete.`);
  if (process.argv.includes('--strict')) process.exitCode = 1;
}
