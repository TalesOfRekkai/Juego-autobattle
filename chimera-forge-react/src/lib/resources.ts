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
        if (key in inventory) {
            (inventory as any)[key] += amount;
        }
    }
}

export function canAfford(inventory: ResourceInventory, costs: Partial<ResourceInventory>): boolean {
    for (const [key, amount] of Object.entries(costs)) {
        if (((inventory as any)[key] || 0) < (amount as number)) return false;
    }
    return true;
}

export function spend(inventory: ResourceInventory, costs: Partial<ResourceInventory>): boolean {
    if (!canAfford(inventory, costs)) return false;
    for (const [key, amount] of Object.entries(costs)) {
        (inventory as any)[key] -= amount;
    }
    return true;
}
