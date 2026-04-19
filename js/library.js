document.addEventListener("DOMContentLoaded", () => {
  initLibrary().catch(handleError);
});

async function initLibrary() {
  const data = await Site.loadJson("library.json");

  renderWeekendBoosts(data.weekendBoosts || []);
  renderTips(data.earlyProgressionTips || []);
  renderGamePassOrder(data.gamePassOrder || {});
  renderENotation(data.eNotation || {});
}

function renderWeekendBoosts(boosts) {
  document.getElementById("weekend-boosts").innerHTML = boosts
    .map(
      (item) => `
        <div class="mini-stat">
          <span>${Site.escapeHtml(item.name || "")}</span>
          <strong>${Site.escapeHtml(item.window || "No window")}</strong>
          <span>Source: ${Site.escapeHtml(item.sourceDate || "Unknown")}</span>
        </div>
      `
    )
    .join("");
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

function renderGamePassOrder(gamePassOrder) {
  const items = Array.isArray(gamePassOrder.items) ? gamePassOrder.items : [];
  const notes = Array.isArray(gamePassOrder.notes) ? gamePassOrder.notes : [];

  document.getElementById("game-pass-meta").innerHTML = `
    <strong>${Site.escapeHtml(gamePassOrder.title || "Game Pass Order")}</strong>
    ${gamePassOrder.sourceDate ? ` Source date: ${Site.escapeHtml(gamePassOrder.sourceDate)}.` : ""}
  `;

  document.getElementById("game-pass-order").innerHTML = items
    .map(
      (item, index) => `
        <article class="card">
          <p class="meta-label">Priority ${index + 1}</p>
          <h3>${Site.escapeHtml(item)}</h3>
        </article>
      `
    )
    .join("");

  document.getElementById("game-pass-notes").innerHTML = notes
    .map(
      (item) => `
        <article class="card">
          <p class="muted-copy">${Site.escapeHtml(item)}</p>
        </article>
      `
    )
    .join("");
}

function renderENotation(eNotation) {
  const notes = Array.isArray(eNotation.notes) ? eNotation.notes : [];
  const entries = Array.isArray(eNotation.entries) ? eNotation.entries : [];

  document.getElementById("e-notation-notes").innerHTML = notes
    .map((item) => `<p>${Site.escapeHtml(item)}</p>`)
    .join("");

  document.getElementById("e-notation-body").innerHTML = entries
    .map(
      (entry) => `
        <tr>
          <td>${Site.escapeHtml(entry.notation || "")}</td>
          <td>${Site.escapeHtml(entry.value || "")}</td>
          <td>${Site.escapeHtml(entry.abbreviation || "")}</td>
          <td>${Site.escapeHtml(entry.name || "--")}</td>
        </tr>
      `
    )
    .join("");
}

function handleError(error) {
  console.error(error);

  const fallback = '<div class="notice notice--error">Failed to load notes data.</div>';
  document.getElementById("weekend-boosts").innerHTML = fallback;
  document.getElementById("tips-list").innerHTML = fallback;
  document.getElementById("game-pass-order").innerHTML = fallback;
  document.getElementById("game-pass-notes").innerHTML = fallback;
  document.getElementById("game-pass-meta").textContent = "Failed to load data.";
  document.getElementById("e-notation-notes").innerHTML = fallback;
  document.getElementById("e-notation-body").innerHTML = '<tr><td colspan="4" class="table-empty table-empty--error">Failed to load data.</td></tr>';
}
