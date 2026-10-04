/* Motor de texto de las cartas: simbolos {W}, cursiva *asi*, separador ---,
   division en lineas y autoajuste del tamano de letra.
   La medicion se inyecta, de modo que el navegador usa measureText y las
   pruebas usan una medida sintetica. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.CDTexto = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Sustituye {{campo}} por el valor de la carta. Los simbolos de mana usan
     una sola llave, {W}, por lo que no colisionan. */
  function interpolar(texto, campos) {
    if (texto == null) return '';
    return String(texto).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function (_, clave) {
      var v = campos ? campos[clave] : '';
      return v == null ? '' : String(v);
    });
  }

  /* texto -> parrafos; cada parrafo es {tokens:[...]} o {separador:true}.
     token: {t:'p'|'s', v:'palabra'|'W', cursiva:bool, pegado:bool} */
  function tokenizar(texto) {
    var parrafos = [];
    var lineas = String(texto == null ? '' : texto).replace(/\r/g, '').split('\n');
    for (var i = 0; i < lineas.length; i++) {
      var linea = lineas[i];
      if (/^\s*-{3,}\s*$/.test(linea)) {
        parrafos.push({ separador: true, tokens: [] });
        continue;
      }
      var tokens = [];
      var cursiva = false;
      var palabra = '';
      var huboEspacio = true; // el primer token nunca lleva espacio delante
      function cerrarPalabra() {
        if (palabra) {
          tokens.push({ t: 'p', v: palabra, cursiva: cursiva, pegado: !huboEspacio });
          palabra = '';
          huboEspacio = false;
        }
      }
      for (var j = 0; j < linea.length; j++) {
        var c = linea[j];
        if (c === '*') {
          cerrarPalabra();
          cursiva = !cursiva;
        } else if (c === '{') {
          var cierre = linea.indexOf('}', j);
          if (cierre === -1) {
            palabra += c;
          } else {
            cerrarPalabra();
            tokens.push({
              t: 's',
              v: linea.slice(j + 1, cierre).trim(),
              cursiva: cursiva,
              pegado: !huboEspacio
            });
            huboEspacio = false;
            j = cierre;
          }
        } else if (c === ' ' || c === '\t') {
          cerrarPalabra();
          huboEspacio = true;
        } else {
          palabra += c;
        }
      }
      cerrarPalabra();
      parrafos.push({ tokens: tokens, separador: false });
    }
    return parrafos;
  }

  /* Reparte los tokens en lineas que caben en anchoMax.
     medir(token) devuelve el ancho del token; anchoEspacio el de un espacio. */
  function envolver(parrafos, anchoMax, medir, anchoEspacio) {
    var lineas = [];
    var espacio = anchoEspacio == null ? 0 : anchoEspacio;
    for (var p = 0; p < parrafos.length; p++) {
      var parrafo = parrafos[p];
      if (parrafo.separador) {
        lineas.push({ tokens: [], ancho: 0, separador: true, nuevoParrafo: true });
        continue;
      }
      if (!parrafo.tokens.length) {
        lineas.push({ tokens: [], ancho: 0, vacia: true, nuevoParrafo: true });
        continue;
      }
      var actual = [];
      var ancho = 0;
      var primera = true;
      for (var i = 0; i < parrafo.tokens.length; i++) {
        var token = parrafo.tokens[i];
        var w = medir(token);
        var sep = actual.length && !token.pegado ? espacio : 0;
        if (actual.length && ancho + sep + w > anchoMax) {
          lineas.push({ tokens: actual, ancho: ancho, nuevoParrafo: primera });
          primera = false;
          actual = [token];
          ancho = w;
        } else {
          if (sep) actual.push({ t: 'e', v: ' ' });
          actual.push(token);
          ancho += sep + w;
        }
      }
      lineas.push({ tokens: actual, ancho: ancho, nuevoParrafo: primera });
    }
    return lineas;
  }

  /* Alto total del bloque ya dividido. */
  function altoBloque(lineas, tamano, interlineado, espacioParrafo) {
    var alto = 0;
    var paso = tamano * (interlineado || 1.2);
    for (var i = 0; i < lineas.length; i++) {
      var l = lineas[i];
      if (l.vacia || l.separador) alto += paso * 0.55;
      else alto += paso;
      if (i > 0 && l.nuevoParrafo && !l.vacia && !l.separador) {
        alto += espacioParrafo == null ? tamano * 0.25 : espacioParrafo;
      }
    }
    return alto;
  }

  /* Busca el mayor tamano entre min y max para el que cabe(tamano) es cierto.
     Busqueda binaria sobre enteros: una sola pasada de ~6 mediciones. */
  function autoAjustar(min, max, cabe) {
    var lo = Math.max(1, Math.floor(min));
    var hi = Math.max(lo, Math.floor(max));
    if (cabe(hi)) return hi;
    var mejor = lo;
    while (lo <= hi) {
      var medio = Math.floor((lo + hi) / 2);
      if (cabe(medio)) {
        mejor = medio;
        lo = medio + 1;
      } else {
        hi = medio - 1;
      }
    }
    return mejor;
  }

  /* Convierte '3WU' o '{3}{W}{U}' en una lista de simbolos. */
  function listaCoste(texto) {
    var cadena = String(texto == null ? '' : texto).trim();
    if (!cadena) return [];
    var simbolos = [];
    var re = /\{([^}]*)\}/g;
    var hay = false;
    var m;
    while ((m = re.exec(cadena))) {
      hay = true;
      var v = m[1].trim();
      if (v) simbolos.push(v);
    }
    if (hay) return simbolos;
    // Formato corto: numeros juntos y letras sueltas (3WU -> 3, W, U)
    var numero = '';
    for (var i = 0; i < cadena.length; i++) {
      var c = cadena[i];
      if (/[0-9]/.test(c)) {
        numero += c;
      } else {
        if (numero) { simbolos.push(numero); numero = ''; }
        if (/\s/.test(c)) continue;
        simbolos.push(c.toUpperCase());
      }
    }
    if (numero) simbolos.push(numero);
    return simbolos;
  }

  function aplicarCaja(texto, caja) {
    var t = String(texto == null ? '' : texto);
    if (caja === 'mayusculas') return t.toLocaleUpperCase('es');
    if (caja === 'minusculas') return t.toLocaleLowerCase('es');
    return t;
  }

  return {
    interpolar: interpolar,
    tokenizar: tokenizar,
    envolver: envolver,
    altoBloque: altoBloque,
    autoAjustar: autoAjustar,
    listaCoste: listaCoste,
    aplicarCaja: aplicarCaja
  };
});
