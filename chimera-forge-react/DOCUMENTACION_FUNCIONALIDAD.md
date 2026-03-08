# Documentacion Funcional - Chimera Forge (release breve)

## Stack actual
- React 19 + TypeScript
- Vite
- Zustand para estado global
- CSS plano del proyecto (`src/styles.css`)
- Persistencia en `localStorage` por slots

## Estructura principal
- `src/main.tsx`: bootstrap de la app
- `src/App.tsx`: router y ciclo global (tick de expediciones)
- `src/store/gameStore.ts`: estado de juego y logica principal
- `src/lib/`: logica de dominio (`creatures`, `routes`, `breeding`, `resources`, `buildings`, `data`)
- `src/components/screens/`: pantallas jugables
- `src/components/layout/`: layout comun (top bar, nav, modal, toasts)
- `public/chimera-forge-assets.json`: datos de criaturas/base

## Loop jugable actual
1. Crear/cargar slot.
2. Eclosionar huevos para obtener Rekaimon.
3. Enviar equipo a rutas/expediciones.
4. Cobrar recompensas (recursos, XP, posible huevo) y progresar criaturas.
5. Mejorar edificios del hub para desbloquear ventajas.
6. Fusionar criaturas compatibles para descubrir especies nuevas.
7. Completar coleccion y repetir progresion.

## Sistemas implementados
- Criaturas:
  - Niveles, XP, evolucion por stages, HP, rasgos y estado (`hasBred`, `isOnExpedition`).
- Rutas y expediciones:
  - Seleccion de ruta/equipo, duracion, resolucion por supervivencia, ventaja elemental, `enemyPower`, recompensas y huevo.
- Edificios:
  - Incubadora, Entrenamiento, Torre del Explorador, Camara de Fusion, Herbolario, Mina.
- Cria/Fusion:
  - Validacion de compatibilidad y requisitos, creacion de criatura fusion.
- Bestiario/Coleccion:
  - Registro de descubrimientos por especie/stage y vista de progreso.
- Slots de guardado:
  - Multiples partidas, carga/borrado y metadatos basicos.

## Nota de estado (importante)
- Los modificadores de ruta (`routeModifiers`) ya estan integrados en la resolucion de expediciones.
- Los buffs de edificios ya impactan sistemas reales (incluyendo eclosion y requisito minimo de fusion).

