const STORAGE_KEY = "discountCalculatorHistory";
const MAX_HISTORY_ITEMS = 5;

const form = document.querySelector("#discount-form");
const originalPriceInput = document.querySelector("#original-price");
const discountPercentageInput = document.querySelector("#discount-percentage");
const originalPriceError = document.querySelector("#original-price-error");
const discountPercentageError = document.querySelector("#discount-percentage-error");
const discountAmountOutput = document.querySelector("#discount-amount");
const finalPriceOutput = document.querySelector("#final-price");
const resetButton = document.querySelector("#reset-button");
const clearHistoryButton = document.querySelector("#clear-history-button");
const historyList = document.querySelector("#history-list");
const emptyHistory = document.querySelector("#empty-history");

let history = loadHistory();

function parseNumber(value) {
  return Number(String(value).replace(",", "."));
}

function formatMoney(value) {
  return `${value.toFixed(2)} MDL`;
}

function setError(input, errorElement, message) {
  input.setAttribute("aria-invalid", message ? "true" : "false");
  errorElement.textContent = message;
}

function validateInputs() {
  const originalPrice = parseNumber(originalPriceInput.value);
  const discountPercentage = parseNumber(discountPercentageInput.value);
  let isValid = true;

  if (originalPriceInput.value.trim() === "") {
    setError(originalPriceInput, originalPriceError, "Introduceți prețul inițial.");
    isValid = false;
  } else if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
    setError(originalPriceInput, originalPriceError, "Prețul inițial trebuie să fie mai mare decât zero.");
    isValid = false;
  } else {
    setError(originalPriceInput, originalPriceError, "");
  }

  if (discountPercentageInput.value.trim() === "") {
    setError(discountPercentageInput, discountPercentageError, "Introduceți procentul reducerii.");
    isValid = false;
  } else if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
    setError(discountPercentageInput, discountPercentageError, "Procentul reducerii trebuie să fie între 0 și 100.");
    isValid = false;
  } else {
    setError(discountPercentageInput, discountPercentageError, "");
  }

  return {
    isValid,
    originalPrice,
    discountPercentage
  };
}

function calculateDiscount(originalPrice, discountPercentage) {
  const discountAmount = originalPrice * discountPercentage / 100;
  const finalPrice = originalPrice - discountAmount;

  return {
    discountAmount,
    finalPrice
  };
}

function updateResults(discountAmount, finalPrice) {
  discountAmountOutput.textContent = formatMoney(discountAmount);
  finalPriceOutput.textContent = formatMoney(finalPrice);
}

function resetResults() {
  updateResults(0, 0);
}

function loadHistory() {
  try {
    const savedHistory = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedHistory) ? savedHistory.slice(0, MAX_HISTORY_ITEMS) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function addHistoryItem(originalPrice, discountPercentage, discountAmount, finalPrice) {
  // Păstrează doar ultimele cinci calcule valide.
  const item = {
    originalPrice,
    discountPercentage,
    discountAmount,
    finalPrice,
    createdAt: new Date().toLocaleString("ro-RO")
  };

  history = [item, ...history].slice(0, MAX_HISTORY_ITEMS);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  emptyHistory.classList.toggle("hidden", history.length > 0);

  history.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.className = "history-item";
    listItem.innerHTML = `
      <strong>${formatMoney(item.originalPrice)} cu ${item.discountPercentage.toFixed(2)}% reducere</strong>
      <span>Reducere: ${formatMoney(item.discountAmount)} | Final: ${formatMoney(item.finalPrice)}</span>
      <small>${item.createdAt}</small>
    `;
    historyList.appendChild(listItem);
  });
}

function handleSubmit(event) {
  event.preventDefault();

  const validation = validateInputs();
  if (!validation.isValid) {
    resetResults();
    return;
  }

  const { discountAmount, finalPrice } = calculateDiscount(
    validation.originalPrice,
    validation.discountPercentage
  );

  updateResults(discountAmount, finalPrice);
  addHistoryItem(validation.originalPrice, validation.discountPercentage, discountAmount, finalPrice);
}

function handleReset() {
  form.reset();
  setError(originalPriceInput, originalPriceError, "");
  setError(discountPercentageInput, discountPercentageError, "");
  resetResults();
  originalPriceInput.focus();
}

function clearHistory() {
  history = [];
  saveHistory();
  renderHistory();
}

form.addEventListener("submit", handleSubmit);
resetButton.addEventListener("click", handleReset);
clearHistoryButton.addEventListener("click", clearHistory);

renderHistory();
