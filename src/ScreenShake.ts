// ABOUTME: Applies decaying random camera position offsets on damage events.
// ABOUTME: Intensity scales with damage amount; offsets decay exponentially over time.

const MAX_AMPLITUDE = 1.5;
const DECAY_RATE = 8;

export class ScreenShake {
  private intensity = 0;
  private offset = { x: 0, y: 0, z: 0 };

  trigger(amount: number): void {
    this.intensity = Math.min(this.intensity + amount, 1);
  }

  update(dt: number): void {
    if (this.intensity < 0.001) {
      this.intensity = 0;
      this.offset.x = 0;
      this.offset.y = 0;
      this.offset.z = 0;
      return;
    }

    const amp = this.intensity * MAX_AMPLITUDE;
    this.offset.x = (Math.random() * 2 - 1) * amp;
    this.offset.y = (Math.random() * 2 - 1) * amp;
    this.offset.z = (Math.random() * 2 - 1) * amp;

    this.intensity *= Math.exp(-DECAY_RATE * dt);
  }

  getOffset(): { x: number; y: number; z: number } {
    return this.offset;
  }
}
