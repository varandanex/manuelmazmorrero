# Manolo el Mazmorrero — Guía de dirección visual

**Propuesta para revisión · 14 de noviembre de 2026 · No aplicada al juego.**

## La decisión que propongo

**Una aventura de acción grotesca con la identidad gráfica de las portadas
españolas, no una mazmorra medieval retro.** Negro, amarillo ácido y fucsia;
letras enormes e irregulares; personajes originales expresivos; piedra mezclada
con maquinaria y cámaras. La partida conserva sus controles y sus reglas.

El nombre solicitado es **Manolo el Mazmorrero**. La semejanza física del
protagonista con la persona real todavía no está definida: las figuras de las
muestras son provisionales.

## 1. Qué dicen las referencias

Revisión representativa, no exhaustiva, de fuentes oficiales. No se ha tomado
fan art por canon ni se han mezclado las ediciones como si fueran una sola.

### Portadas NOVA / familia gráfica Ace

Las cubiertas españolas 1 y 2 muestran negro, amarillo/fucsia muy saturados,
tipografía desproporcionada, formas dentadas, desgaste y escenas pequeñas con
acción absurda. La tercera introduce rojo y maquinaria sin abandonar esa
estructura. **Amarillo impreso, no oro medieval; fucsia gráfico, no una obligación
de convertir todo en neón.**

