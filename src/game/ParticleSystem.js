import * as THREE from 'three';

/**
 * ParticleSystem — lightweight GPU-based sparkle particles in Three.js.
 * Uses a single Points object with instanced positions + lifetimes.
 */
const MAX_PARTICLES = 200;

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];  // { position, velocity, life, maxLife, color, size }

    // Shared geometry (point sprites)
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);
    this.alphas = new Float32Array(MAX_PARTICLES);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  /**
   * Emit sparkle particles at a world position.
   * @param {THREE.Vector3|{x,y,z}} pos  — emission center
   * @param {object} opts
   * @param {number} [opts.count=8]       — number of particles
   * @param {number} [opts.color=0xffd700] — base color (hex)
   * @param {number} [opts.speed=3]        — initial speed
   * @param {number} [opts.life=0.6]       — lifetime in seconds
   */
  emit(pos, { count = 8, color = 0xffd700, speed = 3, life = 0.6 } = {}) {
    const c = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        // Recycle oldest
        this.particles.shift();
      }

      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI - Math.PI / 2;
      const s = speed * (0.5 + Math.random() * 0.5);

      this.particles.push({
        x: pos.x, y: pos.y, z: pos.z,
        vx: Math.cos(angle1) * Math.cos(angle2) * s,
        vy: Math.sin(angle2) * s + 1.5, // slight upward bias
        vz: Math.sin(angle1) * Math.cos(angle2) * s,
        life,
        maxLife: life,
        r: c.r, g: c.g, b: c.b,
        size: 0.1 + Math.random() * 0.15,
      });
    }
  }

  /** Emit a special chain burst (larger, more particles) */
  emitChainBurst(pos, tierIndex) {
    const tierColors = [0x43b047, 0x049cd8, 0xfbd000, 0xe52521];
    const color = tierColors[Math.min(tierIndex, tierColors.length - 1)];
    const count = 12 + tierIndex * 8;
    this.emit(pos, { count, color, speed: 4 + tierIndex, life: 0.8 + tierIndex * 0.2 });
  }

  update(dt) {
    let idx = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.vy -= 5 * dt; // gravity
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
    }

    // Write to buffers
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const t = p.life / p.maxLife; // 1→0

        this.positions[i * 3] = p.x;
        this.positions[i * 3 + 1] = p.y;
        this.positions[i * 3 + 2] = p.z;

        this.colors[i * 3] = p.r;
        this.colors[i * 3 + 1] = p.g;
        this.colors[i * 3 + 2] = p.b;

        this.sizes[i] = p.size * t;
      } else {
        // Hide unused particles far away
        this.positions[i * 3] = 0;
        this.positions[i * 3 + 1] = -100;
        this.positions[i * 3 + 2] = 0;
        this.sizes[i] = 0;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;

    // Fade master opacity based on active particles
    this.material.opacity = this.particles.length > 0 ? 0.9 : 0;
  }

  dispose() {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}
