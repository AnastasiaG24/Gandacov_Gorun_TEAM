/**
 * Logica pură a calculatorului de reduceri.
 *
 * Modulul nu atinge DOM-ul și nu accesează localStorage: primește valori,
 * întoarce valori. Astfel poate fi testat unitar fără browser, iar `script.js`
 * rămâne responsabil doar de legătura cu interfața.
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "discountCalculatorHistory";
  const MAX_HISTORY_ITEMS = 5;

  const MESSAGES = {
    priceRequired: "Introduceți prețul inițial.",
    priceInvalid: "Prețul inițial trebuie să fie mai mare decât zero.",
    percentageRequired: "Introduceți procentul reducerii.",
    percentageInvalid: "Procentul reducerii trebuie să fie între 0 și 100."
  };

  /**
   * Transformă textul introdus în număr, acceptând virgula ca separator zecimal.
   * @param {unknown} value
   * @returns {number} NaN dacă textul nu este numeric.
   */
  function parseNumber(value) {
    return Number(String(value).replace(",", "."));
  }

  /**
   * Formatează o sumă cu exact două zecimale și moneda MDL.
   * @param {number} value
   * @returns {string}
   */
  function formatMoney(value) {
    return `${value.toFixed(2)} MDL`;
  }

  /**
   * Validează prețul inițial: obligatoriu, numeric și strict pozitiv.
   * @param {string} rawValue
   * @returns {{isValid: boolean, value: number, message: string}}
   */
  function validatePrice(rawValue) {
    const value = parseNumber(rawValue);

    if (String(rawValue).trim() === "") {
      return { isValid: false, value, message: MESSAGES.priceRequired };
    }

    if (!Number.isFinite(value) || value <= 0) {
      return { isValid: false, value, message: MESSAGES.priceInvalid };
    }

    return { isValid: true, value, message: "" };
  }

  /**
   * Validează procentul reducerii: obligatoriu, numeric și în intervalul [0, 100].
   * @param {string} rawValue
   * @returns {{isValid: boolean, value: number, message: string}}
   */
  function validatePercentage(rawValue) {
    const value = parseNumber(rawValue);

    if (String(rawValue).trim() === "") {
      return { isValid: false, value, message: MESSAGES.percentageRequired };
    }

    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return { isValid: false, value, message: MESSAGES.percentageInvalid };
    }

    return { isValid: true, value, message: "" };
  }

  /**
   * Validează ambele câmpuri deodată și raportează toate erorile găsite.
   * @param {string} rawPrice
   * @param {string} rawPercentage
   */
  function validate(rawPrice, rawPercentage) {
    const price = validatePrice(rawPrice);
    const percentage = validatePercentage(rawPercentage);

    return {
      isValid: price.isValid && percentage.isValid,
      originalPrice: price.value,
      discountPercentage: percentage.value,
      errors: {
        originalPrice: price.message,
        discountPercentage: percentage.message
      }
    };
  }

  /**
   * discountAmount = originalPrice * discountPercentage / 100
   * finalPrice     = originalPrice - discountAmount
   * @param {number} originalPrice
   * @param {number} discountPercentage
   * @returns {{discountAmount: number, finalPrice: number}}
   */
  function calculateDiscount(originalPrice, discountPercentage) {
    const discountAmount = (originalPrice * discountPercentage) / 100;
    const finalPrice = originalPrice - discountAmount;

    return { discountAmount, finalPrice };
  }

  /**
   * Verifică dacă o intrare din istoric are toate câmpurile numerice necesare
   * pentru afișare. Protejează `renderHistory` de date corupte în localStorage.
   * @param {unknown} item
   * @returns {boolean}
   */
  function isValidHistoryItem(item) {
    return (
      typeof item === "object" &&
      item !== null &&
      Number.isFinite(item.originalPrice) &&
      Number.isFinite(item.discountPercentage) &&
      Number.isFinite(item.discountAmount) &&
      Number.isFinite(item.finalPrice)
    );
  }

  /**
   * Transformă conținutul brut din localStorage într-un istoric utilizabil.
   * Orice JSON invalid, tip greșit sau intrare coruptă este ignorat.
   * @param {string|null} rawJson
   * @returns {Array<object>}
   */
  function parseHistory(rawJson) {
    try {
      const savedHistory = JSON.parse(rawJson);

      if (!Array.isArray(savedHistory)) {
        return [];
      }

      return savedHistory.filter(isValidHistoryItem).slice(0, MAX_HISTORY_ITEMS);
    } catch {
      return [];
    }
  }

  /**
   * Construiește o intrare de istoric. Data este injectabilă pentru teste.
   * @param {{originalPrice: number, discountPercentage: number, discountAmount: number, finalPrice: number}} calculation
   * @param {Date} [date]
   */
  function createHistoryItem(calculation, date = new Date()) {
    return {
      originalPrice: calculation.originalPrice,
      discountPercentage: calculation.discountPercentage,
      discountAmount: calculation.discountAmount,
      finalPrice: calculation.finalPrice,
      createdAt: date.toLocaleString("ro-RO")
    };
  }

  /**
   * Adaugă intrarea la începutul istoricului și păstrează maximum cinci calcule.
   * Funcție pură: întoarce o listă nouă, nu modifică lista primită.
   * @param {Array<object>} history
   * @param {object} item
   * @returns {Array<object>}
   */
  function addToHistory(history, item) {
    return [item, ...history].slice(0, MAX_HISTORY_ITEMS);
  }

  const api = {
    STORAGE_KEY,
    MAX_HISTORY_ITEMS,
    MESSAGES,
    parseNumber,
    formatMoney,
    validatePrice,
    validatePercentage,
    validate,
    calculateDiscount,
    isValidHistoryItem,
    parseHistory,
    createHistoryItem,
    addToHistory
  };

  // Disponibil atât ca modul CommonJS (teste Jest), cât și ca global (browser).
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.DiscountCalculator = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
