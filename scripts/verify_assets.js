const fs = require('fs');
const path = require('path');
const sharp = require(path.join(__dirname, '..', 'frontend', 'node_modules', 'sharp'));

const files = [
  'assets/brand/kryvix-app-icon-1024.png',
  'assets/brand/kryvix-mark-transparent.png',
  'assets/brand/kryvix-logo-horizontal.png',
  'assets/brand/kryvix-logo-stacked.png',
  'assets/brand/kryvix-logo-card.png',
  'frontend/public/favicon.ico',
  'frontend/public/favicon.png',
  'frontend/public/icon-light-32x32.png',
  'frontend/public/icon-dark-32x32.png',
  'frontend/public/apple-icon.png',
  'frontend/public/logo-mark.png',
  'frontend/public/logo.png',
  'frontend/public/icon.svg',
  'frontend/public/icons/icon-192x192.png',
  'frontend/public/icons/icon-512x512.png',
  'app/assets/images/icon.png',
  'app/assets/images/android-icon-foreground.png',
  'app/assets/images/android-icon-background.png',
  'app/assets/images/android-icon-monochrome.png',
  'app/assets/images/splash-icon.png',
  'app/assets/images/favicon.png',
  'app/assets/images/icons/ai_icon.png'
];

async function verify() {
  console.log('--- Verifying Brand Assets ---');
  let allGood = true;
  for (const f of files) {
    const full = path.resolve(__dirname, '..', f);
    if (!fs.existsSync(full)) {
      console.error('❌ MISSING:', f);
      allGood = false;
      continue;
    }
    const stat = fs.statSync(full);
    if (f.endsWith('.png')) {
      const meta = await sharp(full).metadata();
      console.log(`✅ ${f.padEnd(46)}: ${meta.width}x${meta.height} (${(stat.size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`✅ ${f.padEnd(46)}: (${(stat.size / 1024).toFixed(1)} KB)`);
    }
  }
  if (allGood) {
    console.log('🎉 All assets verified successfully!');
  }
}

verify();
