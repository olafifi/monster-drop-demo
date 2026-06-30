const assert = require("node:assert/strict");

const {
  computeWorldViewport,
  screenToWorld,
  worldToScreen,
} = require("../src/canvasViewport.js");

function approx(actual, expected, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`,
  );
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("computeWorldViewport uses one uniform scale for wide canvas areas", () => {
  const viewport = computeWorldViewport({
    screenWidth: 1250,
    screenHeight: 344,
    worldWidth: 900,
    worldHeight: 620,
  });

  approx(viewport.scale, 344 / 620);
  approx(viewport.offsetX, 1250 / 2 - (900 / 2) * viewport.scale);
  approx(viewport.offsetY, 0);
});

test("screenToWorld maps the canvas center back to the world center", () => {
  const viewport = computeWorldViewport({
    screenWidth: 1250,
    screenHeight: 344,
    worldWidth: 900,
    worldHeight: 620,
  });

  const world = screenToWorld({ x: 625, y: 172 }, viewport);

  approx(world.x, 450);
  approx(world.y, 310);
});

test("worldToScreen and screenToWorld are inverse transforms", () => {
  const viewport = computeWorldViewport({
    screenWidth: 900,
    screenHeight: 620,
    worldWidth: 900,
    worldHeight: 620,
  });

  const screen = worldToScreen({ x: 250, y: 310 }, viewport);
  const world = screenToWorld(screen, viewport);

  approx(world.x, 250);
  approx(world.y, 310);
});
