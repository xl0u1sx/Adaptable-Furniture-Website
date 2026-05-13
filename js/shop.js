(function () {
  const root = document.querySelector("[data-shop-root]");
  if (!root) return;

  const STORAGE_KEY = "af-cart";

  const PRODUCTS = [
    {
      id: "sea-foam",
      name: "Sea foam green",
      desc: "Floor seating modules with glacier blue table — limited run.",
      price: 189,
      badge: "Limited run",
      image: "img/Product-green.png",
      sku: "SKU AF-MOD-SEA",
      swatch: "#b3d4cf",
    },
    {
      id: "lemon",
      name: "Lemon yellow",
      desc: "Bright modular pieces that reconfigure in minutes.",
      price: 179,
      badge: "Brand new color",
      image: "img/Product-yellow.png",
      sku: "SKU AF-MOD-LEMON",
      swatch: "#f2e68a",
    },
    {
      id: "terracotta",
      name: "Terracotta rose",
      desc: "Warm tones, soft edges, built for daily reshaping.",
      price: 195,
      badge: "Classic style",
      image: "img/Product-teracotta.png",
      sku: "SKU AF-MOD-TERRA",
      swatch: "#d9c0ab",
    },
    {
      id: "glacier",
      name: "Glacier blue",
      desc: "Cool palette pairing for open, social layouts.",
      price: 199,
      badge: "Limited run",
      image: "img/Product-blue.png",
      sku: "SKU AF-MOD-GLACIER",
      swatch: "#a9bfcb",
    },
    {
      id: "lavender",
      name: "Lavender haze",
      desc: "Compact footprint, generous seating options.",
      price: 185,
      badge: "Brand new color",
      image: "img/Product-lavender.png",
      sku: "SKU AF-MOD-LAV",
      swatch: "#b9a7cc",
    },
  ];

  const els = {
    cartOpenTargets: root.querySelectorAll("[data-open-cart]"),
    cartPanel: document.getElementById("cart-panel"),
    cartList: root.querySelector("[data-cart-list]"),
    cartTotal: root.querySelector("[data-cart-total]"),
    cartTotalFooter: root.querySelector("[data-cart-total-footer]"),
    cartClose: root.querySelector("[data-close-cart]"),
    checkout: root.querySelector("[data-checkout]"),
    image: root.querySelector("[data-product-image]"),
    badge: root.querySelector("[data-product-badge]"),
    title: root.querySelector("[data-product-title]"),
    priceAmount: root.querySelector("[data-product-price-amount]"),
    sku: root.querySelector("[data-product-sku]"),
    desc: root.querySelector("[data-product-desc]"),
    colorOptions: root.querySelector("[data-color-options]"),
    selectedColorLabel: root.querySelector("[data-selected-color-label]"),
    pageQtyValue: root.querySelector("[data-page-qty-value]"),
    pageQtyPlus: root.querySelector("[data-page-qty-plus]"),
    pageQtyMinus: root.querySelector("[data-page-qty-minus]"),
    addSelection: root.querySelector("[data-add-selection]"),
  };

  const params = new URLSearchParams(window.location.search);
  const variantParam = params.get("variant");
  let selectedVariantId = PRODUCTS.some((p) => p.id === variantParam)
    ? variantParam
    : PRODUCTS[0].id;
  /** Remember quantity picker per colorway while browsing (not the same as cart). */
  const draftQtyByVariant = {};
  let pageQty = 1;

  let cart = loadCart();

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function cartCount() {
    return Object.values(cart).reduce((a, n) => a + n, 0);
  }

  function cartTotalCents() {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = productById(id);
      if (!p) return sum;
      return sum + p.price * 100 * qty;
    }, 0);
  }

  function formatMoney(cents) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  function formatDollars(dollars) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(dollars);
  }

  function iconTrash() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 5v10m4-10v10M6 8h12l-1 12H7L6 8z"/></svg>`;
  }

  function notifyCartUpdated() {
    document.dispatchEvent(new CustomEvent("af:cart-updated", { detail: { count: cartCount() } }));
  }

  function updateQty(id, delta) {
    if (!id) return;
    const next = (cart[id] || 0) + delta;
    if (next <= 0) {
      delete cart[id];
    } else {
      cart[id] = next;
    }
    saveCart();
    notifyCartUpdated();
    updateCartButton();
    renderCart();
  }

  function addQtyToCart(id, qty) {
    if (!id || qty <= 0) return;
    cart[id] = (cart[id] || 0) + qty;
    saveCart();
    notifyCartUpdated();
    updateCartButton();
    renderCart();
  }

  function productById(id) {
    return PRODUCTS.find((p) => p.id === id);
  }

  function syncVariantUrl() {
    const next = new URL(window.location.href);
    next.searchParams.set("variant", selectedVariantId);
    window.history.replaceState({}, "", `${next.pathname}${next.search}${next.hash}`);
  }

  function setSelectedVariant(id) {
    if (!productById(id)) return;
    if (id === selectedVariantId) return;
    draftQtyByVariant[selectedVariantId] = pageQty;
    selectedVariantId = id;
    pageQty = draftQtyByVariant[id] ?? 1;
    syncVariantUrl();
    renderSingleProduct();
  }

  function setPageQty(next) {
    const n = Math.min(99, Math.max(1, next));
    pageQty = n;
    draftQtyByVariant[selectedVariantId] = n;
    if (els.pageQtyValue) els.pageQtyValue.textContent = String(pageQty);
  }

  function renderSingleProduct() {
    const p = productById(selectedVariantId);
    if (!p) return;

    if (els.image) {
      els.image.src = p.image;
      els.image.alt = `${p.name} modular sofa`;
    }
    if (els.badge) {
      els.badge.textContent = p.badge;
    }
    if (els.title) els.title.textContent = p.name;
    if (els.priceAmount) els.priceAmount.textContent = formatDollars(p.price);
    if (els.sku) els.sku.textContent = p.sku;
    if (els.desc) els.desc.textContent = p.desc;
    if (els.pageQtyValue) els.pageQtyValue.textContent = String(pageQty);
    if (els.selectedColorLabel) els.selectedColorLabel.textContent = p.name;

    if (els.colorOptions) {
      els.colorOptions.innerHTML = PRODUCTS.map((opt) => {
        const selected = opt.id === selectedVariantId;
        return `<button type="button" class="shop-color-swatch${selected ? " is-selected" : ""}" data-variant-id="${
          opt.id
        }" style="--swatch:${opt.swatch}" aria-pressed="${selected}" aria-label="${opt.name}"></button>`;
      }).join("");

      els.colorOptions.querySelectorAll("[data-variant-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-variant-id");
          if (id) setSelectedVariant(id);
        });
      });
    }
  }

  function renderCart() {
    if (!els.cartList || !els.cartTotal || !els.cartTotalFooter) return;
    const ids = Object.keys(cart).filter((id) => cart[id] > 0);
    if (!ids.length) {
      els.cartList.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
      els.cartTotal.textContent = formatMoney(0);
      els.cartTotalFooter.textContent = formatMoney(0);
      return;
    }
    els.cartList.innerHTML = ids
      .map((id) => {
        const p = productById(id);
        if (!p) return "";
        const qty = cart[id];
        const lineTotal = formatMoney(p.price * 100 * qty);
        return `
      <article class="product-card cart-item" data-id="${id}">
        <div class="product-card__img">
          <img src="${p.image}" alt="" width="400" height="400" loading="lazy" />
          <button type="button" class="product-card__add" data-remove="${id}" aria-label="Remove ${p.name} from cart">
            ${iconTrash()}
          </button>
        </div>
        <div class="product-card__body">
          <h3>${p.name}</h3>
          <p class="product-card__price">${formatDollars(p.price)} each</p>
          <div class="product-card__qty" data-qty-wrap="${id}">
            <button type="button" class="qty-btn" data-cart-minus="${id}" aria-label="Decrease ${p.name} quantity">-</button>
            <span class="qty-value" data-cart-qty="${id}">${qty}</span>
            <button type="button" class="qty-btn" data-cart-plus="${id}" aria-label="Increase ${p.name} quantity">+</button>
          </div>
          <p class="cart-item__line-total">${lineTotal}</p>
        </div>
      </article>`;
      })
      .join("");

    const total = formatMoney(cartTotalCents());
    els.cartTotal.textContent = total;
    els.cartTotalFooter.textContent = total;

    els.cartList.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-remove");
        if (!id) return;
        delete cart[id];
        saveCart();
        notifyCartUpdated();
        updateCartButton();
        renderCart();
      });
    });

    els.cartList.querySelectorAll("[data-cart-plus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        updateQty(btn.getAttribute("data-cart-plus"), 1);
      });
    });

    els.cartList.querySelectorAll("[data-cart-minus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        updateQty(btn.getAttribute("data-cart-minus"), -1);
      });
    });
  }

  function updateCartButton() {
    const n = cartCount();
    const label = root.querySelector(".btn-cart-nav .cart-count");
    if (label) label.textContent = n ? ` (${n})` : "";
    document.dispatchEvent(new CustomEvent("af:cart-updated", { detail: { count: n } }));
  }

  function openPanel(panel) {
    panel?.classList.add("is-open");
    panel?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closePanel(panel) {
    panel?.classList.remove("is-open");
    panel?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  els.cartOpenTargets.forEach((btn) => {
    btn.addEventListener("click", () => {
      renderCart();
      openPanel(els.cartPanel);
    });
  });

  els.cartClose?.addEventListener("click", () => {
    closePanel(els.cartPanel);
  });

  els.checkout?.addEventListener("click", () => {
    if (!cartCount()) return;
    window.location.href = "checkout.html";
  });

  els.pageQtyPlus?.addEventListener("click", () => {
    setPageQty(pageQty + 1);
  });

  els.pageQtyMinus?.addEventListener("click", () => {
    setPageQty(pageQty - 1);
  });

  els.addSelection?.addEventListener("click", () => {
    addQtyToCart(selectedVariantId, pageQty);
    const btn = els.addSelection;
    if (btn) {
      btn.classList.add("is-added");
      const original = btn.textContent;
      btn.textContent = "Added";
      window.setTimeout(() => {
        btn.classList.remove("is-added");
        btn.textContent = original || "Add to cart";
      }, 900);
    }
    draftQtyByVariant[selectedVariantId] = 1;
    pageQty = 1;
    if (els.pageQtyValue) els.pageQtyValue.textContent = "1";
  });

  syncVariantUrl();
  renderSingleProduct();
  renderCart();
  updateCartButton();

  const openParams = new URLSearchParams(window.location.search);
  if (openParams.get("cart") === "1") {
    renderCart();
    openPanel(els.cartPanel);
  }
})();
