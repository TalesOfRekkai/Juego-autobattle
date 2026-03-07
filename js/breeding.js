/* ============================================
   BREEDING.JS — Fusion logic, requirements check
   ============================================ */

const Breeding = (() => {

    const MIN_BREED_LEVEL = 5;

    function canBreed(creatureA, creatureB) {
        if (!creatureA || !creatureB) return { ok: false, reason: 'Selecciona dos Rekaimon' };
        if (creatureA.id === creatureB.id) return { ok: false, reason: 'No pueden ser el mismo Rekaimon' };
        if (creatureA.hasBred) return { ok: false, reason: `${creatureA.name} ya ha sido usado para criar` };
        if (creatureB.hasBred) return { ok: false, reason: `${creatureB.name} ya ha sido usado para criar` };
        if (creatureA.level < MIN_BREED_LEVEL) return { ok: false, reason: `${creatureA.name} necesita ser nivel ${MIN_BREED_LEVEL}+` };
        if (creatureB.level < MIN_BREED_LEVEL) return { ok: false, reason: `${creatureB.name} necesita ser nivel ${MIN_BREED_LEVEL}+` };
        if (creatureA.isOnExpedition) return { ok: false, reason: `${creatureA.name} está de expedición` };
        if (creatureB.isOnExpedition) return { ok: false, reason: `${creatureB.name} está de expedición` };

        // Check if a fusion exists for these two base names
        const result = Data.getFusionResult(creatureA.name, creatureB.name);
        if (!result) return { ok: false, reason: 'Estos Rekaimon no son compatibles para fusión' };

        return { ok: true, result };
    }

    function breed(creatureA, creatureB) {
        const check = canBreed(creatureA, creatureB);
        if (!check.ok) return null;

        // Mark parents as bred
        creatureA.hasBred = true;
        creatureB.hasBred = true;

        // Create the fusion creature
        const fusionTemplate = check.result;
        const newCreature = Creatures.createCreature(fusionTemplate.name, fusionTemplate);

        return newCreature;
    }

    // Get preview of what fusion would result from two creatures
    function getPreview(creatureA, creatureB) {
        if (!creatureA || !creatureB) return null;
        const result = Data.getFusionResult(creatureA.name, creatureB.name);
        if (!result) return null;
        return {
            name: result.name,
            element: result.element,
            tier: result.tier,
            traits: result.traits,
            sprite: Data.getSpritePath(result.name, 1),
        };
    }

    return { MIN_BREED_LEVEL, canBreed, breed, getPreview };
})();
