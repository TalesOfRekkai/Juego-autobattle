/* ============================================
   GAME.JS — Game state manager, save/load, init
   ============================================ */

const Game = (() => {
    const SAVE_PREFIX = 'chimera_forge_slot_';
    const MAX_SLOTS = 3;
    let activeSlot = -1;

    let state = {
        phase: 'title',        // title, egg_hatch, hub
        creatures: [],
        eggs: [],              // { name: string }
        resources: null,
        expeditions: [],       // { routeId, team: [creatureIds], startTime, duration }
        discoveredNames: [],   // names of creatures seen
        discoveredKeys: [],    // name_sX keys for bestiary tracking
        totalExpeditions: 0,
        tutorialDone: false,
    };

    async function init() {
        await Data.init();
        UI.showScreen('title');


        // Start expedition tick
        setInterval(tickExpeditions, 1000);
    }

    function getState() {
        return state;
    }

    function addCreature(creature) {
        state.creatures.push(creature);
        if (!state.discoveredNames.includes(creature.name)) {
            state.discoveredNames.push(creature.name);
        }
        // Track all stage discoveries
        if (!state.discoveredKeys) state.discoveredKeys = [];
        const key = `${creature.name}_s${creature.stage}`;
        if (!state.discoveredKeys.includes(key)) {
            state.discoveredKeys.push(key);
        }
        save();
    }

    function getCreatureById(id) {
        return state.creatures.find(c => c.id === id);
    }

    function getAvailableCreatures() {
        return state.creatures.filter(c => !c.isOnExpedition);
    }

    // === EGG SYSTEM ===
    function addEgg(name) {
        state.eggs.push({ name, id: Date.now() + Math.random() });
        save();
    }

    function hatchEgg(eggIndex, free = false) {
        if (eggIndex < 0 || eggIndex >= state.eggs.length) return null;

        if (!free) {
            const cost = { eggFragments: Resources.FRAGMENTS_PER_HATCH };
            if (!Resources.canAfford(state.resources, cost)) return null;
            Resources.spend(state.resources, cost);
        }

        const egg = state.eggs.splice(eggIndex, 1)[0];
        const creature = Creatures.createCreature(egg.name);
        if (creature) {
            addCreature(creature);
        }
        save();
        return creature;
    }

    // === EXPEDITIONS ===
    function startExpedition(routeId, creatureIds) {
        const route = Routes.getRoute(routeId);
        if (!route) return false;

        const team = creatureIds.map(id => getCreatureById(id)).filter(Boolean);
        if (team.length === 0) return false;

        // Mark creatures as on expedition
        team.forEach(c => { c.isOnExpedition = true; });

        const expedition = {
            id: Date.now(),
            routeId,
            creatureIds,
            startTime: Date.now(),
            duration: route.duration * 1000, // ms
            resolved: false,
        };

        state.expeditions.push(expedition);
        state.totalExpeditions++;
        save();
        return true;
    }

    function tickExpeditions() {
        const now = Date.now();
        let changed = false;

        state.expeditions.forEach(exp => {
            if (!exp.resolved && now >= exp.startTime + exp.duration) {
                exp.resolved = true;
                changed = true;
            }
        });

        if (changed) {
            save();
            UI.updateExpeditionBadges();
        }
    }

    function getActiveExpeditions() {
        return state.expeditions.filter(e => !e.resolved);
    }

    function getCompletedExpeditions() {
        return state.expeditions.filter(e => e.resolved);
    }

    function resolveExpedition(expeditionId) {
        const expIndex = state.expeditions.findIndex(e => e.id === expeditionId);
        if (expIndex === -1) return null;

        const exp = state.expeditions[expIndex];
        const route = Routes.getRoute(exp.routeId);
        const team = exp.creatureIds.map(id => getCreatureById(id)).filter(Boolean);

        // Resolve the expedition
        const results = Routes.resolveExpedition(route, team);

        // Add resources
        Resources.addResources(state.resources, results.resources);

        // Add XP to survivors
        const evolutions = [];
        results.survived.forEach(c => {
            const oldStage = c.stage;
            const leveled = Creatures.addXP(c, results.xpPerCreature);
            if (c.stage > oldStage) {
                evolutions.push({ name: c.name, newStage: c.stage });
                // Track new stage in bestiary
                if (!state.discoveredKeys) state.discoveredKeys = [];
                const key = `${c.name}_s${c.stage}`;
                if (!state.discoveredKeys.includes(key)) {
                    state.discoveredKeys.push(key);
                }
            }
        });
        results.evolutions = evolutions;

        // Heal survivors partially
        results.survived.forEach(c => {
            Creatures.heal(c, Math.floor(Creatures.getMaxHP(c) * 0.5));
        });

        // Add egg if found
        if (results.foundEgg) {
            addEgg(results.foundEgg);
        }

        // Unmark all team members
        team.forEach(c => { c.isOnExpedition = false; });

        // Remove expedition
        state.expeditions.splice(expIndex, 1);

        save();
        return results;
    }

    function getExpeditionTimeLeft(expedition) {
        const elapsed = Date.now() - expedition.startTime;
        const remaining = expedition.duration - elapsed;
        return Math.max(0, remaining);
    }

    // === RESOURCES ===
    function healCreature(creatureId) {
        const creature = getCreatureById(creatureId);
        if (!creature) return false;
        const cost = { herbs: 2 };
        if (!Resources.canAfford(state.resources, cost)) return false;
        Resources.spend(state.resources, cost);
        Creatures.healFull(creature);
        save();
        return true;
    }

    function boostCreature(creatureId) {
        const creature = getCreatureById(creatureId);
        if (!creature) return false;
        const cost = { essence: 5 };
        if (!Resources.canAfford(state.resources, cost)) return false;
        Resources.spend(state.resources, cost);
        Creatures.addXP(creature, 15);
        save();
        return true;
    }

    // === START GAME ===
    function startNewGame(slotIndex) {
        activeSlot = slotIndex;
        state = {
            phase: 'egg_hatch',
            creatures: [],
            eggs: [],
            resources: Resources.createInventory(),
            expeditions: [],
            discoveredNames: [],
            discoveredKeys: [],
            totalExpeditions: 0,
            tutorialDone: false,
            slotName: `Partida ${slotIndex + 1}`,
            createdAt: Date.now(),
        };
        // Give first random egg
        const randomBase = Data.BASE_CREATURES[Math.floor(Math.random() * Data.BASE_CREATURES.length)];
        addEgg(randomBase);
        save();
        return randomBase;
    }

    // === SAVE / LOAD ===
    function save() {
        if (activeSlot < 0) return;
        try {
            state.lastSaved = Date.now();
            localStorage.setItem(SAVE_PREFIX + activeSlot, JSON.stringify(state));
        } catch (e) {
            console.error('Save failed:', e);
        }
    }

    function loadSlot(slotIndex) {
        try {
            const raw = localStorage.getItem(SAVE_PREFIX + slotIndex);
            if (!raw) return false;
            state = JSON.parse(raw);
            activeSlot = slotIndex;
            // Restore creature IDs
            let maxId = 0;
            state.creatures.forEach(c => { if (c.id > maxId) maxId = c.id; });
            Creatures.setNextId(maxId + 1);
            return true;
        } catch (e) {
            console.error('Load failed:', e);
            return false;
        }
    }

    function deleteSlot(slotIndex) {
        localStorage.removeItem(SAVE_PREFIX + slotIndex);
        if (activeSlot === slotIndex) activeSlot = -1;
    }

    function getAllSlots() {
        const slots = [];
        for (let i = 0; i < MAX_SLOTS; i++) {
            try {
                const raw = localStorage.getItem(SAVE_PREFIX + i);
                if (raw) {
                    const data = JSON.parse(raw);
                    slots.push({
                        index: i,
                        name: data.slotName || `Partida ${i + 1}`,
                        creatures: data.creatures?.length || 0,
                        maxLevel: data.creatures?.reduce((m, c) => Math.max(m, c.level || 1), 0) || 0,
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
    }

    function hasSave() {
        return getAllSlots().some(s => !s.empty);
    }

    function getActiveSlot() { return activeSlot; }

    return {
        init, getState, addCreature, getCreatureById,
        getAvailableCreatures, addEgg, hatchEgg,
        startExpedition, getActiveExpeditions, getCompletedExpeditions,
        resolveExpedition, getExpeditionTimeLeft,
        healCreature, boostCreature,
        startNewGame, save, loadSlot, deleteSlot, getAllSlots, hasSave, getActiveSlot,
    };
})();
