const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function assertIncludes(text) {
  assert.ok(html.includes(text), `Expected index.html to include: ${text}`);
}

test("configuration controls show Chinese labels while keeping field keys", () => {
  [
    "角色 X",
    "角色 Y",
    "怪物 X",
    "怪物 Y",
    "怪物半径",
    "掉落角度",
    "掉落内半径",
    "掉落外半径",
    "随机生成数量",
    "playerX",
    "monsterRadius",
    "dropOuterRadius",
    "sampleCount",
  ].forEach(assertIncludes);
});

test("algorithm help exposes the actual sampling formula", () => {
  [
    'aria-label="查看实际计算算法"',
    "baseAngle = atan2(M.y - P.y, M.x - P.x)",
    "theta = baseAngle + random(-dropAngle / 2, dropAngle / 2)",
    "r = sqrt(random(dropInnerRadius², dropOuterRadius²))",
    "dropPos = M + Vector2(cos(theta), sin(theta)) * r",
  ].forEach(assertIncludes);
});
