import * as CANNON from 'cannon-es';
import * as C from './constants.js';

export class CoinManager3D {
  constructor(physicsWorld, quality) {
    this.physicsWorld = physicsWorld;
    this.coins = [];
    this.nextId = 0;
    this.maxCoins = quality ? quality.get('maxCoins') : C.MAX_COINS;
    this.physicsSegments = quality ? quality.get('coinPhysicsSegments') : 16;
  }

  spawnCoin(x, y, z, size = 'small') {
    if (this.coins.length >= this.maxCoins) return null;

    const sizeConfig = C.COIN_SIZES[size] || C.COIN_SIZES.small;

    const shape = new CANNON.Cylinder(
      sizeConfig.radius,
      sizeConfig.radius,
      sizeConfig.height,
      this.physicsSegments
    );

    const body = new CANNON.Body({
      mass: sizeConfig.mass,
      shape,
      material: this.physicsWorld.coinMaterial,
      position: new CANNON.Vec3(x, y, z),
      linearDamping: 0.15,
      angularDamping: 0.95,
      sleepSpeedLimit: 0.1,
      sleepTimeLimit: 1.0,
    });

    body.quaternion.setFromEuler(
      Math.random() * 0.3,
      Math.random() * Math.PI * 2,
      Math.random() * 0.3
    );

    this.physicsWorld.addBody(body);
    const id = this.nextId++;
    const coin = { body, id, size };
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
