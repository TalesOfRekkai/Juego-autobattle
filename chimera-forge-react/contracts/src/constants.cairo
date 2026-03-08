// ============================================
// CONSTANTS — Game logic parameters (onchain source of truth)
// ============================================

// --- Base stats per body type [hp, atk, def, spd] ---
// Index by body_type enum value (0-5)
pub const BODY_HP: [u32; 6] = [12, 10, 8, 10, 9, 14];
pub const BODY_ATK: [u32; 6] = [10, 8, 9, 12, 11, 7];
pub const BODY_DEF: [u32; 6] = [10, 8, 6, 8, 9, 12];
pub const BODY_SPD: [u32; 6] = [8, 12, 14, 10, 11, 6];

// --- Stage multipliers (x100 to avoid floats) ---
pub const STAGE_MULT_1: u32 = 100; // 1.0
pub const STAGE_MULT_2: u32 = 150; // 1.5
pub const STAGE_MULT_3: u32 = 220; // 2.2

// --- Tier bonus (x100) ---
pub const TIER_COMMON: u32 = 100; // 1.0
pub const TIER_RARE: u32 = 115;   // 1.15

// --- Evolution thresholds ---
pub const EVOLUTION_STAGE_2_LEVEL: u8 = 5;
pub const EVOLUTION_STAGE_3_LEVEL: u8 = 15;

// --- Resources ---
pub const FRAGMENTS_PER_HATCH: u32 = 10;
pub const HEAL_HERB_COST: u32 = 2;
pub const BOOST_ESSENCE_COST: u32 = 5;
pub const BOOST_XP_GAIN: u32 = 15;
pub const BREED_MIN_LEVEL: u8 = 5;

// --- Building max level ---
pub const MAX_BUILDING_LEVEL: u8 = 3;

// --- Building costs [essence, crystals, herbs] per level (0=lv1, 1=lv2, 2=lv3) ---
// Incubator
pub const INCUBATOR_COST_ESSENCE: [u32; 3] = [20, 50, 100];
pub const INCUBATOR_COST_CRYSTALS: [u32; 3] = [2, 5, 10];
// Training
pub const TRAINING_COST_ESSENCE: [u32; 3] = [15, 40, 80];
pub const TRAINING_COST_CRYSTALS: [u32; 3] = [1, 4, 8];
// Expeditions tower
pub const EXPEDITIONS_COST_ESSENCE: [u32; 3] = [25, 60, 120];
pub const EXPEDITIONS_COST_CRYSTALS: [u32; 3] = [2, 6, 12];
// Fusion
pub const FUSION_COST_ESSENCE: [u32; 3] = [30, 70, 140];
pub const FUSION_COST_CRYSTALS: [u32; 3] = [3, 7, 15];
// Herbalist
pub const HERBALIST_COST_ESSENCE: [u32; 3] = [15, 35, 75];
pub const HERBALIST_COST_HERBS: [u32; 3] = [10, 20, 30];
pub const HERBALIST_COST_CRYSTALS: [u32; 3] = [0, 3, 6];
// Mine
pub const MINE_COST_ESSENCE: [u32; 3] = [30, 60, 120];
pub const MINE_COST_CRYSTALS: [u32; 3] = [0, 5, 10];
pub const MINE_COST_HERBS: [u32; 3] = [10, 0, 0];

// --- Base creature names as felt252 short strings ---
pub const CREATURE_PYRALIS: felt252 = 'Pyralis';
pub const CREATURE_TIDECRAWL: felt252 = 'Tidecrawl';
pub const CREATURE_THORNBACK: felt252 = 'Thornback';
pub const CREATURE_ZEPHKLING: felt252 = 'Zephkling';
pub const CREATURE_GLOOMFANG: felt252 = 'Gloomfang';
pub const CREATURE_SOLNIR: felt252 = 'Solnir';
pub const CREATURE_MYCELITH: felt252 = 'Mycelith';
pub const CREATURE_VEXMAW: felt252 = 'Vexmaw';

pub const NUM_BASE_CREATURES: u32 = 8;

// Element constants
pub const ELEMENT_FIRE: u8 = 0;
pub const ELEMENT_WATER: u8 = 1;
pub const ELEMENT_EARTH: u8 = 2;
pub const ELEMENT_AIR: u8 = 3;
pub const ELEMENT_SHADOW: u8 = 4;
pub const ELEMENT_LIGHT: u8 = 5;

// Body type constants
pub const BODY_QUADRUPED: u8 = 0;
pub const BODY_SERPENTINE: u8 = 1;
pub const BODY_AVIAN: u8 = 2;
pub const BODY_BIPED: u8 = 3;
pub const BODY_INSECTOID: u8 = 4;
pub const BODY_AMORPHOUS: u8 = 5;

// ============================================
// Helper functions
// ============================================

