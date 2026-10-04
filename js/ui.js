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

  /* ------------------------------------------------------------ carta */

  function seccionCarta(caja) {
    caja.innerHTML = '';
    var g = C.grupo(caja, 'Carta y marco', true);

    C.seleccion(g, 'Plantilla',
      P.LISTA.map(function (p) { return [p.id, p.nombre]; }),
      function () { return carta().plantilla; },
      function (v) {
        if (!confirm('Cambiar de plantilla rehace el marco. Se conservan los textos y las imagenes. ¿Seguir?')) {
          App.refrescar('todo');
          return;
        }
        App.registrar();
        E.cambiarPlantilla(carta(), v, true);
        App.seleccionar(null);
        App.refrescar('todo');
        App.repintar();
      });
    var detalle = P.LISTA.filter(function (p) { return p.id === carta().plantilla; })[0];
    if (detalle) C.aviso(g, detalle.detalle);

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
    C.aviso(g, 'Varios colores a la vez dan marco dorado multicolor.');

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
    E.CAMPOS.forEach(function (campo) {
      if (campo.tipo === 'contador') return;
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

  /* --------------------------------------------------------- combate */

  function seccionCombate(caja) {
    caja.innerHTML = '';
    var g = C.grupo(caja, 'Ataque y defensa', true);
    var f = C.fila(g, 'contadores');
    C.contador(f, 'Ataque / fuerza',
      function () { return carta().campos.ataque; },
      function (v) { carta().campos.ataque = v; App.repintar(); });
    C.contador(f, 'Defensa / resistencia',
      function () { return carta().campos.defensa; },
      function (v) { carta().campos.defensa = v; App.repintar(); });

    var relacionados = carta().elementos.filter(function (el) {
      return /fr|fuerza|defensa/.test(el.id);
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
    C.seleccion(g, 'Relleno', [['solido', 'Color plano'], ['degradado', 'Degradado'], ['pergamino', 'Pergamino']],
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
      if (el.relleno.tipo === 'pergamino') {
        C.numero(g, 'Semilla de la textura', function () { return el.relleno.semilla || 7; },
          function (v) { el.relleno.semilla = v; App.repintar(); }, { min: 1, max: 999 });
      }
    }
    C.rango(g, 'Bisel (volumen)', function () { return el.bisel; },
      function (v) { el.bisel = v; App.repintar(); }, { min: 0, max: 1, paso: 0.02, decimales: 2 });
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

  function iniciar(app, contenedores) {
    App = app;
    zonas = contenedores;
    refrescar('todo');
  }

  function refrescar(parte) {
    if (parte === 'todo') {
      seccionCarta(zonas.carta);
      seccionTextos(zonas.textos);
      seccionImagenes(zonas.imagenes);
      seccionCombate(zonas.combate);
      seccionCapas(zonas.capas);
      seccionInspector(zonas.inspector);
      seccionGaleria(zonas.galeria);
      return;
    }
    if (parte === 'capas') {
      seccionCapas(zonas.capas);
      seccionInspector(zonas.inspector);
      seccionCombate(zonas.combate);
      return;
    }
    if (parte === 'inspector') { seccionInspector(zonas.inspector); return; }
    if (parte === 'galeria') { seccionGaleria(zonas.galeria); return; }
    if (parte === 'imagenes') { seccionImagenes(zonas.imagenes); return; }
  }

  raiz.CDUI = { iniciar: iniciar, refrescar: refrescar };
})(typeof self !== 'undefined' ? self : this);
