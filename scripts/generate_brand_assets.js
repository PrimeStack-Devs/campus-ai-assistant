const fs = require('fs');
const path = require('path');
const sharp = require(path.join(__dirname, '..', 'frontend', 'node_modules', 'sharp'));

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_IMAGE = 'C:/Users/capta/.gemini/antigravity-ide/brain/eeef802b-f07a-4695-ad45-e988917e1ff5/.user_uploaded/media_1789065828443.png';

const BRAND_DIR = path.join(ROOT_DIR, 'assets', 'brand');
const FRONTEND_PUBLIC = path.join(ROOT_DIR, 'frontend', 'public');
const FRONTEND_ICONS = path.join(FRONTEND_PUBLIC, 'icons');
const APP_IMAGES = path.join(ROOT_DIR, 'app', 'assets', 'images');
const APP_ICONS = path.join(APP_IMAGES, 'icons');

// Helper to ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Multi-size ICO creator from PNG buffers
function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + entrySize * count;

  let totalSize = dirSize;
  for (const item of pngBuffers) {
    totalSize += item.buffer.length;
  }

  const ico = Buffer.alloc(totalSize);

  // ICONDIR
  ico.writeUInt16LE(0, 0); // Reserved
  ico.writeUInt16LE(1, 2); // Image type: 1 = ICO
  ico.writeUInt16LE(count, 4); // Number of images

  let currentOffset = dirSize;
  for (let i = 0; i < count; i++) {
    const { width, height, buffer } = pngBuffers[i];
    const entryOffset = headerSize + i * entrySize;

    ico.writeUInt8(width >= 256 ? 0 : width, entryOffset);
    ico.writeUInt8(height >= 256 ? 0 : height, entryOffset + 1);
    ico.writeUInt8(0, entryOffset + 2); // Color palette
    ico.writeUInt8(0, entryOffset + 3); // Reserved
    ico.writeUInt16LE(1, entryOffset + 4); // Color planes
    ico.writeUInt16LE(32, entryOffset + 6); // Bits per pixel
    ico.writeUInt32LE(buffer.length, entryOffset + 8); // Size of image data
    ico.writeUInt32LE(currentOffset, entryOffset + 12); // Offset

    buffer.copy(ico, currentOffset);
    currentOffset += buffer.length;
  }

  return ico;
}

