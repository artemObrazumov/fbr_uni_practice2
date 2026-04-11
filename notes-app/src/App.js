import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { readNotes, writeNotes } from './noteStorage';
import { attachNotesHome } from './notesShell';
import { getApiOriginFromEnv } from './apiOrigin';
import './App.css';

const VAPID_PUBLIC_KEY =
  'BDIlw_b7yfkhkbuMMa3R2z8uXm_nktZAdQMnhn2fdr3P9kIiq2tf4MXwZC9VWHQhxY1whXaM9NcNZpyKt1LptB4';

const apiOrigin = () => getApiOriginFromEnv(process.env);

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function contentUrl(page) {
  const base = process.env.PUBLIC_URL || '';
  return `${base}/content/${page}.html`;
}

async function getServiceWorkerRegistration() {
  const swUrl = `${process.env.PUBLIC_URL || ''}/sw.js`;
  const byScope = await navigator.serviceWorker.getRegistration(swUrl);
  if (byScope) return byScope;
  const any = await navigator.serviceWorker.getRegistration();
  if (any) return any;
  return navigator.serviceWorker.register(swUrl);
}

function App() {
  const [shellPage, setShellPage] = useState('home');
  const [pushEnabledVisible, setPushEnabledVisible] = useState(true);
  const contentRef = useRef(null);
  const socketRef = useRef(null);
  const lastLocalNoteId = useRef(null);

  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const origin = apiOrigin() || window.location.origin;
    const registration = await getServiceWorkerRegistration();
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    const payload =
      typeof subscription.toJSON === 'function'
        ? subscription.toJSON()
        : subscription;
    const res = await fetch(`${origin}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Сервер: ${res.status}`);
    }
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const origin = apiOrigin() || window.location.origin;
    const registration = await getServiceWorkerRegistration();
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetch(`${origin}/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    const url = apiOrigin() || undefined;
    const isDev = process.env.NODE_ENV === 'development';
    const socket = io(url, isDev
      ? { transports: ['polling'], upgrade: false }
      : { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('taskAdded', (task) => {
      const text = task && task.text ? String(task.text) : '';
      const noteId = Number(task && task.id);
      const reminder =
        typeof (task && task.reminder) === 'number' && Number.isFinite(task.reminder)
          ? task.reminder
          : null;
      const toast = document.createElement('div');
      toast.textContent = text ? `Новая задача: ${text}` : 'Новая задача';
      toast.className = 'toast';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      if (Number.isFinite(noteId) && noteId === lastLocalNoteId.current) {
        window.__notesShellRefresh?.();
        return;
      }
      if (text) {
        const notes = readNotes();
        if (Number.isFinite(noteId) && notes.some((n) => n.id === noteId)) {
          window.__notesShellRefresh?.();
          return;
        }
        notes.push({ id: noteId || Date.now(), text, reminder });
        writeNotes(notes);
      }
      window.__notesShellRefresh?.();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const reg = await getServiceWorkerRegistration();
        if (cancelled) return;
        const sub = await reg.pushManager.getSubscription();
        setPushEnabledVisible(!sub);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let detachHome = () => {};
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(contentUrl(shellPage), { signal: ac.signal });
        if (!res.ok) throw new Error(String(res.status));
        const html = await res.text();
        if (ac.signal.aborted || !contentRef.current) return;
        detachHome();
        contentRef.current.innerHTML = html;
        if (shellPage === 'home') {
          detachHome = attachNotesHome(contentRef.current, {
            onNewNote: (note) => {
              lastLocalNoteId.current = note.id;
              if (typeof note.reminder === 'number') {
                socketRef.current?.emit('newReminder', {
                  id: note.id,
                  text: note.text,
                  reminderTime: note.reminder,
                });
              } else {
                socketRef.current?.emit('newTask', {
                  id: note.id,
                  text: note.text,
                });
              }
            },
          });
        }
      } catch (err) {
        if (ac.signal.aborted || !contentRef.current) return;
        if (err && err.name === 'AbortError') return;
        contentRef.current.innerHTML =
          '<p class="muted">Ошибка загрузки страницы.</p>';
        console.error(err);
      }
    })();

    return () => {
      ac.abort();
      detachHome();
    };
  }, [shellPage]);

  const onEnablePush = async () => {
    if (!('Notification' in window)) {
      window.alert('Уведомления не поддерживаются');
      return;
    }
    if (Notification.permission === 'denied') {
      window.alert('Уведомления запрещены. Разрешите их в настройках браузера.');
      return;
    }
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        window.alert('Необходимо разрешить уведомления.');
        return;
      }
    }
    try {
      await subscribeToPush();
      setPushEnabledVisible(false);
    } catch (err) {
      console.error(err);
      const m = err && err.message ? String(err.message) : '';
      let hint = m || 'Не удалось включить push.';
      if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
        hint =
          'Нет связи с API (часто из‑за сертификата). Откройте в этой же вкладке ' +
          (apiOrigin() || 'https://localhost:3001') +
          ', примите HTTPS, затем снова нажмите «Включить уведомления». Убедитесь, что запущен npm run server.';
      }
      window.alert(hint);
    }
  };

  const onDisablePush = async () => {
    try {
      await unsubscribeFromPush();
      setPushEnabledVisible(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app">
      <header className="shell-header">
        <h1 className="app__title">Заметки</h1>
        <p className="shell-lead muted">
          Оффлайн-приложение: каркас загружается сразу
        </p>
        <nav className="tabs" aria-label="Разделы">
          <button
            type="button"
            className={`tab ${shellPage === 'home' ? 'tab--active' : ''}`}
            id="home-btn"
            onClick={() => setShellPage('home')}
          >
            Главная
          </button>
          <button
            type="button"
            className={`tab ${shellPage === 'about' ? 'tab--active' : ''}`}
            id="about-btn"
            onClick={() => setShellPage('about')}
          >
            О приложении
          </button>
        </nav>
      </header>

      {shellPage === 'home' && (
        <div className="box push-block">
          <p className="muted">Уведомления</p>
          <div className="row row--gap">
            {pushEnabledVisible ? (
              <button type="button" className="btn" id="enable-push" onClick={onEnablePush}>
                Включить уведомления
              </button>
            ) : (
              <button type="button" className="btn" id="disable-push" onClick={onDisablePush}>
                Отключить уведомления
              </button>
            )}
          </div>
        </div>
      )}

      <main
        ref={contentRef}
        id="app-content"
        className="box shell-main"
        aria-live="polite"
      />
    </div>
  );
}

export default App;
