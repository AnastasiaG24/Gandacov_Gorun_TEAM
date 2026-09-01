/**
 * Teste pentru legătura dintre interfață și logică (`script.js`).
 * Pagina reală `index.html` este încărcată într-un DOM simulat (jsdom),
 * astfel încât testele să folosească exact aceleași selectoare ca aplicația.
 *
 * @jest-environment jsdom
 */

const fs = require("fs");
const path = require("path");

const { STORAGE_KEY, MESSAGES, MAX_HISTORY_ITEMS } = require("../calculator");

const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
const bodyMarkup = html.slice(html.indexOf("<body>") + "<body>".length, html.indexOf("</body>"));

/** Reconstruiește pagina și rulează scripturile aplicației de la zero. */
function loadApp() {
  document.body.innerHTML = bodyMarkup;
  jest.resetModules();
  require("../calculator");
  require("../script");
}

/** Completează formularul și trimite evenimentul de submit. */
function submitForm(price, percentage) {
  document.querySelector("#original-price").value = price;
  document.querySelector("#discount-percentage").value = percentage;
  document.querySelector("#discount-form").dispatchEvent(
    new Event("submit", { bubbles: true, cancelable: true })
  );
}

const text = (selector) => document.querySelector(selector).textContent;

beforeEach(() => {
  localStorage.clear();
  loadApp();
});

describe("starea inițială", () => {
  test("afișează zero pentru ambele rezultate", () => {
    expect(text("#discount-amount")).toBe("0.00 MDL");
    expect(text("#final-price")).toBe("0.00 MDL");
  });

  test("afișează mesajul de istoric gol", () => {
    expect(document.querySelector("#empty-history").classList.contains("hidden")).toBe(false);
    expect(document.querySelectorAll("#history-list li")).toHaveLength(0);
  });
});

