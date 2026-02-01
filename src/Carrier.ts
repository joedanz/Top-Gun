// ABOUTME: Aircraft carrier entity with hull and flight deck meshes.
// ABOUTME: Provides deck collision surface for carrier takeoff/landing operations.

import { MeshBuilder, StandardMaterial, Color3, type Scene, type Mesh } from "@babylonjs/core";

const HULL_WIDTH = 20;
const HULL_HEIGHT = 8;
const HULL_LENGTH = 120;
const DECK_WIDTH = 24;
const DECK_HEIGHT = 0.5;
const DECK_LENGTH = 130;
const DECK_Y = HULL_HEIGHT / 2;

export class Carrier {
  hull: Mesh;
  deck: Mesh;
  private readonly position: { x: number; y: number; z: number };

  constructor(
    scene: Scene,
    position: { x: number; y: number; z: number },
    heading = 0,
  ) {
    this.position = { ...position };

    this.hull = MeshBuilder.CreateBox(
      "carrier-hull",
      { width: HULL_WIDTH, height: HULL_HEIGHT, depth: HULL_LENGTH },
      scene,
    ) as Mesh;
    this.hull.position.x = position.x;
    this.hull.position.y = position.y;
    this.hull.position.z = position.z;
    this.hull.rotation.y = heading;

    const hullMat = new StandardMaterial("carrier-hull-mat", scene);
    hullMat.diffuseColor = new Color3(0.35, 0.35, 0.4);
    this.hull.material = hullMat;

    this.deck = MeshBuilder.CreateBox(
      "carrier-deck",
      { width: DECK_WIDTH, height: DECK_HEIGHT, depth: DECK_LENGTH },
      scene,
    ) as Mesh;
    this.deck.position.x = position.x;
    this.deck.position.y = position.y + DECK_Y;
    this.deck.position.z = position.z;
    this.deck.rotation.y = heading;

    const deckMat = new StandardMaterial("carrier-deck-mat", scene);
    deckMat.diffuseColor = new Color3(0.25, 0.25, 0.3);
    this.deck.material = deckMat;
  }

  /** Returns the Y coordinate of the landing surface. */
  getDeckY(): number {
    return this.position.y + DECK_Y + DECK_HEIGHT / 2;
  }

  /** Checks if a world position is within the deck bounds (for landing detection). */
  isOnDeck(pos: { x: number; y: number; z: number }): boolean {
    const dx = Math.abs(pos.x - this.position.x);
    const dz = Math.abs(pos.z - this.position.z);
    return dx <= DECK_WIDTH / 2 && dz <= DECK_LENGTH / 2;
  }
}
