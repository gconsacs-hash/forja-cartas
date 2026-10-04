# Forja de Cartas

Editor de cartas al estilo **Magic: the Gathering** y **Mitos y Leyendas**, hecho para
funcionar sin internet y sin cuentas: todo ocurre en el navegador y nada se sube a
ningún servidor.

👉 **Usar la app: https://gconsacs-hash.github.io/forja-cartas/**

En el celular, Chrome ofrece *Instalar aplicación*: queda con ícono propio, a pantalla
completa y funciona después sin conexión.

## Qué hace

- **Cinco plantillas**: Magic moderno, Magic clásico, Arte a sangre, Mitos y Leyendas y
  Libre. Cambiar de plantilla conserva los textos y las imágenes.
- **Tu propio fondo o diseño**: ilustración en el hueco de arte o imagen a sangre detrás
  de todo, con encuadre, zoom, brillo, contraste, saturación, sepia, desenfoque y viñeta.
  También acepta fuentes `.ttf`/`.otf` propias.
- **Caja de habilidades** con símbolos de maná dibujados a mano (incluye híbridos,
  alternativos y phyrexianos), cursivas con `*así*`, separador de texto de ambiente con
  `---` y tamaño de letra que se ajusta solo.
- **Contadores de ataque y defensa**, con el disco de defensa opcional en Mitos y Leyendas.
- **Cambiarle todo a la carta**: cada banda, disco, panel y texto es una capa que se mueve,
  gira, redimensiona y repinta. Se pueden añadir textos, imágenes, paneles y símbolos.
- **Exportar** a PNG de 300 o 600 ppp al tamaño real (63,5 × 88,9 mm), hoja A4 con 9 cartas
  y marcas de corte, o JSON para respaldo.

Las cartas se guardan en el propio navegador; las imágenes nunca salen del dispositivo.

## Correr en el computador

```
node servidor.js     # http://localhost:3420 (y la IP local, para el celular)
node --test pruebas/pruebas.js
```

En Windows basta doble clic en `Iniciar.cmd`. El manual completo está en
[LEEME.md](LEEME.md).

Sin dependencias: JavaScript, HTML y canvas puros.
