/* ============================================
   RESOURCES.TS — Resource types, inventory management
   ============================================ */

import type { ResourceInventory } from '../types';

export const RESOURCE_DEFS: Record<string, { icon: string; name: string; description: string }> = {
    essence: { icon: '🔮', name: 'Esencia', description: 'Mejora los stats de tus Rekaimon' },
    herbs: { icon: '🌿', name: 'Hierbas', description: 'Cura a tus Rekaimon heridos' },
    eggFragments: { icon: '🥚', name: 'Fragmentos', description: 'Reúne 10 para eclosionar un huevo' },
    crystals: { icon: '⚡', name: 'Cristales', description: 'Desbloquea rutas avanzadas' },
};

export const FRAGMENTS_PER_HATCH = 10;

const RESOURCE_KEYS: Array<keyof ResourceInventory> = ['essence', 'herbs', 'eggFragments', 'crystals'];

function isResourceKey(key: string): key is keyof ResourceInventory {
    return RESOURCE_KEYS.includes(key as keyof ResourceInventory);
}

export function getInfo(resourceKey: string) {
    return RESOURCE_DEFS[resourceKey] || { icon: '❓', name: resourceKey };
}

export function getAllTypes(): string[] {
    return Object.keys(RESOURCE_DEFS);
}

export function createInventory(): ResourceInventory {
    return { essence: 0, herbs: 0, eggFragments: 0, crystals: 0 };
}

export function addResources(inventory: ResourceInventory, additions: Partial<ResourceInventory>): void {
    for (const [key, amount] of Object.entries(additions)) {
        if (isResourceKey(key)) {
            inventory[key] += amount ?? 0;
        }
    }
}

export function canAfford(inventory: ResourceInventory, costs: Partial<ResourceInventory>): boolean {
    for (const [key, amount] of Object.entries(costs)) {
        if (isResourceKey(key) && inventory[key] < (amount ?? 0)) return false;
    }
    return true;
}

export function spend(inventory: ResourceInventory, costs: Partial<ResourceInventory>): boolean {
    if (!canAfford(inventory, costs)) return false;
    for (const [key, amount] of Object.entries(costs)) {
        if (isResourceKey(key)) {
            inventory[key] -= amount ?? 0;
        }
    }
    return true;
}
