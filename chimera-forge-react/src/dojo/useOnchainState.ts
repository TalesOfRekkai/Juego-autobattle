/* ============================================
   USE ONCHAIN STATE — Bridge between Torii and GameState
   
   Subscribes to Torii indexer and maps onchain models 
   back to the existing GameState TypeScript interface.
   This lets existing screens keep working with minimal changes.
   ============================================ */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Creature, Egg, Expedition, GameState } from '../types';

// felt252 short string → JS string
function fromFelt252(felt: string | bigint): string {
    const hex = typeof felt === 'string' ? felt : '0x' + felt.toString(16);
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    let str = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
        const charCode = parseInt(cleanHex.slice(i, i + 2), 16);
        if (charCode === 0) break;
        str += String.fromCharCode(charCode);
    }
    return str;
}

// Element enum (u8) → string
const ELEMENT_MAP: Record<number, string> = {
    0: 'fire', 1: 'water', 2: 'earth', 3: 'air', 4: 'shadow', 5: 'light',
};

// BodyType enum (u8) → string
const BODY_TYPE_MAP: Record<number, string> = {
    0: 'quadruped', 1: 'serpentine', 2: 'avian', 3: 'biped', 4: 'insectoid', 5: 'amorphous',
};

interface OnchainStateResult {
    state: GameState;
    loading: boolean;
    refresh: () => void;
}

/**
 * Polls Torii via GraphQL to read player state and maps it to GameState.
 * For a game jam, polling is simpler and more reliable than WebSocket subscriptions.
 */
export function useOnchainState(playerAddress: string | null, toriiUrl: string): OnchainStateResult {
    const [state, setState] = useState<GameState>(createEmptyState());
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchState = useCallback(async () => {
        if (!playerAddress) {
            setState(createEmptyState());
            setLoading(false);
            return;
        }

        try {
            // Query all models for this player via Torii gRPC/GraphQL
            const response = await fetch(`${toriiUrl}/graphql`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: buildPlayerQuery(playerAddress),
                }),
            });

            const data = await response.json();
            const parsed = parseGraphQLResponse(data, playerAddress);
            setState(parsed);
        } catch (error) {
            console.error('Failed to fetch onchain state:', error);
        } finally {
            setLoading(false);
        }
    }, [playerAddress, toriiUrl]);

    // Initial fetch + polling interval
    useEffect(() => {
        fetchState();
        // Poll every 3 seconds for state updates
        intervalRef.current = setInterval(fetchState, 3000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchState]);

    return { state, loading, refresh: fetchState };
}

// ---- GraphQL Query ----
function buildPlayerQuery(playerAddress: string): string {
    return `{
        cfPlayerStateModels(where: { player: "${playerAddress}" }) {
            edges { node {
                player
                game_started
                total_expeditions
                completed_expeditions
                tutorial_done
                missions_completed
                medals_earned
            }}
        }
        cfResourceInventoryModels(where: { player: "${playerAddress}" }) {
            edges { node {
                essence
                herbs
                egg_fragments
                crystals
            }}
        }
        cfBuildingStateModels(where: { player: "${playerAddress}" }) {
            edges { node {
                incubator
                training
                expeditions
                fusion
                herbalist
                mine
            }}
        }
        cfCreatureModelModels(where: { player: "${playerAddress}" }) {
            edges { node {
                creature_id
                name_hash
                element
                body_type
                tier
                creature_type
                stage
                level
                xp
                current_hp
                has_bred
                is_on_expedition
                parent_a_hash
                parent_b_hash
            }}
        }
        cfEggModelModels(where: { player: "${playerAddress}" }) {
            edges { node {
                egg_id
                name_hash
                exists
            }}
        }
        cfExpeditionModelModels(where: { player: "${playerAddress}" }) {
            edges { node {
                expedition_id
                route_id
                creature_id_1
                creature_id_2
                creature_id_3
                creature_count
                start_time
                duration
                resolved
                exists
            }}
        }
    }`;
}

