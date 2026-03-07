/* ============================================
   DATA.TS — JSON parsing, sprite mapping, base stats
   ============================================ */

import type { CreatureTemplate, ElementInfo, BodyType, Stats, TierType } from '../types';

// Raw JSON will be loaded here
let allCreatureData: CreatureTemplate[] = [];

// Sprite filename mapping
export const SPRITE_MAP: Record<string, string> = {
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
    'Pyralis_s1': 'Pyralis_s1_common_nobg (4).png',
    'Pyralis_s2': 'Pyralis_s2_common_nobg_nobg.png',
    'Pyralis_s3': 'Pyralis_s3_common_nobg (1).png',
    'Tidecrawl_s1': 'Tidecrawl_s1_common_nobg (3).png',
    'Tidecrawl_s2': 'Tidecrawl_s2_common_nobg.png',
    'Tidecrawl_s3': 'Tidecrawl_s3_common_nobg_nobg.png',
    'Thornback_s1': 'Thornback_s1_common_nobg (2).png',
    'Thornback_s2': 'Thornback_s2_common_nobg_nobg.png',
    'Thornback_s3': 'Thornback_s3_common_nobg_nobg.png',
    'Zephkling_s1': 'Zephkling_s1_common_nobg (2).png',
    'Zephkling_s2': 'Zephkling_s2_common_nobg_nobg.png',
    'Zephkling_s3': 'Zephkling_s3_common_nobg.png',
    'Gloomfang_s1': 'Gloomfang_s1_common_nobg.png',
    'Gloomfang_s2': 'Gloomfang_s2_common_nobg.png',
    'Gloomfang_s3': 'Gloomfang_s3_common_nobg (1).png',
    'Solnir_s1': 'Solnir_s1_common_nobg (1).png',
    'Solnir_s2': 'Solnir_s2_common_nobg_nobg.png',
    'Solnir_s3': 'Solnir_s3_common_nobg.png',
    'Mycelith_s1': 'Mycelith_s1_common_nobg (1)_nobg.png',
    'Mycelith_s2': 'Mycelith_s2_common_nobg_nobg.png',
    'Mycelith_s3': 'Mycelith_s3_common_nobg_nobg.png',
    'Vexmaw_s1': 'Vexmaw_s1_common_nobg (1).png',
    'Vexmaw_s2': 'Vexmaw_s2_common_nobg (1).png',
    'Vexmaw_s3': 'Vexmaw_s3_common_nobg (1).png',
    // === FUSIONS ===
    'Pyracrawl_s1': 'Pyracrawl_s1_rare_nobg.png',
    'Pyracrawl_s3': 'Pyracrawl_s3_rare_nobg_nobg.png',
    'Pyranback_s1': 'Pyranback_s1_rare_nobg.png',
    'Pyranback_s2': 'Pyranback_s2_rare_nobg.png',
    'Pyranback_s3': 'Pyranback_s3_rare_nobg.png',
    'Pyrakling_s1': 'Pyrakling_s1_rare_nobg_nobg.png',
    'Pyrakling_s2': 'Pyrakling_s2_rare_nobg_nobg.png',
    'Pyrakling_s3': 'Pyrakling_s3_rare_nobg_nobg.png',
    'Pyramfang_s1': 'Pyramfang_s1_rare_nobg.png',
    'Pyramfang_s2': 'Pyramfang_s2_rare_nobg.png',
    'Pyramfang_s3': 'Pyramfang_s3_rare_nobg.png',
    'Pyranir_s1': 'Pyranir_s1_rare_nobg.png',
    'Pyranir_s2': 'Pyranir_s2_rare_nobg.png',
    'Pyranir_s3': 'Pyranir_s3_rare_nobg.png',
    'Pyralith_s1': 'Pyralith_s1_rare_nobg.png',
    'Pyralith_s2': 'Pyralith_s2_rare_nobg.png',
    'Pyralith_s3': 'Pyralith_s3_rare_nobg.png',
    'Pyramaw_s1': 'Pyramaw_s1_rare_nobg (1).png',
    'Pyramaw_s2': 'Pyramaw_s2_rare_nobg.png',
    'Pyramaw_s3': 'Pyramaw_s3_rare_nobg.png',
    'Tidecnback_s1': 'Tidecnback_s1_rare_nobg.png',
    'Tidecnback_s2': 'Tidecnback_s2_rare_nobg_nobg.png',
    'Tidecnback_s3': 'Tidecnback_s3_rare_nobg.png',
    'Tideckling_s1': 'Tideckling_s1_rare_nobg.png',
    'Tideckling_s2': 'Tideckling_s2_rare_nobg_nobg.png',
    'Tideckling_s3': 'Tideckling_s3_rare_nobg_nobg.png',
    'Tidecmfang_s1': 'Tidecmfang_s1_rare_nobg.png',
    'Tidecmfang_s2': 'Tidecmfang_s2_rare_nobg_nobg.png',
    'Tidecmfang_s3': 'Tidecmfang_s3_rare_nobg_nobg.png',
    'Tidecnir_s1': 'Tidecnir_s1_rare_nobg_nobg.png',
    'Tidecnir_s2': 'Tidecnir_s2_rare_nobg_nobg.png',
    'Tidecnir_s3': 'Tidecnir_s3_rare_nobg.png',
    'Tideclith_s1': 'Tideclith_s1_rare_nobg.png',
    'Tideclith_s2': 'Tideclith_s2_rare_nobg.png',
    'Tideclith_s3': 'Tideclith_s3_rare_nobg.png',
    'Tidecmaw_s1': 'Tidecmaw_s1_rare_nobg.png',
    'Tidecmaw_s2': 'Tidecmaw_s2_rare_nobg.png',
    'Tidecmaw_s3': 'Tidecmaw_s3_rare_nobg.png',
    'Thornkling_s1': 'Thornkling_s1_rare_nobg.png',
    'Thornkling_s2': 'Thornkling_s2_rare_nobg_nobg.png',
    'Thornkling_s3': 'Thornkling_s3_rare_nobg.png',
    'Thornmfang_s1': 'Thornmfang_s1_rare_nobg_nobg.png',
    'Thornmfang_s2': 'Thornmfang_s2_rare_nobg.png',
    'Thornmfang_s3': 'Thornmfang_s3_rare_nobg.png',
    'Thornnir_s1': 'Thornnir_s1_rare_nobg.png',
    'Thornnir_s2': 'Thornnir_s2_rare_nobg.png',
    'Thornnir_s3': 'Thornnir_s3_rare_nobg_nobg.png',
    'Thornlith_s1': 'Thornlith_s1_rare_nobg.png',
    'Thornlith_s2': 'Thornlith_s2_rare_nobg_nobg.png',
    'Thornlith_s3': 'Thornlith_s3_rare_nobg.png',
    'Thornmaw_s1': 'Thornmaw_s1_rare_nobg.png',
    'Thornmaw_s2': 'Thornmaw_s2_rare_nobg_nobg.png',
    'Thornmaw_s3': 'Thornmaw_s3_rare_nobg.png',
    'Zephkmfang_s1': 'Zephkmfang_s1_rare_nobg.png',
    'Zephkmfang_s2': 'Zephkmfang_s2_rare_nobg.png',
    'Zephkmfang_s3': 'Zephkmfang_s3_rare_nobg.png',
    'Zephknir_s1': 'Zephknir_s1_rare_nobg.png',
    'Zephknir_s2': 'Zephknir_s2_rare_nobg.png',
    'Zephknir_s3': 'Zephknir_s3_rare_nobg_nobg.png',
    'Zephklith_s1': 'Zephklith_s1_rare_nobg.png',
    'Zephklith_s2': 'Zephklith_s2_rare_nobg_nobg.png',
    'Zephklith_s3': 'Zephklith_s3_rare_nobg.png',
    'Zephkmaw_s1': 'Zephkmaw_s1_rare_nobg.png',
    'Zephkmaw_s2': 'Zephkmaw_s2_rare_nobg.png',
    'Zephkmaw_s3': 'Zephkmaw_s3_rare_nobg_nobg.png',
    'Gloomnir_s1': 'Gloomnir_s1_rare_nobg.png',
    'Gloomnir_s2': 'Gloomnir_s2_rare_nobg (1).png',
    'Gloomnir_s3': 'Gloomnir_s3_rare_nobg (1).png',
    'Gloomlith_s1': 'Gloomlith_s1_rare_nobg_nobg.png',
    'Gloomlith_s2': 'Gloomlith_s2_rare_nobg.png',
    'Gloomlith_s3': 'Gloomlith_s3_rare_nobg (1).png',
    'Gloommaw_s1': 'Gloommaw_s1_rare_nobg (1).png',
    'Gloommaw_s2': 'Gloommaw_s2_rare_nobg.png',
    'Gloommaw_s3': 'Gloommaw_s3_rare_nobg (1).png',
    'Sollith_s1': 'Sollith_s1_rare_nobg.png',
    'Sollith_s2': 'Sollith_s2_rare_nobg.png',
    'Sollith_s3': 'Sollith_s3_rare_nobg.png',
    'Solmaw_s1': 'Solmaw_s1_rare_nobg.png',
    'Solmaw_s2': 'Solmaw_s2_rare_nobg.png',
    'Solmaw_s3': 'Solmaw_s3_rare_nobg.png',
    'Mycemaw_s1': 'Mycemaw_s1_rare_nobg_nobg.png',
    'Mycemaw_s2': 'Mycemaw_s2_rare_nobg.png',
    'Mycemaw_s3': 'Mycemaw_s3_rare_nobg_nobg.png',
};

