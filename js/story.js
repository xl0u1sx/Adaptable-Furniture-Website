(function () {
  "use strict";

  var storySection = document.getElementById("story-scroll");
  var progressEl = document.getElementById("story-progress");
  var fills = progressEl
    ? progressEl.querySelectorAll(".story-progress__fill")
    : [];
  var panels = document.querySelectorAll(".feature-panel");
  var viewer = document.querySelector(".story-visual__model");
  var slot = document.querySelector(".story-copy__slot");
  var storyCopy = storySection ? storySection.querySelector(".story-copy") : null;
  var heroIntro = document.querySelector(".hero.hero--intro");

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

  function isStorySlotMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  /**
   * Glass card path (desktop): bottom-left → bottom-right → top-right → top-left,
   * interpolated continuously from scroll progress so motion follows the scroll instead of jumping per feature.
   */
  function updateSlotPosition(progress) {
    if (!slot || !storyCopy) return;
    if (isStorySlotMobile()) {
      slot.style.removeProperty("--slot-tx");
      slot.style.removeProperty("--slot-ty");
      slot.style.removeProperty("transform");
      return;
    }

    var p = clamp(progress, 0, 1);
    var W = storyCopy.offsetWidth;
    var H = storyCopy.offsetHeight;
    var slotW = slot.offsetWidth;
    var slotH = slot.offsetHeight;
    if (W <= 0 || H <= 0 || slotW <= 0 || slotH <= 0) return;

    var padX = clamp(window.innerWidth * 0.04, 16, 32);
    var padBottom = clamp(window.innerHeight * 0.04, 20, 44);
    var padTop = clamp(window.innerHeight * 0.12, 88, 136);

    var yBottom = H - slotH - padBottom;
    var yTop = padTop;

    var bl = { x: padX, y: yBottom };
    var br = { x: W - slotW - padX, y: yBottom };
    var tr = { x: W - slotW - padX, y: yTop };
    var tl = { x: padX, y: yTop };

    /* Linear in scroll progress so the card tracks the finger/wheel without easing “drift”. */
    var u = p * 3;
    var x;
    var y;
    if (u <= 1) {
      var t0 = clamp(u, 0, 1);
      x = lerp(bl.x, br.x, t0);
      y = lerp(bl.y, br.y, t0);
    } else if (u <= 2) {
      var t1 = clamp(u - 1, 0, 1);
      x = lerp(br.x, tr.x, t1);
      y = lerp(br.y, tr.y, t1);
    } else {
      var t2 = clamp(u - 2, 0, 1);
      x = lerp(tr.x, tl.x, t2);
      y = lerp(tr.y, tl.y, t2);
    }

    slot.style.setProperty("--slot-tx", Math.round(x) + "px");
    slot.style.setProperty("--slot-ty", Math.round(y) + "px");
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
    var inViewport = rect.top < vh && rect.bottom > 0;
    /* Hide under the fixed nav on the text hero — only show once intro has scrolled away. */
    var pastHero = true;
    if (heroIntro) {
      var hb = heroIntro.getBoundingClientRect();
      pastHero = hb.bottom < 24;
    }
    progressEl.classList.toggle("is-visible", inViewport && pastHero);
  }

  function onScroll() {
    var p = getProgress();
    applyModelCamera(p);
    updateSlotPosition(p);
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
    if (storyCopy) {
      new ResizeObserver(requestTick).observe(storyCopy);
    }
    if (slot) {
      new ResizeObserver(requestTick).observe(slot);
    }
  }

  onScroll();
})();
