/* Exportacion: PNG de una carta, hoja A4 lista para imprimir y recortar,
   y copias de seguridad en JSON. */
(function (raiz) {
  'use strict';
  var U = raiz.CDUtil;
  var R = raiz.CDRender;
  var A = raiz.CDArchivos;

  function lienzoCarta(carta, escala) {
    var lienzo = document.createElement('canvas');
    lienzo.width = Math.round(U.CARTA_ANCHO * escala);
    lienzo.height = Math.round(U.CARTA_ALTO * escala);
    var ctx = lienzo.getContext('2d');
    R.dibujarCarta(ctx, carta, escala);
    return lienzo;
  }

  /* Espera a que terminen de decodificarse las imagenes en uso; sin esto la
     primera exportacion podria salir con la ilustracion en blanco. */
  function conImagenes(carta, cb) {
    var pendientes = [];
    carta.elementos.forEach(function (el) {
      if (el.tipo === 'imagen' && el.src && !R.imagenLista(el.src)) pendientes.push(el.src);
    });
    if (!pendientes.length) return cb();
    var faltan = pendientes.length;
    pendientes.forEach(function (src) {
      var img = new Image();
      img.onload = img.onerror = function () {
        R.cargarImagen(src);
        if (--faltan === 0) setTimeout(cb, 30);
      };
      img.src = src;
    });
  }

  function png(carta, escala, cb) {
    conImagenes(carta, function () {
      var lienzo = lienzoCarta(carta, escala);
      lienzo.toBlob(function (blob) {
        A.descargarBlob(blob, U.nombreArchivo(carta.campos.nombre, 'png'));
        if (cb) cb(null, lienzo.width + ' x ' + lienzo.height + ' px');
      }, 'image/png');
    });
  }

  /* Hoja A4 a 300 ppp con 3 x 3 cartas de 63,5 x 88,9 mm y marcas de corte. */
  function hojaA4(cartas, cb) {
    var ANCHO = 2480, ALTO = 3508;
    var cw = U.CARTA_ANCHO, ch = U.CARTA_ALTO;
    var cols = 3, filas = 3;
    var margenX = Math.round((ANCHO - cols * cw) / 2);
    var margenY = Math.round((ALTO - filas * ch) / 2);
    var lienzo = document.createElement('canvas');
    lienzo.width = ANCHO;
    lienzo.height = ALTO;
    var ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ANCHO, ALTO);

    var listas = cartas.slice(0, cols * filas);
    var faltan = listas.length;
    if (!faltan) return cb(new Error('No hay cartas para la hoja.'));

    listas.forEach(function (carta, i) {
      conImagenes(carta, function () {
        var sub = lienzoCarta(carta, 1);
        var x = margenX + (i % cols) * cw;
        var y = margenY + Math.floor(i / cols) * ch;
        ctx.drawImage(sub, x, y);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
        if (--faltan === 0) {
          // marcas de corte en los margenes
          ctx.strokeStyle = '#999';
          for (var c = 0; c <= cols; c++) {
            var mx = margenX + c * cw;
            linea(ctx, mx, 0, mx, margenY - 12);
            linea(ctx, mx, ALTO, mx, ALTO - margenY + 12);
          }
          for (var f = 0; f <= filas; f++) {
            var my = margenY + f * ch;
            linea(ctx, 0, my, margenX - 12, my);
            linea(ctx, ANCHO, my, ANCHO - margenX + 12, my);
          }
          lienzo.toBlob(function (blob) {
            A.descargarBlob(blob, 'hoja-cartas-a4.png');
            cb(null, listas.length);
          }, 'image/png');
        }
      });
    });
  }

  function linea(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1 + 0.5, y1 + 0.5);
    ctx.lineTo(x2 + 0.5, y2 + 0.5);
    ctx.stroke();
  }

  function json(carta) {
    A.descargarTexto(JSON.stringify(carta, null, 2), U.nombreArchivo(carta.campos.nombre, 'json'));
  }

  function jsonLote(cartas, nombre) {
    A.descargarTexto(JSON.stringify(cartas, null, 2), nombre || 'forja-cartas-respaldo.json');
  }

  function miniatura(lienzo, carta, ancho) {
    var escala = ancho / U.CARTA_ANCHO;
    lienzo.width = Math.round(U.CARTA_ANCHO * escala);
    lienzo.height = Math.round(U.CARTA_ALTO * escala);
    R.dibujarCarta(lienzo.getContext('2d'), carta, escala);
  }

  raiz.CDExportar = {
    png: png,
    hojaA4: hojaA4,
    json: json,
    jsonLote: jsonLote,
    miniatura: miniatura,
    lienzoCarta: lienzoCarta,
    conImagenes: conImagenes
  };
})(typeof self !== 'undefined' ? self : this);
