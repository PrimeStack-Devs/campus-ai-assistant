const fs = require('fs');
const sharp = require('sharp');

function createSvg(size) {
  // Safe zone for maskable icon is center 66%
  const padding = size * 0.12;
  const rectSize = size - padding * 2;
  const radius = size * 0.22;
  
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d21" />
      <stop offset="100%" stop-color="#02040d" />
    </linearGradient>
    <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="50%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${size * 0.03}" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Full Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bgGrad)" />

  <!-- Center Gradient Squircle -->
  <rect 
    x="${padding}" 
    y="${padding}" 
    width="${rectSize}" 
    height="${rectSize}" 
    rx="${radius}" 
    fill="url(#bubbleGrad)" 
    filter="url(#glow)"
  />

  <!-- Sparkle Symbol (Lucide Sparkles scaled) -->
  <g transform="translate(${size * 0.26}, ${size * 0.26}) scale(${size * 0.48 / 24})">
    <!-- Main Big Sparkle -->
    <path 
      d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" 
      fill="#ffffff" 
    />
    <!-- Small Top-Right Sparkle -->
    <path 
      d="M5 3v4M3 5h4" 
      stroke="#ffffff" 
      stroke-width="1.8" 
      stroke-linecap="round" 
    />
    <!-- Small Bottom-Left Sparkle -->
    <path 
      d="M19 17v4M17 19h4" 
      stroke="#ffffff" 
      stroke-width="1.8" 
      stroke-linecap="round" 
    />
  </g>
</svg>
`;
}

async function generateIcons() {
  const sizes = [192, 512];
  for (const s of sizes) {
    const svg = createSvg(s);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(`public/icons/icon-${s}x${s}.png`);
    console.log(`Generated public/icons/icon-${s}x${s}.png`);
  }
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
