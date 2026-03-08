use starknet::ContractAddress;

#[starknet::interface]
pub trait IExpeditionActions<T> {
    fn start_expedition(ref self: T, route_id: felt252, creature_ids: Span<u32>, duration: u64);
    fn resolve_expedition(ref self: T, expedition_id: u32);
}

#[dojo::contract]
pub mod expedition_actions {
    use super::IExpeditionActions;
    use crate::models::{
        PlayerState, ResourceInventory, BuildingState,
        CreatureModel, CreatureCounter, EggModel, EggCounter,
        ExpeditionModel, ExpeditionCounter,
    };
    use crate::constants;

    use dojo::model::ModelStorage;
    use starknet::get_caller_address;
    use starknet::get_block_timestamp;
    use core::poseidon::poseidon_hash_span;

    #[abi(embed_v0)]
    impl ExpeditionActionsImpl of IExpeditionActions<ContractState> {
        /// Start an expedition with up to 3 creatures
        /// Duration is passed from frontend (route.duration * speed_buff) in seconds
        fn start_expedition(
            ref self: ContractState,
            route_id: felt252,
            creature_ids: Span<u32>,
            duration: u64,
        ) {
            let mut world = self.world_default();
            let player = get_caller_address();

            let count = creature_ids.len();
            assert(count >= 1 && count <= 3, 'Need 1-3 creatures');

            // Validate all creatures exist and are available
            let mut i: u32 = 0;
            loop {
                if i >= count {
                    break;
                }
                let cid = *creature_ids.at(i);
                let creature: CreatureModel = world.read_model((player, cid));
                assert(creature.name_hash != 0, 'Creature not found');
                assert(!creature.is_on_expedition, 'Already on expedition');
                i += 1;
            };

            // Mark creatures as on expedition
            i = 0;
            loop {
                if i >= count {
                    break;
                }
                let cid = *creature_ids.at(i);
                let mut creature: CreatureModel = world.read_model((player, cid));
                creature.is_on_expedition = true;
                world.write_model(@creature);
                i += 1;
            };

            // Create expedition
            let exp_counter: ExpeditionCounter = world.read_model(player);
            let exp_id = exp_counter.count + 1;
            world.write_model(@ExpeditionCounter { player, count: exp_id });

            // Apply expedition speed buff
            let buildings: BuildingState = world.read_model(player);
            let speed_mult = constants::get_expedition_speed_mult(buildings.expeditions);
            let adjusted_duration = duration * speed_mult.into() / 100;

            world.write_model(@ExpeditionModel {
                player,
                expedition_id: exp_id,
                route_id,
                creature_id_1: if count >= 1 { *creature_ids.at(0) } else { 0 },
                creature_id_2: if count >= 2 { *creature_ids.at(1) } else { 0 },
                creature_id_3: if count >= 3 { *creature_ids.at(2) } else { 0 },
                creature_count: count.try_into().unwrap(),
                start_time: get_block_timestamp(),
                duration: adjusted_duration,
                resolved: false,
                exists: true,
            });

            // Update player stats
            let mut player_state: PlayerState = world.read_model(player);
            player_state.total_expeditions += 1;
            world.write_model(@player_state);
        }

