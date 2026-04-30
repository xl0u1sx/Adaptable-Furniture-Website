(function () {
  const root = document.querySelector("[data-checkout-root]");
  if (!root) return;

  const API_BASE_URL = "https://6e7ggqrms0.execute-api.us-east-1.amazonaws.com";
  const STORAGE_KEY = "af-cart";
  const TAX_RATE = 0.085;
  const SHIPPING_FEE_CENTS = 5900;
  const FREE_SHIPPING_THRESHOLD_CENTS = 250000;

  const PRODUCTS = [
    {
      id: "sea-foam",
      name: "Sea foam green",
      price: 189,
      image: "img/Product-green.png",
    },
    {
      id: "lemon",
      name: "Lemon yellow",
      price: 179,
      image: "img/Product-yellow.png",
    },
    {
      id: "terracotta",
      name: "Terracotta rose",
      price: 195,
      image: "img/Product-teracotta.png",
    },
    {
      id: "glacier",
      name: "Glacier blue",
      price: 199,
      image: "img/Product-blue.png",
    },
    {
      id: "lavender",
      name: "Lavender haze",
      price: 185,
      image: "img/Product-lavender.png",
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
    error: root.querySelector("[data-checkout-error]"),
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

  function clearMessages() {
    if (els.error) {
      els.error.hidden = true;
      els.error.textContent = "";
    }
    if (els.confirmation) {
      els.confirmation.hidden = true;
    }
  }

  function showError(message) {
    if (!els.error) return;
    els.error.textContent = message;
    els.error.hidden = false;
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

  function buildOrderPayload(form, entries, totals) {
    const data = new FormData(form);
    return {
      customerName: String(data.get("fullName") || "").trim(),
      email: String(data.get("email") || "").trim(),
      items: entries.map((entry) => ({
        id: entry.product.id,
        name: entry.product.name,
        qty: entry.qty,
        price: entry.product.price,
      })),
      total: Math.round(totals.totalCents / 100),
      shippingAddress: {
        line1: String(data.get("address1") || "").trim(),
        line2: String(data.get("address2") || "").trim(),
        city: String(data.get("city") || "").trim(),
        state: String(data.get("state") || "").trim(),
        zip: String(data.get("zip") || "").trim(),
        country: String(data.get("country") || "").trim(),
      },
      notes: "Demo checkout submission",
    };
  }

  function setSubmitState(isLoading) {
    if (!els.submit) return;
    els.submit.disabled = isLoading;
    els.submit.textContent = isLoading ? "Placing order..." : "Place order";
  }

  els.form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!els.form.checkValidity()) {
      els.form.reportValidity();
      return;
    }

    clearMessages();

    const cart = loadCart();
    const entries = cartEntries(cart);
    if (!entries.length) {
      showError("Your cart is empty. Add at least one item before checkout.");
      return;
    }

    const totals = computeTotals(entries);
    const payload = buildOrderPayload(els.form, entries, totals);

    setSubmitState(true);

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        const serverMessage =
          typeof result?.message === "string" ? result.message : "";
        throw new Error(serverMessage || "Unable to place order right now.");
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while placing your order.";
      showError(message);
      setSubmitState(false);
    }
  });

  clearMessages();
  render();
})();
