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

## Formule folosite

```text
discountAmount = originalPrice * discountPercentage / 100
finalPrice = originalPrice - discountAmount
```

## Rulare

Deschide fișierul `index.html` într-un browser modern. Nu sunt necesare instalări, dependențe sau server local.
