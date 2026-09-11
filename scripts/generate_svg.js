const fs = require('fs');
const path = require('path');

function generateDongSonSVG() {
  const size = 1000;
  const cx = 500;
  const cy = 500;
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" fill="none">\n';

  svg += '  <defs>\n';
  svg += '    <style>\n';
  svg += '      .ds-line { stroke: #b91c1c; stroke-width: 1.6; fill: none; opacity: 0.85; }\n';
  svg += '      .ds-bold { stroke: #b91c1c; stroke-width: 2.8; fill: none; opacity: 0.95; }\n';
  svg += '      .ds-fill { fill: #b91c1c; stroke: none; opacity: 0.85; }\n';
  svg += '    </style>\n';
  svg += '  </defs>\n';

  // 1. Center Star (14 rays)
  const numRays = 14;
  const rOuter = 135;
  const rInner = 50;
  let starPoints = [];
  for (let i = 0; i < numRays * 2; i++) {
    const angle = (Math.PI * 2 / (numRays * 2)) * i - Math.PI / 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = (cx + r * Math.cos(angle)).toFixed(2);
    const y = (cy + r * Math.sin(angle)).toFixed(2);
    starPoints.push(x + ',' + y);
  }
  svg += '  <!-- Center 14-point Sun Star -->\n';
  svg += '  <polygon points="' + starPoints.join(' ') + '" class="ds-bold" fill="rgba(185, 28, 28, 0.08)" />\n';

  // Triangle ornaments between sun rays
  for (let i = 0; i < numRays; i++) {
    const a1 = (Math.PI * 2 / (numRays * 2)) * (i * 2 + 1) - Math.PI / 2;
    const aMid = (Math.PI * 2 / numRays) * (i + 1) - Math.PI / 2;
    const a2 = (Math.PI * 2 / (numRays * 2)) * (i * 2 + 3) - Math.PI / 2;
    const x1 = (cx + rInner * Math.cos(a1)).toFixed(2);
    const y1 = (cy + rInner * Math.sin(a1)).toFixed(2);
    const xMid = (cx + (rOuter * 0.95) * Math.cos(aMid)).toFixed(2);
    const yMid = (cy + (rOuter * 0.95) * Math.sin(aMid)).toFixed(2);
    const x2 = (cx + rInner * Math.cos(a2)).toFixed(2);
    const y2 = (cy + rInner * Math.sin(a2)).toFixed(2);
    svg += '  <polyline points="' + x1 + ',' + y1 + ' ' + xMid + ',' + yMid + ' ' + x2 + ',' + y2 + '" class="ds-line" />\n';
  }

  // 2. Concentric Rings
  const rings = [145, 155, 180, 195, 225, 240, 280, 295, 345, 365, 415, 435, 470, 485];
  rings.forEach(r => {
    svg += '  <circle cx="500" cy="500" r="' + r + '" class="ds-line" />\n';
  });

  // Ring: Dotted circle at r=168
  const numDots1 = 70;
  for (let i = 0; i < numDots1; i++) {
    const a = (Math.PI * 2 / numDots1) * i;
    const x = (cx + 167.5 * Math.cos(a)).toFixed(2);
    const y = (cy + 167.5 * Math.sin(a)).toFixed(2);
    svg += '  <circle cx="' + x + '" cy="' + y + '" r="2" class="ds-fill" />\n';
  }

  // Ring: Tangent circles with dots at r=210
  const numTangent = 42;
  for (let i = 0; i < numTangent; i++) {
    const a = (Math.PI * 2 / numTangent) * i;
    const x = (cx + 210 * Math.cos(a)).toFixed(2);
    const y = (cy + 210 * Math.sin(a)).toFixed(2);
    svg += '  <circle cx="' + x + '" cy="' + y + '" r="6" class="ds-line" />\n';
    svg += '  <circle cx="' + x + '" cy="' + y + '" r="1.8" class="ds-fill" />\n';
  }

  // Ring: Sawtooth triangles between r=240 and r=280
  const numSaw = 56;
  for (let i = 0; i < numSaw; i++) {
    const a1 = (Math.PI * 2 / numSaw) * i;
    const aMid = (Math.PI * 2 / numSaw) * (i + 0.5);
    const a2 = (Math.PI * 2 / numSaw) * (i + 1);
    const x1 = (cx + 240 * Math.cos(a1)).toFixed(2);
    const y1 = (cy + 240 * Math.sin(a1)).toFixed(2);
    const xMid = (cx + 280 * Math.cos(aMid)).toFixed(2);
    const yMid = (cy + 280 * Math.sin(aMid)).toFixed(2);
    const x2 = (cx + 240 * Math.cos(a2)).toFixed(2);
    const y2 = (cy + 240 * Math.sin(a2)).toFixed(2);
    svg += '  <polyline points="' + x1 + ',' + y1 + ' ' + xMid + ',' + yMid + ' ' + x2 + ',' + y2 + '" class="ds-line" />\n';
  }

  // Ring: Flying Cranes (Chim Lạc) in band r=295 to r=345
  const numCranes = 10;
  for (let i = 0; i < numCranes; i++) {
    const aBase = (Math.PI * 2 / numCranes) * i;
    const deg = (aBase * 180 / Math.PI) + 90;
    svg += '  <g transform="translate(500,500) rotate(' + deg.toFixed(2) + ')">\n';
    svg += '    <!-- Chim Lạc Thân & Mỏ dài -->\n';
    svg += '    <path d="M-45,-320 C-20,-335 10,-335 35,-320 C20,-315 5,-313 -10,-317 Z" class="ds-bold" fill="rgba(185, 28, 28, 0.06)" />\n';
    svg += '    <path d="M35,-320 Q55,-325 80,-322 Q52,-317 35,-320" class="ds-bold" />\n';
    svg += '    <path d="M32,-323 Q42,-335 52,-333" class="ds-line" />\n';
    svg += '    <path d="M0,-318 Q-15,-352 -35,-358 Q-20,-340 -5,-322" class="ds-bold" />\n';
    svg += '    <path d="M-10,-320 Q-30,-352 -48,-354 Q-32,-338 -18,-322" class="ds-line" />\n';
    svg += '    <path d="M-45,-320 Q-70,-323 -95,-317 Q-75,-315 -50,-317" class="ds-bold" />\n';
    svg += '    <path d="M-20,-315 Q-40,-300 -55,-297" class="ds-line" />\n';
    svg += '  </g>\n';
  }

  // Ring: Dotted circle at r=355
  const numDots2 = 140;
  for (let i = 0; i < numDots2; i++) {
    const a = (Math.PI * 2 / numDots2) * i;
    const x = (cx + 355 * Math.cos(a)).toFixed(2);
    const y = (cy + 355 * Math.sin(a)).toFixed(2);
    svg += '  <circle cx="' + x + '" cy="' + y + '" r="2" class="ds-fill" />\n';
  }

  // Ring: Outer Geometrics between r=365 and r=415
  const numOuterSaw = 84;
  for (let i = 0; i < numOuterSaw; i++) {
    const a1 = (Math.PI * 2 / numOuterSaw) * i;
    const aMid = (Math.PI * 2 / numOuterSaw) * (i + 0.5);
    const a2 = (Math.PI * 2 / numOuterSaw) * (i + 1);
    const x1 = (cx + 365 * Math.cos(a1)).toFixed(2);
    const y1 = (cy + 365 * Math.sin(a1)).toFixed(2);
    const xMid = (cx + 415 * Math.cos(aMid)).toFixed(2);
    const yMid = (cy + 415 * Math.sin(aMid)).toFixed(2);
    const x2 = (cx + 365 * Math.cos(a2)).toFixed(2);
    const y2 = (cy + 365 * Math.sin(a2)).toFixed(2);
    svg += '  <polyline points="' + x1 + ',' + y1 + ' ' + xMid + ',' + yMid + ' ' + x2 + ',' + y2 + '" class="ds-line" />\n';
  }

  // Ring: Outer dotted ring at r=425
  const numDots3 = 180;
  for (let i = 0; i < numDots3; i++) {
    const a = (Math.PI * 2 / numDots3) * i;
    const x = (cx + 425 * Math.cos(a)).toFixed(2);
    const y = (cy + 425 * Math.sin(a)).toFixed(2);
    svg += '  <circle cx="' + x + '" cy="' + y + '" r="2" class="ds-fill" />\n';
  }

  // Ring: Concentric radial combs at outer border r=435 to r=470
  const numCombs = 120;
  for (let i = 0; i < numCombs; i++) {
    const a = (Math.PI * 2 / numCombs) * i;
    const x1 = (cx + 435 * Math.cos(a)).toFixed(2);
    const y1 = (cy + 435 * Math.sin(a)).toFixed(2);
    const x2 = (cx + 470 * Math.cos(a)).toFixed(2);
    const y2 = (cy + 470 * Math.sin(a)).toFixed(2);
    svg += '  <line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="ds-line" />\n';
  }

  // Outermost solid rim
  svg += '  <circle cx="500" cy="500" r="490" class="ds-bold" stroke-width="4" />\n';
  svg += '</svg>';
  return svg;
}

const svg = generateDongSonSVG();
const targetPath = path.join(__dirname, '../public/trong-dong.svg');
fs.writeFileSync(targetPath, svg, 'utf8');
console.log('Saved SVG to:', targetPath, 'Size:', svg.length);
