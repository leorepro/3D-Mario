import * as CANNON from 'cannon-es';
import * as C from './constants.js';

export class PusherController3D {
  constructor(physicsWorld) {
    this.physicsWorld = physicsWorld;
    this.currentWidth = C.PUSHER_WIDTH;

    const shape = new CANNON.Box(new CANNON.Vec3(
      C.PUSHER_WIDTH / 2,
      C.PUSHER_HEIGHT / 2,
      C.PUSHER_DEPTH / 2
    ));

    this.body = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.KINEMATIC,
      shape,
      material: physicsWorld.pusherMaterial,
      position: new CANNON.Vec3(0, C.PUSHER_HEIGHT / 2, C.PUSHER_Z_MIN),
    });

    physicsWorld.addBody(this.body);

    this.direction = 1;
    this.currentZ = C.PUSHER_Z_MIN;
    this.minZ = C.PUSHER_Z_MIN;
    this.maxZ = C.PUSHER_Z_MAX;
    this.speed = C.PUSHER_SPEED;
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

    // Pusher rides on the tilted table surface
    const yOnSlope = C.PUSHER_HEIGHT / 2 - this.currentZ * Math.sin(C.TABLE_TILT_RAD);
    this.body.position.set(0, yOnSlope, this.currentZ);
    this.body.velocity.set(0, 0, this.speed * this.direction * 60);
  }

  /** Change pusher width (e.g. mushroom effect) */
  setWidth(newWidth) {
    this.currentWidth = newWidth;
    while (this.body.shapes.length > 0) {
      this.body.removeShape(this.body.shapes[0]);
    }
    const shape = new CANNON.Box(new CANNON.Vec3(
      newWidth / 2,
      C.PUSHER_HEIGHT / 2,
      C.PUSHER_DEPTH / 2
    ));
    this.body.addShape(shape);
  }

  /** Change pusher speed (e.g. frenzy mode) */
  setSpeed(speed) {
    this.speed = speed;
  }

  resetWidth() {
    this.setWidth(C.PUSHER_WIDTH);
  }

  resetSpeed() {
    this.speed = C.PUSHER_SPEED;
  }

  getWidth() {
    return this.currentWidth;
  }

  getBody() {
    return this.body;
  }
}
