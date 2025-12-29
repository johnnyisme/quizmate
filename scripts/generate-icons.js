#!/usr/bin/env node
// Generates PNG icons from SVG source using sharp
const fs = require('fs');
const path = require('path');
let sharp;

async function main() {
  const svgPath = path.join(__dirname, '..', 'public', 'icons', 'icon.svg');
  const outDir = path.join(__dirname, '..', 'public', 'icons');

  if (!fs.existsSync(svgPath)) {
    console.error('Source SVG not found:', svgPath);
    process.exit(1);
  }

  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('Missing dependency: sharp. Install with: npm i -D sharp');
    process.exit(1);
  }

  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  const svgBuffer = fs.readFileSync(svgPath);

  for (const { name, size } of sizes) {
    const outPath = path.join(outDir, name);
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outPath);
    console.log(`Generated ${name}`);
  }
}

main();