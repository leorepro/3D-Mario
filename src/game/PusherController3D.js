import * as CANNON from 'cannon-es';
import * as C from './constants.js';

export class PusherController3D {
  constructor(physicsWorld) {
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
  }

  update() {
    this.currentZ += C.PUSHER_SPEED * this.direction;

    if (this.currentZ >= this.maxZ) {
      this.currentZ = this.maxZ;
      this.direction = -1;
    } else if (this.currentZ <= this.minZ) {
      this.currentZ = this.minZ;
      this.direction = 1;
    }

    this.body.position.set(0, C.PUSHER_HEIGHT / 2, this.currentZ);
    this.body.velocity.set(0, 0, C.PUSHER_SPEED * this.direction * 60);
  }

  getBody() {
    return this.body;
  }
}
