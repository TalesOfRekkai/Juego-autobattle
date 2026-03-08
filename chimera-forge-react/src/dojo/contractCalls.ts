/* ============================================
   CONTRACT CALLS — TypeScript wrappers for onchain actions
   ============================================ */

import { type Account, type Call, CallData } from 'starknet';
import { dojoConfig } from './dojoConfig';

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

export function callNewGame(): Call {
    return buildCall(gameActionsAddress, 'new_game', []);
}

export function callHatchEgg(eggId: number): Call {
    return buildCall(gameActionsAddress, 'hatch_egg', [eggId]);
}

export function callHealCreature(creatureId: number): Call {
    return buildCall(gameActionsAddress, 'heal_creature', [creatureId]);
}

export function callBoostCreature(creatureId: number): Call {
    return buildCall(gameActionsAddress, 'boost_creature', [creatureId]);
}

export function callBreed(
    creatureAId: number,
    creatureBId: number,
    fusionName: string,
    fusionElement: number,
    fusionBodyType: number,
): Call {
    return buildCall(gameActionsAddress, 'breed', [
        creatureAId,
        creatureBId,
        toFelt252(fusionName),
        fusionElement,
        fusionBodyType,
    ]);
}

export function callUpgradeBuilding(buildingId: number): Call {
    return buildCall(gameActionsAddress, 'upgrade_building', [buildingId]);
}

// ==================== EXPEDITION ACTIONS ====================

export function callStartExpedition(
    routeId: string,
    creatureIds: number[],
    durationSeconds: number,
): Call {
    // Span<u32> is passed as: [length, ...items]
    return buildCall(expeditionActionsAddress, 'start_expedition', [
        toFelt252(routeId),
        creatureIds.length,
        ...creatureIds,
        durationSeconds,
    ]);
}

export function callResolveExpedition(expeditionId: number): Call {
    return buildCall(expeditionActionsAddress, 'resolve_expedition', [expeditionId]);
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
