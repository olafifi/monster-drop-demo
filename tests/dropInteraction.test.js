const assert = require("node:assert/strict");

const {
  applyWheelDelta,
  getWheelTarget,
  WHEEL_TARGETS,
} = require("../src/dropInteraction.js");

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const baseConfig = {
  playerX: 100,
  playerY: 100,
  playerRadius: 20,
  monsterX: 300,
  monsterY: 100,
  monsterRadius: 40,
  dropAngle: 180,
  dropInnerRadius: 60,
  dropOuterRadius: 140,
  sampleCount: 20,
};

test("getWheelTarget detects player before other regions", () => {
  const target = getWheelTarget({ x: 108, y: 100 }, baseConfig);

  assert.equal(target, WHEEL_TARGETS.player);
});

test("getWheelTarget detects monster before the drop sector", () => {
  const target = getWheelTarget({ x: 330, y: 100 }, baseConfig);

  assert.equal(target, WHEEL_TARGETS.monster);
});

test("getWheelTarget detects the annular drop region", () => {
  const target = getWheelTarget({ x: 400, y: 100 }, baseConfig);

  assert.equal(target, WHEEL_TARGETS.dropOuterRadius);
});

test("applyWheelDelta increases player radius when wheel scrolls up", () => {
  const next = applyWheelDelta(baseConfig, WHEEL_TARGETS.player, -100);

  assert.equal(next.playerRadius, 26);
});

test("applyWheelDelta changes monster radius and keeps it non-negative", () => {
  const next = applyWheelDelta({ ...baseConfig, monsterRadius: 3 }, WHEEL_TARGETS.monster, 100);

  assert.equal(next.monsterRadius, 0);
});

test("applyWheelDelta changes drop outer radius without crossing inner radius", () => {
  const next = applyWheelDelta(
    { ...baseConfig, dropInnerRadius: 60, dropOuterRadius: 62 },
    WHEEL_TARGETS.dropOuterRadius,
    100,
  );

  assert.equal(next.dropOuterRadius, 60);
});
