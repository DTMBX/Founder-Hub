#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

console.log('\n🎨 xTx396 Image Asset Generator');
console.log('================================\n');

console.log('📁 Checking for existing PNG files...\n');

const requiredFiles = [
  'og-preview.png',
  'favicon-32x32.png',
  'apple-touch-icon.png'
];

const existingPNGs = requiredFiles.filter(file => 
  fs.existsSync(path.join(publicDir, file))
);

const existingSVGs = requiredFiles.filter(file => 
  fs.existsSync(path.join(publicDir, file.replace('.png', '.svg')))
);

if (existingPNGs.length === requiredFiles.length) {
  console.log('✅ All PNG files already exist!\n');
  existingPNGs.forEach(file => console.log(`   ✓ ${file}`));
  console.log('\n📊 Your site has professional OG images and favicons.');
  console.log('🔗 Test them at:');
  console.log('   - LinkedIn: https://www.linkedin.com/post-inspector/');
  console.log('   - Twitter: https://cards-dev.twitter.com/validator');
  console.log('\n💡 To regenerate, open: public/generate-images.html\n');
} else {
  console.log('⚠️  PNG files missing. Currently using SVG fallbacks.\n');
  
  if (existingSVGs.length > 0) {
    console.log('📌 SVG files found (temporary):');
    existingSVGs.forEach(file => console.log(`   ⚡ ${file}`));
    console.log('');
  }
  
  console.log('🚀 To generate PNG files:\n');
  console.log('   1. Open: public/generate-images.html in your browser');
  console.log('   2. Images auto-download to your Downloads folder');
  console.log('   3. Move downloaded files to /public directory:\n');
  
  requiredFiles.forEach(file => {
    const exists = existingPNGs.includes(file);
    const icon = exists ? '✓' : '○';
    console.log(`      ${icon} ${file}`);
  });
  
  console.log('\n   4. PNG files are already referenced in index.html ✓\n');
  console.log('💡 Alternative: Use public/og-image-generator.html for manual generation');
  console.log('📖 Full guide: See OG-IMAGE-SETUP.md\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
