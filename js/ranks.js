document.addEventListener("DOMContentLoaded", () => {
  initRanks().catch(handleError);
});

async function initRanks() {
  const data = await Site.loadJson("weapons.json");
  const baseRanks = Array.isArray(data.baseRanks) ? data.baseRanks : [];
  const seriesRanks = Array.isArray(data.seriesRanks) ? data.seriesRanks : [];
  const rankNotes = Array.isArray(data.rankNotes) ? data.rankNotes : [];

  renderSummary(baseRanks, seriesRanks);
  renderNotes(rankNotes);
  renderBaseRanks(baseRanks);
  renderSeriesRanks(seriesRanks);
}

function renderSummary(baseRanks, seriesRanks) {
  document.getElementById("rank-summary-base").textContent = String(baseRanks.length);
  document.getElementById("rank-summary-series").textContent = String(seriesRanks.length);
  document.getElementById("rank-summary-first").textContent = baseRanks[0] || "--";
  document.getElementById("rank-summary-last").textContent = baseRanks[baseRanks.length - 1] || "--";
}

function renderNotes(rankNotes) {
  document.getElementById("rank-notes").innerHTML = rankNotes
    .map(
      (note) => `
        <article class="card">
          <p class="muted-copy">${Site.escapeHtml(note)}</p>
        </article>
      `
    )
    .join("");
}

function renderBaseRanks(baseRanks) {
  document.getElementById("base-ranks").innerHTML = baseRanks
    .map((rank) => `<span class="rank-chip">${Site.escapeHtml(rank)}</span>`)
    .join("");
}

function renderSeriesRanks(seriesRanks) {
  document.getElementById("series-ranks").innerHTML = seriesRanks
    .map(
      (item) => `
        <article class="card rank-card">
          <p class="meta-label">${Site.escapeHtml(item.label)}</p>
          <h3>${Site.escapeHtml(item.range)}</h3>
          <p class="muted-copy">Stored series band in the current helper dataset.</p>
        </article>
      `
    )
    .join("");
}

function handleError(error) {
  console.error(error);

  const fallback = '<div class="notice notice--error">Failed to load rank data.</div>';
  document.getElementById("rank-notes").innerHTML = fallback;
  document.getElementById("base-ranks").innerHTML = fallback;
  document.getElementById("series-ranks").innerHTML = fallback;
  document.getElementById("rank-summary-base").textContent = "Error";
  document.getElementById("rank-summary-series").textContent = "Error";
  document.getElementById("rank-summary-first").textContent = "Error";
  document.getElementById("rank-summary-last").textContent = "Error";
}
