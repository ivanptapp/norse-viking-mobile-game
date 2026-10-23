# Ragnar — personaje articulado a partir de `all_body_ragnar.png`

Ragnar se construye ensamblando las piezas ilustradas de
`assets/heroes/all_body_ragnar.png` sobre el rig existente. No se ha
reescrito el sistema de animación: huesos, cinemática, controlador y clips son
los mismos que ya funcionaban. Fenrir y Lagertha no se han tocado.

## 1. Cómo se ensambla

`scripts/build-ragnar-kit.py` corta la lámina en 13 piezas con pivote
anatómico y las deja en `public/heroes/ragnar-kit/`:

| Pieza | Corte | Pivote |
| --- | --- | --- |
| `head` / `torso` | máscara que sigue el contorno del cráneo, no una fila recta | cuello (264, 107) |
| `arm-near-upper` | fila 74 de la lámina | hombro (306, 134) |
| `arm-near-lower` | fila 74 − 34 px de sangrado | codo (307, 147) |
| `arm-far-upper` | fila 102 | hombro (203, 134) |
| `arm-far-lower` | fila 102 − 34 px | codo (172, 177) |
| `leg-near-upper` | fila 410 | cadera (273, 256) |
| `leg-near-lower` | fila 410 − 36 px | rodilla (315, 351) |
| `leg-far-upper` | fila 404 | cadera (221, 252) |
| `leg-far-lower` | fila 404 − 36 px | rodilla (252, 345) |
| `cape` / `cape-tail` | capa partida en la fila 422 de la lámina, con 22 px de solape | raíz (264, 126) y costura (264, 190) |
| `shield`, `axe` | piezas completas | empuñadura (206, 234) / (340, 231) |

Los cortes se hacen **dentro de los puños que el artista ya dibujó** (puño de
la manga, piel de la bota, cuello) y ahora además **se difuminan 10–12 px** en
el borde. Un corte rígido siempre deja una línea recta; con el degradado de
alfa esa línea no aparece sobre el puño cuando la articulación gira, porque la
mitad que solapa ya tiene esos píxeles.

Ninguna pieza se recolorea, se escala ni se redibuja: el arte solo rota.

## 2. Cómo se mueve

- Los 25 huesos del rig original siguen ahí, con los mismos nombres.
- `poseTransformsKit.ts` traduce la pose del animador a rotaciones por pieza.
- `KIT_REFERENCE` guarda el ángulo en el que está dibujado el personaje; cada
  clip se aplica como delta sobre esa referencia, así que el dibujo es la pose
  de reposo.
- `LIMIT` recorta el recorrido: hombro 34°, codo 34°, cadera 30°, rodilla 34°.
  Probé 46/44 en hombro y codo y **no funciona**: pasado ~38° el antebrazo
  pintado se mete en el peto y el hacha cruza el pecho, porque el dibujo está
  hecho con el brazo colgando. Las piernas sí toleran más, porque la piel de
  la bota tapa el corte; de ahí que la zancada llegue más lejos que el brazo.
- Un `RagnarAnimator` sirve a las dos rutas de arte; el bucle muta `transform`
  en el DOM, sin renders de React por fotograma.

### Movimiento secundario

La pose ya traía canales que el kit no usaba; ahora sí:

- `cloak[0]` mueve la capa desde la raíz del hombro (tope 26°).
- `cloak[2]` mueve el **tramo inferior** desde la costura (tope 32°), con lo
  que la tela llega tarde al movimiento del torso: eso es el follow-through.
- `axe` y `shield` añaden 9° y 7° de vaivén alrededor de la empuñadura, sin
  despegar el arma de la mano.

Los clips no se han tocado: el animador ya interpolaba con cross-fades por
estado (`FADE` en `RagnarAnimator.ts`), y esos tiempos se respetan.

## 2a. Etalonaje y apoyo

Cada pieza pasa por un `grade()` en el script de corte, no por un filtro de
pantalla: contraste en S suave, sombras hacia azul frío y luces hacia ámbar
(el esquema del vídeo de referencia), y una desaturación mínima para que el
hierro lea como metal. Al aplicarse al PNG, las dos mitades de una
articulación reciben exactamente el mismo tratamiento y no aparece costura.

