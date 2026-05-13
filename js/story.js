(function () {
  "use strict";

  var storySection = document.getElementById("story-scroll");
  var panels = document.querySelectorAll(".feature-panel");
  var viewer = document.querySelector(".story-visual__model");
  var slot = document.querySelector(".story-copy__slot");
  var hotspotButtons = viewer ? viewer.querySelectorAll(".story-hotspot") : [];

  if (!storySection) return;

  /** Orbit preset on first paint (matches “Space-Efficient” camera quarter); no panel until a hotspot tap. */
  var INITIAL_CAMERA_FEATURE = 2;

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
      setActiveFeature(i);
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

  function updateSlotNearActiveHotspot() {
    if (!slot || !storySection) return;
    if (slot.classList.contains("story-copy__slot--hidden") || lastIndex < 0) {
      slot.classList.remove("story-copy__slot--pin");
      return;
    }
    slot.classList.remove("story-copy__slot--pin");
  }

  function applyModelCameraForFeatureIndex(index) {
    /* Match the old scroll story: first feature used ~progress 0 at section entry, not mid-quarter. */
    var i = clamp(index, 0, 3);
    var p = i * 0.25 + 0.001;
    applyModelCamera(p);
  }

  /**
   * Camera orbit for sofa.glb (model-viewer): four quarter-orbit presets.
   * Progress 0–1 is chosen from the active feature index (hotspot clicks only).
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

    if (slot) {
      slot.classList.remove("story-copy__slot--hidden");
    }

    panels.forEach(function (panel, i) {
      var on = i === index;
      panel.classList.toggle("is-active", on);
      if (on) {
        restartBulletAnimations(panel);
      }
    });

    applyModelCameraForFeatureIndex(index);
    updateSlotNearActiveHotspot();
  }

  if (viewer) {
    viewer.addEventListener("click", onHotspotClick);
    function onViewerLoaded() {
      refreshHotspotButtons();
      applyModelCameraForFeatureIndex(
        lastIndex >= 0 ? lastIndex : INITIAL_CAMERA_FEATURE
      );
    }
    var alreadyLoaded =
      Object.prototype.hasOwnProperty.call(viewer, "loaded") && viewer.loaded === true;
    if (alreadyLoaded) {
      onViewerLoaded();
    } else {
      viewer.addEventListener("load", onViewerLoaded, { once: true });
    }
  }

  updateSlotNearActiveHotspot();
})();

/**
 * "One piece. Infinite layouts." — keep the visible slide's caption in sync
 * (center of the marquee mask ↔ figcaption text on the nearest figure).
 */
(function configMarqueeCaptionSync() {
  var configSection = document.querySelector(".config");
  var root = document.querySelector(".config-marquee");
  var live = document.getElementById("config-marquee-live");
  if (!configSection || !root || !live) return;

  var rafId = 0;

  function readCaption() {
    var rootRect = root.getBoundingClientRect();
    if (rootRect.width < 8) return;
    var cx = rootRect.left + rootRect.width * 0.5;
    var items = root.querySelectorAll(".config-marquee__item:not([aria-hidden='true'])");
    var best = null;
    var bestDist = Infinity;
    items.forEach(function (item) {
      var r = item.getBoundingClientRect();
      if (r.right < rootRect.left + 4 || r.left > rootRect.right - 4) return;
      var icx = r.left + r.width * 0.5;
      var dist = Math.abs(icx - cx);
      if (dist < bestDist) {
        bestDist = dist;
        best = item;
      }
    });
    if (!best) return;
    var cap = best.querySelector(".config-marquee__caption");
    if (!cap) return;
    var t = cap.textContent.trim();
    if (live.textContent !== t) {
      live.textContent = t;
    }
  }

  function loop() {
    var rect = configSection.getBoundingClientRect();
    var vis = rect.top < window.innerHeight && rect.bottom > 0;
    if (!vis) {
      rafId = 0;
      return;
    }
    readCaption();
    rafId = window.requestAnimationFrame(loop);
  }

  function startIfNeeded() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      var first = root.querySelector(
        ".config-marquee__item:not([aria-hidden='true']) .config-marquee__caption"
      );
      if (first) live.textContent = first.textContent.trim();
      return;
    }
    if (!rafId) {
      rafId = window.requestAnimationFrame(loop);
    }
  }

  var io = new IntersectionObserver(startIfNeeded, { threshold: [0, 0.02, 0.1] });
  io.observe(configSection);
  window.addEventListener("resize", function () {
    readCaption();
  });
  startIfNeeded();
})();
