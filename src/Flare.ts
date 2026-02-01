// ABOUTME: Countermeasure flare entity that drifts behind aircraft to decoy heat-seeking missiles.
// ABOUTME: Creates a bright particle effect and expires after a short lifetime.

import { MeshBuilder, ParticleSystem, Vector3, Color4, type Scene, type Mesh } from "@babylonjs/core";

const FLARE_LIFETIME = 3;
const FLARE_DRIFT_SPEED = 20; // backward drift
const FLARE_GRAVITY = 15; // sinks over time

export class Flare {
  mesh: Mesh;
  alive = true;
  private age = 0;
  private dirY: number;

  constructor(
    scene: Scene,
    position: { x: number; y: number; z: number },
    aircraftYaw: number,
  ) {
    this.dirY = aircraftYaw;

    this.mesh = MeshBuilder.CreateSphere(
      "flare",
      { diameter: 0.5 },
      scene,
    ) as Mesh;
    this.mesh.position.x = position.x;
    this.mesh.position.y = position.y;
    this.mesh.position.z = position.z;

    // Particle effect for bright flare glow
    const ps = new ParticleSystem("flareParticles", 50, scene);
    ps.emitter = this.mesh as unknown as Vector3;
    ps.minSize = 0.3;
    ps.maxSize = 1.0;
    ps.minLifeTime = 0.2;
    ps.maxLifeTime = 0.5;
    ps.emitRate = 30;
    ps.color1 = new Color4(1, 1, 0.5, 1);
    ps.color2 = new Color4(1, 0.8, 0, 1);
    ps.colorDead = new Color4(1, 0.3, 0, 0);
    ps.minEmitPower = 1;
    ps.maxEmitPower = 3;
    ps.direction1 = new Vector3(-0.5, -0.5, -0.5);
    ps.direction2 = new Vector3(0.5, 0.5, 0.5);
    ps.targetStopDuration = FLARE_LIFETIME;
    ps.disposeOnStop = true;
    ps.start();
  }

  update(dt: number): void {
    if (!this.alive) return;

    this.age += dt;
    if (this.age >= FLARE_LIFETIME) {
      this.alive = false;
      this.mesh.dispose();
      return;
    }

    // Drift backward (opposite to aircraft heading) and sink
    this.mesh.position.x -= Math.sin(this.dirY) * FLARE_DRIFT_SPEED * dt;
    this.mesh.position.z -= Math.cos(this.dirY) * FLARE_DRIFT_SPEED * dt;
    this.mesh.position.y -= FLARE_GRAVITY * dt;
  }
}
