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
  var hotspotButtons = viewer ? viewer.querySelectorAll(".story-hotspot") : [];

  if (!storySection || !progressEl) return;

  var lastIndex = -1;

  function refreshHotspotButtons() {
    hotspotButtons = viewer ? viewer.querySelectorAll(".story-hotspot") : [];
  }

  function onHotspotClick(ev) {
    if (!viewer) return;
    var el = ev.target;
    if (!el || typeof el.closest !== "function") return;
    var btn = el.closest(".story-hotspot");
    if (!btn || !viewer.contains(btn)) return;
    var raw = btn.getAttribute("data-feature-trigger");
    var i = raw == null ? NaN : parseInt(raw, 10);
    if (!isNaN(i)) {
      scrollToFeature(i);
    }
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function storyHeaderSafeTop() {
    return clamp(window.innerWidth * 0.02 + 65 + 24, 88, 120);
  }

  /**
   * Pin the glass card above the active hotspot (fixed viewport coords).
   * Panels are position:absolute so the slot can measure 0×0 — use fallback height for layout math.
   */
  function updateSlotNearActiveHotspot() {
    if (!slot || !storySection) return;
    var rect = storySection.getBoundingClientRect();
    var sticky = rect.top <= 0 && rect.bottom > 40;
    if (!sticky) {
      slot.classList.remove("story-copy__slot--pin");
      if (storyCopy) {
        storyCopy.classList.remove("story-copy--card-pop");
      }
      slot.style.removeProperty("left");
      slot.style.removeProperty("top");
      slot.style.removeProperty("right");
      slot.style.removeProperty("bottom");
      return;
    }

    var idx = featureIndex(getProgress());
    var btn = hotspotButtons[idx];
    if (!btn) return;

    var hr = btn.getBoundingClientRect();
    if (hr.width < 2 && hr.height < 2) return;

    var margin = 22;
    var vertExtra = 14;
    var pad = Math.max(12, Math.min(20, window.innerWidth * 0.03));
    var topSafe = storyHeaderSafeTop();
    slot.classList.add("story-copy__slot--pin");
    if (storyCopy) {
      storyCopy.classList.add("story-copy--card-pop");
    }

    var slotW = slot.offsetWidth || Math.min(328, window.innerWidth - pad * 2);
    var slotH = slot.offsetHeight;
    if (slotH < 120) {
      slotH = 240;
    }

    var cx = hr.left + hr.width * 0.5;
    var left = cx - slotW * 0.5;
    left = clamp(left, pad, window.innerWidth - slotW - pad);

    var top = hr.top - slotH - margin - vertExtra;
    if (top < topSafe) {
      top = hr.bottom + margin + vertExtra;
    }
    top = clamp(top, topSafe, window.innerHeight - slotH - pad);

    /* Nudge the card horizontally away from the 3D model so it does not cover hotspot taps */
    if (viewer && viewer.getBoundingClientRect) {
      var vr = viewer.getBoundingClientRect();
      var modelCx = vr.left + vr.width * 0.5;
      var sofaAway = clamp(Math.round(vr.width * 0.08), 28, 56);
      var cardCx = left + slotW * 0.5;
      if (cardCx >= modelCx) {
        left = Math.min(left + sofaAway, window.innerWidth - slotW - pad);
      } else {
        left = Math.max(left - sofaAway, pad);
      }
    }

    slot.style.left = Math.round(left) + "px";
    slot.style.top = Math.round(top) + "px";
    slot.style.right = "auto";
    slot.style.bottom = "auto";
  }

  function getProgress() {
    var rect = storySection.getBoundingClientRect();
    var sectionTop = rect.top + window.scrollY;
    var sectionHeight = storySection.offsetHeight;
    var denom = sectionHeight - window.innerHeight;
    if (denom <= 0) return 0;
    var p = (window.scrollY - sectionTop) / denom;
    return clamp(p, 0, 1);
  }

  function scrollToFeature(index) {
    index = clamp(index, 0, 3);
    var sectionHeight = storySection.offsetHeight;
    var denom = sectionHeight - window.innerHeight;
    if (denom <= 0) return;
    var rect = storySection.getBoundingClientRect();
    var sectionTop = rect.top + window.scrollY;
    var p = (index + 0.5) / 4;
    var targetY = sectionTop + p * denom;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: targetY, behavior: reduce ? "auto" : "smooth" });
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
   * Q1 Adaptable — orbit to show the back (rim hotspot).
   * Q2 Playful — zoomed out.
   * Q3 Space-Efficient — zoomed in.
   * Q4 Durable — comfortable front three-quarter.
   */
  function cameraOrbitFromProgress(p) {
    var t = clamp(p, 0, 1);
    var theta;
    var phi;
    var radiusPct;
    if (t < 0.25) {
      var u = easeInOutCubic(t / 0.25);
      theta = lerp(168, 206, u);
      phi = lerp(64, 60, u);
      radiusPct = lerp(96, 108, u);
    } else if (t < 0.5) {
      var u2 = easeInOutCubic((t - 0.25) / 0.25);
      theta = lerp(32, 40, u2);
      phi = lerp(70, 72, u2);
      radiusPct = lerp(136, 152, u2);
    } else if (t < 0.75) {
      var u3 = easeInOutCubic((t - 0.5) / 0.25);
      theta = lerp(46, 54, u3);
      phi = lerp(72, 76, u3);
      radiusPct = lerp(66, 78, u3);
    } else {
      var u4 = easeInOutCubic((t - 0.75) / 0.25);
      theta = lerp(84, 98, u4);
      phi = lerp(58, 62, u4);
      radiusPct = lerp(92, 100, u4);
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
    var inViewport = rect.top < window.innerHeight && rect.bottom > 0;
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
    setActiveFeature(featureIndex(p));
    var widths = segmentWidths(p);
    fills.forEach(function (fill, i) {
      fill.style.width = widths[i] + "%";
    });
    updateProgressVisibility();
    requestAnimationFrame(function () {
      updateSlotNearActiveHotspot();
    });
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
    viewer.addEventListener("click", onHotspotClick);
    function onViewerLoaded() {
      refreshHotspotButtons();
      requestTick();
    }
    var alreadyLoaded =
      Object.prototype.hasOwnProperty.call(viewer, "loaded") && viewer.loaded === true;
    if (alreadyLoaded) {
      onViewerLoaded();
    } else {
      viewer.addEventListener("load", onViewerLoaded, { once: true });
    }
    viewer.addEventListener("camera-change", function () {
      requestAnimationFrame(function () {
        updateSlotNearActiveHotspot();
      });
    });
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
