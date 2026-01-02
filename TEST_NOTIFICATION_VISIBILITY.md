# 🔍 Diagnostyka Widoczności Powiadomień

## Problem: Service Worker mówi, że powiadomienie jest aktywne, ale nie widzisz go na ekranie

### ✅ Co działa:
- Service Worker otrzymuje push event ✅
- Payload jest parsowany ✅
- `showNotification()` zwraca sukces ✅
- Powiadomienie jest aktywne (`getNotifications()` zwraca 1) ✅
- Uprawnienia są przyznane (`Notification.permission === 'granted'`) ✅

### ❌ Co nie działa:
- Powiadomienie nie pojawia się na ekranie ❌

## 🔍 Diagnostyka krok po kroku:

### 1. Sprawdź Centrum Powiadomień macOS

1. **Otwórz Centrum Powiadomień** (przesuń od prawej krawędzi ekranu lub kliknij ikonę w prawym górnym rogu)
2. **Sprawdź, czy powiadomienie jest tam** - może być wyświetlane, ale nie jako popup

### 2. Sprawdź tryb Focus/Do Not Disturb

**macOS:**
- System Settings → Focus → Sprawdź, czy nie jest włączony tryb, który blokuje powiadomienia
- Control Center → Sprawdź ikonę Focus - czy jest aktywna?

### 3. Sprawdź ustawienia powiadomień przeglądarki

**Chrome:**
1. 🔒 obok adresu → **Site settings** → **Notifications**
2. Powinno być **"Allow"**
3. Sprawdź też: Chrome Settings → Privacy and security → Site settings → Notifications

**Firefox:**
1. 🔒 obok adresu → **More Information** → **Permissions** → **Notifications**
2. Powinno być **"Allow"**

### 4. Sprawdź ustawienia systemowe macOS

1. **System Settings** → **Notifications**
2. Znajdź **Chrome** lub **Firefox**
3. Sprawdź:
   - ✅ **Allow Notifications** - włączone
   - ✅ **Show in Notification Center** - włączone
   - ✅ **Show on Lock Screen** - opcjonalnie
   - ✅ **Banner style** - powinno być "Banners" (nie "Alerts" tylko)

### 5. Test prostego powiadomienia (bez Service Worker)

W konsoli przeglądarki (nie Service Worker):

```javascript
if (Notification.permission === 'granted') {
  new Notification('Test bez Service Worker', {
    body: 'Jeśli to widzisz, powiadomienia działają!',
    icon: '/icon-192.svg'
  });
} else {
  console.log('Uprawnienia nie są przyznane:', Notification.permission);
}
```

**Jeśli to powiadomienie się pojawia:**
- Problem jest w Service Worker lub w sposobie wyświetlania przez Service Worker

**Jeśli to powiadomienie się NIE pojawia:**
- Problem jest w ustawieniach systemowych/przeglądarki

### 6. Sprawdź, czy okno przeglądarki ma focus

- **Przełącz się na inną aplikację** (np. Finder)
- **Wyślij powiadomienie** (powinno się pojawić, gdy przeglądarka jest w tle)
- **Sprawdź Centrum Powiadomień**

### 7. Sprawdź logi systemowe (macOS)

W Terminalu:

```bash
log stream --predicate 'subsystem == "com.apple.notificationscenter"' --level=debug
```

Następnie wyślij powiadomienie i sprawdź, czy pojawiają się logi.

### 8. Test z prostszym powiadomieniem (bez actions)

Service Worker został zaktualizowany, aby używać prostszego powiadomienia bez actions. Odśwież Service Worker i spróbuj ponownie.

## 🎯 Najczęstsze przyczyny:

1. **Focus Mode / Do Not Disturb** - blokuje powiadomienia
2. **Banner style = Alerts** - wymaga kliknięcia, nie pokazuje się automatycznie
3. **Okno przeglądarki ma focus** - niektóre przeglądarki nie pokazują powiadomień, gdy okno jest aktywne
4. **Powiadomienia są wyciszone** w ustawieniach systemowych

## ✅ Rozwiązanie:

1. **Wyłącz Focus Mode / Do Not Disturb**
2. **Ustaw Banner style na "Banners"** w System Settings → Notifications
3. **Przełącz się na inną aplikację** przed wysłaniem powiadomienia
4. **Sprawdź Centrum Powiadomień** - może być tam, ale nie jako popup



