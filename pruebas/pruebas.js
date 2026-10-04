/* Pruebas de la logica pura: node --test pruebas
   (el dibujo en canvas se comprueba a ojo en el navegador) */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');

const U = require('../js/util.js');
const T = require('../js/texto.js');
const P = require('../js/plantillas.js');
const E = require('../js/estado.js');
const Mn = require('../js/mana.js');

/* --------------------------------------------------------------- util */

test('limitar mantiene el valor dentro del rango', () => {
  assert.strictEqual(U.limitar(5, 0, 10), 5);
  assert.strictEqual(U.limitar(-3, 0, 10), 0);
  assert.strictEqual(U.limitar(99, 0, 10), 10);
  assert.strictEqual(U.limitar('hola', 2, 8), 2);
});

test('normalizarHex acepta formato corto y rechaza basura', () => {
  assert.strictEqual(U.normalizarHex('#abc'), '#aabbcc');
  assert.strictEqual(U.normalizarHex('ff8800'), '#ff8800');
  assert.strictEqual(U.normalizarHex('no-es-color'), '#000000');
});

test('mezclar aclara hacia blanco y oscurece hacia negro', () => {
  assert.strictEqual(U.mezclar('#808080', 1), '#ffffff');
  assert.strictEqual(U.mezclar('#808080', -1), '#000000');
  assert.strictEqual(U.mezclar('#808080', 0), '#808080');
});

test('textoLegible elige tinta oscura sobre fondo claro', () => {
  assert.strictEqual(U.textoLegible('#ffffff'), '#14110f');
  assert.strictEqual(U.textoLegible('#101010'), '#f7f3ea');
});

test('paleta: un color da su propia paleta y varios dan multicolor', () => {
  assert.strictEqual(U.paleta(['R']).nombre, 'Rojo');
  assert.strictEqual(U.paleta(['R', 'W']).nombre, 'Multicolor');
  assert.strictEqual(U.paleta([]).nombre, 'Incoloro');
  assert.strictEqual(U.paleta(['inventado']).nombre, 'Incoloro');
});

test('resolverColor traduce los colores automaticos y respeta los fijos', () => {
  const rojo = U.paleta(['R']);
  assert.strictEqual(U.resolverColor('auto-a', ['R']), rojo.a);
  assert.strictEqual(U.resolverColor('auto-b', ['R']), rojo.b);
  assert.strictEqual(U.resolverColor('#123456', ['R']), '#123456');
  assert.strictEqual(U.resolverColor('rgba(0,0,0,0.5)', ['R']), 'rgba(0,0,0,0.5)');
});

test('ajustarImagen en modo cubrir llena el hueco sin deformar', () => {
  const r = U.ajustarImagen({ anchoImagen: 100, altoImagen: 50, ancho: 200, alto: 200 });
  assert.strictEqual(r.dw, 400);
  assert.strictEqual(r.dh, 200);
  assert.strictEqual(r.dy, 0);
  assert.strictEqual(r.dx, -100); // centrado: sobra lo mismo a cada lado
});

test('ajustarImagen en modo contener deja la imagen completa', () => {
  const r = U.ajustarImagen({ anchoImagen: 100, altoImagen: 50, ancho: 200, alto: 200, modo: 'contener' });
  assert.strictEqual(r.dw, 200);
  assert.strictEqual(r.dh, 100);
  assert.strictEqual(r.dy, 50);
});

test('ajustarImagen aplica zoom y desplazamiento', () => {
  const r = U.ajustarImagen({
    anchoImagen: 100, altoImagen: 100, ancho: 100, alto: 100, zoom: 2, despX: 0.1
  });
  assert.strictEqual(r.dw, 200);
  assert.strictEqual(r.dx, -50 + 10);
});

test('dentro detecta el punto incluso con el elemento girado', () => {
  const el = { x: 100, y: 100, w: 200, h: 100, rot: 90 };
  // girado 90 grados, el rectangulo ocupa alto 200 y ancho 100 en pantalla
  assert.ok(U.dentro(200, 190, el, 0));
  assert.ok(!U.dentro(290, 150, el, 0));
});

