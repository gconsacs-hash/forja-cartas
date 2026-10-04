/* Panel lateral: datos de la carta, imagenes, contadores, capas e inspector
   del elemento seleccionado. Se reconstruye por secciones para no perder el
   foco mientras se escribe. */
(function (raiz) {
  'use strict';
  var C = raiz.CDControles;
  var U = raiz.CDUtil;
  var P = raiz.CDPlantillas;
  var E = raiz.CDEstado;
  var M = raiz.CDMana;
  var Ar = raiz.CDArchivos;
  var Ga = raiz.CDGaleria;
  var Ex = raiz.CDExportar;

  var App = null;
  var zonas = {};
  var ultimoCampo = null;

  function carta() { return App.carta; }

  function fuentes() {
    return P.FUENTES.map(function (f) { return [f.id, f.nombre]; })
      .concat(App.fuentes.map(function (n) { return ['"' + n + '",serif', n + ' (propia)']; }));
  }

  /* --------------------------------------------------------- instalar */

  function instalada() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }

  function navegador() {
    var ua = navigator.userAgent;
    // navegador incrustado de WhatsApp, Facebook o Instagram: nunca instala
    if (/FBAN|FBAV|Instagram|Line\/|; wv\)/.test(ua)) return 'incrustado';
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return /Chrome|Chromium/.test(ua) ? 'android' : 'android-otro';
    return 'escritorio';
  }

  function seccionInstalar(caja) {
    caja.innerHTML = '';
    if (instalada()) return;              // ya esta instalada: no estorbar
    if (location.protocol === 'file:') return;

    var g = C.grupo(caja, 'Instalar en este dispositivo', !!App.instalacion.evento);

    if (App.instalacion.evento) {
      C.boton(g, '⬇ Instalar Forja de Cartas', function () {
        var ev = App.instalacion.evento;
        if (!ev) return;
        App.instalacion.evento = null;
        ev.prompt();
        ev.userChoice.then(function (res) {
          if (res.outcome === 'accepted') {
            App.mensaje('Instalada. Busca el icono "Forja" entre tus aplicaciones.');
            App.refrescar('instalar');
          } else {
            App.mensaje('Instalacion cancelada. Puedes volver a intentarlo cuando quieras.');
            App.instalacion.evento = ev;
          }
        });
      });
      C.aviso(g, 'Queda con icono propio, a pantalla completa y funciona sin conexion.');
      return;
    }

    // Chrome no ofrecio instalar: explicamos la ruta de cada equipo
    var donde = navegador();
    if (donde === 'incrustado') {
      C.aviso(g, 'Estas viendo la pagina dentro de otra aplicacion (WhatsApp, Facebook o ' +
        'similar) y ese navegador no instala aplicaciones. Toca el menu ⋮ de arriba y elige ' +
        '"Abrir en Chrome" (o copia el enlace y pegalo en Chrome): ahi si aparece el boton ' +
        'de instalar.');
    } else if (donde === 'ios') {
      C.aviso(g, 'En iPhone o iPad: abre esta pagina en Safari (no en Chrome), toca el boton ' +
        'Compartir (el cuadrito con la flecha) y elige "Agregar a inicio".');
    } else if (donde === 'android') {
      C.aviso(g, 'En Chrome de Android: toca el menu ⋮ arriba a la derecha y elige ' +
        '"Agregar a la pantalla principal" o "Instalar aplicacion". Si no aparece, espera unos ' +
        'segundos y recarga la pagina: Chrome la ofrece despues de guardarla para uso sin conexion.');
    } else if (donde === 'android-otro') {
      C.aviso(g, 'Estas en un navegador que no instala aplicaciones. Abre esta misma direccion ' +
        'en Chrome y vuelve a intentarlo.');
    } else {
      C.aviso(g, 'En el computador: Chrome muestra un icono de instalar (una pantalla con una ' +
        'flecha) al final de la barra de direcciones; tambien esta en el menu ⋮ → "Enviar, guardar ' +
        'y compartir" → "Instalar pagina como aplicacion".');
    }

    var f = C.fila(g);
    C.boton(f, 'Copiar el enlace', function () {
      var url = location.href.split('?')[0];
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          App.mensaje('Enlace copiado: ' + url);
        }, function () {
          App.mensaje(url);
        });
      } else {
        App.mensaje(url);
      }
    }, 'mini');
    C.boton(f, 'Recargar', function () { location.reload(); }, 'mini');
  }

  /* ------------------------------------------------------------ carta */

  /* Galeria de marcos: cada miniatura es la carta actual dibujada con esa
     plantilla, asi se ve el resultado antes de cambiar. */
  function galeriaMarcos(caja) {
    var grupos = [];
    P.LISTA.forEach(function (info) {
      var g = grupos.filter(function (x) { return x.nombre === info.grupo; })[0];
      if (!g) { g = { nombre: info.grupo, items: [] }; grupos.push(g); }
      g.items.push(info);
    });
    grupos.forEach(function (grupo) {
      var tit = C.el('span', 'campo-nombre', caja);
      tit.textContent = grupo.nombre;
      var rejilla = C.el('div', 'marcos', caja);
      grupo.items.forEach(function (info) {
        var activo = carta().plantilla === info.id;
        var tarjeta = C.el('button', 'marco' + (activo ? ' activo' : ''), rejilla);
        tarjeta.type = 'button';
        tarjeta.title = info.detalle;
        var lienzo = C.el('canvas', null, tarjeta);
        var muestra = E.clonar(carta());
        if (!activo) E.cambiarPlantilla(muestra, info.id, true);
        Ex.miniatura(lienzo, muestra, 112);
        var pie = C.el('span', null, tarjeta);
        pie.textContent = info.nombre;
        tarjeta.addEventListener('click', function () {
          if (activo) return;
          App.registrar();
          E.cambiarPlantilla(carta(), info.id, true);
          App.seleccionar(null);
          App.refrescar('todo');
          App.repintar();
          App.mensaje('Marco cambiado a "' + info.nombre + '". Los textos y las imagenes se conservan.');
        });
      });
    });
  }

  /* Piezas que se encienden o apagan sin tocar el resto del marco. */
  function piezas(caja) {
    var opcionales = [
      { id: 'corona', nombre: 'Corona legendaria' },
      { id: 'simbolo-edicion', nombre: 'Simbolo de edicion' },
      { id: 'marca-agua', nombre: 'Marca de agua' },
      { id: 'caja-fr', nombre: 'Caja de fuerza/resistencia' },
      { id: 'credito', nombre: 'Datos del coleccionista' }
    ];
    var hay = false;
    opcionales.forEach(function (op) {
      var el = E.buscar(carta(), op.id);
      if (!el) return;
      hay = true;
      C.casilla(caja, op.nombre, function () { return el.visible; }, function (v) {
        App.registrar();
        el.visible = v;
        if (op.id === 'caja-fr') {
          var txt = E.buscar(carta(), 'fr');
          if (txt) txt.visible = v;
        }
        App.repintar();
        App.refrescar('capas');
      });
    });
    if (!hay) C.aviso(caja, 'Esta plantilla no trae piezas opcionales.');
  }

  function seccionCarta(caja) {
    caja.innerHTML = '';
    var gm = C.grupo(caja, 'Elegir marco', true);
    galeriaMarcos(gm);

    var g = C.grupo(caja, 'Color y piezas', true);
    var ident = C.el('div', 'identidad', g);
    var tit = C.el('span', 'campo-nombre', ident);
    tit.textContent = 'Identidad de color (pinta el marco)';
    var botones = C.el('div', 'identidad-botones', ident);
    [['W', 'Blanco'], ['U', 'Azul'], ['B', 'Negro'], ['R', 'Rojo'], ['G', 'Verde'],
     ['C', 'Incoloro'], ['A', 'Artefacto'], ['L', 'Tierra'],
     ['luz', 'Luz'], ['oscuridad', 'Oscuridad'], ['sangre', 'Sangre'],
     ['bosque', 'Bosque'], ['mar', 'Mar'], ['pergamino', 'Pergamino']
    ].forEach(function (par) {
      var b = C.boton(botones, par[1], function () {
        App.registrar();
        var i = carta().identidad.indexOf(par[0]);
        if (i === -1) carta().identidad.push(par[0]);
        else carta().identidad.splice(i, 1);
        App.refrescar('todo');
        App.repintar();
      }, 'chip' + (carta().identidad.indexOf(par[0]) !== -1 ? ' activo' : ''));
      var p = U.paleta([par[0]]);
      b.style.background = 'linear-gradient(135deg,' + p.a + ',' + p.b + ')';
      b.style.color = U.textoLegible(p.a);
    });
    C.seleccion(g, 'Cuando hay varios colores',
      [['oro', 'Un solo marco dorado'], ['mitades', 'Cada color en su lado']],
      function () { return carta().mezcla || 'oro'; },
      function (v) {
        App.registrar();
        carta().mezcla = v;
        App.repintar();
        App.refrescar('todo');
      });

    var tp = C.el('span', 'campo-nombre', g);
    tp.textContent = 'Piezas de esta plantilla';
    piezas(g);

    C.color(g, 'Borde exterior de la carta',
      function () { return carta().fondo.color; },
      function (v) { carta().fondo.color = v; App.repintar(); });
    C.rango(g, 'Redondeo de las esquinas',
      function () { return carta().fondo.radio; },
      function (v) { carta().fondo.radio = v; App.repintar(); },
      { min: 0, max: 60 });
  }

  /* ----------------------------------------------------------- textos */

  function barraSimbolos(caja) {
    var barra = C.el('div', 'simbolos', caja);
    M.CATALOGO.forEach(function (s) {
      var b = C.boton(barra, s, function () { insertar('{' + s + '}'); }, 'simbolo');
      var lienzo = document.createElement('canvas');
      lienzo.width = 36;
      lienzo.height = 36;
      M.dibujar(lienzo.getContext('2d'), s, 18, 18, 16, { sombra: 0 });
      b.textContent = '';
      b.style.backgroundImage = 'url(' + lienzo.toDataURL() + ')';
      b.title = s;
    });
  }

  function insertar(txt) {
    var inp = ultimoCampo;
    if (!inp) return;
    var ini = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
    var fin = inp.selectionEnd == null ? ini : inp.selectionEnd;
    inp.value = inp.value.slice(0, ini) + txt + inp.value.slice(fin);
    inp.selectionStart = inp.selectionEnd = ini + txt.length;
    inp.dispatchEvent(new Event('input'));
    inp.focus();
  }

  function recordar(inp) {
    inp.addEventListener('focus', function () { ultimoCampo = inp; });
    return inp;
  }

  function seccionTextos(caja) {
    caja.innerHTML = '';
    var g = C.grupo(caja, 'Textos de la carta', true);
    E.camposDe(carta().plantilla).forEach(function (campo) {
      if (campo.tipo === 'contador') return;
      if (campo.grupo === 'coleccionista') return;
      var obtener = function () { return carta().campos[campo.clave]; };
      var fijar = function (v) { carta().campos[campo.clave] = v; App.repintar(); };
      if (campo.tipo === 'area') {
        recordar(C.area(g, campo.etiqueta, obtener, fijar, {
          filas: 8,
          ayuda: 'Un renglon por habilidad · *cursiva* · --- separa el texto de ambiente'
        }));
        barraSimbolos(g);
      } else {
        recordar(C.texto(g, campo.etiqueta, obtener, fijar, { ayuda: campo.ayuda }));
      }
    });
    C.aviso(g, 'Los elementos del lienzo usan {{nombre}}, {{reglas}}, {{ataque}}... ' +
      'Puedes escribir cualquier texto fijo en el inspector.');
  }

  /* --------------------------------------------------------- imagenes */

  function elementosImagen() {
    return carta().elementos.filter(function (el) { return el.tipo === 'imagen'; });
  }

  function cargarEn(el, archivo) {
    Ar.leerImagen(archivo, function (err, res) {
      if (err) { App.mensaje(err.message, true); return; }
      App.registrar();
      el.src = res.datos;
      el.visible = true;
      App.repintar();
      App.refrescar('inspector');
      App.mensaje('Imagen cargada (' + res.ancho + ' x ' + res.alto + ' px).');
    });
  }

  function controlesImagen(g, el) {
    C.archivo(g, 'Archivo de imagen', function (archivo) { cargarEn(el, archivo); },
      { ayuda: 'JPG, PNG o WebP del equipo' });
    var fila = C.fila(g);
    C.boton(fila, 'Quitar imagen', function () {
      App.registrar();
      el.src = '';
      App.repintar();
      App.refrescar('inspector');
    }, 'mini');
    C.boton(fila, 'Centrar', function () {
      App.registrar();
      el.despX = 0;
      el.despY = 0;
      el.zoom = 1;
      App.repintar();
      App.refrescar('inspector');
    }, 'mini');
    C.seleccion(g, 'Ajuste', [['cubrir', 'Cubrir el hueco'], ['contener', 'Entrar completa'], ['estirar', 'Estirar']],
      function () { return el.modo; }, function (v) { el.modo = v; App.repintar(); });
    C.rango(g, 'Zoom', function () { return el.zoom; },
      function (v) { el.zoom = v; App.repintar(); }, { min: 0.2, max: 4, paso: 0.01, decimales: 2 });
    C.rango(g, 'Mover horizontal', function () { return el.despX; },
      function (v) { el.despX = v; App.repintar(); }, { min: -0.6, max: 0.6, paso: 0.005, decimales: 2 });
    C.rango(g, 'Mover vertical', function () { return el.despY; },
      function (v) { el.despY = v; App.repintar(); }, { min: -0.6, max: 0.6, paso: 0.005, decimales: 2 });
    C.rango(g, 'Brillo', function () { return el.filtros.brillo; },
      function (v) { el.filtros.brillo = v; App.repintar(); }, { min: 20, max: 200 });
    C.rango(g, 'Contraste', function () { return el.filtros.contraste; },
      function (v) { el.filtros.contraste = v; App.repintar(); }, { min: 20, max: 200 });
    C.rango(g, 'Saturacion', function () { return el.filtros.saturacion; },
      function (v) { el.filtros.saturacion = v; App.repintar(); }, { min: 0, max: 250 });
    C.rango(g, 'Sepia', function () { return el.filtros.sepia; },
      function (v) { el.filtros.sepia = v; App.repintar(); }, { min: 0, max: 100 });
    C.rango(g, 'Desenfoque', function () { return el.filtros.desenfoque; },
      function (v) { el.filtros.desenfoque = v; App.repintar(); }, { min: 0, max: 20, paso: 0.5, decimales: 1 });
    C.rango(g, 'Vineta (oscurecer bordes)', function () { return el.vineta; },
      function (v) { el.vineta = v; App.repintar(); }, { min: 0, max: 1, paso: 0.02, decimales: 2 });
    C.rango(g, 'Relieve (negativo = hundido)', function () { return el.relieve || 0; },
      function (v) { el.relieve = v; App.repintar(); }, { min: -1, max: 1, paso: 0.05, decimales: 2 });
    if (el.id === 'marco-imagen') {
      C.aviso(g, 'Esta capa va encima del arte: usa un PNG con el centro transparente ' +
        'y los textos quedaran sobre el.');
    }
  }

  function seccionImagenes(caja) {
    caja.innerHTML = '';
    var g = C.grupo(caja, 'Fondo e ilustracion', true);
    var lista = elementosImagen();
    if (!lista.length) {
      C.aviso(g, 'Esta plantilla no trae huecos de imagen. Usa "Fondo a sangre" o anade una imagen desde Capas.');
    }
    lista.forEach(function (el) {
      var sub = C.grupo(g, el.etiqueta + (el.src ? ' ✓' : ''), lista.length === 1);
      controlesImagen(sub, el);
    });
    var fila = C.fila(g);
    C.boton(fila, 'Fondo a sangre (detras de todo)', function () {
      var el = carta().elementos.filter(function (e) { return e.id === 'fondo-sangre'; })[0];
      if (!el) {
        App.registrar();
        el = P.imagen('fondo-sangre', 'Fondo a sangre', 0, 0, U.CARTA_ANCHO, U.CARTA_ALTO, {
          radio: carta().fondo.radio, borde: { ancho: 0, color: '#000' }
        });
        el.anadido = true;
        carta().elementos.unshift(el);
      }
      App.seleccionar(el.id);
      App.refrescar('todo');
      App.mensaje('Elige el archivo en "Fondo a sangre".');
    }, 'mini');
    C.archivo(g, 'Fuente tipografica propia (.ttf/.otf)', function (archivo) {
      Ar.cargarFuente(archivo, function (err, nombre) {
        if (err) { App.mensaje(err.message, true); return; }
        App.fuentes.push(nombre);
        App.refrescar('todo');
        App.repintar();
        App.mensaje('Fuente "' + nombre + '" disponible en el inspector de textos.');
      });
    }, { accept: '.ttf,.otf,.woff,.woff2' });
  }

  /* --------------------------------------------------------- edicion */

  function seccionEdicion(caja) {
    caja.innerHTML = '';
    var F = raiz.CDFormas;

    var simbolo = carta().elementos.filter(function (el) { return el.tipo === 'simbolo'; })[0];
    var g1 = C.grupo(caja, 'Simbolo de edicion', true);
    if (!simbolo) {
      C.aviso(g1, 'Esta plantilla no trae simbolo de edicion.');
      C.boton(g1, 'Anadir simbolo', function () {
        App.registrar();
        var el = P.simbolo(U.uid('simbolo'), 'Simbolo de edicion', 620, 600, 50, 50);
        el.anadido = true;
        carta().elementos.push(el);
        App.seleccionar(el.id);
        App.refrescar('todo');
        App.repintar();
      }, 'mini');
    } else {
      C.casilla(g1, 'Mostrarlo en la carta', function () { return simbolo.visible; },
        function (v) { App.registrar(); simbolo.visible = v; App.repintar(); App.refrescar('capas'); });
      var rejilla = C.el('div', 'formas', g1);
      F.CATALOGO.forEach(function (f) {
        var b = C.boton(rejilla, '', function () {
          App.registrar();
          simbolo.forma = f.id;
          App.repintar();
          App.refrescar('edicion');
        }, 'forma' + (simbolo.forma === f.id ? ' activo' : ''));
        b.title = f.nombre;
        var lienzo = document.createElement('canvas');
        lienzo.width = 40;
        lienzo.height = 40;
        var ctx = lienzo.getContext('2d');
        F.ruta(ctx, f.id, 20, 20, 17);
        ctx.fillStyle = '#e4d7bd';
        ctx.fill();
        b.style.backgroundImage = 'url(' + lienzo.toDataURL() + ')';
      });
      C.seleccion(g1, 'Rareza',
        Object.keys(F.RAREZAS).map(function (k) { return [k, F.RAREZAS[k].nombre]; }),
        function () { return simbolo.rareza; },
        function (v) { simbolo.rareza = v; App.repintar(); });
      C.rango(g1, 'Tamano', function () { return simbolo.w; }, function (v) {
        var centroX = simbolo.x + simbolo.w / 2;
        var centroY = simbolo.y + simbolo.h / 2;
        simbolo.w = v;
        simbolo.h = v;
        simbolo.x = Math.round(centroX - v / 2);
        simbolo.y = Math.round(centroY - v / 2);
        App.repintar();
      }, { min: 20, max: 140 });
      C.aviso(g1, 'Si prefieres el simbolo de una edicion tuya, anade una imagen desde Capas ' +
        'y colocala aqui mismo.');
    }

    var agua = carta().elementos.filter(function (el) { return el.tipo === 'marca'; })[0];
    var g2 = C.grupo(caja, 'Marca de agua', true);
    if (!agua) {
      C.aviso(g2, 'Esta plantilla no trae marca de agua.');
    } else {
      C.casilla(g2, 'Mostrarla detras del texto', function () { return agua.visible; },
        function (v) { App.registrar(); agua.visible = v; App.repintar(); App.refrescar('capas'); });
      C.seleccion(g2, 'Tipo de dibujo', [['forma', 'Figura propia'], ['mana', 'Simbolo de mana']],
        function () { return agua.estilo; },
        function (v) {
          agua.estilo = v;
          agua.simbolo = v === 'mana' ? 'R' : 'yunque';
          App.repintar();
          App.refrescar('edicion');
        });
      if (agua.estilo === 'mana') {
        C.seleccion(g2, 'Simbolo',
          ['W', 'U', 'B', 'R', 'G', 'C'].map(function (s) { return [s, s]; }),
          function () { return agua.simbolo; },
          function (v) { agua.simbolo = v; App.repintar(); });
      } else {
        C.seleccion(g2, 'Figura',
          F.CATALOGO.map(function (f) { return [f.id, f.nombre]; }),
          function () { return agua.simbolo; },
          function (v) { agua.simbolo = v; App.repintar(); });
        C.color(g2, 'Color', function () { return agua.color; },
          function (v) { agua.color = v; App.repintar(); });
      }
      C.rango(g2, 'Opacidad', function () { return agua.opacidad; },
        function (v) { agua.opacidad = v; App.repintar(); }, { min: 0, max: 1, paso: 0.02, decimales: 2 });
      C.rango(g2, 'Tamano', function () { return agua.w; }, function (v) {
        var cx = agua.x + agua.w / 2;
        var cy = agua.y + agua.h / 2;
        agua.w = v;
        agua.h = v;
        agua.x = Math.round(cx - v / 2);
        agua.y = Math.round(cy - v / 2);
        App.repintar();
      }, { min: 60, max: 420 });
    }

    var g3 = C.grupo(caja, 'Datos del coleccionista', true);
    E.CAMPOS.filter(function (c) { return c.grupo === 'coleccionista'; }).forEach(function (campo) {
      recordar(C.texto(g3, campo.etiqueta,
        function () { return carta().campos[campo.clave]; },
        function (v) { carta().campos[campo.clave] = v; App.repintar(); }));
    });
    C.aviso(g3, 'La linea inferior de la carta usa estos datos. Puedes reescribirla entera ' +
      'seleccionando "Datos del coleccionista" en Capas.');
  }

  /* --------------------------------------------------------- combate */

  function seccionCombate(caja) {
    caja.innerHTML = '';
    var g = C.grupo(caja, 'Ataque y defensa', true);
    var f = C.fila(g, 'contadores');
    E.camposDe(carta().plantilla).forEach(function (campo) {
      if (campo.tipo !== 'contador') return;
      C.contador(f, campo.etiqueta,
        function () { return carta().campos[campo.clave]; },
        function (v) { carta().campos[campo.clave] = v; App.repintar(); });
    });

    var relacionados = carta().elementos.filter(function (el) {
      return /^(caja-)?(fr|fuerza|defensa|lealtad)$/.test(el.id);
    });
    if (relacionados.length) {
      var tit = C.el('span', 'campo-nombre', g);
      tit.textContent = 'Mostrar en la carta';
      relacionados.forEach(function (el) {
        C.casilla(g, el.etiqueta, function () { return el.visible; }, function (v) {
          App.registrar();
          el.visible = v;
          App.repintar();
          App.refrescar('capas');
        });
      });
      C.aviso(g, 'Para mover o repintar estas cajas, seleccionalas en el lienzo o en Capas.');
    }
    C.aviso(g, 'Los discos y cajas aceptan cualquier texto: 3/4, */4, 7 o un contador de lealtad.');
  }

  /* ----------------------------------------------------------- capas */

  function seccionCapas(caja) {
    caja.innerHTML = '';
    var g = C.grupo(caja, 'Capas', true);
    var fila = C.fila(g);
    C.boton(fila, '+ Texto', function () { nuevo('texto'); }, 'mini');
    C.boton(fila, '+ Imagen', function () { nuevo('imagen'); }, 'mini');
    C.boton(fila, '+ Panel', function () { nuevo('panel'); }, 'mini');
    C.boton(fila, '+ Simbolos', function () { nuevo('mana'); }, 'mini');

    var ul = C.el('ul', 'capas', g);
    carta().elementos.slice().reverse().forEach(function (el) {
      var li = C.el('li', 'capa' + (App.selId === el.id ? ' activa' : ''), ul);
      var nombre = C.el('button', 'capa-nombre', li);
      nombre.type = 'button';
      nombre.textContent = el.etiqueta;
      nombre.title = el.tipo;
      nombre.addEventListener('click', function () {
        App.seleccionar(el.id);
        App.refrescar('capas');
      });
      var acciones = C.el('div', 'capa-acciones', li);
      icono(acciones, el.visible ? '👁' : '◻', 'Ver u ocultar', function () {
        App.registrar();
        el.visible = !el.visible;
        App.repintar();
        App.refrescar('capas');
      });
      icono(acciones, el.bloqueado ? '🔒' : '🔓', 'Bloquear', function () {
        el.bloqueado = !el.bloqueado;
        App.refrescar('capas');
      });
      icono(acciones, '▲', 'Subir', function () {
        App.registrar();
        E.moverCapa(carta(), el.id, 1);
        App.repintar();
        App.refrescar('capas');
      });
      icono(acciones, '▼', 'Bajar', function () {
        App.registrar();
        E.moverCapa(carta(), el.id, -1);
        App.repintar();
        App.refrescar('capas');
      });
    });
  }

  function icono(padre, texto, titulo, alPulsar) {
    var b = C.boton(padre, texto, alPulsar, 'icono');
    b.title = titulo;
    return b;
  }

  function nuevo(tipo) {
    App.registrar();
    var el = E.anadir(carta(), tipo);
    App.seleccionar(el.id);
    App.refrescar('todo');
    App.repintar();
  }

  /* ------------------------------------------------------- inspector */

  function seccionInspector(caja) {
    caja.innerHTML = '';
    var el = App.seleccionado();
    if (!el) {
      var vacio = C.grupo(caja, 'Inspector del elemento', true);
      C.aviso(vacio, 'Pulsa un elemento en la carta (o en Capas) para cambiarle todo: ' +
        'posicion, tamano, giro, colores, tipografia y contenido.');
      return;
    }
    var g = C.grupo(caja, 'Inspector · ' + el.etiqueta, true);

    C.texto(g, 'Nombre de la capa', function () { return el.etiqueta; },
      function (v) { el.etiqueta = v; });

    var f0 = C.fila(g, 'dos');
    C.casilla(f0, 'Visible', function () { return el.visible; },
      function (v) { el.visible = v; App.repintar(); App.refrescar('capas'); });
    C.casilla(f0, 'Bloqueado', function () { return el.bloqueado; },
      function (v) { el.bloqueado = v; App.refrescar('capas'); });

    var f1 = C.fila(g, 'cuatro');
    ['x', 'y', 'w', 'h'].forEach(function (k) {
      C.numero(f1, k.toUpperCase(), function () { return el[k]; },
        function (v) { el[k] = v; App.repintar(); App.guias(); });
    });
    C.rango(g, 'Giro (grados)', function () { return el.rot || 0; },
      function (v) { el.rot = v; App.repintar(); App.guias(); }, { min: -180, max: 180, paso: 0.5, decimales: 1 });
    C.rango(g, 'Opacidad', function () { return el.opacidad; },
      function (v) { el.opacidad = v; App.repintar(); }, { min: 0, max: 1, paso: 0.02, decimales: 2 });

    if (el.tipo === 'panel') inspectorPanel(g, el);
    if (el.tipo === 'imagen') {
      var gi = C.grupo(caja, 'Imagen', true);
      controlesImagen(gi, el);
      inspectorForma(gi, el);
    }
    if (el.tipo === 'texto') inspectorTexto(caja, el);
    if (el.tipo === 'mana') inspectorMana(caja, el);

    var acc = C.fila(g);
    C.boton(acc, 'Duplicar', function () {
      App.registrar();
      var copia = E.duplicar(carta(), el.id);
      App.seleccionar(copia.id);
      App.refrescar('todo');
      App.repintar();
    }, 'mini');
    C.boton(acc, 'Eliminar', function () {
      App.registrar();
      E.eliminar(carta(), el.id);
      App.seleccionar(null);
      App.refrescar('todo');
      App.repintar();
    }, 'mini peligro');
  }

  function inspectorForma(g, el) {
    C.seleccion(g, 'Forma', [['rect', 'Rectangulo'], ['elipse', 'Elipse'], ['escudo', 'Escudo'],
      ['cinta', 'Cinta'], ['rombo', 'Rombo']],
      function () { return el.forma; }, function (v) { el.forma = v; App.repintar(); });
    C.rango(g, 'Redondeo', function () { return el.radio; },
      function (v) { el.radio = v; App.repintar(); }, { min: 0, max: 80 });
    C.rango(g, 'Borde', function () { return el.borde.ancho; },
      function (v) { el.borde.ancho = v; App.repintar(); }, { min: 0, max: 24, paso: 0.5, decimales: 1 });
    C.color(g, 'Color del borde', function () { return el.borde.color; },
      function (v) { el.borde.color = v; App.repintar(); });
  }

  function inspectorPanel(g, el) {
    inspectorForma(g, el);
    C.seleccion(g, 'Relleno', [['solido', 'Color plano'], ['degradado', 'Degradado'],
      ['metal', 'Metal'], ['cuero', 'Cuero'], ['pergamino', 'Pergamino']],
      function () { return el.relleno.tipo; },
      function (v) { el.relleno.tipo = v; App.repintar(); App.refrescar('inspector'); });
    if (el.relleno.tipo === 'solido') {
      C.color(g, 'Color', function () { return el.relleno.color; },
        function (v) { el.relleno.color = v; App.repintar(); });
    } else {
      C.color(g, 'Color 1', function () { return el.relleno.colores[0]; },
        function (v) { el.relleno.colores[0] = v; App.repintar(); });
      C.color(g, 'Color 2', function () { return el.relleno.colores[1]; },
        function (v) { el.relleno.colores[1] = v; App.repintar(); });
      C.rango(g, 'Angulo del degradado', function () { return el.relleno.angulo; },
        function (v) { el.relleno.angulo = v; App.repintar(); }, { min: 0, max: 360 });
      if (/pergamino|metal|cuero/.test(el.relleno.tipo)) {
        C.numero(g, 'Semilla de la textura', function () { return el.relleno.semilla || 7; },
          function (v) { el.relleno.semilla = v; App.repintar(); }, { min: 1, max: 999 });
      }
    }
    C.rango(g, 'Bisel (volumen)', function () { return el.bisel; },
      function (v) { el.bisel = v; App.repintar(); }, { min: 0, max: 1, paso: 0.02, decimales: 2 });
    C.rango(g, 'Relieve (negativo = hundido)', function () { return el.relieve || 0; },
      function (v) { el.relieve = v; App.repintar(); }, { min: -1, max: 1, paso: 0.05, decimales: 2 });
    C.rango(g, 'Filete interior', function () { return el.borde2.ancho; },
      function (v) { el.borde2.ancho = v; App.repintar(); }, { min: 0, max: 12, paso: 0.5, decimales: 1 });
    C.color(g, 'Color del filete', function () { return el.borde2.color; },
      function (v) { el.borde2.color = v; App.repintar(); });
    C.rango(g, 'Sombra', function () { return el.sombra.desenfoque; },
      function (v) { el.sombra.desenfoque = v; App.repintar(); }, { min: 0, max: 40 });
  }

  function inspectorTexto(caja, el) {
    var e = el.estilo;
    var g = C.grupo(caja, 'Contenido', true);
    recordar(C.area(g, 'Texto o campo', function () { return el.contenido; },
      function (v) { el.contenido = v; App.repintar(); },
      { filas: 4, ayuda: 'Admite {{nombre}}, {{reglas}}, {{ataque}}/{{defensa}} y simbolos {W}' }));
    barraSimbolos(g);

    var t = C.grupo(caja, 'Tipografia', true);
    C.seleccion(t, 'Fuente', fuentes(), function () { return e.fuente; },
      function (v) { e.fuente = v; App.repintar(); });
    C.seleccion(t, 'Grosor', [['300', 'Fina'], ['400', 'Normal'], ['600', 'Seminegra'], ['700', 'Negrita'], ['900', 'Super negra']],
      function () { return e.peso; }, function (v) { e.peso = v; App.repintar(); });
    var f = C.fila(t, 'dos');
    C.casilla(f, 'Cursiva', function () { return e.cursiva; },
      function (v) { e.cursiva = v; App.repintar(); });
    C.casilla(f, 'Ajustar al hueco', function () { return e.autoAjuste; },
      function (v) { e.autoAjuste = v; App.repintar(); });
    C.rango(t, 'Tamano maximo', function () { return e.tamano; },
      function (v) { e.tamano = v; App.repintar(); }, { min: 8, max: 120 });
    C.rango(t, 'Tamano minimo al ajustar', function () { return e.tamanoMin; },
      function (v) { e.tamanoMin = v; App.repintar(); }, { min: 6, max: 80 });
    C.color(t, 'Color', function () { return e.color; },
      function (v) { e.color = v; App.repintar(); });
    C.seleccion(t, 'Alineacion', [['izquierda', 'Izquierda'], ['centro', 'Centro'], ['derecha', 'Derecha']],
      function () { return e.alineacion; }, function (v) { e.alineacion = v; App.repintar(); });
    C.seleccion(t, 'Vertical', [['arriba', 'Arriba'], ['centro', 'Centro'], ['abajo', 'Abajo']],
      function () { return e.vertical; }, function (v) { e.vertical = v; App.repintar(); });
    C.seleccion(t, 'Mayusculas', [['normal', 'Como se escribe'], ['mayusculas', 'TODO MAYUSCULAS'], ['minusculas', 'todo minusculas']],
      function () { return e.caja; }, function (v) { e.caja = v; App.repintar(); });
    C.rango(t, 'Interlineado', function () { return e.interlineado; },
      function (v) { e.interlineado = v; App.repintar(); }, { min: 0.8, max: 2.2, paso: 0.02, decimales: 2 });
    C.rango(t, 'Separacion de letras', function () { return e.espaciado; },
      function (v) { e.espaciado = v; App.repintar(); }, { min: -4, max: 20, paso: 0.5, decimales: 1 });
    C.rango(t, 'Tamano de los simbolos', function () { return e.tamanoSimbolo; },
      function (v) { e.tamanoSimbolo = v; App.repintar(); }, { min: 0.4, max: 1.6, paso: 0.02, decimales: 2 });

    var s = C.grupo(caja, 'Contorno y sombra', false);
    C.rango(s, 'Contorno', function () { return e.contorno.ancho; },
      function (v) { e.contorno.ancho = v; App.repintar(); }, { min: 0, max: 12, paso: 0.5, decimales: 1 });
    C.color(s, 'Color del contorno', function () { return e.contorno.color; },
      function (v) { e.contorno.color = v; App.repintar(); });
    C.rango(s, 'Sombra: difusion', function () { return e.sombra.desenfoque; },
      function (v) { e.sombra.desenfoque = v; App.repintar(); }, { min: 0, max: 30 });
    C.rango(s, 'Sombra: horizontal', function () { return e.sombra.x; },
      function (v) { e.sombra.x = v; App.repintar(); }, { min: -12, max: 12 });
    C.rango(s, 'Sombra: vertical', function () { return e.sombra.y; },
      function (v) { e.sombra.y = v; App.repintar(); }, { min: -12, max: 12 });
    C.color(s, 'Color de la sombra', function () { return e.sombra.color; },
      function (v) { e.sombra.color = v; App.repintar(); }, { respaldo: '#000000' });
  }

  function inspectorMana(caja, el) {
    var g = C.grupo(caja, 'Simbolos', true);
    recordar(C.texto(g, 'Simbolos', function () { return el.contenido; },
      function (v) { el.contenido = v; App.repintar(); },
      { ayuda: '{{coste}} toma el coste de la carta; tambien admite {2}{R}{W/U}{T}' }));
    barraSimbolos(g);
    C.rango(g, 'Tamano', function () { return el.tamano; },
      function (v) { el.tamano = v; App.repintar(); }, { min: 12, max: 120 });
    C.rango(g, 'Separacion', function () { return el.separacion; },
      function (v) { el.separacion = v; App.repintar(); }, { min: -10, max: 40 });
    C.seleccion(g, 'Alineacion', [['izquierda', 'Izquierda'], ['centro', 'Centro'], ['derecha', 'Derecha']],
      function () { return el.alineacion; }, function (v) { el.alineacion = v; App.repintar(); });
    C.rango(g, 'Sombra', function () { return el.sombra; },
      function (v) { el.sombra = v; App.repintar(); }, { min: 0, max: 1, paso: 0.05, decimales: 2 });
  }

  /* -------------------------------------------------------- galeria */

  function seccionGaleria(caja) {
    caja.innerHTML = '';
    var g = C.grupo(caja, 'Mis cartas', true);
    var fila = C.fila(g);
    C.boton(fila, 'Guardar carta', function () {
      var r = Ga.guardar(carta());
      if (!r.ok) App.mensaje(r.error, true);
      else App.mensaje('Guardada. Tienes ' + r.total + ' carta(s).');
      App.refrescar('galeria');
    });
    C.boton(fila, 'Nueva', function () {
      if (!confirm('Empezar una carta nueva. ¿Guardaste la actual?')) return;
      App.nuevaCarta();
    }, 'mini');

    var lista = Ga.leer();
    var rejilla = C.el('div', 'rejilla', g);
    if (!lista.length) C.aviso(g, 'Aun no hay cartas guardadas en este navegador.');
    lista.forEach(function (c) {
      var tarjeta = C.el('div', 'tarjeta', rejilla);
      var lienzo = C.el('canvas', null, tarjeta);
      Ex.miniatura(lienzo, c, 150);
      var nombre = C.el('span', 'tarjeta-nombre', tarjeta);
      nombre.textContent = c.campos.nombre || c.titulo;
      var acc = C.el('div', 'tarjeta-acciones', tarjeta);
      C.boton(acc, 'Abrir', function () {
        App.cargarCarta(c);
      }, 'mini');
      C.boton(acc, 'PNG', function () {
        Ex.png(c, 1, function () { App.mensaje('PNG exportado.'); });
      }, 'mini');
      C.boton(acc, '✕', function () {
        if (!confirm('¿Borrar "' + (c.campos.nombre || 'carta') + '" de la galeria?')) return;
        Ga.eliminar(c.id);
        App.refrescar('galeria');
      }, 'mini peligro');
    });

    var g2 = C.grupo(caja, 'Exportar e importar', false);
    C.seleccion(g2, 'Calidad del PNG',
      [['1', '300 ppp (750 x 1050) · imprenta'], ['2', '600 ppp (1500 x 2100) · maxima'], ['0.5', 'Pantalla (375 x 525)']],
      function () { return String(App.escalaExport); },
      function (v) { App.escalaExport = parseFloat(v); });
    var fe = C.fila(g2);
    C.boton(fe, 'PNG de esta carta', function () {
      Ex.png(carta(), App.escalaExport, function (err, info) { App.mensaje('PNG exportado: ' + info); });
    });
    C.boton(fe, 'JSON de esta carta', function () { Ex.json(carta()); }, 'mini');
    var fe2 = C.fila(g2);
    C.boton(fe2, 'Hoja A4 (9 cartas)', function () {
      var cartas = Ga.leer();
      if (!cartas.length) cartas = [carta()];
      Ex.hojaA4(cartas, function (err, n) {
        if (err) App.mensaje(err.message, true);
        else App.mensaje('Hoja A4 con ' + n + ' carta(s) lista para imprimir al 100 %.');
      });
    }, 'mini');
    C.boton(fe2, 'Respaldo completo', function () {
      Ex.jsonLote(Ga.leer());
    }, 'mini');
    var g3 = C.grupo(caja, 'Version de la app', false);
    C.aviso(g3, 'La app se actualiza sola: cuando hay una version nueva aparece arriba el ' +
      'boton "Actualizar". Aqui puedes comprobarlo a mano.');
    C.boton(g3, 'Buscar actualizacion ahora', function () {
      if (App.buscarActualizacion) App.buscarActualizacion();
      else App.mensaje('Esta copia se abrio sin instalar.');
    }, 'mini');

    C.archivo(g2, 'Importar JSON', function (archivo) {
      Ar.leerTexto(archivo, function (err, texto) {
        if (err) { App.mensaje(err.message, true); return; }
        try {
          var datos = JSON.parse(texto);
          if (Array.isArray(datos)) {
            var cartas = datos.map(function (c) { return E.migrar(c); });
            var r = Ga.importar(cartas);
            if (!r.ok) App.mensaje(r.error, true);
            else App.mensaje('Importadas ' + r.anadidas + ' carta(s).');
            App.refrescar('galeria');
          } else {
            App.cargarCarta(E.migrar(datos));
            App.mensaje('Carta cargada desde el archivo.');
          }
        } catch (e) {
          App.mensaje('El archivo no es una carta valida: ' + e.message, true);
        }
      });
    }, { accept: '.json,application/json' });
  }

  /* --------------------------------------------------------- arranque */

  /* Pestanas: cada una arma su contenido en el mismo contenedor. */
  var PESTANAS = [
    { id: 'marco', nombre: 'Marco', construir: seccionCarta },
    { id: 'texto', nombre: 'Texto', construir: seccionTextos },
    { id: 'arte', nombre: 'Arte', construir: seccionImagenes },
    { id: 'edicion', nombre: 'Edicion', construir: seccionEdicion },
    { id: 'contadores', nombre: 'Contadores', construir: seccionCombate },
    { id: 'guardar', nombre: 'Guardar', construir: seccionGaleria }
  ];
  var activa = 'marco';

  function barraPestanas() {
    zonas.pestanas.innerHTML = '';
    PESTANAS.forEach(function (p) {
      C.boton(zonas.pestanas, p.nombre, function () {
        activa = p.id;
        barraPestanas();
        construirActiva();
        zonas.pestana.scrollIntoView({ block: 'nearest' });
      }, 'pestana' + (activa === p.id ? ' activa' : ''));
    });
  }

  function construirActiva() {
    var def = PESTANAS.filter(function (p) { return p.id === activa; })[0] || PESTANAS[0];
    def.construir(zonas.pestana);
  }

  function iniciar(app, contenedores) {
    App = app;
    zonas = contenedores;
    refrescar('todo');
  }

  function refrescar(parte) {
    if (parte === 'inspector') { seccionInspector(zonas.inspector); return; }
    if (parte === 'capas') {
      seccionCapas(zonas.capas);
      seccionInspector(zonas.inspector);
      return;
    }
    if (parte === 'instalar') { seccionInstalar(zonas.instalar); return; }
    if (parte === 'todo') {
      seccionInstalar(zonas.instalar);
      barraPestanas();
      construirActiva();
      seccionCapas(zonas.capas);
      seccionInspector(zonas.inspector);
      return;
    }
    construirActiva();   // galeria, imagenes, edicion...
  }

  /* Deja a la vista la pestana que corresponde (la usa el inspector). */
  function abrir(id) {
    activa = id;
    barraPestanas();
    construirActiva();
  }

  raiz.CDUI = { iniciar: iniciar, refrescar: refrescar, abrir: abrir };
})(typeof self !== 'undefined' ? self : this);
