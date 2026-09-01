/**
 * Teste unitare pentru logica pură din `calculator.js`.
 * Nu au nevoie de DOM, browser sau localStorage.
 *
 * @jest-environment node
 */

const calculator = require("../calculator");

const {
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
} = calculator;

describe("parseNumber", () => {
  test("convertește un text zecimal cu punct", () => {
    expect(parseNumber("1200.50")).toBe(1200.5);
  });

  test("acceptă virgula ca separator zecimal", () => {
    expect(parseNumber("1200,50")).toBe(1200.5);
  });

  test("păstrează numerele primite direct", () => {
    expect(parseNumber(99)).toBe(99);
  });

  test("întoarce NaN pentru text nenumeric", () => {
    expect(parseNumber("abc")).toBeNaN();
  });

  test("întoarce NaN pentru valori cu mai mulți separatori zecimali", () => {
    expect(parseNumber("1,2,3")).toBeNaN();
  });
});

describe("formatMoney", () => {
  test.each([
    [0, "0.00 MDL"],
    [1200, "1200.00 MDL"],
    [180.5, "180.50 MDL"],
    [1019.999, "1020.00 MDL"]
  ])("formatează %p ca %p", (value, expected) => {
    expect(formatMoney(value)).toBe(expected);
  });

  test("folosește exact două zecimale și pentru valori foarte mici", () => {
    expect(formatMoney(0.004)).toBe("0.00 MDL");
  });
});

describe("validatePrice", () => {
  test("acceptă un preț pozitiv", () => {
    expect(validatePrice("1200")).toEqual({ isValid: true, value: 1200, message: "" });
  });

  test("acceptă cea mai mică valoare admisă (0.01)", () => {
    expect(validatePrice("0.01").isValid).toBe(true);
  });

  test("respinge câmpul gol", () => {
    expect(validatePrice("")).toMatchObject({ isValid: false, message: MESSAGES.priceRequired });
  });

  test("respinge un câmp format doar din spații", () => {
    expect(validatePrice("   ")).toMatchObject({ isValid: false, message: MESSAGES.priceRequired });
  });

  test("respinge valoarea zero", () => {
    expect(validatePrice("0")).toMatchObject({ isValid: false, message: MESSAGES.priceInvalid });
  });

  test("respinge valorile negative", () => {
    expect(validatePrice("-50")).toMatchObject({ isValid: false, message: MESSAGES.priceInvalid });
  });

  test("respinge textul nenumeric", () => {
    expect(validatePrice("o sută")).toMatchObject({ isValid: false, message: MESSAGES.priceInvalid });
  });

  test("respinge valoarea Infinity", () => {
    expect(validatePrice("Infinity")).toMatchObject({ isValid: false, message: MESSAGES.priceInvalid });
  });
});

describe("validatePercentage", () => {
  test("acceptă un procent din interval", () => {
    expect(validatePercentage("15")).toEqual({ isValid: true, value: 15, message: "" });
  });

  test.each(["0", "100"])("acceptă limita %s", (raw) => {
    expect(validatePercentage(raw).isValid).toBe(true);
  });

  test("respinge câmpul gol", () => {
    expect(validatePercentage("")).toMatchObject({
      isValid: false,
      message: MESSAGES.percentageRequired
    });
  });

  test.each(["-1", "101", "150"])("respinge valoarea din afara intervalului: %s", (raw) => {
    expect(validatePercentage(raw)).toMatchObject({
      isValid: false,
      message: MESSAGES.percentageInvalid
    });
  });

  test("respinge textul nenumeric", () => {
    expect(validatePercentage("zece")).toMatchObject({
      isValid: false,
      message: MESSAGES.percentageInvalid
    });
  });
});

describe("validate", () => {
  test("întoarce valorile numerice când ambele câmpuri sunt corecte", () => {
    expect(validate("1200", "15")).toEqual({
      isValid: true,
      originalPrice: 1200,
      discountPercentage: 15,
      errors: { originalPrice: "", discountPercentage: "" }
    });
  });

  test("raportează ambele erori simultan, nu doar prima", () => {
    const result = validate("", "");

    expect(result.isValid).toBe(false);
    expect(result.errors.originalPrice).toBe(MESSAGES.priceRequired);
    expect(result.errors.discountPercentage).toBe(MESSAGES.percentageRequired);
  });

  test("este invalid dacă doar procentul este greșit", () => {
    const result = validate("1200", "120");

    expect(result.isValid).toBe(false);
    expect(result.errors.originalPrice).toBe("");
    expect(result.errors.discountPercentage).toBe(MESSAGES.percentageInvalid);
  });
});

