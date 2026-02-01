// ABOUTME: Entry point that initializes the Game on the render canvas.
// ABOUTME: Bootstraps the Babylon.js engine when the DOM is ready.

import { Game } from "./Game";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
new Game(canvas);
