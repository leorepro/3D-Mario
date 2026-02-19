import * as THREE from 'three';
import * as C from './constants.js';
import { ParticleSystem } from './ParticleSystem.js';
import { ItemMeshFactory } from './ItemMeshFactory.js';

export class Renderer3D {
  constructor(container, quality) {
    this.container = container;
    this.quality = quality;

    // WebGL Renderer — quality-dependent settings
    const useAA = quality ? quality.get('antialias') : true;
    this.renderer = new THREE.WebGLRenderer({ antialias: useAA, alpha: false });
    this.renderer.setSize(C.VIEWPORT_WIDTH, C.VIEWPORT_HEIGHT);
    const prCap = quality ? quality.get('pixelRatioCap') : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, prCap));

    const shadowSize = quality ? quality.get('shadowMapSize') : 1024;
    this.renderer.shadowMap.enabled = shadowSize > 0;
    if (shadowSize > 0) {
      const sType = quality ? quality.get('shadowType') : 'PCFSoft';
      this.renderer.shadowMap.type = sType === 'PCFSoft'
        ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    }
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.6;
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x5cb8ff);

    // Camera
    this.camera = this.createCamera();

    // Lights
    this.createLights();

    // Static meshes
    this.tableMesh = this.createTable();
    this.wallMeshes = this.createWalls();
    this.createCollectionTray();
    this.pusherMesh = this.createPusherMesh(
      C.PUSHER_WIDTH, C.PUSHER_HEIGHT, C.PUSHER_DEPTH
    );
    this.createBarrier();

    // Coin InstancedMesh — separate meshes for small and large coins
    const coinSegments = quality ? quality.get('coinRenderSegments') : 24;
    const maxCoins = quality ? quality.get('maxCoins') : 999;
    const coinCastShadow = quality ? quality.get('coinCastShadow') : true;

    this.coinTextures = this.createCoinTextures();
    this.coinMaterials = [
      new THREE.MeshStandardMaterial({  // side (edge)
        color: C.MATERIAL_CONFIG.coinEdge.color,
        metalness: C.MATERIAL_CONFIG.coinEdge.metalness,
        roughness: C.MATERIAL_CONFIG.coinEdge.roughness,
      }),
      new THREE.MeshStandardMaterial({  // top cap (star)
        map: this.coinTextures.top,
        metalness: 0.7,
        roughness: 0.25,
      }),
      new THREE.MeshStandardMaterial({  // bottom cap (M)
        map: this.coinTextures.bottom,
        metalness: 0.7,
        roughness: 0.25,
      }),
    ];

    // Small coin InstancedMesh
    this.smallCoinGeometry = new THREE.CylinderGeometry(
      C.COIN_SIZES.small.radius, C.COIN_SIZES.small.radius, C.COIN_SIZES.small.height, coinSegments
    );
    this.smallCoinInstancedMesh = new THREE.InstancedMesh(
      this.smallCoinGeometry, this.coinMaterials, maxCoins
    );
    this.smallCoinInstancedMesh.castShadow = coinCastShadow;
    this.smallCoinInstancedMesh.receiveShadow = true;
    this.smallCoinInstancedMesh.count = 0;
    this.smallCoinInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.smallCoinInstancedMesh);

    // Large coin InstancedMesh
    this.largeCoinGeometry = new THREE.CylinderGeometry(
      C.COIN_SIZES.large.radius, C.COIN_SIZES.large.radius, C.COIN_SIZES.large.height, coinSegments
    );
    this.largeCoinInstancedMesh = new THREE.InstancedMesh(
      this.largeCoinGeometry, this.coinMaterials, maxCoins
    );
    this.largeCoinInstancedMesh.castShadow = coinCastShadow;
    this.largeCoinInstancedMesh.receiveShadow = true;
    this.largeCoinInstancedMesh.count = 0;
    this.largeCoinInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.largeCoinInstancedMesh);

    // Reusable objects for per-frame matrix updates (no allocation)
    this._coinMatrix = new THREE.Matrix4();
    this._coinPos = new THREE.Vector3();
    this._coinQuat = new THREE.Quaternion();
    this._coinScale = new THREE.Vector3(1, 1, 1);

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
    const shadowSize = this.quality ? this.quality.get('shadowMapSize') : 1024;
    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = shadowSize > 0;
    if (shadowSize > 0) {
      dirLight.shadow.mapSize.width = shadowSize;
      dirLight.shadow.mapSize.height = shadowSize;
      dirLight.shadow.camera.near = 1;
      dirLight.shadow.camera.far = 30;
      dirLight.shadow.camera.left = -8;
      dirLight.shadow.camera.right = 8;
      dirLight.shadow.camera.top = 8;
      dirLight.shadow.camera.bottom = -8;
    }
    this.scene.add(dirLight);

    // Secondary fill light from the front
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-3, 8, 10);
    this.scene.add(fillLight);

    // Warm spot light on the playing area (skip on mobile — use cheaper directional)
    const useSpot = this.quality ? this.quality.get('useSpotLight') : true;
    if (useSpot) {
      const spot = new THREE.SpotLight(0xffd700, 1.0, 25, Math.PI / 5);
      spot.position.set(0, 12, -2);
      spot.target.position.set(0, 0, 1);
      this.scene.add(spot);
      this.scene.add(spot.target);
    } else {
      const warmFill = new THREE.DirectionalLight(0xffd700, 0.5);
      warmFill.position.set(0, 10, -2);
      this.scene.add(warmFill);
    }
  }

  createTable() {
    // Group for table + edge — tilted together
    this.tableGroup = new THREE.Group();

    const geo = new THREE.BoxGeometry(C.TABLE_WIDTH, C.TABLE_THICKNESS, C.TABLE_DEPTH);
    const mat = new THREE.MeshStandardMaterial(C.MATERIAL_CONFIG.table);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, -C.TABLE_THICKNESS / 2, 0);
    mesh.receiveShadow = true;
    this.tableGroup.add(mesh);

    // Table edge trim (front edge indicator)
    const edgeGeo = new THREE.BoxGeometry(C.TABLE_WIDTH, 0.05, 0.05);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 0.3 });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(0, 0.025, C.TABLE_DEPTH / 2);
    this.tableGroup.add(edge);

    // Apply tilt to the whole group
    this.tableGroup.rotation.x = -C.TABLE_TILT_RAD;
    this.scene.add(this.tableGroup);

    return mesh;
  }

  createWalls() {
    this.wallGroup = new THREE.Group();
    const wallMeshes = [];

    // ── Brick parameters ──
    const brickW = 0.5, brickH = 0.25, brickD = C.WALL_THICKNESS;
    const mortarGap = 0.03;
    const brickGeo = new THREE.BoxGeometry(brickW - mortarGap, brickH - mortarGap, brickD - mortarGap);
    const brickColors = [0xc4713b, 0xb5623a, 0xd47a3f, 0xba6838];

    // ── Helper: build a brick wall face ──
    const buildBrickWall = (wallWidth, wallHeight, wallDepth, position, rotationY) => {
      const cols = Math.ceil(wallWidth / brickW);
      const rows = Math.ceil(wallHeight / brickH);
      const count = cols * rows;

      const brickMat = new THREE.MeshStandardMaterial({
        color: 0xc4713b, metalness: 0.1, roughness: 0.85,
      });
      const instMesh = new THREE.InstancedMesh(brickGeo, brickMat, count);
      instMesh.castShadow = true;
      instMesh.receiveShadow = true;

      const dummy = new THREE.Object3D();
      const color = new THREE.Color();
      let idx = 0;

      for (let row = 0; row < rows; row++) {
        const offset = (row % 2 === 0) ? 0 : brickW / 2; // stagger
        for (let col = 0; col < cols; col++) {
          const x = -wallWidth / 2 + col * brickW + offset + brickW / 2;
          const y = row * brickH + brickH / 2;
          if (x > wallWidth / 2 + brickW / 2) continue;
          dummy.position.set(x, y, 0);
          dummy.updateMatrix();
          instMesh.setMatrixAt(idx, dummy.matrix);
          color.set(brickColors[(row * 7 + col * 3) % brickColors.length]);
          instMesh.setColorAt(idx, color);
          idx++;
        }
      }
      instMesh.count = idx;
      instMesh.instanceMatrix.needsUpdate = true;
      if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = true;

      const wallObj = new THREE.Group();
      wallObj.add(instMesh);

      // Gold trim on top
      const trimGeo = new THREE.BoxGeometry(wallWidth + 0.1, 0.1, wallDepth + 0.06);
      const trimMat = new THREE.MeshStandardMaterial({
        color: 0xd4a44a, metalness: 0.6, roughness: 0.3,
      });
      const trim = new THREE.Mesh(trimGeo, trimMat);
      trim.position.y = wallHeight + 0.05;
      trim.castShadow = true;
      wallObj.add(trim);

      wallObj.position.copy(position);
      if (rotationY) wallObj.rotation.y = rotationY;
      return wallObj;
    };

    // ── Back wall ──
    const backWidth = C.TABLE_WIDTH + C.WALL_THICKNESS * 2;
    const backWall = buildBrickWall(
      backWidth, C.WALL_HEIGHT, C.WALL_THICKNESS,
      new THREE.Vector3(0, 0, -C.TABLE_DEPTH / 2 - C.WALL_THICKNESS / 2),
      0
    );
    this.wallGroup.add(backWall);
    wallMeshes.push(backWall);

    // ── Left wall ──
    const leftWall = buildBrickWall(
      C.TABLE_DEPTH, C.WALL_HEIGHT, C.WALL_THICKNESS,
      new THREE.Vector3(-C.TABLE_WIDTH / 2 - C.WALL_THICKNESS / 2, 0, 0),
      Math.PI / 2
    );
    this.wallGroup.add(leftWall);
    wallMeshes.push(leftWall);

    // ── Right wall ──
    const rightWall = buildBrickWall(
      C.TABLE_DEPTH, C.WALL_HEIGHT, C.WALL_THICKNESS,
      new THREE.Vector3(C.TABLE_WIDTH / 2 + C.WALL_THICKNESS / 2, 0, 0),
      -Math.PI / 2
    );
    this.wallGroup.add(rightWall);
    wallMeshes.push(rightWall);

    // ── Question block decorations on left/right walls ──
    const qBlockGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const qBlockMat = new THREE.MeshStandardMaterial({
      color: 0xfbd000, metalness: 0.2, roughness: 0.7,
      emissive: 0xfbd000, emissiveIntensity: 0.1,
    });
    const qBlockPositions = [
      { x: -C.TABLE_WIDTH / 2 - 0.15, y: C.WALL_HEIGHT + 0.35, z: -2 },
      { x: -C.TABLE_WIDTH / 2 - 0.15, y: C.WALL_HEIGHT + 0.35, z: 3 },
      { x: C.TABLE_WIDTH / 2 + 0.15, y: C.WALL_HEIGHT + 0.35, z: -2 },
      { x: C.TABLE_WIDTH / 2 + 0.15, y: C.WALL_HEIGHT + 0.35, z: 3 },
    ];
    for (const pos of qBlockPositions) {
      const qBlock = new THREE.Mesh(qBlockGeo, qBlockMat);
      qBlock.position.set(pos.x, pos.y, pos.z);
      qBlock.castShadow = true;
      this.wallGroup.add(qBlock);
    }

    // ── Small pipe decorations at front corners ──
    const createMiniPipe = (x, z) => {
      const pipeGroup = new THREE.Group();
      const bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 10);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x43b047, metalness: 0.2, roughness: 0.7 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.4;
      pipeGroup.add(body);
      const lipGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.15, 10);
      const lipMat = new THREE.MeshStandardMaterial({ color: 0x2d8a2d, metalness: 0.2, roughness: 0.6 });
      const lip = new THREE.Mesh(lipGeo, lipMat);
      lip.position.y = 0.85;
      pipeGroup.add(lip);
      pipeGroup.position.set(x, 0, z);
      return pipeGroup;
    };
    this.wallGroup.add(createMiniPipe(-C.TABLE_WIDTH / 2 + 0.3, C.TABLE_DEPTH / 2 - 0.3));
    this.wallGroup.add(createMiniPipe(C.TABLE_WIDTH / 2 - 0.3, C.TABLE_DEPTH / 2 - 0.3));

    // Apply table tilt
    this.wallGroup.rotation.x = -C.TABLE_TILT_RAD;
    this.scene.add(this.wallGroup);

    return wallMeshes;
  }

  createPusherMesh(width, height, depth) {
    const group = new THREE.Group();

    // ── Mario-themed textures ──
    const topTex = this._createBrickTileTexture();
    topTex.wrapS = THREE.RepeatWrapping;
    topTex.wrapT = THREE.RepeatWrapping;
    topTex.repeat.set(width / 2, depth / 2);

    const frontTex = this._createPusherFrontTexture();

    // ── Main platform body (multi-material for themed faces) ──
    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    const sideMat = new THREE.MeshStandardMaterial({
      color: 0xb81e1e, metalness: 0.1, roughness: 0.75,
    });
    const topMat = new THREE.MeshStandardMaterial({
      map: topTex, metalness: 0.15, roughness: 0.65,
    });
    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTex, metalness: 0.25, roughness: 0.5,
    });
    const bottomMat = new THREE.MeshStandardMaterial({
      color: 0x6b1010, metalness: 0.05, roughness: 0.9,
    });

    // BoxGeometry faces: +x, -x, +y, -y, +z, -z
    const bodyMesh = new THREE.Mesh(bodyGeo, [
      sideMat, sideMat, topMat, bottomMat, frontMat, sideMat,
    ]);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // ── Gold front edge lip ──
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xfbd000, metalness: 0.35, roughness: 0.35,
    });
    const lipGeo = new THREE.BoxGeometry(width + 0.1, 0.12, 0.15);
    const frontLip = new THREE.Mesh(lipGeo, yellowMat);
    frontLip.position.set(0, height / 2 + 0.04, depth / 2 + 0.05);
    group.add(frontLip);

    // ── Gold side edge strips ──
    const sideStripGeo = new THREE.BoxGeometry(0.1, height + 0.04, depth);
    const leftStrip = new THREE.Mesh(sideStripGeo, yellowMat);
    leftStrip.position.set(-width / 2 - 0.03, 0, 0);
    group.add(leftStrip);
    const rightStrip = new THREE.Mesh(sideStripGeo, yellowMat);
    rightStrip.position.set(width / 2 + 0.03, 0, 0);
    group.add(rightStrip);

    // ── Back edge trim ──
    const backLipGeo = new THREE.BoxGeometry(width + 0.1, 0.1, 0.1);
    const backLipMat = new THREE.MeshStandardMaterial({
      color: 0x8b1515, metalness: 0.15, roughness: 0.7,
    });
    const backLip = new THREE.Mesh(backLipGeo, backLipMat);
    backLip.position.set(0, height / 2 + 0.03, -depth / 2 - 0.03);
    group.add(backLip);

    // Store original width for scaling reference
    group.userData.baseWidth = width;

    this.scene.add(group);
    return group;
  }

  createCollectionTray() {
    const frontDrop = (C.TABLE_DEPTH / 2) * Math.sin(C.TABLE_TILT_RAD);
    this.trayGroup = new THREE.Group();

    // Main tray surface (bright green)
    const geo = new THREE.BoxGeometry(C.TABLE_WIDTH + 1, 0.2, 2.5);
    const mat = new THREE.MeshStandardMaterial({
      ...C.MATERIAL_CONFIG.tray,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.trayGroup.add(mesh);

    // Glowing golden edge strip at the front of the table (drop line)
    const edgeGlowGeo = new THREE.BoxGeometry(C.TABLE_WIDTH + 0.5, 0.15, 0.2);
    const edgeGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfbd000,
      transparent: true,
      opacity: 0.8,
    });
    this.trayEdgeGlow = new THREE.Mesh(edgeGlowGeo, edgeGlowMat);
    this.trayEdgeGlow.position.set(0, 0.2, -1.1);
    this.trayGroup.add(this.trayEdgeGlow);

    // Arrow indicators (pointing down into tray)
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0xfbd000, transparent: true, opacity: 0.6,
    });
    for (let i = -2; i <= 2; i++) {
      const arrowGeo = new THREE.ConeGeometry(0.2, 0.4, 4);
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.rotation.x = Math.PI; // point down
      arrow.position.set(i * 1.8, 0.4, -0.5);
      this.trayGroup.add(arrow);
    }

    this.trayGroup.position.set(0, -2 - frontDrop, C.TABLE_DEPTH / 2 + 1.5);
    this.scene.add(this.trayGroup);
  }

  createBarrier() {
    // Fixed overhead barrier — Mario-styled row of ? blocks and bricks
    const barrierY = C.PUSHER_HEIGHT + C.BARRIER_HEIGHT / 2 + 0.05;
    const group = new THREE.Group();

    // ── Individual blocks (alternating ? blocks and bricks) ──
    const blockW = 1.0;
    const numBlocks = Math.floor(C.TABLE_WIDTH / blockW);
    const totalW = numBlocks * blockW;
    const startX = -totalW / 2 + blockW / 2;
    const gap = 0.03;

    const qTex = this._createSingleBlockTexture(true);
    const brickTex = this._createSingleBlockTexture(false);

    const qMat = new THREE.MeshStandardMaterial({
      map: qTex, metalness: 0.25, roughness: 0.45,
      emissive: 0xfbd000, emissiveIntensity: 0.06,
    });
    const brickMat = new THREE.MeshStandardMaterial({
      map: brickTex, metalness: 0.1, roughness: 0.8,
    });

    const blockGeo = new THREE.BoxGeometry(
      blockW - gap * 2, C.BARRIER_HEIGHT, C.BARRIER_THICKNESS + 0.08
    );

    for (let i = 0; i < numBlocks; i++) {
      const isQuestion = i % 2 === 0;
      const block = new THREE.Mesh(blockGeo, isQuestion ? qMat : brickMat);
      block.position.x = startX + i * blockW;
      block.castShadow = true;
      block.receiveShadow = true;
      group.add(block);
    }

    // ── Gold trim on top ──
    const trimGeo = new THREE.BoxGeometry(
      C.TABLE_WIDTH + 0.1, 0.08, C.BARRIER_THICKNESS + 0.12
    );
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd4a44a, metalness: 0.5, roughness: 0.3,
    });
    const topTrim = new THREE.Mesh(trimGeo, trimMat);
    topTrim.position.y = C.BARRIER_HEIGHT / 2 + 0.04;
    group.add(topTrim);

    // ── Gold trim on bottom ──
    const btmTrim = new THREE.Mesh(trimGeo, trimMat);
    btmTrim.position.y = -C.BARRIER_HEIGHT / 2 - 0.04;
    group.add(btmTrim);

    group.position.set(0, barrierY, C.BARRIER_Z);
    this.scene.add(group);
  }

  // ── Mario-themed texture helpers ──

  _createBrickTileTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Mortar background
    ctx.fillStyle = '#882020';
    ctx.fillRect(0, 0, size, size);

    const brickH = size / 4;
    const brickW = size / 2;
    const gap = 2;
    const colors = ['#c43b3b', '#b53535', '#d44040', '#ba3838'];

    for (let row = 0; row < 4; row++) {
      const offset = row % 2 === 0 ? 0 : brickW / 2;
      for (let col = -1; col < 3; col++) {
        const bx = offset + col * brickW;
        const by = row * brickH;
        const bx1 = Math.max(0, bx + gap);
        const bx2 = Math.min(size, bx + brickW - gap);
        if (bx2 <= bx1) continue;

        const ci = ((row * 7 + col * 3) % colors.length + colors.length) % colors.length;
        ctx.fillStyle = colors[ci];
        ctx.fillRect(bx1, by + gap, bx2 - bx1, brickH - gap * 2);

        // 3D highlight (top-left)
        ctx.fillStyle = 'rgba(255,200,200,0.25)';
        ctx.fillRect(bx1, by + gap, bx2 - bx1, 2);
        ctx.fillRect(bx1, by + gap, 2, brickH - gap * 2);
        // 3D shadow (bottom-right)
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(bx1, by + brickH - gap - 2, bx2 - bx1, 2);
        ctx.fillRect(bx2 - 2, by + gap, 2, brickH - gap * 2);
      }
    }
    return new THREE.CanvasTexture(canvas);
  }

  _createPusherFrontTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Base dark red
    ctx.fillStyle = '#a01818';
    ctx.fillRect(0, 0, 512, 64);

    // Gold band across the middle
    const grad = ctx.createLinearGradient(0, 12, 0, 52);
    grad.addColorStop(0, '#fbd000');
    grad.addColorStop(0.3, '#ffe066');
    grad.addColorStop(0.7, '#fbd000');
    grad.addColorStop(1, '#c49000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 12, 512, 40);

    // Border lines
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(0, 12, 512, 3);
    ctx.fillRect(0, 49, 512, 3);

    // Star motifs along the gold band
    ctx.fillStyle = '#8b6914';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 8; i++) {
      ctx.fillText('\u2605', 32 + i * 64, 32);
    }

    // Rivet dots along top and bottom edges
    ctx.fillStyle = '#fbd000';
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.arc(16 + i * 32, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(16 + i * 32, 58, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }

  _createSingleBlockTexture(isQuestion) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (isQuestion) {
      // Yellow "?" block
      ctx.fillStyle = '#fbd000';
      ctx.fillRect(0, 0, size, size);

      // Darker border
      ctx.strokeStyle = '#c49000';
      ctx.lineWidth = 4;
      ctx.strokeRect(3, 3, size - 6, size - 6);

      // 3D highlight (top-left)
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(3, 3, size - 6, 5);
      ctx.fillRect(3, 3, 5, size - 6);
      // 3D shadow (bottom-right)
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(3, size - 8, size - 6, 5);
      ctx.fillRect(size - 8, 3, 5, size - 6);

      // "?" symbol
      ctx.font = `bold ${size * 0.55}px "Georgia", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Shadow
      ctx.fillStyle = '#8b6914';
      ctx.fillText('?', size / 2 + 2, size / 2 + 2);
      // Main
      ctx.fillStyle = '#5c4a00';
      ctx.fillText('?', size / 2, size / 2);

      // Corner rivets
      ctx.fillStyle = '#8b6914';
      const inset = size * 0.14;
      const r = size * 0.04;
      for (const [rx, ry] of [
        [inset, inset], [size - inset, inset],
        [inset, size - inset], [size - inset, size - inset],
      ]) {
        ctx.beginPath();
        ctx.arc(rx, ry, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Brown brick block
      ctx.fillStyle = '#5c3317';
      ctx.fillRect(0, 0, size, size);

      const brickH = size / 4;
      const brickW = size / 2;
      const gap = 2;
      const colors = ['#c4713b', '#b5623a', '#d47a3f', '#ba6838'];

      for (let row = 0; row < 4; row++) {
        const offset = row % 2 === 0 ? 0 : brickW / 2;
        for (let col = -1; col < 3; col++) {
          const bx = offset + col * brickW;
          const by = row * brickH;
          const bx1 = Math.max(0, bx + gap);
          const bx2 = Math.min(size, bx + brickW - gap);
          if (bx2 <= bx1) continue;

          const ci = ((row * 3 + col) % colors.length + colors.length) % colors.length;
          ctx.fillStyle = colors[ci];
          ctx.fillRect(bx1, by + gap, bx2 - bx1, brickH - gap * 2);

          // Highlight
          ctx.fillStyle = 'rgba(255,220,180,0.2)';
          ctx.fillRect(bx1, by + gap, bx2 - bx1, 2);
          ctx.fillRect(bx1, by + gap, 2, brickH - gap * 2);
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(bx1, by + brickH - gap - 2, bx2 - bx1, 2);
          ctx.fillRect(bx2 - 2, by + gap, 2, brickH - gap * 2);
        }
      }
    }

    return new THREE.CanvasTexture(canvas);
  }

  createCoinTextures() {
    const size = 128;

    const cx = size / 2, cy = size / 2;

    // Helper: draw gold coin base with ornate rim
    const drawCoinBase = (ctx) => {
      // Outer gold fill
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
      grad.addColorStop(0, '#fff1a8');
      grad.addColorStop(0.3, '#ffe566');
      grad.addColorStop(0.7, '#ffc107');
      grad.addColorStop(0.9, '#daa520');
      grad.addColorStop(1, '#8b6914');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Outer raised rim
      ctx.strokeStyle = '#8b6914';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2);
      ctx.stroke();

      // Inner decorative ring
      ctx.strokeStyle = '#c49000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.40, 0, Math.PI * 2);
      ctx.stroke();

      // Tiny dot pattern around rim
      ctx.fillStyle = '#c49000';
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const dx = cx + Math.cos(angle) * size * 0.43;
        const dy = cy + Math.sin(angle) * size * 0.43;
        ctx.beginPath();
        ctx.arc(dx, dy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // ── Top face: Super Star with sparkle rays ──
    const topCanvas = document.createElement('canvas');
    topCanvas.width = topCanvas.height = size;
    const topCtx = topCanvas.getContext('2d');
    drawCoinBase(topCtx);

    // Sparkle rays behind star
    topCtx.save();
    topCtx.globalAlpha = 0.15;
    topCtx.strokeStyle = '#fff';
    topCtx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x1 = cx + Math.cos(angle) * size * 0.12;
      const y1 = cy + Math.sin(angle) * size * 0.12;
      const x2 = cx + Math.cos(angle) * size * 0.35;
      const y2 = cy + Math.sin(angle) * size * 0.35;
      topCtx.beginPath();
      topCtx.moveTo(x1, y1);
      topCtx.lineTo(x2, y2);
      topCtx.stroke();
    }
    topCtx.restore();

    // Star with gradient fill
    const starGrad = topCtx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.25);
    starGrad.addColorStop(0, '#fff8dc');
    starGrad.addColorStop(0.5, '#daa520');
    starGrad.addColorStop(1, '#8b6914');
    topCtx.fillStyle = starGrad;
    topCtx.beginPath();
    const outerR = size * 0.27, innerR = size * 0.11;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI / 5) - Math.PI / 2;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      if (i === 0) topCtx.moveTo(px, py);
      else topCtx.lineTo(px, py);
    }
    topCtx.closePath();
    topCtx.fill();
    // Star outline
    topCtx.strokeStyle = '#8b6914';
    topCtx.lineWidth = 1.5;
    topCtx.stroke();
    // Star highlight
    topCtx.fillStyle = 'rgba(255,255,255,0.3)';
    topCtx.beginPath();
    topCtx.arc(cx - size * 0.06, cy - size * 0.06, size * 0.06, 0, Math.PI * 2);
    topCtx.fill();

    // ── Bottom face: ornate M with mushroom accent ──
    const botCanvas = document.createElement('canvas');
    botCanvas.width = botCanvas.height = size;
    const botCtx = botCanvas.getContext('2d');
    drawCoinBase(botCtx);

    // Decorative cross pattern behind M
    botCtx.save();
    botCtx.globalAlpha = 0.12;
    botCtx.strokeStyle = '#daa520';
    botCtx.lineWidth = 8;
    botCtx.beginPath();
    botCtx.moveTo(cx, cy - size * 0.3);
    botCtx.lineTo(cx, cy + size * 0.3);
    botCtx.stroke();
    botCtx.beginPath();
    botCtx.moveTo(cx - size * 0.3, cy);
    botCtx.lineTo(cx + size * 0.3, cy);
    botCtx.stroke();
    botCtx.restore();

    // "M" with shadow and gradient
    botCtx.save();
    // Shadow
    botCtx.fillStyle = '#6b4e00';
    botCtx.font = `bold ${size * 0.48}px "Georgia", serif`;
    botCtx.textAlign = 'center';
    botCtx.textBaseline = 'middle';
    botCtx.fillText('M', cx + 1.5, cy + 3);
    // Main letter with gradient
    const mGrad = botCtx.createLinearGradient(cx, cy - size * 0.2, cx, cy + size * 0.2);
    mGrad.addColorStop(0, '#fff8dc');
    mGrad.addColorStop(0.4, '#daa520');
    mGrad.addColorStop(1, '#8b6914');
    botCtx.fillStyle = mGrad;
    botCtx.fillText('M', cx, cy + 1);
    // Letter outline
    botCtx.strokeStyle = '#6b4e00';
    botCtx.lineWidth = 1;
    botCtx.strokeText('M', cx, cy + 1);
    botCtx.restore();

    // Small mushroom icon below M
    botCtx.fillStyle = '#c41e1e';
    botCtx.beginPath();
    botCtx.arc(cx, cy + size * 0.28, size * 0.06, Math.PI, 0);
    botCtx.fill();
    botCtx.fillStyle = '#fff';
    botCtx.beginPath();
    botCtx.arc(cx, cy + size * 0.27, size * 0.02, 0, Math.PI * 2);
    botCtx.fill();
    // Mushroom stem
    botCtx.fillStyle = '#f5e6c8';
    botCtx.fillRect(cx - size * 0.025, cy + size * 0.28, size * 0.05, size * 0.04);

    const topTex = new THREE.CanvasTexture(topCanvas);
    const botTex = new THREE.CanvasTexture(botCanvas);

    return { top: topTex, bottom: botTex };
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
    const refs = { sky: null, hills: [], clouds: [], scrollables: [], floaters: [] };
    const decoScale = this.quality ? this.quality.get('bgDecorationScale') : 1.0;
    const useSparkle = this.quality ? this.quality.get('bgShaderSparkle') : true;
    // scrollables: objects that scroll right-to-left
    // floaters: objects that bob/float in place { mesh, baseY, amplitude, frequency, phase, rotSpeed }

    // ── Full-screen gradient background plane ──
    const bgGeo = new THREE.PlaneGeometry(120, 80);
    const fragShader = useSparkle ? `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        uniform float time;
        varying vec2 vUv;
        void main() {
          float t = vUv.y;
          t += sin(vUv.x * 3.0 + time * 0.3) * 0.02;
          vec3 col;
          if (t > 0.5) {
            col = mix(midColor, topColor, (t - 0.5) * 2.0);
          } else {
            col = mix(bottomColor, midColor, t * 2.0);
          }
          float sparkle = sin(vUv.x * 80.0 + time) * sin(vUv.y * 60.0 - time * 0.7);
          sparkle = smoothstep(0.97, 1.0, sparkle) * 0.15;
          col += vec3(sparkle, sparkle * 0.95, sparkle * 0.8);
          gl_FragColor = vec4(col, 1.0);
        }
      ` : `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        varying vec2 vUv;
        void main() {
          float t = vUv.y;
          vec3 col;
          if (t > 0.5) {
            col = mix(midColor, topColor, (t - 0.5) * 2.0);
          } else {
            col = mix(bottomColor, midColor, t * 2.0);
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `;
    const bgMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x4a90d9) },
        midColor: { value: new THREE.Color(0x6db8f0) },
        bottomColor: { value: new THREE.Color(0x3a7abf) },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: fragShader,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const bgPlane = new THREE.Mesh(bgGeo, bgMat);
    bgPlane.position.set(0, 2, -25);
    bgPlane.renderOrder = -2;
    this.scene.add(bgPlane);
    refs.bgPlane = bgPlane;

    // ── Sky gradient (upper area) ──
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
    const hillCount = decoScale >= 1 ? hillConfigs.length : decoScale >= 0.5 ? 3 : 2;
    for (const hc of hillConfigs.slice(0, hillCount)) {
      const geo = new THREE.SphereGeometry(hc.radius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const mesh = new THREE.Mesh(geo, hillMat);
      mesh.position.set(hc.x, hc.y, hc.z);
      mesh.scale.set(hc.sx, hc.sy, 1);
      this.scene.add(mesh);
      refs.hills.push(mesh);
      refs.scrollables.push({ mesh, speed: hc.speed, xMin: -45, xMax: 45, startX: hc.x });
    }

    // ── Clouds ──
    const sphereGeo = new THREE.SphereGeometry(1, 8, 6);
    const cloudShapes = [
      (mat) => { const g = new THREE.Group(); const c1 = new THREE.Mesh(sphereGeo, mat); c1.scale.set(1.8, 0.9, 1); const c2 = new THREE.Mesh(sphereGeo, mat); c2.position.set(1.3, 0.4, 0); c2.scale.set(1.3, 0.8, 0.9); const c3 = new THREE.Mesh(sphereGeo, mat); c3.position.set(-1.2, 0.3, 0); c3.scale.set(1.1, 0.7, 0.9); const c4 = new THREE.Mesh(sphereGeo, mat); c4.position.set(0, 0.5, 0); c4.scale.set(1.0, 0.7, 0.8); g.add(c1, c2, c3, c4); return g; },
      (mat) => { const g = new THREE.Group(); const c1 = new THREE.Mesh(sphereGeo, mat); c1.scale.set(1.0, 1.2, 0.9); const c2 = new THREE.Mesh(sphereGeo, mat); c2.position.set(0.5, 0.7, 0); c2.scale.set(0.9, 1.0, 0.8); const c3 = new THREE.Mesh(sphereGeo, mat); c3.position.set(-0.4, 0.5, 0.2); c3.scale.set(0.8, 0.8, 0.7); g.add(c1, c2, c3); return g; },
      (mat) => { const g = new THREE.Group(); const c1 = new THREE.Mesh(sphereGeo, mat); c1.scale.set(2.2, 0.4, 0.8); const c2 = new THREE.Mesh(sphereGeo, mat); c2.position.set(1.6, 0.1, 0); c2.scale.set(1.4, 0.35, 0.7); const c3 = new THREE.Mesh(sphereGeo, mat); c3.position.set(-1.5, 0.08, 0); c3.scale.set(1.2, 0.3, 0.6); g.add(c1, c2, c3); return g; },
      (mat) => { const g = new THREE.Group(); const c1 = new THREE.Mesh(sphereGeo, mat); c1.scale.set(1.1, 0.9, 1.0); const c2 = new THREE.Mesh(sphereGeo, mat); c2.position.set(0.6, 0.25, 0); c2.scale.set(0.7, 0.6, 0.7); g.add(c1, c2); return g; },
    ];
    const cloudTints = [
      { color: 0xffffff, opacity: 0.9 }, { color: 0xe8f0ff, opacity: 0.85 },
      { color: 0xfff0e0, opacity: 0.8 }, { color: 0xffd6e8, opacity: 0.75 },
      { color: 0xd4f0ff, opacity: 0.85 }, { color: 0xfff8cc, opacity: 0.8 },
    ];
    const cloudConfigs = [
      { x: -12, y: 10, z: -15, scale: 1.2, speed: 0.4, shape: 0, tint: 0 },
      { x: 3, y: 11, z: -17, scale: 0.9, speed: 0.35, shape: 2, tint: 1 },
      { x: 18, y: 9, z: -14, scale: 0.7, speed: 0.45, shape: 3, tint: 3 },
      { x: -25, y: 10.5, z: -16, scale: 1.0, speed: 0.38, shape: 1, tint: 2 },
      { x: 30, y: 11.5, z: -18, scale: 0.8, speed: 0.42, shape: 0, tint: 0 },
      { x: -35, y: 9.5, z: -15, scale: 0.6, speed: 0.32, shape: 2, tint: 4 },
      { x: 40, y: 10, z: -16, scale: 1.1, speed: 0.36, shape: 0, tint: 5 },
      { x: -5, y: 12, z: -19, scale: 0.5, speed: 0.28, shape: 3, tint: 3 },
    ];
    const cloudCount = decoScale >= 1 ? cloudConfigs.length : decoScale >= 0.5 ? 4 : 2;
    for (const cc of cloudConfigs.slice(0, cloudCount)) {
      const tint = cloudTints[cc.tint % cloudTints.length];
      const mat = new THREE.MeshBasicMaterial({ color: tint.color, transparent: true, opacity: tint.opacity });
      const group = cloudShapes[cc.shape % cloudShapes.length](mat);
      group.position.set(cc.x, cc.y, cc.z);
      group.scale.setScalar(cc.scale);
      this.scene.add(group);
      refs.clouds.push(group);
      refs.scrollables.push({ mesh: group, speed: cc.speed, xMin: -50, xMax: 50, startX: cc.x });
    }

    // ── Mario-style foreground decorations ──
    const createPipeDeco = (x, z, height, speed) => {
      const group = new THREE.Group();
      const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, height, 12);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x43b047, metalness: 0.2, roughness: 0.7 });
      const body = new THREE.Mesh(bodyGeo, bodyMat); body.position.y = height / 2; group.add(body);
      const lipGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.2, 12);
      const lipMat = new THREE.MeshStandardMaterial({ color: 0x2d8a2d, metalness: 0.2, roughness: 0.6 });
      const lip = new THREE.Mesh(lipGeo, lipMat); lip.position.y = height + 0.1; group.add(lip);
      const insideGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 12);
      const insideMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const inside = new THREE.Mesh(insideGeo, insideMat); inside.position.y = height + 0.18; group.add(inside);
      group.position.set(x, -2, z);
      this.scene.add(group);
      refs.scrollables.push({ mesh: group, speed, xMin: -40, xMax: 40, startX: x });
    };
    if (decoScale >= 0.5) {
      createPipeDeco(-15, -12, 2.5, 0.6);
      createPipeDeco(12, -13, 1.8, 0.6);
      if (decoScale >= 1) createPipeDeco(30, -11, 3.0, 0.6);
    }

    // Block decorations
    const createBlockDeco = (x, y, z, isQuestion, speed) => {
      const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const mat = new THREE.MeshStandardMaterial({
        color: isQuestion ? 0xfbd000 : 0xc4713b, metalness: 0.15, roughness: 0.75,
        emissive: isQuestion ? 0xfbd000 : 0x000000, emissiveIntensity: isQuestion ? 0.08 : 0,
      });
      const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); mesh.castShadow = true;
      this.scene.add(mesh);
      refs.scrollables.push({ mesh, speed, xMin: -40, xMax: 40, startX: x });
      if (isQuestion) {
        refs.floaters.push({ mesh, baseY: y, amplitude: 0.15, frequency: 2.0, phase: Math.random() * 6.28, rotSpeed: 0 });
      }
    };
    if (decoScale >= 0.5) {
      createBlockDeco(-18, 6, -12, true, 0.5);
      createBlockDeco(-16.4, 6, -12, false, 0.5);
      if (decoScale >= 1) {
        createBlockDeco(-14.8, 6, -12, false, 0.5);
        createBlockDeco(-13.2, 6, -12, true, 0.5);
        createBlockDeco(20, 4, -11, false, 0.55);
      }
      createBlockDeco(21.6, 4, -11, true, 0.55);
      if (decoScale >= 1) createBlockDeco(23.2, 4, -11, false, 0.55);
    }

    // Bushes
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x2d8a2d, roughness: 0.9, metalness: 0 });
    const createBush = (x, z, scale, speed) => {
      const group = new THREE.Group();
      const sg = new THREE.SphereGeometry(0.8, 10, 8);
      const b1 = new THREE.Mesh(sg, bushMat); b1.scale.set(1.3, 0.7, 1);
      const b2 = new THREE.Mesh(sg, bushMat); b2.position.set(0.8, -0.1, 0); b2.scale.set(0.9, 0.55, 0.8);
      const b3 = new THREE.Mesh(sg, bushMat); b3.position.set(-0.7, -0.1, 0); b3.scale.set(0.8, 0.5, 0.8);
      group.add(b1, b2, b3);
      group.position.set(x, -1.5, z); group.scale.setScalar(scale);
      this.scene.add(group);
      refs.scrollables.push({ mesh: group, speed, xMin: -40, xMax: 40, startX: x });
    };
    if (decoScale >= 0.5) {
      createBush(-8, -11, 1.0, 0.55);
      createBush(5, -12, 0.8, 0.55);
      if (decoScale >= 1) {
        createBush(22, -10, 1.2, 0.55);
        createBush(-22, -12, 0.9, 0.55);
      }
    }

    // ── Floating stars (twinkle & spin) ──
    const starGeo = new THREE.OctahedronGeometry(0.3, 0);
    const starConfigs = [
      { x: -30, y: 8, z: -13, color: 0xfbd000, scale: 0.8, speed: 0.3 },
      { x: 15, y: 13, z: -19, color: 0xffffff, scale: 0.5, speed: 0.2 },
      { x: -8, y: 14, z: -20, color: 0xffd6e8, scale: 0.6, speed: 0.22 },
      { x: 35, y: 7, z: -12, color: 0xfbd000, scale: 0.7, speed: 0.33 },
      { x: -18, y: 12, z: -18, color: 0xd4f0ff, scale: 0.4, speed: 0.18 },
      { x: 42, y: 11, z: -17, color: 0xfff8cc, scale: 0.55, speed: 0.26 },
    ];
    const starCount = decoScale >= 1 ? starConfigs.length : decoScale >= 0.5 ? 3 : 0;
    for (const sc of starConfigs.slice(0, starCount)) {
      const mat = new THREE.MeshBasicMaterial({ color: sc.color, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(starGeo, mat);
      mesh.position.set(sc.x, sc.y, sc.z); mesh.scale.setScalar(sc.scale);
      this.scene.add(mesh);
      refs.scrollables.push({ mesh, speed: sc.speed, xMin: -50, xMax: 50, startX: sc.x });
      refs.floaters.push({ mesh, baseY: sc.y, amplitude: 0.3, frequency: 1.5, phase: Math.random() * 6.28, rotSpeed: 1.5 });
    }

    // ── Rainbow arc (skip on low) ──
    if (decoScale >= 0.5) {
      const rainbowColors = [0xe52521, 0xff8c00, 0xfbd000, 0x43b047, 0x049cd8, 0x6b3fa0];
      const rainbowGroup = new THREE.Group();
      for (let i = 0; i < rainbowColors.length; i++) {
        const arcGeo = new THREE.TorusGeometry(8 - i * 0.5, 0.2, 8, 32, Math.PI);
        const arcMat = new THREE.MeshBasicMaterial({ color: rainbowColors[i], transparent: true, opacity: 0.35 });
        rainbowGroup.add(new THREE.Mesh(arcGeo, arcMat));
      }
      rainbowGroup.position.set(28, 2, -21); rainbowGroup.scale.set(1.0, 0.7, 1);
      this.scene.add(rainbowGroup);
      refs.scrollables.push({ mesh: rainbowGroup, speed: 0.12, xMin: -50, xMax: 55, startX: 28 });
    }

    // ══════════════════════════════════════════════════════════════
    // ── NEW: Floating Mario elements in the foreground/side areas ──
    // ══════════════════════════════════════════════════════════════

    // --- Floating gold coins (decorative, in background) ---
    const bgCoinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 12);
    const bgCoinMat = new THREE.MeshStandardMaterial({
      color: 0xffc107, metalness: 0.8, roughness: 0.2,
      emissive: 0xffc107, emissiveIntensity: 0.15,
    });
    const bgCoinConfigs = [
      { x: -7, y: -4, z: -5, scale: 1.0 },
      { x: 7, y: -3.5, z: -6, scale: 0.8 },
      { x: -9, y: -5, z: -4, scale: 0.7 },
      { x: 9, y: -4.5, z: -5, scale: 0.9 },
      { x: -6, y: -6, z: -3, scale: 0.6 },
      { x: 6, y: -5.5, z: -4, scale: 0.75 },
      { x: 0, y: -7, z: -3, scale: 0.85 },
      { x: -3, y: -8, z: -2, scale: 0.65 },
      { x: 4, y: -7.5, z: -3, scale: 0.7 },
    ];
    const bgCoinCount = decoScale >= 1 ? bgCoinConfigs.length : decoScale >= 0.5 ? 4 : 0;
    for (const bc of bgCoinConfigs.slice(0, bgCoinCount)) {
      const mesh = new THREE.Mesh(bgCoinGeo, bgCoinMat);
      mesh.position.set(bc.x, bc.y, bc.z);
      mesh.scale.setScalar(bc.scale);
      this.scene.add(mesh);
      refs.floaters.push({
        mesh, baseY: bc.y,
        amplitude: 0.2 + Math.random() * 0.15,
        frequency: 1.0 + Math.random() * 0.5,
        phase: Math.random() * 6.28,
        rotSpeed: 2.0 + Math.random(),
      });
    }

    // --- Floating Super Stars (sparkly, gentle bob) ---
    const fStarGeo = new THREE.OctahedronGeometry(0.4, 0);
    const fStarConfigs = [
      { x: -8.5, y: -3, z: -6, color: 0xfbd000, scale: 0.7 },
      { x: 8.5, y: -6, z: -4, color: 0xfbd000, scale: 0.6 },
      { x: -5, y: -7.5, z: -3, color: 0xfff8cc, scale: 0.5 },
      { x: 3, y: -9, z: -2, color: 0xfbd000, scale: 0.55 },
    ];
    const fStarCount = decoScale >= 1 ? fStarConfigs.length : decoScale >= 0.5 ? 2 : 0;
    for (const fs of fStarConfigs.slice(0, fStarCount)) {
      const mat = new THREE.MeshBasicMaterial({
        color: fs.color, transparent: true, opacity: 0.85,
      });
      const mesh = new THREE.Mesh(fStarGeo, mat);
      mesh.position.set(fs.x, fs.y, fs.z); mesh.scale.setScalar(fs.scale);
      this.scene.add(mesh);
      refs.floaters.push({
        mesh, baseY: fs.y,
        amplitude: 0.35, frequency: 0.8, phase: Math.random() * 6.28,
        rotSpeed: 2.5,
      });
    }

    // --- Floating Mushrooms (red cap + white dots, gentle bob) ---
    const createFloatingMushroom = (x, y, z, scale) => {
      const group = new THREE.Group();
      // Cap
      const capGeo = new THREE.SphereGeometry(0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xe52521, metalness: 0.1, roughness: 0.7 });
      const cap = new THREE.Mesh(capGeo, capMat); cap.position.y = 0.15; group.add(cap);
      // White dots on cap
      const dotGeo = new THREE.SphereGeometry(0.08, 6, 4);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      [[-0.15, 0.3, 0.2], [0.2, 0.35, -0.1], [-0.05, 0.4, -0.15]].forEach(([dx, dy, dz]) => {
        const dot = new THREE.Mesh(dotGeo, dotMat); dot.position.set(dx, dy, dz); group.add(dot);
      });
      // Stem
      const stemGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.2, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0xf5e6c8 });
      const stem = new THREE.Mesh(stemGeo, stemMat); stem.position.y = 0.02; group.add(stem);
      // Eyes
      const eyeGeo = new THREE.SphereGeometry(0.04, 6, 4);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const le = new THREE.Mesh(eyeGeo, eyeMat); le.position.set(-0.08, 0.12, 0.15); group.add(le);
      const re = new THREE.Mesh(eyeGeo, eyeMat); re.position.set(0.08, 0.12, 0.15); group.add(re);

      group.position.set(x, y, z); group.scale.setScalar(scale);
      this.scene.add(group);
      refs.floaters.push({
        mesh: group, baseY: y,
        amplitude: 0.25, frequency: 0.9, phase: Math.random() * 6.28,
        rotSpeed: 0.4,
      });
    };
    if (decoScale >= 0.5) {
      createFloatingMushroom(-8, -5.5, -4, 1.2);
      createFloatingMushroom(7.5, -7, -3, 1.0);
      if (decoScale >= 1) createFloatingMushroom(-2, -8.5, -2, 0.9);
    }

    // --- Floating 1-UP green mushroom ---
    const create1UPMushroom = (x, y, z, scale) => {
      const group = new THREE.Group();
      const capGeo = new THREE.SphereGeometry(0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x43b047, metalness: 0.1, roughness: 0.7 });
      const cap = new THREE.Mesh(capGeo, capMat); cap.position.y = 0.15; group.add(cap);
      const dotGeo = new THREE.SphereGeometry(0.08, 6, 4);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      [[-0.15, 0.3, 0.2], [0.2, 0.35, -0.1]].forEach(([dx, dy, dz]) => {
        const dot = new THREE.Mesh(dotGeo, dotMat); dot.position.set(dx, dy, dz); group.add(dot);
      });
      const stemGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.2, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0xf5e6c8 });
      const stem = new THREE.Mesh(stemGeo, stemMat); stem.position.y = 0.02; group.add(stem);
      group.position.set(x, y, z); group.scale.setScalar(scale);
      this.scene.add(group);
      refs.floaters.push({
        mesh: group, baseY: y,
        amplitude: 0.3, frequency: 0.7, phase: Math.random() * 6.28,
        rotSpeed: 0.5,
      });
    };
    if (decoScale >= 1) create1UPMushroom(9, -4, -5, 1.1);

    // --- Floating Fire Flowers ---
    const createFireFlower = (x, y, z, scale) => {
      const group = new THREE.Group();
      // Petals (orange-red)
      const petalGeo = new THREE.SphereGeometry(0.12, 6, 4);
      const petalMat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 0.2 });
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(angle) * 0.18, 0.35, Math.sin(angle) * 0.18);
        group.add(petal);
      }
      // Center (yellow)
      const centerGeo = new THREE.SphereGeometry(0.1, 8, 6);
      const centerMat = new THREE.MeshBasicMaterial({ color: 0xfbd000 });
      const center = new THREE.Mesh(centerGeo, centerMat); center.position.y = 0.35; group.add(center);
      // Stem
      const stemGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.3, 6);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x43b047 });
      const stem = new THREE.Mesh(stemGeo, stemMat); stem.position.y = 0.15; group.add(stem);

      group.position.set(x, y, z); group.scale.setScalar(scale);
      this.scene.add(group);
      refs.floaters.push({
        mesh: group, baseY: y,
        amplitude: 0.2, frequency: 1.2, phase: Math.random() * 6.28,
        rotSpeed: 1.0,
      });
    };
    if (decoScale >= 0.5) {
      createFireFlower(-6, -6.5, -3, 1.5);
      if (decoScale >= 1) createFireFlower(5, -8, -2, 1.3);
    }

    // --- Twinkling particle stars (very small, scattered) ---
    const tinyStarGeo = new THREE.OctahedronGeometry(0.08, 0);
    const tinyStarColors = [0xffffff, 0xffd700, 0x87ceeb, 0xffd6e8, 0xc8a2ff];
    const tinyStarCount = decoScale >= 1 ? 25 : decoScale >= 0.5 ? 10 : 0;
    for (let i = 0; i < tinyStarCount; i++) {
      const color = tinyStarColors[i % tinyStarColors.length];
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 + Math.random() * 0.3 });
      const mesh = new THREE.Mesh(tinyStarGeo, mat);
      const x = (Math.random() - 0.5) * 24;
      const y = -3 - Math.random() * 9;
      const z = -2 - Math.random() * 8;
      mesh.position.set(x, y, z);
      mesh.scale.setScalar(0.5 + Math.random() * 1.5);
      this.scene.add(mesh);
      refs.floaters.push({
        mesh, baseY: y,
        amplitude: 0.1 + Math.random() * 0.15,
        frequency: 1.5 + Math.random(),
        phase: Math.random() * 6.28,
        rotSpeed: 3 + Math.random() * 2,
        twinkle: true,
      });
    }

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

    // Update wall colors (traverse to find InstancedMesh and other meshes)
    for (const wall of this.wallMeshes) {
      wall.traverse(child => {
        if (child.isInstancedMesh) {
          child.material.color.set(sceneConfig.wallColor);
        }
      });
    }
  }

  // ─── Pusher width for effects ───
  setPusherWidth(newWidth) {
    const baseWidth = this.pusherMesh.userData.baseWidth || C.PUSHER_WIDTH;
    const scale = newWidth / baseWidth;
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

    // Background animation throttling — skip frames on lower quality
    const bgSkip = this.quality ? this.quality.get('bgAnimSkip') : 1;
    this._bgAnimFrame = (this._bgAnimFrame || 0) + 1;
    const doBgAnim = this._bgAnimFrame % bgSkip === 0;

    // Animate scrolling background (right-to-left parallax)
    if (doBgAnim && this.bgRefs?.scrollables) {
      const scaledDt = dt * bgSkip; // compensate for skipped frames
      for (const s of this.bgRefs.scrollables) {
        s.mesh.position.x -= s.speed * scaledDt;
        if (s.mesh.position.x < s.xMin) {
          s.mesh.position.x = s.xMax;
        }
      }
    }

    // Animate floating/bobbing elements
    if (doBgAnim && this.bgRefs?.floaters) {
      const t = this._time;
      for (const f of this.bgRefs.floaters) {
        f.mesh.position.y = f.baseY + Math.sin(t * f.frequency + f.phase) * f.amplitude;
        if (f.rotSpeed) {
          f.mesh.rotation.y += f.rotSpeed * dt * bgSkip;
        }
        if (f.twinkle) {
          const opacity = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * f.frequency * 2 + f.phase));
          f.mesh.material.opacity = opacity;
        }
      }
    }

    // Animate background gradient shader
    if (doBgAnim && this.bgRefs?.bgPlane) {
      this.bgRefs.bgPlane.material.uniforms.time.value = this._time;
    }

    // Animate tray edge glow (pulse)
    if (doBgAnim && this.trayEdgeGlow) {
      this.trayEdgeGlow.material.opacity = 0.5 + 0.3 * Math.sin(this._time * 3);
    }

    // Animate boss
    if (this.bossMesh) {
      this.bossMesh.rotation.y = Math.sin(this._time * 0.5) * 0.1;
      this.bossMesh.position.y = Math.sin(this._time * 0.8) * 0.15;
    }

    // Update drop indicator (only when dropX actually changes)
    if (gameState.dropX !== undefined && gameState.dropX !== this._lastDropX) {
      this._lastDropX = gameState.dropX;
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
    if (!coins) {
      this.smallCoinInstancedMesh.count = 0;
      this.largeCoinInstancedMesh.count = 0;
      return;
    }

    const mat4 = this._coinMatrix;
    const pos = this._coinPos;
    const quat = this._coinQuat;
    const scale = this._coinScale;
    let smallIdx = 0;
    let largeIdx = 0;

    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      const body = coin.body;
      pos.set(body.position.x, body.position.y, body.position.z);
      quat.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
      mat4.compose(pos, quat, scale);
      if (coin.size === 'large') {
        this.largeCoinInstancedMesh.setMatrixAt(largeIdx++, mat4);
      } else {
        this.smallCoinInstancedMesh.setMatrixAt(smallIdx++, mat4);
      }
    }

    this.smallCoinInstancedMesh.count = smallIdx;
    this.smallCoinInstancedMesh.instanceMatrix.needsUpdate = true;
    this.largeCoinInstancedMesh.count = largeIdx;
    this.largeCoinInstancedMesh.instanceMatrix.needsUpdate = true;
  }

  setDropIndicatorSize(size) {
    const radius = C.COIN_SIZES[size]?.radius ?? C.COIN_RADIUS;
    this.dropIndicator.geometry.dispose();
    this.dropIndicator.geometry = new THREE.RingGeometry(radius * 0.8, radius * 1.2, 24);
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

    // Dispose coin InstancedMeshes
    this.scene.remove(this.smallCoinInstancedMesh);
    this.smallCoinInstancedMesh.dispose();
    this.scene.remove(this.largeCoinInstancedMesh);
    this.largeCoinInstancedMesh.dispose();

    // Dispose item meshes
    for (const [, entry] of this.itemMeshes) {
      this.scene.remove(entry.mesh);
    }
    this.itemMeshes.clear();

    // Dispose boss
    this.hideBoss();

    this.smallCoinGeometry.dispose();
    this.largeCoinGeometry.dispose();
    for (const mat of this.coinMaterials) mat.dispose();
    if (this.coinTextures.top) this.coinTextures.top.dispose();
    if (this.coinTextures.bottom) this.coinTextures.bottom.dispose();
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
