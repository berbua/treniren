# 🧪 Test Push Notifications przez Konsolę

## ✅ Masz już włączone push notifications!

Teraz możesz przetestować, czy działają, wysyłając testowe powiadomienie.

## 📋 Metoda 1: Przez API endpoint (Najłatwiejsze)

### Krok 1: Otwórz konsolę przeglądarki
- **F12** lub **Cmd+Option+I** (Mac) / **Ctrl+Shift+I** (Windows)
- Zakładka **Console**

### Krok 2: Wyślij testowe powiadomienie

Skopiuj i wklej ten kod do konsoli:

```javascript
fetch('/api/push/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    title: '🧪 Test Powiadomienia',
    message: 'To jest test powiadomienia push! Jeśli to widzisz, wszystko działa! 🎉',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: 'test-notification'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Odpowiedź serwera:', data);
  console.log('   Wysłano do:', data.sent, 'urządzeń');
  console.log('   Niepowodzeń:', data.failed);
})
.catch(error => {
  console.error('❌ Błąd:', error);
});
```

### Krok 3: Sprawdź wynik

**Jeśli wszystko działa:**
- Zobaczysz w konsoli: `✅ Odpowiedź serwera: {success: true, sent: 1, failed: 0, total: 1}`
- **Powiadomienie pojawi się na ekranie!** 🔔

**Jeśli jest błąd:**
- Sprawdź komunikat w konsoli
- Sprawdź czy jesteś zalogowany (credentials: 'include' wymaga sesji)

## 📋 Metoda 2: Prostsza wersja (jedna linia)

```javascript
fetch('/api/push/send', {method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include', body: JSON.stringify({title: 'Test', message: 'To jest test!'})}).then(r => r.json()).then(console.log);
```

## 📋 Metoda 3: Z więcej szczegółów

```javascript
(async () => {
  try {
    console.log('📤 Wysyłanie testowego powiadomienia...');
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        title: '🧪 Test Powiadomienia Push',
        message: 'To jest test powiadomienia push! Jeśli to widzisz, wszystko działa! 🎉',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        tag: 'test-' + Date.now(),
        data: {
          test: true,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Powiadomienie wysłane!');
      console.log('   Wysłano do:', result.sent, 'urządzeń');
      console.log('   Niepowodzeń:', result.failed);
      console.log('   Łącznie subskrypcji:', result.total);
    } else {
      console.error('❌ Błąd:', result.error);
    }
  } catch (error) {
    console.error('❌ Błąd sieci:', error);
  }
})();
```

## 🔍 Co sprawdzić:

### 1. Czy powiadomienie się pojawiło?

Powiadomienie powinno pojawić się:
- **Chrome/Edge**: W prawym dolnym rogu (lub w centrum, zależnie od ustawień)
- **Firefox**: W prawym górnym rogu
- **Safari**: W prawym górnym rogu

### 2. Jeśli powiadomienie się nie pojawia:

**Sprawdź ustawienia przeglądarki:**
- Chrome: 🔒 obok adresu → Notifications → Powinno być "Allow"
- Firefox: 🔒 obok adresu → Notifications → Powinno być "Allow"

**Sprawdź ustawienia systemowe:**
- macOS: System Settings → Notifications → Chrome/Firefox/Safari → Powiadomienia włączone
- Windows: Settings → System → Notifications → Chrome/Firefox → Powiadomienia włączone

### 3. Sprawdź czy subskrypcja istnieje:

W konsoli:
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    if (sub) {
      console.log('✅ Masz aktywną subskrypcję push');
      console.log('   Endpoint:', sub.endpoint);
    } else {
      console.log('❌ Brak subskrypcji push');
    }
  });
});
```

### 4. Sprawdź w bazie danych:

```bash
npx prisma studio
```

Sprawdź tabelę `push_subscriptions` - powinien być tam wpis z Twoim endpoint.

## 🎯 Oczekiwany rezultat:

1. ✅ Kod wykonuje się bez błędów
2. ✅ Konsola pokazuje: `{success: true, sent: 1, failed: 0, total: 1}`
3. ✅ **Powiadomienie pojawia się na ekranie** 🔔
4. ✅ Po kliknięciu powiadomienia otwiera się aplikacja

## 💡 Wskazówki:

- **Jeśli widzisz błąd 401**: Musisz być zalogowany
- **Jeśli widzisz błąd 500**: Sprawdź czy VAPID keys są ustawione
- **Jeśli `sent: 0`**: Subskrypcja nie istnieje lub jest nieprawidłowa
- **Jeśli powiadomienie się nie pojawia**: Sprawdź ustawienia powiadomień w przeglądarce/systemie

## 🧪 Test różnych typów powiadomień:

### Test 1: Proste powiadomienie
```javascript
fetch('/api/push/send', {method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include', body: JSON.stringify({title: 'Test', message: 'Proste powiadomienie'})}).then(r => r.json()).then(console.log);
```

### Test 2: Z ikoną i tagiem
```javascript
fetch('/api/push/send', {method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include', body: JSON.stringify({title: '🔔 Test', message: 'Z ikoną', icon: '/icon-192.svg', tag: 'test'})}).then(r => r.json()).then(console.log);
```

### Test 3: Z danymi (dla akcji)
```javascript
fetch('/api/push/send', {method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include', body: JSON.stringify({title: 'Test z akcją', message: 'Kliknij mnie!', data: {action: 'open-workouts', workoutId: '123'}})}).then(r => r.json()).then(console.log);
```

## 🔄 Jeśli powiadomienie się nie pojawia:

### Krok 1: Odśwież Service Worker

Service Worker może być w cache. Zrób to:

1. **Otwórz DevTools** (F12)
2. **Application** → **Service Workers**
3. Kliknij **"Unregister"** przy swoim service workerze
4. **Odśwież stronę** (Cmd+R / Ctrl+R)
5. **Spróbuj ponownie** wysłać powiadomienie

LUB w konsoli:

```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('✅ Service Worker unregistered. Refresh the page.');
});
```

### Krok 2: Sprawdź logi Service Workera

W DevTools:
- **Application** → **Service Workers** → **Console** (obok "Unregister")

Powinieneś zobaczyć:
```
Service Worker: Push event received
   ✅ Payload parsed successfully: {title: "...", body: "..."}
   Final notification data: {...}
Service Worker: Preparing to show notification
   Title: ...
   Body: ...
✅ Service Worker: Notification shown successfully
```

### Krok 3: Sprawdź ustawienia powiadomień

**Chrome/Edge:**
- 🔒 obok adresu → **Site settings** → **Notifications** → Powinno być **"Allow"**

**Firefox:**
- 🔒 obok adresu → **More Information** → **Permissions** → **Notifications** → Powinno być **"Allow"**

**System macOS:**
- System Settings → Notifications → Chrome/Firefox → Powiadomienia **włączone**

## ✅ Jeśli wszystko działa:

Gratulacje! 🎉 Push notifications są w pełni funkcjonalne!

Powiadomienia będą teraz wysyłane automatycznie dla:
- Przypomnień o cyklu
- Spóźnionych miesiączek  
- Braku aktywności treningowej
- Przypomnień o testach fingerboard