async function main() {
  console.log('🚀 Starting Kryvix AI Brand Asset Generation...');

  ensureDir(BRAND_DIR);
  ensureDir(FRONTEND_PUBLIC);
  ensureDir(FRONTEND_ICONS);
  ensureDir(APP_IMAGES);
  ensureDir(APP_ICONS);

  // 1. Read source image raw buffer
  const { data, info } = await sharp(SOURCE_IMAGE).raw().toBuffer({ resolveWithObject: true });
  const bgR = 6, bgG = 6, bgB = 60; // Deep midnight navy

  // 2. Extract transparent mark (Vortex petals)
  const cropX = 156;
  const cropY = 78;
  const cropW = 174;
  const cropH = 154;

  const markBuf = Buffer.alloc(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((cropY + y) * info.width + (cropX + x)) * info.channels;
      const dstIdx = (y * cropW + x) * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      const diffR = Math.max(0, r - bgR);
      const diffG = Math.max(0, g - bgG);
      const diffB = Math.max(0, b - bgB);
      const maxDiff = Math.max(diffR, diffG, diffB);

      if (maxDiff > 6) {
        const alpha = Math.min(255, Math.round((maxDiff / 180) * 255 * 1.6));
        const factor = alpha > 0 ? 255 / alpha : 1;
        markBuf[dstIdx] = Math.min(255, Math.round(diffR * factor));
        markBuf[dstIdx + 1] = Math.min(255, Math.round(diffG * factor));
        markBuf[dstIdx + 2] = Math.min(255, Math.max(0, Math.round((b - bgB * (1 - alpha / 255)) * factor)));
        markBuf[dstIdx + 3] = alpha;
      } else {
        markBuf[dstIdx] = 0;
        markBuf[dstIdx + 1] = 0;
        markBuf[dstIdx + 2] = 0;
        markBuf[dstIdx + 3] = 0;
      }
    }
  }

  const rawMarkPng = await sharp(markBuf, { raw: { width: cropW, height: cropH, channels: 4 } }).png().toBuffer();

  // 3. Extract transparent full logo (Mark + KRYVIX text)
  const fullCropX = 156;
  const fullCropY = 78;
  const fullCropW = 174;
  const fullCropH = 202;

  const fullBuf = Buffer.alloc(fullCropW * fullCropH * 4);
  for (let y = 0; y < fullCropH; y++) {
    for (let x = 0; x < fullCropW; x++) {
      const srcIdx = ((fullCropY + y) * info.width + (fullCropX + x)) * info.channels;
      const dstIdx = (y * fullCropW + x) * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      const diffR = Math.max(0, r - bgR);
      const diffG = Math.max(0, g - bgG);
      const diffB = Math.max(0, b - bgB);
      const maxDiff = Math.max(diffR, diffG, diffB);

      if (maxDiff > 6) {
        const alpha = Math.min(255, Math.round((maxDiff / 180) * 255 * 1.6));
        const factor = alpha > 0 ? 255 / alpha : 1;
        fullBuf[dstIdx] = Math.min(255, Math.round(diffR * factor));
        fullBuf[dstIdx + 1] = Math.min(255, Math.round(diffG * factor));
        fullBuf[dstIdx + 2] = Math.min(255, Math.max(0, Math.round((b - bgB * (1 - alpha / 255)) * factor)));
        fullBuf[dstIdx + 3] = alpha;
      } else {
        fullBuf[dstIdx] = 0;
        fullBuf[dstIdx + 1] = 0;
        fullBuf[dstIdx + 2] = 0;
        fullBuf[dstIdx + 3] = 0;
      }
    }
  }

  const rawFullPng = await sharp(fullBuf, { raw: { width: fullCropW, height: fullCropH, channels: 4 } }).png().toBuffer();

  // 4. Create standard master Mark (512x512 transparent)
  const markResized512 = await sharp(rawMarkPng)
    .resize(420, 420, { fit: 'contain', kernel: 'lanczos3', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .sharpen({ sigma: 1.0, m1: 1.2, m2: 0.8 })
    .toBuffer();

  const mark512Transparent = await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: markResized512, gravity: 'center' }])
    .png()
    .toBuffer();

  await sharp(mark512Transparent).toFile(path.join(BRAND_DIR, 'kryvix-mark-transparent.png'));
  await sharp(mark512Transparent).toFile(path.join(FRONTEND_PUBLIC, 'logo-mark.png'));

  // 5. Create Master App Icon (1024x1024 on #06063c navy background)
  const markResized760 = await sharp(rawMarkPng)
    .resize(760, 760, { fit: 'contain', kernel: 'lanczos3', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .sharpen({ sigma: 1.2, m1: 1.2, m2: 0.8 })
    .toBuffer();

  const icon1024 = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 6, g: 6, b: 60, alpha: 1 } }
  })
    .composite([{ input: markResized760, gravity: 'center' }])
    .png()
    .toBuffer();

  await sharp(icon1024).toFile(path.join(BRAND_DIR, 'kryvix-app-icon-1024.png'));
  await sharp(icon1024).toFile(path.join(APP_IMAGES, 'icon.png'));

  // 6. Create Android Adaptive Icons:
  // Foreground: 512x512 transparent with ~66% safe zone centered (340x340 mark)
  const markResized340 = await sharp(rawMarkPng)
    .resize(340, 340, { fit: 'contain', kernel: 'lanczos3', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const androidForeground = await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: markResized340, gravity: 'center' }])
    .png()
    .toBuffer();

  await sharp(androidForeground).toFile(path.join(APP_IMAGES, 'android-icon-foreground.png'));

  // Background: 512x512 solid #06063c
  const androidBackground = await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 6, g: 6, b: 60, alpha: 1 } }
  })
    .png()
    .toBuffer();

  await sharp(androidBackground).toFile(path.join(APP_IMAGES, 'android-icon-background.png'));

  // Monochrome: 512x512 white silhouette
  const markMonochrome = await sharp(markResized340)
    .threshold(1)
    .toColourspace('b-w')
    .toBuffer();

  // Create pure white with alpha preserved
  const { data: monoRaw } = await sharp(markResized340).raw().toBuffer({ resolveWithObject: true });
  const monoBuf = Buffer.alloc(340 * 340 * 4);
  for (let i = 0; i < 340 * 340; i++) {
    const a = monoRaw[i * 4 + 3];
    monoBuf[i * 4] = 255;
    monoBuf[i * 4 + 1] = 255;
    monoBuf[i * 4 + 2] = 255;
    monoBuf[i * 4 + 3] = a;
  }
  const whiteMark = await sharp(monoBuf, { raw: { width: 340, height: 340, channels: 4 } }).png().toBuffer();

  const androidMonochrome = await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: whiteMark, gravity: 'center' }])
    .png()
    .toBuffer();

  await sharp(androidMonochrome).toFile(path.join(APP_IMAGES, 'android-icon-monochrome.png'));

  // 7. Splash Icon: 512x512 transparent with centered mark
  await sharp(mark512Transparent).toFile(path.join(APP_IMAGES, 'splash-icon.png'));

  // 8. Mobile In-App Icons
  // ai_icon.png (128x128)
  const aiIcon128 = await sharp(rawMarkPng)
    .resize(112, 112, { fit: 'contain', kernel: 'lanczos3', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const aiIcon = await sharp({
    create: { width: 128, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: aiIcon128, gravity: 'center' }])
    .png()
    .toBuffer();

  await sharp(aiIcon).toFile(path.join(APP_ICONS, 'ai_icon.png'));

  // Expo web favicon (48x48)
  const appFavicon48 = await sharp(rawMarkPng)
    .resize(44, 44, { fit: 'contain', kernel: 'lanczos3', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width: 48, height: 48, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: appFavicon48, gravity: 'center' }])
    .png()
    .toFile(path.join(APP_IMAGES, 'favicon.png'));

  // 9. Web PWA Icons
  // icon-512x512.png (PWA install & splash)
  const pwa512 = await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 6, g: 6, b: 60, alpha: 1 } }
  })
    .composite([{ input: markResized340, gravity: 'center' }])
    .png()
    .toBuffer();

  await sharp(pwa512).toFile(path.join(FRONTEND_ICONS, 'icon-512x512.png'));

  // icon-192x192.png (PWA homescreen)
  const markResized130 = await sharp(rawMarkPng)
    .resize(130, 130, { fit: 'contain', kernel: 'lanczos3', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const pwa192 = await sharp({
    create: { width: 192, height: 192, channels: 4, background: { r: 6, g: 6, b: 60, alpha: 1 } }
  })
    .composite([{ input: markResized130, gravity: 'center' }])
    .png()
    .toBuffer();

  await sharp(pwa192).toFile(path.join(FRONTEND_ICONS, 'icon-192x192.png'));

  // apple-icon.png (180x180)
  const markResized120 = await sharp(rawMarkPng)
    .resize(120, 120, { fit: 'contain', kernel: 'lanczos3', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const appleIcon = await sharp({
    create: { width: 180, height: 180, channels: 4, background: { r: 6, g: 6, b: 60, alpha: 1 } }
  })
    .composite([{ input: markResized120, gravity: 'center' }])
    .png()
    .toBuffer();

  await sharp(appleIcon).toFile(path.join(FRONTEND_PUBLIC, 'apple-icon.png'));

  // 10. Web Favicons (32x32 light/dark, 16x16, 48x48, and multi-res favicon.ico)
  const markResized28 = await sharp(rawMarkPng)
    .resize(28, 28, { fit: 'contain', kernel: 'lanczos3', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const favicon32 = await sharp({
    create: { width: 32, height: 32, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: markResized28, gravity: 'center' }])
    .png()
    .toBuffer();

  await sharp(favicon32).toFile(path.join(FRONTEND_PUBLIC, 'icon-light-32x32.png'));
  await sharp(favicon32).toFile(path.join(FRONTEND_PUBLIC, 'icon-dark-32x32.png'));
  await sharp(favicon32).toFile(path.join(FRONTEND_PUBLIC, 'favicon.png'));
  await sharp(favicon32).toFile(path.join(FRONTEND_PUBLIC, 'placeholder-logo.png'));

  const markResized14 = await sharp(rawMarkPng)
    .resize(14, 14, { fit: 'contain', kernel: 'lanczos3', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const favicon16 = await sharp({
    create: { width: 16, height: 16, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: markResized14, gravity: 'center' }])
    .png()
    .toBuffer();

  const markResized42 = await sharp(rawMarkPng)
    .resize(42, 42, { fit: 'contain', kernel: 'lanczos3', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const favicon48 = await sharp({
    create: { width: 48, height: 48, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: markResized42, gravity: 'center' }])
    .png()
    .toBuffer();

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: favicon16 },
    { width: 32, height: 32, buffer: favicon32 },
    { width: 48, height: 48, buffer: favicon48 }
  ]);
  fs.writeFileSync(path.join(FRONTEND_PUBLIC, 'favicon.ico'), icoBuffer);

  // 11. Full Logo Lockup with "KRYVIX AI"
  // Horizontal lockup: Mark on left (width 80, height 80), text "KRYVIX AI" on right
  const svgHorizontal = `
  <svg width="340" height="80" viewBox="0 0 340 80" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#00f0ff" />
        <stop offset="100%" stop-color="#2563eb" />
      </linearGradient>
      <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>
    </defs>
    <text x="86" y="52" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="34" letter-spacing="3" fill="url(#textGrad)">KRYVIX</text>
    <rect x="252" y="27" width="52" height="28" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5" />
    <text x="278" y="48" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="16" letter-spacing="1.5" fill="url(#aiGrad)" text-anchor="middle">AI</text>
  </svg>
  `;

  const markForLockup = await sharp(rawMarkPng)
    .resize(72, 72, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const logoHorizontal = await sharp(Buffer.from(svgHorizontal))
    .composite([{ input: markForLockup, top: 4, left: 4 }])
    .png()
    .toBuffer();

  await sharp(logoHorizontal).toFile(path.join(BRAND_DIR, 'kryvix-logo-horizontal.png'));
  await sharp(logoHorizontal).toFile(path.join(FRONTEND_PUBLIC, 'logo.png'));

  // Stacked Logo lockup: Mark above KRYVIX AI
  const svgStacked = `
  <svg width="340" height="320" viewBox="0 0 340 320" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#00f0ff" />
        <stop offset="100%" stop-color="#2563eb" />
      </linearGradient>
      <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>
    </defs>
    <text x="135" y="270" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="34" letter-spacing="3" fill="url(#textGrad)" text-anchor="middle">KRYVIX</text>
    <rect x="215" y="246" width="50" height="28" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5" />
    <text x="240" y="266" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="15" letter-spacing="1.5" fill="url(#aiGrad)" text-anchor="middle">AI</text>
  </svg>
  `;

  const markForStacked = await sharp(rawMarkPng)
    .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const logoStacked = await sharp(Buffer.from(svgStacked))
    .composite([{ input: markForStacked, top: 15, left: 70 }])
    .png()
    .toBuffer();

  await sharp(logoStacked).toFile(path.join(BRAND_DIR, 'kryvix-logo-stacked.png'));

  // Dark Card Logo (Master Presentation)
  await sharp({
    create: { width: 600, height: 480, channels: 4, background: { r: 6, g: 6, b: 60, alpha: 1 } }
  })
    .composite([{ input: logoStacked, gravity: 'center' }])
    .png()
    .toFile(path.join(BRAND_DIR, 'kryvix-logo-card.png'));

  // 12. Modern Vector SVG format (embedded raster with crisp SVG envelope)
  const base64Mark = rawMarkPng.toString('base64');
  const iconSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06063c" />
      <stop offset="100%" stop-color="#03031f" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)"/>
  <image href="data:image/png;base64,${base64Mark}" x="76" y="76" width="360" height="360" />
</svg>`;

  fs.writeFileSync(path.join(FRONTEND_PUBLIC, 'icon.svg'), iconSvgContent);
  fs.writeFileSync(path.join(FRONTEND_PUBLIC, 'placeholder-logo.svg'), iconSvgContent);

  console.log('✅ Kryvix AI Brand Assets Successfully Generated!');
}

main().catch(err => {
  console.error('❌ Error generating assets:', err);
  process.exit(1);
});
