// ABOUTME: Reads keyboard state and exposes semantic flight input axes.
// ABOUTME: Decoupled from entities so AI or network sources can provide the same interface.

export interface FlightInput {
  readonly pitch: number;
  readonly roll: number;
  readonly yaw: number;
  readonly throttle: number;
  readonly fire: boolean;
}

export class InputManager implements FlightInput {
  private keys = new Set<string>();
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private disposed = false;

  constructor() {
    this.onKeyDown = (e: KeyboardEvent) => this.keys.add(e.key);
    this.onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  get pitch(): number {
    return this.axis("w", "s");
  }

  get roll(): number {
    return this.axis("d", "a");
  }

  get yaw(): number {
    return this.axis("e", "q");
  }

  get throttle(): number {
    return this.axis("Shift", "Control");
  }

  get fire(): boolean {
    return this.keys.has(" ");
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.keys.clear();
  }

  private axis(positive: string, negative: string): number {
    const pos = this.keys.has(positive) ? 1 : 0;
    const neg = this.keys.has(negative) ? 1 : 0;
    return pos - neg;
  }
}
