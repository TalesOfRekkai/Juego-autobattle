/* ============================================
   TYPES.TS — Shared TypeScript interfaces
   ============================================ */

export type ElementType = 'fire' | 'water' | 'earth' | 'air' | 'shadow' | 'light';
export type BodyType = 'quadruped' | 'serpentine' | 'avian' | 'biped' | 'insectoid' | 'amorphous';
export type TierType = 'common' | 'rare';
export type CreatureType = 'base' | 'fusion';

export interface Stats {
    hp: number;
    atk: number;
    def: number;
    spd: number;
}

export interface CreatureTemplate {
    name: string;
    stage: number;
    element: ElementType;
    bodyType: BodyType;
    traits: string[];
    type: CreatureType;
    tier: TierType;
    parentA?: string;
    parentB?: string;
}

export interface Creature {
    id: number;
    name: string;
    element: ElementType;
    bodyType: BodyType;
    traits: string[];
    type: CreatureType;
    tier: TierType;
    stage: number;
    level: number;
    xp: number;
    hasBred: boolean;
    isOnExpedition: boolean;
    currentHP: number;
    parentA: string | null;
    parentB: string | null;
}

export interface Egg {
    name: string;
    id: number;
}

export interface ResourceInventory {
    essence: number;
    herbs: number;
    eggFragments: number;
    crystals: number;
}

export interface RouteRequirement {
    minLevel: number;
    minCreatures: number;
}

export interface RouteRewards {
    essence: [number, number];
    herbs: [number, number];
    eggFragments: [number, number];
    crystals: [number, number];
}

export interface RouteDef {
    id: string;
    name: string;
    icon: string;
    element: ElementType | 'mixed';
    difficulty: number;
    stars: string;
    duration: number;
    requirement: RouteRequirement | null;
    mapPos: { x: number; y: number };
    rewards: RouteRewards;
    eggChance: number;
    xpReward: [number, number];
    enemyPower: number;
    description: string;
}

export interface Expedition {
    id: number;
    routeId: string;
    creatureIds: number[];
    startTime: number;
    duration: number;
    resolved: boolean;
}

export interface ExpeditionResult {
    survived: Creature[];
    fainted: Creature[];
    resources: ResourceInventory;
    xpPerCreature: number;
    foundEgg: string | null;
    evolutions: { name: string; newStage: number }[];
}

export interface ElementInfo {
    icon: string;
    name: string;
    color: string;
}

export interface SlotInfo {
    index: number;
    name?: string;
    creatures?: number;
    maxLevel?: number;
    totalExpeditions?: number;
    lastSaved?: number;
    empty: boolean;
}

export interface GameState {
    phase: string;
    creatures: Creature[];
    eggs: Egg[];
    resources: ResourceInventory;
    expeditions: Expedition[];
    discoveredNames: string[];
    discoveredKeys: string[];
    totalExpeditions: number;
    tutorialDone: boolean;
    slotName?: string;
    createdAt?: number;
    lastSaved?: number;
}
