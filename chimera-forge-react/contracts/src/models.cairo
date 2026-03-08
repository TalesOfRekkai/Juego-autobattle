use starknet::ContractAddress;

// ============================================
// MODELS — Onchain game state (ECS components)
// ============================================

// --- Player-level state ---

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerState {
    #[key]
    pub player: ContractAddress,
    pub game_started: bool,
    pub total_expeditions: u32,
    pub completed_expeditions: u32,
    pub tutorial_done: bool,
    /// Bitmask for completed missions (up to 64)
    pub missions_completed: u64,
    /// Bitmask for earned medals (up to 64)
    pub medals_earned: u64,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct ResourceInventory {
    #[key]
    pub player: ContractAddress,
    pub essence: u32,
    pub herbs: u32,
    pub egg_fragments: u32,
    pub crystals: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct BuildingState {
    #[key]
    pub player: ContractAddress,
    /// Levels 0-3 for each building
    pub incubator: u8,
    pub training: u8,
    pub expeditions: u8,
    pub fusion: u8,
    pub herbalist: u8,
    pub mine: u8,
}

// --- Creature instances ---

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct CreatureModel {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub creature_id: u32,
    /// Creature species name as felt252 short string
    pub name_hash: felt252,
    /// Element: 0=fire,1=water,2=earth,3=air,4=shadow,5=light
    pub element: u8,
    /// BodyType: 0=quadruped,1=serpentine,2=avian,3=biped,4=insectoid,5=amorphous
    pub body_type: u8,
    /// Tier: 0=common, 1=rare
    pub tier: u8,
    /// CreatureType: 0=base, 1=fusion
    pub creature_type: u8,
    pub stage: u8,
    pub level: u8,
    pub xp: u32,
    pub current_hp: u32,
    pub has_bred: bool,
    pub is_on_expedition: bool,
    pub parent_a_hash: felt252,
    pub parent_b_hash: felt252,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct CreatureCounter {
    #[key]
    pub player: ContractAddress,
    pub count: u32,
}

// --- Eggs ---

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct EggModel {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub egg_id: u32,
    /// Species name as felt252 short string
    pub name_hash: felt252,
    pub exists: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct EggCounter {
    #[key]
    pub player: ContractAddress,
    pub count: u32,
}

// --- Expeditions ---

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct ExpeditionModel {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub expedition_id: u32,
    /// Route identifier as felt252 short string
    pub route_id: felt252,
    /// Packed creature IDs (up to 4 creatures, 32 bits each => 128 bits)
    pub creature_id_1: u32,
    pub creature_id_2: u32,
    pub creature_id_3: u32,
    pub creature_count: u8,
    /// Timestamps
    pub start_time: u64,
    pub duration: u64,
    pub resolved: bool,
    pub exists: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct ExpeditionCounter {
    #[key]
    pub player: ContractAddress,
    pub count: u32,
}
