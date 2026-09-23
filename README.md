# Vuelo de Abeja · Realidad aumentada

Experiencia web móvil con A-Frame 1.6.0 y MindAR 1.2.5. Reconoce cuatro marcadores y muestra el modelo 3D correspondiente. Las imágenes y los modelos están en `imagenes/`; los cuatro marcadores se compilan juntos en un único `targets.mind` en la raíz.

## Ejecutar en localhost

Desde la carpeta `Abeja`, ejecuta:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Abre <http://localhost:8080>, pulsa **Iniciar experiencia** y autoriza la cámara. Para detener el servidor, pulsa `Ctrl+C` en su terminal.

La cámara requiere localhost o HTTPS; no abras `index.html` directamente. Para probar desde un teléfono, publica el proyecto mediante HTTPS: `localhost` en el teléfono apunta al propio teléfono, no al computador. Se necesita internet para descargar las librerías desde sus CDN.

## Marcadores y modelos

El orden de compilación debe coincidir con `targetIndex` en `index.html`. Respeta las mayúsculas de `Colmena.png`.

| Índice | Imagen del marcador | Modelo 3D |
| --- | --- | --- |
| 0 | `imagenes/abeja.jpeg` | `imagenes/abeja.glb` |
| 1 | `imagenes/Colmena.png` | `imagenes/colmena.glb` |
| 2 | `imagenes/colmena2.png` | `imagenes/colmena2.glb` |
| 3 | `imagenes/colmenacompleta.jpeg` | `imagenes/colmenacompleta.glb` |

Se reconocen los cuatro marcadores en la misma sesión. `maxTrack: 2` permite seguir hasta dos simultáneamente para limitar el trabajo del dispositivo. Los controles actúan sobre el último modelo detectado; para verificar cada asociación, prueba un marcador a la vez.

## Prueba rápida

1. Abre la página, pulsa **Iniciar experiencia** y permite la cámara.
2. Muestra una imagen de la tabla en otra pantalla o impresa. Mantén el marcador completo, iluminado y sin reflejos; comienza a unos 30–50 cm.
3. Comprueba que aparece el modelo correspondiente y se habilitan **Conocer**, **Pausar** y **Reiniciar**.
4. Pulsa **Conocer** y verifica la información del objeto. Prueba pausar y continuar la rotación.
5. Oculta el marcador: el estado vuelve a la búsqueda y los controles se deshabilitan.
6. Repite con los otros tres marcadores.

Los cuatro GLB suman aproximadamente 44 MB; el de la colmena completa ocupa unos 24 MB. La primera carga puede tardar, especialmente en conexiones móviles. La detección y la escala visual deben comprobarse con una cámara real.

## Foto de recuerdo

Con la cámara lista, pulsa **📸 Recuerdo**. Se genera una foto JPEG con el encuadre de la cámara, los modelos 3D visibles y una franja con **Mi visita a colmena del macizo** y la fecha. Los controles no aparecen en la foto. Para incluir un modelo, mantén su marcador visible al capturar.

La vista previa permite descargar la foto, compartirla cuando el navegador admite compartir archivos o volver a la cámara para repetirla. En móviles también puedes mantener pulsada la imagen para acceder a las opciones de guardado del navegador. La foto se genera localmente, sin enviarse a un servidor; solo se comparte si pulsas Compartir y eliges un destino.

La captura está aislada en `souvenir.js` y no modifica la detección ni los controles existentes. Prueba una foto en vertical y otra en horizontal, verificando la alineación entre cámara y modelo, la frase, la descarga y las opciones de compartir de tu teléfono.

## Regenerar `targets.mind`

Cuando cambies una imagen de referencia, compila los cuatro marcadores juntos usando el [compilador oficial de MindAR](https://hiukim.github.io/mind-ar-js-doc/tools/compile/):

1. Añade las cuatro imágenes de `imagenes/` en el orden exacto de la tabla y comprueba ese orden antes de compilar.
2. Compila y exporta el resultado como `targets.mind`.
3. Sustituye el archivo de la raíz.
4. Actualiza el parámetro `v` de `imageTargetSrc` en `index.html` para evitar que el navegador reutilice una versión anterior.
5. Repite la prueba con los cuatro marcadores.

El archivo actual se generó con el compilador offline de MindAR 1.2.5. Contiene cuatro entradas en formato versión 2. Los GLB se cargan por separado desde las rutas de la tabla. Cambiar solo un GLB no requiere recompilar los marcadores.

## Estructura

```text
Abeja/
├── index.html          # Interfaz, recursos y cuatro entidades de seguimiento
├── script.js           # Cámara, detección, información y controles
├── souvenir.js         # Captura local, vista previa, descarga y compartir
├── style.css           # Diseño adaptable
├── targets.mind        # Único archivo de marcadores usado por la aplicación
├── imagenes/           # Cuatro imágenes de referencia y cuatro modelos GLB
└── README.md
```



## Funcionamiento y publicación

Es un sitio estático sin backend ni proceso de compilación para servirlo. MindAR compara la imagen de la cámara con los marcadores y calcula su posición; A-Frame renderiza el GLB asociado. Los eventos `targetFound` y `targetLost` actualizan la interfaz. El procesamiento de cámara se realiza en el dispositivo; la aplicación no guarda ni transmite fotografías.

Para publicar, entrega la raíz del proyecto mediante HTTPS y conserva `imagenes/`, los nombres de archivo y `targets.mind`. Se requiere un navegador compatible con WebGL y acceso a cámara.