/// XP required to reach a given level: floor(10 * level^1.8)
/// Using integer approximation
pub fn xp_for_level(level: u8) -> u32 {
    if level <= 1 {
        return 0;
    }
    let l: u32 = level.into();
    // Approximate level^1.8 using l * l * 100 / (l^0.2 approx)
    // Simplified: 10 * l * l for reasonable approximation at game-jam scope
    10_u32 * l * l
}

/// Get base HP for a body type, stage, and tier
pub fn get_base_stat_hp(body_type: u8, stage: u8, tier: u8) -> u32 {
    let base = *BODY_HP.span().at(body_type.into());
    let stage_mult = get_stage_mult(stage);
    let tier_mult = get_tier_mult(tier);
    base * stage_mult * tier_mult / 10000 // Divide by 100*100
}

/// Get max HP for a creature given its stats
pub fn get_max_hp(body_type: u8, stage: u8, tier: u8, level: u8) -> u32 {
    let base_hp = get_base_stat_hp(body_type, stage, tier);
    let level_bonus = 100 + (level.into() - 1_u32) * 8; // x100
    base_hp * level_bonus / 100
}

/// Get total power for expedition calculations
pub fn get_power(body_type: u8, stage: u8, tier: u8, level: u8) -> u32 {
    let stage_mult = get_stage_mult(stage);
    let tier_mult = get_tier_mult(tier);
    let level_bonus = 100 + (level.into() - 1_u32) * 8;
    let bt: usize = body_type.into();
    let hp = *BODY_HP.span().at(bt) * stage_mult * tier_mult * level_bonus / 1000000;
    let atk = *BODY_ATK.span().at(bt) * stage_mult * tier_mult * level_bonus / 1000000;
    let def = *BODY_DEF.span().at(bt) * stage_mult * tier_mult * level_bonus / 1000000;
    let spd = *BODY_SPD.span().at(bt) * stage_mult * tier_mult * level_bonus / 1000000;
    hp + atk + def + spd
}

fn get_stage_mult(stage: u8) -> u32 {
    if stage == 1 { STAGE_MULT_1 }
    else if stage == 2 { STAGE_MULT_2 }
    else { STAGE_MULT_3 }
}

fn get_tier_mult(tier: u8) -> u32 {
    if tier == 0 { TIER_COMMON }
    else { TIER_RARE }
}

/// Get effective hatch fragment cost with incubator buff
pub fn get_hatch_cost(incubator_level: u8) -> u32 {
    if incubator_level >= 3 { return 0; }
    if FRAGMENTS_PER_HATCH > incubator_level.into() {
        FRAGMENTS_PER_HATCH - incubator_level.into()
    } else {
        0
    }
}

/// Get effective breed min level with fusion buff
pub fn get_breed_min_level(fusion_level: u8) -> u8 {
    if fusion_level >= 3 { return 0; }
    if BREED_MIN_LEVEL > fusion_level {
        BREED_MIN_LEVEL - fusion_level
    } else {
        0
    }
}

/// Get heal herb cost with herbalist buff
pub fn get_heal_cost(herbalist_level: u8) -> u32 {
    if herbalist_level >= 1 { 1 } else { HEAL_HERB_COST }
}

/// Get XP multiplier (x100) with training buff
pub fn get_xp_multiplier(training_level: u8) -> u32 {
    if training_level == 0 { 100 }
    else if training_level == 1 { 125 }
    else if training_level == 2 { 150 }
    else { 200 }
}

/// Get expedition speed multiplier (x100) - lower = faster
pub fn get_expedition_speed_mult(expeditions_level: u8) -> u32 {
    if expeditions_level == 0 { 100 }
    else if expeditions_level == 1 { 85 }
    else if expeditions_level == 2 { 70 }
    else { 50 }
}

/// Get bonus crystals per expedition from mine
pub fn get_bonus_crystals(mine_level: u8) -> u32 {
    if mine_level >= 3 { 3 }
    else if mine_level >= 2 { 2 }
    else if mine_level >= 1 { 1 }
    else { 0 }
}

/// Whether auto-heal is active (herbalist lv3)
pub fn has_auto_heal(herbalist_level: u8) -> bool {
    herbalist_level >= 3
}

/// Get boost essence cost with training discount
pub fn get_boost_cost(training_level: u8) -> u32 {
    if training_level >= 3 {
        if BOOST_ESSENCE_COST > 2 { BOOST_ESSENCE_COST - 2 } else { 1 }
    } else {
        BOOST_ESSENCE_COST
    }
}

/// Get a base creature name by index (0-7)
pub fn get_base_creature_name(index: u32) -> felt252 {
    if index == 0 { CREATURE_PYRALIS }
    else if index == 1 { CREATURE_TIDECRAWL }
    else if index == 2 { CREATURE_THORNBACK }
    else if index == 3 { CREATURE_ZEPHKLING }
    else if index == 4 { CREATURE_GLOOMFANG }
    else if index == 5 { CREATURE_SOLNIR }
    else if index == 6 { CREATURE_MYCELITH }
    else { CREATURE_VEXMAW }
}