describe("calculateDiscount", () => {
  test.each([
    [1200, 15, 180, 1020],
    [100, 0, 0, 100],
    [100, 100, 100, 0],
    [250, 50, 125, 125],
    [19.99, 10, 1.999, 17.991]
  ])(
    "preț %p cu %p%% => reducere %p, final %p",
    (price, percentage, expectedDiscount, expectedFinal) => {
      const result = calculateDiscount(price, percentage);

      expect(result.discountAmount).toBeCloseTo(expectedDiscount, 10);
      expect(result.finalPrice).toBeCloseTo(expectedFinal, 10);
    }
  );

  test("reducerea plus prețul final dau întotdeauna prețul inițial", () => {
    const price = 833.33;
    const { discountAmount, finalPrice } = calculateDiscount(price, 37.5);

    expect(discountAmount + finalPrice).toBeCloseTo(price, 10);
  });

  test("nu modifică rezultatul afișat pentru valori cu multe zecimale", () => {
    const { discountAmount, finalPrice } = calculateDiscount(19.99, 10);

    expect(formatMoney(discountAmount)).toBe("2.00 MDL");
    expect(formatMoney(finalPrice)).toBe("17.99 MDL");
  });
});

describe("isValidHistoryItem", () => {
  const validItem = {
    originalPrice: 1200,
    discountPercentage: 15,
    discountAmount: 180,
    finalPrice: 1020,
    createdAt: "01.09.2026, 12:00:00"
  };

  test("acceptă o intrare completă", () => {
    expect(isValidHistoryItem(validItem)).toBe(true);
  });

  test.each([null, undefined, 42, "text", []])("respinge valoarea %p", (value) => {
    expect(isValidHistoryItem(value)).toBe(false);
  });

  test("respinge o intrare cu un câmp lipsă", () => {
    const { finalPrice, ...incomplete } = validItem;
    expect(isValidHistoryItem(incomplete)).toBe(false);
  });

  test("respinge o intrare cu câmp de tip greșit", () => {
    expect(isValidHistoryItem({ ...validItem, discountPercentage: "15" })).toBe(false);
  });
});

describe("parseHistory", () => {
  const item = {
    originalPrice: 1200,
    discountPercentage: 15,
    discountAmount: 180,
    finalPrice: 1020,
    createdAt: "01.09.2026, 12:00:00"
  };

  test("citește o listă validă", () => {
    expect(parseHistory(JSON.stringify([item]))).toEqual([item]);
  });

  test("întoarce listă goală pentru null (nimic salvat)", () => {
    expect(parseHistory(null)).toEqual([]);
  });

  test("întoarce listă goală pentru JSON invalid", () => {
    expect(parseHistory("{ nu este json")).toEqual([]);
  });

  test("întoarce listă goală dacă valoarea salvată nu este un array", () => {
    expect(parseHistory(JSON.stringify({ originalPrice: 10 }))).toEqual([]);
  });

  test("elimină intrările corupte în loc să arunce eroare la afișare", () => {
    const raw = JSON.stringify([item, { originalPrice: "text" }, null]);
    expect(parseHistory(raw)).toEqual([item]);
  });

  test("taie istoricul salvat la maximum cinci intrări", () => {
    const raw = JSON.stringify(Array.from({ length: 8 }, () => item));
    expect(parseHistory(raw)).toHaveLength(MAX_HISTORY_ITEMS);
  });
});

describe("createHistoryItem", () => {
  const calculation = {
    originalPrice: 1200,
    discountPercentage: 15,
    discountAmount: 180,
    finalPrice: 1020
  };

  test("copiază toate valorile calculului", () => {
    expect(createHistoryItem(calculation, new Date(2026, 8, 1, 12, 0, 0))).toMatchObject(calculation);
  });

  test("adaugă marcajul de timp în format românesc", () => {
    const item = createHistoryItem(calculation, new Date(2026, 8, 1, 12, 0, 0));

    expect(item.createdAt).toBe(new Date(2026, 8, 1, 12, 0, 0).toLocaleString("ro-RO"));
  });

  test("folosește data curentă când nu este furnizată una", () => {
    expect(typeof createHistoryItem(calculation).createdAt).toBe("string");
  });
});

describe("addToHistory", () => {
  const makeItem = (originalPrice) => ({
    originalPrice,
    discountPercentage: 10,
    discountAmount: originalPrice / 10,
    finalPrice: originalPrice * 0.9,
    createdAt: "01.09.2026, 12:00:00"
  });

  test("adaugă intrarea nouă la început", () => {
    const result = addToHistory([makeItem(100)], makeItem(200));

    expect(result.map((entry) => entry.originalPrice)).toEqual([200, 100]);
  });

  test("păstrează cel mult cinci intrări", () => {
    const full = [1, 2, 3, 4, 5].map(makeItem);
    const result = addToHistory(full, makeItem(6));

    expect(result).toHaveLength(MAX_HISTORY_ITEMS);
    expect(result.map((entry) => entry.originalPrice)).toEqual([6, 1, 2, 3, 4]);
  });

  test("nu modifică lista primită (funcție pură)", () => {
    const original = [makeItem(100)];
    addToHistory(original, makeItem(200));

    expect(original).toHaveLength(1);
    expect(original[0].originalPrice).toBe(100);
  });
});
