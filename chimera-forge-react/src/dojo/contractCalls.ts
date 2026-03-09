/* ============================================
   CONTRACT CALLS — TypeScript wrappers for onchain actions
   
   All functions accept a playerAddress (Controller wallet)
   which is passed as the first contract parameter.
   This allows each authenticated user to have their own game state.
   ============================================ */

import { type Account, type Call, CallData } from 'starknet';

// Contract addresses — filled after deployment via manifest
// These will be set dynamically from the manifest
let gameActionsAddress = '';
let expeditionActionsAddress = '';

export function setContractAddresses(manifest: { contracts: Array<{ tag: string; address: string }> }) {
    const ga = manifest.contracts.find(c => c.tag === 'cf-game_actions');
    const ea = manifest.contracts.find(c => c.tag === 'cf-expedition_actions');
    if (ga) gameActionsAddress = ga.address;
    if (ea) expeditionActionsAddress = ea.address;
}

// Helper: felt252 short string from JS string
function toFelt252(str: string): string {
    let hex = '0x';
    for (let i = 0; i < str.length && i < 31; i++) {
        hex += str.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex;
}

// Helper: build a call object
function buildCall(contractAddress: string, entrypoint: string, calldata: (string | number | bigint)[]): Call {
    return {
        contractAddress,
        entrypoint,
        calldata: CallData.compile(calldata.map(v => v.toString())),
    };
}

// ==================== GAME ACTIONS ====================

export function callNewGame(playerAddress: string): Call {
    return buildCall(gameActionsAddress, 'new_game', [playerAddress]);
}

export function callHatchEgg(playerAddress: string, eggId: number): Call {
    return buildCall(gameActionsAddress, 'hatch_egg', [playerAddress, eggId]);
}

export function callHealCreature(playerAddress: string, creatureId: number): Call {
    return buildCall(gameActionsAddress, 'heal_creature', [playerAddress, creatureId]);
}

export function callBoostCreature(playerAddress: string, creatureId: number): Call {
    return buildCall(gameActionsAddress, 'boost_creature', [playerAddress, creatureId]);
}

export function callBreed(
    playerAddress: string,
    creatureAId: number,
    creatureBId: number,
    fusionName: string,
    fusionElement: number,
    fusionBodyType: number,
): Call {
    return buildCall(gameActionsAddress, 'breed', [
        playerAddress,
        creatureAId,
        creatureBId,
        toFelt252(fusionName),
        fusionElement,
        fusionBodyType,
    ]);
}

export function callUpgradeBuilding(playerAddress: string, buildingId: number): Call {
    return buildCall(gameActionsAddress, 'upgrade_building', [playerAddress, buildingId]);
}

// ==================== EXPEDITION ACTIONS ====================

export function callStartExpedition(
    playerAddress: string,
    routeId: string,
    creatureIds: number[],
    durationSeconds: number,
): Call {
    // Span<u32> is passed as: [length, ...items]
    return buildCall(expeditionActionsAddress, 'start_expedition', [
        playerAddress,
        toFelt252(routeId),
        creatureIds.length,
        ...creatureIds,
        durationSeconds,
    ]);
}

export function callResolveExpedition(playerAddress: string, expeditionId: number): Call {
    return buildCall(expeditionActionsAddress, 'resolve_expedition', [playerAddress, expeditionId]);
}

// ==================== EXECUTOR ====================

export async function executeCall(account: Account, call: Call): Promise<string> {
    const result = await account.execute([call]);
    return result.transaction_hash;
}

export async function executeCalls(account: Account, calls: Call[]): Promise<string> {
    const result = await account.execute(calls);
    return result.transaction_hash;
}
