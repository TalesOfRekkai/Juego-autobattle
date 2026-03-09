/* ============================================
   DOJO GAME STORE — Drop-in replacement for gameStore.ts
   
   Routes all mutations through onchain contract calls.
   Reads state from Torii via useOnchainState hook.
   Screens that use useGameStore keep working.
   ============================================ */

import { create } from 'zustand';
import type { Creature, Expedition, GameState } from '../types';
import * as Data from '../lib/data';
import * as Creatures from '../lib/creatures';
import * as Resources from '../lib/resources';
import * as RoutesLib from '../lib/routes';
import { createDefaultBuildings, BUILDING_DEFS } from '../lib/buildings';
import { useToastStore } from './toastStore';
import {
    callNewGame, callHatchEgg, callHealCreature,
    callBoostCreature, callBreed, callUpgradeBuilding,
    callStartExpedition, callResolveExpedition,
} from '../dojo/contractCalls';
import type { Call } from 'starknet';

// ---- Store Interface ----
// Kept as close to the original as possible so screens don't need changes

interface GameStore {
    // Connection state (any type for account to avoid starknet version conflicts)
    account: any;
    address: string | null;
    isConnected: boolean;
    isPending: boolean;
    setAccount: (account: any, address: string | null) => void;
    execute: ((calls: Call | Call[]) => Promise<string>) | null;
    setExecute: (fn: ((calls: Call | Call[]) => Promise<string>) | null) => void;

    // Game state (populated from Torii)
    state: GameState;
    setState: (state: GameState) => void;
    dataLoaded: boolean;

    // Init
    initData: () => Promise<void>;

    // Read-only computed getters
    getCreatureById: (id: number) => Creature | undefined;
    getAvailableCreatures: () => Creature[];
    getActiveExpeditions: () => Expedition[];
    getCompletedExpeditions: () => Expedition[];
    getExpeditionTimeLeft: (expedition: Expedition) => number;

    // Onchain mutations (async, call contracts)
    startNewGameOnchain: () => Promise<boolean>;
    hatchEggOnchain: (eggId: number) => Promise<Creature | null>;
    healCreatureOnchain: (creatureId: number) => Promise<boolean>;
    boostCreatureOnchain: (creatureId: number) => Promise<boolean>;
    breedOnchain: (creatureAId: number, creatureBId: number) => Promise<boolean>;
    upgradeBuildingOnchain: (buildingId: string) => Promise<boolean>;
    startExpeditionOnchain: (routeId: string, creatureIds: number[]) => Promise<boolean>;
    resolveExpeditionOnchain: (expeditionId: number) => Promise<boolean>;

    // Backward-compatible aliases (screens call these old names)
    upgradeBuilding: (buildingId: string) => boolean;
    hatchEgg: (eggIndex: number, isFirst?: boolean) => Creature | null;
    healCreature: (creatureId: number) => boolean;
    boostCreature: (creatureId: number) => boolean;
    startExpedition: (routeId: string, creatureIds: number[]) => boolean;
    resolveExpedition: (expeditionId: number) => boolean;
    addCreature: (creature: Creature) => void;
    startNewGame: (slotIndex?: number) => string;
    getAllSlots: () => any[];
    save: () => void;
    loadSlot: (index: number) => boolean;
    deleteSlot: (index: number) => void;
    activeSlot: number;
    tickExpeditions: () => void;
}

function createDefaultState(): GameState {
    return {
        phase: 'title',
        creatures: [],
        eggs: [],
        resources: Resources.createInventory(),
        expeditions: [],
        discoveredNames: [],
        discoveredKeys: [],
        totalExpeditions: 0,
        completedExpeditions: 0,
        completedMissionIds: [],
        earnedMedals: [],
        tutorialDone: false,
        buildings: createDefaultBuildings(),
    };
}

// Building ID string → u8 mapping
const BUILDING_ID_MAP: Record<string, number> = {
    incubator: 0,
    training: 1,
    expeditions: 2,
    fusion: 3,
    herbalist: 4,
    mine: 5,
};

// Element string → u8 mapping
const ELEMENT_TO_U8: Record<string, number> = {
    fire: 0, water: 1, earth: 2, air: 3, shadow: 4, light: 5,
};

// BodyType string → u8 mapping
const BODY_TO_U8: Record<string, number> = {
    quadruped: 0, serpentine: 1, avian: 2, biped: 3, insectoid: 4, amorphous: 5,
};

