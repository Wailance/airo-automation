const CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbyi0Xzq_tGh5WqinBHOegZ3aOA4-b2D_1YFFABMjZXhDT11n4aquIMM5gWvo80aO0ztbA/exec",
};

const form = document.querySelector("#lead-capture-form");
const status = document.querySelector("#form-status");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  if (!data.get("consent")) {
    status.textContent = "Подтвердите согласие на обработку персональных данных.";
    return;
  }

  const button = form.querySelector("button");
  const payload = {
    action: "lead",
    client_name: String(data.get("client_name") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    interest: String(data.get("interest") || "").trim(),
    consent: true,
    website: String(data.get("website") || ""),
    source: "landing-profession-bpla",
    idempotency_key: `landing-${crypto.randomUUID()}`,
  };

  button.disabled = true;
  button.innerHTML = "Заявка отправляется <span>...</span>";
  status.textContent = "";

  fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});

  form.reset();
  button.innerHTML = "Заявка отправлена <span>✓</span>";
  status.textContent = "Спасибо. Специалист школы свяжется с вами и ответит на вопросы.";
  status.style.color = "#5b8d19";
});
