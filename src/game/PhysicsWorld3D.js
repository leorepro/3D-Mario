import * as CANNON from 'cannon-es';
import * as C from './constants.js';

export class PhysicsWorld3D {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(C.GRAVITY.x, C.GRAVITY.y, C.GRAVITY.z),
      allowSleep: true,
    });

    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.solver.iterations = 10;

    // Materials
    this.coinMaterial = new CANNON.Material('coin');
    this.tableMaterial = new CANNON.Material('table');
    this.wallMaterial = new CANNON.Material('wall');
    this.pusherMaterial = new CANNON.Material('pusher');

    this.setupContactMaterials();
    this.createTable();
    this.createWalls();
  }

  setupContactMaterials() {
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.coinMaterial, this.tableMaterial,
      { friction: 0.3, restitution: 0.15 }
    ));
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.coinMaterial, this.coinMaterial,
      { friction: 0.2, restitution: 0.2 }
    ));
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.coinMaterial, this.wallMaterial,
      { friction: 0.3, restitution: 0.1 }
    ));
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.coinMaterial, this.pusherMaterial,
      { friction: 0.5, restitution: 0.05 }
    ));
  }

  createTable() {
    const shape = new CANNON.Box(new CANNON.Vec3(
      C.TABLE_WIDTH / 2,
      C.TABLE_THICKNESS / 2,
      C.TABLE_DEPTH / 2
    ));
    this.tableBody = new CANNON.Body({
      mass: 0,
      shape,
      material: this.tableMaterial,
      position: new CANNON.Vec3(0, -C.TABLE_THICKNESS / 2, 0),
    });
    // Tilt table: rotate around X so back is higher, front is lower
    this.tableBody.quaternion.setFromEuler(-C.TABLE_TILT_RAD, 0, 0);
    this.world.addBody(this.tableBody);
  }

  createWalls() {
    const tiltQ = new CANNON.Quaternion();
    tiltQ.setFromEuler(-C.TABLE_TILT_RAD, 0, 0);

    // Back wall
    const backShape = new CANNON.Box(new CANNON.Vec3(
      C.TABLE_WIDTH / 2 + C.WALL_THICKNESS,
      C.WALL_HEIGHT / 2,
      C.WALL_THICKNESS / 2
    ));
    // Position back wall on the tilted surface (back edge rises)
    const backZ = -C.TABLE_DEPTH / 2 - C.WALL_THICKNESS / 2;
    const backRise = -backZ * Math.sin(C.TABLE_TILT_RAD);
    this.backWall = new CANNON.Body({
      mass: 0,
      shape: backShape,
      material: this.wallMaterial,
      position: new CANNON.Vec3(0, C.WALL_HEIGHT / 2 + backRise, backZ),
    });
    this.backWall.quaternion.copy(tiltQ);
    this.world.addBody(this.backWall);

    // Left wall
    const sideShape = new CANNON.Box(new CANNON.Vec3(
      C.WALL_THICKNESS / 2,
      C.WALL_HEIGHT / 2,
      C.TABLE_DEPTH / 2
    ));
    this.leftWall = new CANNON.Body({
      mass: 0,
      shape: sideShape,
      material: this.wallMaterial,
      position: new CANNON.Vec3(-C.TABLE_WIDTH / 2 - C.WALL_THICKNESS / 2, C.WALL_HEIGHT / 2, 0),
    });
    this.leftWall.quaternion.copy(tiltQ);
    this.world.addBody(this.leftWall);

    // Right wall
    this.rightWall = new CANNON.Body({
      mass: 0,
      shape: sideShape,
      material: this.wallMaterial,
      position: new CANNON.Vec3(C.TABLE_WIDTH / 2 + C.WALL_THICKNESS / 2, C.WALL_HEIGHT / 2, 0),
    });
    this.rightWall.quaternion.copy(tiltQ);
    this.world.addBody(this.rightWall);

    // NO front wall — coins fall off the front edge!

    // ── Fixed barrier (coin scraper — stops coins when platform retracts) ──
    const barrierShape = new CANNON.Box(new CANNON.Vec3(
      C.TABLE_WIDTH / 2,
      C.BARRIER_HEIGHT / 2,
      C.BARRIER_THICKNESS / 2
    ));
    // Position above the platform surface so coins hit it, platform slides under
    const barrierY = C.PUSHER_HEIGHT + C.BARRIER_HEIGHT / 2 + 0.05;
    this.barrier = new CANNON.Body({
      mass: 0,
      shape: barrierShape,
      material: this.wallMaterial,
      position: new CANNON.Vec3(0, barrierY, C.BARRIER_Z),
    });
    this.barrier.quaternion.copy(tiltQ);
    this.world.addBody(this.barrier);
  }

  step(dt) {
    this.world.step(C.PHYSICS_TIMESTEP, dt, C.PHYSICS_MAX_SUBSTEPS);
  }

  addBody(body) {
    this.world.addBody(body);
  }

  removeBody(body) {
    this.world.removeBody(body);
  }

  destroy() {
    while (this.world.bodies.length > 0) {
      this.world.removeBody(this.world.bodies[0]);
    }
  }
}
