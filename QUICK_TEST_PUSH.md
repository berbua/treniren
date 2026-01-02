# 🧪 Szybki Test Push Notifications Lokalnie

## ✅ Tak, lokalnie też powinno zapytać!

Push notifications działają na `localhost` (bez HTTPS) - to jest wyjątek od reguły HTTPS.

## 🔍 Sprawdź konfigurację:

### 1. Czy masz VAPID keys w `.env.local`?

```bash
# Sprawdź
cat .env.local | grep VAPID
```

Powinieneś zobaczyć:
```
VAPID_PUBLIC_KEY="BN79qaq243S26_wGkQTIKZRF2J3X5niRcuzga0Ucpjpgzsq7KEvFV8HwIAnvQ5zPHjeMpf6Dkh9k2XeyVWwrR5k"
VAPID_PRIVATE_KEY="dZ1PVbRgYet3mGYg_549mfAzPGNpK5NBhL4pKy5Hmz8"
VAPID_SUBJECT="mailto:your-email@example.com"
```

### 2. Jeśli NIE masz - wygeneruj:

```bash
npm run generate-vapid-keys
```

Potem dodaj do `.env.local`:
```bash
VAPID_PUBLIC_KEY="wygenerowany-klucz-publiczny"
VAPID_PRIVATE_KEY="wygenerowany-klucz-prywatny"
VAPID_SUBJECT="mailto:twoj-email@example.com"
```

### 3. Zrestartuj serwer dev:

```bash
# Zatrzymaj serwer (Ctrl+C)
# Uruchom ponownie
npm run dev
```

## 🧪 Test:

1. Otwórz `http://localhost:2137`
2. Zaloguj się
3. Profil → Settings
4. Kliknij "Enable" przy "Push Notifications"
5. **Powinno pojawić się okno przeglądarki z prośbą o zgodę!**

## ⚠️ Jeśli okno się nie pojawia:

### Sprawdź konsolę przeglądarki (F12 → Console):

**Błąd 1: "Failed to get public key"**
```
❌ VAPID_PUBLIC_KEY not configured
```
**Rozwiązanie:** Dodaj VAPID keys do `.env.local` i zrestartuj serwer

**Błąd 2: "Service worker not available"**
```
❌ Service worker registration failed
```
**Rozwiązanie:** Sprawdź czy `/sw.js` jest dostępny (otwórz `http://localhost:2137/sw.js`)

**Błąd 3: "Notification permission denied"**
```
❌ Powiadomienia są zablokowane w przeglądarce
```
**Rozwiązanie:** 
- Chrome: 🔒 obok adresu → Notifications → Allow
- Firefox: 🔒 obok adresu → Notifications → Allow

### Sprawdź DevTools:

1. **F12** → **Application** → **Service Workers**
   - Powinien być zarejestrowany service worker
   - Status: "activated and is running"

2. **F12** → **Application** → **Storage** → **Notifications**
   - Sprawdź czy są jakieś zablokowane strony

3. **F12** → **Console**
   - Sprawdź czy są błędy (czerwone)

## ✅ Co powinno się stać:

1. Klikasz "Enable"
2. **Przeglądarka automatycznie wyświetla okno** z prośbą o zgodę
3. Klikasz "Allow"
4. Przycisk zmienia się na "Disable" ✅
5. Obok pojawia się ✅ (zielony checkmark)

## 🔧 Debug:

Jeśli nadal nie działa, sprawdź:

```bash
# 1. Czy serwer działa?
curl http://localhost:2137/api/push/public-key

# Powinno zwrócić:
# {"publicKey":"BN79qaq243S26_wGkQTIKZRF2J3X5niRcuzga0Ucpjpgzsq7KEvFV8HwIAnvQ5zPHjeMpf6Dkh9k2XeyVWwrR5k"}

# 2. Czy service worker jest dostępny?
curl http://localhost:2137/sw.js

# Powinno zwrócić kod JavaScript service workera
```

## 💡 Wskazówki:

- **Lokalnie działa na HTTP** - nie potrzebujesz HTTPS
- **Service Worker musi być zarejestrowany** - sprawdź w DevTools
- **VAPID keys muszą być w `.env.local`** - nie w `.env`
- **Zrestartuj serwer** po dodaniu VAPID keys



