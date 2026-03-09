/* ============================================
   ROUTES.TS — Route definitions, expedition logic
   ============================================ */

import type { Creature, ExpeditionResult, RouteDef } from '../types';
import * as Data from './data';
import * as Creatures from './creatures';

export interface MapDef {
    id: string;
    name: string;
    image: string;
    description: string;
    difficulty: string;
}

export const MAP_DEFS: MapDef[] = [
    { id: 'map1', name: 'Pradera Inicial', image: '/Assets def/MAPANEW2.png', description: 'Tierras tranquilas para exploradores novatos.', difficulty: '★☆☆☆' },
    { id: 'map2', name: 'Tierras Volcánicas', image: '/Assets def/MAPANEW1.png', description: 'Volcanes y cumbres peligrosas.', difficulty: '★★★☆' },
    { id: 'map3', name: 'Dominios Oscuros', image: '/Assets def/MAPANEW3.png', description: 'Solo los más fuertes se atreven a entrar.', difficulty: '★★★★' },
];

export const ROUTE_DEFS: RouteDef[] = [
    // === MAP 1: Pradera Inicial ===
    {
        id: 'bosque', name: 'Bosque Susurrante', icon: '🌲', element: 'earth',
        difficulty: 1, stars: '★☆☆☆', duration: 30, requirement: null,
        mapId: 'map1', mapPos: { x: 30, y: 45 },
        rewards: { essence: [2, 5], herbs: [1, 3], eggFragments: [0, 2], crystals: [0, 0] },
        eggChance: 0.08, xpReward: [8, 15], enemyPower: 20,
        description: 'Un bosque tranquilo, ideal para empezar.',
        routeModifiers: { resourceMultiplier: 1.25 },
    },
    {
        id: 'costa', name: 'Costa Bioluminiscente', icon: '🌊', element: 'water',
        difficulty: 1, stars: '★☆☆☆', duration: 30, requirement: null,
        mapId: 'map1', mapPos: { x: 25, y: 77 },
        rewards: { essence: [2, 5], herbs: [1, 3], eggFragments: [0, 2], crystals: [0, 0] },
        eggChance: 0.08, xpReward: [8, 15], enemyPower: 22,
        description: 'Aguas brillantes con criaturas acuáticas.',
        routeModifiers: { eggChanceMultiplier: 1.35 },
    },
    {
        id: 'volcan', name: 'Volcán Dormido', icon: '🌋', element: 'fire',
        difficulty: 2, stars: '★★☆☆', duration: 60,
        requirement: { minLevel: 3, minCreatures: 1 },
        mapId: 'map1', mapPos: { x: 48, y: 70 },
        rewards: { essence: [4, 10], herbs: [1, 4], eggFragments: [1, 4], crystals: [0, 1] },
        eggChance: 0.12, xpReward: [15, 30], enemyPower: 45,
        description: 'Lava latente y mucho calor. Peligroso.',
        routeModifiers: { crystalMultiplier: 1.5, survivalBonus: -0.05 },
    },
    {
        id: 'cumbres', name: 'Cumbres Ventosas', icon: '⛰️', element: 'air',
        difficulty: 2, stars: '★★☆☆', duration: 60,
        requirement: { minLevel: 3, minCreatures: 1 },
        mapId: 'map1', mapPos: { x: 75, y: 55 },
        rewards: { essence: [4, 10], herbs: [1, 4], eggFragments: [1, 4], crystals: [0, 1] },
        eggChance: 0.12, xpReward: [15, 30], enemyPower: 48,
        description: 'Vientos cortantes en la cima del mundo.',
        routeModifiers: { xpMultiplier: 1.25 },
    },
    {
        id: 'cripta', name: 'Cripta Olvidada', icon: '💀', element: 'shadow',
        difficulty: 3, stars: '★★★☆', duration: 120,
        requirement: { minLevel: 5, minCreatures: 2 },
        mapId: 'map1', mapPos: { x: 78, y: 33 },
        rewards: { essence: [8, 18], herbs: [2, 6], eggFragments: [2, 6], crystals: [1, 3] },
        eggChance: 0.18, xpReward: [30, 55], enemyPower: 80,
        description: 'Antigua cripta llena de sombras hostiles.',
        routeModifiers: { crystalMultiplier: 1.6 },
    },
    {
        id: 'templo', name: 'Templo Solar', icon: '☀️', element: 'light',
        difficulty: 3, stars: '★★★☆', duration: 120,
        requirement: { minLevel: 5, minCreatures: 2 },
        mapId: 'map1', mapPos: { x: 50, y: 33 },
        rewards: { essence: [8, 18], herbs: [2, 6], eggFragments: [2, 6], crystals: [1, 3] },
        eggChance: 0.18, xpReward: [30, 55], enemyPower: 85,
        description: 'Un templo sagrado bañado en luz eterna.',
        routeModifiers: { survivalBonus: 0.08 },
    },
    {
        id: 'nexo', name: 'Nexo Elemental', icon: '🌀', element: 'mixed',
        difficulty: 4, stars: '★★★★', duration: 180,
        requirement: { minLevel: 10, minCreatures: 3 },
        mapId: 'map1', mapPos: { x: 50, y: 50 },
        rewards: { essence: [15, 30], herbs: [4, 10], eggFragments: [4, 10], crystals: [3, 6] },
        eggChance: 0.25, xpReward: [55, 100], enemyPower: 150,
        description: 'Donde todos los elementos convergen. Solo los más fuertes sobreviven.',
        routeModifiers: { resourceMultiplier: 1.3, xpMultiplier: 1.2, survivalBonus: -0.08 },
    },

    // === MAP 2: Tierras Volcánicas ===
    {
        id: 'pantano', name: 'Pantano Tóxico', icon: '🐊', element: 'water',
        difficulty: 2, stars: '★★☆☆', duration: 45,
        requirement: { minLevel: 4, minCreatures: 1 },
        mapId: 'map2', mapPos: { x: 25, y: 85 },
        rewards: { essence: [5, 12], herbs: [2, 5], eggFragments: [1, 3], crystals: [0, 1] },
        eggChance: 0.12, xpReward: [18, 35], enemyPower: 50,
        description: 'Aguas corrosivas y criaturas venenosas.',
        routeModifiers: { resourceMultiplier: 1.15, survivalBonus: -0.03 },
    },
    {
        id: 'forja', name: 'Forja Ancestral', icon: '⚒️', element: 'fire',
        difficulty: 3, stars: '★★★☆', duration: 90,
        requirement: { minLevel: 6, minCreatures: 2 },
        mapId: 'map2', mapPos: { x: 65, y: 45 },
        rewards: { essence: [8, 20], herbs: [2, 5], eggFragments: [2, 5], crystals: [1, 4] },
        eggChance: 0.15, xpReward: [25, 50], enemyPower: 75,
        description: 'Una forja ardiente de tiempos olvidados.',
        routeModifiers: { crystalMultiplier: 1.4 },
    },
    {
        id: 'glaciar', name: 'Cumbres Glaciares', icon: '❄️', element: 'air',
        difficulty: 3, stars: '★★★☆', duration: 100,
        requirement: { minLevel: 7, minCreatures: 2 },
        mapId: 'map2', mapPos: { x: 50, y: 70 },
        rewards: { essence: [10, 22], herbs: [3, 7], eggFragments: [3, 6], crystals: [2, 4] },
        eggChance: 0.18, xpReward: [35, 60], enemyPower: 90,
        description: 'Picos helados donde el viento corta.',
        routeModifiers: { xpMultiplier: 1.2, survivalBonus: 0.05 },
    },

    // === MAP 3: Dominios Oscuros ===
    {
        id: 'abismo', name: 'Abismo Estelar', icon: '🌌', element: 'shadow',
        difficulty: 4, stars: '★★★★', duration: 150,
        requirement: { minLevel: 8, minCreatures: 2 },
        mapId: 'map3', mapPos: { x: 15, y: 40 },
        rewards: { essence: [12, 28], herbs: [3, 8], eggFragments: [3, 8], crystals: [2, 5] },
        eggChance: 0.20, xpReward: [45, 85], enemyPower: 120,
        description: 'Un vacío sin fondo lleno de criaturas ancestrales.',
        routeModifiers: { crystalMultiplier: 1.5, survivalBonus: -0.05 },
    },
    {
        id: 'santuario', name: 'Santuario Caído', icon: '🏛️', element: 'light',
        difficulty: 4, stars: '★★★★', duration: 150,
        requirement: { minLevel: 9, minCreatures: 2 },
        mapId: 'map3', mapPos: { x: 65, y: 55 },
        rewards: { essence: [14, 30], herbs: [4, 9], eggFragments: [4, 9], crystals: [3, 6] },
        eggChance: 0.22, xpReward: [50, 90], enemyPower: 135,
        description: 'Un santuario corrompido por la oscuridad.',
        routeModifiers: { eggChanceMultiplier: 1.35, survivalBonus: 0.08 },
    },
    {
        id: 'nexo_final', name: 'Nexo Primordial', icon: '💫', element: 'mixed',
        difficulty: 5, stars: '★★★★★', duration: 240,
        requirement: { minLevel: 12, minCreatures: 3 },
        mapId: 'map3', mapPos: { x: 50, y: 30 },
        rewards: { essence: [20, 40], herbs: [5, 12], eggFragments: [5, 12], crystals: [4, 8] },
        eggChance: 0.30, xpReward: [70, 120], enemyPower: 200,
        description: 'El origen de todo. La prueba definitiva.',
        routeModifiers: { xpMultiplier: 1.25, eggChanceMultiplier: 1.2 },
    },
];