test('nombreArchivo limpia acentos y espacios', () => {
  assert.strictEqual(U.nombreArchivo('Guardián de la Forja', 'png'), 'guardian-de-la-forja.png');
  assert.strictEqual(U.nombreArchivo('', 'json'), 'carta.json');
});

test('prng es determinista para una misma semilla', () => {
  const a = U.prng(42);
  const b = U.prng(42);
  assert.strictEqual(a(), b());
  assert.strictEqual(a(), b());
});

/* -------------------------------------------------------------- texto */

test('interpolar sustituye los campos de la carta', () => {
  assert.strictEqual(
    T.interpolar('{{ataque}}/{{defensa}}', { ataque: '3', defensa: '4' }),
    '3/4'
  );
  assert.strictEqual(T.interpolar('{{falta}}', {}), '');
  assert.strictEqual(T.interpolar('coste {R}{W}', {}), 'coste {R}{W}');
});

test('tokenizar separa palabras, simbolos y cursivas', () => {
  const p = T.tokenizar('Vuela {W} *asi*');
  assert.strictEqual(p.length, 1);
  const tk = p[0].tokens;
  assert.deepStrictEqual(tk.map(t => t.t), ['p', 's', 'p']);
  assert.strictEqual(tk[1].v, 'W');
  assert.strictEqual(tk[2].cursiva, true);
  assert.strictEqual(tk[0].cursiva, false);
});

test('tokenizar marca los simbolos pegados a la palabra anterior', () => {
  const tk = T.tokenizar('{T}: Agrega {R}.')[0].tokens;
  assert.strictEqual(tk[0].v, 'T');
  assert.strictEqual(tk[1].v, ':');
  assert.strictEqual(tk[1].pegado, true);
  assert.strictEqual(tk[2].pegado, false);
});

test('tokenizar reconoce el separador de texto de ambiente', () => {
  const p = T.tokenizar('Regla\n---\nAmbiente');
  assert.strictEqual(p.length, 3);
  assert.strictEqual(p[1].separador, true);
});

test('tokenizar deja intacta una llave sin cerrar', () => {
  const tk = T.tokenizar('roto {W')[0].tokens;
  assert.strictEqual(tk[1].v, '{W');
});

const medirFalso = (token) => (token.t === 's' ? 10 : token.v.length * 10);

test('envolver corta las lineas al llegar al ancho', () => {
  const p = T.tokenizar('uno dos tres cuatro');
  const lineas = T.envolver(p, 100, medirFalso, 5);
  assert.ok(lineas.length > 1);
  lineas.forEach(l => assert.ok(l.ancho <= 100 || l.tokens.length === 1));
});

test('envolver conserva los parrafos vacios y los separadores', () => {
  const lineas = T.envolver(T.tokenizar('a\n\n---\nb'), 500, medirFalso, 5);
  assert.strictEqual(lineas.length, 4);
  assert.strictEqual(lineas[1].vacia, true);
  assert.strictEqual(lineas[2].separador, true);
});

test('envolver no pierde ningun token', () => {
  const texto = 'Siempre que esta criatura ataque pon un contador {W} sobre ella';
  const original = T.tokenizar(texto)[0].tokens.length;
  const lineas = T.envolver(T.tokenizar(texto), 120, medirFalso, 5);
  const salida = lineas.reduce((n, l) => n + l.tokens.filter(t => t.t !== 'e').length, 0);
  assert.strictEqual(salida, original);
});

test('altoBloque crece con el numero de lineas', () => {
  const unaLinea = T.envolver(T.tokenizar('a'), 500, medirFalso, 5);
  const dos = T.envolver(T.tokenizar('a\nb'), 500, medirFalso, 5);
  assert.ok(T.altoBloque(dos, 20, 1.2) > T.altoBloque(unaLinea, 20, 1.2));
});

test('autoAjustar devuelve el mayor tamano que cabe', () => {
  assert.strictEqual(T.autoAjustar(10, 40, tam => tam <= 23), 23);
  assert.strictEqual(T.autoAjustar(10, 40, () => true), 40);
  assert.strictEqual(T.autoAjustar(10, 40, () => false), 10);
});