export const useGameStore = create<GameStore>((set, get) => ({
    // Connection
    account: null,
    address: null,
    isConnected: false,
    isPending: false,
    execute: null,

    setAccount: (account, address) => set({
        account,
        address,
        isConnected: !!account,
    }),

    setExecute: (fn) => set({ execute: fn }),

    // State
    state: createDefaultState(),
    dataLoaded: false,

    setState: (state) => set({ state }),

    initData: async () => {
        await Data.loadCreatureData();
        set({ dataLoaded: true });
    },

    // ---- Read-only getters (same as before) ----

    getCreatureById: (id) => get().state.creatures.find(c => c.id === id),

    getAvailableCreatures: () => get().state.creatures.filter(c => !c.isOnExpedition),

    getActiveExpeditions: () => {
        const now = Date.now();
        return get().state.expeditions.filter(e => !e.resolved && now < e.startTime + e.duration);
    },

    getCompletedExpeditions: () => {
        const now = Date.now();
        return get().state.expeditions.filter(e => !e.resolved && now >= e.startTime + e.duration);
    },

    getExpeditionTimeLeft: (expedition) => {
        const now = Date.now();
        const end = expedition.startTime + expedition.duration;
        return Math.max(0, end - now);
    },

    // ---- Onchain mutations ----

    startNewGameOnchain: async () => {
        const { execute } = get();
        if (!execute) return false;
        try {
            set({ isPending: true });
            await execute(callNewGame());
            useToastStore.getState().addToast('¡Nueva partida iniciada!', 'success');
            return true;
        } catch (error: any) {
            console.error('new_game failed:', error);
            useToastStore.getState().addToast('Error al iniciar partida', 'error');
            return false;
        } finally {
            set({ isPending: false });
        }
    },

    hatchEggOnchain: async (eggId) => {
        const { execute, state } = get();
        if (!execute) return null;
        const egg = state.eggs.find(e => e.id === eggId);
        if (!egg) return null;
        try {
            set({ isPending: true });
            await execute(callHatchEgg(eggId));
            // Create a local creature object for immediate UI feedback
            const creature = Creatures.createCreature(egg.name);
            useToastStore.getState().addToast(`¡${egg.name} eclosionó!`, 'success');
            return creature;
        } catch (error: any) {
            console.error('hatch_egg failed:', error);
            useToastStore.getState().addToast('Error al eclosionar', 'error');
            return null;
        } finally {
            set({ isPending: false });
        }
    },

    healCreatureOnchain: async (creatureId) => {
        const { execute } = get();
        if (!execute) return false;
        try {
            set({ isPending: true });
            await execute(callHealCreature(creatureId));
            return true;
        } catch (error: any) {
            console.error('heal_creature failed:', error);
            useToastStore.getState().addToast('Error al curar', 'error');
            return false;
        } finally {
            set({ isPending: false });
        }
    },

    boostCreatureOnchain: async (creatureId) => {
        const { execute } = get();
        if (!execute) return false;
        try {
            set({ isPending: true });
            await execute(callBoostCreature(creatureId));
            return true;
        } catch (error: any) {
            console.error('boost_creature failed:', error);
            useToastStore.getState().addToast('Error al entrenar', 'error');
            return false;
        } finally {
            set({ isPending: false });
        }
    },

    breedOnchain: async (creatureAId, creatureBId) => {
        const { execute, state } = get();
        if (!execute) return false;
        const creatureA = state.creatures.find(c => c.id === creatureAId);
        const creatureB = state.creatures.find(c => c.id === creatureBId);
        if (!creatureA || !creatureB) return false;

        // Determine fusion result from Data module
        const fusionTemplate = Data.getFusionResult(creatureA.name, creatureB.name);
        if (!fusionTemplate) {
            useToastStore.getState().addToast('No hay fusión disponible', 'error');
            return false;
        }

        try {
            set({ isPending: true });
            await execute(callBreed(
                creatureAId,
                creatureBId,
                fusionTemplate.name,
                ELEMENT_TO_U8[fusionTemplate.element] ?? 0,
                BODY_TO_U8[fusionTemplate.bodyType] ?? 0,
            ));
            useToastStore.getState().addToast(`¡${fusionTemplate.name} creado por fusión!`, 'success');
            return true;
        } catch (error: any) {
            console.error('breed failed:', error);
            useToastStore.getState().addToast('Error en la fusión', 'error');
            return false;
        } finally {
            set({ isPending: false });
        }
    },

    upgradeBuildingOnchain: async (buildingId) => {
        const { execute } = get();
        if (!execute) return false;
        const buildingU8 = BUILDING_ID_MAP[buildingId] ?? 0;
        try {
            set({ isPending: true });
            await execute(callUpgradeBuilding(buildingU8));
            return true;
        } catch (error: any) {
            console.error('upgrade_building failed:', error);
            useToastStore.getState().addToast('Error al mejorar edificio', 'error');
            return false;
        } finally {
            set({ isPending: false });
        }
    },

    startExpeditionOnchain: async (routeId, creatureIds) => {
        const { execute } = get();
        if (!execute) return false;
        const route = RoutesLib.getRoute(routeId);
        if (!route) return false;
        try {
            set({ isPending: true });
            await execute(callStartExpedition(routeId, creatureIds, route.duration));
            return true;
        } catch (error: any) {
            console.error('start_expedition failed:', error);
            useToastStore.getState().addToast('Error al iniciar expedición', 'error');
            return false;
        } finally {
            set({ isPending: false });
        }
    },

    resolveExpeditionOnchain: async (expeditionId) => {
        const { execute } = get();
        if (!execute) return false;
        try {
            set({ isPending: true });
            await execute(callResolveExpedition(expeditionId));
            useToastStore.getState().addToast('¡Expedición completada!', 'success');
            return true;
        } catch (error: any) {
            console.error('resolve_expedition failed:', error);
            useToastStore.getState().addToast('Error al resolver expedición', 'error');
            return false;
        } finally {
            set({ isPending: false });
        }
    },

    // ---- Backward-compatible aliases ----
    // Check resources client-side first, then fire onchain call.

    upgradeBuilding: (buildingId: string) => {
        const { state } = get();
        // Look up building def and current level to check costs
        const def = BUILDING_DEFS.find(b => b.id === buildingId);
        const currentLevel = (state.buildings as any)?.[buildingId] || 0;
        if (!def || currentLevel >= def.levels.length) return false; // max level
        const cost = def.levels[currentLevel].cost;
        if ((cost.essence || 0) > state.resources.essence) return false;
        if ((cost.crystals || 0) > state.resources.crystals) return false;
        if ((cost.herbs || 0) > state.resources.herbs) return false;
        get().upgradeBuildingOnchain(buildingId);
        return true;
    },

    hatchEgg: (eggIndex: number, _isFirst?: boolean) => {
        const { state } = get();
        const egg = state.eggs[eggIndex];
        if (!egg) return null;
        // Check fragments (cost is 10 at incubator level 0)
        const incubatorLevel = state.buildings?.incubator || 0;
        const cost = incubatorLevel >= 3 ? 0 : Math.max(0, 10 - incubatorLevel);
        if (state.resources.eggFragments < cost) return null;
        get().hatchEggOnchain(egg.id);
        return Creatures.createCreature(egg.name);
    },

    healCreature: (creatureId: number) => {
        const { state } = get();
        const herbalistLevel = state.buildings?.herbalist || 0;
        const cost = herbalistLevel >= 1 ? 1 : 2;
        if (state.resources.herbs < cost) return false;
        get().healCreatureOnchain(creatureId);
        return true;
    },

    boostCreature: (creatureId: number) => {
        const { state } = get();
        const trainingLevel = state.buildings?.training || 0;
        const cost = trainingLevel >= 3 ? 3 : 5;
        if (state.resources.essence < cost) return false;
        get().boostCreatureOnchain(creatureId);
        return true;
    },

    startExpedition: (routeId: string, creatureIds: number[]) => {
        get().startExpeditionOnchain(routeId, creatureIds);
        return true;
    },

    resolveExpedition: (expeditionId: number) => {
        get().resolveExpeditionOnchain(expeditionId);
        return true;
    },

    addCreature: (_creature: Creature) => {
        // No-op: creatures are added onchain via breed
    },

    startNewGame: (_slotIndex?: number) => {
        get().startNewGameOnchain();
        return 'onchain'; // return dummy egg name
    },

    // Slot/settings stubs (no save slots onchain)
    getAllSlots: () => [],
    save: () => { },
    loadSlot: (_index: number) => true,
    deleteSlot: (_index: number) => { },
    activeSlot: 0,
    tickExpeditions: () => { },
}));
