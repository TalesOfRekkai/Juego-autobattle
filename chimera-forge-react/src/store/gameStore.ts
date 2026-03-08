/* ============================================
   GAME STORE — Zustand global state manager
   ============================================ */

import { create } from 'zustand';
import type { Creature, Expedition, GameState, SlotInfo } from '../types';
import * as Creatures from '../lib/creatures';
import * as Resources from '../lib/resources';
import * as RoutesLib from '../lib/routes';
import * as Missions from '../lib/missions';
import * as Data from '../lib/data';
import { createDefaultBuildings, getBuildingDef, getBuildingBuffs, getEffectiveHatchFragmentCost, type BuildingsState } from '../lib/buildings';
import { useToastStore } from './toastStore';

const SAVE_PREFIX = 'chimera_forge_slot_';
const MAX_SLOTS = 3;

interface GameStore {
    activeSlot: number;
    state: GameState;
    dataLoaded: boolean;

    // Init
    initData: () => Promise<void>;

    // Creatures
    addCreature: (creature: Creature) => void;
    getCreatureById: (id: number) => Creature | undefined;
    getAvailableCreatures: () => Creature[];

    // Eggs
    addEgg: (name: string) => void;
    hatchEgg: (eggIndex: number, free?: boolean) => Creature | null;

    // Expeditions
    startExpedition: (routeId: string, creatureIds: number[]) => boolean;
    tickExpeditions: () => boolean;
    getActiveExpeditions: () => Expedition[];
    getCompletedExpeditions: () => Expedition[];
    resolveExpedition: (expeditionId: number) => import('../types').ExpeditionResult | null;
    getExpeditionTimeLeft: (expedition: Expedition) => number;

    // Actions
    healCreature: (creatureId: number) => boolean;
    boostCreature: (creatureId: number) => boolean;

    // Buildings
    upgradeBuilding: (buildingId: string) => boolean;

