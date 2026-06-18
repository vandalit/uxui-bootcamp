(function () {
  const banner = document.querySelector(".tab-banner");
  const indicator = banner.querySelector(".tab-banner__indicator");
  const tabs = Array.from(banner.querySelectorAll(".tab-chip"));
  const outlet = document.getElementById("view-outlet");

  const viewCache = new Map();
  let moduleObserver = null;
  let modalRoot = null;

  function ensureModal() {
    if (modalRoot) return modalRoot;

    modalRoot = document.createElement("div");
    modalRoot.className = "app-modal";
    modalRoot.innerHTML = `
      <div class="app-modal__backdrop"></div>
      <div class="app-modal__panel" role="dialog" aria-modal="true">
        <button class="app-modal__close" type="button" aria-label="Cerrar">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <h4 class="app-modal__title"></h4>
        <div class="app-modal__body"></div>
      </div>
    `;
    document.body.appendChild(modalRoot);

    const closeModal = () => modalRoot.classList.remove("is-open");
    modalRoot.querySelector(".app-modal__backdrop").addEventListener("click", closeModal);
    modalRoot.querySelector(".app-modal__close").addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    return modalRoot;
  }

  function openModal(title, bodyHTML) {
    const modal = ensureModal();
    modal.querySelector(".app-modal__title").textContent = title;
    modal.querySelector(".app-modal__body").innerHTML = bodyHTML;
    modal.classList.add("is-open");
  }

  function refreshModalTriggers() {
    outlet.querySelectorAll("[data-modal-template]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const template = outlet.querySelector(trigger.dataset.modalTemplate);
        if (!template) return;
        openModal(trigger.dataset.modalTitle || "", template.innerHTML);
      });
    });
  }

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
    const filterBars = Array.from(outlet.querySelectorAll(".research-filters"));
    if (!filterBars.length) return;

    const resetters = [];

    filterBars.forEach((filterBar) => {
      const scope = filterBar.closest(".research-section") || outlet;
      const cards = Array.from(scope.querySelectorAll(".research-card"));
      if (!cards.length) return;

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

      resetters.push(() => setActiveFilter("all"));
    });

    outlet.querySelectorAll(".phase-chip[href^='#metodo-']").forEach((link) => {
      link.addEventListener("click", () => resetters.forEach((reset) => reset()));
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
    refreshModalTriggers();
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
