(function () {
  const root = document.querySelector("[data-shop-root]");
  if (!root) return;

  const STORAGE_KEY = "af-cart";

  const COLORS = {
    green: "#2d6a4f",
    blue: "#1d3557",
    purple: "#5f4bb6",
    pink: "#d63384",
    red: "#c1121f",
    brown: "#7f5539",
    orange: "#e85d04",
    yellow: "#f4a261",
  };

  const PRODUCTS = [
    {
      id: "sea-foam",
      name: "Sea foam green",
      desc: "Floor seating modules with glacier blue table — limited run.",
      price: 899,
      colorKey: "green",
      customColor: true,
      detailUrl: "products/sea-foam.html",
      image:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    },
    {
      id: "lemon",
      name: "Lemon yellow",
      desc: "Bright modular pieces that reconfigure in minutes.",
      price: 899,
      colorKey: "yellow",
      customColor: false,
      detailUrl: "products/lemon-yellow.html",
      image:
        "https://images.unsplash.com/photo-1558211583-d26f610c1eb1?auto=format&fit=crop&w=900&h=700&q=80",
    },
    {
      id: "terracotta",
      name: "Terracotta rose",
      desc: "Warm tones, soft edges, built for daily reshaping.",
      price: 929,
      colorKey: "orange",
      customColor: true,
      detailUrl: "products/terracotta-rose.html",
      image:
        "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=900&h=700&fit=crop&q=80",
    },
    {
      id: "glacier",
      name: "Glacier blue",
      desc: "Cool palette pairing for open, social layouts.",
      price: 949,
      colorKey: "blue",
      customColor: true,
      detailUrl: "products/glacier-blue.html",
      image:
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&q=80",
    },
    {
      id: "lavender",
      name: "Lavender haze",
      desc: "Compact footprint, generous seating options.",
      price: 899,
      colorKey: "purple",
      customColor: false,
      detailUrl: "products/lavender-haze.html",
      image:
        "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=900&h=700&q=80",
    },
  ];

  const els = {
    list: root.querySelector("[data-product-list]"),
    search: root.querySelector("[data-search]"),
    filterOpen: root.querySelector("[data-open-filter]"),
    cartOpen: root.querySelector("[data-open-cart]"),
    cartPanel: document.getElementById("cart-panel"),
    filterPanel: document.getElementById("filter-panel"),
    cartList: root.querySelector("[data-cart-list]"),
    cartTotal: root.querySelector("[data-cart-total]"),
    cartTotalFooter: root.querySelector("[data-cart-total-footer]"),
    cartClose: root.querySelector("[data-close-cart]"),
    filterClose: root.querySelector("[data-close-filter]"),
    filterApply: root.querySelector("[data-apply-filter]"),
    filterForm: document.getElementById("filter-form"),
    checkout: root.querySelector("[data-checkout]"),
    resultsCount: root.querySelector("[data-results-count]"),
  };

  let cart = loadCart();
  let filterState = { colors: [], customOnly: false };

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

  function getFilteredProducts() {
    const q = (els.search?.value || "").trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (
        filterState.colors.length > 0 &&
        !filterState.colors.includes(p.colorKey)
      ) {
        return false;
      }
      if (filterState.customOnly && !p.customColor) return false;
      if (!q) return true;
      const blob = `${p.name} ${p.desc}`.toLowerCase();
      return blob.includes(q);
    });
  }

  function iconCart() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>`;
  }

  function iconTrash() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 5v10m4-10v10M6 8h12l-1 12H7L6 8z"/></svg>`;
  }

  function renderProducts() {
    if (!els.list) return;
    const items = getFilteredProducts();
    if (els.resultsCount) {
      els.resultsCount.textContent = `${items.length} product${
        items.length === 1 ? "" : "s"
      }`;
    }
    if (!items.length) {
      els.list.innerHTML =
        '<p class="empty-cart">No products match your filters.</p>';
      return;
    }
    els.list.innerHTML = items
      .map(
        (p) => `
      <article class="product-card" data-id="${p.id}">
        <a class="product-card__img" href="${p.detailUrl}" aria-label="View ${p.name} details">
          <img src="${p.image}" alt="${p.name} modular sofa" width="400" height="400" loading="lazy" />
        </a>
        <button type="button" class="product-card__add" data-add="${p.id}" aria-label="Add ${p.name} to cart">
          ${iconCart()}
        </button>
        <div class="product-card__body">
          <h3><a href="${p.detailUrl}" aria-label="View ${p.name} details">${p.name}</a></h3>
          <p class="product-card__price">${formatDollars(p.price)}</p>
          <p>${p.desc}</p>
          <a class="product-card__cta" href="${p.detailUrl}" aria-label="View ${p.name} details">View details</a>
        </div>
      </article>`
      )
      .join("");

    els.list.querySelectorAll("[data-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-add");
        if (!id) return;
        cart[id] = (cart[id] || 0) + 1;
        saveCart();
        updateCartButton();
      });
    });
  }

  function productById(id) {
    return PRODUCTS.find((p) => p.id === id);
  }

  function renderCart() {
    if (!els.cartList || !els.cartTotal || !els.cartTotalFooter) return;
    const ids = Object.keys(cart).filter((id) => cart[id] > 0);
    if (!ids.length) {
      els.cartList.innerHTML =
        '<p class="empty-cart">Your cart is empty.</p>';
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
          <p>Qty: ${qty}</p>
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
        updateCartButton();
        renderCart();
      });
    });
  }

  function updateCartButton() {
    const n = cartCount();
    const label = els.cartOpen?.querySelector(".cart-count");
    if (label) label.textContent = n ? ` (${n})` : "";
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

  function updateFilterVisualState() {
    if (!els.filterForm) return;
    const rows = els.filterForm.querySelectorAll(".filter-row");
    if (!rows.length) return;

    let selectedCount = 0;
    rows.forEach((row) => {
      const input = row.querySelector("input[name='colors']");
      const isSelected = Boolean(input?.checked);
      row.classList.toggle("is-selected", isSelected);
      if (isSelected) selectedCount += 1;
    });

    els.filterForm.classList.toggle("is-empty", selectedCount === 0);
  }

  els.search?.addEventListener("input", () => renderProducts());

  els.filterOpen?.addEventListener("click", () => {
    updateFilterVisualState();
    openPanel(els.filterPanel);
  });

  els.filterClose?.addEventListener("click", () => {
    closePanel(els.filterPanel);
  });

  els.cartOpen?.addEventListener("click", () => {
    renderCart();
    openPanel(els.cartPanel);
  });

  els.cartClose?.addEventListener("click", () => {
    closePanel(els.cartPanel);
  });

  els.filterApply?.addEventListener("click", () => {
    const fd = new FormData(els.filterForm);
    filterState.colors = fd.getAll("colors").map(String);
    filterState.customOnly = fd.get("customOnly") === "on";
    renderProducts();
    closePanel(els.filterPanel);
  });

  els.filterForm?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.name !== "colors") return;
    updateFilterVisualState();
  });

  els.checkout?.addEventListener("click", () => {
    if (!cartCount()) return;
    window.location.href = "checkout.html";
  });

  renderProducts();
  renderCart();
  updateCartButton();
  updateFilterVisualState();
})();
