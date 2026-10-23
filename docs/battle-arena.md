# La arena de batalla

Cómo se monta el combate que se ve al pulsar «¡A la batalla!»: terreno,
formación, ataques por héroe y cartas del escuadrón.

## Piezas

| Archivo | Responsabilidad |
| --- | --- |
| `src/components/battle.tsx` | `BattleOverlay`: reproduce los `steps` que manda el servidor, coloca a los luchadores y orquesta el HUD. |
| `src/components/battle/attack-signatures.ts` | La identidad de ataque de cada héroe en datos: estilo, colores, entrada, sacudida y sonido. |
| `src/components/battle/battle-fx.tsx` | `FxLayer`: dibuja cada efecto (tajo, garra, rayo, círculo rúnico, polvo…). |
| `src/components/battle/battle-field.tsx` | Terreno, niebla, siluetas de primer plano, sombra de contacto y escala por profundidad. |
| `src/components/battle/battle-nameplate.tsx` | Placa mínima sobre cada unidad (nivel + vida). |
| `src/components/battle/battle-dock.tsx` | Cartas del escuadrón en el borde inferior (vida, energía, definitiva lista). |
| `src/app/battle-test/page.tsx` | Laboratorio con batalla simulada y catálogo de efectos. |

## Formación y profundidad

`LANES` define cinco posiciones por bando en fracciones del área útil
(alto del campo menos las cartas). Los héroes se ordenan por `position`
(vanguardia → retaguardia) y `level`, de modo que los que aguantan el frente
quedan delante.

Cada carril tiene una `y` propia; `depthScale(y)` la traduce en escala
(≈1.04 al frente, ≈0.80 al fondo) y `zIndex` ordena el dibujado. La geometría
completa vive en `metrics`, memorizada a partir del tamaño medido del campo,
así que al girar el móvil la formación se recompone.

## Ataques

`signatureFor(heroId)` devuelve la firma del héroe. Ocho estilos:

- `cleave` — arco amplio (hachas y espadas)
- `thrust` — estocada lineal (lanzas)
- `slam` — martillazo con onda de tierra
- `volley` — flechas
- `arcane` — círculo rúnico
- `beam` — rayo sostenido
- `drain` — drenaje de vida
- `fang` — tres garras

La firma decide además **cómo entra** el héroe (`dash`, `lunge`, `blink`,
`stand`), el tiempo de guardia antes del impacto y cuánta cámara se sacude.
Añadir un héroe nuevo es añadir una entrada en `OVERRIDES`; si no está, se
deduce por arma con `fromWeapon`.

## Definitivas

Las de Ragnar usan vídeo (`/videos/ultimates/ragnar-ultimate.mp4`) enmarcado
como una escena cinematográfica. El resto dibujan un cut-in con retrato,
nombre de la habilidad, elemento, nivel y la cita del héroe, más una runa
gigante de agua y una onda de choque en el campo.

## Rendimiento

Todo es SVG/CSS: no hay sprites ni canvas. Los efectos son nodos que se
eliminan solos (`addFx` con TTL), y el bucle de animación de cada rig se para
solo cuando el héroe sale de pantalla o la pestaña se oculta.
