document.addEventListener("DOMContentLoaded", () => {
  initWeaponsPage();
});

let weaponsData = null;
let filteredWeapons = [];

async function initWeaponsPage() {
  try {
    weaponsData = await Site.loadJson("weapons.json");
    filteredWeapons = [...(weaponsData.ssWeapons || [])];

    renderGuide();
    renderEasyWeapons();
    renderRanks();
    bindWeaponFilter();
    applyWeaponFilter("");
    renderSummary();
  } catch (error) {
    console.error("Failed to load weapons.json", error);
    renderWeaponsError();
  }
}

function renderGuide() {
  const container = document.getElementById("dps-guide");
  const items = (weaponsData && weaponsData.dpsGuide) || [];

  container.innerHTML = `
    <div class="bullet-list">
      ${items.map((item) => `<p>${Site.escapeHtml(item)}</p>`).join("")}
    </div>
  `;

  document.getElementById("summary-dps-rule").textContent = "3 swords - 5-star SS / 5-star SSS";
}

function renderEasyWeapons() {
  const container = document.getElementById("easy-weapons");
  const items = (weaponsData && weaponsData.easyWeapons) || [];

  container.innerHTML = items
    .map(
      (item) => `
        <article class="card lift-card">
          <p class="meta-label">${Site.escapeHtml(item.world)}</p>
          <h3>${Site.escapeHtml(item.weapon)}</h3>
          <p class="muted-copy">Monster: ${Site.escapeHtml(item.monster)}</p>
          <div class="meta-row">
            <span class="pill pill--success">Drop rate ${Site.formatPercent(item.dropRate)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderSummary() {
  const all = (weaponsData && weaponsData.ssWeapons) || [];
  if (!all.length) return;

  const highest = [...all].sort((a, b) => b.damage - a.damage)[0];
  const bestFarm = [...all].sort((a, b) => b.dropRate - a.dropRate)[0];

  document.getElementById("summary-weapon-count").textContent = `${all.length} items`;
  document.getElementById("summary-highest-damage").textContent = `${highest.weapon} - ${highest.damage}%`;
  document.getElementById("summary-best-farm").textContent = `${bestFarm.weapon} - ${Site.formatPercent(bestFarm.dropRate)}`;
}

function renderRanks() {
  const baseContainer = document.getElementById("base-ranks");
  const seriesContainer = document.getElementById("series-ranks");
  const baseRanks = (weaponsData && weaponsData.baseRanks) || [];
  const seriesRanks = (weaponsData && weaponsData.seriesRanks) || [];

  baseContainer.innerHTML = baseRanks
    .map((rank) => `<span class="rank-chip">${Site.escapeHtml(rank)}</span>`)
    .join("");

  seriesContainer.innerHTML = seriesRanks
    .map(
      (item) => `
        <article class="card rank-card">
          <p class="meta-label">${Site.escapeHtml(item.label)}</p>
          <h3>${Site.escapeHtml(item.range)}</h3>
          <p class="muted-copy">Progression band for this series.</p>
        </article>
      `
    )
    .join("");
}

function bindWeaponFilter() {
  const input = document.getElementById("weapon-filter-input");
  const clearButton = document.getElementById("weapon-filter-clear");

  input.addEventListener("input", () => {
    applyWeaponFilter(input.value);
  });

  clearButton.addEventListener("click", () => {
    input.value = "";
    applyWeaponFilter("");
  });
}

function applyWeaponFilter(query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const allWeapons = (weaponsData && weaponsData.ssWeapons) || [];

  filteredWeapons = allWeapons.filter((item) => {
    if (!normalizedQuery) return true;

    const haystack = [item.world, item.weapon, item.monster].join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  document.getElementById("visible-weapon-count").textContent = String(filteredWeapons.length);
  renderWeaponsTable();
}

function renderWeaponsTable() {
  const tbody = document.getElementById("weapons-table-body");

  if (!filteredWeapons.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty">No weapons match this filter.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredWeapons
    .map(
      (item) => `
        <tr>
          <td>${Site.escapeHtml(item.world)}</td>
          <td>${Site.escapeHtml(item.weapon)}</td>
          <td>${Site.formatPercent(item.damage)}</td>
          <td>${Site.formatPercent(item.dropRate)}</td>
          <td>${Site.escapeHtml(item.monster)}</td>
        </tr>
      `
    )
    .join("");
}

function renderWeaponsError() {
  const fallback = `
    <div class="notice notice--error">
      Failed to load weapons data. Please try again later.
    </div>
  `;

  document.getElementById("dps-guide").innerHTML = fallback;
  document.getElementById("easy-weapons").innerHTML = fallback;
  document.getElementById("base-ranks").innerHTML = fallback;
  document.getElementById("series-ranks").innerHTML = fallback;
  document.getElementById("weapons-table-body").innerHTML = `
    <tr>
      <td colspan="5" class="table-empty table-empty--error">Failed to load weapons data.</td>
    </tr>
  `;
}
