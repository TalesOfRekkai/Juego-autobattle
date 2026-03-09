/* ============================================
   i18n — Internationalization System
   Supports: Español (es), English (en)
   ============================================ */

import { create } from 'zustand';

export type Language = 'es' | 'en';

interface I18nStore {
    lang: Language;
    setLang: (lang: Language) => void;
}

export const useI18n = create<I18nStore>((set) => ({
    lang: (localStorage.getItem('rekkaimon_lang') as Language) || 'es',
    setLang: (lang) => {
        localStorage.setItem('rekkaimon_lang', lang);
        set({ lang });
    },
}));

/** Hook to get current translations */
export function useT() {
    const lang = useI18n(s => s.lang);
    return translations[lang];
}

// ========== TRANSLATIONS ==========
const translations = {
    es: {
        // --- Navigation ---
        nav_hub: 'HUB',
        nav_routes: 'RUTAS',
        nav_eggs: 'HUEVOS',
        nav_breed: 'CRIAR',
        nav_progress: 'PROGRESO',
        nav_settings: 'AJUSTES',

        // --- Title Screen ---
        title_subtitle: 'Colecciona, cría y evoluciona criaturas elementales. Envíalas a expediciones para ganar recursos y descubrir nuevos huevos.',
        title_connect_hint: 'Conecta tu wallet para jugar onchain',
        title_connect_btn: '🔗 Conectar Wallet',
        title_connecting: '⏳ Conectando...',
        title_powered_by: 'Powered by Cartridge Controller',
        title_wallet_connected: '✅ Wallet Conectada',
        title_continue: '▶️ Continuar Partida',
        title_new_game: '🎮 Nueva Partida',
        title_creating: '⏳ Creando partida...',
        title_stats: (c: number, e: number, x: number) => `🐾 ${c} criaturas · 🥚 ${e} huevos · 🗺️ ${x} expediciones`,
        title_onchain: '⛓️ Onchain · Starknet · Dojo Engine',

        // --- Hub Screen ---
        hub_expedition_done: (n: number) => `${n} expedición${n > 1 ? 'es' : ''} completada${n > 1 ? 's' : ''} — ¡Recoge tus recompensas!`,
        hub_expedition_active: (n: number) => `${n} expedición${n > 1 ? 'es' : ''} en curso`,
        hub_creatures_title: (n: number) => `Tus Rekaimon (${n})`,
        hub_no_creatures: 'Aún no tienes Rekaimon. ¡Eclosiona un huevo!',
        hub_eggs_title: (n: number) => `Huevos (${n})`,
        hub_egg_name: (name: string) => `Huevo de ${name}`,
        hub_buildings: '🏗️ Edificios',
        hub_build: '🔨 Construir',
        hub_upgrade: (lvl: number) => `🔨 Mejorar a Nivel ${lvl}`,
        hub_max_level: '⭐ Nivel máximo alcanzado',
        hub_not_built: '🔒 Sin construir',
        hub_level: (n: number) => `Nivel ${n}`,
        hub_close: 'Cerrar',
        hub_need_fragments: (n: number) => `Necesitas ${n} 🥚 fragmentos para eclosionar`,
        hub_building_upgraded: '¡Edificio mejorado!',
        hub_not_enough_resources: 'No tienes suficientes recursos',

        // --- Settings ---
        settings_title: '⚙ Ajustes',
        settings_account: 'CUENTA',
        settings_language: 'IDIOMA',
        settings_audio: 'AUDIO',
        settings_katana_dev: 'Katana (Dev)',
        settings_local_account: 'Cuenta local de desarrollo',
        settings_cartridge: 'Cartridge Controller',
        settings_production: 'Cuenta de producción',
        settings_connected: '● Conectado',
        settings_disconnected: '● Desconectado',
        settings_address: 'DIRECCIÓN',
        settings_creatures: 'Criaturas',
        settings_expeditions: 'Expediciones',
        settings_eggs_label: 'Huevos',
        settings_logout: '🚪 Cerrar Sesión',
        settings_connect: '🔗 Conectar',
        settings_network: 'RED',
        settings_env: 'Entorno',
        settings_development: 'Desarrollo',
        settings_production_env: 'Producción',
        settings_node: 'Nodo',
        settings_local: 'Katana Local',
        settings_back: '← Volver al Hub',
        settings_spanish: 'Español',
        settings_english: 'English',

        // --- Breeding ---
        breed_title: '🧬 Fusión Rekkaimon',
        breed_select_parent: (n: number) => `Selecciona Padre ${n}`,
        breed_no_available: (lvl: number) => `No tienes criaturas elegibles (Nivel ≥ ${lvl}, no criadas)`,
        breed_fuse_btn: '🧬 ¡Fusionar!',
        breed_fusing: '⏳ Fusionando...',
        breed_preview: 'Vista previa de fusión',
        breed_result: '🎉 ¡Fusión exitosa!',
        breed_new_creature: '← Volver',
        breed_cannot: 'No se puede fusionar',
        breed_min_level: (lvl: number) => `Nivel mínimo: ${lvl}`,

        // --- Expeditions ---
        exp_your_expeditions: 'Tus Expediciones',
        exp_no_active: 'No tienes expediciones activas.',
        exp_start_one: '¡Envía a tus criaturas a explorar!',
        exp_go_routes: '🗺️ Ir a Rutas',
        exp_active: 'Activas',
        exp_completed: 'Completadas',
        exp_time_left: 'Tiempo restante',
        exp_claim: '🎁 Recoger Recompensas',
        exp_claiming: '⏳ Recogiendo...',
        exp_back: '← Volver',
        exp_rewards_title: '🎁 ¡Recompensas obtenidas!',
        exp_return_hub: 'Volver al Hub',

        // --- Creature Detail ---
        detail_back: '← Volver',
        detail_heal: '🌿 Curar',
        detail_healing: '⏳ Curando...',
        detail_train: '⚔️ Entrenar',
        detail_training: '⏳ Entrenando...',
        detail_boost: '⚡ Mejorar',
        detail_boosting: '⏳ Mejorando...',
        detail_on_expedition: '🗺️ En expedición',
        detail_bred: '🧬 Ya ha criado',
        detail_type: 'Tipo',
        detail_element: 'Elemento',
        detail_tier: 'Tier',
        detail_stage: 'Etapa',
        detail_healed: '¡Rekaimon curado!',
        detail_no_herbs: 'No tienes suficientes hierbas',
        detail_trained: '+15 XP de entrenamiento',
        detail_no_essence: 'No tienes suficiente esencia',
        detail_heal_cost: '🌿 Curar (2 Hierbas)',
        detail_train_cost: '🔮 Entrenar (5 Esencia → +15 XP)',
        detail_total_power: 'Poder total',
        detail_level: (n: number) => `Nivel ${n}`,
        detail_traits: 'RASGOS',
        detail_parents: 'PADRES',
        detail_evolution: 'EVOLUCIÓN',

        // --- Select Team ---
        team_title: 'Selecciona equipo',
        team_start: '🚀 ¡Comenzar expedición!',
        team_starting: '⏳ Iniciando...',
        team_select_creatures: 'Selecciona criaturas para la expedición',
        team_select_desc: 'Selecciona tu equipo para esta expedición (max 3).',
        team_advantage: 'Ventaja',
        team_max_creatures: 'Máximo 3 criaturas por expedición',
        team_no_available: 'No tienes Rekaimon disponibles',
        team_count: (n: number) => `Equipo: ${n}/3`,
        team_duration: 'Duración',
        team_send: '🚀 Enviar Expedición',
        team_started: '¡Expedición iniciada!',
        team_error: 'Error al iniciar expedición',

        // --- Expedition Active ---
        exp_title: 'Expediciones',
        exp_completed_status: '✓ ¡Expedición completada!',
        exp_no_active_desc: 'No hay expediciones activas. ¡Envía a tus Rekaimon a explorar!',
        exp_see_routes: 'Ver Rutas',

        // --- Expedition Result ---
        result_title: '🏆 Resultado de Expedición',
        result_opening: 'Abriendo recompensas...',
        result_processing: 'Procesando en blockchain',
        result_survivors: (n: number) => `SUPERVIVIENTES (${n})`,
        result_fainted: (n: number) => `DEBILITADOS (${n})`,
        result_evolution: '⭐ ¡EVOLUCIÓN!',
        result_evolved: (name: string, stage: number) => `${name} ha evolucionado a Stage ${stage}!`,
        result_resources: 'RECURSOS OBTENIDOS',
        result_essence: 'Esencia',
        result_herbs: 'Hierbas',
        result_fragments: 'Fragmentos',
        result_crystals: 'Cristales',
        result_no_resources: 'Sin recursos esta vez',
        result_egg_found: '🎉 ¡HUEVO ENCONTRADO!',
        result_egg_of: (name: string) => `Huevo de ${name}`,
        result_back_hub: 'Volver al Hub',

        // --- Loading ---
        loading_data: 'Cargando datos...',
        loading_blockchain: 'Conectando con blockchain...',

        // --- Routes Screen ---
        routes_world_maps: '🗺️ Mapas del Mundo',
        routes_count: (n: number) => `📍 ${n} rutas`,
        routes_ready: (n: number) => `${n} expedición${n > 1 ? 'es' : ''} completada${n > 1 ? 's' : ''} — ¡Recoge!`,
        routes_completed_tap: '✓ ¡Completada! Toca para recoger',
        routes_ready_short: '✓ ¡Lista!',
        routes_req: 'Req',
        routes_mixed: 'Mixto',

        // --- Collection / Progress ---
        collection_challenges: 'Desafíos',
        collection_completed: 'Completadas',
        collection_medals: 'Medallas desbloqueadas',
        collection_bestiary: 'Bestiario',
        collection_species: 'Especies descubiertas',
        collection_entries: 'Entradas descubiertas',

        // --- Egg Hatch ---
        egg_first_title: '¡Tu primer Rekaimon!',
        egg_hatch_title: '¡Eclosión de Huevo!',
        egg_first_desc: 'Toca el huevo para eclosionar tu primer compañero.',
        egg_hatch_desc: 'Toca el huevo para ver qué criatura sale.',
        egg_joined: (name: string) => `¡${name} se ha unido a tu equipo!`,
        egg_continue: 'Continuar ➤',
        egg_error: 'No se pudo completar la eclosión. Inténtalo de nuevo.',
        egg_of: (name: string) => `Huevo de ${name}`,

        // --- Missions ---
        mission_title: {
            first_steps: 'Primeros pasos',
            seasoned_explorer: 'Explorador tenaz',
            rookie_bestiary: 'Bestiario novato',
            bestiary_hunter: 'Cazador de especies',
            first_fusion: 'Primera fusión',
            chimera_smith: 'Forjador quimérico',
            final_form: 'Forma definitiva',
            growing_team: 'Equipo en crecimiento',
        } as Record<string, string>,
        mission_desc: {
            first_steps: 'Completa 3 expediciones',
            seasoned_explorer: 'Completa 10 expediciones',
            rookie_bestiary: 'Descubre 5 especies',
            bestiary_hunter: 'Descubre 10 especies',
            first_fusion: 'Crea 1 Rekaimon de fusión',
            chimera_smith: 'Crea 3 Rekaimon de fusión',
            final_form: 'Consigue un Rekaimon en Stage 3',
            growing_team: 'Consigue 6 Rekaimon',
        } as Record<string, string>,

        // --- Breeding Screen ---
        breed_room: '🧬 Sala de Cría',
        breed_desc: (lvl: number) => `Selecciona dos Rekaimon para fusionar. Cada criatura solo puede criar una vez. Nivel mínimo: ${lvl}.`,
        breed_parent_a: 'Padre A',
        breed_parent_b: 'Padre B',
        breed_result_label: 'RESULTADO',
        breed_incompatible: 'Estos Rekaimon no son compatibles',
        breed_success: '🧬 ¡Fusión Exitosa!',
        breed_continue: 'Continuar',
        breed_not_available: 'No disponibles:',
        breed_already_bred: 'Ya crió',
        breed_needs_level: (lvl: number) => `Necesita Lv${lvl}`,
        breed_unavailable: 'No disponible',

        // --- Common ---
        common_back: '← Volver',
        common_max: 'MAX',

        // --- Content: Map Names ---
        map_name: { map1: 'Pradera Inicial', map2: 'Tierras Volcánicas', map3: 'Dominios Oscuros' } as Record<string, string>,
        map_desc: { map1: 'Tierras tranquilas para exploradores novatos.', map2: 'Volcanes y cumbres peligrosas.', map3: 'Solo los más fuertes se atreven a entrar.' } as Record<string, string>,

        // --- Content: Route Names ---
        route_name: {
            bosque: 'Bosque Susurrante', costa: 'Costa Bioluminiscente', volcan: 'Volcán Dormido',
            cumbres: 'Cumbres Ventosas', cripta: 'Cripta Olvidada', templo: 'Templo Solar',
            nexo: 'Nexo Elemental', pantano: 'Pantano Tóxico', forja: 'Forja Ancestral',
            glaciar: 'Cumbres Glaciares', abismo: 'Abismo Estelar', santuario: 'Santuario Caído',
        } as Record<string, string>,
        route_desc: {
            bosque: 'Un bosque tranquilo, ideal para empezar.',
            costa: 'Aguas brillantes con criaturas acuáticas.',
            volcan: 'Lava latente y mucho calor. Peligroso.',
            cumbres: 'Vientos cortantes en la cima del mundo.',
            cripta: 'Antigua cripta llena de sombras hostiles.',
            templo: 'Un templo sagrado bañado en luz eterna.',
            nexo: 'Donde todos los elementos convergen. Solo los más fuertes sobreviven.',
            pantano: 'Aguas corrosivas y criaturas venenosas.',
            forja: 'Una forja ardiente de tiempos olvidados.',
            glaciar: 'Picos helados donde el viento corta.',
            abismo: 'Un vacío sin fondo lleno de criaturas ancestrales.',
            santuario: 'Un santuario corrompido por la oscuridad.',
        } as Record<string, string>,

        // --- Content: Building Names ---
        building_name: {
            incubator: 'Incubadora', training: 'Campo de Entrenamiento',
            expeditions: 'Torre del Explorador', fusion: 'Cámara de Fusión',
            herbalist: 'Herbolario', mine: 'Mina de Cristales',
        } as Record<string, string>,
        building_desc: {
            incubator: 'Mejora la eclosión de huevos y reduce el coste de fragmentos.',
            training: 'Aumenta la XP ganada al entrenar y en expediciones.',
            expeditions: 'Mejora las expediciones: más rápidas y mejores recompensas.',
            fusion: 'Reduce los requisitos de fusión y mejora resultados.',
            herbalist: 'Curación más barata y potente para tus criaturas.',
            mine: 'Genera cristales pasivamente y mejora drops.',
        } as Record<string, string>,
        building_level: {
            incubator_1: 'Eclosión cuesta 1 fragmento menos',
            incubator_2: 'Eclosión cuesta 2 fragmentos menos',
            incubator_3: 'Eclosión gratuita',
            training_1: '+25% XP de entrenamiento y expediciones',
            training_2: '+50% XP de entrenamiento y expediciones',
            training_3: '+100% XP de entrenamiento y expediciones, -2 esencia coste',
            expeditions_1: 'Expediciones 15% más rápidas',
            expeditions_2: 'Expediciones 30% más rápidas',
            expeditions_3: 'Expediciones 50% más rápidas, +20% recursos',
            fusion_1: 'Fusión requiere 1 nivel menos',
            fusion_2: 'Fusión requiere 2 niveles menos',
            fusion_3: 'Fusión sin requisito de nivel',
            herbalist_1: 'Curar cuesta 1 hierba (en vez de 2)',
            herbalist_2: 'Mejora de tratamiento',
            herbalist_3: 'Auto-curación: criaturas se curan tras expedición',
            mine_1: '+1 cristal por expedición completada',
            mine_2: '+2 cristales por expedición',
            mine_3: '+3 cristales + mayor chance de huevo',
        } as Record<string, string>,

        // --- Eggs Inventory ---
        eggs_title: '🥚 Huevos',
        eggs_cost_desc: (cost: number) => `Necesitas ${cost === 0 ? 'Gratis' : `${cost} fragmentos`} para eclosionar un huevo.`,
        eggs_you_have: (n: number) => `Tienes: ${n} fragmentos.`,
        eggs_ready: '¡Listo!',
        eggs_empty: 'No tienes huevos. ¡Envía expediciones para encontrar!',
        eggs_see_routes: 'Ver Rutas',
        eggs_need_fragments: (n: number) => `Necesitas ${n} 🥚 fragmentos para eclosionar`,

        // --- Content: Element Names ---
        element_name: {
            fire: 'Fuego', water: 'Agua', earth: 'Tierra',
            air: 'Aire', shadow: 'Sombra', light: 'Luz', mixed: 'Mixto',
        } as Record<string, string>,
    },

    en: {
        // --- Navigation ---
        nav_hub: 'HUB',
        nav_routes: 'ROUTES',
        nav_eggs: 'EGGS',
        nav_breed: 'BREED',
        nav_progress: 'PROGRESS',
        nav_settings: 'SETTINGS',

        // --- Title Screen ---
        title_subtitle: 'Collect, breed and evolve elemental creatures. Send them on expeditions to earn resources and discover new eggs.',
        title_connect_hint: 'Connect your wallet to play onchain',
        title_connect_btn: '🔗 Connect Wallet',
        title_connecting: '⏳ Connecting...',
        title_powered_by: 'Powered by Cartridge Controller',
        title_wallet_connected: '✅ Wallet Connected',
        title_continue: '▶️ Continue Game',
        title_new_game: '🎮 New Game',
        title_creating: '⏳ Creating game...',
        title_stats: (c: number, e: number, x: number) => `🐾 ${c} creatures · 🥚 ${e} eggs · 🗺️ ${x} expeditions`,
        title_onchain: '⛓️ Onchain · Starknet · Dojo Engine',

        // --- Hub Screen ---
        hub_expedition_done: (n: number) => `${n} expedition${n > 1 ? 's' : ''} completed — Collect your rewards!`,
        hub_expedition_active: (n: number) => `${n} expedition${n > 1 ? 's' : ''} in progress`,
        hub_creatures_title: (n: number) => `Your Rekaimon (${n})`,
        hub_no_creatures: "You don't have any Rekaimon yet. Hatch an egg!",
        hub_eggs_title: (n: number) => `Eggs (${n})`,
        hub_egg_name: (name: string) => `${name} Egg`,
        hub_buildings: '🏗️ Buildings',
        hub_build: '🔨 Build',
        hub_upgrade: (lvl: number) => `🔨 Upgrade to Level ${lvl}`,
        hub_max_level: '⭐ Max level reached',
        hub_not_built: '🔒 Not built',
        hub_level: (n: number) => `Level ${n}`,
        hub_close: 'Close',
        hub_need_fragments: (n: number) => `You need ${n} 🥚 fragments to hatch`,
        hub_building_upgraded: 'Building upgraded!',
        hub_not_enough_resources: 'Not enough resources',

        // --- Settings ---
        settings_title: '⚙ Settings',
        settings_account: 'ACCOUNT',
        settings_language: 'LANGUAGE',
        settings_audio: 'AUDIO',
        settings_katana_dev: 'Katana (Dev)',
        settings_local_account: 'Local development account',
        settings_cartridge: 'Cartridge Controller',
        settings_production: 'Production account',
        settings_connected: '● Connected',
        settings_disconnected: '● Disconnected',
        settings_address: 'ADDRESS',
        settings_creatures: 'Creatures',
        settings_expeditions: 'Expeditions',
        settings_eggs_label: 'Eggs',
        settings_logout: '🚪 Log Out',
        settings_connect: '🔗 Connect',
        settings_network: 'NETWORK',
        settings_env: 'Environment',
        settings_development: 'Development',
        settings_production_env: 'Production',
        settings_node: 'Node',
        settings_local: 'Katana Local',
        settings_back: '← Back to Hub',
        settings_spanish: 'Español',
        settings_english: 'English',

        // --- Breeding ---
        breed_title: '🧬 Rekkaimon Fusion',
        breed_select_parent: (n: number) => `Select Parent ${n}`,
        breed_no_available: (lvl: number) => `No eligible creatures (Level ≥ ${lvl}, not bred)`,
        breed_fuse_btn: '🧬 Fuse!',
        breed_fusing: '⏳ Fusing...',
        breed_preview: 'Fusion preview',
        breed_result: '🎉 Fusion successful!',
        breed_new_creature: '← Back',
        breed_cannot: 'Cannot fuse',
        breed_min_level: (lvl: number) => `Minimum level: ${lvl}`,

        // --- Expeditions ---
        exp_your_expeditions: 'Your Expeditions',
        exp_no_active: 'No active expeditions.',
        exp_start_one: 'Send your creatures to explore!',
        exp_go_routes: '🗺️ Go to Routes',
        exp_active: 'Active',
        exp_completed: 'Completed',
        exp_time_left: 'Time remaining',
        exp_claim: '🎁 Claim Rewards',
        exp_claiming: '⏳ Claiming...',
        exp_back: '← Back',
        exp_rewards_title: '🎁 Rewards obtained!',
        exp_return_hub: 'Back to Hub',

        // --- Creature Detail ---
        detail_back: '← Back',
        detail_heal: '🌿 Heal',
        detail_healing: '⏳ Healing...',
        detail_train: '⚔️ Train',
        detail_training: '⏳ Training...',
        detail_boost: '⚡ Boost',
        detail_boosting: '⏳ Boosting...',
        detail_on_expedition: '🗺️ On expedition',
        detail_bred: '🧬 Already bred',
        detail_type: 'Type',
        detail_element: 'Element',
        detail_tier: 'Tier',
        detail_stage: 'Stage',
        detail_healed: 'Rekaimon healed!',
        detail_no_herbs: 'Not enough herbs',
        detail_trained: '+15 training XP',
        detail_no_essence: 'Not enough essence',
        detail_heal_cost: '🌿 Heal (2 Herbs)',
        detail_train_cost: '🔮 Train (5 Essence → +15 XP)',
        detail_total_power: 'Total power',
        detail_level: (n: number) => `Level ${n}`,
        detail_traits: 'TRAITS',
        detail_parents: 'PARENTS',
        detail_evolution: 'EVOLUTION',

        // --- Select Team ---
        team_title: 'Select team',
        team_start: '🚀 Start expedition!',
        team_starting: '⏳ Starting...',
        team_select_creatures: 'Select creatures for the expedition',
        team_select_desc: 'Select your team for this expedition (max 3).',
        team_advantage: 'Advantage',
        team_max_creatures: 'Max 3 creatures per expedition',
        team_no_available: 'No Rekaimon available',
        team_count: (n: number) => `Team: ${n}/3`,
        team_duration: 'Duration',
        team_send: '🚀 Send Expedition',
        team_started: 'Expedition started!',
        team_error: 'Error starting expedition',

        // --- Expedition Active ---
        exp_title: 'Expeditions',
        exp_completed_status: '✓ Expedition completed!',
        exp_no_active_desc: 'No active expeditions. Send your Rekaimon to explore!',
        exp_see_routes: 'See Routes',

        // --- Expedition Result ---
        result_title: '🏆 Expedition Result',
        result_opening: 'Opening rewards...',
        result_processing: 'Processing on blockchain',
        result_survivors: (n: number) => `SURVIVORS (${n})`,
        result_fainted: (n: number) => `FAINTED (${n})`,
        result_evolution: '⭐ EVOLUTION!',
        result_evolved: (name: string, stage: number) => `${name} evolved to Stage ${stage}!`,
        result_resources: 'RESOURCES OBTAINED',
        result_essence: 'Essence',
        result_herbs: 'Herbs',
        result_fragments: 'Fragments',
        result_crystals: 'Crystals',
        result_no_resources: 'No resources this time',
        result_egg_found: '🎉 EGG FOUND!',
        result_egg_of: (name: string) => `${name} Egg`,
        result_back_hub: 'Back to Hub',

        // --- Loading ---
        loading_data: 'Loading data...',
        loading_blockchain: 'Connecting to blockchain...',

        // --- Routes Screen ---
        routes_world_maps: '🗺️ World Maps',
        routes_count: (n: number) => `📍 ${n} routes`,
        routes_ready: (n: number) => `${n} expedition${n > 1 ? 's' : ''} completed — Collect!`,
        routes_completed_tap: '✓ Completed! Tap to collect',
        routes_ready_short: '✓ Ready!',
        routes_req: 'Req',
        routes_mixed: 'Mixed',

        // --- Collection / Progress ---
        collection_challenges: 'Challenges',
        collection_completed: 'Completed',
        collection_medals: 'Medals unlocked',
        collection_bestiary: 'Bestiary',
        collection_species: 'Species discovered',
        collection_entries: 'Entries discovered',

        // --- Egg Hatch ---
        egg_first_title: 'Your first Rekaimon!',
        egg_hatch_title: 'Egg Hatching!',
        egg_first_desc: 'Tap the egg to hatch your first companion.',
        egg_hatch_desc: 'Tap the egg to see what creature emerges.',
        egg_joined: (name: string) => `${name} has joined your team!`,
        egg_continue: 'Continue ➤',
        egg_error: 'Could not complete hatching. Try again.',
        egg_of: (name: string) => `${name} Egg`,

        // --- Missions ---
        mission_title: {
            first_steps: 'First Steps',
            seasoned_explorer: 'Seasoned Explorer',
            rookie_bestiary: 'Rookie Bestiary',
            bestiary_hunter: 'Species Hunter',
            first_fusion: 'First Fusion',
            chimera_smith: 'Chimera Smith',
            final_form: 'Final Form',
            growing_team: 'Growing Team',
        } as Record<string, string>,
        mission_desc: {
            first_steps: 'Complete 3 expeditions',
            seasoned_explorer: 'Complete 10 expeditions',
            rookie_bestiary: 'Discover 5 species',
            bestiary_hunter: 'Discover 10 species',
            first_fusion: 'Create 1 fusion Rekaimon',
            chimera_smith: 'Create 3 fusion Rekaimon',
            final_form: 'Get a Rekaimon to Stage 3',
            growing_team: 'Get 6 Rekaimon',
        } as Record<string, string>,

        // --- Breeding Screen ---
        breed_room: '🧬 Breeding Room',
        breed_desc: (lvl: number) => `Select two Rekaimon to fuse. Each creature can only breed once. Minimum level: ${lvl}.`,
        breed_parent_a: 'Parent A',
        breed_parent_b: 'Parent B',
        breed_result_label: 'RESULT',
        breed_incompatible: 'These Rekaimon are not compatible',
        breed_success: '🧬 Fusion Successful!',
        breed_continue: 'Continue',
        breed_not_available: 'Not available:',
        breed_already_bred: 'Already bred',
        breed_needs_level: (lvl: number) => `Needs Lv${lvl}`,
        breed_unavailable: 'Not available',

        // --- Common ---
        common_back: '← Back',
        common_max: 'MAX',

        // --- Content: Map Names ---
        map_name: { map1: 'Starter Meadow', map2: 'Volcanic Lands', map3: 'Dark Domains' } as Record<string, string>,
        map_desc: { map1: 'Calm lands for novice explorers.', map2: 'Volcanoes and dangerous peaks.', map3: 'Only the strongest dare to enter.' } as Record<string, string>,

        // --- Content: Route Names ---
        route_name: {
            bosque: 'Whispering Forest', costa: 'Bioluminescent Coast', volcan: 'Dormant Volcano',
            cumbres: 'Windy Peaks', cripta: 'Forgotten Crypt', templo: 'Solar Temple',
            nexo: 'Elemental Nexus', pantano: 'Toxic Swamp', forja: 'Ancestral Forge',
            glaciar: 'Glacial Peaks', abismo: 'Stellar Abyss', santuario: 'Fallen Sanctuary',
        } as Record<string, string>,
        route_desc: {
            bosque: 'A quiet forest, ideal for beginners.',
            costa: 'Shining waters with aquatic creatures.',
            volcan: 'Latent lava and intense heat. Dangerous.',
            cumbres: 'Cutting winds at the top of the world.',
            cripta: 'Ancient crypt full of hostile shadows.',
            templo: 'A sacred temple bathed in eternal light.',
            nexo: 'Where all elements converge. Only the strongest survive.',
            pantano: 'Corrosive waters and venomous creatures.',
            forja: 'A blazing forge from forgotten times.',
            glaciar: 'Frozen peaks where the wind cuts.',
            abismo: 'A bottomless void full of ancestral creatures.',
            santuario: 'A sanctuary corrupted by darkness.',
        } as Record<string, string>,

        // --- Content: Building Names ---
        building_name: {
            incubator: 'Incubator', training: 'Training Grounds',
            expeditions: 'Explorer Tower', fusion: 'Fusion Chamber',
            herbalist: 'Herbalist', mine: 'Crystal Mine',
        } as Record<string, string>,
        building_desc: {
            incubator: 'Improves egg hatching and reduces fragment cost.',
            training: 'Increases XP gained from training and expeditions.',
            expeditions: 'Improves expeditions: faster and better rewards.',
            fusion: 'Reduces fusion requirements and improves results.',
            herbalist: 'Cheaper and more potent healing for your creatures.',
            mine: 'Passively generates crystals and improves drops.',
        } as Record<string, string>,
        building_level: {
            incubator_1: 'Hatching costs 1 fewer fragment',
            incubator_2: 'Hatching costs 2 fewer fragments',
            incubator_3: 'Free hatching',
            training_1: '+25% training and expedition XP',
            training_2: '+50% training and expedition XP',
            training_3: '+100% training and expedition XP, -2 essence cost',
            expeditions_1: 'Expeditions 15% faster',
            expeditions_2: 'Expeditions 30% faster',
            expeditions_3: 'Expeditions 50% faster, +20% resources',
            fusion_1: 'Fusion requires 1 less level',
            fusion_2: 'Fusion requires 2 less levels',
            fusion_3: 'Fusion with no level requirement',
            herbalist_1: 'Heal costs 1 herb (instead of 2)',
            herbalist_2: 'Treatment upgrade',
            herbalist_3: 'Auto-heal: creatures heal after expedition',
            mine_1: '+1 crystal per completed expedition',
            mine_2: '+2 crystals per expedition',
            mine_3: '+3 crystals + higher egg chance',
        } as Record<string, string>,

        // --- Eggs Inventory ---
        eggs_title: '🥚 Eggs',
        eggs_cost_desc: (cost: number) => `You need ${cost === 0 ? 'Free' : `${cost} fragments`} to hatch an egg.`,
        eggs_you_have: (n: number) => `You have: ${n} fragments.`,
        eggs_ready: 'Ready!',
        eggs_empty: 'No eggs yet. Send expeditions to find some!',
        eggs_see_routes: 'See Routes',
        eggs_need_fragments: (n: number) => `You need ${n} 🥚 fragments to hatch`,

        // --- Content: Element Names ---
        element_name: {
            fire: 'Fire', water: 'Water', earth: 'Earth',
            air: 'Air', shadow: 'Shadow', light: 'Light', mixed: 'Mixed',
        } as Record<string, string>,
    },
} as const;

export type Translations = typeof translations.es;