Debajo de las botas hay una segunda elipse de oclusión, más cerrada que la
sombra ambiental: sin ella la figura flotaba unos píxeles y la zancada se leía
como patinaje.

## 2b. Integración en la batalla

`src/components/hero-figure.tsx` ya no dibuja a Ragnar con fotogramas PNG: monta
`<RagnarCharacter art="kit" frame="full" />` y traduce los estados del campo a
los clips:

| Estado del campo | Clip |
| --- | --- |
| `idle` | `idle` |
| `walk` | `walk` |
| `attack` | `attack` |
| `hit` | `hit` |
| `dead` | `death` |
| `cast` | `victory` (alza el hacha) |
| `victory` | `victory` |

El contenedor `.hero-figure--ragnar` desactiva las animaciones CSS (si no, el
personaje se movería dos veces) y `.hero-figure__ragnar` le da caja propia,
porque el rig se dibuja con su encuadre 318x500. En `battle.tsx` conserva el
factor 1,3 que ya tenía el sprite, para mantener el tamaño que el jugador veía.

Comprobado en partida real: el componente aparece con `data-ragnar-art="kit"`
y recorre `idle → hit → walk → attack` conforme avanza el combate.

## 3. Pipeline reutilizable

`src/components/characters/shared/skeletalKit.ts` y `shared/KitRig.tsx` no
saben nada de Ragnar:

- `KitPart` — rectángulo de la ilustración + pivote.
- `KitSlot` — capa con hijos; el orden del árbol **es** el z-order.
- `JointRule` — articulación como dato (`poseKey`, `index`, `reference`,
  `limit`, `mirror`).
- `resolveAngles(rules, parts, pose)` — pose → rotaciones limitadas.
- `<KitRig slots parts assetRoot transforms onJoint />` — render del árbol.

Para añadir otro héroe: cortar su lámina, declarar `parts`/`slots`/`rules` y
una tabla de encuadres. El resto es compartido.

## 4. Qué se ha probado en el laboratorio

`/ragnar-test`, con el arte en **modo kit** (por defecto):

- Reposo: el kit se sostiene, barba y capa siguen al torso.
- Caminar: zancada con cadera y rodilla; el corte de rodilla ya no marca línea.
- Correr, pausado con la rodilla a 29,8°: sin hueco en la articulación.
- Atacar: hombro y codo llegan al tope de 34° sin despegar el hacha de la mano.
- Muerte: desplome y pose final mantenida.

El botón **Arte kit / Arte vector** alterna con la ruta vectorial anterior en
la misma cámara y la misma fase, para comparar.

## 5. Limitaciones conocidas

- Las piezas son rígidas: en poses extremas (muerte, flexión profunda) el
  corte de la rodilla todavía puede insinuarse. Se mitiga con sangrado y tope
  de ángulo; eliminarlo del todo exigiría malla deformable.
- El hacha va anclada al codo, no a la muñeca, porque la pintura original
  dibuja la mano cerrada sobre el mango; el tope de 34° evita que se separe.
- La capa es una sola pieza: se mueve como bloque, sin simulación secundaria.
- El hombro no gira sobre una articulación esférica: la hombrera pertenece al
  torso y el brazo gira bajo ella, que es lo que la ilustración permite.

## 6. Spine 2D — no se instala

Auditoría: Next.js 15 + React 19, render SVG en DOM, animador propio, sin
Canvas ni WebGL. Los tres caminos de Spine tienen problema:

| Opción | Paquete | Problema |
| --- | --- | --- |
| WebGL | `@esotericsoftware/spine-webgl` | Exige un `<canvas>` WebGL propio. |
| PixiJS | `@esotericsoftware/spine-pixi-v8` | Mete un segundo motor solo para un héroe. |
| Player | `@esotericsoftware/spine-player` | Visor autocontenido; no se conduce desde el animador. |

Además los runtimes requieren licencia del editor (pago, por producto), sin
editor no hay `.skel`/`.atlas`, y los 8 clips habría que rehacerlos a mano.

## 7. Restos del intento descartado

El rediseño vectorial (cara, paleta, escala de cabeza) sigue en el árbol de
`vector` porque no interfiere con el kit y sirve de comparación; no es el
camino elegido. El prototipo de PNG único nunca se creó.
