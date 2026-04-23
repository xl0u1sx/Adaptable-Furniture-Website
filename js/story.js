(function () {
  "use strict";

  var storySection = document.getElementById("story-scroll");
  var progressEl = document.getElementById("story-progress");
  var fills = progressEl
    ? progressEl.querySelectorAll(".story-progress__fill")
    : [];
  var images = document.querySelectorAll(".story-visual__img");
  var panels = document.querySelectorAll(".feature-panel");
  var viewer = document.querySelector(".story-visual__model");

  if (!storySection || !progressEl) return;

  var lastIndex = -1;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

  /**
   * Scroll-driven camera for sofa.glb (model-viewer):
   * Q1 — zoom in · Q2 — zoom out · Q3 — orbit to show another side · Q4 — settle.
   * Theta/phi/radius% tuned for a typical furniture bounding sphere.
   */
  function cameraOrbitFromProgress(p) {
    var t = clamp(p, 0, 1);
    var theta;
    var phi;
    var radiusPct;
    if (t < 0.25) {
      var u = easeInOutCubic(t / 0.25);
      theta = lerp(22, 30, u);
      phi = lerp(72, 68, u);
      radiusPct = lerp(118, 74, u);
    } else if (t < 0.5) {
      var u2 = easeInOutCubic((t - 0.25) / 0.25);
      theta = lerp(30, 34, u2);
      phi = lerp(68, 70, u2);
      radiusPct = lerp(74, 124, u2);
    } else if (t < 0.75) {
      var u3 = easeInOutCubic((t - 0.5) / 0.25);
      theta = lerp(34, 198, u3);
      phi = lerp(70, 64, u3);
      radiusPct = lerp(124, 108, u3);
    } else {
      var u4 = easeInOutCubic((t - 0.75) / 0.25);
      theta = lerp(198, 218, u4);
      phi = lerp(64, 58, u4);
      radiusPct = lerp(108, 98, u4);
    }
    return theta + "deg " + phi + "deg " + radiusPct + "%";
  }

  function applyModelCamera(progress) {
    if (!viewer) return;
    /* Only skip when model-viewer reports not loaded yet — avoid treating missing `loaded` as falsy. */
    if (Object.prototype.hasOwnProperty.call(viewer, "loaded") && viewer.loaded === false) return;
    try {
      viewer.cameraOrbit = cameraOrbitFromProgress(progress);
    } catch (e) {
      /* no-op */
    }
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
    applyModelCamera(p);
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

  if (viewer) {
    viewer.addEventListener("load", requestTick, { once: true });
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);

  if ("ResizeObserver" in window) {
    new ResizeObserver(requestTick).observe(storySection);
  }

  onScroll();
})();