test('listaCoste acepta llaves y formato corto', () => {
  assert.deepStrictEqual(T.listaCoste('{2}{R}{W}'), ['2', 'R', 'W']);
  assert.deepStrictEqual(T.listaCoste('2RW'), ['2', 'R', 'W']);
  assert.deepStrictEqual(T.listaCoste('{10}{W/U}'), ['10', 'W/U']);
  assert.deepStrictEqual(T.listaCoste(''), []);
  assert.deepStrictEqual(T.listaCoste('12'), ['12']);
});

test('aplicarCaja cambia a mayusculas respetando el espanol', () => {
  assert.strictEqual(T.aplicarCaja('niño', 'mayusculas'), 'NIÑO');
  assert.strictEqual(T.aplicarCaja('Niño', 'normal'), 'Niño');
});

/* --------------------------------------------------------------- mana */

/* Contexto de canvas de mentira: no comprueba como se ve el simbolo (eso se
   revisa en pruebas/vista-simbolos.html), pero si que cada trazo exista y que
   ningun simbolo del catalogo reviente al dibujarse. */
function contextoFalso() {
  const registro = { relleno: 0, trazo: 0, llamadas: [] };
  const gradiente = { addColorStop() {} };
  const metodos = [
    'save', 'restore', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc',
    'ellipse', 'quadraticCurveTo', 'bezierCurveTo', 'clip', 'translate',
    'rotate', 'setTransform', 'clearRect', 'strokeRect', 'setLineDash',
    'fillText', 'strokeText', 'drawImage', 'rect'
  ];
  const ctx = {
    createLinearGradient: () => gradiente,
    createRadialGradient: () => gradiente,
    measureText: (t) => ({ width: String(t).length * 6 }),
    fill() { registro.relleno++; registro.llamadas.push('fill'); },
    stroke() { registro.trazo++; registro.llamadas.push('stroke'); },
    fillRect() { registro.relleno++; },
    registro
  };
  metodos.forEach(m => { ctx[m] = () => registro.llamadas.push(m); });
  return ctx;
}

test('todos los simbolos del catalogo se dibujan sin reventar', () => {
  Mn.CATALOGO.forEach(simbolo => {
    const ctx = contextoFalso();
    Mn.dibujar(ctx, simbolo, 20, 20, 18, { sombra: 0.3 });
    assert.ok(ctx.registro.relleno > 0, simbolo + ' no pinto nada');
  });
});

test('las cinco tierras basicas se dibujan con formas, no con letras', () => {
  ['W', 'U', 'B', 'R', 'G'].forEach(simbolo => {
    const ctx = contextoFalso();
    Mn.dibujar(ctx, simbolo, 20, 20, 18, {});
    assert.ok(!ctx.registro.llamadas.includes('fillText'),
      simbolo + ' sigue dibujandose como texto');
    const curvas = ctx.registro.llamadas.filter(
      l => l === 'bezierCurveTo' || l === 'quadraticCurveTo' || l === 'arc' || l === 'ellipse'
    ).length;
    assert.ok(curvas >= 3, simbolo + ' tiene un glifo demasiado pobre');
  });
});

test('fondoDe da el color propio de cada color y gris al resto', () => {
  assert.strictEqual(Mn.fondoDe('R'), Mn.FONDOS.R);
  assert.strictEqual(Mn.fondoDe('w'), Mn.FONDOS.W);
  assert.strictEqual(Mn.fondoDe('7'), Mn.FONDOS.GENERICO);
});

test('un simbolo vacio no dibuja nada', () => {
  const ctx = contextoFalso();
  Mn.dibujar(ctx, '', 20, 20, 18, {});
  assert.strictEqual(ctx.registro.relleno, 0);
});

/* --------------------------------------------------------- plantillas */

