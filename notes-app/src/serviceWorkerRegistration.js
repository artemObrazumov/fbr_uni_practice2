export function register() {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;
      registerValidSW(swUrl);
    });
  }
}

function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((reg) => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[SW] зарегистрирован:', swUrl, reg.scope);
      }
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[SW] ошибка регистрации:', swUrl, err);
    });
}
