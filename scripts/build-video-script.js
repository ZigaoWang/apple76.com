#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, 'generate-video-thumbnails.ts');
const targetFile = path.join(__dirname, 'generate-video-thumbnails.js');

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Source file not found: ${sourceFile}`);
  process.exit(1);
}

try {
  // Compile specific TS file
  console.log(`Compiling ${sourceFile}...`);
  execSync(`npx tsc --target ES2020 --module CommonJS --esModuleInterop true ${sourceFile}`, { 
    stdio: 'inherit' 
  });
  
  // Verify the JS file was created
  if (fs.existsSync(targetFile)) {
    console.log(`Successfully compiled to ${targetFile}`);
  } else {
    console.error(`Failed to generate JavaScript file: ${targetFile}`);
    process.exit(1);
  }
} catch (error) {
  console.error('Error during compilation:', error.message);
  process.exit(1);
} 