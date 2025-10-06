#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');

(async function main() {
  const distDir = path.join(process.cwd(), 'dist');
  await fs.rm(distDir, { recursive: true, force: true });
  console.log('Removed dist/ directory.');
})();
