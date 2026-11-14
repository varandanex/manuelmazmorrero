# Integración de los enemigos aprobados

## Alcance

Se ha integrado la lámina aprobada como seis sprites independientes, conservando el sistema visual amarillo, magenta, crema y negro y el tamaño ampliado de los personajes.

| Rol interno estable | Personaje visible | Archivo base |
| --- | --- | --- |
| `grunt` | Goblin | `enemy-goblin` |
| `bat` | Scatterer | `enemy-scatterer` |
| `caster` | Llama maligna | `enemy-evil-llama` |
| `butcher` | El Juicer | `boss-juicer` |
| `spore` | La Acaparadora | `boss-hoarder` |
| `host` | Clon de Krakaren | `boss-krakaren` |

Los PNG y prompts están en `assets/art/enemies/`; los WebP de entrega, en `assets/webp/enemies/`. `manifest.json` enlaza cada rol con su imagen y prompt. Se ha utilizado la herramienta integrada de generación de imágenes, no la API/CLI. Son reconstrucciones aisladas guiadas por la lámina, no recortes sin pérdida. La lámina de referencia se conserva en `concept-sheet.png` y los dibujos anteriores no se han sobrescrito.

El Scatterer representa solo al insecto ágil pequeño, para mantener una criatura por entidad. Se ha eliminado la bola de fuego separada de la llama porque los proyectiles los dibuja el juego. El movimiento visual del Scatterer deja de flotar; sus reglas de movimiento no cambian.

## Invariantes

- Título: **Manolo el Mazmorrero**.
- Alturas visuales conservadas: héroe 78, Goblin 66, Scatterer 58, llama 74, Juicer 116, Acaparadora 122, Krakaren 106 y emisores 60 unidades de mundo.
- Sin cambios de hitboxes, daño, vida, alcance, oleadas, dificultad, controles o dimensiones del escenario.
- Los roles internos y sonidos siguen siendo estables. Los dos archivos de audio mantienen sus hashes anteriores.
- Emisores, escudo y segunda fase del jefe final conservados.
- Los ataques son adaptaciones del juego existente, no afirmaciones sobre habilidades canónicas de los libros.
- Solo trabajo local; no se ha publicado ni desplegado.

## Verificación automatizada

- `npm test`: **45/45 pruebas correctas**, incluidas carga de los seis WebP nuevos y presencia del emisor original.
- `npm run check`: correcto.
- `node docs/audio-integration/check-mechanics.mjs`: **28.800 fotogramas con estado de simulación idéntico**, cuatro semillas y tres pisos; excluye los eventos y metadatos de audio como documenta esa prueba.
- El diff frente a `before/game.js` solo contiene nombres de jefes y una pista textual. `src/main.js` no cambia.
- Registro completo en `test-results.txt`.

## Verificación visual y funcional

Pruebas realizadas en el navegador integrado a 390 × 844 CSS px y vista normal, no en un teléfono físico.

- Carga completa y título correcto; sin avisos ni errores en consola.
- Seis WebP de 1254 × 1254 con alpha real: esquina transparente y contenido visible. Fracción de píxeles transparentes: Goblin 57,2 %, Scatterer 78,0 %, llama 65,5 %, Juicer 52,9 %, Acaparadora 37,7 % y Krakaren 46,8 %.
- Siluetas reconocibles sobre los fondos oscuros, sin rectángulos de fondo.
- Juicer: señal de embestida visible y HUD «¡CUIDADO!».
- Acaparadora: cinco proyectiles, dos zonas de peligro y estado «VULNERABLE».
- Krakaren: dos emisores, conexiones del escudo y HUD «ESCUDO».
- Ataque al jefe bloqueado con escudo; cuatro golpes destruyeron ambos emisores con las ventajas de la prueba; el siguiente golpe redujo la vida de 450 a 409. Resultado en `browser-checks.json`.
- Movimiento, esquiva y ataque comprobados con entrada de teclado real. El golpe posterior a la esquiva dejó un enemigo menos y activó su enfriamiento.

Para visitar cada jefe se usó una instrumentación temporal de navegador, sin escribirla en el código servido del proyecto. Las capturas de enemigos ordinarios usan una distribución temporal para ver los tres dibujos a la vez. Al terminar se retiró la instrumentación, se restauró el checkpoint previo exacto y se recargó el juego original. También se retiró la emulación de viewport.

### Capturas

- `lobby-mobile.png`: portada y vista previa.
- `enemies-mobile.png`: Goblin, Scatterers y llamas.
- `juicer-mobile.png`: primer jefe y aviso de embestida.
- `hoarder-mobile.png`: segundo jefe, proyectiles y zonas de peligro.
- `krakaren-mobile.png`: jefe final con sus dos emisores.
- `final-lobby.png`: juego recargado sin instrumentación.

## Pendiente

Validación subjetiva de legibilidad y manejo táctil en el móvil físico que vaya a utilizarse. No requiere cambiar las mecánicas para probarlo.
