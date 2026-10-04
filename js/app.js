/* Arranque: une el modelo, el lienzo, las guias de seleccion y el panel.
   Guarda el trabajo en curso solo, para no perderlo al cerrar el navegador. */
(function (raiz) {
  'use strict';
  var U = raiz.CDUtil;
  var E = raiz.CDEstado;
  var R = raiz.CDRender;
  var UI = raiz.CDUI;
  var I = raiz.CDInteraccion;
  var Ga = raiz.CDGaleria;

  var CLAVE_ACTUAL = 'forja-cartas:actual';

  var lienzo = document.getElementById('lienzo');
  var guias = document.getElementById('guias');
  var ctx = lienzo.getContext('2d');
  var barra = document.getElementById('mensaje');
  var visor = document.getElementById('visor');

  lienzo.width = U.CARTA_ANCHO;
  lienzo.height = U.CARTA_ALTO;
  guias.width = U.CARTA_ANCHO;
  guias.height = U.CARTA_ALTO;

  var App = {
    carta: null,
    selId: null,
    fuentes: [],
    escalaExport: 1,
    instalacion: { evento: null },
    historial: new E.Historial(60),
    zoom: window.innerWidth < 760 ? 0.34 : 0.56
  };

  var temporizadorGuardado = null;
  var inter = null;

  function pintar() {
    R.dibujarCarta(ctx, App.carta, 1);
  }

  App.repintar = function () {
    pintar();
    if (inter) inter.dibujar();
    App.autoguardar();
  };

  App.guias = function () { if (inter) inter.dibujar(); };

  App.seleccionado = function () {
    return App.selId ? E.buscar(App.carta, App.selId) : null;
  };

  App.seleccionar = function (id) {
    App.selId = id;
    UI.refrescar('inspector');
    UI.refrescar('capas');
    App.guias();
  };

  App.registrar = function () {
    App.historial.registrar(App.carta);
    actualizarBotonesHistorial();
  };

  App.refrescar = function (parte) { UI.refrescar(parte); };

  App.mensaje = function (texto, esError) {
    barra.textContent = texto;
    barra.className = 'mensaje' + (esError ? ' error' : ' ok');
    clearTimeout(barra._t);
    barra._t = setTimeout(function () { barra.className = 'mensaje'; }, 6000);
  };

  App.autoguardar = function () {
    clearTimeout(temporizadorGuardado);
    temporizadorGuardado = setTimeout(function () {
      try {
        localStorage.setItem(CLAVE_ACTUAL, JSON.stringify(App.carta));
      } catch (e) {
        /* sin espacio: el usuario puede exportar a JSON */
      }
    }, 900);
  };

  App.nuevaCarta = function () {
    App.carta = E.nueva('magic-moderno');
    App.selId = null;
    App.historial = new E.Historial(60);
    App.registrar();
    UI.refrescar('todo');
    App.repintar();
    App.mensaje('Carta nueva lista.');
  };

  App.cargarCarta = function (carta) {
    App.carta = E.clonar(carta);
    App.selId = null;
    App.historial = new E.Historial(60);
    App.registrar();
    UI.refrescar('todo');
    App.repintar();
  };

  /* La carta nunca debe salirse de la pantalla: en el celular el zoom pedido
     se recorta al ancho disponible. */
  function aplicarZoom() {
    var caja = visor.parentElement;
    var disponible = Math.max(180, (caja.clientWidth || window.innerWidth) - 16);
    var ancho = Math.min(Math.round(U.CARTA_ANCHO * App.zoom), Math.round(disponible));
    visor.style.width = ancho + 'px';
    document.getElementById('zoom-valor').textContent =
      Math.round((ancho / U.CARTA_ANCHO) * 100) + ' %';
    App.guias();
  }

  function actualizarBotonesHistorial() {
    document.getElementById('deshacer').disabled = !App.historial.puedeDeshacer();
    document.getElementById('rehacer').disabled = !App.historial.puedeRehacer();
  }

  function deshacer() {
    App.historial.sincronizar(App.carta);
    var previo = App.historial.deshacer();
    if (!previo) return;
    App.carta = previo;
    if (App.selId && !E.buscar(App.carta, App.selId)) App.selId = null;
    UI.refrescar('todo');
    pintar();
    App.guias();
    actualizarBotonesHistorial();
  }

  function rehacer() {
    var sig = App.historial.rehacer();
    if (!sig) return;
    App.carta = sig;
    if (App.selId && !E.buscar(App.carta, App.selId)) App.selId = null;
    UI.refrescar('todo');
    pintar();
    App.guias();
    actualizarBotonesHistorial();
  }

  /* ------------------------------------------------------------ teclado */

  function escribiendo() {
    var a = document.activeElement;
    return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT');
  }

  document.addEventListener('keydown', function (ev) {
    var mod = ev.ctrlKey || ev.metaKey;
    if (mod && ev.key.toLowerCase() === 'z') {
      ev.preventDefault();
      if (ev.shiftKey) rehacer(); else deshacer();
      return;
    }
    if (mod && ev.key.toLowerCase() === 'y') { ev.preventDefault(); rehacer(); return; }
    if (mod && ev.key.toLowerCase() === 's') {
      ev.preventDefault();
      var r = Ga.guardar(App.carta);
      App.mensaje(r.ok ? 'Carta guardada en la galeria.' : r.error, !r.ok);
      UI.refrescar('galeria');
      return;
    }
    if (escribiendo()) return;
    var el = App.seleccionado();
    if (!el) return;
    if (mod && ev.key.toLowerCase() === 'd') {
      ev.preventDefault();
      App.registrar();
      var copia = E.duplicar(App.carta, el.id);
      App.selId = copia.id;
      UI.refrescar('todo');
      App.repintar();
      return;
    }
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      ev.preventDefault();
      App.registrar();
      E.eliminar(App.carta, el.id);
      App.selId = null;
      UI.refrescar('todo');
      App.repintar();
      return;
    }
    var paso = ev.shiftKey ? 10 : 1;
    var movido = true;
    if (ev.key === 'ArrowLeft') el.x -= paso;
    else if (ev.key === 'ArrowRight') el.x += paso;
    else if (ev.key === 'ArrowUp') el.y -= paso;
    else if (ev.key === 'ArrowDown') el.y += paso;
    else movido = false;
    if (movido) {
      ev.preventDefault();
      App.repintar();
      UI.refrescar('inspector');
    }
  });

  /* -------------------------------------------------------------- inicio */

  function restaurar() {
    try {
      var bruto = localStorage.getItem(CLAVE_ACTUAL);
      if (!bruto) return null;
      return E.migrar(JSON.parse(bruto));
    } catch (e) {
      return null;
    }
  }

  App.carta = restaurar() || E.nueva('magic-moderno');
  App.registrar();

  UI.iniciar(App, {
    instalar: document.getElementById('zona-instalar'),
    carta: document.getElementById('zona-carta'),
    textos: document.getElementById('zona-textos'),
    imagenes: document.getElementById('zona-imagenes'),
    combate: document.getElementById('zona-combate'),
    capas: document.getElementById('zona-capas'),
    inspector: document.getElementById('zona-inspector'),
    galeria: document.getElementById('zona-galeria')
  });

  inter = I.crear({
    lienzo: guias,
    carta: function () { return App.carta; },
    seleccionado: App.seleccionado,
    seleccionar: function (id) { App.seleccionar(id); },
    antesDeCambiar: function () { App.registrar(); },
    alCambiar: function () { pintar(); },
    trasCambiar: function () {
      UI.refrescar('inspector');
      App.autoguardar();
    }
  });

  R.alCargar(function () { App.repintar(); });

  document.getElementById('deshacer').addEventListener('click', deshacer);
  document.getElementById('rehacer').addEventListener('click', rehacer);
  document.getElementById('zoom-mas').addEventListener('click', function () {
    App.zoom = U.limitar(App.zoom + 0.08, 0.2, 1.4);
    aplicarZoom();
  });
  document.getElementById('zoom-menos').addEventListener('click', function () {
    App.zoom = U.limitar(App.zoom - 0.08, 0.2, 1.4);
    aplicarZoom();
  });
  document.getElementById('deseleccionar').addEventListener('click', function () {
    App.seleccionar(null);
  });
  window.addEventListener('resize', aplicarZoom);
  window.addEventListener('orientationchange', aplicarZoom);

  aplicarZoom();
  App.repintar();
  actualizarBotonesHistorial();

  /* Instalacion en el celular: el navegador solo admite el service worker en
     https o en localhost, asi que fuera de ahi la app sigue funcionando pero
     sin quedar disponible sin conexion. */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function () {
        return navigator.serviceWorker.ready;
      }).then(function () {
        App.mensaje('Guardada en este dispositivo: ya funciona sin conexion.');
      }).catch(function () {
        /* sin service worker la app funciona igual, solo que en linea */
      });
    });
  }

  /* Chrome avisa cuando la app se puede instalar; guardamos el aviso para
     ofrecerlo con un boton propio, que es mas facil de encontrar que el menu
     del navegador. */
  window.addEventListener('beforeinstallprompt', function (ev) {
    ev.preventDefault();
    App.instalacion.evento = ev;
    UI.refrescar('instalar');
    App.mensaje('Esta app se puede instalar: mira el boton "Instalar" del panel.');
  });

  window.addEventListener('appinstalled', function () {
    App.instalacion.evento = null;
    UI.refrescar('instalar');
    App.mensaje('Instalada en este dispositivo.');
  });

  raiz.App = App;
})(typeof self !== 'undefined' ? self : this);
