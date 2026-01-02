# ⚡ Szybka naprawa - Push Notifications nie pyta o zgodę

## 🔍 Problem: VAPID keys nie są ustawione!

Bez VAPID keys push notifications nie mogą działać.

## ✅ Rozwiązanie (3 kroki):

### Krok 1: Wygeneruj VAPID keys

```bash
npm run generate-vapid-keys
```

Zobaczysz coś takiego:
```
VAPID_PUBLIC_KEY=BAWctPPES0hxzSNtX_NMUERkfeQJ8acaRodwVT_pzOsDX2iZpjVxWQYEqJ6ysTkOmtFJXj39OHb4Xa-xs0BphsM
VAPID_PRIVATE_KEY=oLYrZYwm2PJbZiBEYN2tg3TREFBzMRMviHUpKk-7jcc
```

### Krok 2: Dodaj do `.env.local`

Otwórz plik `.env.local` i dodaj na końcu:

```bash
VAPID_PUBLIC_KEY=BAWctPPES0hxzSNtX_NMUERkfeQJ8acaRodwVT_pzOsDX2iZpjVxWQYEqJ6ysTkOmtFJXj39OHb4Xa-xs0BphsM
VAPID_PRIVATE_KEY=oLYrZYwm2PJbZiBEYN2tg3TREFBzMRMviHUpKk-7jcc
VAPID_SUBJECT=mailto:twoj-email@example.com
```

(Zastąp `twoj-email@example.com` swoim emailem)

### Krok 3: ZRESTARTUJ serwer dev

**WAŻNE:** Musisz zrestartować serwer, żeby Next.js załadował nowe zmienne środowiskowe!

```bash
# Zatrzymaj serwer (Ctrl+C lub Cmd+C)
# Uruchom ponownie:
npm run dev
```

## 🧪 Test:

1. Otwórz `http://localhost:2137`
2. Otwórz konsolę (F12 → Console)
3. Profil → Settings
4. Kliknij "Enable" przy "Push Notifications"
5. **Sprawdź konsolę** - powinieneś zobaczyć:
   ```
   Subscribing to push notifications...
   Starting push subscription process...
   Fetching VAPID public key from /api/push/public-key...
   Response status: 200
   Received public key: Yes (length: 88)
   Requesting notification permission...
   Current notification permission: default
   Requesting notification permission...
   User responded with permission: granted
   ```

6. **Powinno pojawić się okno przeglądarki z prośbą o zgodę!**

## 🔍 Jeśli nadal nie działa:

### Sprawdź endpoint:

Otwórz w przeglądarce:
```
http://localhost:2137/api/push/public-key
```

**Powinno zwrócić:**
```json
{"publicKey":"BAWctPPES0hxzSNtX_NMUERkfeQJ8acaRodwVT_pzOsDX2iZpjVxWQYEqJ6ysTkOmtFJXj39OHb4Xa-xs0BphsM"}
```

**Jeśli widzisz błąd:**
```json
{"error":"VAPID public key not configured"}
```

→ Klucze nie są ustawione lub serwer nie został zrestartowany!

### Sprawdź konsolę:

Po kliknięciu "Enable" powinieneś zobaczyć logi. Jeśli widzisz:
- `"Failed to get public key"` → VAPID keys nie są ustawione
- `"Service worker not available"` → Problem z service workerem
- `"Notification permission denied"` → Powiadomienia są zablokowane

## 💡 Najczęstsze błędy:

1. ❌ **Nie dodałeś kluczy do `.env.local`**
2. ❌ **Nie zrestartowałeś serwera** (najczęstszy błąd!)
3. ❌ **Złe formatowanie w `.env.local`** (bez cudzysłowów jest OK)

## ✅ Checklist:

- [ ] Wygenerowałem VAPID keys (`npm run generate-vapid-keys`)
- [ ] Dodałem 3 linijki do `.env.local`
- [ ] Zrestartowałem serwer dev (zatrzymałem i uruchomiłem ponownie)
- [ ] Sprawdziłem `/api/push/public-key` - zwraca public key
- [ ] Kliknąłem "Enable" i sprawdziłem konsolę

