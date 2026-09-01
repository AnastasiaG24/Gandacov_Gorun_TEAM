# Calculator Reduceri

Calculator Reduceri este o aplicație web simplă și modernă pentru calcularea reducerilor în MDL. Aplicația ajută utilizatorul să afle rapid valoarea reducerii și prețul final după aplicarea unui procent de reducere.

## Functionalitati principale

- Interfață completă în limba română.
- Calcul pentru valoarea reducerii și prețul final.
- Validare pentru câmpuri goale sau valori invalide.
- Calcul prin butonul „Calculează” sau prin apăsarea tastei Enter.
- Afișarea valorilor monetare cu exact două zecimale și moneda MDL.
- Istoric cu ultimele cinci calcule valide.
- Salvarea istoricului în localStorage, disponibil și după reîncărcarea paginii.
- Butoane pentru resetarea formularului și ștergerea istoricului.
- Design responsive pentru desktop, tabletă și mobil.

## Tehnologii folosite

- HTML5
- CSS3
- JavaScript vanilla
- localStorage pentru persistența istoricului
- Jest + jsdom pentru testele unitare

## Structura proiectului

| Fișier | Rol |
|---|---|
| `index.html` | Structura paginii |
| `style.css` | Stilizarea și designul responsive |
| `calculator.js` | Logica pură: validări, formule, reguli de istoric (fără DOM) |
| `script.js` | Legătura cu interfața: evenimente, afișare, localStorage |
| `tests/calculator.test.js` | Teste unitare pentru logica pură |
| `tests/ui.test.js` | Teste pentru interfață, pe pagina reală încărcată în jsdom |

## Formule folosite

```text
discountAmount = originalPrice * discountPercentage / 100
finalPrice = originalPrice - discountAmount
```

## Rulare

Deschide fișierul `index.html` într-un browser modern. Nu sunt necesare instalări, dependențe sau server local.

## Testare

Testele rulează cu Jest și un DOM simulat (jsdom).

```bash
npm install       # o singură dată
npm test          # rulează toate testele
npm run test:watch     # rulează testele la fiecare salvare
npm run test:coverage  # raport de acoperire
```

Suita conține 81 de teste, împărțite pe două niveluri:

- **Teste unitare** (`tests/calculator.test.js`) — funcțiile pure din `calculator.js`:
  conversia textului în număr, formatarea monetară, validările, formula reducerii
  și regulile istoricului (maximum cinci intrări, ordine, imutabilitate).
- **Teste de interfață** (`tests/ui.test.js`) — încarcă `index.html` real în jsdom
  și verifică fluxul complet: calcul, mesaje de eroare, `aria-invalid`, istoric,
  persistența în localStorage, butoanele „Resetează” și „Șterge istoricul”,
  precum și comportamentul la date corupte în localStorage.

Acoperire curentă: 97.87% instrucțiuni, 91.66% ramuri.

### Observație

Câmpurile de intrare sunt `input[type="number"]`, iar browserul golește valoarea
dacă separatorul zecimal este virgulă. Prin urmare se folosește punctul (`19.99`).
Comportamentul este fixat printr-un test dedicat.
