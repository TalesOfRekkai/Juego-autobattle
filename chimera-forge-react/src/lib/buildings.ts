/* ============================================
   BUILDINGS.TS — Hub building definitions & buff system
   
   Buildings are upgradable structures in the Hub that
   provide passive buffs across different game systems.
   Each building has 3 upgrade levels (0 = not built, 1–3).
   ============================================ */

import { FRAGMENTS_PER_HATCH } from './resources';

export interface BuildingDef {
    id: string;
    name: string;
    icon: string;
    description: string;
    /** Buff descriptions per level (index 0 = level 1, etc.) */
    levels: {
        description: string;
        /** Cost to build/upgrade to this level */
        cost: { essence?: number; crystals?: number; herbs?: number };
    }[];
}

/** All building types and their properties */
export const BUILDING_DEFS: BuildingDef[] = [
    {
        id: 'incubator',
        name: 'Incubadora',
        icon: '🥚',
        description: 'Mejora la eclosión de huevos y reduce el coste de fragmentos.',
        levels: [
            { description: 'Eclosión cuesta 1 fragmento menos', cost: { essence: 20, crystals: 2 } },
            { description: 'Eclosión cuesta 2 fragmentos menos', cost: { essence: 50, crystals: 5 } },
            { description: 'Eclosión gratuita', cost: { essence: 100, crystals: 10 } },
        ],
    },
    {
        id: 'training',
        name: 'Campo de Entrenamiento',
        icon: '⚔️',
        description: 'Aumenta la XP ganada al entrenar y en expediciones.',
        levels: [
            { description: '+25% XP al entrenar', cost: { essence: 15, crystals: 1 } },
            { description: '+50% XP al entrenar', cost: { essence: 40, crystals: 4 } },
            { description: '+100% XP al entrenar, -2 esencia coste', cost: { essence: 80, crystals: 8 } },
        ],
    },
    {
        id: 'expeditions',
        name: 'Torre del Explorador',
        icon: '🗼',
        description: 'Mejora las expediciones: más rápidas y mejores recompensas.',
        levels: [
            { description: 'Expediciones 15% más rápidas', cost: { essence: 25, crystals: 2 } },
            { description: 'Expediciones 30% más rápidas', cost: { essence: 60, crystals: 6 } },
            { description: 'Expediciones 50% más rápidas, +20% recursos', cost: { essence: 120, crystals: 12 } },
        ],
    },
    {
        id: 'fusion',
        name: 'Cámara de Fusión',
        icon: '🔮',
        description: 'Reduce los requisitos de fusión y mejora resultados.',
        levels: [
            { description: 'Fusión requiere 1 nivel menos', cost: { essence: 30, crystals: 3 } },
            { description: 'Fusión requiere 2 niveles menos', cost: { essence: 70, crystals: 7 } },
            { description: 'Fusión sin requisito de nivel', cost: { essence: 140, crystals: 15 } },
        ],
    },
    {
        id: 'herbalist',
        name: 'Herbolario',
        icon: '🌿',
        description: 'Curación más barata y potente para tus criaturas.',
        levels: [
            { description: 'Curar cuesta 1 hierba (en vez de 2)', cost: { essence: 15, herbs: 10 } },
            { description: 'Mejora de tratamiento (sin efecto adicional en esta versión)', cost: { essence: 35, herbs: 20, crystals: 3 } },
            { description: 'Auto-curación: criaturas se curan tras expedición', cost: { essence: 75, herbs: 30, crystals: 6 } },
        ],
    },
    {
        id: 'mine',
        name: 'Mina de Cristales',
        icon: '💎',
        description: 'Genera cristales pasivamente y mejora drops.',
        levels: [
            { description: '+1 cristal por expedición completada', cost: { essence: 30, herbs: 10 } },
            { description: '+2 cristales por expedición', cost: { essence: 60, crystals: 5 } },
            { description: '+3 cristales + mayor chance de huevo', cost: { essence: 120, crystals: 10 } },
        ],
    },
];

/** Default buildings state — all at level 0 (not built) */
export interface BuildingsState {
    incubator: number;
    training: number;
    expeditions: number;
    fusion: number;
    herbalist: number;
    mine: number;
}

export function createDefaultBuildings(): BuildingsState {
    return {
        incubator: 0,
        training: 0,
        expeditions: 0,
        fusion: 0,
        herbalist: 0,
        mine: 0,
    };
}

/** Get a building definition by its id */
export function getBuildingDef(id: string): BuildingDef | undefined {
    return BUILDING_DEFS.find(b => b.id === id);
}

export function getEffectiveHatchFragmentCost(buildings: BuildingsState): number {
    if (buildings.incubator >= 3) return 0;
    return Math.max(0, FRAGMENTS_PER_HATCH - buildings.incubator);
}

export function getEffectiveBreedMinLevel(buildings: BuildingsState): number {
    if (buildings.fusion >= 3) return 0;
    return Math.max(0, 5 - buildings.fusion);
}

/** Get the current buff values for a given building level */
export function getBuildingBuffs(buildings: BuildingsState) {
    return {
        /** How many fewer fragments egg hatching costs (0, 1, 2, or Infinity for free) */
        hatchFragmentDiscount: buildings.incubator >= 3 ? Infinity : buildings.incubator,

        /** XP multiplier bonus from training building (1.0 = no bonus) */
        trainingXPMultiplier: buildings.training === 0 ? 1.0
            : buildings.training === 1 ? 1.25
                : buildings.training === 2 ? 1.5
                    : 2.0,

        /** Essence cost reduction for training */
        trainingEssenceDiscount: buildings.training >= 3 ? 2 : 0,

        /** Expedition speed multiplier (1.0 = normal, 0.5 = 50% faster) */
        expeditionSpeedMultiplier: buildings.expeditions === 0 ? 1.0
            : buildings.expeditions === 1 ? 0.85
                : buildings.expeditions === 2 ? 0.70
                    : 0.50,

        /** Expedition resource bonus multiplier */
        expeditionResourceMultiplier: buildings.expeditions >= 3 ? 1.2 : 1.0,

        /** Fusion level requirement reduction */
        fusionLevelReduction: buildings.fusion >= 3 ? Infinity : buildings.fusion,

        /** Herb cost for healing */
        healHerbCost: buildings.herbalist >= 1 ? 1 : 2,

        /** Whether healing restores 100% HP */
        healFullHP: buildings.herbalist >= 2,

        /** Whether auto-heal after expedition is active */
        autoHealAfterExpedition: buildings.herbalist >= 3,

        /** Bonus crystals per expedition */
        bonusCrystalsPerExpedition: buildings.mine >= 3 ? 3
            : buildings.mine >= 2 ? 2
                : buildings.mine >= 1 ? 1
                    : 0,

        /** Bonus egg chance from mine */
        bonusEggChance: buildings.mine >= 3 ? 0.05 : 0,
    };
}
