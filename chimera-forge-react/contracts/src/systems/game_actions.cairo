use starknet::ContractAddress;

#[starknet::interface]
pub trait IGameActions<T> {
    fn new_game(ref self: T, player: ContractAddress);
    fn hatch_egg(ref self: T, player: ContractAddress, egg_id: u32);
    fn heal_creature(ref self: T, player: ContractAddress, creature_id: u32);
    fn boost_creature(ref self: T, player: ContractAddress, creature_id: u32);
    fn breed(ref self: T, player: ContractAddress, creature_a_id: u32, creature_b_id: u32, fusion_name: felt252, fusion_element: u8, fusion_body_type: u8);
    fn upgrade_building(ref self: T, player: ContractAddress, building_id: u8);
}

#[dojo::contract]
pub mod game_actions {
    use super::IGameActions;
    use crate::models::{
        PlayerState, ResourceInventory, BuildingState,
        CreatureModel, CreatureCounter, EggModel, EggCounter,
    };
    use crate::constants;

    use dojo::model::ModelStorage;
    use starknet::ContractAddress;
    use starknet::get_block_timestamp;
    use core::poseidon::poseidon_hash_span;

    #[abi(embed_v0)]
    impl GameActionsImpl of IGameActions<ContractState> {
        /// Initialize a new game for the given player
        fn new_game(ref self: ContractState, player: ContractAddress) {
            let mut world = self.world_default();

            // Check not already started
            let existing: PlayerState = world.read_model(player);
            assert(!existing.game_started, 'Game already started');

            // Create player state
            world.write_model(@PlayerState {
                player,
                game_started: true,
                total_expeditions: 0,
                completed_expeditions: 0,
                tutorial_done: false,
                missions_completed: 0,
                medals_earned: 0,
            });

            // Create starter resource inventory (enough to hatch first egg)
            world.write_model(@ResourceInventory {
                player,
                essence: 5,
                herbs: 3,
                egg_fragments: constants::FRAGMENTS_PER_HATCH, // Enough for first hatch
                crystals: 0,
            });

            // Create default buildings (all level 0)
            world.write_model(@BuildingState {
                player,
                incubator: 0,
                training: 0,
                expeditions: 0,
                fusion: 0,
                herbalist: 0,
                mine: 0,
            });

            // Initialize counters
            world.write_model(@CreatureCounter { player, count: 0 });
            world.write_model(@EggCounter { player, count: 0 });

            // Create first random egg
            let timestamp = get_block_timestamp();
            let mut hash_input = array![player.into(), timestamp.into()];
            let hash = poseidon_hash_span(hash_input.span());
            let hash_u256: u256 = hash.into();
            let creature_index: u32 = (hash_u256 % constants::NUM_BASE_CREATURES.into()).try_into().unwrap();
            let egg_name = constants::get_base_creature_name(creature_index);

            let egg_counter: EggCounter = world.read_model(player);
            let egg_id = egg_counter.count + 1;
            world.write_model(@EggCounter { player, count: egg_id });
            world.write_model(@EggModel {
                player,
                egg_id,
                name_hash: egg_name,
                exists: true,
            });
        }

        /// Hatch an egg: spend fragments, create creature
        fn hatch_egg(ref self: ContractState, player: ContractAddress, egg_id: u32) {
            let mut world = self.world_default();

            // Read egg
            let egg: EggModel = world.read_model((player, egg_id));
            assert(egg.exists, 'Egg does not exist');

            // Check & spend fragment cost
            let buildings: BuildingState = world.read_model(player);
            let cost = constants::get_hatch_cost(buildings.incubator);
            if cost > 0 {
                let mut resources: ResourceInventory = world.read_model(player);
                assert(resources.egg_fragments >= cost, 'Not enough fragments');
                resources.egg_fragments -= cost;
                world.write_model(@resources);
            }

            // Delete egg
            world.write_model(@EggModel {
                player, egg_id, name_hash: egg.name_hash, exists: false,
            });

            // Create creature
            let creature_counter: CreatureCounter = world.read_model(player);
            let new_id = creature_counter.count + 1;
            world.write_model(@CreatureCounter { player, count: new_id });

            // Determine element and body_type from name_hash
            // Frontend provides the template data; onchain we use hash-based defaults
            // The creature's element/body come from the JSON mapped by the frontend
            // For onchain, we derive basic defaults from the name hash
            let (element, body_type) = get_creature_defaults(egg.name_hash);
            let max_hp = constants::get_max_hp(body_type, 1, 0, 1); // stage 1, common, level 1

            world.write_model(@CreatureModel {
                player,
                creature_id: new_id,
                name_hash: egg.name_hash,
                element,
                body_type,
                tier: 0, // common
                creature_type: 0, // base
                stage: 1,
                level: 1,
                xp: 0,
                current_hp: max_hp,
                has_bred: false,
                is_on_expedition: false,
                parent_a_hash: 0,
                parent_b_hash: 0,
            });
        }

