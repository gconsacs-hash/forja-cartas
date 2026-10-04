/* Modelo de la carta: creacion, migracion, orden de capas e historial.
   Logica pura: no toca el DOM, se prueba con node --test. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrica(require('./util.js'), require('./plantillas.js'));
  } else {
    raiz.CDEstado = fabrica(raiz.CDUtil, raiz.CDPlantillas);
  }
})(typeof self !== 'undefined' ? self : this, function (U, P) {
  'use strict';

  var VERSION = 1;

  var CAMPOS = [
    { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto' },
    { clave: 'coste', etiqueta: 'Coste', tipo: 'texto', ayuda: 'Magic: {2}{R}{R} o 2RR · MyL: un numero' },
    { clave: 'tipo', etiqueta: 'Tipo / raza', tipo: 'texto' },
    { clave: 'reglas', etiqueta: 'Habilidades', tipo: 'area' },
    { clave: 'ataque', etiqueta: 'Ataque / fuerza', tipo: 'contador' },
    { clave: 'defensa', etiqueta: 'Defensa', tipo: 'contador' },
    { clave: 'artista', etiqueta: 'Ilustrador', tipo: 'texto', grupo: 'coleccionista' },
    { clave: 'edicion', etiqueta: 'Edicion', tipo: 'texto', grupo: 'coleccionista' },
    { clave: 'rareza', etiqueta: 'Rareza (letra)', tipo: 'texto', grupo: 'coleccionista' },
    { clave: 'numero', etiqueta: 'Numero', tipo: 'texto', grupo: 'coleccionista' },
    { clave: 'idioma', etiqueta: 'Idioma', tipo: 'texto', grupo: 'coleccionista' },
    { clave: 'lealtad', etiqueta: 'Lealtad inicial', tipo: 'contador', solo: ['magic-planeswalker'] },
    { clave: 'pw1', etiqueta: 'Contador habilidad 1', tipo: 'texto', solo: ['magic-planeswalker'] },
    { clave: 'pw1t', etiqueta: 'Habilidad 1', tipo: 'area', solo: ['magic-planeswalker'] },
    { clave: 'pw2', etiqueta: 'Contador habilidad 2', tipo: 'texto', solo: ['magic-planeswalker'] },
    { clave: 'pw2t', etiqueta: 'Habilidad 2', tipo: 'area', solo: ['magic-planeswalker'] },
    { clave: 'pw3', etiqueta: 'Contador habilidad 3', tipo: 'texto', solo: ['magic-planeswalker'] },
    { clave: 'pw3t', etiqueta: 'Habilidad 3', tipo: 'area', solo: ['magic-planeswalker'] },
    { clave: 'saga1', etiqueta: 'Capitulo I', tipo: 'area', solo: ['magic-saga'] },
    { clave: 'saga2', etiqueta: 'Capitulo II', tipo: 'area', solo: ['magic-saga'] },
    { clave: 'saga3', etiqueta: 'Capitulo III', tipo: 'area', solo: ['magic-saga'] }
  ];

  /* Campos que tiene sentido mostrar para una plantilla dada. */
  function camposDe(plantillaId) {
    return CAMPOS.filter(function (c) {
      return !c.solo || c.solo.indexOf(plantillaId) !== -1;
    });
  }

  function camposPorDefecto() {
    return {
      nombre: 'Guardian de la Forja',
      coste: '{2}{R}{W}',
      tipo: 'Criatura legendaria — Enano guerrero',
      reglas: 'Prisa, vigilancia.\nSiempre que el Guardian de la Forja ataque, pon un contador +1/+1 sobre el.\n{T}: Agrega {R}.\n---\nEl yunque recuerda cada golpe.',
      ataque: '3',
      defensa: '4',
      artista: 'Ilustracion propia',
      edicion: 'FRJ',
      rareza: 'R',
      numero: '001/180',
      idioma: 'ES',
      lealtad: '4',
      pw1: '+1',
      pw1t: 'Roba una carta y despues descarta una carta.',
      pw2: '-2',
      pw2t: 'Crea una ficha de criatura Enano 2/2 con prisa.',
      pw3: '-7',
      pw3t: 'Las criaturas que controlas obtienen +3/+3 y vuelan hasta el final del turno.',
      saga1: 'Busca en tu biblioteca una carta de Montana y ponla en el campo de batalla girada.',
      saga2: 'Descarta una carta, despues roba dos cartas.',
      saga3: 'Exilia esta Saga, despues devuelvela al campo de batalla transformada.'
    };
  }

  function nueva(plantillaId, identidad) {
    var plantilla = P.crear(plantillaId || 'magic-moderno');
    return {
      version: VERSION,
      id: U.uid('carta'),
      titulo: 'Carta nueva',
      plantilla: plantilla.id,
      identidad: identidad ? identidad.slice() : ['R', 'W'],
      fondo: { color: plantilla.fondo.color, radio: plantilla.fondo.radio },
      campos: camposPorDefecto(),
      elementos: plantilla.elementos,
      creada: Date.now(),
      modificada: Date.now()
    };
  }

  /* Cambia de plantilla conservando los textos escritos y, si se pide,
     las imagenes ya cargadas (arte y fondo). */
  function cambiarPlantilla(carta, plantillaId, conservarImagenes) {
    var plantilla = P.crear(plantillaId);
    var imagenes = {};
    if (conservarImagenes !== false) {
      carta.elementos.forEach(function (el) {
        if (el.tipo === 'imagen' && el.src) imagenes[el.id] = el;
      });
    }
    var sueltos = carta.elementos.filter(function (el) { return el.anadido; });
    plantilla.elementos.forEach(function (el) {
      var previa = imagenes[el.id] || imagenes.arte || imagenes.fondo;
      if (el.tipo === 'imagen' && previa) {
        el.src = previa.src;
        el.modo = previa.modo;
        el.zoom = previa.zoom;
        el.despX = previa.despX;
        el.despY = previa.despY;
        el.filtros = JSON.parse(JSON.stringify(previa.filtros));
        el.vineta = previa.vineta;
      }
    });
    carta.plantilla = plantilla.id;
    carta.fondo = { color: plantilla.fondo.color, radio: plantilla.fondo.radio };
    carta.elementos = plantilla.elementos.concat(sueltos);
    carta.modificada = Date.now();
    return carta;
  }

  function buscar(carta, id) {
    for (var i = 0; i < carta.elementos.length; i++) {
      if (carta.elementos[i].id === id) return carta.elementos[i];
    }
    return null;
  }

  function indice(carta, id) {
    for (var i = 0; i < carta.elementos.length; i++) {
      if (carta.elementos[i].id === id) return i;
    }
    return -1;
  }

  /* delta -1 baja una capa, +1 sube una. */
  function moverCapa(carta, id, delta) {
    var i = indice(carta, id);
    if (i === -1) return false;
    var j = U.limitar(i + delta, 0, carta.elementos.length - 1);
    if (i === j) return false;
    var el = carta.elementos.splice(i, 1)[0];
    carta.elementos.splice(j, 0, el);
    return true;
  }

  function eliminar(carta, id) {
    var i = indice(carta, id);
    if (i === -1) return false;
    carta.elementos.splice(i, 1);
    return true;
  }

  function duplicar(carta, id) {
    var el = buscar(carta, id);
    if (!el) return null;
    var copia = JSON.parse(JSON.stringify(el));
    copia.id = U.uid(el.tipo);
    copia.etiqueta = el.etiqueta + ' (copia)';
    copia.x += 18;
    copia.y += 18;
    copia.anadido = true;
    copia.bloqueado = false;
    carta.elementos.splice(indice(carta, id) + 1, 0, copia);
    return copia;
  }

  function anadir(carta, tipo) {
    var el;
    if (tipo === 'texto') {
      el = P.texto(U.uid('texto'), 'Texto nuevo', 120, 440, 400, 70, 'Texto', {
        tamano: 34, color: '#f6efdf', alineacion: 'centro',
        sombra: { x: 0, y: 2, desenfoque: 6, color: 'rgba(0,0,0,0.85)' }
      });
    } else if (tipo === 'imagen') {
      el = P.imagen(U.uid('imagen'), 'Imagen nueva', 150, 300, 450, 320);
    } else if (tipo === 'mana') {
      el = P.mana(U.uid('mana'), 'Simbolos nuevos', 150, 300, 300, 56, { contenido: '{T}{R}' });
    } else {
      el = P.panel(U.uid('panel'), 'Panel nuevo', 150, 300, 450, 200, {
        relleno: { tipo: 'solido', color: 'rgba(12,10,9,0.75)' }, borde: { ancho: 2, color: 'auto-a' }
      });
    }
    el.anadido = true;
    carta.elementos.push(el);
    return el;
  }

  /* Acepta cartas guardadas por versiones anteriores y rellena lo que falte. */
  function migrar(datos) {
    var obj = typeof datos === 'string' ? JSON.parse(datos) : datos;
    if (!obj || typeof obj !== 'object') throw new Error('El archivo no contiene una carta.');
    if (!Array.isArray(obj.elementos)) throw new Error('La carta no tiene elementos.');
    var plantilla = P.crear(obj.plantilla || 'magic-moderno');
    var pordefecto = {};
    plantilla.elementos.forEach(function (el) { pordefecto[el.id] = el; });
    var carta = {
      version: VERSION,
      id: obj.id || U.uid('carta'),
      titulo: obj.titulo || obj.campos && obj.campos.nombre || 'Carta',
      plantilla: plantilla.id,
      identidad: Array.isArray(obj.identidad) ? obj.identidad.slice() : ['R'],
      fondo: {
        color: (obj.fondo && obj.fondo.color) || plantilla.fondo.color,
        radio: (obj.fondo && obj.fondo.radio != null) ? obj.fondo.radio : plantilla.fondo.radio
      },
      campos: Object.assign(camposPorDefecto(), obj.campos || {}),
      elementos: obj.elementos.map(function (el) {
        var modelo = pordefecto[el.id]
          ? JSON.parse(JSON.stringify(pordefecto[el.id]))
          : plantillaVacia(el.tipo);
        return P.fusionar(modelo, el);
      }),
      creada: obj.creada || Date.now(),
      modificada: Date.now()
    };
    CAMPOS.forEach(function (c) {
      if (carta.campos[c.clave] == null) carta.campos[c.clave] = '';
      carta.campos[c.clave] = String(carta.campos[c.clave]);
    });
    return carta;
  }

  function plantillaVacia(tipo) {
    if (tipo === 'texto') return P.texto('tmp', 'Texto', 0, 0, 200, 60, '', {});
    if (tipo === 'imagen') return P.imagen('tmp', 'Imagen', 0, 0, 200, 200);
    if (tipo === 'mana') return P.mana('tmp', 'Simbolos', 0, 0, 200, 50);
    if (tipo === 'simbolo') return P.simbolo('tmp', 'Simbolo de edicion', 0, 0, 50, 50);
    if (tipo === 'marca') return P.marca('tmp', 'Marca de agua', 0, 0, 180, 180);
    return P.panel('tmp', 'Panel', 0, 0, 200, 200);
  }

  function clonar(carta) {
    return JSON.parse(JSON.stringify(carta));
  }

  /* Historial sencillo de instantaneas con tope de pasos. */
  function Historial(tope) {
    this.tope = tope || 40;
    this.pasos = [];
    this.cursor = -1;
  }
  Historial.prototype.registrar = function (estado) {
    var s = JSON.stringify(estado);
    if (this.cursor >= 0 && this.pasos[this.cursor] === s) return false;
    this.pasos = this.pasos.slice(0, this.cursor + 1);
    this.pasos.push(s);
    if (this.pasos.length > this.tope) this.pasos.shift();
    this.cursor = this.pasos.length - 1;
    return true;
  };
  /* Las instantaneas se toman antes de cada cambio, asi que el estado actual
     todavia no esta en la pila: esto lo mete antes de deshacer para que
     "rehacer" pueda devolverlo. */
  Historial.prototype.sincronizar = function (estado) {
    if (this.cursor < this.pasos.length - 1) return false;
    return this.registrar(estado);
  };
  Historial.prototype.puedeDeshacer = function () { return this.cursor > 0; };
  Historial.prototype.puedeRehacer = function () { return this.cursor < this.pasos.length - 1; };
  Historial.prototype.deshacer = function () {
    if (!this.puedeDeshacer()) return null;
    this.cursor--;
    return JSON.parse(this.pasos[this.cursor]);
  };
  Historial.prototype.rehacer = function () {
    if (!this.puedeRehacer()) return null;
    this.cursor++;
    return JSON.parse(this.pasos[this.cursor]);
  };

  return {
    VERSION: VERSION,
    CAMPOS: CAMPOS,
    camposDe: camposDe,
    camposPorDefecto: camposPorDefecto,
    nueva: nueva,
    cambiarPlantilla: cambiarPlantilla,
    buscar: buscar,
    indice: indice,
    moverCapa: moverCapa,
    eliminar: eliminar,
    duplicar: duplicar,
    anadir: anadir,
    migrar: migrar,
    clonar: clonar,
    Historial: Historial
  };
});
