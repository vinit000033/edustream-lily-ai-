<script>
(async function() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const WORKER_URL = 'https://black-cherry-f8d2.cariyep778.workers.dev/worker.js';
  const reg = await navigator.serviceWorker.register(WORKER_URL);
  console.log('SW registered', reg);

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return console.log('Notification permission denied');

  const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: null // optional
  });

  // Send subscription to worker
  await fetch(WORKER_URL + '?action=subscribe', {
    method: 'POST',
    headers: {'content-type':'application/json'},
    body: JSON.stringify(sub)
  });

  console.log('Subscribed for push notifications');
})();
</script>
