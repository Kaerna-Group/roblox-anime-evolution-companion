document.addEventListener("DOMContentLoaded", () => {
  initReference().catch(handleError);
});

async function initReference() {
  const data = await Site.loadJson("progression-reference.json");

  renderPowerSources(data.powerSources || []);
  renderUpgradeRates(data.upgradeRates || []);
  renderTotals(data.totals || {});
  renderWeaponReforge(data.weaponReforge || {});
  renderTips(data.earlyProgressionTips || []);
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

function renderWeaponReforge(weaponReforge) {
  const levels = Array.isArray(weaponReforge.levels) ? weaponReforge.levels : [];

  document.getElementById("reforge-body").innerHTML = levels
    .map((item) => `
      <tr>
        <td>${item.stars}-star</td>
        <td>${Site.formatNumber(item.amountNeeded || 0)}</td>
        <td>${Site.escapeHtml(weaponReforge.resourceName || "Resource")}</td>
      </tr>
    `)
    .join("");

  document.getElementById("reforge-total").innerHTML = `
    <strong>Total needed:</strong> ${Site.formatNumber(weaponReforge.totalNeeded || 0)}
    ${Site.escapeHtml(weaponReforge.resourceName || "items")}
  `;
}

function renderTips(tips) {
  document.getElementById("tips-list").innerHTML = tips
    .map((tip, index) => `
      <article class="card">
        <div class="tip-item">
          <div class="tip-index">${index + 1}</div>
          <p class="muted-copy">${Site.escapeHtml(tip)}</p>
        </div>
      </article>
    `)
    .join("");
}

function renderSummaryNotes(data) {
  const powerCount = Array.isArray(data.powerSources) ? data.powerSources.length : 0;
  const rateCount = Array.isArray(data.upgradeRates) ? data.upgradeRates.length : 0;
  const reforgeCount = Array.isArray(data.weaponReforge?.levels) ? data.weaponReforge.levels.length : 0;

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
      <span>Weapon reforge steps</span>
      <strong>${reforgeCount}</strong>
    </div>
  `;
}

function handleError(error) {
  console.error(error);

  const fallback = '<div class="notice notice--error">Failed to load reference data.</div>';

  document.getElementById("power-sources").innerHTML = fallback;
  document.getElementById("tips-list").innerHTML = fallback;
  document.getElementById("summary-notes").innerHTML = fallback;
  document.getElementById("totals-boxes").innerHTML = fallback;
  document.getElementById("reforge-total").innerHTML = "Failed to load data.";
  document.getElementById("upgrade-rates-body").innerHTML = '<tr><td colspan="3" class="table-empty table-empty--error">Failed to load data.</td></tr>';
  document.getElementById("reforge-body").innerHTML = '<tr><td colspan="3" class="table-empty table-empty--error">Failed to load data.</td></tr>';
}
