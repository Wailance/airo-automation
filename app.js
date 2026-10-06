const CONFIG = {
  demoMode: false,
  apiUrl: "https://script.google.com/macros/s/AKfycbyi0Xzq_tGh5WqinBHOegZ3aOA4-b2D_1YFFABMjZXhDT11n4aquIMM5gWvo80aO0ztbA/exec",
  daysToShow: 10,
};

const state = {
  dates: [],
  selectedDate: "",
  selectedSlot: null,
  slots: [],
};

const dateList = document.querySelector("#date-list");
const slotList = document.querySelector("#slot-list");
const dateRange = document.querySelector("#date-range");
const calendarError = document.querySelector("#calendar-error");
const timeError = document.querySelector("#time-error");
const dateContinueButton = document.querySelector("#date-continue-button");
const timeContinueButton = document.querySelector("#time-continue-button");
const dateView = document.querySelector("#date-view");
const timeView = document.querySelector("#time-view");
const bookingForm = document.querySelector("#booking-form");
const selectedSlot = document.querySelector("#selected-slot");
const selectedDate = document.querySelector("#selected-date");
const formError = document.querySelector("#form-error");
const successState = document.querySelector("#success-state");
const stepLabel = document.querySelector("#step-label");
const consentInput = document.querySelector("#consent-checkbox");
const submitBookingButton = document.querySelector("#submit-booking-button");
const consentHint = document.querySelector("#consent-hint");
const calendarButton = document.querySelector("#calendar-button");
const googleCalendarLink = document.querySelector("#google-calendar-link");

const monthFormatter = new Intl.DateTimeFormat("ru-RU", { month: "long" });
const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "short" });
const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