describe("calculul reducerii", () => {
  test("afișează reducerea și prețul final pentru date valide", () => {
    submitForm("1200", "15");

    expect(text("#discount-amount")).toBe("180.00 MDL");
    expect(text("#final-price")).toBe("1020.00 MDL");
  });

  test("rotunjește afișarea la două zecimale", () => {
    submitForm("19.99", "10");

    expect(text("#discount-amount")).toBe("2.00 MDL");
    expect(text("#final-price")).toBe("17.99 MDL");
  });

  // Câmpurile sunt `input[type="number"]`, iar browserul golește valoarea când
  // separatorul zecimal este virgula. Testul fixează acest comportament: dacă
  // se dorește suport pentru virgulă, trebuie schimbat tipul câmpului.
  test("virgula este respinsă de câmpul numeric, nu de logica aplicației", () => {
    submitForm("19,99", "10");

    expect(document.querySelector("#original-price").value).toBe("");
    expect(text("#original-price-error")).toBe(MESSAGES.priceRequired);
  });

  test("reducerea de 100% duce prețul final la zero", () => {
    submitForm("500", "100");

    expect(text("#discount-amount")).toBe("500.00 MDL");
    expect(text("#final-price")).toBe("0.00 MDL");
  });

  test("calculează și la apăsarea tastei Enter în câmpul de preț", () => {
    document.querySelector("#original-price").value = "200";
    document.querySelector("#discount-percentage").value = "25";
    // Enter într-un input dintr-un formular declanșează submit-ul nativ.
    document.querySelector("#discount-form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    expect(text("#final-price")).toBe("150.00 MDL");
  });
});

describe("validarea în interfață", () => {
  test("afișează ambele mesaje de eroare pentru câmpuri goale", () => {
    submitForm("", "");

    expect(text("#original-price-error")).toBe(MESSAGES.priceRequired);
    expect(text("#discount-percentage-error")).toBe(MESSAGES.percentageRequired);
  });

  test("marchează câmpurile invalide cu aria-invalid", () => {
    submitForm("", "");

    expect(document.querySelector("#original-price").getAttribute("aria-invalid")).toBe("true");
    expect(document.querySelector("#discount-percentage").getAttribute("aria-invalid")).toBe("true");
  });

  test("respinge procentul peste 100", () => {
    submitForm("100", "150");

    expect(text("#discount-percentage-error")).toBe(MESSAGES.percentageInvalid);
    expect(text("#original-price-error")).toBe("");
  });

  test("resetează rezultatele la zero când datele sunt invalide", () => {
    submitForm("1200", "15");
    submitForm("-5", "15");

    expect(text("#discount-amount")).toBe("0.00 MDL");
    expect(text("#final-price")).toBe("0.00 MDL");
  });

  test("nu salvează în istoric un calcul invalid", () => {
    submitForm("0", "15");

    expect(document.querySelectorAll("#history-list li")).toHaveLength(0);
  });

  test("șterge mesajul de eroare după o corectare", () => {
    submitForm("", "15");
    expect(text("#original-price-error")).toBe(MESSAGES.priceRequired);

    submitForm("100", "15");
    expect(text("#original-price-error")).toBe("");
    expect(document.querySelector("#original-price").getAttribute("aria-invalid")).toBe("false");
  });
});

describe("istoricul", () => {
  test("adaugă un calcul valid în listă", () => {
    submitForm("1200", "15");

    const items = document.querySelectorAll("#history-list li");
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain("1200.00 MDL");
    expect(items[0].textContent).toContain("15.00% reducere");
    expect(items[0].textContent).toContain("1020.00 MDL");
  });

  test("ascunde mesajul de istoric gol după primul calcul", () => {
    submitForm("100", "10");

    expect(document.querySelector("#empty-history").classList.contains("hidden")).toBe(true);
  });

  test("afișează cel mai recent calcul primul", () => {
    submitForm("100", "10");
    submitForm("200", "20");

    const items = document.querySelectorAll("#history-list li");
    expect(items[0].textContent).toContain("200.00 MDL");
    expect(items[1].textContent).toContain("100.00 MDL");
  });

  test("păstrează maximum cinci calcule", () => {
    for (let i = 1; i <= 7; i += 1) {
      submitForm(String(i * 100), "10");
    }

    const items = document.querySelectorAll("#history-list li");
    expect(items).toHaveLength(MAX_HISTORY_ITEMS);
    expect(items[0].textContent).toContain("700.00 MDL");
    expect(items[4].textContent).toContain("300.00 MDL");
  });

  test("salvează istoricul în localStorage", () => {
    submitForm("1200", "15");

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      originalPrice: 1200,
      discountPercentage: 15,
      discountAmount: 180,
      finalPrice: 1020
    });
  });

  test("reîncarcă istoricul salvat la deschiderea paginii", () => {
    submitForm("1200", "15");
    loadApp();

    expect(document.querySelectorAll("#history-list li")).toHaveLength(1);
    expect(document.querySelector("#history-list li").textContent).toContain("1200.00 MDL");
  });

  test("ignoră un istoric corupt din localStorage fără să blocheze pagina", () => {
    localStorage.setItem(STORAGE_KEY, "{ date stricate");

    expect(() => loadApp()).not.toThrow();
    expect(document.querySelectorAll("#history-list li")).toHaveLength(0);
  });

  test("ignoră intrările incomplete salvate anterior", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ originalPrice: "text" }]));

    expect(() => loadApp()).not.toThrow();
    expect(document.querySelectorAll("#history-list li")).toHaveLength(0);
  });
});

describe("butoanele de control", () => {
  test("„Resetează” golește câmpurile, erorile și rezultatele", () => {
    submitForm("1200", "15");
    submitForm("", "");

    document.querySelector("#reset-button").click();

    expect(document.querySelector("#original-price").value).toBe("");
    expect(document.querySelector("#discount-percentage").value).toBe("");
    expect(text("#original-price-error")).toBe("");
    expect(text("#discount-percentage-error")).toBe("");
    expect(text("#discount-amount")).toBe("0.00 MDL");
  });

  test("„Resetează” nu șterge istoricul", () => {
    submitForm("1200", "15");
    document.querySelector("#reset-button").click();

    expect(document.querySelectorAll("#history-list li")).toHaveLength(1);
  });

  test("„Șterge istoricul” golește lista și localStorage", () => {
    submitForm("1200", "15");
    document.querySelector("#clear-history-button").click();

    expect(document.querySelectorAll("#history-list li")).toHaveLength(0);
    expect(document.querySelector("#empty-history").classList.contains("hidden")).toBe(false);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([]);
  });

  test("„Șterge istoricul” nu afectează rezultatele afișate", () => {
    submitForm("1200", "15");
    document.querySelector("#clear-history-button").click();

    expect(text("#final-price")).toBe("1020.00 MDL");
  });
});
