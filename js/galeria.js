/* Galeria de cartas guardadas en el propio navegador (localStorage).
   Las miniaturas se dibujan al vuelo, asi el almacenamiento solo guarda datos. */
(function (raiz) {
  'use strict';
  var E = raiz.CDEstado;
  var CLAVE = 'forja-cartas:v1';

  function leer() {
    try {
      var bruto = localStorage.getItem(CLAVE);
      if (!bruto) return [];
      var lista = JSON.parse(bruto);
      if (!Array.isArray(lista)) return [];
      return lista.map(function (c) {
        try { return E.migrar(c); } catch (e) { return null; }
      }).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function escribir(lista) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(lista));
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: 'No cabe en el almacen del navegador. Exporta las cartas a JSON y borra alguna, ' +
          'o usa imagenes mas livianas.'
      };
    }
  }

  function guardar(carta) {
    var lista = leer();
    var copia = E.clonar(carta);
    copia.modificada = Date.now();
    copia.titulo = (carta.campos && carta.campos.nombre) || carta.titulo || 'Carta';
    var i = -1;
    for (var k = 0; k < lista.length; k++) {
      if (lista[k].id === copia.id) { i = k; break; }
    }
    if (i === -1) lista.unshift(copia);
    else lista[i] = copia;
    var r = escribir(lista);
    r.total = lista.length;
    return r;
  }

  function eliminar(id) {
    var lista = leer().filter(function (c) { return c.id !== id; });
    return escribir(lista);
  }

  function obtener(id) {
    var lista = leer();
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === id) return lista[i];
    }
    return null;
  }

  function importar(lista) {
    var actual = leer();
    var porId = {};
    actual.forEach(function (c) { porId[c.id] = true; });
    var anadidas = 0;
    lista.forEach(function (c) {
      if (porId[c.id]) c.id = c.id + '-' + Math.random().toString(36).slice(2, 6);
      actual.unshift(c);
      anadidas++;
    });
    var r = escribir(actual);
    r.anadidas = anadidas;
    return r;
  }

  function vaciar() {
    return escribir([]);
  }

  raiz.CDGaleria = {
    CLAVE: CLAVE,
    leer: leer,
    guardar: guardar,
    eliminar: eliminar,
    obtener: obtener,
    importar: importar,
    vaciar: vaciar
  };
})(typeof self !== 'undefined' ? self : this);