test('todas las plantillas se crean con elementos validos', () => {
  P.LISTA.forEach(info => {
    const p = P.crear(info.id);
    assert.strictEqual(p.id, info.id);
    assert.ok(p.elementos.length > 0, info.id + ' sin elementos');
    const vistos = {};
    p.elementos.forEach(el => {
      assert.ok(!vistos[el.id], 'id repetido en ' + info.id + ': ' + el.id);
      vistos[el.id] = true;
      assert.ok(['panel', 'imagen', 'texto', 'mana', 'simbolo', 'marca'].includes(el.tipo),
        info.id + ' · tipo desconocido: ' + el.tipo);
      assert.ok(el.w > 0 && el.h > 0, el.id + ' sin tamano');
      assert.ok(el.x >= -2 && el.y >= -2, el.id + ' fuera de la carta');
      assert.ok(el.x + el.w <= P.ANCHO + 2, el.id + ' se sale a lo ancho');
      assert.ok(el.y + el.h <= P.ALTO + 2, el.id + ' se sale a lo alto');
    });
  });
});

test('las plantillas de criatura traen contadores de ataque y defensa', () => {
  ['magic-moderno', 'magic-clasico', 'arte-total', 'libre'].forEach(id => {
    const textos = P.crear(id).elementos.filter(el => el.tipo === 'texto');
    const hay = textos.some(el => /\{\{ataque\}\}/.test(el.contenido) && /\{\{defensa\}\}/.test(el.contenido));
    assert.ok(hay, id + ' no muestra ataque/defensa');
  });
  const myl = P.crear('myl').elementos;
  assert.ok(myl.some(el => el.contenido === '{{ataque}}'));
  assert.ok(myl.some(el => el.contenido === '{{defensa}}'));
});

test('cada plantilla deja un hueco de imagen y un hueco de habilidades', () => {
  // las plantillas por bloques (caminante, saga) usan sus propios campos
  const esHabilidad = /\{\{(reglas|pw[0-9]t|saga[0-9])\}\}/;
  P.LISTA.forEach(info => {
    const els = P.crear(info.id).elementos;
    assert.ok(els.some(el => el.tipo === 'imagen'), info.id + ' sin imagen');
    assert.ok(els.some(el => esHabilidad.test(el.contenido || '')), info.id + ' sin habilidades');
  });
});

test('cada campo que usan las plantillas existe en el modelo', () => {
  const conocidos = E.CAMPOS.map(c => c.clave);
  P.LISTA.forEach(info => {
    P.crear(info.id).elementos.forEach(el => {
      const texto = String(el.contenido || '');
      let m;
      const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
      while ((m = re.exec(texto))) {
        assert.ok(conocidos.includes(m[1]),
          info.id + ' · ' + el.id + ' usa el campo inexistente {{' + m[1] + '}}');
      }
    });
  });
});

test('las plantillas por bloques traen sus contadores', () => {
  const pw = P.crear('magic-planeswalker').elementos;
  [1, 2, 3].forEach(n => {
    assert.ok(pw.some(el => el.contenido === '{{pw' + n + '}}'), 'falta el contador ' + n);
    assert.ok(pw.some(el => el.contenido === '{{pw' + n + 't}}'), 'falta la habilidad ' + n);
  });
  assert.ok(pw.some(el => el.contenido === '{{lealtad}}'), 'falta la lealtad inicial');
  const saga = P.crear('magic-saga').elementos;
  ['I', 'II', 'III'].forEach(n => {
    assert.ok(saga.some(el => el.contenido === n), 'falta el capitulo ' + n);
  });
});

test('camposDe solo ofrece los campos de la plantilla activa', () => {
  const normal = E.camposDe('magic-moderno').map(c => c.clave);
  const caminante = E.camposDe('magic-planeswalker').map(c => c.clave);
  assert.ok(!normal.includes('lealtad'), 'la criatura no deberia pedir lealtad');
  assert.ok(caminante.includes('lealtad'));
  assert.ok(caminante.includes('pw2t'));
  assert.ok(!caminante.includes('saga1'));
  assert.ok(normal.includes('nombre') && normal.includes('reglas'));
});

test('el simbolo de edicion y la marca de agua nacen con datos validos', () => {
  const F = require('../js/formas.js');
  const els = P.crear('magic-moderno').elementos;
  const simbolo = els.filter(el => el.tipo === 'simbolo')[0];
  const marca = els.filter(el => el.tipo === 'marca')[0];
  assert.ok(simbolo, 'falta el simbolo de edicion');
  assert.ok(F.RAREZAS[simbolo.rareza], 'rareza desconocida: ' + simbolo.rareza);
  assert.ok(F.CATALOGO.some(f => f.id === simbolo.forma), 'forma desconocida');
  assert.ok(marca, 'falta la marca de agua');
  assert.strictEqual(marca.visible, false, 'la marca de agua deberia nacer apagada');
  assert.ok(F.CATALOGO.some(f => f.id === marca.simbolo));
});

