(function () {
  "use strict";

  var storySection = document.getElementById("story-scroll");
  var progressEl = document.getElementById("story-progress");
  var fills = progressEl
    ? progressEl.querySelectorAll(".story-progress__fill")
    : [];
  var images = document.querySelectorAll(".story-visual__img");
  var panels = document.querySelectorAll(".feature-panel");

  if (!storySection || !progressEl) return;

  var lastIndex = -1;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function getProgress() {
    var rect = storySection.getBoundingClientRect();
    var vh = window.innerHeight;
    var sectionTop = rect.top + window.scrollY;
    var sectionHeight = storySection.offsetHeight;
    var denom = sectionHeight - vh;
    if (denom <= 0) return 0;
    var p = (window.scrollY - sectionTop) / denom;
    return clamp(p, 0, 1);
  }

  function segmentWidths(progress) {
    var w = [];
    var i;
    for (i = 0; i < 4; i++) {
      var raw = progress * 4 - i;
      w.push(clamp(raw * 100, 0, 100));
    }
    return w;
  }

  function featureIndex(progress) {
    if (progress >= 1) return 3;
    return Math.min(3, Math.floor(progress * 4));
  }

  function restartBulletAnimations(panel) {
    panel.querySelectorAll(".feature-panel__list li").forEach(function (li) {
      li.style.animation = "none";
      void li.offsetWidth;
      li.style.removeProperty("animation");
    });
  }

  function setActiveFeature(index) {
    if (index === lastIndex) return;
    lastIndex = index;

    images.forEach(function (img, i) {
      img.classList.toggle("is-active", i === index);
    });

    panels.forEach(function (panel, i) {
      var on = i === index;
      panel.classList.toggle("is-active", on);
      if (on) {
        restartBulletAnimations(panel);
      }
    });
  }

  function updateProgressVisibility() {
    var rect = storySection.getBoundingClientRect();
    var vh = window.innerHeight;
    var visible = rect.top < vh && rect.bottom > 0;
    progressEl.classList.toggle("is-visible", visible);
  }

  function onScroll() {
    var p = getProgress();
    var widths = segmentWidths(p);
    fills.forEach(function (fill, i) {
      fill.style.width = widths[i] + "%";
    });
    setActiveFeature(featureIndex(p));
    updateProgressVisibility();
  }

  var ticking = false;
  function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      onScroll();
    });
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);

  if ("ResizeObserver" in window) {
    new ResizeObserver(requestTick).observe(storySection);
  }

  onScroll();
})();
