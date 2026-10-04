/* Lectura y escritura de archivos locales: imagenes reescaladas, fuentes
   propias, descargas y lectura de JSON. Nada sale del equipo. */
(function (raiz) {
  'use strict';

  /* Reescala la imagen elegida para que quepa en el almacenamiento del
     navegador sin perder nitidez a 300 ppp (1600 px de lado basta para una
     ilustracion de 63 x 88 mm). Conserva PNG si la imagen trae transparencia. */
  function leerImagen(archivo, cb, maxLado) {
    var limite = maxLado || 1600;
    var lector = new FileReader();
    lector.onload = function () {
      var img = new Image();
      img.onload = function () {
        var escala = Math.min(1, limite / Math.max(img.naturalWidth, img.naturalHeight));
        var w = Math.max(1, Math.round(img.naturalWidth * escala));
        var h = Math.max(1, Math.round(img.naturalHeight * escala));
        var lienzo = document.createElement('canvas');
        lienzo.width = w;
        lienzo.height = h;
        var ctx = lienzo.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        var conservarAlfa = /png|webp|gif|svg/i.test(archivo.type || '');
        var datos;
        try {
          datos = conservarAlfa
            ? lienzo.toDataURL('image/png')
            : lienzo.toDataURL('image/jpeg', 0.9);
        } catch (e) {
          datos = String(lector.result);
        }
        cb(null, { datos: datos, ancho: w, alto: h, nombre: archivo.name });
      };
      img.onerror = function () { cb(new Error('No se pudo leer la imagen.')); };
      img.src = String(lector.result);
    };
    lector.onerror = function () { cb(new Error('No se pudo abrir el archivo.')); };
    lector.readAsDataURL(archivo);
  }

  function leerTexto(archivo, cb) {
    var lector = new FileReader();
    lector.onload = function () { cb(null, String(lector.result)); };
    lector.onerror = function () { cb(new Error('No se pudo abrir el archivo.')); };
    lector.readAsText(archivo);
  }

  /* Registra una fuente .ttf/.otf del equipo para usarla en las cartas. */
  function cargarFuente(archivo, cb) {
    var lector = new FileReader();
    lector.onload = function () {
      var nombre = (archivo.name || 'propia').replace(/\.[a-z0-9]+$/i, '').replace(/["']/g, '');
      try {
        var cara = new FontFace(nombre, 'url(' + String(lector.result) + ')');
        cara.load().then(function (f) {
          document.fonts.add(f);
          cb(null, nombre);
        }).catch(function () { cb(new Error('El navegador rechazo la fuente.')); });
      } catch (e) {
        cb(new Error('Este navegador no permite cargar fuentes.'));
      }
    };
    lector.onerror = function () { cb(new Error('No se pudo abrir la fuente.')); };
    lector.readAsDataURL(archivo);
  }

  function descargarBlob(blob, nombre) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function descargarTexto(texto, nombre, tipo) {
    descargarBlob(new Blob([texto], { type: tipo || 'application/json' }), nombre);
  }

  raiz.CDArchivos = {
    leerImagen: leerImagen,
    leerTexto: leerTexto,
    cargarFuente: cargarFuente,
    descargarBlob: descargarBlob,
    descargarTexto: descargarTexto
  };
})(typeof self !== 'undefined' ? self : this);