        /// Resolve a completed expedition
        fn resolve_expedition(ref self: ContractState, expedition_id: u32) {
            let mut world = self.world_default();
            let player = get_caller_address();

            let mut expedition: ExpeditionModel = world.read_model((player, expedition_id));
            assert(expedition.exists, 'Expedition not found');
            assert(!expedition.resolved, 'Already resolved');

            // Check time elapsed
            let now = get_block_timestamp();
            assert(now >= expedition.start_time + expedition.duration, 'Not yet complete');

            let buildings: BuildingState = world.read_model(player);

            // Gather creature IDs
            let mut creature_ids: Array<u32> = array![];
            if expedition.creature_count >= 1 { creature_ids.append(expedition.creature_id_1); }
            if expedition.creature_count >= 2 { creature_ids.append(expedition.creature_id_2); }
            if expedition.creature_count >= 3 { creature_ids.append(expedition.creature_id_3); }

            // Pseudo-random seed from block timestamp + player + expedition_id
            let mut seed_input = array![
                player.into(),
                expedition_id.into(),
                now.into(),
            ];
            let seed: u256 = poseidon_hash_span(seed_input.span()).into();

            // Resolve each creature: survival, XP, evolution
            let mut total_survived: u32 = 0;
            let mut i: u32 = 0;
            let xp_mult = constants::get_xp_multiplier(buildings.training);

            loop {
                if i >= creature_ids.len() {
                    break;
                }
                let cid = *creature_ids.at(i);
                let mut creature: CreatureModel = world.read_model((player, cid));

                // Survival check (70-95% base chance, modified by power)
                let creature_seed = seed + i.into();
                let survive_roll = creature_seed % 100;
                let survived = survive_roll < 80; // ~80% survival rate for simplicity

                if survived {
                    total_survived += 1;
                    // Apply XP (base 20, modified by training buff)
                    let xp_gain = 20 * xp_mult / 100;
                    creature.xp += xp_gain;

                    // Check level up & evolution
                    apply_level_ups(ref creature);

                    // HP recovery: 50% heal or auto-heal
                    if constants::has_auto_heal(buildings.herbalist) {
                        creature.current_hp = constants::get_max_hp(
                            creature.body_type, creature.stage, creature.tier, creature.level
                        );
                    } else {
                        let max_hp = constants::get_max_hp(
                            creature.body_type, creature.stage, creature.tier, creature.level
                        );
                        creature.current_hp = creature.current_hp + max_hp / 2;
                        if creature.current_hp > max_hp {
                            creature.current_hp = max_hp;
                        }
                    }
                } else {
                    creature.current_hp = 0;

                    // Auto-heal even fainted creatures if herbalist lv3
                    if constants::has_auto_heal(buildings.herbalist) {
                        creature.current_hp = constants::get_max_hp(
                            creature.body_type, creature.stage, creature.tier, creature.level
                        );
                    }
                }

                creature.is_on_expedition = false;
                world.write_model(@creature);
                i += 1;
            };

            // Calculate resource rewards (simplified: base amounts scaled by survival)
            let reward_seed = seed / 256;
            let base_essence = 5 + (reward_seed % 10).try_into().unwrap();
            let base_herbs = 1 + ((reward_seed / 16) % 5).try_into().unwrap();
            let base_fragments = (reward_seed / 256) % 5;
            let base_crystals = (reward_seed / 4096) % 3;

            let survival_ratio_100 = if creature_ids.len() > 0 {
                total_survived * 100 / creature_ids.len()
            } else { 0 };

            let bonus_crystals: u32 = constants::get_bonus_crystals(buildings.mine);

            let mut resources: ResourceInventory = world.read_model(player);
            resources.essence += (base_essence * survival_ratio_100 / 100).try_into().unwrap();
            resources.herbs += (base_herbs * survival_ratio_100 / 100).try_into().unwrap();
            resources.egg_fragments += (base_fragments * survival_ratio_100 / 100).try_into().unwrap();
            resources.crystals += (base_crystals * survival_ratio_100 / 100).try_into().unwrap() + bonus_crystals;
            world.write_model(@resources);

            // Egg drop chance (~15%)
            let egg_roll = (seed / 65536) % 100;
            if egg_roll < 15 {
                let egg_creature_idx: u32 = ((seed / 1048576) % constants::NUM_BASE_CREATURES.into()).try_into().unwrap();
                let egg_name = constants::get_base_creature_name(egg_creature_idx);

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

            // Mark expedition resolved
            expedition.resolved = true;
            world.write_model(@expedition);

            // Update player stats
            let mut player_state: PlayerState = world.read_model(player);
            player_state.completed_expeditions += 1;
            world.write_model(@player_state);
        }
    }

    // --- Internal helpers ---

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"cf")
        }
    }

    /// Apply level ups and evolution checks (same as game_actions)
    fn apply_level_ups(ref creature: CreatureModel) {
        loop {
            let next_level_xp = constants::xp_for_level(creature.level + 1);
            if creature.xp < next_level_xp {
                break;
            }
            creature.level += 1;

            if creature.stage < 2 && creature.level >= constants::EVOLUTION_STAGE_2_LEVEL {
                creature.stage = 2;
            }
            if creature.stage < 3 && creature.level >= constants::EVOLUTION_STAGE_3_LEVEL {
                creature.stage = 3;
            }

            creature.current_hp = constants::get_max_hp(
                creature.body_type, creature.stage, creature.tier, creature.level
            );
        };
    }
}
