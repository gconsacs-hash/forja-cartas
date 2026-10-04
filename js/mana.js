/* Simbolos de mana dibujados a mano en canvas: sin internet ni fuentes
   externas, el mismo trazo sirve para la vista previa y para la impresion. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./util.js'));
  else raiz.CDMana = fabrica(raiz.CDUtil);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  var FONDOS = {
    W: '#fffbd5', U: '#aae0fa', B: '#cbc2bf', R: '#f9aa8f', G: '#9bd3ae',
    C: '#cac5c0', S: '#e3eaf0', E: '#d9d2c7', T: '#cac5c0', Q: '#cac5c0',
    GENERICO: '#cac5c0'
  };
  var TINTA = '#150f0e';

  var CATALOGO = [
    'W', 'U', 'B', 'R', 'G', 'C', 'X', 'T', 'Q', 'S', 'E',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    'W/U', 'U/B', 'B/R', 'R/G', 'G/W', 'W/B', 'U/R', 'B/G', 'R/W', 'G/U',
    '2/W', '2/U', '2/B', '2/R', '2/G', 'W/P', 'U/P', 'B/P', 'R/P', 'G/P'
  ];

  function fondoDe(simbolo) {
    var s = String(simbolo || '').toUpperCase();
    if (FONDOS[s]) return FONDOS[s];
    return FONDOS.GENERICO;
  }

  function esNumero(s) {
    return /^[0-9]+$/.test(s);
  }

  /* --- glifos ------------------------------------------------------- */

  /* Los glifos no se rellenan de negro plano: un degradado vertical les da el
     mismo relieve que tienen los simbolos impresos. */
  function tintaDe(ctx, cx, cy, r) {
    var g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    g.addColorStop(0, '#362e2a');
    g.addColorStop(0.5, '#15100f');
    g.addColorStop(1, '#070605');
    return g;
  }

  function glifoTexto(ctx, txt, cx, cy, r, color) {
    ctx.save();
    ctx.fillStyle = color || tintaDe(ctx, cx, cy, r);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // los numeros y la X van en palo seco pesado, como en la carta impresa
    var numero = /^[0-9]+$/.test(txt);
    var tam = r * (txt.length > 1 ? 1.2 : 1.46);
    ctx.font = numero || txt === 'X'
      ? '900 ' + tam.toFixed(2) + 'px "Segoe UI Black","Arial Black","Segoe UI",sans-serif'
      : '700 ' + (tam * 0.95).toFixed(2) + 'px "Cambria","Georgia",serif';
    ctx.fillText(txt, cx, cy + r * 0.03);
    ctx.restore();
  }

  /* Sol de la Llanura: disco central y ocho rayos de lados concavos, como
     los del simbolo impreso. */
  function sol(ctx, cx, cy, r) {
    function polar(a, d) {
      return [cx + Math.cos(a) * r * d, cy + Math.sin(a) * r * d];
    }
    ctx.save();
    ctx.fillStyle = tintaDe(ctx, cx, cy, r);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.37, 0, Math.PI * 2);
    ctx.fill();
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      var base1 = polar(a - 0.44, 0.28);
      var base2 = polar(a + 0.44, 0.28);
      var ctrl1 = polar(a - 0.17, 0.76);
      var ctrl2 = polar(a + 0.17, 0.76);
      var punta = polar(a, 0.94);
      ctx.beginPath();
      ctx.moveTo(base1[0], base1[1]);
      ctx.quadraticCurveTo(ctrl1[0], ctrl1[1], punta[0], punta[1]);
      ctx.quadraticCurveTo(ctrl2[0], ctrl2[1], base2[0], base2[1]);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /* Gota de la Isla: punta arriba y panza circular abajo. */
  function gota(ctx, cx, cy, r) {
    ctx.save();
    ctx.fillStyle = tintaDe(ctx, cx, cy, r);
    var baseY = cy + r * 0.2;
    var radio = r * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.88);
    ctx.bezierCurveTo(cx + r * 0.2, cy - r * 0.44, cx + radio, cy - r * 0.18, cx + radio, baseY);
    ctx.arc(cx, baseY, radio, 0, Math.PI);
    ctx.bezierCurveTo(cx - radio, cy - r * 0.18, cx - r * 0.2, cy - r * 0.44, cx, cy - r * 0.88);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* Calavera del Pantano: craneo, pomulos y mandibula con dientes.
     El fondo se pasa para recortar las cuencas tambien en los hibridos. */
  function calavera(ctx, cx, cy, r, fondo) {
    var hueco = fondo || fondoDe('B');
    ctx.save();
    ctx.fillStyle = tintaDe(ctx, cx, cy, r);
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.16, r * 0.68, r * 0.6, 0, Math.PI, Math.PI * 2);
    ctx.bezierCurveTo(cx + r * 0.68, cy + r * 0.16, cx + r * 0.54, cy + r * 0.28, cx + r * 0.4, cy + r * 0.34);
    ctx.lineTo(cx + r * 0.34, cy + r * 0.72);
    ctx.quadraticCurveTo(cx, cy + r * 0.94, cx - r * 0.34, cy + r * 0.72);
    ctx.lineTo(cx - r * 0.4, cy + r * 0.34);
    ctx.bezierCurveTo(cx - r * 0.54, cy + r * 0.28, cx - r * 0.68, cy + r * 0.16, cx - r * 0.68, cy - r * 0.16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = hueco;
    // cuencas inclinadas hacia la nariz
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.3, cy - r * 0.2, r * 0.26, r * 0.29, 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.3, cy - r * 0.2, r * 0.26, r * 0.29, -0.34, 0, Math.PI * 2);
    ctx.fill();
    // nariz
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.02);
    ctx.lineTo(cx + r * 0.13, cy + r * 0.26);
    ctx.lineTo(cx - r * 0.13, cy + r * 0.26);
    ctx.closePath();
    ctx.fill();
    // separacion de la mandibula y dientes
    ctx.fillRect(cx - r * 0.34, cy + r * 0.38, r * 0.68, r * 0.06);
    ctx.fillRect(cx - r * 0.14, cy + r * 0.44, r * 0.05, r * 0.32);
    ctx.fillRect(cx + r * 0.09, cy + r * 0.44, r * 0.05, r * 0.32);
    ctx.restore();
  }

  /* Bola de fuego de la Montana: punta inclinada, panza ancha y una lengua
     de llama recortada a la izquierda. */
  function llama(ctx, cx, cy, r) {
    ctx.save();
    ctx.fillStyle = tintaDe(ctx, cx, cy, r);
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.1, cy - r * 0.94);
    ctx.bezierCurveTo(cx + r * 0.5, cy - r * 0.44, cx + r * 0.76, cy + r * 0.02, cx + r * 0.6, cy + r * 0.4);
    ctx.bezierCurveTo(cx + r * 0.46, cy + r * 0.82, cx - r * 0.46, cy + r * 0.84, cx - r * 0.6, cy + r * 0.4);
    ctx.bezierCurveTo(cx - r * 0.78, cy + r * 0.02, cx - r * 0.56, cy - r * 0.34, cx - r * 0.3, cy - r * 0.68);
    ctx.bezierCurveTo(cx - r * 0.36, cy - r * 0.18, cx - r * 0.08, cy - r * 0.16, cx - r * 0.04, cy - r * 0.52);
    ctx.bezierCurveTo(cx, cy - r * 0.7, cx + r * 0.05, cy - r * 0.84, cx + r * 0.1, cy - r * 0.94);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* Arbol del Bosque: copa de tres lobulos y tronco que se abre en la base. */
  function arbol(ctx, cx, cy, r) {
    ctx.save();
    ctx.fillStyle = tintaDe(ctx, cx, cy, r);
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.26, cy + r * 0.86);
    ctx.quadraticCurveTo(cx - r * 0.09, cy + r * 0.6, cx - r * 0.09, cy + r * 0.1);
    ctx.lineTo(cx + r * 0.09, cy + r * 0.1);
    ctx.quadraticCurveTo(cx + r * 0.09, cy + r * 0.6, cx + r * 0.26, cy + r * 0.86);
    ctx.closePath();
    ctx.fill();
    var lobulos = [
      [0, -0.46, 0.4],
      [-0.44, -0.2, 0.32],
      [0.44, -0.2, 0.32],
      [-0.25, 0.04, 0.3],
      [0.25, 0.04, 0.3],
      [0, -0.12, 0.38]
    ];
    lobulos.forEach(function (l) {
      ctx.beginPath();
      ctx.arc(cx + r * l[0], cy + r * l[1], r * l[2], 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function diamante(ctx, cx, cy, r, fondo) {
    ctx.save();
    ctx.fillStyle = tintaDe(ctx, cx, cy, r);
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.82);
    ctx.quadraticCurveTo(cx + r * 0.2, cy - r * 0.2, cx + r * 0.6, cy);
    ctx.quadraticCurveTo(cx + r * 0.2, cy + r * 0.2, cx, cy + r * 0.82);
    ctx.quadraticCurveTo(cx - r * 0.2, cy + r * 0.2, cx - r * 0.6, cy);
    ctx.quadraticCurveTo(cx - r * 0.2, cy - r * 0.2, cx, cy - r * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function rayo(ctx, cx, cy, r) {
    ctx.save();
    ctx.fillStyle = tintaDe(ctx, cx, cy, r);
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.34, cy - r * 0.84);
    ctx.lineTo(cx - r * 0.42, cy + r * 0.12);
    ctx.lineTo(cx - r * 0.04, cy + r * 0.12);
    ctx.lineTo(cx - r * 0.3, cy + r * 0.86);
    ctx.lineTo(cx + r * 0.44, cy - r * 0.12);
    ctx.lineTo(cx + r * 0.05, cy - r * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function copo(ctx, cx, cy, r) {
    ctx.save();
    ctx.strokeStyle = tintaDe(ctx, cx, cy, r);
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = 'round';
    for (var i = 0; i < 3; i++) {
      var a = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(a) * r * 0.74, cy - Math.sin(a) * r * 0.74);
      ctx.lineTo(cx + Math.cos(a) * r * 0.74, cy + Math.sin(a) * r * 0.74);
      ctx.stroke();
    }
    ctx.restore();
  }

  function giro(ctx, cx, cy, r, sentido) {
    ctx.save();
    ctx.strokeStyle = tintaDe(ctx, cx, cy, r);
    ctx.fillStyle = tintaDe(ctx, cx, cy, r);
    ctx.lineWidth = r * 0.26;
    ctx.lineCap = 'round';
    var ini = sentido > 0 ? -1.1 : 2.2;
    var fin = sentido > 0 ? 3.9 : -1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, ini, fin, sentido < 0);
    ctx.stroke();
    var puntaA = fin;
    var px = cx + Math.cos(puntaA) * r * 0.62;
    var py = cy + Math.sin(puntaA) * r * 0.62;
    var t = puntaA + (sentido > 0 ? Math.PI / 2 : -Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(t) * r * 0.4, py + Math.sin(t) * r * 0.4);
    ctx.lineTo(px + Math.cos(t + 2.4) * r * 0.4, py + Math.sin(t + 2.4) * r * 0.4);
    ctx.lineTo(px + Math.cos(t - 2.4) * r * 0.4, py + Math.sin(t - 2.4) * r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function dibujarGlifo(ctx, simbolo, cx, cy, r, fondo) {
    switch (simbolo) {
      case 'W': sol(ctx, cx, cy, r); return;
      case 'U': gota(ctx, cx, cy, r); return;
      case 'B': calavera(ctx, cx, cy, r, fondo); return;
      case 'R': llama(ctx, cx, cy, r); return;
      case 'G': arbol(ctx, cx, cy, r); return;
      case 'C': diamante(ctx, cx, cy, r, fondo); return;
      case 'S': copo(ctx, cx, cy, r); return;
      case 'T': giro(ctx, cx, cy, r, 1); return;
      case 'Q': giro(ctx, cx, cy, r, -1); return;
      case 'E': rayo(ctx, cx, cy, r); return;
      case 'P': glifoTexto(ctx, 'Φ', cx, cy, r); return;
      default: glifoTexto(ctx, simbolo, cx, cy, r);
    }
  }

  /* Disco en tres capas: anillo oscuro, cara con luz desde arriba a la
     izquierda y sombra interior abajo. Es lo que separa un circulo plano de
     una ficha impresa. */
  function discoBase(ctx, cx, cy, r, color, sombra) {
    var cara = r * 0.88;

    ctx.save();
    if (sombra > 0) {
      ctx.shadowColor = 'rgba(0,0,0,' + U.limitar(sombra, 0, 1) + ')';
      ctx.shadowBlur = r * 0.55;
      ctx.shadowOffsetY = r * 0.18;
    }
    ctx.fillStyle = '#17120f';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    var deg = ctx.createRadialGradient(
      cx - cara * 0.34, cy - cara * 0.4, cara * 0.08,
      cx, cy, cara * 1.12
    );
    deg.addColorStop(0, U.mezclar(color, 0.45));
    deg.addColorStop(0.5, color);
    deg.addColorStop(1, U.mezclar(color, -0.3));
    ctx.save();
    ctx.fillStyle = deg;
    ctx.beginPath();
    ctx.arc(cx, cy, cara, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cara, 0, Math.PI * 2);
    ctx.clip();
    var luz = ctx.createLinearGradient(cx - cara, cy - cara, cx + cara * 0.4, cy + cara * 0.7);
    luz.addColorStop(0, 'rgba(255,255,255,0.5)');
    luz.addColorStop(0.42, 'rgba(255,255,255,0.07)');
    luz.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = luz;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.lineWidth = cara * 0.2;
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.arc(cx, cy, cara * 0.94, Math.PI * 0.08, Math.PI * 0.92);
    ctx.stroke();
    ctx.restore();
  }

  /* Dibuja un simbolo completo (disco + glifo). Admite hibridos 'W/U',
     costes alternativos '2/W' y mana phyrexiano 'W/P'. */
  function dibujar(ctx, simbolo, cx, cy, r, opciones) {
    var op = opciones || {};
    var s = String(simbolo || '').toUpperCase().trim();
    if (!s) return;
    var partes = s.split('/');
    if (partes.length === 2 && partes[1] === 'P') {
      discoBase(ctx, cx, cy, r, fondoDe(partes[0]), op.sombra);
      dibujarGlifo(ctx, 'P', cx, cy, r * 0.78);
      return;
    }
    if (partes.length === 2) {
      var izq = partes[0];
      var der = partes[1];
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      discoBase(ctx, cx, cy, r, fondoDe(esNumero(izq) ? 'GENERICO' : izq), op.sombra);
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.2, cy + r * 1.2);
      ctx.lineTo(cx + r * 1.2, cy - r * 1.2);
      ctx.lineTo(cx + r * 1.2, cy + r * 1.2);
      ctx.closePath();
      ctx.fillStyle = U.mezclar(fondoDe(esNumero(der) ? 'GENERICO' : der), 0.04);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = 'rgba(20,14,12,0.75)';
      ctx.lineWidth = Math.max(1, r * 0.08);
      ctx.beginPath();
      ctx.arc(cx, cy, r - ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      dibujarGlifo(ctx, izq, cx - r * 0.33, cy - r * 0.33, r * 0.46, fondoDe(izq));
      dibujarGlifo(ctx, der, cx + r * 0.33, cy + r * 0.33, r * 0.46, fondoDe(der));
      return;
    }
    discoBase(ctx, cx, cy, r, fondoDe(s), op.sombra);
    dibujarGlifo(ctx, s, cx, cy, r * 0.72, fondoDe(s));
  }

  return {
    CATALOGO: CATALOGO,
    FONDOS: FONDOS,
    fondoDe: fondoDe,
    dibujar: dibujar
  };
});
