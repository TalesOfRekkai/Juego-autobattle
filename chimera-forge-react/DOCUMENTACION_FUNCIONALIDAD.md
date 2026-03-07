# Documentacion Funcional - Chimera Forge (estado actual)

## 1. Vision general del juego
`Chimera Forge` es un juego de coleccion y progresion tipo autobattler por expediciones.
El loop principal actual es:

1. Crear/cargar partida.
2. Obtener y eclosionar Rekaimon.
3. Enviar equipos a rutas para conseguir recursos, XP y huevos.
4. Subir nivel/evolucionar criaturas.
5. Fusionar criaturas (cria) para desbloquear especies nuevas.
6. Completar bestiario y repetir.

## 2. Arquitectura actual del proyecto

## Frontend y carga
- Aplicacion web vanilla (HTML + CSS + JS sin framework).
- Punto de entrada: `index.html`.
- Inicializacion: `Game.init()` en `DOMContentLoaded`.
- Renderizado por pantallas en un contenedor unico (`#screen-container`).

## Modulos principales
- `js/data.js`: carga JSON de criaturas, stats base, sprites, ventajas elementales, XP y evolucion.
- `js/creatures.js`: fabrica de criaturas, calculo de stats, XP, evolucion, HP y utilidades.
- `js/routes.js`: definicion de rutas y resolucion de expediciones.
- `js/resources.js`: inventario, costos y pagos de recursos.
- `js/breeding.js`: reglas de cria/fusion.
- `js/game.js`: estado global, guardado/carga, eclosion, expediciones y acciones de criatura.
- `js/ui.js`: todas las pantallas, interacciones, toasts y modales.

## Datos de criaturas (actuales)
- Fuente: `chimera-forge-assets.json`.
- 108 entradas totales (36 especies x 3 stages).
- 36 especies en stage 1:
- 8 base.
- 28 de fusion.

## 3. Estado global y persistencia

## Estado de juego (`Game.state`)
- `phase`: valor actual usado como metadata (`title`, `egg_hatch`, `hub`).
- `creatures`: lista de Rekaimon del jugador.
- `eggs`: huevos en inventario.
- `resources`: inventario de recursos.
- `expeditions`: expediciones activas/completadas.
- `discoveredNames` y `discoveredKeys`: progreso de bestiario.
- `totalExpeditions`, `tutorialDone`, `slotName`, timestamps.

## Guardado
- Persistencia en `localStorage`.
- Prefijo por slot: `chimera_forge_slot_`.
- 3 slots maximos.
- Cada accion relevante llama a `Game.save()`.

## Slots
- Crear partida nueva por slot.
- Cargar slot existente.
- Borrar slot desde titulo o ajustes.
- Cambio de slot activo desde ajustes con guardado previo.

## 4. Flujo de partida actual

## Inicio
1. Pantalla de titulo con slots.
2. Nueva partida crea inventario vacio.
3. Se regala 1 huevo base aleatorio.
4. Se fuerza la pantalla de primera eclosion (gratis).

## Hub
- Vista central con:
- Barra de recursos.
- Lista de Rekaimon.
- Huevos disponibles.
- Avisos de expediciones activas/completadas.
- Navegacion a rutas, huevos, cria, bestiario y ajustes.

## 5. Sistema de criaturas

## Identidad de criatura
Cada criatura instancia tiene:
- `id` unico incremental.
- `name`, `element`, `bodyType`, `traits`.
- `type` (`base` o `fusion`), `tier` (`common` o `rare`).
- `stage` (1-3), `level`, `xp`.
- `currentHP`, flags `hasBred` e `isOnExpedition`.
- `parentA` y `parentB` cuando es fusion.

## Stats
- Perfil base por `bodyType`.
- Multiplicador por stage:
- S1 = 1.0
- S2 = 1.5
- S3 = 2.2
- Bono por tier:
- `common` = 1.0
- `rare` = 1.15
- Escalado por nivel:
- `1 + (level - 1) * 0.08` aplicado a HP/ATK/DEF/SPD.

## XP, nivel y evolucion
- XP total requerida para nivel: `floor(10 * level^1.8)`.
- Umbrales de evolucion:
- Stage 2 en nivel 5.
- Stage 3 en nivel 15.
- Al subir de nivel o evolucionar, la criatura se cura a full.

## Poder
- Poder usado en expediciones: `HP + ATK + DEF + SPD`.

## 6. Sistema elemental

## Elementos activos
- Fuego, Agua, Tierra, Aire, Sombra, Luz.

## Ventajas
- Fuego > Tierra, Aire
- Agua > Fuego
- Tierra > Aire, Agua
- Aire > Tierra
- Sombra > Luz
- Luz > Sombra

## Impacto en expediciones
- Si el equipo tiene alguna ventaja contra el elemento de ruta: bonus x1.3.
- Si no hay ventaja pero hay mismo elemento: bonus x1.15.
- Si no, bonus x1.0.

## 7. Recursos y economia actual

## Recursos
- `essence` (esencia)
- `herbs` (hierbas)
- `eggFragments` (fragmentos de huevo)
- `crystals` (cristales)

## Costes actuales implementados
- Eclosionar huevo: 10 fragmentos (`FRAGMENTS_PER_HATCH`).
- Curar criatura al maximo desde detalle: 2 hierbas.
- Entrenar criatura (detalle): 5 esencia por +15 XP.

## Nota de comportamiento actual
- Los cristales se obtienen en rutas avanzadas, pero no hay una mecanica activa en codigo que los gaste.

## 8. Sistema de huevos y eclosion

