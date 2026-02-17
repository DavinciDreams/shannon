/**
 * Package Extension Script
 * Creates a .zip file with only the files needed for Chrome Web Store
 *
 * Usage: node scripts/package.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Read version from manifest
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const version = manifest.version;
const zipName = `duly-noted-v${version}.zip`;
const zipPath = path.join(ROOT, zipName);

// Files/dirs to include in the package
const INCLUDE = [
  'manifest.json',
  'icons/icon-16.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
  'src/',
];

// Files to EXCLUDE even if inside included dirs
const EXCLUDE_PATTERNS = [
  'runtime-config.json', // old format, gitignored
];

console.log(`Packaging Duly Noted v${version}...`);

// Use a staging approach: copy files to temp dir, then zip
const staging = path.join(ROOT, '_staging');

// Clean up any previous staging
if (fs.existsSync(staging)) {
  fs.rmSync(staging, { recursive: true, force: true });
}
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Create staging directory
fs.mkdirSync(staging, { recursive: true });

// Copy files
for (const item of INCLUDE) {
  const src = path.join(ROOT, item);
  const dest = path.join(staging, item);

  if (!fs.existsSync(src)) {
    console.error(`Missing: ${item}`);
    process.exit(1);
  }

  if (fs.statSync(src).isDirectory()) {
    copyDirSync(src, dest);
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// Verify runtime-config.js exists in staging (needed for OAuth to work)
const runtimeConfigPath = path.join(staging, 'src', 'config', 'runtime-config.js');
if (!fs.existsSync(runtimeConfigPath)) {
  console.error('WARNING: src/config/runtime-config.js not found!');
  console.error('Run "npm run build:config" first to generate OAuth config.');
  process.exit(1);
}

// Create zip using PowerShell Compress-Archive
// Use single quotes inside PowerShell to handle paths with spaces
try {
  const psScript = `Compress-Archive -Path '${staging}\\*' -DestinationPath '${zipPath}' -Force`;
  execSync(`powershell -Command "& { ${psScript} }"`, { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to create zip:', error.message);
  process.exit(1);
}

// Clean up staging
fs.rmSync(staging, { recursive: true, force: true });

// Report
const stats = fs.statSync(zipPath);
const sizeKB = (stats.size / 1024).toFixed(1);
console.log(`\nPackage created: ${zipName} (${sizeKB} KB)`);
console.log(`Location: ${zipPath}`);

// List contents summary
console.log('\nIncluded:');
console.log('  manifest.json');
console.log('  icons/ (3 PNGs)');
console.log('  src/ (all source files)');
console.log('\nExcluded:');
console.log('  .env, .env.example, .gitignore');
console.log('  node_modules/, scripts/, .github/');
console.log('  assets/, README.md, package.json');
console.log('  All *.md dev docs');

/**
 * Recursively copy directory
 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Check exclusions
    if (EXCLUDE_PATTERNS.some(p => entry.name.includes(p))) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
