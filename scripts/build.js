#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const srcDir = path.join(rootDir, 'src');

const { error: dotenvError } = dotenv.config({ path: path.join(rootDir, '.env') });
if (dotenvError) {
  console.warn('[build] .env not found, relying on process environment');
}

const requiredEnvVars = ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_API_KEY'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
  console.error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Create a .env file based on .env.example before building.');
  process.exit(1);
}

const templateFiles = [
  {
    source: path.join(rootDir, 'manifest.template.json'),
    destination: path.join(distDir, 'manifest.json'),
  },
  {
    source: path.join(srcDir, 'lib', 'config.template.js'),
    destination: path.join(distDir, 'lib', 'config.js'),
  },
];

const envValues = new Proxy(process.env, {
  get(target, prop) {
    if (!(prop in target)) {
      throw new Error(`Missing value for template variable ${String(prop)}`);
    }
    return target[prop];
  },
});

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function cleanDist() {
  await fs.rm(distDir, { recursive: true, force: true });
  await ensureDir(distDir);
}

async function copyDirectory(source, destination) {
  await ensureDir(destination);
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      if (entry.name.includes('.template.')) {
        continue; // Template files are handled separately
      }
      await fs.copyFile(srcPath, destPath);
    }
  }
}

function applyTemplate(text) {
  return text.replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_, key) => {
    const value = envValues[key];
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`Template variable ${key} is empty.`);
    }
    return value;
  });
}

async function processTemplates() {
  for (const { source, destination } of templateFiles) {
    const template = await fs.readFile(source, 'utf8');
    const compiled = applyTemplate(template);
    await ensureDir(path.dirname(destination));
    await fs.writeFile(destination, compiled, 'utf8');
  }
}

(async function main() {
  await cleanDist();
  await copyDirectory(srcDir, distDir);
  await processTemplates();
  console.log('Build complete. Output available in dist/.');
})();