    // Slots
    startNewGame: (slotIndex: number) => string;
    checkMissionProgress: () => void;
    save: () => void;
    loadSlot: (slotIndex: number) => boolean;
    deleteSlot: (slotIndex: number) => void;
    getAllSlots: () => SlotInfo[];
    hasSave: () => boolean;
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

export const useGameStore = create<GameStore>((set, get) => ({
    activeSlot: -1,
    state: createDefaultState(),
    dataLoaded: false,

    initData: async () => {
        await Data.loadCreatureData();
        set({ dataLoaded: true });
    },

    addCreature: (creature) => {
        set(prev => {
            const s = { ...prev.state };
            s.creatures = [...s.creatures, creature];
            if (!s.discoveredNames.includes(creature.name)) {
                s.discoveredNames = [...s.discoveredNames, creature.name];
            }
            if (!s.discoveredKeys) s.discoveredKeys = [];
            const key = `${creature.name}_s${creature.stage}`;
            if (!s.discoveredKeys.includes(key)) {
                s.discoveredKeys = [...s.discoveredKeys, key];
            }
            return { state: s };
        });
        get().checkMissionProgress();
        get().save();
    },

    getCreatureById: (id) => {
        return get().state.creatures.find(c => c.id === id);
    },

    getAvailableCreatures: () => {
        return get().state.creatures.filter(c => !c.isOnExpedition);
    },

    addEgg: (name) => {
        set(prev => {
            const s = { ...prev.state };
            s.eggs = [...s.eggs, { name, id: Date.now() + Math.random() }];
            return { state: s };
        });
        get().save();
    },

    hatchEgg: (eggIndex, free = false) => {
        const s = get().state;
        if (eggIndex < 0 || eggIndex >= s.eggs.length) return null;

        if (!free) {
            const fragmentCost = getEffectiveHatchFragmentCost(s.buildings);
            if (fragmentCost > 0) {
                const cost = { eggFragments: fragmentCost };
                if (!Resources.canAfford(s.resources, cost)) return null;
                Resources.spend(s.resources, cost);
            }
        }

        const egg = s.eggs[eggIndex];
        const newEggs = [...s.eggs];
        newEggs.splice(eggIndex, 1);

        const creature = Creatures.createCreature(egg.name);
        if (creature) {
            set(prev => ({
                state: { ...prev.state, eggs: newEggs }
            }));
            get().addCreature(creature);
        }
        get().save();
        return creature;
    },

    startExpedition: (routeId, creatureIds) => {
        const route = RoutesLib.getRoute(routeId);
        if (!route) return false;

        const s = get().state;
        const team = creatureIds.map(id => s.creatures.find(c => c.id === id)).filter(Boolean) as Creature[];
        if (team.length === 0) return false;

        team.forEach(c => { c.isOnExpedition = true; });

        const expedition: Expedition = {
            id: Date.now(),
            routeId,
            creatureIds,
            startTime: Date.now(),
            // Apply expedition speed buff from Torre del Explorador
            duration: Math.floor(route.duration * 1000 * getBuildingBuffs(s.buildings).expeditionSpeedMultiplier),
            resolved: false,
        };

        set(prev => ({
            state: {
                ...prev.state,
                creatures: [...prev.state.creatures],
                expeditions: [...prev.state.expeditions, expedition],
                totalExpeditions: prev.state.totalExpeditions + 1,
            }
        }));
        get().save();
        return true;
    },

    tickExpeditions: () => {
        const now = Date.now();
        const s = get().state;
        let changed = false;

        const updatedExpeditions = s.expeditions.map(exp => {
            if (!exp.resolved && now >= exp.startTime + exp.duration) {
                changed = true;
                return { ...exp, resolved: true };
            }
            return exp;
        });

        if (changed) {
            set(prev => ({ state: { ...prev.state, expeditions: updatedExpeditions } }));
            get().save();
        }
        return changed;
    },

    getActiveExpeditions: () => {
        return get().state.expeditions.filter(e => !e.resolved);
    },

    getCompletedExpeditions: () => {
        return get().state.expeditions.filter(e => e.resolved);
    },

    resolveExpedition: (expeditionId) => {
        const s = get().state;
        const expIndex = s.expeditions.findIndex(e => e.id === expeditionId);
        if (expIndex === -1) return null;

        const exp = s.expeditions[expIndex];
        const route = RoutesLib.getRoute(exp.routeId);
        if (!route) return null;
        const team = exp.creatureIds.map(id => s.creatures.find(c => c.id === id)).filter(Boolean) as Creature[];

        const results = RoutesLib.resolveExpedition(route, team, getBuildingBuffs(s.buildings));

        Resources.addResources(s.resources, results.resources);

        const evolutions: { name: string; newStage: number }[] = [];
        // Apply training XP multiplier from Campo de Entrenamiento
        const buffs = getBuildingBuffs(s.buildings);
        const xpGain = Math.floor(results.xpPerCreature * buffs.trainingXPMultiplier);
        results.survived.forEach(c => {
            const oldStage = c.stage;
            Creatures.addXP(c, xpGain);
            if (c.stage > oldStage) {
                evolutions.push({ name: c.name, newStage: c.stage });
                if (!s.discoveredKeys) s.discoveredKeys = [];
                const key = `${c.name}_s${c.stage}`;
                if (!s.discoveredKeys.includes(key)) {
                    s.discoveredKeys.push(key);
                }
            }
        });
        results.evolutions = evolutions;

        // Healing after expedition: auto-heal (Herbolario Lv3) or 50% HP
        if (buffs.autoHealAfterExpedition) {
            results.survived.forEach(c => { Creatures.healFull(c); });
            results.fainted.forEach(c => { Creatures.healFull(c); });
        } else {
            results.survived.forEach(c => {
                Creatures.heal(c, Math.floor(Creatures.getMaxHP(c) * 0.5));
            });
        }

        if (results.foundEgg) {
            get().addEgg(results.foundEgg);
        }

        team.forEach(c => { c.isOnExpedition = false; });

        const newExpeditions = [...s.expeditions];
        newExpeditions.splice(expIndex, 1);

        set(prev => ({
            state: {
                ...prev.state,
                creatures: [...prev.state.creatures],
                expeditions: newExpeditions,
                completedExpeditions: prev.state.completedExpeditions + 1,
            }
        }));
        get().checkMissionProgress();
        get().save();
        return results;
    },

    getExpeditionTimeLeft: (expedition) => {
        const elapsed = Date.now() - expedition.startTime;
        const remaining = expedition.duration - elapsed;
        return Math.max(0, remaining);
    },

    healCreature: (creatureId) => {
        const s = get().state;
        const creature = s.creatures.find(c => c.id === creatureId);
        if (!creature) return false;
        // Herbolario buff: reduced herb cost
        const buffs = getBuildingBuffs(s.buildings);
        const cost = { herbs: buffs.healHerbCost };
        if (!Resources.canAfford(s.resources, cost)) return false;
        Resources.spend(s.resources, cost);
        // Curación manual: actualmente siempre restaura HP completo
        Creatures.healFull(creature);
        set(prev => ({ state: { ...prev.state, creatures: [...prev.state.creatures] } }));
        get().save();
        return true;
    },

    boostCreature: (creatureId) => {
        const s = get().state;
        const creature = s.creatures.find(c => c.id === creatureId);
        if (!creature) return false;
        // Campo de Entrenamiento buff: reduced essence cost & more XP
        const buffs = getBuildingBuffs(s.buildings);
        const essenceCost = Math.max(1, 5 - buffs.trainingEssenceDiscount);
        const cost = { essence: essenceCost };
        if (!Resources.canAfford(s.resources, cost)) return false;
        Resources.spend(s.resources, cost);
        const xp = Math.floor(15 * buffs.trainingXPMultiplier);
        Creatures.addXP(creature, xp);
        set(prev => ({ state: { ...prev.state, creatures: [...prev.state.creatures] } }));
        get().checkMissionProgress();
        get().save();
        return true;
    },

    upgradeBuilding: (buildingId) => {
        const def = getBuildingDef(buildingId);
        if (!def) return false;
        const s = get().state;
        const currentLevel = s.buildings[buildingId as keyof BuildingsState] ?? 0;
        if (currentLevel >= 3) return false; // max level

        const levelDef = def.levels[currentLevel]; // cost for next level
        const cost: Record<string, number> = {};
        if (levelDef.cost.essence) cost.essence = levelDef.cost.essence;
        if (levelDef.cost.crystals) cost.crystals = levelDef.cost.crystals;
        if (levelDef.cost.herbs) cost.herbs = levelDef.cost.herbs;

        if (!Resources.canAfford(s.resources, cost)) return false;
        Resources.spend(s.resources, cost);

        const newBuildings = { ...s.buildings, [buildingId]: currentLevel + 1 };
        set(prev => ({
            state: {
                ...prev.state,
                resources: { ...prev.state.resources },
                buildings: newBuildings,
            }
        }));
        get().save();
        return true;
    },

    startNewGame: (slotIndex) => {
        const resources = Resources.createInventory();
        const randomBase = Data.BASE_CREATURES[Math.floor(Math.random() * Data.BASE_CREATURES.length)];

        const newState: GameState = {
            phase: 'egg_hatch',
            creatures: [],
            eggs: [{ name: randomBase, id: Date.now() + Math.random() }],
            resources,
            expeditions: [],
            discoveredNames: [],
            discoveredKeys: [],
            totalExpeditions: 0,
            completedExpeditions: 0,
            completedMissionIds: [],
            earnedMedals: [],
            tutorialDone: false,
            buildings: createDefaultBuildings(),
            slotName: `Partida ${slotIndex + 1}`,
            createdAt: Date.now(),
        };

        set({ activeSlot: slotIndex, state: newState });
        get().save();
        return randomBase;
    },

    checkMissionProgress: () => {
        const s = get().state;
        const newlyCompleted = Missions.getNewlyCompletedMissions(s, s.completedMissionIds);
        if (newlyCompleted.length === 0) return;

        const newMissionIds = newlyCompleted.map(m => m.id);
        const newMedals = newlyCompleted.map(m => m.medalId);

        set(prev => ({
            state: {
                ...prev.state,
                completedMissionIds: [...prev.state.completedMissionIds, ...newMissionIds],
                earnedMedals: [...prev.state.earnedMedals, ...newMedals.filter(medalId => !prev.state.earnedMedals.includes(medalId))],
            }
        }));

        const addToast = useToastStore.getState().addToast;
        newlyCompleted.forEach(mission => {
            addToast(`🏅 Misión completada: ${mission.title}`, 'success');
        });
    },

    save: () => {
        const { activeSlot, state } = get();
        if (activeSlot < 0) return;
        try {
            const saveState = { ...state, lastSaved: Date.now() };
            localStorage.setItem(SAVE_PREFIX + activeSlot, JSON.stringify(saveState));
        } catch (e) {
            console.error('Save failed:', e);
        }
    },

    loadSlot: (slotIndex) => {
        try {
            const raw = localStorage.getItem(SAVE_PREFIX + slotIndex);
            if (!raw) return false;
            const loaded = JSON.parse(raw) as GameState;
            // Backward compat: add buildings if missing from old saves
            if (!loaded.buildings) {
                loaded.buildings = createDefaultBuildings();
            }
            if (typeof loaded.completedExpeditions !== 'number') {
                loaded.completedExpeditions = 0;
            }
            if (!Array.isArray(loaded.completedMissionIds)) {
                loaded.completedMissionIds = [];
            }
            if (!Array.isArray(loaded.earnedMedals)) {
                loaded.earnedMedals = [];
            }
            let maxId = 0;
            loaded.creatures.forEach(c => { if (c.id > maxId) maxId = c.id; });
            Creatures.setNextId(maxId + 1);
            set({ activeSlot: slotIndex, state: loaded });
            return true;
        } catch (e) {
            console.error('Load failed:', e);
            return false;
        }
    },

    deleteSlot: (slotIndex) => {
        localStorage.removeItem(SAVE_PREFIX + slotIndex);
        const { activeSlot } = get();
        if (activeSlot === slotIndex) {
            set({ activeSlot: -1 });
        }
    },

    getAllSlots: () => {
        const slots: SlotInfo[] = [];
        for (let i = 0; i < MAX_SLOTS; i++) {
            try {
                const raw = localStorage.getItem(SAVE_PREFIX + i);
                if (raw) {
                    const data = JSON.parse(raw);
                    slots.push({
                        index: i,
                        name: data.slotName || `Partida ${i + 1}`,
                        creatures: data.creatures?.length || 0,
                        maxLevel: data.creatures?.reduce((m: number, c: { level?: number }) => Math.max(m, c.level || 1), 0) || 0,
                        totalExpeditions: data.totalExpeditions || 0,
                        lastSaved: data.lastSaved || data.createdAt || 0,
                        empty: false,
                    });
                } else {
                    slots.push({ index: i, empty: true });
                }
            } catch {
                slots.push({ index: i, empty: true });
            }
        }
        return slots;
    },

    hasSave: () => {
        return get().getAllSlots().some(s => !s.empty);
    },
}));