const ROUTE_MODIFIER_LABELS: Record<string, string> = {
    bosque: 'Abundancia natural (+25% recursos)',
    costa: 'Fauna mágica (+35% huevos)',
    volcan: 'Minerales raros (+50% cristales, -5% supervivencia)',
    cumbres: 'Vientos de aprendizaje (+25% XP)',
    templo: 'Energía sagrada (+8% supervivencia)',
    cripta: 'Tesoros antiguos (+60% cristales)',
    nexo: 'Caos elemental (+30% recursos, +20% XP, -8% supervivencia)',
    pantano: 'Terreno hostil (+15% recursos, -3% supervivencia)',
    forja: 'Menas ancestrales (+40% cristales)',
    glaciar: 'Corrientes veloces (+20% XP, +5% supervivencia)',
    abismo: 'Ecos sombríos (+50% cristales, -5% supervivencia)',
    santuario: 'Bendición lunar (+35% huevos, +8% supervivencia)',
    nexo_final: 'Convergencia arcana (+25% XP, +20% huevos)',
};

export function getRoute(id: string): RouteDef | undefined {
    return ROUTE_DEFS.find(r => r.id === id);
}

export function getAllRoutes(): RouteDef[] {
    return ROUTE_DEFS;
}

export function getRouteModifierLabel(routeId: string): string | null {
    return ROUTE_MODIFIER_LABELS[routeId] ?? null;
}

