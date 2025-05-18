const { execSync } = require('child_process');
const path = require('path');

// Run TypeScript compiler on the scripts directory
try {
  console.log('Compiling TypeScript files...');
  execSync('npx tsc -p ' + __dirname, { stdio: 'inherit' });
  console.log('TypeScript compilation successful!');
} catch (error) {
  console.error('TypeScript compilation failed:', error.message);
  process.exit(1);
} 