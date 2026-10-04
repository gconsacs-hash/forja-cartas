# Forja de Cartas

Editor local de cartas al estilo **Magic: the Gathering** y **Mitos y Leyendas**.
Pones el fondo o el diseño que quieras, conservas la caja de habilidades con sus
símbolos, manejas los contadores de ataque y defensa, y puedes cambiarle
absolutamente todo a la carta: cada pieza del marco es un elemento movible.

Funciona sin internet y sin cuentas: todo ocurre en tu navegador.

## Abrir

1. Doble clic en **Iniciar.cmd** (abre `http://localhost:3420`).
2. También sirve abrir `index.html` directamente con doble clic.
3. En internet: <https://gconsacs-hash.github.io/forja-cartas/>

## Instalarla en el celular

1. Abre <https://gconsacs-hash.github.io/forja-cartas/> en Chrome.
2. Arriba del todo, en el panel, aparece **Instalar en este dispositivo** con un
   botón ⬇ *Instalar Forja de Cartas*. Ese botón es la forma más directa.
3. Si el botón no aparece, esa misma sección explica la ruta del menú según el
   equipo (Android, iPhone o computador). En Chrome de Android es
   menú ⋮ → *Agregar a la pantalla principal* / *Instalar aplicación*; en iPhone
   hay que usar **Safari** → Compartir → *Agregar a inicio*, porque Chrome en
   iPhone no instala aplicaciones.
4. Queda con ícono propio y a pantalla completa. Tras la primera carga aparece
   el aviso "ya funciona sin conexión": desde ahí se abre aunque no haya señal.

Chrome a veces tarda unos segundos en ofrecer la instalación (espera a guardar
la app para uso sin conexión): si no aparece de inmediato, recarga la página.

Las cartas se guardan en el navegador de **cada** dispositivo: lo que hagas en
el celular no aparece en el PC. Para pasarlas de uno a otro, usa *Respaldo
completo* (JSON) e *Importar JSON*.

También se puede usar sin internet por la WiFi de la casa: con `Iniciar.cmd`
corriendo, el PC muestra en la ventana negra la dirección tipo
`http://192.168.x.x:3420` que se abre desde el celular (así no se instala como
app, y necesita el PC encendido).

### Publicar los cambios

Al tocar el código, sube el número de `VERSION` en `sw.js` (para que los
celulares con la app instalada reciban la actualización) y corre:

```
powershell -ExecutionPolicy Bypass -File publicar.ps1
```

Usa `gh` (GitHub CLI), que ya está autenticado; no hace falta instalar git.

## Los 10 marcos

Se eligen en la pestaña **Marco**, en una galería donde cada miniatura es tu
propia carta dibujada con ese marco.

| Marco | Para qué sirve |
|---|---|
| Criatura | Bandas, caja de reglas y caja de fuerza/resistencia |
| Clásica | Esquinas rectas y caja de texto más amplia |
| Legendaria | Corona de puntas sobre el nombre |
| Arte extendido | Ilustración hasta los bordes, con los textos sobre ella |
| Ficha | Sin coste de maná y con más ilustración |
| Caminante | Tres habilidades con su contador y la lealtad inicial |
| Saga | Capítulos I, II y III con la ilustración vertical |
| Arte a sangre | Imagen de borde a borde con velos oscuros bajo los textos |
| Aliado (Mitos y Leyendas) | Cinta del nombre, disco de coste, banda de raza y escudo de fuerza |
| Marco propio | Carga tu PNG de marco: el arte va debajo y los textos encima |
| Lienzo libre | Solo fondo, nombre, habilidades y contadores |

Con dos o tres colores puedes elegir, en la pestaña Marco, entre **un solo marco
dorado** o **cada color en su lado** (el marco se funde de uno a otro).

Los marcos dibujados usan textura de metal, pergamino o cuero y un **relieve**
regulable: positivo levanta la pieza, negativo la hunde (así la ventana del arte
se ve rebajada). Todo eso se ajusta pieza por pieza en el Inspector.

### Usar marcos de archivo

Si tienes imágenes de marcos (PNG con el centro transparente), elige el marco
**Marco propio**: la app pone tu ilustración debajo, la imagen del marco encima
y los textos sobre todo, que es la misma forma de componer de Card Conjurer. La
imagen se carga en la pestaña **Arte**, en la capa "Imagen del marco". Después
puedes mover cada texto a donde caiga bien en tu marco.

Cambiar de marco conserva los textos escritos, las imágenes cargadas y los
elementos que hayas añadido tú.

Los marcos, los símbolos de maná y los símbolos de edición son dibujos propios
de esta app, hechos con código: no son imágenes sacadas de las cartas reales.

## Cómo se usa

