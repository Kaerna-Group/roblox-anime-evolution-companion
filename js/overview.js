document.addEventListener("DOMContentLoaded", () => {
  initOverview().catch(handleOverviewError);
});

async function initOverview() {
  const [bossData, raidData] = await Promise.all([
    Site.loadJson("boss-timers.json"),
    Site.loadJson("raids.json")
  ]);

  const now = new Date();
  const raids = Array.isArray(raidData.raids) ? raidData.raids : [];
  const worldBosses = Array.isArray(bossData.worldBosses) ? bossData.worldBosses : [];
  const divineBosses = Array.isArray(bossData.divineBosses) ? bossData.divineBosses : [];

  renderOverviewSummary(raids, worldBosses, divineBosses, now);
  renderUpcomingEvents(raids, worldBosses, divineBosses, now);

  window.setInterval(() => {
    const tickNow = new Date();
    renderOverviewSummary(raids, worldBosses, divineBosses, tickNow);
    renderUpcomingEvents(raids, worldBosses, divineBosses, tickNow);
  }, 1000);
}

function getNextRaidOccurrenceOverview(raid, now = new Date()) {
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

function getNearestBoss(items, now) {
  let best = null;

  for (const item of items) {
    const next = Site.getNextSpawnFromSlots(item.slots, now);
    if (!next) continue;

    if (!best || next.diffMs < best.diffMs) {
      best = {
        name: item.name,
        world: item.world,
        date: next.date,
        diffMs: next.diffMs
      };
    }
  }

  return best;
}

function getNearestRaid(raids, now) {
  let best = null;

  for (const raid of raids) {
    const nextDate = getNextRaidOccurrenceOverview(raid, now);
    if (!nextDate) continue;

    const diffMs = nextDate.getTime() - now.getTime();
    if (!best || diffMs < best.diffMs) {
      best = { name: raid.name, date: nextDate, diffMs };
    }
  }

  return best;
}

function renderOverviewSummary(raids, worldBosses, divineBosses, now) {
  const nearestRaid = getNearestRaid(raids, now);
  const nearestWorldBoss = getNearestBoss(worldBosses, now);
  const nearestDivine = getNearestBoss(divineBosses, now);

  renderHighlight("overview-raid", nearestRaid, "Raid");
  renderHighlight("overview-world-boss", nearestWorldBoss, "World Boss");
  renderHighlight("overview-divine", nearestDivine, "Divine Angel");
  document.getElementById("overview-timezone").textContent = Site.getTimezoneLabel();
}

function renderHighlight(elementId, item, fallbackLabel) {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (!item) {
    element.innerHTML = `<span class="muted-copy">${fallbackLabel} not available.</span>`;
    return;
  }

  const worldLine = typeof item.world === "number" ? `<p class="meta-label">World ${item.world}</p>` : "";

  element.innerHTML = `
    ${worldLine}
    <h3>${Site.escapeHtml(item.name)}</h3>
    <div class="mini-stats">
      <div class="mini-stat">
        <span>Next Spawn</span>
        <strong>${Site.formatSpawnLabel(item.date)}</strong>
      </div>
      <div class="mini-stat">
        <span>Countdown</span>
        <strong class="accent-copy">${Site.formatCountdown(item.diffMs)}</strong>
      </div>
    </div>
  `;
}

function renderUpcomingEvents(raids, worldBosses, divineBosses, now) {
  const allEvents = [];

  for (const raid of raids) {
    const date = getNextRaidOccurrenceOverview(raid, now);
    if (!date) continue;

    allEvents.push({
      type: "Raid",
      name: raid.name,
      world: null,
      date,
      diffMs: date.getTime() - now.getTime()
    });
  }

  for (const boss of worldBosses) {
    const next = Site.getNextSpawnFromSlots(boss.slots, now);
    if (!next) continue;

    allEvents.push({
      type: "World Boss",
      name: boss.name,
      world: boss.world,
      date: next.date,
      diffMs: next.diffMs
    });
  }

  for (const divine of divineBosses) {
    const next = Site.getNextSpawnFromSlots(divine.slots, now);
    if (!next) continue;

    allEvents.push({
      type: "Divine Angel",
      name: divine.name,
      world: divine.world,
      date: next.date,
      diffMs: next.diffMs
    });
  }

  const closest = allEvents
    .sort((left, right) => left.diffMs - right.diffMs)
    .slice(0, 10);

  document.getElementById("overview-upcoming-list").innerHTML = closest
    .map((event) => {
      const worldInfo = event.world ? `World ${event.world}` : event.type;

      return `
        <article class="card overview-event">
          <div>
            <p class="meta-label">${Site.escapeHtml(worldInfo)}</p>
            <h3>${Site.escapeHtml(event.name)}</h3>
            <p class="muted-copy">${Site.escapeHtml(event.type)}</p>
          </div>
          <div class="overview-event__stats">
            <div class="mini-stat">
              <span>Next Spawn</span>
              <strong>${Site.formatSpawnLabel(event.date)}</strong>
            </div>
            <div class="mini-stat">
              <span>Countdown</span>
              <strong class="accent-copy">${Site.formatCountdown(event.diffMs)}</strong>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function handleOverviewError(error) {
  console.error(error);

  const ids = [
    "overview-raid",
    "overview-world-boss",
    "overview-divine",
    "overview-upcoming-list"
  ];

  ids.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = '<div class="notice notice--error">Failed to load overview data.</div>';
    }
  });
}
