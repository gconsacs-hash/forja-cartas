/* Plantillas de carta. Cada plantilla devuelve una lista plana de elementos
   (paneles, imagenes, textos y costes) que el motor dibuja en orden.
   Todo elemento es editable despues: no hay marco "cerrado". */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.CDPlantillas = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var A = 750;   // ancho de la carta
  var H = 1050;  // alto de la carta

  var FUENTES = [
    { id: '"Cambria","Georgia",serif', nombre: 'Cambria (serif)' },
    { id: '"Constantia","Georgia",serif', nombre: 'Constantia' },
    { id: '"Georgia",serif', nombre: 'Georgia' },
    { id: '"Palatino Linotype","Book Antiqua","Palatino",serif', nombre: 'Palatino' },
    { id: '"Book Antiqua","Palatino Linotype",serif', nombre: 'Book Antiqua' },
    { id: '"Garamond","Georgia",serif', nombre: 'Garamond' },
    { id: '"Times New Roman",serif', nombre: 'Times New Roman' },
    { id: '"Trajan Pro","Cinzel","Georgia",serif', nombre: 'Trajan / Cinzel' },
    { id: '"Old English Text MT","Blackadder ITC",serif', nombre: 'Gotica inglesa' },
    { id: '"Algerian","Impact",sans-serif', nombre: 'Algerian' },
    { id: '"Papyrus","Segoe UI",sans-serif', nombre: 'Papyrus' },
    { id: '"Segoe UI",sans-serif', nombre: 'Segoe UI' },
    { id: '"Candara","Segoe UI",sans-serif', nombre: 'Candara' },
    { id: '"Trebuchet MS",sans-serif', nombre: 'Trebuchet MS' },
    { id: '"Arial Black","Impact",sans-serif', nombre: 'Arial Black' },
    { id: '"Impact",sans-serif', nombre: 'Impact' },
    { id: '"Consolas","Courier New",monospace', nombre: 'Consolas' }
  ];

  var SERIF = '"Cambria","Georgia",serif';
  var TITULO = '"Trajan Pro","Cinzel","Cambria",serif';

  function base(tipo, id, etiqueta, x, y, w, h) {
    return {
      id: id,
      tipo: tipo,
      etiqueta: etiqueta,
      x: x, y: y, w: w, h: h,
      rot: 0,
      opacidad: 1,
      visible: true,
      bloqueado: false
    };
  }

  function fusionar(destino, extra) {
    if (!extra) return destino;
    Object.keys(extra).forEach(function (k) {
      var v = extra[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && destino[k] && typeof destino[k] === 'object' && !Array.isArray(destino[k])) {
        fusionar(destino[k], v);
      } else {
        destino[k] = Array.isArray(v) ? v.slice() : v;
      }
    });
    return destino;
  }

  function panel(id, etiqueta, x, y, w, h, extra) {
    var el = base('panel', id, etiqueta, x, y, w, h);
    el.forma = 'rect';
    el.radio = 10;
    el.relleno = { tipo: 'degradado', color: 'auto-b', colores: ['auto-a', 'auto-b'], angulo: 90, semilla: 7 };
    el.borde = { ancho: 3, color: 'auto-oscuro' };
    el.borde2 = { ancho: 0, color: '#f0e2b0' };
    el.bisel = 0.25;
    el.sombra = { desenfoque: 0, color: 'rgba(0,0,0,0.55)', x: 0, y: 0 };
    return fusionar(el, extra);
  }

  function imagen(id, etiqueta, x, y, w, h, extra) {
    var el = base('imagen', id, etiqueta, x, y, w, h);
    el.src = '';
    el.modo = 'cubrir';
    el.zoom = 1;
    el.despX = 0;
    el.despY = 0;
    el.radio = 6;
    el.forma = 'rect';
    el.filtros = { brillo: 100, contraste: 100, saturacion: 100, desenfoque: 0, sepia: 0 };
    el.vineta = 0;
    el.borde = { ancho: 0, color: '#16110c' };
    el.relleno = { tipo: 'solido', color: '#1c1a18', colores: ['#2a2622', '#121010'], angulo: 90, semilla: 3 };
    return fusionar(el, extra);
  }

  function texto(id, etiqueta, x, y, w, h, contenido, estilo, extra) {
    var el = base('texto', id, etiqueta, x, y, w, h);
    el.contenido = contenido;
    el.estilo = fusionar({
      fuente: SERIF,
      tamano: 30,
      tamanoMin: 14,
      autoAjuste: false,
      peso: '700',
      cursiva: false,
      color: '#16120e',
      alineacion: 'izquierda',
      vertical: 'centro',
      interlineado: 1.22,
      espaciado: 0,
      caja: 'normal',
      tamanoSimbolo: 0.8,
      contorno: { ancho: 0, color: '#000000' },
      sombra: { x: 0, y: 0, desenfoque: 0, color: 'rgba(0,0,0,0.6)' }
    }, estilo);
    return fusionar(el, extra);
  }

  /* Simbolo de edicion: forma propia teñida segun la rareza. */
  function simbolo(id, etiqueta, x, y, w, h, extra) {
    var el = base('simbolo', id, etiqueta, x, y, w, h);
    el.forma = 'escudo';
    el.rareza = 'rara';
    el.borde = { ancho: 2, color: '#1a1512' };
    el.sombra = 0.4;
    return fusionar(el, extra);
  }

  /* Marca de agua detras del texto de reglas. */
  function marca(id, etiqueta, x, y, w, h, extra) {
    var el = base('marca', id, etiqueta, x, y, w, h);
    el.estilo = 'forma';        // 'forma' usa el catalogo propio; 'mana' usa los simbolos
    el.simbolo = 'yunque';
    el.color = 'auto-b';
    el.contorno = 0;
    el.colorContorno = '#000000';
    el.opacidad = 0.16;
    el.visible = false;
    return fusionar(el, extra);
  }

  function mana(id, etiqueta, x, y, w, h, extra) {
    var el = base('mana', id, etiqueta, x, y, w, h);
    el.contenido = '{{coste}}';
    el.tamano = 44;
    el.separacion = 6;
    el.alineacion = 'derecha';
    el.sombra = 0.45;
    return fusionar(el, extra);
  }

  /* ---------------------------------------------------------------- Magic */

  function magicModerno() {
    return {
      id: 'magic-moderno',
      fondo: { color: '#0b0a09', radio: 38 },
      elementos: [
        panel('marco', 'Marco', 22, 22, A - 44, H - 44, {
          radio: 24, bisel: 0.35,
          borde: { ancho: 4, color: 'auto-oscuro' }
        }),
        panel('banda-nombre', 'Banda del nombre', 44, 46, A - 88, 58, {
          radio: 14,
          relleno: { tipo: 'degradado', colores: ['auto-claro', 'auto-a'], angulo: 90 },
          borde: { ancho: 2, color: 'auto-oscuro' }, bisel: 0.3
        }),
        imagen('arte', 'Ilustracion', 52, 116, A - 104, 470, {
          radio: 4, borde: { ancho: 4, color: '#17130f' }
        }),
        panel('banda-tipo', 'Banda de tipo', 44, 596, A - 88, 54, {
          radio: 12,
          relleno: { tipo: 'degradado', colores: ['auto-claro', 'auto-a'], angulo: 90 },
          borde: { ancho: 2, color: 'auto-oscuro' }, bisel: 0.3
        }),
        panel('caja-texto', 'Caja de habilidades', 52, 660, A - 104, 318, {
          radio: 12,
          relleno: { tipo: 'pergamino', colores: ['#f6ead0', '#ddc9a4'], angulo: 90, semilla: 11 },
          borde: { ancho: 2, color: 'auto-oscuro' }, bisel: 0.12
        }),
        texto('nombre', 'Nombre', 60, 50, 430, 50, '{{nombre}}', {
          fuente: TITULO, tamano: 34, autoAjuste: true, tamanoMin: 18,
          color: '#191310', vertical: 'centro'
        }),
        mana('coste', 'Coste de mana', 492, 52, 202, 46, { tamano: 42, alineacion: 'derecha' }),
        texto('tipo', 'Linea de tipo', 60, 600, 500, 46, '{{tipo}}', {
          fuente: TITULO, tamano: 26, autoAjuste: true, tamanoMin: 14, color: '#191310'
        }),
        simbolo('simbolo-edicion', 'Simbolo de edicion', 636, 598, 50, 50),
        marca('marca-agua', 'Marca de agua', 274, 718, 200, 200),
        texto('reglas', 'Habilidades', 74, 674, A - 148, 290, '{{reglas}}', {
          fuente: SERIF, tamano: 28, tamanoMin: 13, autoAjuste: true, peso: '400',
          color: '#1b1510', vertical: 'centro', interlineado: 1.26
        }),
        panel('caja-fr', 'Caja de fuerza', A - 212, 950, 160, 66, {
          radio: 14,
          relleno: { tipo: 'degradado', colores: ['auto-claro', 'auto-b'], angulo: 90 },
          borde: { ancho: 3, color: 'auto-oscuro' }, bisel: 0.4,
          sombra: { desenfoque: 14, color: 'rgba(0,0,0,0.5)', x: 0, y: 3 }
        }),
        texto('fr', 'Ataque / defensa', A - 212, 952, 160, 62, '{{ataque}}/{{defensa}}', {
          fuente: TITULO, tamano: 40, autoAjuste: true, tamanoMin: 18,
          alineacion: 'centro', color: '#17120e'
        }),
        texto('credito', 'Datos del coleccionista', 60, 980, 430, 42,
          '{{numero}} {{rareza}} · {{edicion}} · {{idioma}}\n{{artista}}', {
            fuente: '"Segoe UI",sans-serif', tamano: 16, peso: '400', color: '#f1e9db',
            interlineado: 1.1, vertical: 'centro',
            sombra: { x: 1, y: 1, desenfoque: 2, color: 'rgba(0,0,0,0.8)' }
          })
      ]
    };
  }

  function magicClasico() {
    var p = magicModerno();
    p.id = 'magic-clasico';
    p.fondo = { color: '#09080a', radio: 26 };
    var por = {};
    p.elementos.forEach(function (el) { por[el.id] = el; });
    por.marco.radio = 10;
    por.marco.bisel = 0.5;
    por['banda-nombre'].radio = 2;
    por['banda-nombre'].y = 54;
    por['banda-nombre'].h = 52;
    por['banda-nombre'].relleno = { tipo: 'degradado', colores: ['auto-a', 'auto-claro'], angulo: 160 };
    por.nombre.y = 56;
    por.nombre.h = 48;
    por.nombre.estilo.fuente = SERIF;
    por.nombre.estilo.tamano = 32;
    por.coste.y = 58;
    por.coste.h = 44;
    por.arte.y = 118;
    por.arte.h = 440;
    por.arte.radio = 0;
    por.arte.borde = { ancho: 5, color: '#0d0b09' };
    por['banda-tipo'].y = 572;
    por['banda-tipo'].radio = 2;
    por.tipo.y = 576;
    por['simbolo-edicion'].y = 574;
    por['caja-texto'].y = 634;
    por['caja-texto'].h = 342;
    por['caja-texto'].radio = 4;
    por['caja-texto'].relleno = { tipo: 'pergamino', colores: ['#efe2c4', '#cdb78f'], angulo: 90, semilla: 19 };
    por.reglas.y = 648;
    por.reglas.h = 314;
    por['caja-fr'].radio = 4;
    por['caja-fr'].relleno = { tipo: 'degradado', colores: ['auto-a', 'auto-b'], angulo: 120 };
    return p;
  }

  function arteTotal() {
    return {
      id: 'arte-total',
      fondo: { color: '#000000', radio: 36 },
      elementos: [
        imagen('arte', 'Ilustracion a sangre', 0, 0, A, H, {
          radio: 36, borde: { ancho: 0, color: '#000000' }, vineta: 0.35
        }),
        panel('velo-nombre', 'Velo del nombre', 40, 44, A - 80, 64, {
          radio: 32,
          relleno: { tipo: 'degradado', colores: ['rgba(14,12,10,0.86)', 'rgba(14,12,10,0.42)'], angulo: 90 },
          borde: { ancho: 2, color: 'auto-a' }, bisel: 0
        }),
        panel('velo-texto', 'Velo de habilidades', 40, 640, A - 80, 332, {
          radio: 26,
          relleno: { tipo: 'degradado', colores: ['rgba(10,9,8,0.84)', 'rgba(10,9,8,0.92)'], angulo: 90 },
          borde: { ancho: 2, color: 'auto-a' }, bisel: 0
        }),
        texto('nombre', 'Nombre', 58, 48, 420, 56, '{{nombre}}', {
          fuente: TITULO, tamano: 36, autoAjuste: true, tamanoMin: 18, color: '#f6efdf',
          sombra: { x: 0, y: 2, desenfoque: 6, color: 'rgba(0,0,0,0.9)' }
        }),
        mana('coste', 'Coste de mana', 486, 50, 200, 52, { tamano: 46 }),
        texto('tipo', 'Linea de tipo', 58, 586, 470, 44, '{{tipo}}', {
          fuente: TITULO, tamano: 26, autoAjuste: true, tamanoMin: 13, color: '#f3e8d2',
          sombra: { x: 0, y: 2, desenfoque: 6, color: 'rgba(0,0,0,0.9)' }
        }),
        texto('reglas', 'Habilidades', 64, 656, A - 128, 300, '{{reglas}}', {
          fuente: SERIF, tamano: 28, tamanoMin: 13, autoAjuste: true, peso: '400',
          color: '#f1e7d6', interlineado: 1.3
        }),
        panel('caja-fr', 'Caja de fuerza', A - 206, 946, 158, 70, {
          forma: 'elipse',
          relleno: { tipo: 'degradado', colores: ['auto-a', 'auto-b'], angulo: 90 },
          borde: { ancho: 3, color: 'auto-oscuro' }, bisel: 0.4
        }),
        texto('fr', 'Ataque / defensa', A - 206, 948, 158, 66, '{{ataque}}/{{defensa}}', {
          fuente: TITULO, tamano: 40, autoAjuste: true, tamanoMin: 16, alineacion: 'centro', color: '#17120e'
        }),
        texto('credito', 'Ilustrador', 58, 988, 420, 28, '{{numero}} · {{artista}}', {
          fuente: '"Segoe UI",sans-serif', tamano: 17, peso: '400', color: '#e9ded0',
          sombra: { x: 1, y: 1, desenfoque: 3, color: 'rgba(0,0,0,0.9)' }
        })
      ]
    };
  }

  /* Variante legendaria: corona de puntas sobre la banda del nombre. */
  function magicLegendaria() {
    var p = magicModerno();
    p.id = 'magic-legendaria';
    var por = {};
    p.elementos.forEach(function (el) { por[el.id] = el; });
    por['banda-nombre'].y = 76;
    por['banda-nombre'].h = 56;
    por.nombre.y = 78;
    por.nombre.h = 52;
    por.coste.y = 82;
    por.coste.h = 46;
    por.arte.y = 144;
    por.arte.h = 442;
    var corona = panel('corona', 'Corona legendaria', 58, 30, A - 116, 60, {
      forma: 'corona',
      relleno: { tipo: 'degradado', colores: ['#f8e8b4', '#a9801f'], angulo: 90 },
      borde: { ancho: 3, color: '#4a3a12' },
      bisel: 0.45,
      sombra: { desenfoque: 12, color: 'rgba(0,0,0,0.5)', x: 0, y: 3 }
    });
    p.elementos.splice(p.elementos.indexOf(por['banda-nombre']), 0, corona);
    return p;
  }

  /* Arte extendido: la ilustracion llega a los bordes y el texto va sobre ella. */
  function magicExtendido() {
    var p = magicModerno();
    p.id = 'magic-extendido';
    var por = {};
    p.elementos.forEach(function (el) { por[el.id] = el; });
    var arte = por.arte;
    p.elementos.splice(p.elementos.indexOf(arte), 1);
    p.elementos.splice(1, 0, arte);
    arte.x = 0; arte.y = 0; arte.w = A; arte.h = 676;
    arte.radio = 30;
    arte.borde = { ancho: 0, color: '#000000' };
    arte.vineta = 0.18;
    por['banda-nombre'].relleno = {
      tipo: 'degradado', colores: ['rgba(14,12,10,0.88)', 'rgba(14,12,10,0.5)'], angulo: 90
    };
    por['banda-nombre'].borde = { ancho: 2, color: 'auto-a' };
    por['banda-nombre'].bisel = 0;
    por.nombre.estilo.color = '#f7efdf';
    por['banda-tipo'].y = 604;
    por['banda-tipo'].relleno = {
      tipo: 'degradado', colores: ['rgba(14,12,10,0.88)', 'rgba(14,12,10,0.5)'], angulo: 90
    };
    por['banda-tipo'].bisel = 0;
    por.tipo.y = 608;
    por.tipo.estilo.color = '#f3e8d2';
    por['simbolo-edicion'].y = 606;
    por['caja-texto'].y = 684;
    por['caja-texto'].h = 290;
    por.reglas.y = 696;
    por.reglas.h = 264;
    por['marca-agua'].y = 730;
    por['marca-agua'].h = 180;
    por['marca-agua'].w = 180;
    por['marca-agua'].x = 285;
    return p;
  }

  /* Ficha: sin coste de mana y con mas espacio de ilustracion. */
  function magicFicha() {
    var p = magicModerno();
    p.id = 'magic-ficha';
    p.elementos = p.elementos.filter(function (el) { return el.id !== 'coste'; });
    var por = {};
    p.elementos.forEach(function (el) { por[el.id] = el; });
    por.nombre.w = A - 120;
    por.nombre.estilo.alineacion = 'centro';
    por.arte.h = 540;
    por['banda-tipo'].y = 672;
    por.tipo.y = 676;
    por['simbolo-edicion'].y = 674;
    por['caja-texto'].y = 736;
    por['caja-texto'].h = 238;
    por.reglas.y = 748;
    por.reglas.h = 214;
    por['marca-agua'].y = 756;
    por['marca-agua'].h = 180;
    por['marca-agua'].w = 180;
    por['marca-agua'].x = 285;
    return p;
  }

  /* Caminante: tres habilidades con su contador y la lealtad inicial. */
  function magicPlaneswalker() {
    var filas = [
      { n: 1, y: 592 },
      { n: 2, y: 700 },
      { n: 3, y: 808 }
    ];
    var elementos = [
      panel('marco', 'Marco', 22, 22, A - 44, H - 44, {
        radio: 24, bisel: 0.35, borde: { ancho: 4, color: 'auto-oscuro' }
      }),
      panel('banda-nombre', 'Banda del nombre', 44, 46, A - 88, 58, {
        radio: 14,
        relleno: { tipo: 'degradado', colores: ['auto-claro', 'auto-a'], angulo: 90 },
        borde: { ancho: 2, color: 'auto-oscuro' }, bisel: 0.3
      }),
      imagen('arte', 'Ilustracion', 52, 116, A - 104, 404, {
        radio: 4, borde: { ancho: 4, color: '#17130f' }
      }),
      panel('banda-tipo', 'Banda de tipo', 44, 530, A - 88, 50, {
        radio: 12,
        relleno: { tipo: 'degradado', colores: ['auto-claro', 'auto-a'], angulo: 90 },
        borde: { ancho: 2, color: 'auto-oscuro' }, bisel: 0.3
      }),
      panel('caja-texto', 'Caja de habilidades', 52, 588, A - 104, 328, {
        radio: 12,
        relleno: { tipo: 'pergamino', colores: ['#f6ead0', '#ddc9a4'], angulo: 90, semilla: 31 },
        borde: { ancho: 2, color: 'auto-oscuro' }, bisel: 0.12
      }),
      texto('nombre', 'Nombre', 60, 50, 430, 50, '{{nombre}}', {
        fuente: TITULO, tamano: 34, autoAjuste: true, tamanoMin: 18, color: '#191310'
      }),
      mana('coste', 'Coste de mana', 492, 52, 202, 46, { tamano: 42 }),
      texto('tipo', 'Linea de tipo', 60, 534, 500, 42, '{{tipo}}', {
        fuente: TITULO, tamano: 24, autoAjuste: true, tamanoMin: 13, color: '#191310'
      }),
      simbolo('simbolo-edicion', 'Simbolo de edicion', 636, 532, 48, 48),
      marca('marca-agua', 'Marca de agua', 285, 650, 180, 180)
    ];
    filas.forEach(function (f) {
      elementos.push(panel('escudo' + f.n, 'Contador de la habilidad ' + f.n, 36, f.y + 16, 76, 76, {
        forma: 'escudo',
        relleno: { tipo: 'degradado', colores: ['auto-claro', 'auto-b'], angulo: 110 },
        borde: { ancho: 3, color: 'auto-oscuro' }, bisel: 0.4,
        sombra: { desenfoque: 12, color: 'rgba(0,0,0,0.5)', x: 1, y: 2 }
      }));
      elementos.push(texto('pw' + f.n, 'Coste de la habilidad ' + f.n, 36, f.y + 24, 76, 60,
        '{{pw' + f.n + '}}', {
          fuente: TITULO, tamano: 32, autoAjuste: true, tamanoMin: 14,
          alineacion: 'centro', color: '#17120e'
        }));
      elementos.push(texto('pw' + f.n + 't', 'Habilidad ' + f.n, 128, f.y + 8, 556, 92,
        '{{pw' + f.n + 't}}', {
          fuente: SERIF, tamano: 25, tamanoMin: 11, autoAjuste: true, peso: '400',
          color: '#1b1510', interlineado: 1.24
        }));
    });
    elementos.push(panel('caja-lealtad', 'Caja de lealtad', 578, 898, 130, 118, {
      forma: 'escudo',
      relleno: { tipo: 'degradado', colores: ['#8d8a86', '#1d1a18'], angulo: 110 },
      borde: { ancho: 3, color: '#0f0d0c' }, bisel: 0.45,
      sombra: { desenfoque: 16, color: 'rgba(0,0,0,0.55)', x: 1, y: 3 }
    }));
    elementos.push(texto('lealtad', 'Lealtad inicial', 578, 912, 130, 86, '{{lealtad}}', {
      fuente: TITULO, tamano: 48, autoAjuste: true, tamanoMin: 18,
      alineacion: 'centro', color: '#f7f1e3'
    }));
    elementos.push(texto('credito', 'Datos del coleccionista', 60, 952, 430, 44,
      '{{numero}} {{rareza}} · {{edicion}} · {{idioma}}\n{{artista}}', {
        fuente: '"Segoe UI",sans-serif', tamano: 16, peso: '400', color: '#f1e9db',
        interlineado: 1.1,
        sombra: { x: 1, y: 1, desenfoque: 2, color: 'rgba(0,0,0,0.8)' }
      }));
    return { id: 'magic-planeswalker', fondo: { color: '#0b0a09', radio: 38 }, elementos: elementos };
  }

  /* Saga: capitulos a la izquierda y la ilustracion alta a la derecha. */
  function magicSaga() {
    var capitulos = [
      { n: 1, numero: 'I', y: 132 },
      { n: 2, numero: 'II', y: 388 },
      { n: 3, numero: 'III', y: 644 }
    ];
    var elementos = [
      panel('marco', 'Marco', 22, 22, A - 44, H - 44, {
        radio: 24, bisel: 0.35, borde: { ancho: 4, color: 'auto-oscuro' }
      }),
      panel('banda-nombre', 'Banda del nombre', 44, 46, A - 88, 58, {
        radio: 14,
        relleno: { tipo: 'degradado', colores: ['auto-claro', 'auto-a'], angulo: 90 },
        borde: { ancho: 2, color: 'auto-oscuro' }, bisel: 0.3
      }),
      imagen('arte', 'Ilustracion', 376, 116, 322, 790, {
        radio: 6, borde: { ancho: 4, color: '#17130f' }
      }),
      panel('caja-texto', 'Columna de capitulos', 52, 116, 310, 790, {
        radio: 12,
        relleno: { tipo: 'pergamino', colores: ['#f6ead0', '#ddc9a4'], angulo: 90, semilla: 37 },
        borde: { ancho: 2, color: 'auto-oscuro' }, bisel: 0.12
      }),
      texto('nombre', 'Nombre', 60, 50, 430, 50, '{{nombre}}', {
        fuente: TITULO, tamano: 32, autoAjuste: true, tamanoMin: 16, color: '#191310'
      }),
      mana('coste', 'Coste de mana', 492, 52, 202, 46, { tamano: 42 }),
      marca('marca-agua', 'Marca de agua', 127, 420, 160, 160)
    ];
    capitulos.forEach(function (c) {
      elementos.push(panel('cap' + c.n, 'Disco del capitulo ' + c.n, 68, c.y + 14, 62, 62, {
        forma: 'elipse',
        relleno: { tipo: 'degradado', colores: ['auto-claro', 'auto-b'], angulo: 110 },
        borde: { ancho: 3, color: 'auto-oscuro' }, bisel: 0.4
      }));
      elementos.push(texto('capn' + c.n, 'Numero del capitulo ' + c.n, 68, c.y + 20, 62, 50,
        c.numero, {
          fuente: TITULO, tamano: 28, autoAjuste: true, tamanoMin: 12,
          alineacion: 'centro', color: '#17120e'
        }));
      elementos.push(texto('saga' + c.n, 'Capitulo ' + c.n, 144, c.y + 6, 200, 220,
        '{{saga' + c.n + '}}', {
          fuente: SERIF, tamano: 24, tamanoMin: 11, autoAjuste: true, peso: '400',
          color: '#1b1510', interlineado: 1.24, vertical: 'arriba'
        }));
    });
    elementos.push(panel('banda-tipo', 'Banda de tipo', 44, 920, A - 88, 50, {
      radio: 12,
      relleno: { tipo: 'degradado', colores: ['auto-claro', 'auto-a'], angulo: 90 },
      borde: { ancho: 2, color: 'auto-oscuro' }, bisel: 0.3
    }));
    elementos.push(texto('tipo', 'Linea de tipo', 60, 924, 490, 42, '{{tipo}}', {
      fuente: TITULO, tamano: 24, autoAjuste: true, tamanoMin: 12, color: '#191310'
    }));
    elementos.push(simbolo('simbolo-edicion', 'Simbolo de edicion', 636, 922, 48, 48));
    elementos.push(texto('credito', 'Datos del coleccionista', 60, 978, 430, 42,
      '{{numero}} {{rareza}} · {{edicion}} · {{idioma}}\n{{artista}}', {
        fuente: '"Segoe UI",sans-serif', tamano: 16, peso: '400', color: '#f1e9db',
        interlineado: 1.1,
        sombra: { x: 1, y: 1, desenfoque: 2, color: 'rgba(0,0,0,0.8)' }
      }));
    return { id: 'magic-saga', fondo: { color: '#0b0a09', radio: 38 }, elementos: elementos };
  }

  /* ------------------------------------------------- Mitos y Leyendas */

  function myl() {
    return {
      id: 'myl',
      fondo: { color: '#0a0806', radio: 30 },
      elementos: [
        panel('marco', 'Marco', 18, 18, A - 36, H - 36, {
          radio: 18, bisel: 0.4,
          relleno: { tipo: 'degradado', colores: ['auto-a', 'auto-b'], angulo: 115 },
          borde: { ancho: 4, color: 'auto-oscuro' },
          borde2: { ancho: 2, color: '#e8d08a' }
        }),
        imagen('arte', 'Ilustracion', 54, 128, A - 108, 528, {
          radio: 8, borde: { ancho: 5, color: '#241a10' }
        }),
        panel('cinta-nombre', 'Cinta del nombre', 120, 36, A - 240, 76, {
          forma: 'cinta', radio: 16,
          relleno: { tipo: 'degradado', colores: ['#f8ecc8', '#c9a456'], angulo: 90 },
          borde: { ancho: 3, color: '#6b4a1e' }, bisel: 0.35
        }),
        panel('disco-coste', 'Disco del coste', 26, 30, 104, 104, {
          forma: 'elipse',
          relleno: { tipo: 'degradado', colores: ['#fbf0cd', '#b98f3c'], angulo: 120 },
          borde: { ancho: 4, color: '#4b3312' }, bisel: 0.5,
          sombra: { desenfoque: 16, color: 'rgba(0,0,0,0.55)', x: 2, y: 3 }
        }),
        texto('nombre', 'Nombre', 140, 42, A - 280, 64, '{{nombre}}', {
          fuente: TITULO, tamano: 34, autoAjuste: true, tamanoMin: 16,
          alineacion: 'centro', color: '#2d1d0b'
        }),
        texto('coste', 'Coste', 26, 32, 104, 100, '{{coste}}', {
          fuente: TITULO, tamano: 52, autoAjuste: true, tamanoMin: 20,
          alineacion: 'centro', color: '#2d1d0b'
        }),
        panel('banda-raza', 'Banda de raza y tipo', 54, 666, A - 108, 50, {
          radio: 8,
          relleno: { tipo: 'degradado', colores: ['auto-claro', 'auto-b'], angulo: 90 },
          borde: { ancho: 2, color: 'auto-oscuro' }, bisel: 0.3
        }),
        texto('tipo', 'Raza y tipo', 68, 670, A - 136, 42, '{{tipo}}', {
          fuente: TITULO, tamano: 24, autoAjuste: true, tamanoMin: 12,
          alineacion: 'centro', color: '#1d1509'
        }),
        panel('caja-texto', 'Caja de habilidades', 54, 724, A - 108, 232, {
          radio: 10,
          relleno: { tipo: 'pergamino', colores: ['#f7eccd', '#dcc496'], angulo: 90, semilla: 23 },
          borde: { ancho: 3, color: '#6b4a1e' }, bisel: 0.14
        }),
        texto('reglas', 'Habilidades', 72, 736, A - 144, 208, '{{reglas}}', {
          fuente: SERIF, tamano: 26, tamanoMin: 12, autoAjuste: true, peso: '400',
          color: '#1d1509', interlineado: 1.26
        }),
        panel('disco-fuerza', 'Disco de fuerza', A - 142, 920, 108, 108, {
          forma: 'escudo',
          relleno: { tipo: 'degradado', colores: ['#f4dca0', '#9d6f24'], angulo: 120 },
          borde: { ancho: 4, color: '#4b3312' }, bisel: 0.45,
          sombra: { desenfoque: 16, color: 'rgba(0,0,0,0.55)', x: 2, y: 3 }
        }),
        texto('fuerza', 'Fuerza / ataque', A - 142, 930, 108, 86, '{{ataque}}', {
          fuente: TITULO, tamano: 48, autoAjuste: true, tamanoMin: 18,
          alineacion: 'centro', color: '#2a1c09'
        }),
        panel('disco-defensa', 'Disco de defensa', 34, 920, 108, 108, {
          forma: 'escudo', visible: false,
          relleno: { tipo: 'degradado', colores: ['#d9e6f2', '#4b6b8c'], angulo: 120 },
          borde: { ancho: 4, color: '#1d2b3a' }, bisel: 0.45,
          sombra: { desenfoque: 16, color: 'rgba(0,0,0,0.55)', x: 2, y: 3 }
        }),
        texto('defensa', 'Defensa', 34, 930, 108, 86, '{{defensa}}', {
          fuente: TITULO, tamano: 48, autoAjuste: true, tamanoMin: 18,
          alineacion: 'centro', color: '#f2f6fb'
        }, { visible: false }),
        texto('credito', 'Ilustrador y edicion', 160, 976, A - 320, 34, '{{edicion}} · {{artista}}', {
          fuente: '"Segoe UI",sans-serif', tamano: 17, peso: '400',
          alineacion: 'centro', color: '#f6ecd8',
          sombra: { x: 1, y: 1, desenfoque: 3, color: 'rgba(0,0,0,0.85)' }
        })
      ]
    };
  }

  function libre() {
    return {
      id: 'libre',
      fondo: { color: '#111010', radio: 30 },
      elementos: [
        imagen('fondo', 'Fondo', 0, 0, A, H, { radio: 30, vineta: 0 }),
        texto('nombre', 'Nombre', 60, 60, A - 120, 70, '{{nombre}}', {
          fuente: TITULO, tamano: 44, autoAjuste: true, tamanoMin: 18,
          alineacion: 'centro', color: '#f7f1e3',
          sombra: { x: 0, y: 3, desenfoque: 8, color: 'rgba(0,0,0,0.85)' }
        }),
        texto('reglas', 'Habilidades', 70, 760, A - 140, 200, '{{reglas}}', {
          fuente: SERIF, tamano: 28, tamanoMin: 12, autoAjuste: true, peso: '400',
          color: '#f3ead9', interlineado: 1.3,
          sombra: { x: 0, y: 2, desenfoque: 6, color: 'rgba(0,0,0,0.9)' }
        }),
        texto('fr', 'Ataque / defensa', A - 230, 960, 170, 60, '{{ataque}}/{{defensa}}', {
          fuente: TITULO, tamano: 44, autoAjuste: true, tamanoMin: 16,
          alineacion: 'derecha', color: '#f7f1e3',
          sombra: { x: 0, y: 2, desenfoque: 6, color: 'rgba(0,0,0,0.9)' }
        })
      ]
    };
  }

  var CREADORES = {
    'magic-moderno': magicModerno,
    'magic-clasico': magicClasico,
    'magic-legendaria': magicLegendaria,
    'magic-extendido': magicExtendido,
    'magic-ficha': magicFicha,
    'magic-planeswalker': magicPlaneswalker,
    'magic-saga': magicSaga,
    'arte-total': arteTotal,
    'myl': myl,
    'libre': libre
  };

  var LISTA = [
    { id: 'magic-moderno', nombre: 'Criatura', grupo: 'Estilo Magic', detalle: 'Marco con bandas, caja de reglas y fuerza/resistencia' },
    { id: 'magic-clasico', nombre: 'Clasica', grupo: 'Estilo Magic', detalle: 'Esquinas rectas y caja de texto amplia' },
    { id: 'magic-legendaria', nombre: 'Legendaria', grupo: 'Estilo Magic', detalle: 'Corona de puntas sobre el nombre' },
    { id: 'magic-extendido', nombre: 'Arte extendido', grupo: 'Estilo Magic', detalle: 'Ilustracion hasta los bordes, textos sobre ella' },
    { id: 'magic-ficha', nombre: 'Ficha', grupo: 'Estilo Magic', detalle: 'Sin coste de mana y con mas ilustracion' },
    { id: 'magic-planeswalker', nombre: 'Caminante', grupo: 'Estilo Magic', detalle: 'Tres habilidades con contador y lealtad inicial' },
    { id: 'magic-saga', nombre: 'Saga', grupo: 'Estilo Magic', detalle: 'Capitulos I, II y III con la ilustracion vertical' },
    { id: 'arte-total', nombre: 'Arte a sangre', grupo: 'Estilo Magic', detalle: 'Imagen de borde a borde con velos translucidos' },
    { id: 'myl', nombre: 'Aliado', grupo: 'Mitos y Leyendas', detalle: 'Cinta de nombre, disco de coste y escudo de fuerza' },
    { id: 'libre', nombre: 'Lienzo libre', grupo: 'Libre', detalle: 'Solo fondo, nombre, texto y contadores' }
  ];

  function crear(id) {
    var creador = CREADORES[id] || CREADORES['magic-moderno'];
    return creador();
  }

  return {
    ANCHO: A,
    ALTO: H,
    FUENTES: FUENTES,
    LISTA: LISTA,
    crear: crear,
    panel: panel,
    imagen: imagen,
    texto: texto,
    mana: mana,
    simbolo: simbolo,
    marca: marca,
    fusionar: fusionar
  };
});