export const BASE_CREATURES = [
    'Pyralis', 'Tidecrawl', 'Thornback', 'Zephkling',
    'Gloomfang', 'Solnir', 'Mycelith', 'Vexmaw',
];

export const ELEMENTS: Record<string, ElementInfo> = {
    fire: { icon: '🔥', name: 'Fuego', color: '#ff6b35' },
    water: { icon: '💧', name: 'Agua', color: '#4fc1e9' },
    earth: { icon: '🌿', name: 'Tierra', color: '#7ec850' },
    air: { icon: '💨', name: 'Aire', color: '#c8d6e5' },
    shadow: { icon: '🌑', name: 'Sombra', color: '#9d4edd' },
    light: { icon: '✨', name: 'Luz', color: '#ffd93d' },
};

export const ELEMENT_ADVANTAGE: Record<string, string[]> = {
    fire: ['earth', 'air'],
    water: ['fire'],
    earth: ['air', 'water'],
    air: ['earth'],
    shadow: ['light'],
    light: ['shadow'],
};

export const BODY_STATS: Record<BodyType, Stats> = {
    quadruped: { hp: 12, atk: 10, def: 10, spd: 8 },
    serpentine: { hp: 10, atk: 8, def: 8, spd: 12 },
    avian: { hp: 8, atk: 9, def: 6, spd: 14 },
    biped: { hp: 10, atk: 12, def: 8, spd: 10 },
    insectoid: { hp: 9, atk: 11, def: 9, spd: 11 },
    amorphous: { hp: 14, atk: 7, def: 12, spd: 6 },
};

