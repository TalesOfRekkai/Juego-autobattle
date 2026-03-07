/* ============================================
   ROUTES.JS — Route definitions, expedition logic, timers
   ============================================ */

const Routes = (() => {

    const ROUTE_DEFS = [
        {
            id: 'bosque',
            name: 'Bosque Susurrante',
            icon: '🌲',
            element: 'earth',
            difficulty: 1,
            stars: '★☆☆☆',
            duration: 30,           // seconds
            requirement: null,
            mapPos: { x: 25, y: 45 },
            rewards: {
                essence: [2, 5],
                herbs: [1, 3],
                eggFragments: [0, 2],
                crystals: [0, 0],
            },
            eggChance: 0.08,
            xpReward: [8, 15],
            enemyPower: 20,
            description: 'Un bosque tranquilo, ideal para empezar.',
        },
        {
            id: 'costa',
            name: 'Costa Bioluminiscente',
            icon: '🌊',
            element: 'water',
            difficulty: 1,
            stars: '★☆☆☆',
            duration: 30,
            requirement: null,
            mapPos: { x: 25, y: 63 },
            rewards: {
                essence: [2, 5],
                herbs: [1, 3],
                eggFragments: [0, 2],
                crystals: [0, 0],
            },
            eggChance: 0.08,
            xpReward: [8, 15],
            enemyPower: 22,
            description: 'Aguas brillantes con criaturas acuáticas.',
        },
        {
            id: 'volcan',
            name: 'Volcán Dormido',
            icon: '🌋',
            element: 'fire',
            difficulty: 2,
            stars: '★★☆☆',
            duration: 60,
            requirement: { minLevel: 3, minCreatures: 1 },
            mapPos: { x: 48, y: 60 },
            rewards: {
                essence: [4, 10],
                herbs: [1, 4],
                eggFragments: [1, 4],
                crystals: [0, 1],
            },
            eggChance: 0.12,
            xpReward: [15, 30],
            enemyPower: 45,
            description: 'Lava latente y mucho calor. Peligroso.',
        },
        {
            id: 'cumbres',
            name: 'Cumbres Ventosas',
            icon: '⛰️',
            element: 'air',
            difficulty: 2,
            stars: '★★☆☆',
            duration: 60,
            requirement: { minLevel: 3, minCreatures: 1 },
            mapPos: { x: 75, y: 55 },
            rewards: {
                essence: [4, 10],
                herbs: [1, 4],
                eggFragments: [1, 4],
                crystals: [0, 1],
            },
            eggChance: 0.12,
            xpReward: [15, 30],
            enemyPower: 48,
            description: 'Vientos cortantes en la cima del mundo.',
        },
        {
            id: 'cripta',
            name: 'Cripta Olvidada',
            icon: '💀',
            element: 'shadow',
            difficulty: 3,
            stars: '★★★☆',
            duration: 120,
            requirement: { minLevel: 5, minCreatures: 2 },
            mapPos: { x: 78, y: 43 },
            rewards: {
                essence: [8, 18],
                herbs: [2, 6],
                eggFragments: [2, 6],
                crystals: [1, 3],
            },
            eggChance: 0.18,
            xpReward: [30, 55],
            enemyPower: 80,
            description: 'Antigua cripta llena de sombras hostiles.',
        },
        {
            id: 'templo',
            name: 'Templo Solar',
            icon: '☀️',
            element: 'light',
            difficulty: 3,
            stars: '★★★☆',
            duration: 120,
            requirement: { minLevel: 5, minCreatures: 2 },
            mapPos: { x: 50, y: 43 },
            rewards: {
                essence: [8, 18],
                herbs: [2, 6],
                eggFragments: [2, 6],
                crystals: [1, 3],
            },
            eggChance: 0.18,
            xpReward: [30, 55],
            enemyPower: 85,
            description: 'Un templo sagrado bañado en luz eterna.',
        },
        {
            id: 'nexo',
            name: 'Nexo Elemental',
            icon: '🌀',
            element: 'mixed',
            difficulty: 4,
            stars: '★★★★',
            duration: 180,
            requirement: { minLevel: 10, minCreatures: 3 },
            mapPos: { x: 50, y: 50 },
            rewards: {
                essence: [15, 30],
                herbs: [4, 10],
                eggFragments: [4, 10],
                crystals: [3, 6],
            },
            eggChance: 0.25,
            xpReward: [55, 100],
            enemyPower: 150,
            description: 'Donde todos los elementos convergen. Solo los más fuertes sobreviven.',
        },
    ];

    function getRoute(id) {
        return ROUTE_DEFS.find(r => r.id === id);
    }

    function getAllRoutes() {
        return ROUTE_DEFS;
    }

    function canAccessRoute(route, playerCreatures) {
        if (!route.requirement) return true;
        const available = playerCreatures.filter(c => !c.isOnExpedition);
        const req = route.requirement;
        const qualifying = available.filter(c => c.level >= req.minLevel);
        return qualifying.length >= req.minCreatures;
    }

    function randRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Calculate expedition results
    function resolveExpedition(route, team) {
        const teamPower = team.reduce((sum, c) => sum + Creatures.getPower(c), 0);
        const elementBonus = team.some(c =>
            route.element !== 'mixed' && Data.hasElementAdvantage(c.element, route.element)
        ) ? 1.3 : (team.some(c => c.element === route.element) ? 1.15 : 1.0);

        const effectivePower = teamPower * elementBonus;
        const survivalChance = Math.min(0.95, effectivePower / (route.enemyPower * 1.5));

        const results = {
            survived: [],
            fainted: [],
            resources: { essence: 0, herbs: 0, eggFragments: 0, crystals: 0 },
            xpPerCreature: 0,
            foundEgg: null,
        };

        // Each creature has individual survival chance
        team.forEach(c => {
            const individualSurvival = Math.min(0.95,
                Creatures.getPower(c) * elementBonus / route.enemyPower
            );
            if (Math.random() < individualSurvival) {
                results.survived.push(c);
            } else {
                results.fainted.push(c);
                c.currentHP = 0;
            }
        });

        // Resources scale with how many survived
        const survivalRatio = results.survived.length / team.length;
        const r = route.rewards;
        results.resources.essence = Math.floor(randRange(r.essence[0], r.essence[1]) * survivalRatio);
        results.resources.herbs = Math.floor(randRange(r.herbs[0], r.herbs[1]) * survivalRatio);
        results.resources.eggFragments = Math.floor(randRange(r.eggFragments[0], r.eggFragments[1]) * survivalRatio);
        results.resources.crystals = Math.floor(randRange(r.crystals[0], r.crystals[1]) * survivalRatio);

        // XP only for survivors
        results.xpPerCreature = randRange(route.xpReward[0], route.xpReward[1]);

        // Egg drop chance
        if (Math.random() < route.eggChance * survivalRatio) {
            const randomBase = Data.BASE_CREATURES[Math.floor(Math.random() * Data.BASE_CREATURES.length)];
            results.foundEgg = randomBase;
        }

        return results;
    }

    return {
        ROUTE_DEFS, getRoute, getAllRoutes, canAccessRoute, resolveExpedition,
    };
})();
