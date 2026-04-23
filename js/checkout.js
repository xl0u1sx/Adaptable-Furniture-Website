(function () {
  const root = document.querySelector("[data-checkout-root]");
  if (!root) return;

  const STORAGE_KEY = "af-cart";
  const TAX_RATE = 0.085;
  const SHIPPING_FEE_CENTS = 5900;
  const FREE_SHIPPING_THRESHOLD_CENTS = 250000;

  const PRODUCTS = [
    {
      id: "sea-foam",
      name: "Sea foam green",
      price: 899,
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    },
    {
      id: "lemon",
      name: "Lemon yellow",
      price: 899,
      image:
        "https://images.unsplash.com/photo-1558211583-d26f610c1eb1?auto=format&fit=crop&w=900&h=700&q=80",
    },
    {
      id: "terracotta",
      name: "Terracotta rose",
      price: 929,
      image: "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=900&h=700&fit=crop&q=80",
    },
    {
      id: "glacier",
      name: "Glacier blue",
      price: 949,
      image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&q=80",
    },
    {
      id: "lavender",
      name: "Lavender haze",
      price: 899,
      image:
        "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=900&h=700&q=80",
    },
  ];

  const els = {
    items: root.querySelector("[data-checkout-items]"),
    subtotal: root.querySelector("[data-subtotal]"),
    shipping: root.querySelector("[data-shipping]"),
    tax: root.querySelector("[data-tax]"),
    total: root.querySelector("[data-total]"),
    form: root.querySelector("[data-checkout-form]"),
    submit: root.querySelector("[data-place-order]"),
    confirmation: root.querySelector("[data-checkout-confirmation]"),
  };

  function formatMoney(cents) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

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

  function productById(id) {
    return PRODUCTS.find((p) => p.id === id);
  }

  function cartEntries(cart) {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const product = productById(id);
        if (!product || qty <= 0) return null;
        return { product, qty };
      })
      .filter(Boolean);
  }

  function computeTotals(entries) {
    const subtotalCents = entries.reduce(
      (sum, entry) => sum + entry.product.price * entry.qty * 100,
      0
    );
    const shippingCents =
      subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
        ? 0
        : SHIPPING_FEE_CENTS;
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const totalCents = subtotalCents + shippingCents + taxCents;
    return { subtotalCents, shippingCents, taxCents, totalCents };
  }

  function renderEmpty() {
    if (!els.items) return;
    els.items.innerHTML = `
      <div class="checkout-empty">
        <p>Your cart is currently empty.</p>
        <a href="shop.html" class="btn-secondary checkout-empty__cta">Return to shop</a>
      </div>
    `;
    if (els.subtotal) els.subtotal.textContent = formatMoney(0);
    if (els.shipping) els.shipping.textContent = formatMoney(0);
    if (els.tax) els.tax.textContent = formatMoney(0);
    if (els.total) els.total.textContent = formatMoney(0);
    if (els.submit) els.submit.disabled = true;
  }

  function render() {
    const cart = loadCart();
    const entries = cartEntries(cart);
    if (!entries.length) {
      renderEmpty();
      return;
    }

    if (els.submit) els.submit.disabled = false;
    if (!els.items) return;

    els.items.innerHTML = entries
      .map((entry) => {
        const lineTotal = entry.product.price * entry.qty * 100;
        return `
          <article class="checkout-item">
            <img src="${entry.product.image}" alt="${entry.product.name}" width="96" height="96" loading="lazy" />
            <div class="checkout-item__body">
              <h3>${entry.product.name}</h3>
              <p>Qty ${entry.qty}</p>
            </div>
            <strong>${formatMoney(lineTotal)}</strong>
          </article>
        `;
      })
      .join("");

    const totals = computeTotals(entries);
    if (els.subtotal) els.subtotal.textContent = formatMoney(totals.subtotalCents);
    if (els.shipping) {
      els.shipping.textContent =
        totals.shippingCents === 0 ? "Free" : formatMoney(totals.shippingCents);
    }
    if (els.tax) els.tax.textContent = formatMoney(totals.taxCents);
    if (els.total) els.total.textContent = formatMoney(totals.totalCents);
  }

  els.form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!els.form.checkValidity()) {
      els.form.reportValidity();
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    render();

    if (els.confirmation) {
      els.confirmation.hidden = false;
    }
    if (els.submit) {
      els.submit.disabled = true;
      els.submit.textContent = "Order placed";
    }
  });

  render();
})();
