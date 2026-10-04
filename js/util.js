/* Utilidades puras: geometria, color, ajuste de imagenes y ruido determinista.
   Funciona como script clasico en el navegador (self.CDUtil) y como modulo en Node. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.CDUtil = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CARTA_ANCHO = 750;  // 63,5 mm a 300 ppp
  var CARTA_ALTO = 1050;  // 88,9 mm a 300 ppp

  function limitar(v, min, max) {
    v = Number(v);
    if (!isFinite(v)) v = min;
    return v < min ? min : v > max ? max : v;
  }

  function redondear(v, decimales) {
    var f = Math.pow(10, decimales || 0);
    return Math.round(v * f) / f;
  }

  function uid(prefijo) {
    return (prefijo || 'el') + '-' + Math.random().toString(36).slice(2, 9);
  }

  /* Generador pseudoaleatorio con semilla: el fondo texturizado se dibuja
     igual en la vista previa y en la exportacion. */
  function prng(semilla) {
    var a = (semilla >>> 0) || 1;
    return function () {
      a += 0x6d2b79f5;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normalizarHex(hex) {
    if (typeof hex !== 'string') return '#000000';
    var h = hex.trim();
    if (h[0] !== '#') h = '#' + h;
    if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    if (!/^#[0-9a-fA-F]{6}$/.test(h)) return '#000000';
    return h.toLowerCase();
  }

  function aRgb(hex) {
    var h = normalizarHex(hex);
    return {
      r: parseInt(h.slice(1, 3), 16),
      g: parseInt(h.slice(3, 5), 16),
      b: parseInt(h.slice(5, 7), 16)
    };
  }

  function aHex(r, g, b) {
    function p(v) {
      var s = Math.round(limitar(v, 0, 255)).toString(16);
      return s.length === 1 ? '0' + s : s;
    }
    return '#' + p(r) + p(g) + p(b);
  }

  function colorConAlfa(hex, alfa) {
    var c = aRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + limitar(alfa, 0, 1) + ')';
  }

  /* factor > 0 aclara hacia blanco, factor < 0 oscurece hacia negro. */
  function mezclar(hex, factor) {
    var c = aRgb(hex);
    var f = limitar(factor, -1, 1);
    var destino = f >= 0 ? 255 : 0;
    var p = Math.abs(f);
    return aHex(
      c.r + (destino - c.r) * p,
      c.g + (destino - c.g) * p,
      c.b + (destino - c.b) * p
    );
  }

  function luminancia(hex) {
    var c = aRgb(hex);
    return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  }

  function textoLegible(hexFondo) {
    return luminancia(hexFondo) > 0.55 ? '#14110f' : '#f7f3ea';
  }

  /* Paletas por identidad de color. Las claves sueltas son las de Magic;
     'oro' se usa para multicolor y 'mito'/'leyenda' para Mitos y Leyendas. */
  var PALETAS = {
    W: { nombre: 'Blanco', a: '#fffbe3', b: '#cdbf95' },
    U: { nombre: 'Azul', a: '#cbe6f8', b: '#3f7cb4' },
    B: { nombre: 'Negro', a: '#7d7679', b: '#1f1b1d' },
    R: { nombre: 'Rojo', a: '#f6b094', b: '#a73a28' },
    G: { nombre: 'Verde', a: '#aedbb6', b: '#2b6b45' },
    C: { nombre: 'Incoloro', a: '#dcd7d2', b: '#8a837e' },
    A: { nombre: 'Artefacto', a: '#cfd8de', b: '#6b7680' },
    L: { nombre: 'Tierra', a: '#d1ab7c', b: '#6a4726' },
    oro: { nombre: 'Multicolor', a: '#f4e4ad', b: '#b2924a' },
    luz: { nombre: 'Luz', a: '#fdf3cf', b: '#c9a24a' },
    oscuridad: { nombre: 'Oscuridad', a: '#8e8aa3', b: '#2a2336' },
    sangre: { nombre: 'Sangre', a: '#e8a08f', b: '#7d2020' },
    bosque: { nombre: 'Bosque', a: '#bcd9a4', b: '#39602c' },
    mar: { nombre: 'Mar', a: '#bfe0e6', b: '#245f72' },
    pergamino: { nombre: 'Pergamino', a: '#f3e4c2', b: '#a98a5c' }
  };

  function paleta(identidad) {
    if (typeof identidad === 'string') {
      return PALETAS[identidad] || PALETAS.C;
    }
    var ident = (identidad || []).filter(function (c) { return PALETAS[c]; });
    if (ident.length === 0) return PALETAS.C;
    if (ident.length === 1) return PALETAS[ident[0]];
    return PALETAS.oro;
  }

  /* Los elementos guardan colores simbolicos ('auto-a', 'auto-oscuro', ...)
     que se resuelven con la paleta activa; asi cambiar la identidad repinta
     el marco completo sin tocar cada pieza. */
  function resolverColor(color, identidad) {
    if (typeof color !== 'string') return '#000000';
    if (color.indexOf('auto') !== 0) return color;
    var p = paleta(identidad);
    switch (color) {
      case 'auto-a': return p.a;
      case 'auto-b': return p.b;
      case 'auto-claro': return mezclar(p.a, 0.45);
      case 'auto-oscuro': return mezclar(p.b, -0.45);
      case 'auto-medio': return mezclar(p.b, 0.2);
      case 'auto-texto': return textoLegible(p.a);
      case 'auto-texto-oscuro': return textoLegible(p.b);
      default: return p.b;
    }
  }

  /* Calcula el recorte y el destino de una imagen dentro de un rectangulo.
     modo: 'cubrir' | 'contener' | 'estirar'
     zoom: multiplicador; despX/despY: desplazamiento en fraccion del rectangulo. */
  function ajustarImagen(op) {
    var iw = Math.max(1, op.anchoImagen);
    var ih = Math.max(1, op.altoImagen);
    var w = Math.max(1, op.ancho);
    var h = Math.max(1, op.alto);
    var zoom = limitar(op.zoom == null ? 1 : op.zoom, 0.05, 20);
    var modo = op.modo || 'cubrir';
    var dw, dh;
    if (modo === 'estirar') {
      dw = w * zoom;
      dh = h * zoom;
    } else {
      var escala = modo === 'contener'
        ? Math.min(w / iw, h / ih)
        : Math.max(w / iw, h / ih);
      dw = iw * escala * zoom;
      dh = ih * escala * zoom;
    }
    var dx = (w - dw) / 2 + (op.despX || 0) * w;
    var dy = (h - dh) / 2 + (op.despY || 0) * h;
    return {
      dx: redondear(dx, 3),
      dy: redondear(dy, 3),
      dw: redondear(dw, 3),
      dh: redondear(dh, 3)
    };
  }

  function rutaRedondeada(ctx, x, y, w, h, r) {
    var radio = Math.min(Math.abs(r || 0), Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radio, y);
    ctx.lineTo(x + w - radio, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radio);
    ctx.lineTo(x + w, y + h - radio);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radio, y + h);
    ctx.lineTo(x + radio, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radio);
    ctx.lineTo(x, y + radio);
    ctx.quadraticCurveTo(x, y, x + radio, y);
    ctx.closePath();
  }

  /* Punto del raton a coordenadas locales del elemento, deshaciendo su rotacion. */
  function puntoLocal(px, py, el) {
    var cx = el.x + el.w / 2;
    var cy = el.y + el.h / 2;
    var ang = (-(el.rot || 0) * Math.PI) / 180;
    var dx = px - cx;
    var dy = py - cy;
    return {
      x: dx * Math.cos(ang) - dy * Math.sin(ang) + el.w / 2,
      y: dx * Math.sin(ang) + dy * Math.cos(ang) + el.h / 2
    };
  }

  function dentro(px, py, el, margen) {
    var m = margen || 0;
    var p = puntoLocal(px, py, el);
    return p.x >= -m && p.y >= -m && p.x <= el.w + m && p.y <= el.h + m;
  }

  function nombreArchivo(texto, extension) {
    var base = String(texto || 'carta')
      .normalize ? String(texto || 'carta').normalize('NFD').replace(/[̀-ͯ]/g, '') : String(texto || 'carta');
    base = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!base) base = 'carta';
    return base.slice(0, 50) + '.' + (extension || 'png');
  }

  return {
    CARTA_ANCHO: CARTA_ANCHO,
    CARTA_ALTO: CARTA_ALTO,
    PALETAS: PALETAS,
    limitar: limitar,
    redondear: redondear,
    uid: uid,
    prng: prng,
    normalizarHex: normalizarHex,
    aRgb: aRgb,
    aHex: aHex,
    colorConAlfa: colorConAlfa,
    mezclar: mezclar,
    luminancia: luminancia,
    textoLegible: textoLegible,
    paleta: paleta,
    resolverColor: resolverColor,
    ajustarImagen: ajustarImagen,
    rutaRedondeada: rutaRedondeada,
    puntoLocal: puntoLocal,
    dentro: dentro,
    nombreArchivo: nombreArchivo
  };
});
