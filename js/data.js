/* ============================================
   DATA.JS — JSON parsing, sprite mapping, base stats
   ============================================ */

const Data = (() => {
    // Raw JSON will be loaded here
    let allCreatureData = [];

    // Sprite filename mapping: normalized name → actual filename
    const SPRITE_MAP = {
        // === EGGS ===
        'Pyralis_egg': 'Pyralis_egg_nobg.png',
        'Tidecrawl_egg': 'Tidecrawl_egg_nobg.png',
        'Thornback_egg': 'Thornback_egg_nobg_nobg.png',
        'Zephkling_egg': 'Zephkling_egg_nobg.png',
        'Gloomfang_egg': 'Gloomfang_egg_nobg (1).png',
        'Solnir_egg': 'Solnir_egg_nobg.png',
        'Mycelith_egg': 'Mycelith_egg_nobg_nobg.png',
        'Vexmaw_egg': 'Vexmaw_egg_nobg.png',
        // === BASE CREATURES ===
        // Pyralis (fire)
        'Pyralis_s1': 'Pyralis_s1_common_nobg (4).png',
        'Pyralis_s2': 'Pyralis_s2_common_nobg_nobg.png',
        'Pyralis_s3': 'Pyralis_s3_common_nobg (1).png',
        // Tidecrawl (water)
        'Tidecrawl_s1': 'Tidecrawl_s1_common_nobg (3).png',
        'Tidecrawl_s2': 'Tidecrawl_s2_common_nobg.png',
        'Tidecrawl_s3': 'Tidecrawl_s3_common_nobg_nobg.png',
        // Thornback (earth)
        'Thornback_s1': 'Thornback_s1_common_nobg (2).png',
        'Thornback_s2': 'Thornback_s2_common_nobg_nobg.png',
        'Thornback_s3': 'Thornback_s3_common_nobg_nobg.png',
        // Zephkling (air)
        'Zephkling_s1': 'Zephkling_s1_common_nobg (2).png',
        'Zephkling_s2': 'Zephkling_s2_common_nobg_nobg.png',
        'Zephkling_s3': 'Zephkling_s3_common_nobg.png',
        // Gloomfang (shadow)
        'Gloomfang_s1': 'Gloomfang_s1_common_nobg.png',
        'Gloomfang_s2': 'Gloomfang_s2_common_nobg.png',
        'Gloomfang_s3': 'Gloomfang_s3_common_nobg (1).png',
        // Solnir (light)
        'Solnir_s1': 'Solnir_s1_common_nobg (1).png',
        'Solnir_s2': 'Solnir_s2_common_nobg_nobg.png',
        'Solnir_s3': 'Solnir_s3_common_nobg.png',
        // Mycelith (earth)
        'Mycelith_s1': 'Mycelith_s1_common_nobg (1)_nobg.png',
        'Mycelith_s2': 'Mycelith_s2_common_nobg_nobg.png',
        'Mycelith_s3': 'Mycelith_s3_common_nobg_nobg.png',
        // Vexmaw (shadow)
        'Vexmaw_s1': 'Vexmaw_s1_common_nobg (1).png',
        'Vexmaw_s2': 'Vexmaw_s2_common_nobg (1).png',
        'Vexmaw_s3': 'Vexmaw_s3_common_nobg (1).png',
        // === FUSIONS ===
        // Pyracrawl (Pyralis + Tidecrawl)
        'Pyracrawl_s1': 'Pyracrawl_s1_rare_nobg.png',
        'Pyracrawl_s3': 'Pyracrawl_s3_rare_nobg_nobg.png',
        // Pyranback (Pyralis + Thornback)
        'Pyranback_s1': 'Pyranback_s1_rare_nobg.png',
        'Pyranback_s2': 'Pyranback_s2_rare_nobg.png',
        'Pyranback_s3': 'Pyranback_s3_rare_nobg.png',
        // Pyrakling (Pyralis + Zephkling)
        'Pyrakling_s1': 'Pyrakling_s1_rare_nobg_nobg.png',
        'Pyrakling_s2': 'Pyrakling_s2_rare_nobg_nobg.png',
        'Pyrakling_s3': 'Pyrakling_s3_rare_nobg_nobg.png',
        // Pyramfang (Pyralis + Gloomfang)
        'Pyramfang_s1': 'Pyramfang_s1_rare_nobg.png',
        'Pyramfang_s2': 'Pyramfang_s2_rare_nobg.png',
        'Pyramfang_s3': 'Pyramfang_s3_rare_nobg.png',
        // Pyranir (Pyralis + Solnir)
        'Pyranir_s1': 'Pyranir_s1_rare_nobg.png',
        'Pyranir_s2': 'Pyranir_s2_rare_nobg.png',
        'Pyranir_s3': 'Pyranir_s3_rare_nobg.png',
        // Pyralith (Pyralis + Mycelith)
        'Pyralith_s1': 'Pyralith_s1_rare_nobg.png',
        'Pyralith_s2': 'Pyralith_s2_rare_nobg.png',
        'Pyralith_s3': 'Pyralith_s3_rare_nobg.png',
        // Pyramaw (Pyralis + Vexmaw)
        'Pyramaw_s1': 'Pyramaw_s1_rare_nobg (1).png',
        'Pyramaw_s2': 'Pyramaw_s2_rare_nobg.png',
        'Pyramaw_s3': 'Pyramaw_s3_rare_nobg.png',
        // Tidecnback (Tidecrawl + Thornback)
        'Tidecnback_s1': 'Tidecnback_s1_rare_nobg.png',
        'Tidecnback_s2': 'Tidecnback_s2_rare_nobg_nobg.png',
        'Tidecnback_s3': 'Tidecnback_s3_rare_nobg.png',
        // Tideckling (Tidecrawl + Zephkling)
        'Tideckling_s1': 'Tideckling_s1_rare_nobg.png',
        'Tideckling_s2': 'Tideckling_s2_rare_nobg_nobg.png',
        'Tideckling_s3': 'Tideckling_s3_rare_nobg_nobg.png',
        // Tidecmfang (Tidecrawl + Gloomfang)
        'Tidecmfang_s1': 'Tidecmfang_s1_rare_nobg.png',
        'Tidecmfang_s2': 'Tidecmfang_s2_rare_nobg_nobg.png',
        'Tidecmfang_s3': 'Tidecmfang_s3_rare_nobg_nobg.png',
        // Tidecnir (Tidecrawl + Solnir)
        'Tidecnir_s1': 'Tidecnir_s1_rare_nobg_nobg.png',
        'Tidecnir_s2': 'Tidecnir_s2_rare_nobg_nobg.png',
        'Tidecnir_s3': 'Tidecnir_s3_rare_nobg.png',
        // Tideclith (Tidecrawl + Mycelith)
        'Tideclith_s1': 'Tideclith_s1_rare_nobg.png',
        'Tideclith_s2': 'Tideclith_s2_rare_nobg.png',
        'Tideclith_s3': 'Tideclith_s3_rare_nobg.png',
        // Tidecmaw (Tidecrawl + Vexmaw)
        'Tidecmaw_s1': 'Tidecmaw_s1_rare_nobg.png',
        'Tidecmaw_s2': 'Tidecmaw_s2_rare_nobg.png',
        'Tidecmaw_s3': 'Tidecmaw_s3_rare_nobg.png',
        // Thornkling (Thornback + Zephkling)
        'Thornkling_s1': 'Thornkling_s1_rare_nobg.png',
        'Thornkling_s2': 'Thornkling_s2_rare_nobg_nobg.png',
        'Thornkling_s3': 'Thornkling_s3_rare_nobg.png',
        // Thornmfang (Thornback + Gloomfang)
        'Thornmfang_s1': 'Thornmfang_s1_rare_nobg_nobg.png',
        'Thornmfang_s2': 'Thornmfang_s2_rare_nobg.png',
        'Thornmfang_s3': 'Thornmfang_s3_rare_nobg.png',
        // Thornnir (Thornback + Solnir)
        'Thornnir_s1': 'Thornnir_s1_rare_nobg.png',
        'Thornnir_s2': 'Thornnir_s2_rare_nobg.png',
        'Thornnir_s3': 'Thornnir_s3_rare_nobg_nobg.png',
        // Thornlith (Thornback + Mycelith)
        'Thornlith_s1': 'Thornlith_s1_rare_nobg.png',
        'Thornlith_s2': 'Thornlith_s2_rare_nobg_nobg.png',
        'Thornlith_s3': 'Thornlith_s3_rare_nobg.png',
        // Thornmaw (Thornback + Vexmaw)
        'Thornmaw_s1': 'Thornmaw_s1_rare_nobg.png',
        'Thornmaw_s2': 'Thornmaw_s2_rare_nobg_nobg.png',
        'Thornmaw_s3': 'Thornmaw_s3_rare_nobg.png',
        // Zephkmfang (Zephkling + Gloomfang)
        'Zephkmfang_s1': 'Zephkmfang_s1_rare_nobg.png',
        'Zephkmfang_s2': 'Zephkmfang_s2_rare_nobg.png',
        'Zephkmfang_s3': 'Zephkmfang_s3_rare_nobg.png',
        // Zephknir (Zephkling + Solnir)
        'Zephknir_s1': 'Zephknir_s1_rare_nobg.png',
        'Zephknir_s2': 'Zephknir_s2_rare_nobg.png',
        'Zephknir_s3': 'Zephknir_s3_rare_nobg_nobg.png',
        // Zephklith (Zephkling + Mycelith)
        'Zephklith_s1': 'Zephklith_s1_rare_nobg.png',
        'Zephklith_s2': 'Zephklith_s2_rare_nobg_nobg.png',
        'Zephklith_s3': 'Zephklith_s3_rare_nobg.png',
        // Zephkmaw (Zephkling + Vexmaw)
        'Zephkmaw_s1': 'Zephkmaw_s1_rare_nobg.png',
        'Zephkmaw_s2': 'Zephkmaw_s2_rare_nobg.png',
        'Zephkmaw_s3': 'Zephkmaw_s3_rare_nobg_nobg.png',
        // Gloomnir (Gloomfang + Solnir)
        'Gloomnir_s1': 'Gloomnir_s1_rare_nobg.png',
        'Gloomnir_s2': 'Gloomnir_s2_rare_nobg (1).png',
        'Gloomnir_s3': 'Gloomnir_s3_rare_nobg (1).png',
        // Gloomlith (Gloomfang + Mycelith)
        'Gloomlith_s1': 'Gloomlith_s1_rare_nobg_nobg.png',
        'Gloomlith_s2': 'Gloomlith_s2_rare_nobg.png',
        'Gloomlith_s3': 'Gloomlith_s3_rare_nobg (1).png',
        // Gloommaw (Gloomfang + Vexmaw)
        'Gloommaw_s1': 'Gloommaw_s1_rare_nobg (1).png',
        'Gloommaw_s2': 'Gloommaw_s2_rare_nobg.png',
        'Gloommaw_s3': 'Gloommaw_s3_rare_nobg (1).png',
        // Sollith (Solnir + Mycelith)
        'Sollith_s1': 'Sollith_s1_rare_nobg.png',
        'Sollith_s2': 'Sollith_s2_rare_nobg.png',
        'Sollith_s3': 'Sollith_s3_rare_nobg.png',
        // Solmaw (Solnir + Vexmaw)
        'Solmaw_s1': 'Solmaw_s1_rare_nobg.png',
        'Solmaw_s2': 'Solmaw_s2_rare_nobg.png',
        'Solmaw_s3': 'Solmaw_s3_rare_nobg.png',
        // Mycemaw (Mycelith + Vexmaw)
        'Mycemaw_s1': 'Mycemaw_s1_rare_nobg_nobg.png',
        'Mycemaw_s2': 'Mycemaw_s2_rare_nobg.png',
        'Mycemaw_s3': 'Mycemaw_s3_rare_nobg_nobg.png',
    };

    // Base names of the 8 starter creatures
    const BASE_CREATURES = [
        'Pyralis', 'Tidecrawl', 'Thornback', 'Zephkling',
        'Gloomfang', 'Solnir', 'Mycelith', 'Vexmaw'
    ];

    // Element info
    const ELEMENTS = {
        fire: { icon: '🔥', name: 'Fuego', color: '#ff6b35' },
        water: { icon: '💧', name: 'Agua', color: '#4fc1e9' },
        earth: { icon: '🌿', name: 'Tierra', color: '#7ec850' },
        air: { icon: '💨', name: 'Aire', color: '#c8d6e5' },
        shadow: { icon: '🌑', name: 'Sombra', color: '#9d4edd' },
        light: { icon: '✨', name: 'Luz', color: '#ffd93d' },
    };

    // Element advantages: key beats values
    const ELEMENT_ADVANTAGE = {
        fire: ['earth', 'air'],
        water: ['fire'],
        earth: ['air', 'water'],
        air: ['earth'],
        shadow: ['light'],
        light: ['shadow'],
    };

    // Base stat profiles by bodyType
    const BODY_STATS = {
        quadruped: { hp: 12, atk: 10, def: 10, spd: 8 },
        serpentine: { hp: 10, atk: 8, def: 8, spd: 12 },
        avian: { hp: 8, atk: 9, def: 6, spd: 14 },
        biped: { hp: 10, atk: 12, def: 8, spd: 10 },
        insectoid: { hp: 9, atk: 11, def: 9, spd: 11 },
        amorphous: { hp: 14, atk: 7, def: 12, spd: 6 },
    };

    // Stage multipliers
    const STAGE_MULT = { 1: 1.0, 2: 1.5, 3: 2.2 };

    // Tier bonus
    const TIER_BONUS = { common: 1.0, rare: 1.15 };

    // XP table: level → total XP needed
    function xpForLevel(level) {
        return Math.floor(10 * Math.pow(level, 1.8));
    }

    // Evolution thresholds
    const EVOLUTION_LEVELS = { 2: 5, 3: 15 }; // stage 2 at level 5, stage 3 at level 15

    function getSpritePath(name, stage) {
        const key = `${name}_s${stage}`;
        const filename = SPRITE_MAP[key];
        if (!filename) return `Assets def/${name}_s${stage}.png`;
        return `Assets def/${filename}`;
    }

    function getEggSpritePath(name) {
        const key = `${name}_egg`;
        const filename = SPRITE_MAP[key];
        if (!filename) return `Assets def/${name}_egg.png`;
        return `Assets def/${filename}`;
    }

    // Get creature template from JSON data by name
    function getCreatureTemplate(name) {
        return allCreatureData.find(c => c.name === name && c.stage === 1);
    }

    // Get fusion info: given parentA + parentB names, find the fusion creature
    function getFusionResult(parentAName, parentBName) {
        return allCreatureData.find(c =>
            c.type === 'fusion' && c.stage === 1 &&
            ((c.parentA === parentAName && c.parentB === parentBName) ||
                (c.parentA === parentBName && c.parentB === parentAName))
        );
    }

    // Get all unique creature names (stage 1 only, for reference)
    function getAllCreatureNames() {
        const names = new Set();
        allCreatureData.forEach(c => { if (c.stage === 1) names.add(c.name); });
        return Array.from(names);
    }

    // Get ALL creature entries (each name+stage combo) for bestiary
    function getAllCreatureEntries() {
        return allCreatureData.map(c => ({
            name: c.name,
            stage: c.stage,
            element: c.element,
            tier: c.tier,
            type: c.type,
            key: `${c.name}_s${c.stage}`,
        }));
    }

    function getBaseStats(bodyType, stage, tier) {
        const base = BODY_STATS[bodyType] || BODY_STATS.quadruped;
        const sm = STAGE_MULT[stage] || 1;
        const tb = TIER_BONUS[tier] || 1;
        return {
            hp: Math.floor(base.hp * sm * tb),
            atk: Math.floor(base.atk * sm * tb),
            def: Math.floor(base.def * sm * tb),
            spd: Math.floor(base.spd * sm * tb),
        };
    }

    function hasElementAdvantage(attackerElement, defenderElement) {
        return ELEMENT_ADVANTAGE[attackerElement]?.includes(defenderElement) || false;
    }

    // Initialize: load JSON
    async function init() {
        try {
            const resp = await fetch('chimera-forge-assets.json');
            allCreatureData = await resp.json();
        } catch (e) {
            console.error('Failed to load creature data:', e);
            allCreatureData = [];
        }
    }

    return {
        SPRITE_MAP, BASE_CREATURES, ELEMENTS, ELEMENT_ADVANTAGE,
        STAGE_MULT, TIER_BONUS, BODY_STATS,
        EVOLUTION_LEVELS,
        xpForLevel, getSpritePath, getEggSpritePath,
        getCreatureTemplate, getFusionResult, getAllCreatureNames, getAllCreatureEntries,
        getBaseStats, hasElementAdvantage,
        init,
        get allCreatureData() { return allCreatureData; },
    };
})();