        /// Heal a creature to full HP
        fn heal_creature(ref self: ContractState, player: ContractAddress, creature_id: u32) {
            let mut world = self.world_default();

            let mut creature: CreatureModel = world.read_model((player, creature_id));
            assert(creature.name_hash != 0, 'Creature not found');

            let buildings: BuildingState = world.read_model(player);
            let cost = constants::get_heal_cost(buildings.herbalist);

            let mut resources: ResourceInventory = world.read_model(player);
            assert(resources.herbs >= cost, 'Not enough herbs');
            resources.herbs -= cost;
            world.write_model(@resources);

            // Heal to max
            let max_hp = constants::get_max_hp(creature.body_type, creature.stage, creature.tier, creature.level);
            creature.current_hp = max_hp;
            world.write_model(@creature);
        }

        /// Boost a creature with XP
        fn boost_creature(ref self: ContractState, player: ContractAddress, creature_id: u32) {
            let mut world = self.world_default();

            let mut creature: CreatureModel = world.read_model((player, creature_id));
            assert(creature.name_hash != 0, 'Creature not found');

            let buildings: BuildingState = world.read_model(player);
            let cost = constants::get_boost_cost(buildings.training);

            let mut resources: ResourceInventory = world.read_model(player);
            assert(resources.essence >= cost, 'Not enough essence');
            resources.essence -= cost;
            world.write_model(@resources);

            // Add XP with training multiplier
            let xp_mult = constants::get_xp_multiplier(buildings.training);
            let xp_gain = constants::BOOST_XP_GAIN * xp_mult / 100;
            creature.xp += xp_gain;

            // Check level up & evolution
            apply_level_ups(ref creature);
            world.write_model(@creature);
        }

        /// Breed two creatures to create a fusion creature directly
        fn breed(
            ref self: ContractState,
            player: ContractAddress,
            creature_a_id: u32,
            creature_b_id: u32,
            fusion_name: felt252,
            fusion_element: u8,
            fusion_body_type: u8,
        ) {
            let mut world = self.world_default();

            let mut creature_a: CreatureModel = world.read_model((player, creature_a_id));
            let mut creature_b: CreatureModel = world.read_model((player, creature_b_id));

            assert(creature_a.name_hash != 0, 'Creature A not found');
            assert(creature_b.name_hash != 0, 'Creature B not found');
            assert(creature_a_id != creature_b_id, 'Cannot breed same creature');
            assert(!creature_a.has_bred, 'Creature A already bred');
            assert(!creature_b.has_bred, 'Creature B already bred');
            assert(!creature_a.is_on_expedition, 'Creature A on expedition');
            assert(!creature_b.is_on_expedition, 'Creature B on expedition');

            // Check level requirement with fusion buff
            let buildings: BuildingState = world.read_model(player);
            let min_level = constants::get_breed_min_level(buildings.fusion);
            assert(creature_a.level >= min_level, 'Creature A level too low');
            assert(creature_b.level >= min_level, 'Creature B level too low');

            // Mark parents as bred
            creature_a.has_bred = true;
            creature_b.has_bred = true;
            world.write_model(@creature_a);
            world.write_model(@creature_b);

            // Create fusion creature directly (matches current game loop)
            let creature_counter: CreatureCounter = world.read_model(player);
            let new_id = creature_counter.count + 1;
            world.write_model(@CreatureCounter { player, count: new_id });

            let max_hp = constants::get_max_hp(fusion_body_type, 1, 1, 1); // stage 1, rare, level 1

            world.write_model(@CreatureModel {
                player,
                creature_id: new_id,
                name_hash: fusion_name,
                element: fusion_element,
                body_type: fusion_body_type,
                tier: 1, // rare (fusions are always rare)
                creature_type: 1, // fusion
                stage: 1,
                level: 1,
                xp: 0,
                current_hp: max_hp,
                has_bred: false,
                is_on_expedition: false,
                parent_a_hash: creature_a.name_hash,
                parent_b_hash: creature_b.name_hash,
            });
        }

        /// Upgrade a building (building_id: 0=incubator, 1=training, 2=expeditions, 3=fusion, 4=herbalist, 5=mine)
        fn upgrade_building(ref self: ContractState, player: ContractAddress, building_id: u8) {
            let mut world = self.world_default();

            let mut buildings: BuildingState = world.read_model(player);
            let current_level = get_building_level(ref buildings, building_id);
            assert(current_level < constants::MAX_BUILDING_LEVEL, 'Already max level');

            // Check and spend costs
            let mut resources: ResourceInventory = world.read_model(player);
            let (essence_cost, crystals_cost, herbs_cost) = get_building_cost(building_id, current_level);

            assert(resources.essence >= essence_cost, 'Not enough essence');
            assert(resources.crystals >= crystals_cost, 'Not enough crystals');
            assert(resources.herbs >= herbs_cost, 'Not enough herbs');

            resources.essence -= essence_cost;
            resources.crystals -= crystals_cost;
            resources.herbs -= herbs_cost;
            world.write_model(@resources);

            // Increment building level
            set_building_level(ref buildings, building_id, current_level + 1);
            world.write_model(@buildings);
        }
    }

