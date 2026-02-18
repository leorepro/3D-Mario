/**
 * ItemMeshFactory — Creates procedural Three.js meshes for special items.
 * All geometry is built from primitives; no external textures or images.
 */
import * as THREE from 'three';

// Cached geometries/materials (shared across instances)
const _cache = {};

function getOrCreate(key, factory) {
  if (!_cache[key]) _cache[key] = factory();
  return _cache[key];
}

// ── Question Block ❓ ──
function createQuestionBlock() {
  const group = new THREE.Group();

  const geo = getOrCreate('qblock_geo', () => new THREE.BoxGeometry(0.6, 0.6, 0.6));
  const mat = new THREE.MeshStandardMaterial({
    color: 0xfbd000,
    metalness: 0.3,
    roughness: 0.6,
    emissive: 0xfbd000,
    emissiveIntensity: 0.1,
  });
  const box = new THREE.Mesh(geo, mat);
  box.castShadow = true;
  group.add(box);

  // "?" text via canvas texture on front face
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c79100';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 32, 34);

  const tex = new THREE.CanvasTexture(canvas);
  const faceMat = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.2, roughness: 0.5 });
  const faceGeo = getOrCreate('qblock_face', () => new THREE.PlaneGeometry(0.55, 0.55));

  // Front face
  const front = new THREE.Mesh(faceGeo, faceMat);
  front.position.z = 0.301;
  group.add(front);

  // Back face
  const back = new THREE.Mesh(faceGeo, faceMat);
  back.position.z = -0.301;
  back.rotation.y = Math.PI;
  group.add(back);

  return group;
}

// ── Super Star ⭐ ──
function createStar() {
  const group = new THREE.Group();

  const shape = new THREE.Shape();
  const outerR = 0.35;
  const innerR = 0.15;
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    if (i === 0) shape.moveTo(Math.cos(outerAngle) * outerR, Math.sin(outerAngle) * outerR);
    else shape.lineTo(Math.cos(outerAngle) * outerR, Math.sin(outerAngle) * outerR);
    shape.lineTo(Math.cos(innerAngle) * innerR, Math.sin(innerAngle) * innerR);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 });
  const mat = new THREE.MeshStandardMaterial({
    color: 0xfbd000,
    metalness: 0.7,
    roughness: 0.2,
    emissive: 0xfbd000,
    emissiveIntensity: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = 0.075;
  group.add(mesh);

  return group;
}

// ── Super Mushroom 🍄 ──
function createMushroom(color = 0xe52521) {
  const group = new THREE.Group();

  // Cap (half sphere)
  const capGeo = getOrCreate('mush_cap', () => new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2));
  const capMat = new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.7 });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 0.2;
  cap.castShadow = true;
  group.add(cap);

  // White dots on cap
  const dotGeo = getOrCreate('mush_dot', () => new THREE.SphereGeometry(0.06, 8, 6));
  const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: 0.9 });
  const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  for (const a of angles) {
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(Math.cos(a) * 0.2, 0.35, Math.sin(a) * 0.2);
    group.add(dot);
  }

  // Stem
  const stemGeo = getOrCreate('mush_stem', () => new THREE.CylinderGeometry(0.12, 0.15, 0.2, 12));
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xfff5e6, metalness: 0, roughness: 0.9 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 0.1;
  stem.castShadow = true;
  group.add(stem);

  return group;
}

// ── Coin Tower 🏰 ──
function createCoinTower() {
  const group = new THREE.Group();
  const coinGeo = getOrCreate('tower_coin', () => new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16));
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xffc107, metalness: 0.8, roughness: 0.2 });

  for (let i = 0; i < 5; i++) {
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.position.y = 0.05 + i * 0.1;
    coin.rotation.y = i * 0.2;
    coin.castShadow = true;
    group.add(coin);
  }

  return group;
}

// ── Fire Flower 🔥 ──
function createFireFlower() {
  const group = new THREE.Group();

  // Center
  const centerGeo = getOrCreate('fire_center', () => new THREE.SphereGeometry(0.12, 12, 8));
  const centerMat = new THREE.MeshStandardMaterial({
    color: 0xff4500,
    emissive: 0xff2200,
    emissiveIntensity: 0.4,
    metalness: 0.3,
    roughness: 0.5,
  });
  const center = new THREE.Mesh(centerGeo, centerMat);
  center.position.y = 0.35;
  group.add(center);

  // Petals
  const petalGeo = getOrCreate('fire_petal', () => new THREE.SphereGeometry(0.1, 8, 6));
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.2 });
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(Math.cos(angle) * 0.2, 0.35, Math.sin(angle) * 0.2);
    petal.scale.set(1, 0.7, 1);
    group.add(petal);
  }

  // Stem
  const stemGeo = getOrCreate('fire_stem', () => new THREE.CylinderGeometry(0.04, 0.05, 0.3, 8));
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x43b047, metalness: 0, roughness: 0.8 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 0.15;
  group.add(stem);

  return group;
}

// ── Green Pipe 🟢 ──
function createGreenPipe() {
  const group = new THREE.Group();

  const bodyGeo = getOrCreate('pipe_body', () => new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16));
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x43b047, metalness: 0.2, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.25;
  body.castShadow = true;
  group.add(body);

  // Lip at top
  const lipGeo = getOrCreate('pipe_lip', () => new THREE.CylinderGeometry(0.38, 0.38, 0.1, 16));
  const lipMat = new THREE.MeshStandardMaterial({ color: 0x2d8a2d, metalness: 0.2, roughness: 0.6 });
  const lip = new THREE.Mesh(lipGeo, lipMat);
  lip.position.y = 0.55;
  lip.castShadow = true;
  group.add(lip);

  // Dark inside
  const insideGeo = getOrCreate('pipe_inside', () => new THREE.CylinderGeometry(0.22, 0.22, 0.05, 16));
  const insideMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const inside = new THREE.Mesh(insideGeo, insideMat);
  inside.position.y = 0.58;
  group.add(inside);

  return group;
}

// ── Poison Mushroom 💀 ──
function createPoisonMushroom() {
  return createMushroom(0x800080); // purple cap
}

// ═══════════ PUBLIC API ═══════════

const CREATORS = {
  question_block: createQuestionBlock,
  star: createStar,
  mushroom: createMushroom,
  coin_tower: createCoinTower,
  fire_flower: createFireFlower,
  green_pipe: createGreenPipe,
  poison_mushroom: createPoisonMushroom,
};

export class ItemMeshFactory {
  static create(itemType) {
    const fn = CREATORS[itemType];
    if (!fn) {
      console.warn(`[ItemMeshFactory] Unknown item type: ${itemType}`);
      // Fallback: red sphere
      const geo = new THREE.SphereGeometry(0.3, 12, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      return new THREE.Mesh(geo, mat);
    }
    return fn();
  }

  static dispose() {
    for (const key in _cache) {
      if (_cache[key].dispose) _cache[key].dispose();
    }
  }
}
