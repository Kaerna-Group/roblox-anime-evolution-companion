document.addEventListener("DOMContentLoaded", () => {
  initProgression().catch(handleError);
});

const progressionState = {
  data: null
};

const PROGRESSION_LEVEL_STORAGE_KEY = "progression.currentLevel";
const PROGRESSION_STORAGE_KEY = "progression.currentSouls";

async function initProgression() {
  progressionState.data = await Site.loadJson("crit-levels.json");

  populateLevelSelect();
  restoreSavedSouls();
  bindInputs();
  renderTable();
  updateCalculator();
}

function populateLevelSelect() {
  const select = document.getElementById("current-level");
  const levels = progressionState.data.levels || [];

  select.innerHTML = levels
    .map((item) => `<option value="${item.level}">Level ${item.level}</option>`)
    .join("");

  const defaultLevel = String(Math.min(8, progressionState.data.maxLevel || 1));
  const savedLevel = Site.storageGet(PROGRESSION_LEVEL_STORAGE_KEY, defaultLevel);
  const hasSavedLevel = levels.some((item) => String(item.level) === String(savedLevel));

  select.value = hasSavedLevel ? String(savedLevel) : defaultLevel;
}

function bindInputs() {
  document.getElementById("current-level").addEventListener("change", () => {
    persistLevel();
    renderTable();
    updateCalculator();
  });

  document.getElementById("current-souls").addEventListener("input", () => {
    persistSouls();
    updateCalculator();
  });
}

function restoreSavedSouls() {
  const input = document.getElementById("current-souls");
  const savedValue = Site.storageGet(PROGRESSION_STORAGE_KEY, 0);
  const normalizedValue = Math.max(0, Number(savedValue) || 0);
  input.value = String(normalizedValue);
}

function persistLevel() {
  const select = document.getElementById("current-level");
  const level = Number(select.value) || 1;
  Site.storageSet(PROGRESSION_LEVEL_STORAGE_KEY, level);
}

function persistSouls() {
  const input = document.getElementById("current-souls");
  const souls = Math.max(0, Number(input.value) || 0);
  Site.storageSet(PROGRESSION_STORAGE_KEY, souls);
}

function updateCalculator() {
  const level = Number(document.getElementById("current-level").value);
  const souls = Math.max(0, Number(document.getElementById("current-souls").value) || 0);

  const result = getCritProgress(level, souls);
  const levels = progressionState.data.levels || [];
  const maxLevel = progressionState.data.maxLevel || 1;
  const totalToMax = levels[levels.length - 1]?.totalCostToReach || 0;
  const progressPercent = totalToMax > 0
    ? Math.min(100, ((totalToMax - result.totalSoulsRemainingToMax) / totalToMax) * 100)
    : 0;

  document.getElementById("result-current-multiplier").textContent = Site.formatMultiplier(result.current.multiplier);
  document.getElementById("result-next-multiplier").textContent = result.next ? Site.formatMultiplier(result.next.multiplier) : "MAX";
  document.getElementById("result-souls-next").textContent = result.isMaxLevel ? "0" : Site.formatNumber(result.soulsToNext);
  document.getElementById("result-souls-max").textContent = Site.formatNumber(result.totalSoulsRemainingToMax);
  document.getElementById("result-affordable-level").textContent = `Level ${result.affordableLevelAfterSpend}`;
  document.getElementById("result-souls-left").textContent = Site.formatNumber(result.soulsLeftAfterAutoSpend);
  document.getElementById("progress-percent").textContent = `${progressPercent.toFixed(1)}%`;
  document.getElementById("progress-bar").style.width = `${progressPercent}%`;
  document.getElementById("progress-text").textContent =
    `Current level: ${level}/${maxLevel} - Current souls: ${Site.formatNumber(souls)} - Total souls to max from now: ${Site.formatNumber(result.totalSoulsRemainingToMax)}`;

  renderTable();
}

function getCritProgress(currentLevel, currentSouls) {
  const levels = progressionState.data.levels || [];
  const currentIndex = levels.findIndex((item) => item.level === currentLevel);

  if (currentIndex === -1) {
    throw new Error("Invalid crit level");
  }

  const current = levels[currentIndex];
  const next = levels[currentIndex + 1] || null;
  const futureLevels = levels.slice(currentIndex + 1);
  const totalNeededFromNow = futureLevels.reduce((sum, item) => sum + item.costToReach, 0);

  let simulatedLevel = currentLevel;
  let simulatedSouls = currentSouls;

  while (true) {
    const nextLevel = levels.find((item) => item.level === simulatedLevel + 1);
    if (!nextLevel || simulatedSouls < nextLevel.costToReach) break;

    simulatedSouls -= nextLevel.costToReach;
    simulatedLevel += 1;
  }

  const nextAfterSimulation = levels.find((item) => item.level === simulatedLevel + 1) || null;

  return {
    current,
    next,
    currentSouls,
    soulsToNext: next ? Math.max(0, next.costToReach - currentSouls) : 0,
    totalSoulsNeededFromNow: totalNeededFromNow,
    totalSoulsRemainingToMax: Math.max(0, totalNeededFromNow - currentSouls),
    affordableLevelAfterSpend: simulatedLevel,
    soulsLeftAfterAutoSpend: simulatedSouls,
    nextLevelAfterAutoSpend: nextAfterSimulation,
    soulsToNextAfterAutoSpend: nextAfterSimulation ? Math.max(0, nextAfterSimulation.costToReach - simulatedSouls) : 0,
    isMaxLevel: currentLevel >= progressionState.data.maxLevel
  };
}

function renderTable() {
  const tbody = document.getElementById("crit-table-body");
  const selectedLevel = Number(document.getElementById("current-level")?.value || 1);
  const levels = progressionState.data.levels || [];

  tbody.innerHTML = levels
    .map((item) => {
      const isCurrent = item.level === selectedLevel;
      const isNext = item.level === selectedLevel + 1;
      const rowClass = isCurrent ? ' class="row-current"' : isNext ? ' class="row-next"' : "";
      const status = isCurrent
        ? '<span class="status-pill status-pill--current">Current</span>'
        : isNext
          ? '<span class="status-pill status-pill--next">Next</span>'
          : '<span class="status-pill status-pill--muted">--</span>';

      return `
        <tr${rowClass}>
          <td>Level ${item.level}</td>
          <td>${Site.formatMultiplier(item.multiplier)}</td>
          <td>${Site.formatNumber(item.costToReach)}</td>
          <td>${Site.formatNumber(item.totalCostToReach)}</td>
          <td>${status}</td>
        </tr>
      `;
    })
    .join("");
}

function handleError(error) {
  console.error(error);

  document.getElementById("crit-table-body").innerHTML = `
    <tr>
      <td colspan="5" class="table-empty table-empty--error">Failed to load progression data.</td>
    </tr>
  `;

  [
    "result-current-multiplier",
    "result-next-multiplier",
    "result-souls-next",
    "result-souls-max",
    "result-affordable-level",
    "result-souls-left",
    "progress-percent",
    "progress-text"
  ].forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = "Error";
    }
  });
}
