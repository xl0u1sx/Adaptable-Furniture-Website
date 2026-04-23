(function () {
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
})();
