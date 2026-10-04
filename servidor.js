/* Servidor local sin dependencias: sirve la app en http://localhost:3420
   Node puro, nada sale del equipo. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PUERTO = process.env.PUERTO || 3420;
const RAIZ = __dirname;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8'
};

const servidor = http.createServer((pet, res) => {
  let ruta = decodeURIComponent(pet.url.split('?')[0]);
  if (ruta === '/') ruta = '/index.html';
  const destino = path.join(RAIZ, path.normalize(ruta).replace(/^(\.\.[\/\\])+/, ''));
  if (!destino.startsWith(RAIZ)) {
    res.writeHead(403);
    return res.end('Fuera de la carpeta del proyecto.');
  }
  fs.readFile(destino, (err, datos) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado: ' + ruta);
    }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(destino).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(datos);
  });
});

/* Escucha tambien en la red local para poder abrir la app desde el celular
   conectado a la misma WiFi. */
function direccionesLocales() {
  const os = require('os');
  const salida = [];
  const redes = os.networkInterfaces();
  Object.keys(redes).forEach((nombre) => {
    (redes[nombre] || []).forEach((dir) => {
      if (dir.family === 'IPv4' && !dir.internal) salida.push(dir.address);
    });
  });
  return salida;
}

servidor.listen(PUERTO, '0.0.0.0', () => {
  console.log('Forja de Cartas');
  console.log('  En este PC:   http://localhost:' + PUERTO);
  direccionesLocales().forEach((ip) => {
    console.log('  En el celular (misma WiFi): http://' + ip + ':' + PUERTO);
  });
  console.log('Para cerrar: Ctrl+C');
});