    // --- Internal helpers ---

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"cf")
        }
    }

    fn get_building_level(ref buildings: BuildingState, building_id: u8) -> u8 {
        if building_id == 0 { buildings.incubator }
        else if building_id == 1 { buildings.training }
        else if building_id == 2 { buildings.expeditions }
        else if building_id == 3 { buildings.fusion }
        else if building_id == 4 { buildings.herbalist }
        else { buildings.mine }
    }

    fn set_building_level(ref buildings: BuildingState, building_id: u8, level: u8) {
        if building_id == 0 { buildings.incubator = level; }
        else if building_id == 1 { buildings.training = level; }
        else if building_id == 2 { buildings.expeditions = level; }
        else if building_id == 3 { buildings.fusion = level; }
        else if building_id == 4 { buildings.herbalist = level; }
        else { buildings.mine = level; }
    }

    fn get_building_cost(building_id: u8, current_level: u8) -> (u32, u32, u32) {
        let idx: usize = current_level.into();
        if building_id == 0 { // incubator
            (*constants::INCUBATOR_COST_ESSENCE.span().at(idx),
             *constants::INCUBATOR_COST_CRYSTALS.span().at(idx), 0)
        } else if building_id == 1 { // training
            (*constants::TRAINING_COST_ESSENCE.span().at(idx),
             *constants::TRAINING_COST_CRYSTALS.span().at(idx), 0)
        } else if building_id == 2 { // expeditions
            (*constants::EXPEDITIONS_COST_ESSENCE.span().at(idx),
             *constants::EXPEDITIONS_COST_CRYSTALS.span().at(idx), 0)
        } else if building_id == 3 { // fusion
            (*constants::FUSION_COST_ESSENCE.span().at(idx),
             *constants::FUSION_COST_CRYSTALS.span().at(idx), 0)
        } else if building_id == 4 { // herbalist
            (*constants::HERBALIST_COST_ESSENCE.span().at(idx),
             *constants::HERBALIST_COST_CRYSTALS.span().at(idx),
             *constants::HERBALIST_COST_HERBS.span().at(idx))
        } else { // mine
            (*constants::MINE_COST_ESSENCE.span().at(idx),
             *constants::MINE_COST_CRYSTALS.span().at(idx),
             *constants::MINE_COST_HERBS.span().at(idx))
        }
    }

    /// Apply level ups and evolution checks to a creature
    fn apply_level_ups(ref creature: CreatureModel) {
        loop {
            let next_level_xp = constants::xp_for_level(creature.level + 1);
            if creature.xp < next_level_xp {
                break;
            }
            creature.level += 1;

            // Check evolution
            if creature.stage < 2 && creature.level >= constants::EVOLUTION_STAGE_2_LEVEL {
                creature.stage = 2;
            }
            if creature.stage < 3 && creature.level >= constants::EVOLUTION_STAGE_3_LEVEL {
                creature.stage = 3;
            }

            // Heal on level up
            creature.current_hp = constants::get_max_hp(
                creature.body_type, creature.stage, creature.tier, creature.level
            );
        };
    }

    /// Get default element and body_type for base creatures from name hash
    fn get_creature_defaults(name_hash: felt252) -> (u8, u8) {
        if name_hash == constants::CREATURE_PYRALIS { (constants::ELEMENT_FIRE, constants::BODY_QUADRUPED) }
        else if name_hash == constants::CREATURE_TIDECRAWL { (constants::ELEMENT_WATER, constants::BODY_SERPENTINE) }
        else if name_hash == constants::CREATURE_THORNBACK { (constants::ELEMENT_EARTH, constants::BODY_QUADRUPED) }
        else if name_hash == constants::CREATURE_ZEPHKLING { (constants::ELEMENT_AIR, constants::BODY_AVIAN) }
        else if name_hash == constants::CREATURE_GLOOMFANG { (constants::ELEMENT_SHADOW, constants::BODY_INSECTOID) }
        else if name_hash == constants::CREATURE_SOLNIR { (constants::ELEMENT_LIGHT, constants::BODY_BIPED) }
        else if name_hash == constants::CREATURE_MYCELITH { (constants::ELEMENT_EARTH, constants::BODY_AMORPHOUS) }
        else if name_hash == constants::CREATURE_VEXMAW { (constants::ELEMENT_SHADOW, constants::BODY_SERPENTINE) }
        else { (0, 0) } // Unknown - use fire/quadruped as fallback
    }
}
