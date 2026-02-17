import * as THREE from 'three';
import * as C from './constants.js';
import { ParticleSystem } from './ParticleSystem.js';

export class Renderer3D {
  constructor(container) {
    this.container = container;

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(C.VIEWPORT_WIDTH, C.VIEWPORT_HEIGHT);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.6;
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(C.MATERIAL_CONFIG.background);

    // Camera
    this.camera = this.createCamera();

    // Lights
    this.createLights();

    // Static meshes
    this.createTable();
    this.createWalls();
    this.createCollectionTray();
    this.pusherMesh = this.createPusher();

    // Coin mesh management
    this.coinMeshes = new Map();
    this.coinGeometry = new THREE.CylinderGeometry(
      C.COIN_RADIUS, C.COIN_RADIUS, C.COIN_HEIGHT, 24
    );
    this.coinMaterial = new THREE.MeshStandardMaterial({
      ...C.MATERIAL_CONFIG.coin,
    });

    // Drop indicator
    this.dropIndicator = this.createDropIndicator();

    // Background scene (sky + hills)
    this.createBackground();

    // Particle system
    this.particles = new ParticleSystem(this.scene);

    // Raycaster for screen-to-world conversion
    this.raycaster = new THREE.Raycaster();
    this.dropPlane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      -C.DROP_Y
    );
  }

  createCamera() {
    const cam = new THREE.PerspectiveCamera(
      C.CAMERA_FOV,
      C.VIEWPORT_WIDTH / C.VIEWPORT_HEIGHT,
      0.1,
      100
    );
    cam.position.set(
      C.CAMERA_POSITION.x,
      C.CAMERA_POSITION.y,
      C.CAMERA_POSITION.z
    );
    cam.lookAt(
      C.CAMERA_LOOK_AT.x,
      C.CAMERA_LOOK_AT.y,
      C.CAMERA_LOOK_AT.z
    );
    return cam;
  }

  createLights() {
    // Ambient fill — bright and warm
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambient);

    // Main directional light with shadows
    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -8;
    dirLight.shadow.camera.right = 8;
    dirLight.shadow.camera.top = 8;
    dirLight.shadow.camera.bottom = -8;
    this.scene.add(dirLight);

    // Secondary fill light from the front
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-3, 8, 10);
    this.scene.add(fillLight);

    // Warm spot light on the playing area
    const spot = new THREE.SpotLight(0xffd700, 1.0, 25, Math.PI / 5);
    spot.position.set(0, 12, -2);
    spot.target.position.set(0, 0, 1);
    this.scene.add(spot);
    this.scene.add(spot.target);
  }

  createTable() {
    const geo = new THREE.BoxGeometry(C.TABLE_WIDTH, C.TABLE_THICKNESS, C.TABLE_DEPTH);
    const mat = new THREE.MeshStandardMaterial(C.MATERIAL_CONFIG.table);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, -C.TABLE_THICKNESS / 2, 0);
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Table edge trim (front edge indicator)
    const edgeGeo = new THREE.BoxGeometry(C.TABLE_WIDTH, 0.05, 0.05);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 0.3 });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(0, 0.025, C.TABLE_DEPTH / 2);
    this.scene.add(edge);
  }

  createWalls() {
    const mat = new THREE.MeshStandardMaterial(C.MATERIAL_CONFIG.wall);

    // Back wall
    const backGeo = new THREE.BoxGeometry(
      C.TABLE_WIDTH + C.WALL_THICKNESS * 2,
      C.WALL_HEIGHT,
      C.WALL_THICKNESS
    );
    const back = new THREE.Mesh(backGeo, mat);
    back.position.set(0, C.WALL_HEIGHT / 2, -C.TABLE_DEPTH / 2 - C.WALL_THICKNESS / 2);
    back.castShadow = true;
    back.receiveShadow = true;
    this.scene.add(back);

    // Left wall
    const sideGeo = new THREE.BoxGeometry(
      C.WALL_THICKNESS,
      C.WALL_HEIGHT,
      C.TABLE_DEPTH
    );
    const left = new THREE.Mesh(sideGeo, mat);
    left.position.set(-C.TABLE_WIDTH / 2 - C.WALL_THICKNESS / 2, C.WALL_HEIGHT / 2, 0);
    left.castShadow = true;
    left.receiveShadow = true;
    this.scene.add(left);

    // Right wall
    const right = new THREE.Mesh(sideGeo, mat);
    right.position.set(C.TABLE_WIDTH / 2 + C.WALL_THICKNESS / 2, C.WALL_HEIGHT / 2, 0);
    right.castShadow = true;
    right.receiveShadow = true;
    this.scene.add(right);
  }

  createPusher() {
    // Mario brick-style pusher — main body + top trim + brick lines
    const group = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.BoxGeometry(C.PUSHER_WIDTH, C.PUSHER_HEIGHT, C.PUSHER_DEPTH);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xc4713b,   // warm brick orange
      metalness: 0.15,
      roughness: 0.85,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Top metallic trim
    const trimGeo = new THREE.BoxGeometry(C.PUSHER_WIDTH + 0.05, 0.08, C.PUSHER_DEPTH + 0.05);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd4a44a,
      metalness: 0.6,
      roughness: 0.3,
    });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = C.PUSHER_HEIGHT / 2 + 0.04;
    trim.castShadow = true;
    group.add(trim);

    // Front face accent (push face — brighter)
    const frontGeo = new THREE.BoxGeometry(C.PUSHER_WIDTH, C.PUSHER_HEIGHT * 0.8, 0.04);
    const frontMat = new THREE.MeshStandardMaterial({
      color: 0xe08840,
      metalness: 0.2,
      roughness: 0.7,
      emissive: 0xe08840,
      emissiveIntensity: 0.05,
    });
    const front = new THREE.Mesh(frontGeo, frontMat);
    front.position.z = C.PUSHER_DEPTH / 2 + 0.02;
    group.add(front);

    this.scene.add(group);
    return group;
  }

  createCollectionTray() {
    // Tray below the front edge
    const geo = new THREE.BoxGeometry(C.TABLE_WIDTH + 1, 0.2, 2);
    const mat = new THREE.MeshStandardMaterial({
      ...C.MATERIAL_CONFIG.tray,
      transparent: true,
      opacity: 0.7,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, -2, C.TABLE_DEPTH / 2 + 1.5);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  createDropIndicator() {
    const geo = new THREE.RingGeometry(C.COIN_RADIUS * 0.8, C.COIN_RADIUS * 1.2, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfbd000,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, C.DROP_Y, C.DROP_Z);
    this.scene.add(mesh);

    // Also add a vertical line from indicator down to table
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, C.DROP_Y, C.DROP_Z),
      new THREE.Vector3(0, 0.1, C.DROP_Z),
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xfbd000,
      dashSize: 0.3,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.4,
    });
    this.dropLine = new THREE.Line(lineGeo, lineMat);
    this.dropLine.computeLineDistances();
    this.scene.add(this.dropLine);

    return mesh;
  }

  createBackground() {
    // Sky gradient — large back plane
    const skyGeo = new THREE.PlaneGeometry(60, 30);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x4a90d9) },    // bright blue
        bottomColor: { value: new THREE.Color(0x87ceeb) },  // light sky blue
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0);
        }
      `,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.position.set(0, 8, -20);
    sky.renderOrder = -1;
    this.scene.add(sky);

    // Green hills — simple curved shapes
    const hillMat = new THREE.MeshStandardMaterial({
      color: 0x43b047,
      roughness: 0.9,
      metalness: 0.0,
    });

    // Large hill
    const hill1Geo = new THREE.SphereGeometry(8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const hill1 = new THREE.Mesh(hill1Geo, hillMat);
    hill1.position.set(-6, -2, -16);
    hill1.scale.set(1.5, 0.6, 1);
    this.scene.add(hill1);

    // Medium hill
    const hill2Geo = new THREE.SphereGeometry(5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const hill2 = new THREE.Mesh(hill2Geo, hillMat);
    hill2.position.set(8, -2, -14);
    hill2.scale.set(1.2, 0.7, 1);
    this.scene.add(hill2);

    // Small hill
    const hill3Geo = new THREE.SphereGeometry(3, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const hill3 = new THREE.Mesh(hill3Geo, hillMat);
    hill3.position.set(2, -2, -18);
    hill3.scale.set(1.3, 0.5, 1);
    this.scene.add(hill3);

    // Simple white clouds
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });

    const createCloud = (x, y, z, scale) => {
      const group = new THREE.Group();
      const s = new THREE.SphereGeometry(1, 8, 6);
      const c1 = new THREE.Mesh(s, cloudMat);
      c1.scale.set(1.5, 0.8, 1);
      const c2 = new THREE.Mesh(s, cloudMat);
      c2.position.set(1.2, 0.3, 0);
      c2.scale.set(1.2, 0.7, 0.9);
      const c3 = new THREE.Mesh(s, cloudMat);
      c3.position.set(-1.1, 0.2, 0);
      c3.scale.set(1.0, 0.6, 0.8);
      group.add(c1, c2, c3);
      group.position.set(x, y, z);
      group.scale.setScalar(scale);
      this.scene.add(group);
    };

    createCloud(-8, 10, -15, 1.2);
    createCloud(5, 11, -17, 0.9);
    createCloud(12, 9, -13, 0.7);
  }

  // ─── Particle helpers (called from GameEngine) ───
  emitParticles(pos, opts) {
    this.particles.emit(pos, opts);
  }

  emitChainBurst(pos, tierIndex) {
    this.particles.emitChainBurst(pos, tierIndex);
  }

  updateParticles(dt) {
    this.particles.update(dt);
  }

  render(gameState) {
    // Sync pusher
    if (gameState.pusherBody) {
      this.pusherMesh.position.copy(gameState.pusherBody.position);
      this.pusherMesh.quaternion.copy(gameState.pusherBody.quaternion);
    }

    // Sync coins
    this.syncCoins(gameState.coins);

    // Update drop indicator
    if (gameState.dropX !== undefined) {
      this.dropIndicator.position.x = gameState.dropX;
      // Update drop line positions
      const positions = this.dropLine.geometry.attributes.position.array;
      positions[0] = gameState.dropX;
      positions[3] = gameState.dropX;
      this.dropLine.geometry.attributes.position.needsUpdate = true;
      this.dropLine.computeLineDistances();
    }

    // Render frame
    this.renderer.render(this.scene, this.camera);
  }

  syncCoins(coins) {
    if (!coins) return;

    const activeIds = new Set();

    for (const coin of coins) {
      activeIds.add(coin.id);

      let mesh = this.coinMeshes.get(coin.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.coinMeshes.set(coin.id, mesh);
      }

      mesh.position.copy(coin.body.position);
      mesh.quaternion.copy(coin.body.quaternion);
    }

    // Remove meshes for deleted coins
    for (const [id, mesh] of this.coinMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.coinMeshes.delete(id);
      }
    }
  }

  screenToWorldX(screenX, screenY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );

    this.raycaster.setFromCamera(ndc, this.camera);

    const intersection = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.dropPlane, intersection);
    if (hit) {
      return Math.max(-C.DROP_X_RANGE, Math.min(C.DROP_X_RANGE, intersection.x));
    }
    return 0;
  }

  getCanvas() {
    return this.renderer.domElement;
  }

  dispose() {
    // Dispose particles
    this.particles.dispose();

    // Dispose coin meshes
    for (const [, mesh] of this.coinMeshes) {
      this.scene.remove(mesh);
    }
    this.coinMeshes.clear();

    this.coinGeometry.dispose();
    this.coinMaterial.dispose();

    // Dispose all scene children
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