function localDate(offset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function isWeekend(date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function nextBusinessDates(count) {
  const dates = [];
  let offset = 1;
  while (dates.length < count) {
    const date = localDate(offset);
    if (!isWeekend(date)) dates.push(date);
    offset += 1;
  }
  return dates;
}

function nextCalendarDates(count) {
  return Array.from({ length: count }, (_, index) => localDate(index + 1));
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(date) {
  return dateFormatter.format(date).replace(" г.", "");
}

function setCalendarError(message) {
  calendarError.textContent = message || "";
}

function getApiUrl(action, date) {
  const url = new URL(CONFIG.apiUrl);
  url.searchParams.set("action", action);
  if (date) url.searchParams.set("date", date);
  return url;
}

function demoSlots(date) {
  return Array.from({ length: 9 }, (_, index) => {
    const startHour = 11 + index;
    return {
      slot_id: `${date}-trial-${String(startHour).padStart(2, "0")}00`,
      date,
      start_time: `${String(startHour).padStart(2, "0")}:00`,
      end_time: `${String(startHour + 1).padStart(2, "0")}:00`,
      location: "Учебный корпус",
      available_participants: 10,
    };
  });
}

function immediateSlots(date) {
  return demoSlots(date).map((slot) => ({
    ...slot,
    optimistic: true,
  }));
}

async function loadSlots(date) {
  setCalendarError("");
  timeError.textContent = "";
  timeContinueButton.disabled = true;
  state.selectedSlot = null;
  state.slots = immediateSlots(date);
  renderSlots(state.slots);
}

function renderDates() {
  const visibleDates = state.dates;
  dateList.innerHTML = visibleDates.map((date) => {
    const value = isoDate(date);
    const weekend = isWeekend(date);
    const selected = value === state.selectedDate ? " selected" : "";
    return `<button class="date-option${selected}${weekend ? " weekend" : ""}" type="button" data-date="${value}" role="option" aria-selected="${Boolean(selected)}" ${weekend ? "disabled" : ""}>
      <span class="weekday">${weekdayFormatter.format(date).replace(".", "")}</span>
      <span class="day">${date.getDate()}</span>
    </button>`;
  }).join("");
  const first = visibleDates[0];
  const last = visibleDates[visibleDates.length - 1];
  dateRange.textContent = first && last
    ? `${monthFormatter.format(first)} — ${monthFormatter.format(last)}`
    : "Расписание";
}

function renderSlots(slots) {
  if (!slots.length) {
    slotList.innerHTML = '<div class="empty-state">На этот день свободных мест нет. Выберите другую дату.</div>';
    return;
  }
  slotList.innerHTML = slots.map((slot) => `
    <button class="slot-option" type="button" data-slot-id="${slot.slot_id}">
      ${slot.start_time}–${slot.end_time}
    </button>`).join("");
  slotList.querySelectorAll(".slot-option").forEach((button) => {
    button.addEventListener("click", () => {
      slotList.querySelectorAll(".slot-option").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      state.selectedSlot = slots.find((slot) => slot.slot_id === button.dataset.slotId);
      timeContinueButton.disabled = false;
    });
  });
}

function chooseDate(value) {
  if (isWeekend(new Date(`${value}T12:00:00`))) return;
  state.selectedDate = value;
  renderDates();
  if (state.slots.length) {
    const slotsForDate = state.slots.filter((slot) => slot.date === value);
    renderSlots(slotsForDate.length ? slotsForDate : immediateSlots(value));
  } else {
    loadSlots(value);
  }
}

function showTime() {
  dateView.hidden = true;
  timeView.hidden = false;
  stepLabel.textContent = "Шаг 2 из 3";
  selectedDate.textContent = formatDateLabel(new Date(`${state.selectedDate}T12:00:00`));
}

function showDate() {
  timeView.hidden = true;
  dateView.hidden = false;
  stepLabel.textContent = "Шаг 1 из 3";
}

function showForm() {
  if (!state.selectedSlot) return;
  timeView.hidden = true;
  bookingForm.hidden = false;
  stepLabel.textContent = "Шаг 3 из 3";
  selectedSlot.textContent = `${formatDateLabel(new Date(`${state.selectedSlot.date}T12:00:00`))}, ${state.selectedSlot.start_time}–${state.selectedSlot.end_time}`;
  document.querySelector('[name="client_name"]').focus();
}

function showTimeFromForm() {
  bookingForm.hidden = true;
  timeView.hidden = false;
  stepLabel.textContent = "Шаг 2 из 3";
}

function submitBooking(event) {
  event.preventDefault();
  formError.textContent = "";
  const data = new FormData(bookingForm);
  const clientName = String(data.get("client_name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const interest = String(data.get("interest") || "").trim();
  if (!data.get("consent")) {
    formError.textContent = "Для записи подтвердите согласие на обработку персональных данных.";
    return;
  }
  if (!clientName || !phone || !interest) return;
  const submitButton = submitBookingButton;
  submitButton.disabled = true;
  submitButton.textContent = "Запись принята";

  const bookingPayload = {
    action: "public_book",
    date: state.selectedSlot.date,
    start_time: state.selectedSlot.start_time,
    end_time: state.selectedSlot.end_time,
    client_name: clientName,
    phone,
    interest,
    consent: true,
    website: data.get("website") || "",
    idempotency_key: `website-${crypto.randomUUID()}`,
  };

  if (!CONFIG.demoMode) {
    fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(bookingPayload),
      keepalive: true,
    }).catch(() => {});
  }

  showSuccess();
}

function showSuccess() {
  bookingForm.hidden = true;
  successState.hidden = false;
  stepLabel.textContent = "Готово";
  setupCalendarActions();
  document.querySelector("#success-copy").textContent =
    `Пробный урок на ${formatDateLabel(new Date(`${state.selectedSlot.date}T12:00:00`))} в ${state.selectedSlot.start_time} подтверждён. Мы свяжемся с вами по телефону для деталей.`;
}

function calendarDateValue(date, time) {
  return new Date(`${date}T${time}:00+03:00`);
}

function calendarUtcValue(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function setupCalendarActions() {
  const slot = state.selectedSlot;
  if (!slot) return;

  const start = calendarDateValue(slot.date, slot.start_time);
  const end = calendarDateValue(slot.date, slot.end_time);
  const title = "Пробное занятие по дронам «АэрогениИ»";
  const location = "Киров, ул. Широтная, д. 2";
  const description = "Бесплатное пробное занятие. Практика с инструктором, оборудование на месте.";
  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", title);
  googleUrl.searchParams.set("dates", `${calendarUtcValue(start)}/${calendarUtcValue(end)}`);
  googleUrl.searchParams.set("details", description);
  googleUrl.searchParams.set("location", location);
  googleCalendarLink.href = googleUrl.toString();

  calendarButton.onclick = () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Aerogenii//Trial lesson//RU",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@airo-site-kirov.ru`,
      `DTSTAMP:${calendarUtcValue(new Date())}`,
      `DTSTART:${calendarUtcValue(start)}`,
      `DTEND:${calendarUtcValue(end)}`,
      `SUMMARY:${escapeIcsText(title)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `LOCATION:${escapeIcsText(location)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `probnoe-zanyatie-${slot.date}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}

function init() {
  state.dates = nextCalendarDates(14);
  state.selectedDate = isoDate(state.dates.find((date) => !isWeekend(date)));
  renderDates();
  loadSlots(state.selectedDate);
  dateList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-date]");
    if (button) chooseDate(button.dataset.date);
  });
  dateContinueButton.addEventListener("click", showTime);
  timeContinueButton.addEventListener("click", showForm);
  document.querySelector("#back-to-date-button").addEventListener("click", showDate);
  document.querySelector("#back-button").addEventListener("click", showTimeFromForm);
  consentInput.addEventListener("change", () => {
    const agreed = consentInput.checked;
    submitBookingButton.disabled = !agreed;
    consentHint.hidden = agreed;
  });
  submitBookingButton.disabled = true;
  consentHint.hidden = false;
  bookingForm.addEventListener("submit", submitBooking);
}

init();
if (window.lucide) window.lucide.createIcons();