// ---- Parse Response ----
function parseGraphQLResponse(data: any, _playerAddress: string): GameState {
    const state = createEmptyState();

    try {
        // Player State
        const playerNodes = data?.data?.cfPlayerStateModels?.edges;
        if (playerNodes?.length > 0) {
            const p = playerNodes[0].node;
            state.totalExpeditions = Number(p.total_expeditions || 0);
            state.completedExpeditions = Number(p.completed_expeditions || 0);
            state.tutorialDone = Boolean(p.tutorial_done);
            // Parse missions/medals bitmaps
            const missionBits = BigInt(p.missions_completed || '0');
            const medalBits = BigInt(p.medals_earned || '0');
            state.completedMissionIds = parseBitmapToIds(missionBits, MISSION_IDS);
            state.earnedMedals = parseBitmapToIds(medalBits, MEDAL_IDS);
        }

        // Resources
        const resNodes = data?.data?.cfResourceInventoryModels?.edges;
        if (resNodes?.length > 0) {
            const r = resNodes[0].node;
            state.resources = {
                essence: Number(r.essence || 0),
                herbs: Number(r.herbs || 0),
                eggFragments: Number(r.egg_fragments || 0),
                crystals: Number(r.crystals || 0),
            };
        }

        // Buildings
        const buildNodes = data?.data?.cfBuildingStateModels?.edges;
        if (buildNodes?.length > 0) {
            const b = buildNodes[0].node;
            state.buildings = {
                incubator: Number(b.incubator || 0),
                training: Number(b.training || 0),
                expeditions: Number(b.expeditions || 0),
                fusion: Number(b.fusion || 0),
                herbalist: Number(b.herbalist || 0),
                mine: Number(b.mine || 0),
            };
        }

        // Creatures
        const creatureNodes = data?.data?.cfCreatureModelModels?.edges;
        if (creatureNodes) {
            state.creatures = creatureNodes
                .map((e: any) => e.node)
                .filter((c: any) => c.name_hash && c.name_hash !== '0x0')
                .map((c: any) => mapCreature(c));

            // Build discoveries from owned creatures
            const discoveredNames = new Set<string>();
            const discoveredKeys = new Set<string>();
            state.creatures.forEach(c => {
                discoveredNames.add(c.name);
                discoveredKeys.add(`${c.name}_s${c.stage}`);
            });
            state.discoveredNames = Array.from(discoveredNames);
            state.discoveredKeys = Array.from(discoveredKeys);
        }

        // Eggs
        const eggNodes = data?.data?.cfEggModelModels?.edges;
        if (eggNodes) {
            state.eggs = eggNodes
                .map((e: any) => e.node)
                .filter((e: any) => e.exists)
                .map((e: any): Egg => ({
                    name: fromFelt252(e.name_hash),
                    id: Number(e.egg_id),
                }));
        }

        // Expeditions
        const expNodes = data?.data?.cfExpeditionModelModels?.edges;
        if (expNodes) {
            state.expeditions = expNodes
                .map((e: any) => e.node)
                .filter((e: any) => e.exists && !e.resolved)
                .map((e: any): Expedition => {
                    const creatureIds: number[] = [];
                    const count = Number(e.creature_count || 0);
                    if (count >= 1) creatureIds.push(Number(e.creature_id_1));
                    if (count >= 2) creatureIds.push(Number(e.creature_id_2));
                    if (count >= 3) creatureIds.push(Number(e.creature_id_3));

                    return {
                        id: Number(e.expedition_id),
                        routeId: fromFelt252(e.route_id),
                        creatureIds,
                        startTime: Number(e.start_time) * 1000, // seconds → ms
                        duration: Number(e.duration) * 1000,
                        resolved: Boolean(e.resolved),
                    };
                });
        }

        // If we have a player state with game_started, set phase to hub
        if (playerNodes?.length > 0 && playerNodes[0].node.game_started) {
            state.phase = state.eggs.length > 0 && state.creatures.length === 0 ? 'egg_hatch' : 'hub';
        }

    } catch (error) {
        console.error('Error parsing onchain state:', error);
    }

    return state;
}

function mapCreature(c: any): Creature {
    return {
        id: Number(c.creature_id),
        name: fromFelt252(c.name_hash),
        element: ELEMENT_MAP[Number(c.element)] as any || 'fire',
        bodyType: BODY_TYPE_MAP[Number(c.body_type)] as any || 'quadruped',
        traits: [],
        type: Number(c.creature_type) === 0 ? 'base' : 'fusion',
        tier: Number(c.tier) === 0 ? 'common' : 'rare',
        stage: Number(c.stage),
        level: Number(c.level),
        xp: Number(c.xp),
        hasBred: Boolean(c.has_bred),
        isOnExpedition: Boolean(c.is_on_expedition),
        currentHP: Number(c.current_hp),
        parentA: c.parent_a_hash && c.parent_a_hash !== '0x0' ? fromFelt252(c.parent_a_hash) : null,
        parentB: c.parent_b_hash && c.parent_b_hash !== '0x0' ? fromFelt252(c.parent_b_hash) : null,
    };
}

function createEmptyState(): GameState {
    return {
        phase: 'title',
        creatures: [],
        eggs: [],
        resources: { essence: 0, herbs: 0, eggFragments: 0, crystals: 0 },
        expeditions: [],
        discoveredNames: [],
        discoveredKeys: [],
        totalExpeditions: 0,
        completedExpeditions: 0,
        completedMissionIds: [],
        earnedMedals: [],
        tutorialDone: false,
        buildings: { incubator: 0, training: 0, expeditions: 0, fusion: 0, herbalist: 0, mine: 0 },
    };
}

// Mission/medal ID lists (matching missions.ts order)
const MISSION_IDS = [
    'first_steps', 'seasoned_explorer', 'rookie_bestiary', 'bestiary_hunter',
    'first_fusion', 'chimera_smith', 'final_form', 'growing_team',
];

const MEDAL_IDS = [
    'medal_first_steps', 'medal_seasoned_explorer', 'medal_rookie_bestiary', 'medal_bestiary_hunter',
    'medal_first_fusion', 'medal_chimera_smith', 'medal_final_form', 'medal_growing_team',
];

function parseBitmapToIds(bitmap: bigint, idList: string[]): string[] {
    const result: string[] = [];
    for (let i = 0; i < idList.length; i++) {
        if (bitmap & (1n << BigInt(i))) {
            result.push(idList[i]);
        }
    }
    return result;
}
