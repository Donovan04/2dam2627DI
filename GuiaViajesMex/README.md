# México de cerca

Guía bilingüe para preparar un primer viaje por México. Práctica de Desarrollo de Interfaces de 2.º de DAM.

## Ejecutar en local

Con Node.js, abre una terminal en esta carpeta y ejecuta:

```powershell
node serve.mjs
```

Abre [la guía](http://127.0.0.1:8000/) o [la ruta de prueba con el nombre del repositorio](http://127.0.0.1:8000/GuiaViajesMex/). Usa `node serve.mjs 8123` si el puerto 8000 está ocupado. Detén el servidor con Ctrl+C. Las páginas, las imágenes y Leaflet se sirven desde esta carpeta. El mapa base y los enlaces externos requieren conexión.

## Publicar en GitHub Pages

1. Sube los cinco archivos HTML y las carpetas `assets/` y `js/` a la raíz del repositorio.
2. En **Settings → Pages**, elige **Deploy from a branch**, selecciona la rama principal y la carpeta **/(root)**. Guarda.
3. Abre la URL que muestre Pages. Si el repositorio se llama `GuiaViajesMex`, tendrá la forma `https://USUARIO.github.io/GuiaViajesMex/`. Las rutas internas son relativas y el sitio se sirve directamente. [Documentación de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Dónde editar

| Archivo | Contenido |
| --- | --- |
| `index.html`, `lugares.html`, `gastronomia.html`, `cultura.html` y `planifica.html` | Entradas de las cinco páginas. |
| `js/app.js` | Navegación, portada, textos comunes y composición de las páginas. `t(es, en)` elige el idioma. |
| `js/content.js` | Historia, clima, platos, cultura, presupuesto y créditos de las fotos de sección. Las parejas de texto siguen el orden español e inglés. |
| `js/data.js` | Catálogo de 16 fichas, tipos, regiones, coordenadas, fuentes y créditos de portada. Una ficha alimenta tanto la tarjeta como el marcador. |
| `js/places.js` | Filtros, tarjetas, mapa, textos de Lugares y tratamiento de fallos de red. Los filtros se reflejan en la URL. |
| `assets/style.css` | Estilo, temas y distribución responsive. |

Los enlaces a las fuentes están junto a cada dato o ficha. Las cuatro fotografías locales tienen autor, licencia y original en sus pies de foto. El SVG de la bandera es de Omar Alejandro Covarrubias Neri, basado en el escudo oficial y catalogado en el dominio público por [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Flag_of_Mexico.svg). Leaflet 1.9.4 incluye su licencia en `assets/Leaflet-LICENSE`. La atribución de OpenStreetMap aparece debajo del mapa.

## Pruebas y pendientes

- En Edge se recorrieron las cinco páginas en español e inglés y en ambos temas, con navegación y recarga. Se probó cada página a 1280, 768, 390 y 320 px sin desbordamiento horizontal y se verificó la preferencia de movimiento reducido.
- En Lugares se comprobó la sincronización de fichas y marcadores, la conservación de filtros al redimensionar y traducir, el estado sin coincidencias y la limpieza de filtros. Se probó el menú y el filtro con Tab, Enter y Escape, incluido el foco visible y su retorno. Con tacto emulado se probó Lista / Mapa y la apertura del marcador desde una ficha.
- Se sirvieron 24 rutas de página y recurso bajo el subdirectorio de prueba. Se verificaron 15 enlaces internos, incluido un enlace profundo a una ficha de restaurante. OpenStreetMap devolvió teselas y también se simularon fallos independientes de teselas y Leaflet.
- La comprobación externa por HTTP obtuvo 35 respuestas 2xx de 45 URL estáticas. UNESCO, INAH, INBAL e INEHRM devolvieron errores de acceso desde esta comprobación y se consultaron mediante el buscador. Conviene reabrir esos enlaces desde la red de entrega.
- Queda la revisión manual en un teléfono físico y con lector de pantalla. Las fichas indican qué coordenadas son orientativas. Comprueba horarios, tarifas de visita y precios de alojamiento y comidas para las fechas del viaje.