test('la marca de agua queda detras del texto de reglas', () => {
  const els = P.crear('magic-moderno').elementos;
  const marca = els.findIndex(el => el.tipo === 'marca');
  const reglas = els.findIndex(el => /\{\{reglas\}\}/.test(el.contenido || ''));
  assert.ok(marca < reglas, 'la marca taparia el texto');
});

test('ninguna propiedad de elemento se cuela dentro del estilo', () => {
  // un argumento mal puesto dejaba "visible" dentro del estilo y el texto
  // seguia dibujandose aunque la capa estuviera oculta
  const prohibidas = ['visible', 'bloqueado', 'x', 'y', 'w', 'h', 'rot', 'opacidad'];
  P.LISTA.forEach(info => {
    P.crear(info.id).elementos.forEach(el => {
      if (!el.estilo || typeof el.estilo !== 'object') return;
      prohibidas.forEach(k => {
        assert.ok(!(k in el.estilo), info.id + ' · ' + el.id + ' tiene "' + k + '" en el estilo');
      });
    });
  });
});

test('en Mitos y Leyendas el disco de defensa y su numero nacen ocultos juntos', () => {
  const els = P.crear('myl').elementos;
  const disco = els.filter(el => el.id === 'disco-defensa')[0];
  const numero = els.filter(el => el.id === 'defensa')[0];
  assert.strictEqual(disco.visible, false);
  assert.strictEqual(numero.visible, false);
});

test('fusionar combina en profundidad sin compartir arreglos', () => {
  const a = { borde: { ancho: 1, color: 'x' }, colores: ['a', 'b'] };
  const b = { borde: { ancho: 9 }, colores: ['c', 'd'] };
  const r = P.fusionar(JSON.parse(JSON.stringify(a)), b);
  assert.strictEqual(r.borde.ancho, 9);
  assert.strictEqual(r.borde.color, 'x');
  assert.deepStrictEqual(r.colores, ['c', 'd']);
  assert.notStrictEqual(r.colores, b.colores);
});

/* -------------------------------------------------------------- estado */

test('nueva crea una carta completa', () => {
  const c = E.nueva('magic-moderno');
  assert.strictEqual(c.plantilla, 'magic-moderno');
  assert.ok(c.elementos.length > 5);
  E.CAMPOS.forEach(campo => assert.ok(campo.clave in c.campos));
});

test('cambiarPlantilla conserva textos, imagenes y elementos anadidos', () => {
  const c = E.nueva('magic-moderno');
  c.campos.nombre = 'Prueba';
  E.buscar(c, 'arte').src = 'data:image/png;base64,AAA';
  const extra = E.anadir(c, 'texto');
  extra.contenido = 'sello propio';
  E.cambiarPlantilla(c, 'myl', true);
  assert.strictEqual(c.plantilla, 'myl');
  assert.strictEqual(c.campos.nombre, 'Prueba');
  assert.strictEqual(E.buscar(c, 'arte').src, 'data:image/png;base64,AAA');
  assert.ok(E.buscar(c, extra.id), 'se perdio el elemento anadido');
});

test('moverCapa sube y baja respetando los extremos', () => {
  const c = E.nueva('libre');
  const primero = c.elementos[0].id;
  assert.strictEqual(E.moverCapa(c, primero, -1), false);
  assert.strictEqual(E.moverCapa(c, primero, 1), true);
  assert.strictEqual(c.elementos[1].id, primero);
  assert.strictEqual(E.moverCapa(c, 'no-existe', 1), false);
});

test('duplicar crea una copia independiente y desplazada', () => {
  const c = E.nueva('libre');
  const copia = E.duplicar(c, 'nombre');
  assert.notStrictEqual(copia.id, 'nombre');
  assert.strictEqual(copia.x, E.buscar(c, 'nombre').x + 18);
  copia.estilo.tamano = 99;
  assert.notStrictEqual(E.buscar(c, 'nombre').estilo.tamano, 99);
});

