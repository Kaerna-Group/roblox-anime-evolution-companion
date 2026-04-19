(function () {
  function getBasePath() {
    return window.location.pathname.includes("/pages/") ? "../" : "./";
  }

  function getCurrentYear() {
    return new Date().getFullYear();
  }

  function formatNumber(value) {
    const number = Number(value) || 0;
    return new Intl.NumberFormat("en-US").format(number);
  }

  function formatPercent(value) {
    const number = Number(value) || 0;
    return `${number}%`;
  }

  function formatMultiplier(value) {
    return `${value}x`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function loadJson(filename) {
    const url = `${getBasePath()}data/${filename}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.status}`);
    }

    return response.json();
  }

  async function loadJsonMany(...filenames) {
    return Promise.all(filenames.map((name) => loadJson(name)));
  }

  function parseHHMM(value) {
    if (!value || typeof value !== "string") return null;

    const [hourPart, minutePart] = value.split(":");
    const hours = Number(hourPart);
    const minutes = Number(minutePart);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    return { hours, minutes };
  }

  function getNextOccurrence(timeString, now = new Date()) {
    const parsed = parseHHMM(timeString);
    if (!parsed) return null;

    const target = new Date(now);
    target.setHours(parsed.hours, parsed.minutes, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return target;
  }

  function getNextSpawnFromSlots(slots, now = new Date()) {
    const validSlots = (slots || []).filter(Boolean);
    if (!validSlots.length) return null;

    let best = null;

    for (const slot of validSlots) {
      const date = getNextOccurrence(slot, now);
      if (!date) continue;

      const diffMs = date.getTime() - now.getTime();

      if (!best || diffMs < best.diffMs) {
        best = { slot, date, diffMs };
      }
    }

    return best;
  }

  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  function formatSpawnLabel(date) {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    if (isToday) return `Today - ${time}`;
    if (isTomorrow) return `Tomorrow - ${time}`;

    const day = date.toLocaleDateString([], {
      month: "short",
      day: "numeric"
    });

    return `${day} - ${time}`;
  }

  function getTimezoneLabel() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }

  function storageGet(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
      return fallback;
    }
  }

  function navLink(activePage, linkPage, href, label) {
    const activeClass = activePage === linkPage ? "nav-link is-active" : "nav-link";
    return `<a href="${href}" class="${activeClass}">${label}</a>`;
  }

  function renderHeader(activePage) {
    const header = document.getElementById("site-header");
    if (!header) return;

    const base = getBasePath();

    header.innerHTML = `
      <div class="site-header__inner page-shell">
        <a href="${base}index.html" class="brand">
          <span class="brand__mark">GH</span>
          <span class="brand__text">
            <strong>Game Helper</strong>
            <small>Anime Evolution companion</small>
          </span>
        </a>

        <div class="header-actions">
          <div class="site-nav-wrap">
            <nav class="site-nav" aria-label="Main navigation">
              ${navLink(activePage, "overview", `${base}pages/overview.html`, "Overview")}
              ${navLink(activePage, "boss-timers", `${base}pages/boss-timers.html`, "Boss Timers")}
              ${navLink(activePage, "raids", `${base}pages/raids.html`, "Raids")}
              ${navLink(activePage, "progression", `${base}pages/progression.html`, "Progression")}
              ${navLink(activePage, "reference", `${base}pages/reference.html`, "Reference")}
              ${navLink(activePage, "library", `${base}pages/library.html`, "Notes")}
              ${navLink(activePage, "weapons", `${base}pages/weapons.html`, "Weapons")}
              ${navLink(activePage, "ranks", `${base}pages/ranks.html`, "Ranks")}
            </nav>
          </div>
        </div>
      </div>
    `;
  }

  function renderFooter() {
    const footer = document.getElementById("site-footer");
    if (!footer) return;

    footer.innerHTML = `
      <div class="site-footer__inner page-shell">
        <div class="footer-copy">
          <p>Static HTML, handcrafted CSS, vanilla JS, and local JSON data.</p>
          <p>(c) ${getCurrentYear()} Game Helper</p>
        </div>
        <a href="${getBasePath()}index.html" class="button button--secondary footer-project-link">Project Info</a>
      </div>
    `;
  }

  function initNavScrollHint() {
    const wrap = document.querySelector(".site-nav-wrap");
    if (!wrap) return;

    function update() {
      const overflow = wrap.scrollWidth > wrap.clientWidth + 1;
      const atEnd = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 2;
      wrap.classList.toggle("is-scrollable", overflow && !atEnd);
    }

    wrap.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(update).observe(wrap);
    }
    update();
  }

  function initShell() {
    const activePage = document.body.dataset.page || "home";
    renderHeader(activePage);
    renderFooter();
    initNavScrollHint();
  }

  window.Site = {
    getBasePath,
    formatNumber,
    formatPercent,
    formatMultiplier,
    escapeHtml,
    loadJson,
    loadJsonMany,
    parseHHMM,
    getNextOccurrence,
    getNextSpawnFromSlots,
    formatCountdown,
    formatSpawnLabel,
    getTimezoneLabel,
    storageSet,
    storageGet
  };

  document.addEventListener("DOMContentLoaded", initShell);
})();