export const STAGE_MULT: Record<number, number> = { 1: 1.0, 2: 1.5, 3: 2.2 };
export const TIER_BONUS: Record<string, number> = { common: 1.0, rare: 1.15 };
export const EVOLUTION_LEVELS: Record<number, number> = { 2: 5, 3: 15 };

export function xpForLevel(level: number): number {
    return Math.floor(10 * Math.pow(level, 1.8));
}

export function getSpritePath(name: string, stage: number): string {
    const key = `${name}_s${stage}`;
    const filename = SPRITE_MAP[key];
    if (!filename) return `/Assets def/${name}_s${stage}.png`;
    return `/Assets def/${filename}`;
}

export function getEggSpritePath(name: string): string {
    const key = `${name}_egg`;
    const filename = SPRITE_MAP[key];
    if (!filename) return `/Assets def/${name}_egg.png`;
    return `/Assets def/${filename}`;
}

export function getCreatureTemplate(name: string): CreatureTemplate | undefined {
    return allCreatureData.find(c => c.name === name && c.stage === 1);
}

export function getFusionResult(parentAName: string, parentBName: string): CreatureTemplate | undefined {
    return allCreatureData.find(c =>
        c.type === 'fusion' && c.stage === 1 &&
        ((c.parentA === parentAName && c.parentB === parentBName) ||
            (c.parentA === parentBName && c.parentB === parentAName))
    );
}

export function getAllCreatureNames(): string[] {
    const names = new Set<string>();
    allCreatureData.forEach(c => { if (c.stage === 1) names.add(c.name); });
    return Array.from(names);
}

export function getAllCreatureEntries() {
    return allCreatureData.map(c => ({
        name: c.name,
        stage: c.stage,
        element: c.element,
        tier: c.tier,
        type: c.type,
        key: `${c.name}_s${c.stage}`,
    }));
}

export function getBaseStats(bodyType: BodyType, stage: number, tier: TierType): Stats {
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

export function hasElementAdvantage(attackerElement: string, defenderElement: string): boolean {
    return ELEMENT_ADVANTAGE[attackerElement]?.includes(defenderElement) || false;
}

export function getElementIcon(element: string): string {
    return ELEMENTS[element]?.icon || '❓';
}

export function getElementName(element: string): string {
    return ELEMENTS[element]?.name || element;
}

export async function loadCreatureData(): Promise<void> {
    try {
        const resp = await fetch('/chimera-forge-assets.json');
        allCreatureData = await resp.json();
    } catch (e) {
        console.error('Failed to load creature data:', e);
        allCreatureData = [];
    }
}

export function getAllCreatureData(): CreatureTemplate[] {
    return allCreatureData;
}
