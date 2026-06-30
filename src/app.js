(() => {
  const {
    TAU,
    degToRad,
    getBaseAngleFromConfig,
    isPointInDropRegion,
    normalizeRadians,
    radToDeg,
    sampleDropPosition,
  } = window.DropMath;
  const {
    WHEEL_TARGETS,
    applyWheelDelta,
    clampInteractionConfig,
    getWheelTarget,
  } = window.DropInteraction;

  const WORLD_WIDTH = 900;
  const WORLD_HEIGHT = 620;

  const DEFAULT_CONFIG = {
    playerX: 250,
    playerY: 310,
    playerRadius: 18,
    monsterX: 520,
    monsterY: 310,
    monsterRadius: 42,
    dropAngle: 180,
    dropInnerRadius: 74,
    dropOuterRadius: 190,
    sampleCount: 120,
  };

  const canvas = document.getElementById("dropCanvas");
  const ctx = canvas.getContext("2d");
  const warningsEl = document.getElementById("warnings");
  const sampleCountBadge = document.getElementById("sampleCountBadge");
  const hoverTargetBadge = document.getElementById("hoverTargetBadge");

  const controls = {
    playerX: document.getElementById("playerX"),
    playerY: document.getElementById("playerY"),
    playerRadius: document.getElementById("playerRadius"),
    playerRadiusRange: document.getElementById("playerRadiusRange"),
    monsterX: document.getElementById("monsterX"),
    monsterY: document.getElementById("monsterY"),
    monsterRadius: document.getElementById("monsterRadius"),
    monsterRadiusRange: document.getElementById("monsterRadiusRange"),
    dropAngle: document.getElementById("dropAngle"),
    dropAngleRange: document.getElementById("dropAngleRange"),
    dropInnerRadius: document.getElementById("dropInnerRadius"),
    dropInnerRadiusRange: document.getElementById("dropInnerRadiusRange"),
    dropOuterRadius: document.getElementById("dropOuterRadius"),
    dropOuterRadiusRange: document.getElementById("dropOuterRadiusRange"),
    sampleCount: document.getElementById("sampleCount"),
    sampleCountRange: document.getElementById("sampleCountRange"),
  };

  const results = {
    baseAngle: document.getElementById("baseAngleValue"),
    dropAngle: document.getElementById("dropAngleValue"),
    dropInnerRadius: document.getElementById("dropInnerRadiusValue"),
    dropOuterRadius: document.getElementById("dropOuterRadiusValue"),
    lastDrop: document.getElementById("lastDropValue"),
  };

  const state = {
    config: clampInteractionConfig(DEFAULT_CONFIG),
    samples: [],
    lastDrop: null,
    dragTarget: null,
    hoverTarget: null,
    warningFlags: {
      swapped: false,
    },
  };

  const linkedRanges = {
    monsterRadius: "monsterRadiusRange",
    monsterRadiusRange: "monsterRadius",
    playerRadius: "playerRadiusRange",
    playerRadiusRange: "playerRadius",
    dropAngle: "dropAngleRange",
    dropAngleRange: "dropAngle",
    dropInnerRadius: "dropInnerRadiusRange",
    dropInnerRadiusRange: "dropInnerRadius",
    dropOuterRadius: "dropOuterRadiusRange",
    dropOuterRadiusRange: "dropOuterRadius",
    sampleCount: "sampleCountRange",
    sampleCountRange: "sampleCount",
  };

  function readRawConfig() {
    return {
      playerX: controls.playerX.value,
      playerY: controls.playerY.value,
      playerRadius: controls.playerRadius.value,
      monsterX: controls.monsterX.value,
      monsterY: controls.monsterY.value,
      monsterRadius: controls.monsterRadius.value,
      dropAngle: controls.dropAngle.value,
      dropInnerRadius: controls.dropInnerRadius.value,
      dropOuterRadius: controls.dropOuterRadius.value,
      sampleCount: controls.sampleCount.value,
    };
  }

  function syncControls(config) {
    controls.playerX.value = Math.round(config.playerX);
    controls.playerY.value = Math.round(config.playerY);
    controls.playerRadius.value = Math.round(config.playerRadius);
    controls.playerRadiusRange.value = Math.round(config.playerRadius);
    controls.monsterX.value = Math.round(config.monsterX);
    controls.monsterY.value = Math.round(config.monsterY);
    controls.monsterRadius.value = Math.round(config.monsterRadius);
    controls.monsterRadiusRange.value = Math.round(config.monsterRadius);
    controls.dropAngle.value = Math.round(config.dropAngle);
    controls.dropAngleRange.value = Math.round(config.dropAngle);
    controls.dropInnerRadius.value = Math.round(config.dropInnerRadius);
    controls.dropInnerRadiusRange.value = Math.round(config.dropInnerRadius);
    controls.dropOuterRadius.value = Math.round(config.dropOuterRadius);
    controls.dropOuterRadiusRange.value = Math.round(config.dropOuterRadius);
    controls.sampleCount.value = Math.round(config.sampleCount);
    controls.sampleCountRange.value = Math.round(config.sampleCount);
  }

  function updateConfigFromControls(sourceId) {
    const siblingId = linkedRanges[sourceId];
    if (siblingId) {
      controls[siblingId].value = controls[sourceId].value;
    }

    const cleaned = clampInteractionConfig(readRawConfig());
    cleaned.playerX = clampToWorld(cleaned.playerX, WORLD_WIDTH);
    cleaned.playerY = clampToWorld(cleaned.playerY, WORLD_HEIGHT);
    cleaned.monsterX = clampToWorld(cleaned.monsterX, WORLD_WIDTH);
    cleaned.monsterY = clampToWorld(cleaned.monsterY, WORLD_HEIGHT);
    cleaned.sampleCount = Math.min(1000, cleaned.sampleCount);

    state.warningFlags.swapped = cleaned.outerRadiusSwapped;
    state.config = cleaned;
    state.samples = [];
    state.lastDrop = null;
    syncControls(cleaned);
    render();
  }

  function clampToWorld(value, max) {
    return Math.min(max, Math.max(0, value));
  }

  function resetDefaults() {
    state.config = clampInteractionConfig(DEFAULT_CONFIG);
    state.samples = [];
    state.lastDrop = null;
    state.warningFlags.swapped = false;
    syncControls(state.config);
    render();
  }

  function generateDrop(count, replaceExisting) {
    const nextSamples = replaceExisting ? [] : state.samples.slice();
    for (let index = 0; index < count; index += 1) {
      const sample = sampleDropPosition(state.config);
      sample.kind = index % 2 === 0 ? "烧鸡" : "鸡腿";
      nextSamples.push(sample);
      state.lastDrop = sample;
    }
    state.samples = nextSamples.filter((sample) => isPointInDropRegion(sample, state.config));
    render();
  }

  function clearSamples() {
    state.samples = [];
    state.lastDrop = null;
    render();
  }

  function setupCanvasResolution() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(WORLD_WIDTH * ratio);
    canvas.height = Math.round(WORLD_HEIGHT * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function getPointerWorldPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT,
    };
  }

  function pickDragTarget(point) {
    const target = getWheelTarget(point, state.config);
    if (target === WHEEL_TARGETS.player) return "player";
    if (target === WHEEL_TARGETS.monster) return "monster";
    return null;
  }

  function moveDragTarget(point) {
    if (!state.dragTarget) return;
    const x = Math.round(clampToWorld(point.x, WORLD_WIDTH));
    const y = Math.round(clampToWorld(point.y, WORLD_HEIGHT));
    if (state.dragTarget === "player") {
      state.config.playerX = x;
      state.config.playerY = y;
    } else {
      state.config.monsterX = x;
      state.config.monsterY = y;
    }
    state.samples = [];
    state.lastDrop = null;
    syncControls(state.config);
    render();
  }

  function render() {
    drawScene();
    updateResults();
    updateWarnings();
  }

  function updateResults() {
    const baseAngle = normalizeRadians(getBaseAngleFromConfig(state.config));
    results.baseAngle.textContent = `${formatNumber(radToDeg(baseAngle), 2)}°`;
    results.dropAngle.textContent = `${formatNumber(state.config.dropAngle, 0)}°`;
    results.dropInnerRadius.textContent = formatNumber(state.config.dropInnerRadius, 0);
    results.dropOuterRadius.textContent = formatNumber(state.config.dropOuterRadius, 0);
    results.lastDrop.textContent = state.lastDrop
      ? `(${formatNumber(state.lastDrop.x, 1)}, ${formatNumber(state.lastDrop.y, 1)})`
      : "-";
    sampleCountBadge.textContent = `${state.samples.length} 个落点`;
    hoverTargetBadge.textContent = `滚轮目标：${getWheelTargetLabel(state.hoverTarget)}`;
  }

  function updateWarnings() {
    const warnings = [];
    if (state.warningFlags.swapped) {
      warnings.push("掉落外半径小于掉落内半径，已自动交换两者。");
    }
    if (state.config.dropInnerRadius < state.config.monsterRadius) {
      warnings.push("建议掉落内半径大于等于怪物半径，避免道具落在怪物占位内。");
    }
    warningsEl.innerHTML = warnings
      .map((message) => `<div class="warning-item">${message}</div>`)
      .join("");
  }

  function drawScene() {
    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    drawBackground();
    drawDropRegion();
    drawMonsterRadius();
    drawDirectionArrow();
    drawSamples();
    drawActorMarkers();
    drawHoverHighlight();
  }

  function drawBackground() {
    ctx.save();
    ctx.fillStyle = "#fbfcfe";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    ctx.strokeStyle = "#e8edf2";
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD_WIDTH; x += 50) {
      drawLine(x, 0, x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 50) {
      drawLine(0, y, WORLD_WIDTH, y);
    }

    ctx.strokeStyle = "#cfd8e2";
    ctx.lineWidth = 1.5;
    drawLine(WORLD_WIDTH / 2, 0, WORLD_WIDTH / 2, WORLD_HEIGHT);
    drawLine(0, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT / 2);
    ctx.restore();
  }

  function drawDropRegion() {
    const config = state.config;
    const baseAngle = getBaseAngleFromConfig(config);
    const halfAngle = degToRad(config.dropAngle) / 2;
    const startAngle = config.dropAngle >= 360 ? 0 : baseAngle - halfAngle;
    const endAngle = config.dropAngle >= 360 ? TAU : baseAngle + halfAngle;

    ctx.save();
    ctx.fillStyle = "rgba(31, 157, 97, 0.18)";
    ctx.strokeStyle = "rgba(20, 122, 73, 0.72)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (config.dropAngle >= 360) {
      ctx.arc(config.monsterX, config.monsterY, config.dropOuterRadius, 0, TAU);
      ctx.arc(config.monsterX, config.monsterY, config.dropInnerRadius, TAU, 0, true);
    } else {
      ctx.arc(config.monsterX, config.monsterY, config.dropOuterRadius, startAngle, endAngle);
      ctx.lineTo(
        config.monsterX + Math.cos(endAngle) * config.dropInnerRadius,
        config.monsterY + Math.sin(endAngle) * config.dropInnerRadius,
      );
      ctx.arc(
        config.monsterX,
        config.monsterY,
        config.dropInnerRadius,
        endAngle,
        startAngle,
        true,
      );
    }
    ctx.closePath();
    ctx.fill("evenodd");

    drawArc(config.dropOuterRadius, startAngle, endAngle, "rgba(20, 122, 73, 0.95)", 3);
    drawArc(config.dropInnerRadius, startAngle, endAngle, "rgba(20, 122, 73, 0.95)", 3);
    drawBoundaryLine(startAngle);
    drawBoundaryLine(endAngle);

    if (config.dropAngle >= 360) {
      ctx.setLineDash([6, 7]);
      drawRadiusLine(baseAngle, config.dropInnerRadius, config.dropOuterRadius, "#32855c", 1.5);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawMonsterRadius() {
    const config = state.config;
    ctx.save();
    ctx.setLineDash([8, 7]);
    ctx.strokeStyle = "rgba(217, 72, 65, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(config.monsterX, config.monsterY, config.monsterRadius, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawDirectionArrow() {
    const config = state.config;
    const baseAngle = getBaseAngleFromConfig(config);
    const start = { x: config.playerX, y: config.playerY };
    const end = {
      x: config.monsterX - Math.cos(baseAngle) * Math.max(18, config.monsterRadius * 0.55),
      y: config.monsterY - Math.sin(baseAngle) * Math.max(18, config.monsterRadius * 0.55),
    };

    ctx.save();
    ctx.strokeStyle = "#334155";
    ctx.fillStyle = "#334155";
    ctx.lineWidth = 2.5;
    drawLine(start.x, start.y, end.x, end.y);

    const arrowSize = 10;
    ctx.beginPath();
    ctx.moveTo(end.x + Math.cos(baseAngle) * arrowSize, end.y + Math.sin(baseAngle) * arrowSize);
    ctx.lineTo(
      end.x + Math.cos(baseAngle + Math.PI * 0.78) * arrowSize,
      end.y + Math.sin(baseAngle + Math.PI * 0.78) * arrowSize,
    );
    ctx.lineTo(
      end.x + Math.cos(baseAngle - Math.PI * 0.78) * arrowSize,
      end.y + Math.sin(baseAngle - Math.PI * 0.78) * arrowSize,
    );
    ctx.closePath();
    ctx.fill();

    drawText("玩家 → 怪物", midpoint(start.x, end.x), midpoint(start.y, end.y) - 10, "#334155");
    ctx.restore();
  }

  function drawSamples() {
    ctx.save();
    state.samples.forEach((sample, index) => {
      const isRoastChicken = sample.kind === "烧鸡";
      ctx.fillStyle = isRoastChicken ? "#f08a24" : "#f4b23c";
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sample.x, sample.y, 5.5, 0, TAU);
      ctx.fill();
      ctx.stroke();

      if (index === state.samples.length - 1) {
        ctx.strokeStyle = "#111827";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sample.x, sample.y, 9, 0, TAU);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  function drawActorMarkers() {
    const config = state.config;
    drawPlayer(config.playerX, config.playerY, config.playerRadius);
    drawMonster(config.monsterX, config.monsterY, config.monsterRadius);
  }

  function drawPlayer(x, y, radius) {
    ctx.save();
    ctx.fillStyle = "#2563eb";
    ctx.strokeStyle = "#173b8f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x - radius * 0.32, y - radius * 0.16, Math.max(2, radius * 0.14), 0, TAU);
    ctx.arc(x + radius * 0.32, y - radius * 0.16, Math.max(2, radius * 0.14), 0, TAU);
    ctx.fill();
    drawText("角色", x, y + Math.max(28, radius + 16), "#173b8f");
    ctx.restore();
  }

  function drawMonster(x, y, radius) {
    ctx.save();
    ctx.fillStyle = "#d94841";
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(12, radius * 0.62), 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x - radius * 0.18, y - radius * 0.12, 3.2, 0, TAU);
    ctx.arc(x + radius * 0.18, y - radius * 0.12, 3.2, 0, TAU);
    ctx.fill();
    drawText("怪物", x, y + Math.max(30, radius * 0.82), "#7f1d1d");
    ctx.restore();
  }

  function drawArc(radius, startAngle, endAngle, color, width) {
    const config = state.config;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(config.monsterX, config.monsterY, radius, startAngle, endAngle);
    ctx.stroke();
    ctx.restore();
  }

  function drawBoundaryLine(angle) {
    drawRadiusLine(angle, state.config.dropInnerRadius, state.config.dropOuterRadius, "#166141", 2.5);
  }

  function drawHoverHighlight() {
    const config = state.config;
    if (!state.hoverTarget) return;

    ctx.save();
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);

    if (state.hoverTarget === WHEEL_TARGETS.player) {
      ctx.beginPath();
      ctx.arc(config.playerX, config.playerY, config.playerRadius + 4, 0, TAU);
      ctx.stroke();
    }

    if (state.hoverTarget === WHEEL_TARGETS.monster) {
      ctx.beginPath();
      ctx.arc(config.monsterX, config.monsterY, Math.max(12, config.monsterRadius) + 4, 0, TAU);
      ctx.stroke();
    }

    if (state.hoverTarget === WHEEL_TARGETS.dropOuterRadius) {
      const baseAngle = getBaseAngleFromConfig(config);
      const halfAngle = degToRad(config.dropAngle) / 2;
      const startAngle = config.dropAngle >= 360 ? 0 : baseAngle - halfAngle;
      const endAngle = config.dropAngle >= 360 ? TAU : baseAngle + halfAngle;
      ctx.beginPath();
      ctx.arc(config.monsterX, config.monsterY, config.dropOuterRadius + 4, startAngle, endAngle);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawRadiusLine(angle, innerRadius, outerRadius, color, width) {
    const config = state.config;
    const start = {
      x: config.monsterX + Math.cos(angle) * innerRadius,
      y: config.monsterY + Math.sin(angle) * innerRadius,
    };
    const end = {
      x: config.monsterX + Math.cos(angle) * outerRadius,
      y: config.monsterY + Math.sin(angle) * outerRadius,
    };
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    drawLine(start.x, start.y, end.x, end.y);
    ctx.restore();
  }

  function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function drawText(text, x, y, color) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 5;
    ctx.font = "13px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function midpoint(a, b) {
    return a + (b - a) / 2;
  }

  function formatNumber(value, decimals) {
    return Number(value).toFixed(decimals).replace(/\.0+$/, "");
  }

  function getWheelTargetLabel(target) {
    if (target === WHEEL_TARGETS.player) return "角色半径";
    if (target === WHEEL_TARGETS.monster) return "怪物半径";
    if (target === WHEEL_TARGETS.dropOuterRadius) return "掉落外半径";
    return "-";
  }

  function clearSamplesAfterConfigChange() {
    state.samples = [];
    state.lastDrop = null;
  }

  function updateHoverTarget(point) {
    const nextTarget = getWheelTarget(point, state.config);
    if (nextTarget === state.hoverTarget) return;
    state.hoverTarget = nextTarget;
    render();
  }

  function handleCanvasWheel(event) {
    const point = getPointerWorldPosition(event);
    const target = getWheelTarget(point, state.config);
    if (!target) return;

    event.preventDefault();
    state.config = applyWheelDelta(state.config, target, event.deltaY);
    state.warningFlags.swapped = false;
    clearSamplesAfterConfigChange();
    syncControls(state.config);
    state.hoverTarget = getWheelTarget(point, state.config);
    render();
  }

  function bindEvents() {
    Object.entries(controls).forEach(([id, control]) => {
      control.addEventListener("input", () => updateConfigFromControls(id));
    });

    document.getElementById("generateOne").addEventListener("click", () => generateDrop(1, false));
    document
      .getElementById("generateMany")
      .addEventListener("click", () => generateDrop(state.config.sampleCount, true));
    document.getElementById("clearSamples").addEventListener("click", clearSamples);
    document.getElementById("resetDefaults").addEventListener("click", resetDefaults);

    canvas.addEventListener("pointerdown", (event) => {
      const point = getPointerWorldPosition(event);
      state.dragTarget = pickDragTarget(point);
      if (!state.dragTarget) return;
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add("dragging");
      moveDragTarget(point);
    });

    canvas.addEventListener("pointermove", (event) => {
      const point = getPointerWorldPosition(event);
      if (state.dragTarget) {
        moveDragTarget(point);
        return;
      }
      updateHoverTarget(point);
    });

    canvas.addEventListener("pointerup", releaseDrag);
    canvas.addEventListener("pointercancel", releaseDrag);
    canvas.addEventListener("pointerleave", () => {
      state.hoverTarget = null;
      render();
    });
    canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });
    window.addEventListener("resize", () => {
      setupCanvasResolution();
      render();
    });
  }

  function releaseDrag(event) {
    if (state.dragTarget && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    state.dragTarget = null;
    canvas.classList.remove("dragging");
  }

  function init() {
    setupCanvasResolution();
    syncControls(state.config);
    bindEvents();
    render();
  }

  init();
})();
