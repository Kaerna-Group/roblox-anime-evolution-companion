document.addEventListener("DOMContentLoaded", () => {
  initBossTimers().catch(handleError);
});

const bossState = {
  worldBosses: [],
  divineBosses: [],
  specialRules: [],
  filterValue: ""
};

async function initBossTimers() {
  const data = await Site.loadJson("boss-timers.json");

  bossState.worldBosses = Array.isArray(data.worldBosses) ? data.worldBosses : [];
  bossState.divineBosses = Array.isArray(data.divineBosses) ? data.divineBosses : [];
  bossState.specialRules = Array.isArray(data.specialRules) ? data.specialRules : [];

  renderRules();
  renderBossSections();
  bindFilter();
  updateBossUI();

  window.setInterval(updateBossUI, 1000);
}

function renderBossSections() {
  document.getElementById("world-boss-list").innerHTML = bossState.worldBosses
    .map((boss) => buildBossCard(boss, "world"))
    .join("");

  document.getElementById("divine-boss-list").innerHTML = bossState.divineBosses
    .map((boss) => buildBossCard(boss, "divine"))
    .join("");

  applyFilter();
}

function buildBossCard(boss, group) {
  const slots = Array.isArray(boss.slots) ? boss.slots : [];
  const slotBadges = slots
    .map((slot) => (slot ? `<span class="pill">${Site.escapeHtml(slot)}</span>` : '<span class="pill pill--danger">No Boss</span>'))
    .join("");

  return `
    <article class="card lift-card boss-card" data-world="${Site.escapeHtml(boss.world)}">
      <div class="card-heading boss-card__header">
        <div class="boss-card__title">
          <p class="meta-label">${group}</p>
          <h3>${Site.escapeHtml(boss.name)}</h3>
          <p class="muted-copy">World ${Site.escapeHtml(boss.world)}</p>
        </div>
        ${boss.needsVerification ? '<span class="pill pill--warning boss-card__badge">Verify timing</span>' : ""}
      </div>

      <div class="mini-stats">
        <div class="mini-stat">
          <span>Next Spawn</span>
          <strong id="${group}-next-${boss.world}">Loading...</strong>
        </div>
        <div class="mini-stat">
          <span>Countdown</span>
          <strong id="${group}-countdown-${boss.world}" class="accent-copy">Loading...</strong>
        </div>
      </div>

      <div class="stack-section">
        <p class="meta-label">All slots</p>
        <div class="chip-row">${slotBadges || '<span class="muted-copy">No data</span>'}</div>
      </div>

      ${boss.verificationNote ? `<div class="notice notice--warning boss-card__notice">${Site.escapeHtml(boss.verificationNote)}</div>` : ""}
    </article>
  `;
}

function bindFilter() {
  const input = document.getElementById("boss-filter-input");
  const clearButton = document.getElementById("boss-filter-clear");

  input.addEventListener("input", () => {
    bossState.filterValue = input.value.trim();
    applyFilter();
  });

  clearButton.addEventListener("click", () => {
    bossState.filterValue = "";
    input.value = "";
    applyFilter();
  });
}

function applyFilter() {
  const filter = bossState.filterValue;

  document.querySelectorAll(".boss-card").forEach((card) => {
    const world = card.getAttribute("data-world") || "";
    card.hidden = Boolean(filter) && world !== filter;
  });
}

function renderRules() {
  document.getElementById("summary-rules").textContent = `${bossState.specialRules.length} rules`;

  document.getElementById("rules-preview").innerHTML = `
    <div class="bullet-list">
      ${bossState.specialRules
        .slice(0, 2)
        .map((rule) => `<p>${Site.escapeHtml(rule.description)}</p>`)
        .join("")}
    </div>
  `;

  document.getElementById("rules-list").innerHTML = bossState.specialRules
    .map(
      (rule) => `
        <article class="card card--warning">
          <h3>${Site.escapeHtml(rule.title)}</h3>
          <p class="muted-copy">${Site.escapeHtml(rule.description)}</p>
          ${rule.details ? `<p class="muted-copy">${Site.escapeHtml(rule.details)}</p>` : ""}
        </article>
      `
    )
    .join("");
}

function updateBossUI() {
  const now = new Date();

  updateGroupCards("world", bossState.worldBosses, now);
  updateGroupCards("divine", bossState.divineBosses, now);

  const nextWorld = getGlobalNext(bossState.worldBosses, now);
  const nextDivine = getGlobalNext(bossState.divineBosses, now);

  document.getElementById("summary-world").textContent = nextWorld
    ? `${nextWorld.boss.name} - ${Site.formatCountdown(nextWorld.next.diffMs)}`
    : "No data";

  document.getElementById("summary-divine").textContent = nextDivine
    ? `${nextDivine.boss.name} - ${Site.formatCountdown(nextDivine.next.diffMs)}`
    : "No data";

  document.getElementById("summary-timezone").textContent = Site.getTimezoneLabel();
}

function updateGroupCards(group, bosses, now) {
  for (const boss of bosses) {
    const next = Site.getNextSpawnFromSlots(boss.slots, now);
    const nextEl = document.getElementById(`${group}-next-${boss.world}`);
    const countdownEl = document.getElementById(`${group}-countdown-${boss.world}`);

    if (!next) {
      nextEl.textContent = "No valid slots";
      countdownEl.textContent = "--";
      continue;
    }

    nextEl.textContent = Site.formatSpawnLabel(next.date);
    countdownEl.textContent = Site.formatCountdown(next.diffMs);
  }
}

function getGlobalNext(bosses, now) {
  let best = null;

  for (const boss of bosses) {
    const next = Site.getNextSpawnFromSlots(boss.slots, now);
    if (!next) continue;

    if (!best || next.diffMs < best.next.diffMs) {
      best = { boss, next };
    }
  }

  return best;
}

function handleError(error) {
  console.error(error);

  const fallback = '<div class="notice notice--error">Failed to load boss timer data.</div>';

  ["world-boss-list", "divine-boss-list", "rules-list", "rules-preview"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = fallback;
    }
  });
}
