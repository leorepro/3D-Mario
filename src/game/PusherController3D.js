import * as CANNON from 'cannon-es';
import * as C from './constants.js';

export class PusherController3D {
  constructor(physicsWorld, config = {}) {
    const {
      width = C.PUSHER_WIDTH,
      height = C.PUSHER_HEIGHT,
      depth = C.PUSHER_DEPTH,
      zMin = C.PUSHER_Z_MIN,
      zMax = C.PUSHER_Z_MAX,
      speed = C.PUSHER_SPEED,
      startDirection = 1,
    } = config;

    this.physicsWorld = physicsWorld;
    this.currentWidth = width;
    this.defaultWidth = width;
    this.currentDepth = depth;
    this.defaultDepth = depth;
    this.currentHeight = height;
    this.defaultHeight = height;
    this.defaultSpeed = speed;
    this.heightVal = height;
    this.depthVal = depth;

    const platformShape = new CANNON.Box(new CANNON.Vec3(
      width / 2,
      height / 2,
      depth / 2
    ));

    // Pre-compute tilt quaternion (same as table)
    this.tiltQ = new CANNON.Quaternion();
    this.tiltQ.setFromEuler(-C.TABLE_TILT_RAD, 0, 0);

    const startZ = startDirection === 1 ? zMin : zMax;
    const sinTilt = Math.sin(C.TABLE_TILT_RAD);
    const initY = height / 2 - startZ * sinTilt;

    this.body = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.KINEMATIC,
      material: physicsWorld.pusherMaterial,
      position: new CANNON.Vec3(0, initY, startZ),
    });
    this.body.addShape(platformShape);
    this.body.quaternion.copy(this.tiltQ);

    physicsWorld.addBody(this.body);

    this.direction = startDirection;
    this.currentZ = startZ;
    this.minZ = zMin;
    this.maxZ = zMax;
    this.speed = speed;
  }

  update() {
    this.currentZ += this.speed * this.direction;

    if (this.currentZ >= this.maxZ) {
      this.currentZ = this.maxZ;
      this.direction = -1;
    } else if (this.currentZ <= this.minZ) {
      this.currentZ = this.minZ;
      this.direction = 1;
    }

    const sinTilt = Math.sin(C.TABLE_TILT_RAD);
    const cosTilt = Math.cos(C.TABLE_TILT_RAD);
    const yOnSlope = this.heightVal / 2 - this.currentZ * sinTilt;
    this.body.position.set(0, yOnSlope, this.currentZ);
    this.body.quaternion.copy(this.tiltQ);

    const vAlongSlope = this.speed * this.direction * 60;
    this.body.velocity.set(0, -vAlongSlope * sinTilt, vAlongSlope * cosTilt);
  }

  setWidth(newWidth) {
    this.currentWidth = newWidth;
    this._rebuildShape();
  }

  setDepth(newDepth) {
    this.currentDepth = newDepth;
    this.depthVal = newDepth;
    this._rebuildShape();
  }

  setHeight(newHeight) {
    this.currentHeight = newHeight;
    this.heightVal = newHeight;
    this._rebuildShape();
  }

  _rebuildShape() {
    while (this.body.shapes.length > 0) {
      this.body.removeShape(this.body.shapes[0]);
    }
    const shape = new CANNON.Box(new CANNON.Vec3(
      this.currentWidth / 2,
      this.heightVal / 2,
      this.currentDepth / 2
    ));
    this.body.addShape(shape);
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  resetWidth() {
    this.setWidth(this.defaultWidth);
  }

  resetDepth() {
    this.setDepth(this.defaultDepth);
  }

  resetHeight() {
    this.setHeight(this.defaultHeight);
  }

  resetSpeed() {
    this.speed = this.defaultSpeed;
  }

  getWidth() {
    return this.currentWidth;
  }

  getBody() {
    return this.body;
  }
}