El panel izquierdo está dividido en pestañas: **Marco**, **Texto**, **Arte**,
**Edición**, **Contadores** y **Guardar**. A la derecha quedan siempre las
**Capas** y el **Inspector** del elemento seleccionado.

**Edición** reúne el símbolo de edición (12 figuras propias teñidas según la
rareza: común, infrecuente, rara, mítica, especial o tierra básica), la marca de
agua que va detrás del texto de reglas y los datos del coleccionista (número,
edición, rareza, idioma e ilustrador).

**Textos de la carta** (pestaña Texto): nombre, coste, tipo/raza,
habilidades, ilustrador, edición, rareza y número. La caja de habilidades
entiende:

- `{W}` `{U}` `{B}` `{R}` `{G}` `{C}` `{T}` `{X}` `{2}` → símbolos dibujados;
  también híbridos `{W/U}`, alternativos `{2/R}` y phyrexianos `{G/P}`.
- `*texto*` → cursiva (para el texto recordatorio).
- `---` en un renglón solo → línea separadora del texto de ambiente.
- Un renglón por habilidad; el tamaño de letra se encoge solo para que entre.

**Fondo e ilustración**: carga un JPG/PNG en el hueco de arte, o pulsa
*Fondo a sangre* para poner tu imagen detrás de todo el marco. De cada imagen
controlas ajuste, zoom, encuadre, brillo, contraste, saturación, sepia,
desenfoque y viñeta. También puedes cargar una **fuente .ttf/.otf** tuya.

**Ataque y defensa**: contadores con botones − y + . En Mitos y Leyendas el
disco de defensa viene oculto (esa carta solo lleva fuerza); se enciende con una
casilla. Las cajas aceptan cualquier texto: `3`, `*/4`, `7`, lealtad, etc.

**Cambiarle todo**: pulsa cualquier pieza en la carta (o en *Capas*) y el
inspector te deja mover, redimensionar, girar, cambiar opacidad, forma, relleno
sólido/degradado/pergamino, bordes, bisel, sombra, fuente, tamaño, color,
alineación, contorno, interlineado y el propio contenido. Puedes añadir textos,
imágenes, paneles y grupos de símbolos nuevos, duplicarlos y reordenar capas.

Los colores `auto-*` siguen la **identidad de color** de la carta: marcas Rojo y
el marco entero se repinta; marcas dos colores y sale marco dorado multicolor.

**Atajos**: flechas mueven (con Shift, 10 px) · Supr borra · Ctrl+D duplica ·
Ctrl+Z / Ctrl+Y deshacen y rehacen · Ctrl+S guarda en la galería.

## Guardar y exportar

- *Guardar carta* deja la carta en la galería del navegador (y el trabajo en
  curso se autoguarda solo).
- **PNG** a 300 ppp (750 × 1050 px, el tamaño real de 63,5 × 88,9 mm), a 600 ppp
  o en tamaño pantalla.
- **Hoja A4** con 9 cartas y marcas de corte: imprime al 100 %, sin "ajustar a
  la página", y quedan del tamaño exacto de una carta real.
- **JSON** de una carta o respaldo completo, para volver a cargarlo después.

## Recetas rápidas

- *Usar un marco en blanco que ya tengo*: plantilla **Libre** → *Fondo a sangre*
  → cargas tu marco → añades los textos encima y los colocas a mano.
- *Carta de criatura legendaria*: **Magic moderno**, identidad de color, arte en
  el hueco, habilidades con `---` para el texto de ambiente.
- *Aliado de MyL*: **Mitos y Leyendas**, coste en el disco dorado, raza en la
  banda, fuerza en el escudo; enciende el disco de defensa si tu diseño lo pide.

## Desarrollo

```
npm test        # 44 pruebas de la lógica pura (texto, plantillas, estado)
npm start       # servidor local en el puerto 3420
```

`pruebas/vista-plantillas.html` dibuja las cinco plantillas una al lado de otra;
sirve para revisar de un vistazo cualquier cambio en el motor de dibujo.

### Mapa del código

| Archivo | Qué hace |
|---|---|
| `js/util.js` | Color, paletas, encaje de imágenes, geometría, ruido con semilla |
| `js/texto.js` | Símbolos `{W}`, cursivas, corte de líneas y autoajuste |
| `js/plantillas.js` | Las cinco plantillas como listas de elementos editables |
| `js/estado.js` | Modelo de la carta, migración de archivos e historial |
| `js/mana.js` | Dibujo vectorial de los símbolos de maná |
| `js/render.js` | Motor de canvas (paneles, imágenes, textos, símbolos) |
| `js/interaccion.js` | Selección, arrastre, asas de tamaño y giro |
| `js/controles.js`, `js/ui.js` | Panel lateral e inspector |
| `js/galeria.js`, `js/archivos.js`, `js/exportar.js` | Guardado, archivos, PNG y A4 |
