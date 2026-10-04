/* Formas vectoriales propias para los simbolos de edicion y las marcas de
   agua. Todas se dibujan centradas en (cx, cy) dentro de un radio r. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.CDFormas = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function escudo(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.78, cy - r * 0.72);
    ctx.lineTo(cx + r * 0.78, cy - r * 0.72);
    ctx.lineTo(cx + r * 0.78, cy + r * 0.1);
    ctx.quadraticCurveTo(cx + r * 0.72, cy + r * 0.68, cx, cy + r * 0.92);
    ctx.quadraticCurveTo(cx - r * 0.72, cy + r * 0.68, cx - r * 0.78, cy + r * 0.1);
    ctx.closePath();
  }

  function rombo(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.92);
    ctx.quadraticCurveTo(cx + r * 0.26, cy - r * 0.26, cx + r * 0.82, cy);
    ctx.quadraticCurveTo(cx + r * 0.26, cy + r * 0.26, cx, cy + r * 0.92);
    ctx.quadraticCurveTo(cx - r * 0.26, cy + r * 0.26, cx - r * 0.82, cy);
    ctx.quadraticCurveTo(cx - r * 0.26, cy - r * 0.26, cx, cy - r * 0.92);
    ctx.closePath();
  }

  function estrella(ctx, cx, cy, r, puntas) {
    var n = puntas || 5;
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      var d = i % 2 === 0 ? r * 0.95 : r * 0.42;
      var x = cx + Math.cos(a) * d;
      var y = cy + Math.sin(a) * d;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function luna(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.9, Math.PI * 0.42, Math.PI * 1.58, false);
    ctx.arc(cx - r * 0.42, cy, r * 0.86, Math.PI * 1.46, Math.PI * 0.54, true);
    ctx.closePath();
  }

  function hoja(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.92);
    ctx.bezierCurveTo(cx + r * 0.88, cy - r * 0.3, cx + r * 0.6, cy + r * 0.68, cx, cy + r * 0.92);
    ctx.bezierCurveTo(cx - r * 0.6, cy + r * 0.68, cx - r * 0.88, cy - r * 0.3, cx, cy - r * 0.92);
    ctx.closePath();
  }

  function llama(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.94);
    ctx.bezierCurveTo(cx + r * 0.56, cy - r * 0.3, cx + r * 0.68, cy + r * 0.3, cx, cy + r * 0.9);
    ctx.bezierCurveTo(cx - r * 0.68, cy + r * 0.3, cx - r * 0.56, cy - r * 0.3, cx, cy - r * 0.94);
    ctx.closePath();
  }

  function engranaje(ctx, cx, cy, r) {
    var dientes = 8;
    ctx.beginPath();
    for (var i = 0; i < dientes; i++) {
      var a0 = (i / dientes) * Math.PI * 2;
      var a1 = a0 + Math.PI / dientes * 0.52;
      var a2 = a0 + Math.PI / dientes;
      var a3 = a0 + Math.PI / dientes * 1.48;
      var a4 = a0 + (Math.PI * 2) / dientes;
      if (i === 0) ctx.moveTo(cx + Math.cos(a0) * r * 0.94, cy + Math.sin(a0) * r * 0.94);
      ctx.lineTo(cx + Math.cos(a1) * r * 0.94, cy + Math.sin(a1) * r * 0.94);
      ctx.lineTo(cx + Math.cos(a2) * r * 0.62, cy + Math.sin(a2) * r * 0.62);
      ctx.lineTo(cx + Math.cos(a3) * r * 0.62, cy + Math.sin(a3) * r * 0.62);
      ctx.lineTo(cx + Math.cos(a4) * r * 0.94, cy + Math.sin(a4) * r * 0.94);
    }
    ctx.closePath();
  }

  function ojo(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.95, cy);
    ctx.quadraticCurveTo(cx, cy - r * 0.86, cx + r * 0.95, cy);
    ctx.quadraticCurveTo(cx, cy + r * 0.86, cx - r * 0.95, cy);
    ctx.closePath();
  }

  function yunque(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.9, cy - r * 0.46);
    ctx.lineTo(cx + r * 0.5, cy - r * 0.46);
    ctx.quadraticCurveTo(cx + r * 0.98, cy - r * 0.4, cx + r * 0.84, cy - r * 0.04);
    ctx.lineTo(cx + r * 0.3, cy - r * 0.04);
    ctx.lineTo(cx + r * 0.24, cy + r * 0.3);
    ctx.lineTo(cx + r * 0.62, cy + r * 0.86);
    ctx.lineTo(cx - r * 0.62, cy + r * 0.86);
    ctx.lineTo(cx - r * 0.24, cy + r * 0.3);
    ctx.lineTo(cx - r * 0.34, cy - r * 0.04);
    ctx.lineTo(cx - r * 0.9, cy - r * 0.04);
    ctx.closePath();
  }

  function corona(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.92, cy + r * 0.62);
    ctx.lineTo(cx - r * 0.78, cy - r * 0.62);
    ctx.lineTo(cx - r * 0.34, cy + r * 0.06);
    ctx.lineTo(cx, cy - r * 0.86);
    ctx.lineTo(cx + r * 0.34, cy + r * 0.06);
    ctx.lineTo(cx + r * 0.78, cy - r * 0.62);
    ctx.lineTo(cx + r * 0.92, cy + r * 0.62);
    ctx.closePath();
  }

  function espada(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.95);
    ctx.lineTo(cx + r * 0.16, cy - r * 0.6);
    ctx.lineTo(cx + r * 0.16, cy + r * 0.16);
    ctx.lineTo(cx + r * 0.62, cy + r * 0.16);
    ctx.lineTo(cx + r * 0.62, cy + r * 0.38);
    ctx.lineTo(cx + r * 0.16, cy + r * 0.38);
    ctx.lineTo(cx + r * 0.16, cy + r * 0.95);
    ctx.lineTo(cx - r * 0.16, cy + r * 0.95);
    ctx.lineTo(cx - r * 0.16, cy + r * 0.38);
    ctx.lineTo(cx - r * 0.62, cy + r * 0.38);
    ctx.lineTo(cx - r * 0.62, cy + r * 0.16);
    ctx.lineTo(cx - r * 0.16, cy + r * 0.16);
    ctx.lineTo(cx - r * 0.16, cy - r * 0.6);
    ctx.closePath();
  }

  function torre(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.66, cy - r * 0.9);
    ctx.lineTo(cx - r * 0.38, cy - r * 0.9);
    ctx.lineTo(cx - r * 0.38, cy - r * 0.66);
    ctx.lineTo(cx - r * 0.14, cy - r * 0.66);
    ctx.lineTo(cx - r * 0.14, cy - r * 0.9);
    ctx.lineTo(cx + r * 0.14, cy - r * 0.9);
    ctx.lineTo(cx + r * 0.14, cy - r * 0.66);
    ctx.lineTo(cx + r * 0.38, cy - r * 0.66);
    ctx.lineTo(cx + r * 0.38, cy - r * 0.9);
    ctx.lineTo(cx + r * 0.66, cy - r * 0.9);
    ctx.lineTo(cx + r * 0.52, cy + r * 0.92);
    ctx.lineTo(cx - r * 0.52, cy + r * 0.92);
    ctx.closePath();
  }

  var CATALOGO = [
    { id: 'escudo', nombre: 'Escudo' },
    { id: 'rombo', nombre: 'Rombo' },
    { id: 'estrella', nombre: 'Estrella' },
    { id: 'luna', nombre: 'Luna' },
    { id: 'hoja', nombre: 'Hoja' },
    { id: 'llama', nombre: 'Llama' },
    { id: 'engranaje', nombre: 'Engranaje' },
    { id: 'ojo', nombre: 'Ojo' },
    { id: 'yunque', nombre: 'Yunque' },
    { id: 'corona', nombre: 'Corona' },
    { id: 'espada', nombre: 'Espada' },
    { id: 'torre', nombre: 'Torre' }
  ];

  var FUNCIONES = {
    escudo: escudo,
    rombo: rombo,
    estrella: estrella,
    luna: luna,
    hoja: hoja,
    llama: llama,
    engranaje: engranaje,
    ojo: ojo,
    yunque: yunque,
    corona: corona,
    espada: espada,
    torre: torre
  };

  /* Deja la forma trazada en el contexto, lista para rellenar o perfilar. */
  function ruta(ctx, forma, cx, cy, r) {
    var f = FUNCIONES[forma] || escudo;
    f(ctx, cx, cy, r);
  }

  /* Colores de rareza, de comun a mitica. */
  var RAREZAS = {
    comun: { nombre: 'Comun', a: '#5a5a5a', b: '#101010' },
    infrecuente: { nombre: 'Infrecuente', a: '#eef3f6', b: '#76848d' },
    rara: { nombre: 'Rara', a: '#f8e3a6', b: '#a07b1c' },
    mitica: { nombre: 'Mitica', a: '#f6a560', b: '#9c2f12' },
    especial: { nombre: 'Especial', a: '#e9c9f2', b: '#6d3a8c' },
    tierra: { nombre: 'Tierra basica', a: '#d9d2c8', b: '#6b6158' }
  };

  return {
    CATALOGO: CATALOGO,
    RAREZAS: RAREZAS,
    ruta: ruta
  };
});
