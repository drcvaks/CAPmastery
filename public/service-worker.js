// Installation support only. Never cache questions, answers, Auth, or Supabase
// traffic. Every application request uses the network and ordinary HTTP rules.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (
    event.request.mode !== "navigate" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CAP Mastery — Offline</title><body style="font-family:system-ui;padding:32px;color:#042454"><h1>You are offline</h1><p>CAP Mastery needs an internet connection to load questions and save answers. Reconnect before continuing.</p><button onclick="location.reload()">Try again</button></body></html>',
          { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
        ),
    ),
  );
});
