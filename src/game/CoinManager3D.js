import * as CANNON from 'cannon-es';
import * as C from './constants.js';

export class CoinManager3D {
  constructor(physicsWorld) {
    this.physicsWorld = physicsWorld;
    this.coins = [];
    this.nextId = 0;
  }

  spawnCoin(x, y, z) {
    if (this.coins.length >= C.MAX_COINS) return null;

    const shape = new CANNON.Cylinder(
      C.COIN_RADIUS,
      C.COIN_RADIUS,
      C.COIN_HEIGHT,
      12
    );

    const body = new CANNON.Body({
      mass: C.COIN_MASS,
      shape,
      material: this.physicsWorld.coinMaterial,
      position: new CANNON.Vec3(x, y, z),
      linearDamping: 0.3,
      angularDamping: 0.6,
      sleepSpeedLimit: 0.2,
      sleepTimeLimit: 0.5,
    });

    body.quaternion.setFromEuler(
      Math.random() * 0.3,
      Math.random() * Math.PI * 2,
      Math.random() * 0.3
    );

    this.physicsWorld.addBody(body);
    const id = this.nextId++;
    const coin = { body, id };
    this.coins.push(coin);
    return coin;
  }

  removeCoin(coin) {
    this.physicsWorld.removeBody(coin.body);
    this.coins = this.coins.filter(c => c.id !== coin.id);
  }

  getCoins() {
    return this.coins;
  }

  getCoinCount() {
    return this.coins.length;
  }

  spawnInitialCoins(count, area) {
    const { xMin, xMax, zMin, zMax } = area;
    for (let i = 0; i < count; i++) {
      const x = xMin + Math.random() * (xMax - xMin);
      const z = zMin + Math.random() * (zMax - zMin);
      const y = C.COIN_HEIGHT / 2 + 0.1 + Math.random() * 2;
      this.spawnCoin(x, y, z);
    }
  }
}