test('eliminar quita el elemento indicado', () => {
  const c = E.nueva('libre');
  const total = c.elementos.length;
  assert.strictEqual(E.eliminar(c, 'nombre'), true);
  assert.strictEqual(c.elementos.length, total - 1);
  assert.strictEqual(E.eliminar(c, 'nombre'), false);
});

test('anadir crea elementos de cada tipo dentro de la carta', () => {
  const c = E.nueva('libre');
  ['texto', 'imagen', 'panel', 'mana'].forEach(tipo => {
    const el = E.anadir(c, tipo);
    assert.strictEqual(el.tipo, tipo);
    assert.strictEqual(el.anadido, true);
    assert.ok(el.x >= 0 && el.y >= 0);
  });
});

test('migrar completa lo que falta y acepta cartas parciales', () => {
  const c = E.migrar({
    plantilla: 'myl',
    campos: { nombre: 'Antigua' },
    elementos: [{ id: 'nombre', tipo: 'texto', x: 10 }]
  });
  assert.strictEqual(c.campos.nombre, 'Antigua');
  assert.ok(c.campos.reglas.length > 0);
  const nombre = E.buscar(c, 'nombre');
  assert.strictEqual(nombre.x, 10);
  assert.ok(nombre.estilo && nombre.estilo.tamano > 0, 'no se restauro el estilo');
});

test('migrar rechaza archivos que no son cartas', () => {
  assert.throws(() => E.migrar({ hola: 1 }), /elementos/);
  assert.throws(() => E.migrar('null'), /carta/);
});

test('migrar conserva los elementos propios de la carta guardada', () => {
  const c = E.nueva('libre');
  const extra = E.anadir(c, 'panel');
  const vuelta = E.migrar(JSON.parse(JSON.stringify(c)));
  assert.ok(E.buscar(vuelta, extra.id));
  assert.strictEqual(vuelta.elementos.length, c.elementos.length);
});

test('el historial deshace y rehace instantaneas', () => {
  const h = new E.Historial(5);
  const c = E.nueva('libre');
  h.registrar(c);
  assert.strictEqual(h.puedeDeshacer(), false);
  c.campos.nombre = 'Dos';
  h.registrar(c);
  assert.strictEqual(h.deshacer().campos.nombre, 'Guardian de la Forja');
  assert.strictEqual(h.rehacer().campos.nombre, 'Dos');
  assert.strictEqual(h.rehacer(), null);
});

test('sincronizar permite rehacer el ultimo cambio', () => {
  // las instantaneas se toman antes de cada cambio: sin sincronizar, el
  // estado mas reciente se perderia al deshacer
  const h = new E.Historial(10);
  const c = E.nueva('libre');
  h.registrar(c);          // estado A, antes de editar
  c.campos.nombre = 'B';   // el cambio aun no esta en la pila
  h.sincronizar(c);
  assert.strictEqual(h.deshacer().campos.nombre, 'Guardian de la Forja');
  assert.strictEqual(h.rehacer().campos.nombre, 'B');
});

test('registrar ignora instantaneas repetidas', () => {
  const h = new E.Historial(10);
  const c = E.nueva('libre');
  assert.strictEqual(h.registrar(c), true);
  assert.strictEqual(h.registrar(c), false);
  assert.strictEqual(h.pasos.length, 1);
});

test('el historial respeta el tope de pasos', () => {
  const h = new E.Historial(3);
  for (let i = 0; i < 10; i++) h.registrar({ n: i });
  assert.strictEqual(h.pasos.length, 3);
  assert.strictEqual(h.deshacer().n, 8);
});

test('registrar tras deshacer descarta la rama abandonada', () => {
  const h = new E.Historial(10);
  h.registrar({ n: 1 });
  h.registrar({ n: 2 });
  h.deshacer();
  h.registrar({ n: 3 });
  assert.strictEqual(h.puedeRehacer(), false);
  assert.strictEqual(h.deshacer().n, 1);
});
