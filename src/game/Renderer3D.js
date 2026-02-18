import * as THREE from 'three';
import * as C from './constants.js';
import { ParticleSystem } from './ParticleSystem.js';
import { ItemMeshFactory } from './ItemMeshFactory.js';

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
    this.tableMesh = this.createTable();
    this.wallMeshes = this.createWalls();
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

    // Item mesh management
    this.itemMeshes = new Map();

    // Drop indicator
    this.dropIndicator = this.createDropIndicator();

    // Background scene (sky + hills)
    this.bgRefs = this.createBackground();

    // Boss mesh (created on demand)
    this.bossMesh = null;

    // Particle system
    this.particles = new ParticleSystem(this.scene);

    // Raycaster for screen-to-world conversion
    this.raycaster = new THREE.Raycaster();
    this.dropPlane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      -C.DROP_Y
    );

    // Animation time for item idle animations
    this._time = 0;
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

    return mesh;
  }

  createWalls() {
    const mat = new THREE.MeshStandardMaterial(C.MATERIAL_CONFIG.wall);
    const walls = [];

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
    walls.push(back);

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
    walls.push(left);

    // Right wall
    const right = new THREE.Mesh(sideGeo, mat);
    right.position.set(C.TABLE_WIDTH / 2 + C.WALL_THICKNESS / 2, C.WALL_HEIGHT / 2, 0);
    right.castShadow = true;
    right.receiveShadow = true;
    this.scene.add(right);
    walls.push(right);

    return walls;
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
    const refs = { sky: null, hills: [], clouds: [], scrollables: [] };
    // scrollables: { mesh, speed, xMin, xMax, startX } — objects that scroll right-to-left

    // ── Sky gradient ──
    const skyGeo = new THREE.PlaneGeometry(80, 35);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x4a90d9) },
        bottomColor: { value: new THREE.Color(0x87ceeb) },
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
    sky.position.set(0, 8, -22);
    sky.renderOrder = -1;
    this.scene.add(sky);
    refs.sky = sky;

    // ── Green hills (slow parallax layer) ──
    const hillMat = new THREE.MeshStandardMaterial({
      color: 0x43b047, roughness: 0.9, metalness: 0.0,
    });

    const hillConfigs = [
      { radius: 8, x: -10, y: -2, z: -18, sx: 1.5, sy: 0.6, speed: 0.15 },
      { radius: 5, x: 5, y: -2, z: -16, sx: 1.2, sy: 0.7, speed: 0.15 },
      { radius: 6, x: 20, y: -2, z: -17, sx: 1.4, sy: 0.55, speed: 0.15 },
      { radius: 3, x: -20, y: -2, z: -19, sx: 1.3, sy: 0.5, speed: 0.15 },
      { radius: 4, x: 35, y: -2, z: -17, sx: 1.1, sy: 0.65, speed: 0.15 },
    ];

    for (const hc of hillConfigs) {
      const geo = new THREE.SphereGeometry(hc.radius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const mesh = new THREE.Mesh(geo, hillMat);
      mesh.position.set(hc.x, hc.y, hc.z);
      mesh.scale.set(hc.sx, hc.sy, 1);
      this.scene.add(mesh);
      refs.hills.push(mesh);
      refs.scrollables.push({ mesh, speed: hc.speed, xMin: -45, xMax: 45, startX: hc.x });
    }

    // ── Clouds (medium parallax layer) — varied shapes & tints ──
    const sphereGeo = new THREE.SphereGeometry(1, 8, 6);

    // Cloud shape builders — each returns a THREE.Group
    const cloudShapes = [
      // Type A: wide & puffy (classic Mario cloud)
      (mat) => {
        const g = new THREE.Group();
        const c1 = new THREE.Mesh(sphereGeo, mat); c1.scale.set(1.8, 0.9, 1);
        const c2 = new THREE.Mesh(sphereGeo, mat); c2.position.set(1.3, 0.4, 0); c2.scale.set(1.3, 0.8, 0.9);
        const c3 = new THREE.Mesh(sphereGeo, mat); c3.position.set(-1.2, 0.3, 0); c3.scale.set(1.1, 0.7, 0.9);
        const c4 = new THREE.Mesh(sphereGeo, mat); c4.position.set(0, 0.5, 0); c4.scale.set(1.0, 0.7, 0.8);
        g.add(c1, c2, c3, c4);
        return g;
      },
      // Type B: tall & narrow tower cloud
      (mat) => {
        const g = new THREE.Group();
        const c1 = new THREE.Mesh(sphereGeo, mat); c1.scale.set(1.0, 1.2, 0.9);
        const c2 = new THREE.Mesh(sphereGeo, mat); c2.position.set(0.5, 0.7, 0); c2.scale.set(0.9, 1.0, 0.8);
        const c3 = new THREE.Mesh(sphereGeo, mat); c3.position.set(-0.4, 0.5, 0.2); c3.scale.set(0.8, 0.8, 0.7);
        g.add(c1, c2, c3);
        return g;
      },
      // Type C: flat & stretched wispy cloud
      (mat) => {
        const g = new THREE.Group();
        const c1 = new THREE.Mesh(sphereGeo, mat); c1.scale.set(2.2, 0.4, 0.8);
        const c2 = new THREE.Mesh(sphereGeo, mat); c2.position.set(1.6, 0.1, 0); c2.scale.set(1.4, 0.35, 0.7);
        const c3 = new THREE.Mesh(sphereGeo, mat); c3.position.set(-1.5, 0.08, 0); c3.scale.set(1.2, 0.3, 0.6);
        g.add(c1, c2, c3);
        return g;
      },
      // Type D: small round puff (single fluffy ball)
      (mat) => {
        const g = new THREE.Group();
        const c1 = new THREE.Mesh(sphereGeo, mat); c1.scale.set(1.1, 0.9, 1.0);
        const c2 = new THREE.Mesh(sphereGeo, mat); c2.position.set(0.6, 0.25, 0); c2.scale.set(0.7, 0.6, 0.7);
        g.add(c1, c2);
        return g;
      },
      // Type E: big chunky cumulus
      (mat) => {
        const g = new THREE.Group();
        const c1 = new THREE.Mesh(sphereGeo, mat); c1.scale.set(1.6, 1.1, 1);
        const c2 = new THREE.Mesh(sphereGeo, mat); c2.position.set(1.0, 0.3, 0.2); c2.scale.set(1.3, 0.9, 0.8);
        const c3 = new THREE.Mesh(sphereGeo, mat); c3.position.set(-0.9, 0.2, -0.1); c3.scale.set(1.1, 0.8, 0.9);
        const c4 = new THREE.Mesh(sphereGeo, mat); c4.position.set(0.2, 0.7, 0); c4.scale.set(1.0, 0.6, 0.7);
        const c5 = new THREE.Mesh(sphereGeo, mat); c5.position.set(-0.3, -0.1, 0.3); c5.scale.set(0.9, 0.5, 0.8);
        g.add(c1, c2, c3, c4, c5);
        return g;
      },
    ];

    // Different cloud tints
    const cloudTints = [
      { color: 0xffffff, opacity: 0.9 },   // pure white
      { color: 0xe8f0ff, opacity: 0.85 },   // icy blue-white
      { color: 0xfff0e0, opacity: 0.8 },    // warm sunset cream
      { color: 0xffd6e8, opacity: 0.75 },   // sakura pink
      { color: 0xd4f0ff, opacity: 0.85 },   // sky blue
      { color: 0xfff8cc, opacity: 0.8 },    // lemon yellow
      { color: 0xe0ffe0, opacity: 0.7 },    // mint green tint
    ];

    const cloudConfigs = [
      { x: -12,  y: 10,   z: -15, scale: 1.2, speed: 0.4,  shape: 0, tint: 0 },
      { x: 3,    y: 11,   z: -17, scale: 0.9, speed: 0.35, shape: 2, tint: 1 },
      { x: 18,   y: 9,    z: -14, scale: 0.7, speed: 0.45, shape: 3, tint: 3 },
      { x: -25,  y: 10.5, z: -16, scale: 1.0, speed: 0.38, shape: 1, tint: 2 },
      { x: 30,   y: 11.5, z: -18, scale: 0.8, speed: 0.42, shape: 4, tint: 0 },
      { x: -35,  y: 9.5,  z: -15, scale: 0.6, speed: 0.32, shape: 2, tint: 4 },
      { x: 40,   y: 10,   z: -16, scale: 1.1, speed: 0.36, shape: 0, tint: 5 },
      { x: -5,   y: 12,   z: -19, scale: 0.5, speed: 0.28, shape: 3, tint: 6 },
      { x: 25,   y: 12.5, z: -20, scale: 0.7, speed: 0.25, shape: 1, tint: 3 },
    ];

    for (const cc of cloudConfigs) {
      const tint = cloudTints[cc.tint % cloudTints.length];
      const mat = new THREE.MeshBasicMaterial({
        color: tint.color, transparent: true, opacity: tint.opacity,
      });
      const builder = cloudShapes[cc.shape % cloudShapes.length];
      const group = builder(mat);
      group.position.set(cc.x, cc.y, cc.z);
      group.scale.setScalar(cc.scale);
      this.scene.add(group);
      refs.clouds.push(group);
      refs.scrollables.push({ mesh: group, speed: cc.speed, xMin: -50, xMax: 50, startX: cc.x });
    }

    // ── Mario-style foreground decorations (fast parallax) ──

    // Green Pipe decoration
    const createPipeDeco = (x, z, height, speed) => {
      const group = new THREE.Group();
      const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, height, 12);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x43b047, metalness: 0.2, roughness: 0.7 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = height / 2;
      group.add(body);
      const lipGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.2, 12);
      const lipMat = new THREE.MeshStandardMaterial({ color: 0x2d8a2d, metalness: 0.2, roughness: 0.6 });
      const lip = new THREE.Mesh(lipGeo, lipMat);
      lip.position.y = height + 0.1;
      group.add(lip);
      const insideGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 12);
      const insideMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const inside = new THREE.Mesh(insideGeo, insideMat);
      inside.position.y = height + 0.18;
      group.add(inside);
      group.position.set(x, -2, z);
      this.scene.add(group);
      refs.scrollables.push({ mesh: group, speed, xMin: -40, xMax: 40, startX: x });
    };

    createPipeDeco(-15, -12, 2.5, 0.6);
    createPipeDeco(12, -13, 1.8, 0.6);
    createPipeDeco(30, -11, 3.0, 0.6);

    // Brick block / question block decorations floating in background
    const createBlockDeco = (x, y, z, isQuestion, speed) => {
      const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const mat = new THREE.MeshStandardMaterial({
        color: isQuestion ? 0xfbd000 : 0xc4713b,
        metalness: 0.15,
        roughness: 0.75,
        emissive: isQuestion ? 0xfbd000 : 0x000000,
        emissiveIntensity: isQuestion ? 0.08 : 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      this.scene.add(mesh);
      refs.scrollables.push({ mesh, speed, xMin: -40, xMax: 40, startX: x });
    };

    // A row of blocks at different depths
    createBlockDeco(-18, 6, -12, true, 0.5);
    createBlockDeco(-16.4, 6, -12, false, 0.5);
    createBlockDeco(-14.8, 6, -12, false, 0.5);
    createBlockDeco(-13.2, 6, -12, true, 0.5);
    createBlockDeco(20, 4, -11, false, 0.55);
    createBlockDeco(21.6, 4, -11, true, 0.55);
    createBlockDeco(23.2, 4, -11, false, 0.55);

    // Bushes (small green rounded shapes near ground)
    const bushMat = new THREE.MeshStandardMaterial({
      color: 0x2d8a2d, roughness: 0.9, metalness: 0,
    });

    const createBush = (x, z, scale, speed) => {
      const group = new THREE.Group();
      const sg = new THREE.SphereGeometry(0.8, 10, 8);
      const b1 = new THREE.Mesh(sg, bushMat);
      b1.scale.set(1.3, 0.7, 1);
      const b2 = new THREE.Mesh(sg, bushMat);
      b2.position.set(0.8, -0.1, 0);
      b2.scale.set(0.9, 0.55, 0.8);
      const b3 = new THREE.Mesh(sg, bushMat);
      b3.position.set(-0.7, -0.1, 0);
      b3.scale.set(0.8, 0.5, 0.8);
      group.add(b1, b2, b3);
      group.position.set(x, -1.5, z);
      group.scale.setScalar(scale);
      this.scene.add(group);
      refs.scrollables.push({ mesh: group, speed, xMin: -40, xMax: 40, startX: x });
    };

    createBush(-8, -11, 1.0, 0.55);
    createBush(5, -12, 0.8, 0.55);
    createBush(22, -10, 1.2, 0.55);
    createBush(-22, -12, 0.9, 0.55);

    // ── Floating background stars (slow twinkle layer) ──
    const starGeo = new THREE.OctahedronGeometry(0.3, 0);
    const starConfigs = [
      { x: -30, y: 8,  z: -13, color: 0xfbd000, scale: 0.8, speed: 0.3 },
      { x: 15,  y: 13, z: -19, color: 0xffffff, scale: 0.5, speed: 0.2 },
      { x: -8,  y: 14, z: -20, color: 0xffd6e8, scale: 0.6, speed: 0.22 },
      { x: 35,  y: 7,  z: -12, color: 0xfbd000, scale: 0.7, speed: 0.33 },
      { x: -18, y: 12, z: -18, color: 0xd4f0ff, scale: 0.4, speed: 0.18 },
      { x: 42,  y: 11, z: -17, color: 0xfff8cc, scale: 0.55, speed: 0.26 },
    ];
    for (const sc of starConfigs) {
      const mat = new THREE.MeshBasicMaterial({
        color: sc.color, transparent: true, opacity: 0.9,
      });
      const mesh = new THREE.Mesh(starGeo, mat);
      mesh.position.set(sc.x, sc.y, sc.z);
      mesh.scale.setScalar(sc.scale);
      mesh.rotation.y = Math.random() * Math.PI;
      this.scene.add(mesh);
      refs.scrollables.push({ mesh, speed: sc.speed, xMin: -50, xMax: 50, startX: sc.x });
    }

    // ── Rainbow arc (static, slow drift) ──
    const rainbowColors = [0xe52521, 0xff8c00, 0xfbd000, 0x43b047, 0x049cd8, 0x6b3fa0];
    const rainbowGroup = new THREE.Group();
    for (let i = 0; i < rainbowColors.length; i++) {
      const radius = 8 - i * 0.5;
      const tubeR = 0.2;
      const arcGeo = new THREE.TorusGeometry(radius, tubeR, 8, 32, Math.PI);
      const arcMat = new THREE.MeshBasicMaterial({
        color: rainbowColors[i], transparent: true, opacity: 0.35,
      });
      const arc = new THREE.Mesh(arcGeo, arcMat);
      rainbowGroup.add(arc);
    }
    rainbowGroup.position.set(28, 2, -21);
    rainbowGroup.rotation.z = 0;
    rainbowGroup.scale.set(1.0, 0.7, 1);
    this.scene.add(rainbowGroup);
    refs.scrollables.push({ mesh: rainbowGroup, speed: 0.12, xMin: -50, xMax: 55, startX: 28 });

    return refs;
  }

  // ─── Scene switching ───
  setScene(sceneId) {
    const sceneConfig = C.SCENES[sceneId];
    if (!sceneConfig) return;

    // Update background
    this.scene.background = new THREE.Color(sceneConfig.background);

    // Update sky shader uniforms
    if (this.bgRefs.sky) {
      this.bgRefs.sky.material.uniforms.topColor.value.set(sceneConfig.skyTop);
      this.bgRefs.sky.material.uniforms.bottomColor.value.set(sceneConfig.skyBottom);
    }

    // Update hill colors
    for (const hill of this.bgRefs.hills) {
      hill.material.color.set(sceneConfig.hillColor);
    }

    // Update table color
    if (this.tableMesh) {
      this.tableMesh.material.color.set(sceneConfig.tableColor);
    }

    // Update wall colors
    for (const wall of this.wallMeshes) {
      wall.material.color.set(sceneConfig.wallColor);
    }
  }

  // ─── Pusher width for effects ───
  setPusherWidth(newWidth) {
    const scale = newWidth / C.PUSHER_WIDTH;
    this.pusherMesh.scale.x = scale;
  }

  // ─── Boss Bowser mesh ───
  showBoss() {
    if (this.bossMesh) return;

    const group = new THREE.Group();

    // Body (green sphere shell)
    const shellGeo = new THREE.SphereGeometry(1.2, 16, 12);
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0x2d5a27,
      metalness: 0.2,
      roughness: 0.7,
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    shell.scale.set(1, 0.8, 1);
    shell.position.y = 1.2;
    group.add(shell);

    // Head
    const headGeo = new THREE.SphereGeometry(0.6, 12, 10);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffc107, metalness: 0.1, roughness: 0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 2.2, 0.6);
    group.add(head);

    // Horns
    const hornGeo = new THREE.ConeGeometry(0.15, 0.5, 8);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.5 });
    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.position.set(-0.35, 2.7, 0.5);
    leftHorn.rotation.z = 0.3;
    group.add(leftHorn);
    const rightHorn = new THREE.Mesh(hornGeo, hornMat);
    rightHorn.position.set(0.35, 2.7, 0.5);
    rightHorn.rotation.z = -0.3;
    group.add(rightHorn);

    // Spikes on shell
    const spikeGeo = new THREE.ConeGeometry(0.12, 0.4, 6);
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.5 });
    for (let i = 0; i < 5; i++) {
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      const angle = (i / 5) * Math.PI * 1.2 - 0.3;
      spike.position.set(
        Math.sin(angle) * 0.9,
        1.8 + Math.cos(angle) * 0.3,
        -Math.cos(angle) * 0.6
      );
      spike.rotation.x = -angle * 0.5;
      group.add(spike);
    }

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.12, 8, 6);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.2, 2.3, 1.1);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.2, 2.3, 1.1);
    group.add(rightEye);

    group.position.set(0, 0, -C.TABLE_DEPTH / 2 - 1.5);
    group.scale.setScalar(0.8);
    this.scene.add(group);
    this.bossMesh = group;
  }

  hideBoss() {
    if (this.bossMesh) {
      this.scene.remove(this.bossMesh);
      this.bossMesh = null;
    }
  }

  flashBossDamage() {
    if (!this.bossMesh) return;
    // Quick red flash
    this.bossMesh.traverse(child => {
      if (child.isMesh && child.material) {
        const origEmissive = child.material.emissive?.clone();
        child.material.emissive?.set(0xff0000);
        child.material.emissiveIntensity = 1;
        setTimeout(() => {
          if (origEmissive) child.material.emissive.copy(origEmissive);
          child.material.emissiveIntensity = 0;
        }, 150);
      }
    });
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
    const dt = gameState.dt || 0.016;
    this._time += dt;

    // Sync pusher
    if (gameState.pusherBody) {
      this.pusherMesh.position.copy(gameState.pusherBody.position);
      this.pusherMesh.quaternion.copy(gameState.pusherBody.quaternion);
    }

    // Sync coins
    this.syncCoins(gameState.coins);

    // Sync items
    this.syncItems(gameState.items);

    // Animate scrolling background (right-to-left parallax)
    if (this.bgRefs?.scrollables) {
      for (const s of this.bgRefs.scrollables) {
        s.mesh.position.x -= s.speed * dt;
        // Wrap around when off-screen left → reappear on right
        if (s.mesh.position.x < s.xMin) {
          s.mesh.position.x = s.xMax;
        }
      }
    }

    // Animate boss
    if (this.bossMesh) {
      this.bossMesh.rotation.y = Math.sin(this._time * 0.5) * 0.1;
      this.bossMesh.position.y = Math.sin(this._time * 0.8) * 0.15;
    }

    // Update drop indicator
    if (gameState.dropX !== undefined) {
      this.dropIndicator.position.x = gameState.dropX;
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

  syncItems(items) {
    if (!items) return;

    const activeIds = new Set();

    for (const item of items) {
      activeIds.add(item.id);

      let mesh = this.itemMeshes.get(item.id);
      if (!mesh) {
        mesh = ItemMeshFactory.create(item.type);
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.itemMeshes.set(item.id, { mesh, type: item.type });
      } else {
        mesh = mesh.mesh;
      }

      mesh.position.copy(item.body.position);
      mesh.quaternion.copy(item.body.quaternion);

      // Idle animations
      if (item.type === 'star') {
        mesh.rotation.y = this._time * 2;
      } else if (item.type === 'question_block') {
        mesh.position.y = item.body.position.y + Math.sin(this._time * 3) * 0.05;
      } else if (item.type === 'fire_flower') {
        mesh.rotation.y = this._time * 1.5;
      }
    }

    // Remove meshes for deleted items
    for (const [id, entry] of this.itemMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(entry.mesh);
        this.itemMeshes.delete(id);
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

    // Dispose item meshes
    for (const [, entry] of this.itemMeshes) {
      this.scene.remove(entry.mesh);
    }
    this.itemMeshes.clear();

    // Dispose boss
    this.hideBoss();

    this.coinGeometry.dispose();
    this.coinMaterial.dispose();
    ItemMeshFactory.dispose();

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
