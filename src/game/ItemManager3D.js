/**
 * ItemManager3D — Manages special item physics bodies on the table.
 * Items share physics with coins but have unique types and effects.
 */
import * as CANNON from 'cannon-es';
import * as C from './constants.js';

const MAX_ITEMS_ON_TABLE = 5;

export class ItemManager3D {
  constructor(physicsWorld) {
    this.physicsWorld = physicsWorld;
    this.items = [];
    this.nextId = 100000; // offset from coin IDs
  }

  /**
   * Try to spawn an item after a player coin drop.
   * @param {string[]} unlockedItemTypes - Item type IDs unlocked at current level
   * @param {number} totalObjectCount - Current coins + items on table
   * @returns {object|null} spawned item or null
   */
  trySpawnItem(unlockedItemTypes, totalObjectCount) {
    if (this.items.length >= MAX_ITEMS_ON_TABLE) return null;
    if (totalObjectCount >= C.MAX_COINS - 5) return null;

    // Roll for each item type (rarest first)
    const types = Object.values(C.ITEM_TYPES)
      .filter(t => unlockedItemTypes.includes(t.id))
      .sort((a, b) => a.spawnRate - b.spawnRate); // rarest first

    for (const itemDef of types) {
      if (Math.random() < itemDef.spawnRate) {
        // Spawn in mid-zone of table
        const x = (Math.random() - 0.5) * (C.TABLE_WIDTH - 1);
        const y = 3 + Math.random() * 2;
        const z = C.PUSHER_Z_MAX + 1 + Math.random() * 2;
        return this.spawnItem(itemDef, x, y, z);
      }
    }
    return null;
  }

  spawnItem(itemDef, x, y, z) {
    let shape;
    switch (itemDef.physics) {
      case 'box': {
        const s = itemDef.size || 0.3;
        shape = new CANNON.Box(new CANNON.Vec3(s, s, s));
        break;
      }
      case 'cylinder': {
        const r = itemDef.physicsRadius || 0.3;
        const h = itemDef.physicsHeight || 0.5;
        shape = new CANNON.Cylinder(r, r, h, 12);
        break;
      }
      case 'sphere':
      default: {
        const r = itemDef.physicsRadius || 0.3;
        shape = new CANNON.Sphere(r);
        break;
      }
    }

    const body = new CANNON.Body({
      mass: itemDef.mass || 0.8,
      shape,
      material: this.physicsWorld.coinMaterial,
      position: new CANNON.Vec3(x, y, z),
      linearDamping: 0.15,
      angularDamping: 0.6,
      sleepSpeedLimit: 0.1,
      sleepTimeLimit: 1,
    });

    body.quaternion.setFromEuler(
      Math.random() * 0.2,
      Math.random() * Math.PI * 2,
      Math.random() * 0.2
    );

    this.physicsWorld.addBody(body);
    const id = this.nextId++;
    const item = { body, id, type: itemDef.id, itemDef };
    this.items.push(item);
    return item;
  }

  removeItem(item) {
    this.physicsWorld.removeBody(item.body);
    this.items = this.items.filter(i => i.id !== item.id);
  }

  getItems() { return this.items; }
  getItemCount() { return this.items.length; }
}
