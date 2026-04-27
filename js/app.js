(function () {
  const STORAGE_KEY = "af-cart";
  const deskHeader = document.querySelector(".desk-header");
  const menuBtn = document.querySelector("[data-nav-open]");
  const overlay = document.getElementById("nav-overlay");
  const closeBtn = document.querySelector("[data-nav-close]");

  if (!overlay) return;

  function openNav() {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("nav-open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
    closeBtn?.focus();
  }

  function closeNav() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("nav-open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    menuBtn?.focus();
  }

  menuBtn?.addEventListener("click", openNav);
  closeBtn?.addEventListener("click", closeNav);

  overlay.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeNav());
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) {
      closeNav();
    }
  });

  const path = window.location.pathname.split("/").pop() || "index.html";
  const forcedActive = document.body.getAttribute("data-nav-active");
  overlay.querySelectorAll("a[data-nav]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    const hrefLeaf = href.split("/").pop() || "";
    if (
      hrefLeaf === forcedActive ||
      hrefLeaf === path ||
      (path === "" && hrefLeaf === "index.html")
    ) {
      a.classList.add("is-active");
    }
  });

  function loadCount() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return 0;
      return Object.values(parsed).reduce((sum, qty) => {
        const n = Number(qty);
        return Number.isFinite(n) && n > 0 ? sum + n : sum;
      }, 0);
    } catch {
      return 0;
    }
  }

  function renderCartBadges(count) {
    document.querySelectorAll("[data-cart-count-badge]").forEach((badge) => {
      badge.textContent = String(count);
      badge.classList.toggle("is-hidden", count === 0);
      badge.classList.add("is-pop");
      window.setTimeout(() => badge.classList.remove("is-pop"), 220);
    });
  }

  renderCartBadges(loadCount());

  if (deskHeader) {
    const hasCart = Boolean(deskHeader.querySelector(".site-header__cart"));
    deskHeader.classList.toggle("desk-header--with-cart", hasCart);
    window.requestAnimationFrame(() => {
      deskHeader.classList.add("desk-header--animate");
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key && event.key !== STORAGE_KEY) return;
    renderCartBadges(loadCount());
  });

  document.addEventListener("af:cart-updated", (event) => {
    const detail = event.detail;
    const count =
      detail && typeof detail.count === "number" ? detail.count : loadCount();
    renderCartBadges(count);
  });
})();