Fuentes: [NOVA 1](https://www.penguinlibros.com/es/libros-de-ciencia-ficcion/384482-libro-carl-el-mazmorrero-carl-el-mazmorrero-1-9788410466135),
[NOVA 2](https://www.penguinlibros.com/es/libros-de-ciencia-ficcion/399038-libro-el-juicio-final-de-carl-carl-el-mazmorrero-2-9788410466081),
[catálogo Ace](https://www.penguinrandomhouse.com/series/43C/dungeon-crawler-carl/).
La familia de diseño aparece en el portfolio de [Will Staehle / Unusual Co.](https://unusualco.work/);
no se ha verificado un crédito separado de la adaptación española.

### Cubiertas ilustradas

La cubierta ilustrada del volumen 8 revisada combina figuras de proporciones
adultas, luz dramática, acción y elementos disparatados. Grim Oak acredita a
Luciano Fleitas y el diseño a Matt Dinniman. Es una familia alternativa, **no la
portada del primer libro ni la identidad gráfica de NOVA**.

[Fuente y créditos: Grim Oak](https://grimoakpress.com/products/a-parade-of-horribles-by-matt-dinniman-pod-tp-edition).

### Adaptación de cómic

La cubierta de Nathan Gooden publicada por Vault usa contornos marcados,
anatomías expresivas y una mezcla de amenaza y ropa absurda. Es útil para
imaginar personajes móviles legibles, pero pertenece a una adaptación distinta.

[Fuente y créditos: Vault](https://blog.vaultcomics.com/vault-comics-and-matt-dinniman-announce-dungeon-crawler-carl-ongoing-comic-book-series/).

## 2. Diagnóstico del juego actual

Capturas nuevas de esta revisión: `references/01-current-lobby.png` y
`references/02-current-game.png`.

1. **Inicio — funcional, pero con identidad equivocada.** El título se lee y la
   acción principal se entiende. El dorado, el malva apagado, el escudo y los
   acabados limpios comunican una fantasía retro más amable que las referencias.
2. **Combate — estructura útil, imaginario demasiado genérico.** Piedra,
   antorchas, pequeño héroe con espada, murciélagos y criaturas redondeadas.
   Falta el choque entre persona contemporánea, monstruos y espectáculo cruel.
3. **Interfaz — conservar la distribución; mejorar el texto.** Joystick y
   acciones están separados. Los microtextos del HUD y del narrador se ven
   pequeños; la guía propone ampliarlos. Estas capturas no demuestran por sí
   solas cumplimiento de accesibilidad ni rendimiento en un teléfono físico.

Lo que sí se conserva: tres pisos, patrones de jefes, ataque/esquiva, mejoras,
reintentos y humor. **No hace falta rehacer el juego para corregir su identidad.**

## 3. Tres muestras de acabado

Las imágenes son conceptos generados, no capturas de una versión implementada
ni promesas de animación. El orden coincide con su presentación en el chat.

| Muestra | Enfoque | Ventaja | Coste o riesgo |
| --- | --- | --- | --- |
| **1. Editorial ácido — recomendado** | Gráfica limitada y sucia, negro/amarillo/fucsia, siluetas contrastadas. | Conecta mejor con las portadas españolas y simplifica la producción de arte. | Evitar que títulos y textura invadan el combate. |
| **2. Cómic de arena** | Contorno de tinta, personajes con volumen y expresividad. | Los jefes y Manolo tienen más personalidad. | Más dibujos y fotogramas; exceso de detalle o sangre puede distraer. |
| **3. Pulp apocalíptico** | Acabado pictórico, luz cinematográfica, materiales. | Mayor sensación de espectáculo y profundidad. | Producción más costosa; riesgo de perder legibilidad o parecer fantasía genérica. |

Recomiendo la **muestra 1 como sistema visual**. De la 2 tomaría la claridad de
las poses, no una segunda identidad ni todo su detalle. La 3 queda como contraste
de acabado, no como propuesta principal. Las estimaciones de esfuerzo son una
valoración de diseño, no plazos cerrados.

## 4. Reglas del estilo recomendado

### Color

Tokens propuestos, **no colores oficiales ni muestras editoriales exactas**:

| Token | Color | Función |
| --- | --- | --- |
| Tinta | `#0B0B0E` | Fondos y separación; base dominante. |
| Azufre | `#FFE000` | Marca, acción principal y recompensas. |
| Fucsia | `#ED147B` | Sistema hostil, avisos y acentos gráficos. |
| Papel | `#F4EDDD` | Texto legible y bordes de personajes. |
| Óxido | `#FF5738` | Impactos y elementos del matadero. |
| Frío industrial | `#57C7D4` | Máquinas y detalles del plató, con moderación. |

Base oscura en aproximadamente dos tercios de la interfaz. Máximo dos acentos
fuertes simultáneos por escena. El peligro siempre lleva forma, patrón y/o
animación: nunca depende únicamente del color. No escribir fucsia sobre amarillo.

### Tipografía y composición

- Marca: lettering original grueso, compacto, irregular y ligeramente inclinado.
  No calcar el logotipo de la editorial ni incrustar sus ilustraciones.
- Texto operativo: una sans limpia; se puede conservar Inter del proyecto.
- Cuerpo y narrador: objetivo 14–16 px. Etiquetas secundarias: 12 px cuando el
  espacio lo permita, sin esconder instrucciones en microtexto.
- La exuberancia va en el inicio y en las presentaciones de jefe. Durante el
  combate, título compacto y arena protagonista.
- Negro como descanso visual. Desgaste en bordes y titulares, nunca en textos
  pequeños, barras de vida o indicadores de recarga.

### Personajes y mundo

- Manolo: adulto, no caballero ni figura cabezona. Ropa contemporánea y equipo
  improvisado; actitud entre indignación y supervivencia. La indumentaria de las
  muestras es una propuesta, no una decisión sobre su parecido real.
- Jefes: siluetas reconocibles, tamaño amenazante y un detalle ridículo que los
  haga memorables. Menos monstruo genérico, más adversario con personalidad.
- Entornos: piedra + metal + cables + vigilancia. No añadir un monitor en cada
  baldosa: la tecnología explica el espectáculo, no llena espacio.
- Sin compañero nuevo ni personajes adicionales por defecto. No confundir un
  guiño de la saga con la obligación de añadir una mecánica.

### Interfaz, movimiento y sonido

- El Sistema se identifica con un símbolo original de vigilancia y una banda
  editorial. Sus mensajes son cortos, sarcásticos y legibles.
- Logros: interrupciones gráficas breves y puntuales, no ventanas constantes.
- Avisos de ataque: contorno nítido, trama y dirección; separación clara respecto
  al decorado. Su forma debe coincidir con la zona de daño real.
- Movimiento: impactos secos y un pequeño temblor opcional; nada de parpadeos
  constantes. Respetar movimiento reducido y mantener apagado el sonido hasta
  que se active.
- Sonido propuesto para una fase posterior: golpes y avisos de concurso, no
  música medieval. Sin copiar voces, audiolibros ni pistas de la saga.

## 5. Qué cambiaría concretamente

| Elemento | Cambio propuesto | Se conserva |
| --- | --- | --- |
| Nombre | Manolo el Mazmorrero en título, personaje y textos. | Partidas y progresión; no cambiar la clave de guardado sin necesidad. |
| Inicio | Composición de cartel editorial con ilustración original. | Botón de jugar, continuar, ayuda y sonido. |
| Manolo | Sprites ilustrados con poses claras; arma improvisada en lugar de espada genérica. | Movimiento, alcance y temporización del ataque. |
| El Carnicero | Matadero industrial absurdo; embestida muy marcada. | Embestida y recuperación vulnerable. |
| Madre Espora | Organismo grotesco en un jardín artificial averiado. | Esporas y zonas de veneno. |
| El Presentador | Hostilidad de concurso: vigilancia, pantallas y emisores. | Escudos, generadores y segunda fase. |
| HUD y controles | Mayor legibilidad, botones de alto contraste, menos adorno. | Joystick, atacar, esquivar y pausa. |
| Derrota y victoria | Carteles de programa cruel y felicitación final. | Reintentar, mejoras y final de cumpleaños. |

Estos diseños de jefes son originales para el juego; no se presentan como
descripciones canónicas de enemigos de los libros.

## 6. Aplicación por fases, solo después de aprobación

1. **Identidad y nombre.** Títulos, paleta, tipografía y pantallas de inicio/final.
2. **Una sala piloto.** Manolo y El Carnicero con sus animaciones, conservando
   colisiones, controles y reglas. Validar antes de producir los demás pisos.
3. **Extender el sistema.** Arte de los otros jefes, entornos, efectos y logros.
4. **Comprobar en móvil.** Mantener todo operable a 320 y 390 px, objetivos
   táctiles de al menos 44 px, contraste medido, lectura de peligros y fluidez en
   el teléfono real. No prometer rendimiento a partir de una imagen.

Las muestras tienen títulos demasiado grandes para copiarlos literalmente en
combate y un nivel de detalle que habrá que reducir. No son una especificación
de cámara, posiciones, tamaño de colisiones o sangre. La implementación debe
respetar la arena y las reglas existentes, no convertirla en un cuadro estático.

## Límites y entregables

- Solo investigación, guía y tres imágenes de propuesta. El juego sigue intacto.
- Sin integración con regalos de la caja, registro, tienda ni funciones nuevas.
- Referencias oficiales solo para análisis; no se usarán como texturas del juego.
- Muestras generadas con la herramienta integrada de imágenes; prompts guardados
  junto a ellas en `proposals/`. No se ha usado un modelo local ni una API externa
  configurada en el proyecto.
- Referencias y atribuciones ampliadas en `source-research.md`.
- No se analiza la trama de los libros para evitar spoilers.
