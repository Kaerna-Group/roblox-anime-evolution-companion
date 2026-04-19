document.addEventListener("DOMContentLoaded", () => {
  initReference().catch(handleError);
});

async function initReference() {
  const [progression, meta] = await Site.loadJsonMany("progression.json", "meta.json");
  const data = { ...progression, ...meta };

  renderPowerSources(data.powerSources || []);
  renderUpgradeRates(data.upgradeRates || []);
  renderTotals(data.totals || {});
  renderWorldBossCycle(data.worldBossCycle || {});
  renderCommunityResources(data.communityResources || {});
  renderEventHistory(data.eventHistory || []);
  renderSummaryNotes(data);
}

function renderPowerSources(powerSources) {
  document.getElementById("power-sources").innerHTML = powerSources
    .map((item) => {
      const maxBits = [];

      if (typeof item.maxMultiplier === "number") {
        maxBits.push(`Max: ${Site.formatMultiplier(item.maxMultiplier)}`);
      }
      if (typeof item.freeEggMaxMultiplier === "number") {
        maxBits.push(`Free egg max: ${Site.formatMultiplier(item.freeEggMaxMultiplier)}`);
      }
      if (typeof item.totalMaxMultiplier === "number") {
        maxBits.push(`Total max: ${Site.formatMultiplier(item.totalMaxMultiplier)}`);
      }

      return `
        <article class="card lift-card">
          <p class="meta-label">${Site.escapeHtml(item.subtitle || "")}</p>
          <h3>${Site.escapeHtml(item.title || "")}</h3>
          <p class="muted-copy">${Site.escapeHtml(item.effect || "")}</p>
          <div class="chip-row">
            ${maxBits.map((text) => `<span class="pill pill--success">${Site.escapeHtml(text)}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderUpgradeRates(upgradeRates) {
  document.getElementById("upgrade-rates-body").innerHTML = upgradeRates
    .map((item) => {
      const appliesTo = Array.isArray(item.appliesTo) ? item.appliesTo.join(", ") : "--";

      return `
        <tr>
          <td>${Site.escapeHtml(item.label || "")}</td>
          <td>${Site.formatMultiplier(item.multiplier || 0)}</td>
          <td>${Site.escapeHtml(appliesTo)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderTotals(totals) {
  document.getElementById("totals-boxes").innerHTML = `
    <div class="mini-stat">
      <span>General Total</span>
      <strong>${Site.formatMultiplier(totals.general || 0)}</strong>
    </div>
    <div class="mini-stat">
      <span>Swords Only</span>
      <strong>${Site.formatMultiplier(totals.swordsOnly || 0)}</strong>
    </div>
  `;
}

function renderSummaryNotes(data) {
  const powerCount = Array.isArray(data.powerSources) ? data.powerSources.length : 0;
  const rateCount = Array.isArray(data.upgradeRates) ? data.upgradeRates.length : 0;
  const linkCount = Array.isArray(data.communityResources?.links) ? data.communityResources.links.length : 0;

  document.getElementById("summary-notes").innerHTML = `
    <div class="mini-stat">
      <span>Power sources tracked</span>
      <strong>${powerCount}</strong>
    </div>
    <div class="mini-stat">
      <span>Upgrade rate entries</span>
      <strong>${rateCount}</strong>
    </div>
    <div class="mini-stat">
      <span>Community links saved</span>
      <strong>${linkCount}</strong>
    </div>
    <div class="mini-stat">
      <span>Event notes stored</span>
      <strong>${Array.isArray(data.eventHistory) ? data.eventHistory.length : 0}</strong>
    </div>
  `;
}

function renderWorldBossCycle(cycle) {
  document.getElementById("world-boss-cycle").innerHTML = `
    <div class="mini-stat">
      <span>Interval</span>
      <strong>${Site.escapeHtml(cycle.interval || "Unknown")}</strong>
      <span>Source: ${Site.escapeHtml(cycle.sourceDate || "Unknown")}</span>
    </div>
    <div class="mini-stat">
      <span>Usage</span>
      <strong>Quick sanity-check</strong>
      <span>Use the Boss Timers page for the full per-world schedule.</span>
    </div>
  `;
}

function renderCommunityResources(resources) {
  const links = Array.isArray(resources.links) ? resources.links : [];
  const extras = Array.isArray(resources.extras) ? resources.extras : [];

  document.getElementById("community-links").innerHTML = [
    ...links.map(
      (link) => `
        <a class="card lift-card" href="${Site.escapeHtml(link.url || "#")}" target="_blank" rel="noreferrer">
          <p class="meta-label">Link</p>
          <h3>${Site.escapeHtml(link.label || "")}</h3>
          <p class="muted-copy">${Site.escapeHtml(link.url || "")}</p>
        </a>
      `
    ),
    ...extras.map(
      (item) => `
        <article class="card">
          <p class="meta-label">Note</p>
          <p class="muted-copy">${Site.escapeHtml(item)}</p>
        </article>
      `
    )
  ].join("");
}

function renderEventHistory(events) {
  document.getElementById("event-history").innerHTML = events
    .map(
      (event) => `
        <article class="card">
          <p class="meta-label">${Site.escapeHtml(event.sourceDate || "Unknown date")}</p>
          <h3>${Site.escapeHtml(event.name || "")}</h3>
          <p class="muted-copy">${Site.escapeHtml(event.status || "")}</p>
          <p class="muted-copy">${Site.escapeHtml(event.details || "")}</p>
        </article>
      `
    )
    .join("");
}

function handleError(error) {
  console.error(error);

  const fallback = '<div class="notice notice--error">Failed to load reference data.</div>';

  document.getElementById("power-sources").innerHTML = fallback;
  document.getElementById("summary-notes").innerHTML = fallback;
  document.getElementById("totals-boxes").innerHTML = fallback;
  document.getElementById("world-boss-cycle").innerHTML = fallback;
  document.getElementById("community-links").innerHTML = fallback;
  document.getElementById("event-history").innerHTML = fallback;
  document.getElementById("upgrade-rates-body").innerHTML = '<tr><td colspan="3" class="table-empty table-empty--error">Failed to load data.</td></tr>';
}
