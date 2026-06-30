(function attachDropInteraction(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./dropMath.js"));
  } else {
    root.DropInteraction = factory(root.DropMath);
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createDropInteraction(dropMath) {
  const WHEEL_TARGETS = {
    player: "player",
    monster: "monster",
    dropOuterRadius: "dropOuterRadius",
  };

  const LIMITS = {
    playerRadiusMin: 4,
    playerRadiusMax: 90,
    monsterRadiusMin: 0,
    monsterRadiusMax: 180,
    dropOuterRadiusMax: 420,
    wheelStep: 6,
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function clampInteractionConfig(rawConfig) {
    const config = dropMath.clampConfig(rawConfig);
    const rawPlayerRadius = Number(rawConfig.playerRadius);
    config.playerRadius = clamp(
      Number.isFinite(rawPlayerRadius) ? rawPlayerRadius : config.playerRadius,
      LIMITS.playerRadiusMin,
      LIMITS.playerRadiusMax,
    );
    return config;
  }

  function distanceTo(point, x, y) {
    return Math.hypot(point.x - x, point.y - y);
  }

  function getWheelTarget(point, rawConfig) {
    const config = clampInteractionConfig(rawConfig);
    if (distanceTo(point, config.playerX, config.playerY) <= config.playerRadius) {
      return WHEEL_TARGETS.player;
    }
    if (distanceTo(point, config.monsterX, config.monsterY) <= Math.max(12, config.monsterRadius)) {
      return WHEEL_TARGETS.monster;
    }
    if (dropMath.isPointInDropRegion(point, config)) {
      return WHEEL_TARGETS.dropOuterRadius;
    }
    return null;
  }

  function applyWheelDelta(rawConfig, target, deltaY, options = {}) {
    const config = clampInteractionConfig(rawConfig);
    const step = options.step ?? LIMITS.wheelStep;
    const direction = deltaY < 0 ? 1 : -1;
    const amount = direction * step;

    if (target === WHEEL_TARGETS.player) {
      config.playerRadius = clamp(
        config.playerRadius + amount,
        LIMITS.playerRadiusMin,
        LIMITS.playerRadiusMax,
      );
    }

    if (target === WHEEL_TARGETS.monster) {
      config.monsterRadius = clamp(
        config.monsterRadius + amount,
        LIMITS.monsterRadiusMin,
        LIMITS.monsterRadiusMax,
      );
    }

    if (target === WHEEL_TARGETS.dropOuterRadius) {
      config.dropOuterRadius = clamp(
        config.dropOuterRadius + amount,
        config.dropInnerRadius,
        LIMITS.dropOuterRadiusMax,
      );
    }

    return config;
  }

  return {
    LIMITS,
    WHEEL_TARGETS,
    applyWheelDelta,
    clampInteractionConfig,
    getWheelTarget,
  };
});
