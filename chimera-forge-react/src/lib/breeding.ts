/* ============================================
   BREEDING.TS — Fusion logic, requirements check
   ============================================ */

import type { Creature } from '../types';
import * as Data from './data';
import * as Creatures from './creatures';
import { getEffectiveBreedMinLevel, type BuildingsState } from './buildings';

export const MIN_BREED_LEVEL = 5;

export function canBreed(
    creatureA: Creature | null,
    creatureB: Creature | null,
    buildings?: BuildingsState
): { ok: boolean; reason?: string; result?: any } {
    const minBreedLevel = buildings ? getEffectiveBreedMinLevel(buildings) : MIN_BREED_LEVEL;
    if (!creatureA || !creatureB) return { ok: false, reason: 'Selecciona dos Rekaimon' };
    if (creatureA.id === creatureB.id) return { ok: false, reason: 'No pueden ser el mismo Rekaimon' };
    if (creatureA.hasBred) return { ok: false, reason: `${creatureA.name} ya ha sido usado para criar` };
    if (creatureB.hasBred) return { ok: false, reason: `${creatureB.name} ya ha sido usado para criar` };
    if (creatureA.level < minBreedLevel) return { ok: false, reason: `${creatureA.name} necesita ser nivel ${minBreedLevel}+` };
    if (creatureB.level < minBreedLevel) return { ok: false, reason: `${creatureB.name} necesita ser nivel ${minBreedLevel}+` };
    if (creatureA.isOnExpedition) return { ok: false, reason: `${creatureA.name} está de expedición` };
    if (creatureB.isOnExpedition) return { ok: false, reason: `${creatureB.name} está de expedición` };

    const result = Data.getFusionResult(creatureA.name, creatureB.name);
    if (!result) return { ok: false, reason: 'Estos Rekaimon no son compatibles para fusión' };

    return { ok: true, result };
}

export function breed(creatureA: Creature, creatureB: Creature, buildings?: BuildingsState): Creature | null {
    const check = canBreed(creatureA, creatureB, buildings);
    if (!check.ok) return null;

    creatureA.hasBred = true;
    creatureB.hasBred = true;

    const fusionTemplate = check.result;
    const newCreature = Creatures.createCreature(fusionTemplate.name, fusionTemplate);
    return newCreature;
}

export function getPreview(creatureA: Creature | null, creatureB: Creature | null) {
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
