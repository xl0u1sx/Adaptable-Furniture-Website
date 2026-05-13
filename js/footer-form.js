(function () {
  const TO = "hello@adaptablefurniture.com";

  document.querySelectorAll("[data-footer-contact-form]").forEach((form) => {
    const status = form.querySelector("[data-footer-form-status]");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;

      const fd = new FormData(form);
      const email = String(fd.get("email") || "").trim();
      const subject = String(fd.get("subject") || "").trim();
      const message = String(fd.get("message") || "").trim();

      const body = `From: ${email}\n\n${message}`;
      const href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      if (status) {
        status.hidden = false;
        status.textContent = "Opening your email app…";
      }

      window.location.href = href;
    });
  });
})();
