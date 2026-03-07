/* ============================================
   CREATURES.TS — Creature instances, stats, XP, evolution
   ============================================ */

import type { Creature, CreatureTemplate, Stats } from '../types';
import * as Data from './data';

let nextId = 1;

export function createCreature(name: string, fromTemplate?: CreatureTemplate | null): Creature | null {
    const template = fromTemplate || Data.getCreatureTemplate(name);
    if (!template) {
        console.error('No template for creature:', name);
        return null;
    }

    const creature: Creature = {
        id: nextId++,
        name: template.name,
        element: template.element,
        bodyType: template.bodyType,
        traits: [...template.traits],
        type: template.type,
        tier: template.tier,
        stage: 1,
        level: 1,
        xp: 0,
        hasBred: false,
        isOnExpedition: false,
        currentHP: 0,
        parentA: template.parentA || null,
        parentB: template.parentB || null,
    };

    const stats = getStats(creature);
    creature.currentHP = stats.hp;
    return creature;
}

export function getStats(creature: Creature): Stats {
    const base = Data.getBaseStats(creature.bodyType, creature.stage, creature.tier);
    const levelBonus = 1 + (creature.level - 1) * 0.08;
    return {
        hp: Math.floor(base.hp * levelBonus),
        atk: Math.floor(base.atk * levelBonus),
        def: Math.floor(base.def * levelBonus),
        spd: Math.floor(base.spd * levelBonus),
    };
}

export function getMaxHP(creature: Creature): number {
    return getStats(creature).hp;
}

export function addXP(creature: Creature, amount: number): boolean {
    creature.xp += amount;
    let leveled = false;

    while (creature.xp >= Data.xpForLevel(creature.level + 1)) {
        creature.level++;
        leveled = true;
        checkEvolution(creature);
    }

    if (leveled) {
        creature.currentHP = getMaxHP(creature);
    }
    return leveled;
}

export function checkEvolution(creature: Creature): number | null {
    for (const [targetStage, requiredLevel] of Object.entries(Data.EVOLUTION_LEVELS)) {
        const stage = parseInt(targetStage);
        if (creature.stage < stage && creature.level >= requiredLevel) {
            creature.stage = stage;
            creature.currentHP = getMaxHP(creature);
            return stage;
        }
    }
    return null;
}

export function heal(creature: Creature, amount: number): void {
    const max = getMaxHP(creature);
    creature.currentHP = Math.min(max, creature.currentHP + amount);
}

export function healFull(creature: Creature): void {
    creature.currentHP = getMaxHP(creature);
}

export function isAlive(creature: Creature): boolean {
    return creature.currentHP > 0;
}

export function canBreed(creature: Creature): boolean {
    return !creature.hasBred && creature.level >= 5 && !creature.isOnExpedition;
}

export function getSprite(creature: Creature): string {
    return Data.getSpritePath(creature.name, creature.stage);
}

export function getXPProgress(creature: Creature): number {
    const currentLevelXP = Data.xpForLevel(creature.level);
    const nextLevelXP = Data.xpForLevel(creature.level + 1);
    const progress = (creature.xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
    return Math.max(0, Math.min(1, progress));
}

export function getPower(creature: Creature): number {
    const stats = getStats(creature);
    return stats.hp + stats.atk + stats.def + stats.spd;
}

export function serialize(creature: Creature): Creature {
    return { ...creature };
}

export function deserialize(data: Creature): Creature {
    const creature = { ...data };
    if (creature.id >= nextId) nextId = creature.id + 1;
    return creature;
}

export function setNextId(id: number): void {
    nextId = id;
}
