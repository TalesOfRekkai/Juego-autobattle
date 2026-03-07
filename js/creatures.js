/* ============================================
   CREATURES.JS — Creature instances, stats, XP, evolution
   ============================================ */

const Creatures = (() => {
    let nextId = 1;

    function createCreature(name, fromTemplate = null) {
        const template = fromTemplate || Data.getCreatureTemplate(name);
        if (!template) {
            console.error('No template for creature:', name);
            return null;
        }

        const creature = {
            id: nextId++,
            name: template.name,
            element: template.element,
            bodyType: template.bodyType,
            traits: [...template.traits],
            type: template.type,       // 'base' or 'fusion'
            tier: template.tier,
            stage: 1,
            level: 1,
            xp: 0,
            hasBred: false,            // one-time breeding flag
            isOnExpedition: false,
            currentHP: 0,              // set after stats calc
            parentA: template.parentA || null,
            parentB: template.parentB || null,
        };

        const stats = getStats(creature);
        creature.currentHP = stats.hp;

        return creature;
    }

    function getStats(creature) {
        const base = Data.getBaseStats(creature.bodyType, creature.stage, creature.tier);
        const levelBonus = 1 + (creature.level - 1) * 0.08;

        return {
            hp: Math.floor(base.hp * levelBonus),
            atk: Math.floor(base.atk * levelBonus),
            def: Math.floor(base.def * levelBonus),
            spd: Math.floor(base.spd * levelBonus),
        };
    }

    function getMaxHP(creature) {
        return getStats(creature).hp;
    }

    function addXP(creature, amount) {
        creature.xp += amount;
        let leveled = false;

        while (creature.xp >= Data.xpForLevel(creature.level + 1)) {
            creature.level++;
            leveled = true;
            checkEvolution(creature);
        }

        // Heal to full on level up
        if (leveled) {
            creature.currentHP = getMaxHP(creature);
        }

        return leveled;
    }

    function checkEvolution(creature) {
        for (const [targetStage, requiredLevel] of Object.entries(Data.EVOLUTION_LEVELS)) {
            const stage = parseInt(targetStage);
            if (creature.stage < stage && creature.level >= requiredLevel) {
                creature.stage = stage;
                creature.currentHP = getMaxHP(creature);
                return stage; // evolved!
            }
        }
        return null;
    }

    function heal(creature, amount) {
        const max = getMaxHP(creature);
        creature.currentHP = Math.min(max, creature.currentHP + amount);
    }

    function healFull(creature) {
        creature.currentHP = getMaxHP(creature);
    }

    function isAlive(creature) {
        return creature.currentHP > 0;
    }

    function canBreed(creature) {
        return !creature.hasBred && creature.level >= 5 && !creature.isOnExpedition;
    }

    function getSprite(creature) {
        return Data.getSpritePath(creature.name, creature.stage);
    }

    function getXPProgress(creature) {
        const currentLevelXP = Data.xpForLevel(creature.level);
        const nextLevelXP = Data.xpForLevel(creature.level + 1);
        const progress = (creature.xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
        return Math.max(0, Math.min(1, progress));
    }

    function getElementIcon(element) {
        return Data.ELEMENTS[element]?.icon || '❓';
    }

    function getElementName(element) {
        return Data.ELEMENTS[element]?.name || element;
    }

    // Power rating for difficulty comparisons
    function getPower(creature) {
        const stats = getStats(creature);
        return stats.hp + stats.atk + stats.def + stats.spd;
    }

    // Serialize for save
    function serialize(creature) {
        return { ...creature };
    }

    // Deserialize from save
    function deserialize(data) {
        const creature = { ...data };
        if (creature.id >= nextId) nextId = creature.id + 1;
        return creature;
    }

    function setNextId(id) {
        nextId = id;
    }

    return {
        createCreature, getStats, getMaxHP, addXP, checkEvolution,
        heal, healFull, isAlive, canBreed, getSprite, getXPProgress,
        getElementIcon, getElementName, getPower,
        serialize, deserialize, setNextId,
    };
})();
