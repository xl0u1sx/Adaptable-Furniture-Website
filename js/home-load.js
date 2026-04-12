(function () {
  const root = document.querySelector("[data-home-load]");
  if (!root) return;

  root.classList.add("load-state");
  window.setTimeout(() => {
    root.classList.remove("load-state");
  }, 900);
})();
