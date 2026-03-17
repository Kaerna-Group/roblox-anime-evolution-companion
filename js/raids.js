document.addEventListener("DOMContentLoaded", () => {
  initRaids().catch(handleError);
});

const RAIDS_STORAGE_KEY = "raids.customOrder";

const raidsState = {
  raids: [],
  draggedRaidId: null
};

async function initRaids() {
  const data = await Site.loadJson("raids.json");
  const raids = Array.isArray(data.raids) ? data.raids : [];

  raidsState.raids = sortRaidsBySavedOrder(raids);

  renderRaidCards();
  bindRaidDnD();
  updateRaidsUI();
  window.setInterval(updateRaidsUI, 1000);
}

function sortRaidsBySavedOrder(raids) {
  const savedOrder = Site.storageGet(RAIDS_STORAGE_KEY, []);
  if (!Array.isArray(savedOrder) || !savedOrder.length) {
    return [...raids];
  }

  const orderMap = new Map(savedOrder.map((id, index) => [id, index]));

  return [...raids].sort((left, right) => {
    const leftOrder = orderMap.has(left.id) ? orderMap.get(left.id) : Number.MAX_SAFE_INTEGER;
    const rightOrder = orderMap.has(right.id) ? orderMap.get(right.id) : Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

function persistRaidOrder() {
  Site.storageSet(
    RAIDS_STORAGE_KEY,
    raidsState.raids.map((raid) => raid.id)
  );
}

function getAccentClass(accent) {
  return `accent-${accent || "red"}`;
}

function getBadgeClass(accent) {
  return `pill pill--${accent || "red"}`;
}

function getScheduleBadge(raid) {
  if (raid.scheduleType === "hourly") {
    return `:${String(raid.minuteOffset).padStart(2, "0")}`;
  }

  return "Fixed";
}

function getNextRaidOccurrence(raid, now = new Date()) {
  if (raid.scheduleType === "hourly") {
    const target = new Date(now);
    target.setMinutes(Number(raid.minuteOffset) || 0, 0, 0);

    if (target <= now) {
      target.setHours(target.getHours() + 1);
    }

    return target;
  }

  const next = Site.getNextSpawnFromSlots(raid.slots, now);
  return next ? next.date : null;
}

function getUpcomingRaidOccurrences(raid, count = 6, now = new Date()) {
  if (raid.scheduleType === "hourly") {
    const first = getNextRaidOccurrence(raid, now);
    const result = [];

    for (let index = 0; index < count; index += 1) {
      const item = new Date(first);
      item.setHours(first.getHours() + index);
      result.push(item);
    }

    return result;
  }

  const occurrences = [];
  let cursor = new Date(now);

  for (let index = 0; index < count; index += 1) {
    const next = Site.getNextSpawnFromSlots(raid.slots, cursor);
    if (!next) break;

    occurrences.push(next.date);
    cursor = new Date(next.date.getTime() + 60 * 1000);
  }

  return occurrences;
}

function renderRaidCards() {
  const container = document.getElementById("raid-grid");

  container.innerHTML = raidsState.raids
    .map((raid) => {
      return `
        <article class="card lift-card raid-card" data-raid-id="${raid.id}" draggable="true">
          <div class="raid-card__main">
            <div class="raid-card__headline">
              <div class="raid-card__title">
                <div class="drag-handle" aria-hidden="true">::</div>
                <div>
                  <p class="meta-label">Raid</p>
                  <h3>${Site.escapeHtml(raid.name)}</h3>
                </div>
              </div>
              <span class="${getBadgeClass(raid.accent)}">${Site.escapeHtml(getScheduleBadge(raid))}</span>
            </div>

            <p class="muted-copy">${Site.escapeHtml(raid.description || "")}</p>
          </div>

          <div class="raid-card__stats">
            <div class="mini-stat raid-stat">
              <span>Next Spawn</span>
              <strong id="raid-next-${raid.id}">Loading...</strong>
            </div>
            <div class="mini-stat raid-stat">
              <span>Countdown</span>
              <strong id="raid-countdown-${raid.id}" class="${getAccentClass(raid.accent)}">Loading...</strong>
            </div>
            <div class="mini-stat raid-stat raid-stat--wide">
              <span>Upcoming</span>
              <div id="raid-upcoming-${raid.id}" class="chip-row">Loading...</div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function bindRaidDnD() {
  const container = document.getElementById("raid-grid");

  container.addEventListener("dragstart", (event) => {
    const card = event.target.closest(".raid-card");
    if (!card) return;

    raidsState.draggedRaidId = card.dataset.raidId;
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", raidsState.draggedRaidId);
  });

  container.addEventListener("dragend", (event) => {
    const card = event.target.closest(".raid-card");
    if (card) {
      card.classList.remove("is-dragging");
    }

    raidsState.draggedRaidId = null;
    document.querySelectorAll(".raid-card").forEach((item) => item.classList.remove("drop-target"));
  });

  container.addEventListener("dragover", (event) => {
    event.preventDefault();

    const targetCard = event.target.closest(".raid-card");
    const draggedId = raidsState.draggedRaidId;
    if (!targetCard || !draggedId || targetCard.dataset.raidId === draggedId) return;

    document.querySelectorAll(".raid-card").forEach((item) => item.classList.remove("drop-target"));
    targetCard.classList.add("drop-target");
  });

  container.addEventListener("drop", (event) => {
    event.preventDefault();

    const targetCard = event.target.closest(".raid-card");
    const draggedId = raidsState.draggedRaidId;
    if (!targetCard || !draggedId) return;

    const targetId = targetCard.dataset.raidId;
    if (targetId === draggedId) return;

    const draggedIndex = raidsState.raids.findIndex((raid) => raid.id === draggedId);
    const targetIndex = raidsState.raids.findIndex((raid) => raid.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedRaid] = raidsState.raids.splice(draggedIndex, 1);
    raidsState.raids.splice(targetIndex, 0, draggedRaid);

    persistRaidOrder();
    renderRaidCards();
    updateRaidsUI();
  });
}

function updateRaidsUI() {
  const now = new Date();
  let globalBest = null;

  for (const raid of raidsState.raids) {
    const next = getNextRaidOccurrence(raid, now);
    if (!next) continue;

    const diffMs = next.getTime() - now.getTime();
    const upcoming = getUpcomingRaidOccurrences(raid, 6, now);

    document.getElementById(`raid-next-${raid.id}`).textContent = Site.formatSpawnLabel(next);
    document.getElementById(`raid-countdown-${raid.id}`).textContent = Site.formatCountdown(diffMs);
    document.getElementById(`raid-upcoming-${raid.id}`).innerHTML = upcoming
      .map((date) => {
        const label = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });

        return `<span class="pill">${label}</span>`;
      })
      .join("");

    if (!globalBest || diffMs < globalBest.diffMs) {
      globalBest = { raid, diffMs, next };
    }
  }

  document.getElementById("summary-next-raid").textContent = globalBest ? globalBest.raid.name : "No data";
  document.getElementById("summary-next-countdown").textContent = globalBest ? Site.formatCountdown(globalBest.diffMs) : "No data";
  document.getElementById("summary-cycle").textContent = `${raidsState.raids.length} tracked raids`;
  document.getElementById("summary-timezone").textContent = Site.getTimezoneLabel();
}

function handleError(error) {
  console.error(error);

  const container = document.getElementById("raid-grid");
  if (container) {
    container.innerHTML = '<div class="notice notice--error">Failed to load raid data.</div>';
  }
}
