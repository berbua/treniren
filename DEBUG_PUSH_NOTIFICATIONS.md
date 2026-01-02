# 🐛 Debug Push Notifications

## Krok po kroku - sprawdź co się dzieje:

### 1. Otwórz konsolę przeglądarki
- **F12** lub **Cmd+Option+I** (Mac) / **Ctrl+Shift+I** (Windows)
- Przejdź do zakładki **Console**

### 2. Kliknij "Enable" przy "Push Notifications"

### 3. Sprawdź co pojawia się w konsoli

Powinieneś zobaczyć coś takiego:

```
Subscribing to push notifications...
Starting push subscription process...
Service worker already registered (lub Service worker not registered, initializing...)
Requesting notification permission...
Current notification permission: default (lub granted, lub denied)
```

### 4. Możliwe scenariusze:

#### Scenariusz A: "Current notification permission: granted"
✅ **To znaczy, że już masz zgodę!**
- Przeglądarka nie będzie pytać ponownie
- Subskrypcja powinna działać
- Sprawdź czy przycisk zmienił się na "Disable" ✅

#### Scenariusz B: "Current notification permission: denied"
❌ **Powiadomienia są zablokowane**
- Musisz odblokować w ustawieniach przeglądarki
- Pojawi się alert z instrukcją

#### Scenariusz C: "Current notification permission: default"
✅ **Powinno zapytać o zgodę**
- Jeśli nie pyta, sprawdź błędy poniżej

### 5. Sprawdź błędy w konsoli:

#### Błąd 1: "Failed to get public key"
```
❌ Failed to get public key - check if VAPID_PUBLIC_KEY is set in .env.local
```

**Rozwiązanie:**
```bash
# Sprawdź czy masz VAPID keys
cat .env.local | grep VAPID

# Jeśli nie ma, wygeneruj:
npm run generate-vapid-keys

# Dodaj do .env.local i ZRESTARTUJ serwer
```

#### Błąd 2: "Service worker not available"
```
❌ Service worker not available
```

**Rozwiązanie:**
- Sprawdź czy `/sw.js` jest dostępny: `http://localhost:2137/sw.js`
- Sprawdź w DevTools → Application → Service Workers

#### Błąd 3: "Notification permission denied"
```
❌ Notification permission denied or not granted
```

**Rozwiązanie:**
- Odblokuj powiadomienia w ustawieniach przeglądarki

### 6. Sprawdź w DevTools:

#### Application → Service Workers
- Czy service worker jest zarejestrowany?
- Status: "activated and is running"?

#### Application → Storage → Notifications
- Czy są jakieś zablokowane strony?

#### Network
- Czy `/api/push/public-key` zwraca 200 OK?
- Jaka jest odpowiedź?

### 7. Test API endpoint:

Otwórz w przeglądarce:
```
http://localhost:2137/api/push/public-key
```

Powinieneś zobaczyć:
```json
{"publicKey":"BAWctPPES0hxzSNtX_NMUERkfeQJ8acaRodwVT_pzOsDX2iZpjVxWQYEqJ6ysTkOmtFJXj39OHb4Xa-xs0BphsM"}
```

Jeśli widzisz błąd:
```json
{"error":"VAPID public key not configured"}
```

→ VAPID keys nie są ustawione lub serwer nie został zrestartowany

### 8. Sprawdź status Notification.permission:

W konsoli przeglądarki wpisz:
```javascript
Notification.permission
```

Możliwe wartości:
- `"default"` - nie zapytano jeszcze (powinno zapytać)
- `"granted"` - masz zgodę (nie będzie pytać)
- `"denied"` - zablokowane (nie będzie pytać)

### 9. Jeśli Notification.permission === "default" i nie pyta:

Może być problem z:
1. **Service Worker nie jest zarejestrowany** - sprawdź w DevTools
2. **VAPID keys nie działają** - sprawdź endpoint `/api/push/public-key`
3. **Błąd w kodzie** - sprawdź konsolę na błędy JavaScript

### 10. Wymuś reset zgody (tylko do testów):

W konsoli przeglądarki:
```javascript
// Tylko do testów - resetuje status zgody
// UWAGA: To nie zadziała jeśli przeglądarka zapamiętała "denied"
```

Lub:
- Chrome: Settings → Privacy → Site Settings → Notifications → Znajdź localhost → Reset
- Firefox: Settings → Privacy → Permissions → Notifications → Znajdź localhost → Remove

## 📋 Checklist:

- [ ] VAPID keys są w `.env.local`
- [ ] Serwer został zrestartowany po dodaniu VAPID keys
- [ ] `/api/push/public-key` zwraca public key (nie błąd)
- [ ] Service Worker jest zarejestrowany (DevTools → Application → Service Workers)
- [ ] `Notification.permission` nie jest `"denied"`
- [ ] W konsoli nie ma błędów JavaScript
- [ ] Kliknąłeś "Enable" w profilu

## 💡 Najczęstsze problemy:

1. **VAPID keys nie są ustawione** → Wygeneruj i dodaj do `.env.local`, zrestartuj serwer
2. **Serwer nie został zrestartowany** → Zatrzymaj (Ctrl+C) i uruchom ponownie `npm run dev`
3. **Powiadomienia są zablokowane** → Odblokuj w ustawieniach przeglądarki
4. **Service Worker nie działa** → Sprawdź czy `/sw.js` jest dostępny



