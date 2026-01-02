# 🧪 Testowanie Push Notifications

## 📍 Gdzie pojawi się okno zgody na powiadomienia?

Po kliknięciu **"Enable"** przy "Push Notifications" w profilu, przeglądarka **automatycznie** wyświetli okno dialogowe z prośbą o zgodę.

### Chrome / Edge (Desktop)

Okno pojawi się w **górnym lewym rogu** przeglądarki (obok paska adresu):

```
┌─────────────────────────────────────────┐
│ 🔔 treniren.app wants to                │
│    Show notifications                   │
│                                         │
│    [ Block ]  [ Allow ]                │
└─────────────────────────────────────────┘
```

### Firefox (Desktop)

Okno pojawi się w **centrum ekranu**:

```
┌─────────────────────────────────────────┐
│ treniren.app wants to                   │
│                                         │
│ Send you notifications                  │
│                                         │
│ [ Not Now ]  [ Allow Notifications ]   │
└─────────────────────────────────────────┘
```

### Safari (Desktop)

Okno pojawi się w **górnej części** okna:

```
┌─────────────────────────────────────────┐
│ treniren.app would like to send you     │
│ push notifications                      │
│                                         │
│ [ Don't Allow ]  [ Allow ]              │
└─────────────────────────────────────────┘
```

### Mobile (iOS Safari / Chrome)

Okno pojawi się jako **popup na dole ekranu**:

```
┌─────────────────────────────────────────┐
│ treniren.app wants to                   │
│ Send you notifications                  │
│                                         │
│ [ Don't Allow ]  [ Allow ]              │
└─────────────────────────────────────────┘
```

## ✅ Co zrobić?

1. **Kliknij "Allow"** (lub "Allow Notifications") w oknie dialogowym
2. Gotowe! Powiadomienia są włączone

## ⚠️ Jeśli okno się nie pojawi:

### 1. Sprawdź, czy używasz HTTPS (lub localhost)

Push notifications **wymagają HTTPS** (lub localhost w development). Jeśli używasz `http://` (nie `https://`), okno się nie pojawi.

**Rozwiązanie:**
- W development: `http://localhost:2137` działa ✅
- W produkcji: Musi być `https://` ✅

### 2. Sprawdź ustawienia powiadomień w przeglądarce

#### Chrome:
1. Kliknij ikonę 🔒 (lub 🔔) obok paska adresu
2. Znajdź "Notifications"
3. Ustaw na "Allow"

#### Firefox:
1. Kliknij ikonę 🔒 obok paska adresu
2. Znajdź "Notifications"
3. Kliknij "Allow"

#### Safari:
1. Safari → Settings → Websites → Notifications
2. Znajdź swoją stronę
3. Ustaw na "Allow"

### 3. Sprawdź, czy powiadomienia nie są zablokowane globalnie

#### macOS:
1. System Settings → Notifications
2. Znajdź przeglądarkę (Chrome/Firefox/Safari)
3. Upewnij się, że powiadomienia są włączone

#### Windows:
1. Settings → System → Notifications
2. Znajdź przeglądarkę
3. Upewnij się, że powiadomienia są włączone

### 4. Sprawdź konsolę przeglądarki

Otwórz DevTools (F12) → Console i sprawdź czy są błędy:

```javascript
// Jeśli widzisz:
"Service worker registration failed"
→ Sprawdź czy service worker jest zarejestrowany

"Failed to get public key"
→ Sprawdź czy VAPID_PUBLIC_KEY jest ustawiony w .env.local

"Notification permission denied"
→ Powiadomienia są zablokowane w przeglądarce
```

## 🔍 Jak sprawdzić, czy działa?

### 1. Sprawdź status w profilu

Po kliknięciu "Enable" i zatwierdzeniu:
- Przycisk zmieni się na "Disable" ✅
- Obok pojawi się ✅ (zielony checkmark)

### 2. Sprawdź w DevTools

1. Otwórz DevTools (F12)
2. Application → Service Workers
3. Powinien być zarejestrowany service worker
4. Application → Storage → IndexedDB
5. Powinna być subskrypcja push

### 3. Sprawdź w bazie danych

```bash
# Jeśli masz dostęp do bazy
npx prisma studio

# Sprawdź tabelę push_subscriptions
# Powinien być tam wpis z Twoim endpoint
```

## 🧪 Test powiadomienia

Po włączeniu, możesz przetestować wysyłając testowe powiadomienie:

```bash
# Przez API (wymaga autoryzacji)
curl -X POST http://localhost:2137/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "Test",
    "message": "To jest test powiadomienia push"
  }'
```

Lub poczekaj na automatyczne powiadomienie (np. przypomnienie o cyklu).

## ❌ Jeśli nadal nie działa:

1. **Sprawdź VAPID keys** - czy są ustawione w `.env.local`?
2. **Sprawdź service worker** - czy `/sw.js` jest dostępny?
3. **Sprawdź konsolę** - czy są błędy?
4. **Sprawdź ustawienia przeglądarki** - czy powiadomienia są dozwolone?

## 💡 Wskazówki

- **Pierwsza próba**: Okno pojawi się automatycznie
- **Jeśli wcześniej zablokowałeś**: Musisz odblokować w ustawieniach przeglądarki
- **HTTPS wymagany**: W produkcji musi być `https://`
- **Service Worker**: Musi być zarejestrowany (sprawdź w DevTools)

