# FolkBase

**FolkBase** to aplikacja webowa typu SPA do zarządzania zespołem folklorystycznym. Projekt rozwiązuje problemy logistyczne grupy artystycznej, łącząc funkcje planowania, komunikacji i inwentaryzacji w jednym, responsywnym interfejsie (Mobile First).

Aplikacja została zrealizowana w ramach pracy inżynierskiej, kładąc szczególny nacisk na ochronę danych osobowych (RODO) oraz wygodę użytkowania na urządzeniach mobilnych.

## Kluczowe Funkcjonalności

### Grafik i Obecność
* **Responsywny Kalendarz:** Widok siatki na komputerach i agendy (listy) na telefonach.
* **Wydarzenia:** Obsługa prób, koncertów i wyjazdów wielodniowych.
* **Frekwencja:** Elektroniczny dziennik obecności zliczający statystyki w czasie rzeczywistym.

### Użytkownicy i Bezpieczeństwo
* **System Ról:**
    * `ADMIN`: Pełny dostęp do systemu i danych wrażliwych.
    * `INSTRUCTOR`: Zarządzanie grafikiem i sprawdzanie obecności.
    * `MEMBER`: Podgląd harmonogramu i edycja własnego profilu.
* **Ochrona RODO:** Automatyczne ukrywanie danych wrażliwych (PESEL, adres) przed nieuprawnionymi osobami.

### Magazyn i Dodatki
* **Ekwipunek:** Cyfrowy podgląd strojów przypisanych do tancerza.
* **Moduły:** Repertuar, Ankiety, Galeria.

---

## Technologie

Projekt zbudowano w oparciu o nowoczesny stack technologiczny:

* **Frontend:** React 18, TypeScript, Vite
* **UI/UX:** Tailwind CSS (RWD, Dark Mode)
* **Backend (BaaS):** Firebase (Auth, Firestore, Storage, Hosting)
* **Inne:** `date-fns`, `react-router-dom`, `lucide-react`

---

## Instalacja i Uruchomienie

Aby uruchomić projekt lokalnie:

1.  **Sklonuj repozytorium:**
    ```bash
    git clone [https://github.com/mirokosz/folkbase.git](https://github.com/mirokosz/folkbase.git)
    cd folkbase
    ```

2.  **Zainstaluj zależności:**
    ```bash
    npm install
    ```

3.  **Skonfiguruj środowisko:**
    Utwórz plik `.env` w folderze `frontend` (lub głównym) i uzupełnij go kluczami Firebase:
    ```env
    VITE_FIREBASE_API_KEY=
    VITE_FIREBASE_AUTH_DOMAIN=
    VITE_FIREBASE_PROJECT_ID=
    ...
    ```

4.  **Uruchom aplikację:**
    ```bash
    npm run dev
    ```

---

## Wdrożenie

Wersja produkcyjna jest hostowana na **Firebase Hosting**.
```bash
npm run build
firebase deploy