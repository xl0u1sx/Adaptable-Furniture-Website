(function () {
  const body = document.body;
  if (!body.classList.contains("page-product")) return;

  const STORAGE_KEY = "af-cart";
  const productId = body.getAttribute("data-product-id");
  const addBtn = document.querySelector("[data-add-to-cart]");
  if (!productId || !addBtn) return;

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

  function saveCart(next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  addBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const cart = loadCart();
    cart[productId] = (cart[productId] || 0) + 1;
    saveCart(cart);

    document.dispatchEvent(
      new CustomEvent("af:cart-updated", {
        detail: {
          count: Object.values(cart).reduce((sum, qty) => sum + qty, 0),
        },
      })
    );

    addBtn.classList.add("is-added");
    const original = addBtn.textContent;
    addBtn.textContent = "Added";
    window.setTimeout(() => {
      addBtn.classList.remove("is-added");
      addBtn.textContent = original || "Shop Now";
    }, 900);
  });
})();