## Obtencion de huevos
- Huevo inicial de partida (aleatorio entre especies base).
- Posible drop al resolver expediciones segun ruta y supervivencia.

## Eclosion
- Primera eclosion de partida: gratis.
- Eclosion normal: consume 10 fragmentos.
- El huevo se elimina del inventario y crea criatura stage 1 nivel 1.

## 9. Sistema de expediciones (autobattle)

## Flujo
1. Elegir ruta en mapa (si cumple requisitos).
2. Elegir equipo de hasta 3 criaturas disponibles.
3. Lanzar expedicion (temporizada).
4. Al terminar, resolver para recibir resultados.

## Restricciones de equipo
- Solo criaturas no marcadas `isOnExpedition`.
- Maximo 3 por expedicion.

## Timer
- `Game.tickExpeditions()` se ejecuta cada segundo.
- Marca expediciones como completadas al terminar duracion.
- UI actualiza badges y timers en tiempo real.

## Resolucion de combate (modelo actual)
- No hay combate por turnos visual.
- Se calcula supervivencia por criatura con probabilidad basada en poder, bonus elemental y `enemyPower`.
- Cada criatura puede sobrevivir o debilitarse de forma independiente.
- Debilitadas quedan con `currentHP = 0`.
- Supervivientes reciben XP.
- Supervivientes se curan parcialmente al final (+50% HP max).
- Recursos se escalan por proporcion de supervivientes.
- Chance de huevo tambien se escala por proporcion de supervivientes.

## Recompensas por ruta
- Esencia, hierbas, fragmentos y cristales en rangos aleatorios.
- XP aleatoria por superviviente.
- Chance de huevo por ruta.

## 10. Rutas implementadas

## Dificultad 1
- Bosque Susurrante (tierra, 30s, sin requisito).
- Costa Bioluminiscente (agua, 30s, sin requisito).

## Dificultad 2
- Volcan Dormido (fuego, 60s, requiere 1 criatura nivel 3+).
- Cumbres Ventosas (aire, 60s, requiere 1 criatura nivel 3+).

## Dificultad 3
- Cripta Olvidada (sombra, 120s, requiere 2 criaturas nivel 5+).
- Templo Solar (luz, 120s, requiere 2 criaturas nivel 5+).

## Dificultad 4
- Nexo Elemental (mixto, 180s, requiere 3 criaturas nivel 10+).

## 11. Sistema de cria/fusion

## Requisitos
- Seleccionar 2 criaturas distintas.
- Cada una debe ser nivel 5+.
- Ninguna debe haber criado antes (`hasBred`).
- Ninguna debe estar en expedicion.
- Debe existir receta de fusion en los datos.

## Resultado
- Se marca a ambos padres como usados para cria.
- Se crea una nueva criatura de fusion stage 1.
- La fusion resultante depende de los nombres de ambos padres (orden indiferente).

## UX de cria
- Seleccion por modal.
- Preview del resultado (sprite, elemento, tier) si la combinacion existe.
- Bloqueo con mensaje si no es compatible.

## 12. Bestiario/coleccion

## Seguimiento
- El juego guarda descubrimiento por clave `name_sX`.
- Se registra al obtener criatura nueva y al evolucionar de stage.

## Pantalla de bestiario
- Muestra progreso:
- Descubrimientos por entrada total (name+stage).
- Especies descubiertas sobre total.
- Agrupa por especie y enseña sus 3 stages.
- Entradas no descubiertas aparecen ocultas/atenuadas.

## 13. Pantallas implementadas en UI
- `title`: slots de guardado.
- `egg_hatch`: animacion de eclosion.
- `hub`: resumen principal.
- `routes`: mapa con pins y estado de expediciones.
- `select_team`: seleccion de equipo para ruta.
- `expedition_active`: expediciones activas/completadas.
- `expedition_result`: resumen de botin/supervivencia/evoluciones.
- `breeding`: sala de cria.
- `collection`: bestiario.
- `creature_detail`: ficha y acciones de criatura.
- `eggs_inventory`: inventario de huevos.
- `settings`: gestion de slots y vuelta a titulo.

## 14. Gestion de criatura desde detalle
- Curar al maximo por coste de hierbas.
- Entrenar (+15 XP) por coste de esencia.
- Ver stats, rasgos, poder, progreso XP y linea de evolucion S1-S3.
- Ver padres si es criatura de fusion.

## 15. Comportamientos tecnicos relevantes
- Carga de datos via `fetch` local del JSON.
- Si falla la carga, `Data.allCreatureData` queda vacio y se registran errores por consola.
- IDs de criatura se restauran al cargar partida para evitar colisiones.
- Re-render de UI al completar expediciones para reflejar notificaciones.

## 16. Limitaciones y pendientes visibles en el codigo actual
- `phase` del estado existe, pero la navegacion real depende de `UI.showScreen`.
- `tutorialDone` existe en estado, sin flujo de tutorial implementado.
- `crystals` se acumulan, pero no se consumen en mecanicas activas.
- Hay variable `survivalChance` calculada en rutas que no se usa directamente (la supervivencia real se calcula por criatura).
- No existe sistema de combate manual ni habilidades activas; la resolucion es probabilistica por poder.

## 17. Resumen ejecutivo del estado jugable
- El juego ya es jugable de inicio a progreso medio/alto:
- Tiene loop completo de captura (huevos), progreso (XP/evolucion), riesgo/recompensa (rutas) y metajuego (cria + bestiario).
- Incluye persistencia multi-slot y UI integral de gestion.
- Las bases para seguir creciendo estan listas: economia avanzada, uso de cristales, tutorial y expansion de contenido.