export function canAccessRoute(route: RouteDef, playerCreatures: Creature[]): boolean {
    if (!route.requirement) return true;
    const available = playerCreatures.filter(c => !c.isOnExpedition);
    const req = route.requirement;
    const qualifying = available.filter(c => c.level >= req.minLevel);
    return qualifying.length >= req.minCreatures;
}

function randRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function resolveExpedition(
    route: RouteDef,
    team: Creature[],
    buffs?: { expeditionResourceMultiplier?: number; bonusCrystalsPerExpedition?: number; bonusEggChance?: number }
): ExpeditionResult {
    const routeMods = route.routeModifiers;
    const elementBonus = team.some(c =>
        route.element !== 'mixed' && Data.hasElementAdvantage(c.element, route.element)
    ) ? 1.3 : (team.some(c => c.element === route.element) ? 1.15 : 1.0);

    const results: ExpeditionResult = {
        survived: [],
        fainted: [],
        resources: { essence: 0, herbs: 0, eggFragments: 0, crystals: 0 },
        xpPerCreature: 0,
        foundEgg: null,
        evolutions: [],
    };

    // Each creature has individual survival chance
    team.forEach(c => {
        const baseSurvival = Creatures.getPower(c) * elementBonus / route.enemyPower;
        const individualSurvival = Math.max(0.05, Math.min(0.95, baseSurvival + (routeMods?.survivalBonus ?? 0)));
        if (Math.random() < individualSurvival) {
            results.survived.push(c);
        } else {
            results.fainted.push(c);
            c.currentHP = 0;
        }
    });

    const survivalRatio = results.survived.length / team.length;
    const resMult = buffs?.expeditionResourceMultiplier ?? 1.0;
    const r = route.rewards;
    results.resources.essence = Math.floor(randRange(r.essence[0], r.essence[1]) * survivalRatio * resMult);
    results.resources.herbs = Math.floor(randRange(r.herbs[0], r.herbs[1]) * survivalRatio * resMult);
    results.resources.eggFragments = Math.floor(randRange(r.eggFragments[0], r.eggFragments[1]) * survivalRatio * resMult);
    results.resources.crystals = Math.floor(randRange(r.crystals[0], r.crystals[1]) * survivalRatio * resMult)
        + (buffs?.bonusCrystalsPerExpedition ?? 0);

    results.xpPerCreature = randRange(route.xpReward[0], route.xpReward[1]);

    if (routeMods?.resourceMultiplier) {
        results.resources.essence = Math.floor(results.resources.essence * routeMods.resourceMultiplier);
        results.resources.herbs = Math.floor(results.resources.herbs * routeMods.resourceMultiplier);
        results.resources.eggFragments = Math.floor(results.resources.eggFragments * routeMods.resourceMultiplier);
    }

    if (routeMods?.crystalMultiplier) {
        results.resources.crystals = Math.floor(results.resources.crystals * routeMods.crystalMultiplier);
    }

    if (routeMods?.xpMultiplier) {
        results.xpPerCreature = Math.floor(results.xpPerCreature * routeMods.xpMultiplier);
    }

    results.resources.essence = Math.max(0, results.resources.essence);
    results.resources.herbs = Math.max(0, results.resources.herbs);
    results.resources.eggFragments = Math.max(0, results.resources.eggFragments);
    results.resources.crystals = Math.max(0, results.resources.crystals);
    results.xpPerCreature = Math.max(0, results.xpPerCreature);

    const eggChanceMult = routeMods?.eggChanceMultiplier ?? 1;
    const totalEggChance = Math.min(0.99, Math.max(0, (route.eggChance + (buffs?.bonusEggChance ?? 0)) * eggChanceMult));
    if (Math.random() < totalEggChance * survivalRatio) {
        const randomBase = Data.BASE_CREATURES[Math.floor(Math.random() * Data.BASE_CREATURES.length)];
        results.foundEgg = randomBase;
    }

    return results;
}
