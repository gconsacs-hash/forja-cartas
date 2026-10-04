/* Fabrica de controles del panel lateral: cada control lee y escribe
   directamente sobre el modelo mediante un par obtener/fijar. */
(function (raiz) {
  'use strict';
  var U = raiz.CDUtil;

  function el(etiqueta, clase, padre) {
    var nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (padre) padre.appendChild(nodo);
    return nodo;
  }

  function grupo(padre, titulo, abierto) {
    var det = el('details', 'grupo', padre);
    det.open = !!abierto;
    var res = el('summary', null, det);
    res.textContent = titulo;
    return el('div', 'grupo-cuerpo', det);
  }

  function fila(padre, clase) {
    return el('div', 'fila' + (clase ? ' ' + clase : ''), padre);
  }

  function etiquetar(padre, texto, ayuda) {
    var env = el('label', 'campo', padre);
    var sp = el('span', 'campo-nombre', env);
    sp.textContent = texto;
    if (ayuda) {
      var a = el('span', 'campo-ayuda', env);
      a.textContent = ayuda;
    }
    return env;
  }

  function texto(padre, etiqueta, obtener, fijar, opciones) {
    var op = opciones || {};
    var env = etiquetar(padre, etiqueta, op.ayuda);
    var inp = el('input', null, env);
    inp.type = 'text';
    inp.value = obtener() == null ? '' : obtener();
    if (op.placeholder) inp.placeholder = op.placeholder;
    inp.addEventListener('input', function () { fijar(inp.value); });
    return inp;
  }

  function area(padre, etiqueta, obtener, fijar, opciones) {
    var op = opciones || {};
    var env = etiquetar(padre, etiqueta, op.ayuda);
    var inp = el('textarea', null, env);
    inp.rows = op.filas || 7;
    inp.value = obtener() == null ? '' : obtener();
    inp.addEventListener('input', function () { fijar(inp.value); });
    return inp;
  }

  function numero(padre, etiqueta, obtener, fijar, opciones) {
    var op = opciones || {};
    var env = etiquetar(padre, etiqueta, op.ayuda);
    var inp = el('input', null, env);
    inp.type = 'number';
    if (op.min != null) inp.min = op.min;
    if (op.max != null) inp.max = op.max;
    inp.step = op.paso == null ? 1 : op.paso;
    inp.value = obtener();
    inp.addEventListener('input', function () {
      var v = parseFloat(inp.value);
      if (isNaN(v)) return;
      fijar(v);
    });
    return inp;
  }

  function rango(padre, etiqueta, obtener, fijar, opciones) {
    var op = opciones || {};
    var env = etiquetar(padre, etiqueta, op.ayuda);
    var caja = el('div', 'rango', env);
    var inp = el('input', null, caja);
    inp.type = 'range';
    inp.min = op.min == null ? 0 : op.min;
    inp.max = op.max == null ? 100 : op.max;
    inp.step = op.paso == null ? 1 : op.paso;
    inp.value = obtener();
    var val = el('span', 'rango-valor', caja);
    val.textContent = Number(obtener()).toFixed(op.decimales || 0);
    inp.addEventListener('input', function () {
      var v = parseFloat(inp.value);
      val.textContent = v.toFixed(op.decimales || 0);
      fijar(v);
    });
    return inp;
  }

  /* Admite hex, rgba() y los valores automaticos ('auto-a', 'auto-oscuro'...)
     que se resuelven con la identidad de color de la carta. */
  function color(padre, etiqueta, obtener, fijar, opciones) {
    var op = opciones || {};
    var env = etiquetar(padre, etiqueta, op.ayuda);
    var caja = el('div', 'color-caja', env);
    var muestra = el('input', null, caja);
    muestra.type = 'color';
    var txt = el('input', 'color-texto', caja);
    txt.type = 'text';
    function pintar() {
      var v = obtener() || '';
      txt.value = v;
      muestra.value = /^#[0-9a-fA-F]{6}$/.test(v) ? v : U.normalizarHex(op.respaldo || '#888888');
    }
    pintar();
    muestra.addEventListener('input', function () {
      txt.value = muestra.value;
      fijar(muestra.value);
    });
    txt.addEventListener('input', function () { fijar(txt.value); });
    if (op.autos !== false) {
      var sel = el('select', 'color-auto', caja);
      [['', 'fijo'], ['auto-a', 'auto claro'], ['auto-b', 'auto base'],
       ['auto-claro', 'auto suave'], ['auto-oscuro', 'auto oscuro'],
       ['auto-texto', 'auto tinta'], ['transparent', 'sin color']
      ].forEach(function (par) {
        var o = el('option', null, sel);
        o.value = par[0];
        o.textContent = par[1];
      });
      var actual = obtener() || '';
      sel.value = actual.indexOf('auto') === 0 || actual === 'transparent' ? actual : '';
      sel.addEventListener('change', function () {
        if (!sel.value) return;
        fijar(sel.value);
        pintar();
      });
    }
    return { pintar: pintar };
  }

  function seleccion(padre, etiqueta, opciones, obtener, fijar, extra) {
    var env = etiquetar(padre, etiqueta, extra && extra.ayuda);
    var sel = el('select', null, env);
    opciones.forEach(function (par) {
      var o = el('option', null, sel);
      o.value = par[0];
      o.textContent = par[1];
    });
    sel.value = obtener();
    sel.addEventListener('change', function () { fijar(sel.value); });
    return sel;
  }

  function casilla(padre, etiqueta, obtener, fijar) {
    var env = el('label', 'casilla', padre);
    var inp = el('input', null, env);
    inp.type = 'checkbox';
    inp.checked = !!obtener();
    var sp = el('span', null, env);
    sp.textContent = etiqueta;
    inp.addEventListener('change', function () { fijar(inp.checked); });
    return inp;
  }

  function archivo(padre, etiqueta, alElegir, opciones) {
    var op = opciones || {};
    var env = etiquetar(padre, etiqueta, op.ayuda);
    var inp = el('input', null, env);
    inp.type = 'file';
    inp.accept = op.accept || 'image/*';
    if (op.multiple) inp.multiple = true;
    inp.addEventListener('change', function () {
      if (inp.files && inp.files.length) alElegir(op.multiple ? inp.files : inp.files[0]);
      inp.value = '';
    });
    return inp;
  }

  function boton(padre, texto, alPulsar, clase) {
    var b = el('button', 'boton' + (clase ? ' ' + clase : ''), padre);
    b.type = 'button';
    b.textContent = texto;
    b.addEventListener('click', alPulsar);
    return b;
  }

  function contador(padre, etiqueta, obtener, fijar) {
    var env = etiquetar(padre, etiqueta);
    var caja = el('div', 'contador', env);
    function paso(delta) {
      var v = parseFloat(obtener());
      if (isNaN(v)) v = 0;
      fijar(String(v + delta));
      inp.value = obtener();
    }
    boton(caja, '−', function () { paso(-1); }, 'mini');
    var inp = el('input', null, caja);
    inp.type = 'text';
    inp.value = obtener() == null ? '' : obtener();
    inp.addEventListener('input', function () { fijar(inp.value); });
    boton(caja, '+', function () { paso(1); }, 'mini');
    return inp;
  }

  function aviso(padre, texto) {
    var p = el('p', 'aviso', padre);
    p.textContent = texto;
    return p;
  }

  raiz.CDControles = {
    el: el,
    grupo: grupo,
    fila: fila,
    texto: texto,
    area: area,
    numero: numero,
    rango: rango,
    color: color,
    seleccion: seleccion,
    casilla: casilla,
    archivo: archivo,
    boton: boton,
    contador: contador,
    aviso: aviso
  };
})(typeof self !== 'undefined' ? self : this);
