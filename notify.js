<script>
(async function() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  // Service worker code as a blob
  const swCode = `
    let SUBSCRIPTIONS = [];

    self.addEventListener('install', e => self.skipWaiting());
    self.addEventListener('activate', e => self.clients.claim());

    self.addEventListener('fetch', e => {
      const url = new URL(e.request.url);

      // Subscribe
      if (url.searchParams.get('action') === 'subscribe' && e.request.method === 'POST') {
        e.respondWith((async () => {
          try {
            const sub = await e.request.json();
            if (!SUBSCRIPTIONS.find(s => s.endpoint === sub.endpoint)) SUBSCRIPTIONS.push(sub);
            return new Response('ok');
          } catch(err) { return new Response('failed', {status:400}); }
        })());
        return;
      }

      // Send notification
      const title = url.searchParams.get('title');
      const message = url.searchParams.get('message');
      const icon = url.searchParams.get('icon') || '';
      const clickUrl = url.searchParams.get('url') || '';

      if(title && message){
        e.respondWith((async () => {
          for(const sub of SUBSCRIPTIONS){
            try{
              // This is simulated. In a real Worker you need Push API.
              // For demo/testing purposes.
              // Notification will show only when triggered from client side
            }catch(err){}
          }
          return new Response(JSON.stringify({success:true, notified:SUBSCRIPTIONS.length}), {headers:{'content-type':'application/json'}});
        })());
        return;
      }

      e.respondWith(fetch(e.request));
    });

    self.addEventListener('push', e => {
      const data = e.data.json();
      e.waitUntil(
        self.registration.showNotification(data.title, {
          body: data.message,
          icon: data.icon || '',
          data: {url: data.url || ''}
        })
      );
    });

    self.addEventListener('notificationclick', e => {
      e.notification.close();
      if(e.notification.data.url) clients.openWindow(e.notification.data.url);
    });
  `;

  // Register SW from blob
  const swBlob = new Blob([swCode], {type:'application/javascript'});
  const swUrl = URL.createObjectURL(swBlob);
  const reg = await navigator.serviceWorker.register(swUrl);
  console.log('SW registered', reg);

  const perm = await Notification.requestPermission();
  if(perm!=='granted') return console.log('Notification permission denied');

  const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:null});

  // Send subscription to SW (in-memory)
  await fetch(swUrl+'?action=subscribe',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body: JSON.stringify(sub)
  });

  console.log('Subscribed for notifications');
})();
</script>
