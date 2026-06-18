(function () {
  const banner = document.querySelector(".tab-banner");
  const indicator = banner.querySelector(".tab-banner__indicator");
  const tabs = Array.from(banner.querySelectorAll(".tab-chip"));
  const outlet = document.getElementById("view-outlet");

  const viewCache = new Map();
  let moduleObserver = null;

  function refreshModuleAnchors() {
    if (moduleObserver) {
      moduleObserver.disconnect();
      moduleObserver = null;
    }

    const sections = Array.from(outlet.querySelectorAll(".module-section[id]"));
    const anchors = Array.from(outlet.querySelectorAll(".module-anchor[href^='#']"));
    if (!sections.length || !anchors.length) return;

    const anchorByTarget = new Map(
      anchors.map((a) => [a.getAttribute("href").slice(1), a])
    );

    moduleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const anchor = anchorByTarget.get(entry.target.id);
          if (anchor) anchor.classList.toggle("is-current", entry.isIntersecting);
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((section) => moduleObserver.observe(section));
  }

  function refreshResearchFilters() {
    const filterBar = outlet.querySelector(".research-filters");
    const cards = Array.from(outlet.querySelectorAll(".research-card"));
    if (!filterBar || !cards.length) return;

    const buttons = Array.from(filterBar.querySelectorAll(".filter-chip"));

    function applyFilter(value) {
      cards.forEach((card) => {
        const tags = (card.dataset.tags || "").split(" ");
        card.classList.toggle("is-hidden", value !== "all" && !tags.includes(value));
      });
    }

    function setActiveFilter(value) {
      buttons.forEach((b) => {
        const isActive = b.dataset.filter === value;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-selected", String(isActive));
      });
      applyFilter(value);
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => setActiveFilter(btn.dataset.filter));
    });

    outlet.querySelectorAll(".phase-chip[href^='#metodo-']").forEach((link) => {
      link.addEventListener("click", () => setActiveFilter("all"));
    });
  }

  function moveIndicatorTo(tab) {
    const tabRect = tab.getBoundingClientRect();
    const bannerRect = banner.getBoundingClientRect();
    indicator.style.width = `${tabRect.width}px`;
    indicator.style.transform = `translateX(${tabRect.left - bannerRect.left - 5.6}px)`;
  }

  async function loadView(tab) {
    const src = tab.dataset.src;

    outlet.classList.add("is-leaving");
    outlet.classList.remove("is-visible");

    await wait(200);

    let html = viewCache.get(src);
    if (!html) {
      try {
        const res = await fetch(src);
        html = res.ok
          ? await res.text()
          : placeholderMarkup("triangle-exclamation", "Vista no disponible", "No se pudo cargar este parcial.");
      } catch (err) {
        html = placeholderMarkup("triangle-exclamation", "Vista no disponible", "Revisa la consola para más detalles.");
      }
      viewCache.set(src, html);
    }

    outlet.innerHTML = html;
    refreshModuleAnchors();
    refreshResearchFilters();
    outlet.classList.remove("is-leaving");
    outlet.classList.add("is-entering");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        outlet.classList.remove("is-entering");
        outlet.classList.add("is-visible");
      });
    });
  }

  function placeholderMarkup(icon, title, text) {
    return `
      <div class="view-placeholder">
        <i class="fa-solid fa-${icon}"></i>
        <h2>${title}</h2>
        <p>${text}</p>
      </div>
    `;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function activateTab(tab) {
    if (tab.disabled || tab.classList.contains("is-active")) return;

    tabs.forEach((t) => {
      t.classList.remove("is-active");
      t.setAttribute("aria-selected", "false");
    });

    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    moveIndicatorTo(tab);
    loadView(tab);
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab));
  });

  window.addEventListener("resize", () => {
    const active = banner.querySelector(".tab-chip.is-active");
    if (active) moveIndicatorTo(active);
  });

  const initialTab = banner.querySelector(".tab-chip.is-active");
  if (initialTab) {
    moveIndicatorTo(initialTab);
    loadView(initialTab);
  }
})();
