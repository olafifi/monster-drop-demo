(function attachCanvasViewport(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CanvasViewport = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createCanvasViewport() {
  function computeWorldViewport({ screenWidth, screenHeight, worldWidth, worldHeight }) {
    const safeScreenWidth = Math.max(1, Number(screenWidth) || 1);
    const safeScreenHeight = Math.max(1, Number(screenHeight) || 1);
    const safeWorldWidth = Math.max(1, Number(worldWidth) || 1);
    const safeWorldHeight = Math.max(1, Number(worldHeight) || 1);
    const scale = Math.min(safeScreenWidth / safeWorldWidth, safeScreenHeight / safeWorldHeight);
    const offsetX = safeScreenWidth / 2 - (safeWorldWidth / 2) * scale;
    const offsetY = safeScreenHeight / 2 - (safeWorldHeight / 2) * scale;

    return {
      screenWidth: safeScreenWidth,
      screenHeight: safeScreenHeight,
      worldWidth: safeWorldWidth,
      worldHeight: safeWorldHeight,
      scale,
      offsetX,
      offsetY,
    };
  }

  function screenToWorld(point, viewport) {
    return {
      x: (point.x - viewport.offsetX) / viewport.scale,
      y: (point.y - viewport.offsetY) / viewport.scale,
    };
  }

  function worldToScreen(point, viewport) {
    return {
      x: point.x * viewport.scale + viewport.offsetX,
      y: point.y * viewport.scale + viewport.offsetY,
    };
  }

  function getVisibleWorldBounds(viewport) {
    const topLeft = screenToWorld({ x: 0, y: 0 }, viewport);
    const bottomRight = screenToWorld(
      { x: viewport.screenWidth, y: viewport.screenHeight },
      viewport,
    );
    return {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  return {
    computeWorldViewport,
    getVisibleWorldBounds,
    screenToWorld,
    worldToScreen,
  };
});
