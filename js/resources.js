/* ============================================
   RESOURCES.JS — Resource types, inventory management
   ============================================ */

const Resources = (() => {

    const RESOURCE_DEFS = {
        essence: { icon: '🔮', name: 'Esencia', description: 'Mejora los stats de tus Rekaimon' },
        herbs: { icon: '🌿', name: 'Hierbas', description: 'Cura a tus Rekaimon heridos' },
        eggFragments: { icon: '🥚', name: 'Fragmentos', description: 'Reúne 10 para eclosionar un huevo' },
        crystals: { icon: '⚡', name: 'Cristales', description: 'Desbloquea rutas avanzadas' },
    };

    const FRAGMENTS_PER_HATCH = 10;

    function getInfo(resourceKey) {
        return RESOURCE_DEFS[resourceKey] || { icon: '❓', name: resourceKey };
    }

    function getAllTypes() {
        return Object.keys(RESOURCE_DEFS);
    }

    function createInventory() {
        return {
            essence: 0,
            herbs: 0,
            eggFragments: 0,
            crystals: 0,
        };
    }

    function addResources(inventory, additions) {
        for (const [key, amount] of Object.entries(additions)) {
            if (inventory[key] !== undefined) {
                inventory[key] += amount;
            }
        }
    }

    function canAfford(inventory, costs) {
        for (const [key, amount] of Object.entries(costs)) {
            if ((inventory[key] || 0) < amount) return false;
        }
        return true;
    }

    function spend(inventory, costs) {
        if (!canAfford(inventory, costs)) return false;
        for (const [key, amount] of Object.entries(costs)) {
            inventory[key] -= amount;
        }
        return true;
    }

    return {
        RESOURCE_DEFS, FRAGMENTS_PER_HATCH,
        getInfo, getAllTypes, createInventory,
        addResources, canAfford, spend,
    };
})();
