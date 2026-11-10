import * as THREE from 'three';

// Cache generated procedural textures to avoid recreation
const textureCache = new Map<string, THREE.CanvasTexture>();

export function createSunGlowTexture(): THREE.CanvasTexture {
  if (textureCache.has('sunGlow')) return textureCache.get('sunGlow')!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.2, 'rgba(255, 235, 170, 0.9)');
  grad.addColorStop(0.5, 'rgba(255, 180, 70, 0.4)');
  grad.addColorStop(0.8, 'rgba(255, 130, 30, 0.1)');
  grad.addColorStop(1, 'rgba(255, 100, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('sunGlow', texture);
  return texture;
}

export function createCloudPuffTexture(): THREE.CanvasTexture {
  if (textureCache.has('cloudPuff')) return textureCache.get('cloudPuff')!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.4, 'rgba(235, 240, 250, 0.7)');
  grad.addColorStop(0.7, 'rgba(200, 215, 235, 0.3)');
  grad.addColorStop(1, 'rgba(180, 200, 220, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('cloudPuff', texture);
  return texture;
}

export function createSnowflakeTexture(): THREE.CanvasTexture {
  if (textureCache.has('snowflake')) return textureCache.get('snowflake')!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  const cx = 64;
  const cy = 64;
  const r = 44;

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x2 = cx + Math.cos(angle) * r;
    const y2 = cy + Math.sin(angle) * r;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Side branches
    const midX = cx + Math.cos(angle) * (r * 0.55);
    const midY = cy + Math.sin(angle) * (r * 0.55);
    const bAngle1 = angle + Math.PI / 4;
    const bAngle2 = angle - Math.PI / 4;
    const bLen = 14;

    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(midX + Math.cos(bAngle1) * bLen, midY + Math.sin(bAngle1) * bLen);
    ctx.moveTo(midX, midY);
    ctx.lineTo(midX + Math.cos(bAngle2) * bLen, midY + Math.sin(bAngle2) * bLen);
    ctx.stroke();
  }

  // Soft center glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('snowflake', texture);
  return texture;
}

export function createRainDropTexture(): THREE.CanvasTexture {
  if (textureCache.has('raindrop')) return textureCache.get('raindrop')!;

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(16, 0, 16, 128);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.3, 'rgba(190, 220, 255, 0.4)');
  grad.addColorStop(0.8, 'rgba(220, 240, 255, 0.85)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(16, 64, 5, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('raindrop', texture);
  return texture;
}

export function createRippleTexture(): THREE.CanvasTexture {
  if (textureCache.has('ripple')) return textureCache.get('ripple')!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.strokeStyle = 'rgba(200, 230, 255, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(64, 64, 50, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(200, 230, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(64, 64, 30, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('ripple', texture);
  return texture;
}

export function createWindLeafTexture(): THREE.CanvasTexture {
  if (textureCache.has('windLeaf')) return textureCache.get('windLeaf')!;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(220, 160, 80, 0.9)';
  ctx.beginPath();
  ctx.moveTo(32, 8);
  ctx.quadraticCurveTo(56, 32, 32, 56);
  ctx.quadraticCurveTo(8, 32, 32, 8);
  ctx.fill();

  ctx.strokeStyle = 'rgba(180, 110, 40, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, 10);
  ctx.lineTo(32, 54);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('windLeaf', texture);
  return texture;
}
