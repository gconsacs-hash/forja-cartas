/* Service worker: deja la app instalada y funcionando sin conexion.
   Al cambiar algun archivo, sube el numero de VERSION. */
'use strict';

const VERSION = 'forja-cartas-v1';

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './css/estilos.css',
  './js/util.js',
  './js/texto.js',
  './js/plantillas.js',
  './js/estado.js',
  './js/mana.js',
  './js/render.js',
  './js/archivos.js',
  './js/galeria.js',
  './js/exportar.js',
  './js/controles.js',
  './js/interaccion.js',
  './js/ui.js',
  './js/app.js',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/icono-mascara.png'
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(
        claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))
      ))
      .then(() => self.clients.claim())
  );
});

/* Responde al instante con lo guardado y, si hay red, renueva la copia para
   la proxima apertura. Asi la app abre sin conexion pero no se queda pegada
   en una version vieja. */
self.addEventListener('fetch', (ev) => {
  const pet = ev.request;
  if (pet.method !== 'GET') return;
  if (new URL(pet.url).origin !== self.location.origin) return;
  ev.respondWith(
    caches.open(VERSION).then((cache) =>
      cache.match(pet).then((guardada) => {
        const red = fetch(pet).then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(pet, res.clone());
          }
          return res;
        }).catch(() => guardada || cache.match('./index.html'));
        return guardada || red;
      })
    )
  );
});
