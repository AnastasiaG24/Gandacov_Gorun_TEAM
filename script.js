/**
 * Legătura dintre interfață și logica de calcul.
 *
 * Aici se face doar munca de DOM și persistență; formulele, validările și
 * regulile de istoric stau în `calculator.js`.
 */
(function () {
  "use strict";

  const {
    STORAGE_KEY,
    formatMoney,
    validate,
    calculateDiscount,
    parseHistory,
    createHistoryItem,
    addToHistory
  } = DiscountCalculator;

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

  // Scriptul poate fi încărcat și în afara paginii (de exemplu în teste).
  if (!form) {
    return;
  }

  let history = loadHistory();

  function setError(input, errorElement, message) {
    input.setAttribute("aria-invalid", message ? "true" : "false");
    errorElement.textContent = message;
  }

  function showValidationErrors(errors) {
    setError(originalPriceInput, originalPriceError, errors.originalPrice);
    setError(discountPercentageInput, discountPercentageError, errors.discountPercentage);
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
      return parseHistory(localStorage.getItem(STORAGE_KEY));
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Stocarea locală poate fi indisponibilă (mod privat, cotă depășită).
      // Aplicația continuă să funcționeze, doar fără persistență.
    }
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

    const validation = validate(originalPriceInput.value, discountPercentageInput.value);
    showValidationErrors(validation.errors);

    if (!validation.isValid) {
      resetResults();
      return;
    }

    const { discountAmount, finalPrice } = calculateDiscount(
      validation.originalPrice,
      validation.discountPercentage
    );

    updateResults(discountAmount, finalPrice);

    history = addToHistory(
      history,
      createHistoryItem({
        originalPrice: validation.originalPrice,
        discountPercentage: validation.discountPercentage,
        discountAmount,
        finalPrice
      })
    );
    saveHistory();
    renderHistory();
  }

  function handleReset() {
    form.reset();
    showValidationErrors({ originalPrice: "", discountPercentage: "" });
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
})();
