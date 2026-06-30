const assert = require("node:assert/strict");

const {
  clampConfig,
  computeBaseAngle,
  sampleDropPosition,
  isPointInDropRegion,
  radToDeg,
} = require("../src/dropMath.js");

function approx(actual, expected, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`,
  );
}

function makeRandom(values) {
  let index = 0;
  return () => values[index++ % values.length];
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

test("clampConfig clamps angle and inner radius", () => {
  const result = clampConfig({
    playerX: 0,
    playerY: 0,
    monsterX: 10,
    monsterY: 0,
    monsterRadius: 30,
    dropAngle: -20,
    dropInnerRadius: -5,
    dropOuterRadius: 80,
    sampleCount: 10,
  });

  assert.equal(result.dropAngle, 1);
  assert.equal(result.dropInnerRadius, 0);
  assert.equal(result.dropOuterRadius, 80);
  assert.equal(result.outerRadiusSwapped, false);
});

test("clampConfig swaps outer radius when it is smaller than inner radius", () => {
  const result = clampConfig({
    playerX: 0,
    playerY: 0,
    monsterX: 10,
    monsterY: 0,
    monsterRadius: 30,
    dropAngle: 400,
    dropInnerRadius: 120,
    dropOuterRadius: 40,
    sampleCount: 10,
  });

  assert.equal(result.dropAngle, 360);
  assert.equal(result.dropInnerRadius, 40);
  assert.equal(result.dropOuterRadius, 120);
  assert.equal(result.outerRadiusSwapped, true);
});

test("computeBaseAngle returns zero when player and monster overlap", () => {
  const angle = computeBaseAngle({ x: 25, y: 40 }, { x: 25, y: 40 });

  assert.equal(angle, 0);
});

test("computeBaseAngle follows player to monster direction", () => {
  const angle = computeBaseAngle({ x: 10, y: 20 }, { x: 10, y: 120 });

  approx(radToDeg(angle), 90);
});

test("sampleDropPosition uses area-uniform radius inside the annular sector", () => {
  const config = {
    playerX: 0,
    playerY: 0,
    monsterX: 100,
    monsterY: 0,
    monsterRadius: 30,
    dropAngle: 180,
    dropInnerRadius: 40,
    dropOuterRadius: 100,
    sampleCount: 10,
  };
  const sample = sampleDropPosition(config, makeRandom([0.5, 0.25]));

  approx(radToDeg(sample.theta), 0);
  approx(sample.radius, Math.sqrt(0.25 * (100 * 100 - 40 * 40) + 40 * 40));
  approx(sample.x, config.monsterX + sample.radius);
  approx(sample.y, config.monsterY);
  assert.equal(isPointInDropRegion(sample, config), true);
});

test("sampleDropPosition treats 360 degrees as a full ring", () => {
  const config = {
    playerX: 200,
    playerY: 0,
    monsterX: 100,
    monsterY: 100,
    monsterRadius: 30,
    dropAngle: 360,
    dropInnerRadius: 10,
    dropOuterRadius: 20,
    sampleCount: 10,
  };
  const sample = sampleDropPosition(config, makeRandom([0.75, 1]));

  approx(radToDeg(sample.theta), 270);
  approx(sample.x, 100);
  approx(sample.y, 80);
  approx(sample.radius, 20);
  assert.equal(isPointInDropRegion(sample, config), true);
});

test("isPointInDropRegion rejects points outside sector boundary", () => {
  const config = {
    playerX: 0,
    playerY: 0,
    monsterX: 100,
    monsterY: 0,
    monsterRadius: 30,
    dropAngle: 90,
    dropInnerRadius: 20,
    dropOuterRadius: 80,
    sampleCount: 10,
  };
  const outside = { x: 100, y: 50 };

  assert.equal(isPointInDropRegion(outside, config), false);
});
