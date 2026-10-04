/* Seleccion, arrastre, redimension y giro de elementos sobre la vista previa.
   Dibuja sus guias en un lienzo superpuesto para no contaminar la exportacion. */
(function (raiz) {
  'use strict';
  var U = raiz.CDUtil;

  function crear(op) {
    var lienzo = op.lienzo;           // canvas de guias (750 x 1050)
    var ctx = lienzo.getContext('2d');
    var estado = { modo: null, el: null, asa: null, ini: null };

    function factor() {
      var caja = lienzo.getBoundingClientRect();
      return caja.width ? U.CARTA_ANCHO / caja.width : 1;
    }

    function aCarta(evento) {
      var caja = lienzo.getBoundingClientRect();
      return {
        x: ((evento.clientX - caja.left) / caja.width) * U.CARTA_ANCHO,
        y: ((evento.clientY - caja.top) / caja.height) * U.CARTA_ALTO
      };
    }

    function asas(el) {
      var f = factor();
      var t = 11 * f;
      var lista = [
        { id: 'ni', x: 0, y: 0 },
        { id: 'nd', x: el.w, y: 0 },
        { id: 'si', x: 0, y: el.h },
        { id: 'sd', x: el.w, y: el.h },
        { id: 'n', x: el.w / 2, y: 0 },
        { id: 's', x: el.w / 2, y: el.h },
        { id: 'i', x: 0, y: el.h / 2 },
        { id: 'd', x: el.w, y: el.h / 2 },
        { id: 'giro', x: el.w / 2, y: -34 * f }
      ];
      return { lista: lista, tam: t };
    }

    function asaEn(el, punto) {
      var p = U.puntoLocal(punto.x, punto.y, el);
      var a = asas(el);
      for (var i = 0; i < a.lista.length; i++) {
        var h = a.lista[i];
        if (Math.abs(p.x - h.x) <= a.tam && Math.abs(p.y - h.y) <= a.tam) return h.id;
      }
      return null;
    }

    function elementoEn(punto) {
      var carta = op.carta();
      for (var i = carta.elementos.length - 1; i >= 0; i--) {
        var el = carta.elementos[i];
        if (!el.visible || el.bloqueado) continue;
        if (U.dentro(punto.x, punto.y, el, 0)) return el;
      }
      return null;
    }

    function alPulsar(ev) {
      if (ev.button !== 0) return;
      lienzo.setPointerCapture(ev.pointerId);
      var punto = aCarta(ev);
      var sel = op.seleccionado();
      if (sel && !sel.bloqueado) {
        var asa = asaEn(sel, punto);
        if (asa) {
          estado.modo = asa === 'giro' ? 'giro' : 'escala';
          estado.el = sel;
          estado.asa = asa;
          estado.ini = {
            punto: punto,
            x: sel.x, y: sel.y, w: sel.w, h: sel.h, rot: sel.rot || 0,
            angulo: Math.atan2(punto.y - (sel.y + sel.h / 2), punto.x - (sel.x + sel.w / 2))
          };
          op.antesDeCambiar();
          return;
        }
      }
      var el = elementoEn(punto);
      if (el !== sel) op.seleccionar(el ? el.id : null);
      if (el) {
        estado.modo = 'mover';
        estado.el = el;
        estado.ini = { punto: punto, x: el.x, y: el.y };
        op.antesDeCambiar();
      }
      dibujar();
    }

    function alMover(ev) {
      if (!estado.modo) {
        var el = elementoEn(aCarta(ev));
        lienzo.style.cursor = el ? 'move' : 'default';
        return;
      }
      var punto = aCarta(ev);
      var el2 = estado.el;
      var dx = punto.x - estado.ini.punto.x;
      var dy = punto.y - estado.ini.punto.y;
      if (estado.modo === 'mover') {
        if (ev.shiftKey) {
          if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0;
        }
        el2.x = Math.round(estado.ini.x + dx);
        el2.y = Math.round(estado.ini.y + dy);
      } else if (estado.modo === 'giro') {
        var cx = el2.x + el2.w / 2;
        var cy = el2.y + el2.h / 2;
        var ang = Math.atan2(punto.y - cy, punto.x - cx);
        var grados = estado.ini.rot + ((ang - estado.ini.angulo) * 180) / Math.PI;
        if (ev.shiftKey) grados = Math.round(grados / 15) * 15;
        el2.rot = Math.round(grados * 10) / 10;
      } else {
        // Las asas trabajan en el sistema del elemento para respetar el giro.
        var ang2 = ((el2.rot || 0) * Math.PI) / 180;
        var lx = dx * Math.cos(-ang2) - dy * Math.sin(-ang2);
        var ly = dx * Math.sin(-ang2) + dy * Math.cos(-ang2);
        var i = estado.ini;
        var nx = i.x, ny = i.y, nw = i.w, nh = i.h;
        var a = estado.asa;
        if (a.indexOf('i') !== -1) { nx = i.x + lx; nw = i.w - lx; }
        if (a.indexOf('d') !== -1) { nw = i.w + lx; }
        if (a.indexOf('n') !== -1) { ny = i.y + ly; nh = i.h - ly; }
        if (a.indexOf('s') !== -1) { nh = i.h + ly; }
        if (ev.shiftKey && i.w > 0 && i.h > 0) {
          var prop = i.w / i.h;
          nh = nw / prop;
          if (a.indexOf('n') !== -1) ny = i.y + (i.h - nh);
        }
        if (nw < 14) { nw = 14; nx = i.x; }
        if (nh < 14) { nh = 14; ny = i.y; }
        el2.x = Math.round(nx);
        el2.y = Math.round(ny);
        el2.w = Math.round(nw);
        el2.h = Math.round(nh);
      }
      op.alCambiar();
      dibujar();
    }

    function alSoltar(ev) {
      if (estado.modo) {
        estado.modo = null;
        estado.el = null;
        op.trasCambiar();
      }
      if (lienzo.hasPointerCapture && lienzo.hasPointerCapture(ev.pointerId)) {
        lienzo.releasePointerCapture(ev.pointerId);
      }
    }

    function dibujar() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      var el = op.seleccionado();
      if (!el) return;
      var f = factor();
      ctx.save();
      ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
      ctx.rotate(((el.rot || 0) * Math.PI) / 180);
      ctx.translate(-el.w / 2, -el.h / 2);
      ctx.lineWidth = 2 * f;
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.setLineDash([8 * f, 6 * f]);
      ctx.strokeRect(0, 0, el.w, el.h);
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.lineWidth = 1 * f;
      ctx.strokeRect(0, 0, el.w, el.h);
      if (!el.bloqueado) {
        var a = asas(el);
        a.lista.forEach(function (h) {
          ctx.beginPath();
          if (h.id === 'giro') {
            ctx.moveTo(el.w / 2, 0);
            ctx.lineTo(el.w / 2, h.y);
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 2 * f;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(h.x, h.y, a.tam * 0.75, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd37a';
          } else {
            ctx.rect(h.x - a.tam * 0.6, h.y - a.tam * 0.6, a.tam * 1.2, a.tam * 1.2);
            ctx.fillStyle = '#ffffff';
          }
          ctx.fill();
          ctx.lineWidth = 1.5 * f;
          ctx.strokeStyle = '#2a2420';
          ctx.stroke();
        });
      }
      ctx.restore();
    }

    lienzo.addEventListener('pointerdown', alPulsar);
    lienzo.addEventListener('pointermove', alMover);
    lienzo.addEventListener('pointerup', alSoltar);
    lienzo.addEventListener('pointercancel', alSoltar);

    return { dibujar: dibujar };
  }

  raiz.CDInteraccion = { crear: crear };
})(typeof self !== 'undefined' ? self : this);
