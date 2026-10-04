/* Motor de dibujo. Todo se dibuja en unidades de carta (750 x 1050) y la
   escala la aplica el contexto, asi la vista previa y la exportacion a 300 o
   600 ppp salen identicas. */
(function (raiz) {
  'use strict';
  var U = raiz.CDUtil;
  var T = raiz.CDTexto;
  var M = raiz.CDMana;

  var cache = {};
  var alCargar = null;

  function cargarImagen(src) {
    if (!src) return null;
    var reg = cache[src];
    if (reg) return reg.ok ? reg.img : null;
    var img = new Image();
    reg = { img: img, ok: false };
    cache[src] = reg;
    img.onload = function () {
      reg.ok = true;
      if (alCargar) alCargar();
    };
    img.onerror = function () { reg.error = true; };
    img.src = src;
    return null;
  }

  function imagenLista(src) {
    var reg = cache[src];
    return !!(reg && reg.ok);
  }

  /* --- formas -------------------------------------------------------- */

  function ruta(ctx, forma, x, y, w, h, radio) {
    switch (forma) {
      case 'elipse':
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        break;
      case 'escudo':
        var r = Math.min(w, h) * 0.22;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h * 0.52);
        ctx.quadraticCurveTo(x + w, y + h * 0.86, x + w / 2, y + h);
        ctx.quadraticCurveTo(x, y + h * 0.86, x, y + h * 0.52);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        break;
      case 'cinta':
        var p = Math.min(w * 0.12, 46);
        ctx.beginPath();
        ctx.moveTo(x + p, y);
        ctx.lineTo(x + w - p, y);
        ctx.lineTo(x + w, y + h * 0.3);
        ctx.lineTo(x + w - p * 0.55, y + h * 0.5);
        ctx.lineTo(x + w, y + h * 0.7);
        ctx.lineTo(x + w - p, y + h);
        ctx.lineTo(x + p, y + h);
        ctx.lineTo(x, y + h * 0.7);
        ctx.lineTo(x + p * 0.55, y + h * 0.5);
        ctx.lineTo(x, y + h * 0.3);
        ctx.closePath();
        break;
      case 'corona':
        // banda con el canto inferior en puntas: la corona de las legendarias
        var rc = Math.min(h * 0.5, 24);
        var puntas = 6;
        var paso = w / puntas;
        ctx.beginPath();
        ctx.moveTo(x + rc, y);
        ctx.lineTo(x + w - rc, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + rc);
        ctx.lineTo(x + w, y + h * 0.58);
        for (var i = 0; i < puntas; i++) {
          var x0 = x + w - i * paso;
          ctx.lineTo(x0 - paso * 0.5, y + h);
          ctx.lineTo(x0 - paso, y + h * 0.58);
        }
        ctx.lineTo(x, y + rc);
        ctx.quadraticCurveTo(x, y, x + rc, y);
        ctx.closePath();
        break;
      case 'rombo':
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x + w / 2, y + h);
        ctx.lineTo(x, y + h / 2);
        ctx.closePath();
        break;
      default:
        U.rutaRedondeada(ctx, x, y, w, h, radio || 0);
    }
  }

  /* Modo de mezcla cuando la carta tiene varios colores: 'oro' (un solo marco
     dorado) o 'mitades' (cada color en su lado, fundidos al centro).
     Lo fija dibujarCarta antes de recorrer los elementos. */
  var mezclaActual = 'oro';

  function esAuto(color) {
    return typeof color === 'string' && color.indexOf('auto') === 0;
  }

  /* Con dos o tres colores y mezcla por mitades, el relleno automatico pasa a
     ser un degradado horizontal entre las paletas de cada color. */
  function degradadoIdentidad(ctx, relleno, ident, w, h) {
    if (mezclaActual !== 'mitades') return null;
    var colores = (ident || []).filter(function (c) { return U.PALETAS[c]; });
    if (colores.length < 2 || colores.length > 3) return null;
    var a = relleno.colores && relleno.colores[0];
    var b = relleno.colores && relleno.colores[1];
    if (!esAuto(a) && !esAuto(b)) return null;
    // las bandas arrancan en 'auto-claro'; el marco grande arranca en 'auto-a'
    var claro = a === 'auto-claro';
    var deg = ctx.createLinearGradient(0, 0, w, 0);
    colores.forEach(function (c, i) {
      var p = U.paleta(c);
      // el volumen lo ponen el bisel y el relieve, asi que aqui basta el tono
      var tono = claro ? p.a : U.mezclar(p.b, 0.12);
      var pos = colores.length === 1 ? 0.5 : i / (colores.length - 1);
      deg.addColorStop(U.limitar(pos, 0, 1), tono);
    });
    return deg;
  }

  function rellenoDe(ctx, relleno, ident, w, h) {
    var tipo = relleno && relleno.tipo || 'solido';
    if (tipo === 'solido') {
      return U.resolverColor(relleno && relleno.color || '#888888', ident);
    }
    var porIdentidad = degradadoIdentidad(ctx, relleno, ident, w, h);
    if (porIdentidad) return porIdentidad;
    var c1 = U.resolverColor((relleno.colores && relleno.colores[0]) || 'auto-a', ident);
    var c2 = U.resolverColor((relleno.colores && relleno.colores[1]) || 'auto-b', ident);
    var ang = ((relleno.angulo == null ? 90 : relleno.angulo) * Math.PI) / 180;
    var dx = Math.cos(ang) * w / 2;
    var dy = Math.sin(ang) * h / 2;
    var deg = ctx.createLinearGradient(w / 2 - dx, h / 2 - dy, w / 2 + dx, h / 2 + dy);
    deg.addColorStop(0, c1);
    if (tipo === 'metal') {
      // el metal no funde liso: tiene una banda clara a un tercio del alto
      deg.addColorStop(0.34, U.resolverColor(c1, ident) === c1 ? U.mezclar(c1, 0.3) : c1);
      deg.addColorStop(0.52, U.mezclar(c2, 0.1));
      deg.addColorStop(0.78, U.mezclar(c2, -0.12));
    }
    deg.addColorStop(1, c2);
    return deg;
  }

  function textura(ctx, relleno, w, h) {
    var azar = U.prng(relleno.semilla || 7);
    ctx.save();
    // manchas grandes y muy suaves: dan grano sin parecer lunares
    for (var i = 0; i < 160; i++) {
      var x = azar() * w;
      var y = azar() * h;
      var r = 10 + azar() * 26;
      var a = 0.012 + azar() * 0.022;
      var deg = ctx.createRadialGradient(x, y, 0, x, y, r);
      var tono = azar() > 0.5 ? '120,96,58' : '255,250,232';
      deg.addColorStop(0, 'rgba(' + tono + ',' + a.toFixed(4) + ')');
      deg.addColorStop(1, 'rgba(' + tono + ',0)');
      ctx.fillStyle = deg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // fibras finas del papel
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = 'rgba(110,88,52,1)';
    ctx.lineWidth = 1;
    for (var j = 0; j < 40; j++) {
      var fx = azar() * w;
      var fy = azar() * h;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + (azar() - 0.5) * 60, fy + (azar() - 0.5) * 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* Vetas finas y reflejo diagonal: hacen que el marco parezca metal
     estampado en vez de un degradado plano. */
  function vetasMetal(ctx, relleno, w, h) {
    var azar = U.prng(relleno.semilla || 5);
    ctx.save();
    ctx.globalAlpha = 0.12;
    for (var i = 0; i < 70; i++) {
      var y = azar() * h;
      var largo = w * (0.2 + azar() * 0.8);
      var x = azar() * (w - largo);
      ctx.strokeStyle = azar() > 0.5 ? '#ffffff' : '#000000';
      ctx.lineWidth = 0.6 + azar() * 1.1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + largo, y + (azar() - 0.5) * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    var brillo = ctx.createLinearGradient(0, 0, w, h);
    brillo.addColorStop(0, 'rgba(255,255,255,0)');
    brillo.addColorStop(0.42, 'rgba(255,255,255,0.16)');
    brillo.addColorStop(0.52, 'rgba(255,255,255,0.05)');
    brillo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = brillo;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /* Grano fino y oscuro, para cuero o piedra. */
  function granoCuero(ctx, relleno, w, h) {
    var azar = U.prng(relleno.semilla || 9);
    ctx.save();
    for (var i = 0; i < 260; i++) {
      var x = azar() * w;
      var y = azar() * h;
      var r = 1 + azar() * 3.4;
      ctx.fillStyle = azar() > 0.5
        ? 'rgba(255,245,225,' + (0.02 + azar() * 0.05).toFixed(3) + ')'
        : 'rgba(0,0,0,' + (0.03 + azar() * 0.07).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* Relieve real: luz por dentro del canto superior y sombra por el inferior.
     Se consigue trazando la figura un poco mas grande que el recorte, de modo
     que solo entre su sombra. */
  function relieve(ctx, forma, w, h, radio, fuerza) {
    if (!fuerza) return;
    // un valor negativo hunde la pieza en vez de levantarla (ventana de arte)
    var invertido = fuerza < 0;
    var f = U.limitar(Math.abs(fuerza), 0, 1);
    var d = Math.max(1.6, Math.min(w, h) * 0.018) * (0.7 + f);
    if (invertido) d = -d;
    ctx.save();
    ruta(ctx, forma, 0, 0, w, h, radio);
    ctx.clip();
    var g = Math.abs(d);
    ctx.lineWidth = g * 1.4;
    ctx.strokeStyle = 'rgba(0,0,0,1)';

    ctx.shadowColor = 'rgba(255,255,255,' + (0.6 * f).toFixed(3) + ')';
    ctx.shadowBlur = g * 2.2;
    ctx.shadowOffsetX = d;
    ctx.shadowOffsetY = d;
    ruta(ctx, forma, -g * 2, -g * 2, w + g * 4, h + g * 4, radio + g * 2);
    ctx.stroke();

    ctx.shadowColor = 'rgba(0,0,0,' + (0.55 * f).toFixed(3) + ')';
    ctx.shadowOffsetX = -d;
    ctx.shadowOffsetY = -d;
    ruta(ctx, forma, -g * 2, -g * 2, w + g * 4, h + g * 4, radio + g * 2);
    ctx.stroke();
    ctx.restore();
  }

  function bisel(ctx, forma, w, h, radio, fuerza) {
    if (!fuerza) return;
    var f = U.limitar(fuerza, 0, 1);
    ctx.save();
    ruta(ctx, forma, 0, 0, w, h, radio);
    ctx.clip();
    var deg = ctx.createLinearGradient(0, 0, 0, h);
    deg.addColorStop(0, 'rgba(255,255,255,' + (0.5 * f).toFixed(3) + ')');
    deg.addColorStop(0.16, 'rgba(255,255,255,0)');
    deg.addColorStop(0.82, 'rgba(0,0,0,0)');
    deg.addColorStop(1, 'rgba(0,0,0,' + (0.45 * f).toFixed(3) + ')');
    ctx.fillStyle = deg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function dibujarPanel(ctx, el, ident) {
    var w = el.w, h = el.h;
    if (el.sombra && el.sombra.desenfoque > 0) {
      ctx.save();
      ctx.shadowColor = el.sombra.color || 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = el.sombra.desenfoque;
      ctx.shadowOffsetX = el.sombra.x || 0;
      ctx.shadowOffsetY = el.sombra.y || 0;
      ctx.fillStyle = '#000';
      ruta(ctx, el.forma, 0, 0, w, h, el.radio);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ruta(ctx, el.forma, 0, 0, w, h, el.radio);
    ctx.fillStyle = rellenoDe(ctx, el.relleno, ident, w, h);
    ctx.fill();
    var tipo = el.relleno && el.relleno.tipo;
    if (tipo === 'pergamino' || tipo === 'metal' || tipo === 'cuero') {
      ctx.save();
      ruta(ctx, el.forma, 0, 0, w, h, el.radio);
      ctx.clip();
      if (tipo === 'pergamino') textura(ctx, el.relleno, w, h);
      else if (tipo === 'metal') vetasMetal(ctx, el.relleno, w, h);
      else granoCuero(ctx, el.relleno, w, h);
      ctx.restore();
    }
    ctx.restore();
    bisel(ctx, el.forma, w, h, el.radio, el.bisel);
    relieve(ctx, el.forma, w, h, el.radio, el.relieve);
    if (el.borde && el.borde.ancho > 0) {
      ctx.save();
      ctx.lineWidth = el.borde.ancho;
      ctx.strokeStyle = U.resolverColor(el.borde.color, ident);
      ruta(ctx, el.forma, el.borde.ancho / 2, el.borde.ancho / 2, w - el.borde.ancho, h - el.borde.ancho, Math.max(0, (el.radio || 0) - el.borde.ancho / 2));
      ctx.stroke();
      ctx.restore();
    }
    if (el.borde2 && el.borde2.ancho > 0) {
      var d = (el.borde && el.borde.ancho || 0) + 4;
      ctx.save();
      ctx.lineWidth = el.borde2.ancho;
      ctx.strokeStyle = U.resolverColor(el.borde2.color, ident);
      ruta(ctx, el.forma, d, d, w - d * 2, h - d * 2, Math.max(0, (el.radio || 0) - d));
      ctx.stroke();
      ctx.restore();
    }
  }

  function dibujarImagen(ctx, el, ident) {
    var w = el.w, h = el.h;
    ctx.save();
    ruta(ctx, el.forma, 0, 0, w, h, el.radio);
    ctx.clip();
    ctx.fillStyle = rellenoDe(ctx, el.relleno, ident, w, h);
    ctx.fillRect(0, 0, w, h);
    var img = cargarImagen(el.src);
    if (img) {
      var f = el.filtros || {};
      var filtro = [
        'brightness(' + (f.brillo == null ? 100 : f.brillo) + '%)',
        'contrast(' + (f.contraste == null ? 100 : f.contraste) + '%)',
        'saturate(' + (f.saturacion == null ? 100 : f.saturacion) + '%)',
        'sepia(' + (f.sepia || 0) + '%)',
        'blur(' + (f.desenfoque || 0) + 'px)'
      ].join(' ');
      ctx.filter = filtro;
      var r = U.ajustarImagen({
        anchoImagen: img.naturalWidth, altoImagen: img.naturalHeight,
        ancho: w, alto: h, modo: el.modo, zoom: el.zoom, despX: el.despX, despY: el.despY
      });
      ctx.drawImage(img, r.dx, r.dy, r.dw, r.dh);
      ctx.filter = 'none';
    } else if (!el.src) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '400 ' + Math.max(14, Math.min(w, h) * 0.08).toFixed(0) + 'px "Segoe UI",sans-serif';
      ctx.fillText('sin imagen', w / 2, h / 2);
      ctx.restore();
    }
    if (el.vineta > 0) {
      var rad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.72);
      rad.addColorStop(0, 'rgba(0,0,0,0)');
      rad.addColorStop(1, 'rgba(0,0,0,' + U.limitar(el.vineta, 0, 1) + ')');
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
    relieve(ctx, el.forma, w, h, el.radio, el.relieve);
    if (el.borde && el.borde.ancho > 0) {
      ctx.save();
      ctx.lineWidth = el.borde.ancho;
      ctx.strokeStyle = U.resolverColor(el.borde.color, ident);
      ruta(ctx, el.forma, el.borde.ancho / 2, el.borde.ancho / 2, w - el.borde.ancho, h - el.borde.ancho, el.radio);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* --- simbolo de edicion y marca de agua ----------------------------- */

  function dibujarSimbolo(ctx, el, ident) {
    var F = raiz.CDFormas;
    var rareza = F.RAREZAS[el.rareza] || F.RAREZAS.rara;
    var cx = el.w / 2;
    var cy = el.h / 2;
    var r = Math.min(el.w, el.h) / 2 - (el.borde ? el.borde.ancho : 0);
    if (r <= 0) return;
    ctx.save();
    if (el.sombra > 0) {
      ctx.shadowColor = 'rgba(0,0,0,' + U.limitar(el.sombra, 0, 1) + ')';
      ctx.shadowBlur = r * 0.5;
      ctx.shadowOffsetY = r * 0.12;
    }
    var deg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    deg.addColorStop(0, U.resolverColor(rareza.a, ident));
    deg.addColorStop(1, U.resolverColor(rareza.b, ident));
    F.ruta(ctx, el.forma, cx, cy, r);
    ctx.fillStyle = deg;
    ctx.fill();
    ctx.restore();
    if (el.borde && el.borde.ancho > 0) {
      ctx.save();
      F.ruta(ctx, el.forma, cx, cy, r);
      ctx.lineWidth = el.borde.ancho;
      ctx.strokeStyle = U.resolverColor(el.borde.color, ident);
      ctx.stroke();
      ctx.restore();
    }
    // brillo superior, para que parezca metal estampado
    ctx.save();
    F.ruta(ctx, el.forma, cx, cy, r);
    ctx.clip();
    var luz = ctx.createLinearGradient(0, cy - r, 0, cy + r * 0.2);
    luz.addColorStop(0, 'rgba(255,255,255,0.45)');
    luz.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = luz;
    ctx.fillRect(0, 0, el.w, el.h);
    ctx.restore();
  }

  function dibujarMarca(ctx, el, ident) {
    var cx = el.w / 2;
    var cy = el.h / 2;
    var r = Math.min(el.w, el.h) / 2;
    if (r <= 0) return;
    if (el.estilo === 'mana') {
      M.dibujar(ctx, el.simbolo, cx, cy, r, { sombra: 0 });
      return;
    }
    ctx.save();
    raiz.CDFormas.ruta(ctx, el.simbolo, cx, cy, r);
    ctx.fillStyle = U.resolverColor(el.color, ident);
    ctx.fill();
    if (el.contorno > 0) {
      ctx.lineWidth = el.contorno;
      ctx.strokeStyle = U.resolverColor(el.colorContorno || el.color, ident);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* --- texto --------------------------------------------------------- */

  function fuenteCss(estilo, tamano, cursiva) {
    return (cursiva ? 'italic ' : '') + (estilo.peso || '400') + ' ' +
      tamano.toFixed(2) + 'px ' + (estilo.fuente || 'serif');
  }

  function medidor(ctx, estilo, tamano) {
    var tamSimbolo = tamano * (estilo.tamanoSimbolo || 0.8);
    return function (token) {
      if (token.t === 's') return tamSimbolo * 1.06;
      ctx.font = fuenteCss(estilo, tamano, token.cursiva || estilo.cursiva);
      var w = ctx.measureText(token.v).width;
      if (estilo.espaciado) w += estilo.espaciado * token.v.length;
      return w;
    };
  }

  function prepararTexto(ctx, el, campos) {
    var estilo = el.estilo;
    var contenido = T.aplicarCaja(T.interpolar(el.contenido, campos), estilo.caja);
    var parrafos = T.tokenizar(contenido);
    var anchoMax = el.w;
    var tamano = estilo.tamano;

    function calcular(tam) {
      var medir = medidor(ctx, estilo, tam);
      ctx.font = fuenteCss(estilo, tam, estilo.cursiva);
      var espacio = ctx.measureText(' ').width;
      var lineas = T.envolver(parrafos, anchoMax, medir, espacio);
      var alto = T.altoBloque(lineas, tam, estilo.interlineado, tam * 0.3);
      return { lineas: lineas, alto: alto, tamano: tam, espacio: espacio };
    }

    if (estilo.autoAjuste) {
      var cabe = function (tam) { return calcular(tam).alto <= el.h; };
      tamano = T.autoAjustar(estilo.tamanoMin || 10, estilo.tamano, cabe);
    }
    return calcular(tamano);
  }

  function dibujarTexto(ctx, el, ident, campos) {
    var estilo = el.estilo;
    var plan = prepararTexto(ctx, el, campos);
    var tam = plan.tamano;
    var paso = tam * (estilo.interlineado || 1.2);
    var color = U.resolverColor(estilo.color, ident);
    var y;
    if (estilo.vertical === 'arriba') y = 0;
    else if (estilo.vertical === 'abajo') y = el.h - plan.alto;
    else y = (el.h - plan.alto) / 2;
    y = Math.max(estilo.vertical === 'arriba' ? 0 : -plan.alto, y);

    ctx.save();
    ctx.textBaseline = 'alphabetic';
    for (var i = 0; i < plan.lineas.length; i++) {
      var linea = plan.lineas[i];
      if (i > 0 && linea.nuevoParrafo && !linea.vacia && !linea.separador) y += tam * 0.3;
      if (linea.vacia) { y += paso * 0.55; continue; }
      if (linea.separador) {
        ctx.save();
        ctx.strokeStyle = U.colorConAlfa(color, 0.45);
        ctx.lineWidth = Math.max(1, tam * 0.05);
        ctx.beginPath();
        ctx.moveTo(el.w * 0.08, y + paso * 0.28);
        ctx.lineTo(el.w * 0.92, y + paso * 0.28);
        ctx.stroke();
        ctx.restore();
        y += paso * 0.55;
        continue;
      }
      var x = 0;
      if (estilo.alineacion === 'centro') x = (el.w - linea.ancho) / 2;
      else if (estilo.alineacion === 'derecha') x = el.w - linea.ancho;
      var linBase = y + tam * 0.82;
      for (var j = 0; j < linea.tokens.length; j++) {
        var tk = linea.tokens[j];
        if (tk.t === 'e') {
          x += plan.espacio;
          continue;
        }
        if (tk.t === 's') {
          var r = tam * (estilo.tamanoSimbolo || 0.8) / 2;
          M.dibujar(ctx, tk.v, x + r * 1.06, y + paso * 0.5, r, { sombra: 0.3 });
          x += r * 2.12;
          continue;
        }
        ctx.font = fuenteCss(estilo, tam, tk.cursiva || estilo.cursiva);
        ctx.fillStyle = color;
        if (estilo.sombra && estilo.sombra.desenfoque > 0) {
          ctx.shadowColor = estilo.sombra.color;
          ctx.shadowBlur = estilo.sombra.desenfoque;
          ctx.shadowOffsetX = estilo.sombra.x || 0;
          ctx.shadowOffsetY = estilo.sombra.y || 0;
        }
        if (estilo.espaciado) {
          var cx = x;
          for (var k = 0; k < tk.v.length; k++) {
            var ch = tk.v[k];
            if (estilo.contorno && estilo.contorno.ancho > 0) {
              ctx.lineWidth = estilo.contorno.ancho;
              ctx.strokeStyle = U.resolverColor(estilo.contorno.color, ident);
              ctx.strokeText(ch, cx, linBase);
            }
            ctx.fillText(ch, cx, linBase);
            cx += ctx.measureText(ch).width + estilo.espaciado;
          }
          x = cx;
        } else {
          if (estilo.contorno && estilo.contorno.ancho > 0) {
            ctx.lineWidth = estilo.contorno.ancho;
            ctx.strokeStyle = U.resolverColor(estilo.contorno.color, ident);
            ctx.lineJoin = 'round';
            ctx.strokeText(tk.v, x, linBase);
          }
          ctx.fillText(tk.v, x, linBase);
          x += ctx.measureText(tk.v).width;
        }
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      y += paso;
    }
    ctx.restore();
  }

  function dibujarMana(ctx, el, ident, campos) {
    var simbolos = T.listaCoste(T.interpolar(el.contenido, campos));
    if (!simbolos.length) return;
    var d = el.tamano;
    var sep = el.separacion == null ? 6 : el.separacion;
    var total = simbolos.length * d + (simbolos.length - 1) * sep;
    var x = 0;
    if (el.alineacion === 'centro') x = (el.w - total) / 2;
    else if (el.alineacion === 'derecha') x = el.w - total;
    var cy = el.h / 2;
    for (var i = 0; i < simbolos.length; i++) {
      M.dibujar(ctx, simbolos[i], x + d / 2, cy, d / 2, { sombra: el.sombra });
      x += d + sep;
    }
  }

  /* --- carta completa ------------------------------------------------ */

  function dibujarCarta(ctx, carta, escala) {
    var esc = escala || 1;
    var A = U.CARTA_ANCHO;
    var H = U.CARTA_ALTO;
    mezclaActual = carta.mezcla || 'oro';
    ctx.save();
    ctx.setTransform(esc, 0, 0, esc, 0, 0);
    ctx.clearRect(0, 0, A, H);
    var ident = carta.identidad;

    ctx.save();
    U.rutaRedondeada(ctx, 0, 0, A, H, carta.fondo.radio);
    ctx.clip();
    ctx.fillStyle = U.resolverColor(carta.fondo.color, ident);
    ctx.fillRect(0, 0, A, H);

    for (var i = 0; i < carta.elementos.length; i++) {
      var el = carta.elementos[i];
      if (!el.visible) continue;
      ctx.save();
      ctx.globalAlpha = U.limitar(el.opacidad == null ? 1 : el.opacidad, 0, 1);
      if (el.rot) {
        ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
        ctx.rotate((el.rot * Math.PI) / 180);
        ctx.translate(-el.w / 2, -el.h / 2);
      } else {
        ctx.translate(el.x, el.y);
      }
      try {
        if (el.tipo === 'panel') dibujarPanel(ctx, el, ident);
        else if (el.tipo === 'imagen') dibujarImagen(ctx, el, ident);
        else if (el.tipo === 'texto') dibujarTexto(ctx, el, ident, carta.campos);
        else if (el.tipo === 'mana') dibujarMana(ctx, el, ident, carta.campos);
        else if (el.tipo === 'simbolo') dibujarSimbolo(ctx, el, ident);
        else if (el.tipo === 'marca') dibujarMarca(ctx, el, ident);
      } catch (e) {
        if (raiz.console) console.warn('Error dibujando', el.id, e);
      }
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }

  raiz.CDRender = {
    dibujarCarta: dibujarCarta,
    cargarImagen: cargarImagen,
    imagenLista: imagenLista,
    alCargar: function (fn) { alCargar = fn; }
  };
})(typeof self !== 'undefined' ? self : this);
