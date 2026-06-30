(function attachDropMath(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.DropMath = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createDropMath() {
  const TAU = Math.PI * 2;
  const EPSILON = 1e-9;

  function toFiniteNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function degToRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function radToDeg(radians) {
    return (radians * 180) / Math.PI;
  }

  function normalizeRadians(radians) {
    const wrapped = radians % TAU;
    return wrapped < 0 ? wrapped + TAU : wrapped;
  }

  // Returns the signed shortest angular difference in [-PI, PI].
  // This makes sector-boundary checks robust when the arc crosses 0 degrees.
  function signedAngleDelta(fromRadians, toRadians) {
    let delta = normalizeRadians(toRadians) - normalizeRadians(fromRadians);
    if (delta > Math.PI) delta -= TAU;
    if (delta < -Math.PI) delta += TAU;
    return delta;
  }

  function clampConfig(rawConfig) {
    const config = {
      playerX: toFiniteNumber(rawConfig.playerX, 0),
      playerY: toFiniteNumber(rawConfig.playerY, 0),
      playerRadius: Math.max(4, toFiniteNumber(rawConfig.playerRadius, 18)),
      monsterX: toFiniteNumber(rawConfig.monsterX, 0),
      monsterY: toFiniteNumber(rawConfig.monsterY, 0),
      monsterRadius: Math.max(0, toFiniteNumber(rawConfig.monsterRadius, 0)),
      dropAngle: clamp(toFiniteNumber(rawConfig.dropAngle, 1), 1, 360),
      dropInnerRadius: Math.max(0, toFiniteNumber(rawConfig.dropInnerRadius, 0)),
      dropOuterRadius: Math.max(0, toFiniteNumber(rawConfig.dropOuterRadius, 0)),
      sampleCount: Math.max(1, Math.round(toFiniteNumber(rawConfig.sampleCount, 1))),
      outerRadiusSwapped: false,
    };

    if (config.dropOuterRadius < config.dropInnerRadius) {
      const previousInnerRadius = config.dropInnerRadius;
      config.dropInnerRadius = config.dropOuterRadius;
      config.dropOuterRadius = previousInnerRadius;
      config.outerRadiusSwapped = true;
    }

    return config;
  }

  function computeBaseAngle(player, monster) {
    const dx = monster.x - player.x;
    const dy = monster.y - player.y;
    if (Math.abs(dx) <= EPSILON && Math.abs(dy) <= EPSILON) {
      return 0;
    }
    return Math.atan2(dy, dx);
  }

  function getBaseAngleFromConfig(rawConfig) {
    const config = clampConfig(rawConfig);
    return computeBaseAngle(
      { x: config.playerX, y: config.playerY },
      { x: config.monsterX, y: config.monsterY },
    );
  }

  function sampleDropPosition(rawConfig, random = Math.random) {
    const config = clampConfig(rawConfig);
    const baseAngle = getBaseAngleFromConfig(config);
    const angleRadians = degToRad(config.dropAngle);
    const theta =
      config.dropAngle >= 360
        ? random() * TAU
        : baseAngle + (random() - 0.5) * angleRadians;

    // Area-uniform annulus sampling: pick a value between squared radii,
    // then sqrt it so larger outer bands do not become under-sampled.
    const innerSquared = config.dropInnerRadius * config.dropInnerRadius;
    const outerSquared = config.dropOuterRadius * config.dropOuterRadius;
    const radius = Math.sqrt(innerSquared + random() * (outerSquared - innerSquared));

    return {
      x: config.monsterX + Math.cos(theta) * radius,
      y: config.monsterY + Math.sin(theta) * radius,
      theta: normalizeRadians(theta),
      radius,
      baseAngle: normalizeRadians(baseAngle),
    };
  }

  function isPointInDropRegion(point, rawConfig) {
    const config = clampConfig(rawConfig);
    const dx = point.x - config.monsterX;
    const dy = point.y - config.monsterY;
    const radius = Math.hypot(dx, dy);

    if (radius + EPSILON < config.dropInnerRadius) return false;
    if (radius - EPSILON > config.dropOuterRadius) return false;
    if (config.dropAngle >= 360) return true;

    const baseAngle = getBaseAngleFromConfig(config);
    const pointAngle = Math.atan2(dy, dx);
    const halfAngle = degToRad(config.dropAngle) / 2;
    return Math.abs(signedAngleDelta(baseAngle, pointAngle)) <= halfAngle + EPSILON;
  }

  return {
    TAU,
    clamp,
    clampConfig,
    computeBaseAngle,
    degToRad,
    getBaseAngleFromConfig,
    isPointInDropRegion,
    normalizeRadians,
    radToDeg,
    sampleDropPosition,
    signedAngleDelta,
  };
});
