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
  window.addEventListener("resize", scheduleTruncationRefresh);
}

function scheduleTruncationRefresh() {
  requestAnimationFrame(() => refreshTruncationTooltips());
}

function refreshTruncationTooltips() {
  document.querySelectorAll(".site-ellipsis-tooltip").forEach((wrapper) => {
    const inner = wrapper.querySelector(".site-ellipsis-tooltip__text");
    if (!inner) return;
    const full = inner.textContent.trim();
    wrapper.setAttribute("data-tooltip", full);
    const truncated = inner.scrollWidth > inner.clientWidth + 1;
    wrapper.classList.toggle("is-truncated", truncated);
  });
}

function renderBossSections() {
  document.getElementById("world-boss-list").innerHTML = bossState.worldBosses
    .map((boss) => buildBossCard(boss, "world"))
    .join("");

  document.getElementById("divine-boss-list").innerHTML = bossState.divineBosses
    .map((boss) => buildBossCard(boss, "divine"))
    .join("");

  applyFilter();
  scheduleTruncationRefresh();
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
          <h3 class="boss-card__name">
            <span class="site-ellipsis-tooltip">
              <span class="site-ellipsis-tooltip__text">${Site.escapeHtml(boss.name)}</span>
            </span>
          </h3>
          <p class="muted-copy boss-card__world">World ${Site.escapeHtml(boss.world)}</p>
        </div>
        ${boss.needsVerification ? '<span class="pill pill--warning boss-card__badge">Verify timing</span>' : ""}
      </div>

      <div class="mini-stats">
        <div class="mini-stat">
          <span>Next Spawn</span>
          <strong class="boss-card__stat-strong">
            <span class="site-ellipsis-tooltip">
              <span id="${group}-next-${boss.world}" class="site-ellipsis-tooltip__text">Loading...</span>
            </span>
          </strong>
        </div>
        <div class="mini-stat">
          <span>Countdown</span>
          <strong class="boss-card__stat-strong">
            <span class="site-ellipsis-tooltip">
              <span id="${group}-countdown-${boss.world}" class="site-ellipsis-tooltip__text accent-copy">Loading...</span>
            </span>
          </strong>
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

  setSummaryLine("summary-world", nextWorld
    ? `${nextWorld.boss.name} - ${Site.formatCountdown(nextWorld.next.diffMs)}`
    : "No data");

  setSummaryLine("summary-divine", nextDivine
    ? `${nextDivine.boss.name} - ${Site.formatCountdown(nextDivine.next.diffMs)}`
    : "No data");

  document.getElementById("summary-timezone").textContent = Site.getTimezoneLabel();
  scheduleTruncationRefresh();
}

function setSummaryLine(elementId, text) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  const wrap = el.closest(".site-ellipsis-tooltip");
  if (wrap) {
    wrap.setAttribute("data-tooltip", text);
  }
}

function updateGroupCards(group, bosses, now) {
  for (const boss of bosses) {
    const next = Site.getNextSpawnFromSlots(boss.slots, now);
    const nextEl = document.getElementById(`${group}-next-${boss.world}`);
    const countdownEl = document.getElementById(`${group}-countdown-${boss.world}`);

    if (!nextEl || !countdownEl) continue;

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
