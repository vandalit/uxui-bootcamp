(function () {
  const banner = document.querySelector(".tab-banner");
  const indicator = banner.querySelector(".tab-banner__indicator");
  const tabs = Array.from(banner.querySelectorAll(".tab-chip"));
  const outlet = document.getElementById("view-outlet");

  const viewCache = new Map();

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
