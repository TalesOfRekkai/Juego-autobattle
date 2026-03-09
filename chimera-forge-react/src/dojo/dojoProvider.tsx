/* ============================================
   DOJO PROVIDER — Dual-mode authentication
   
   LOCAL DEV:  Uses Katana burner account (no Controller needed)
   PRODUCTION: Uses Cartridge Controller (wallet auth)
   ============================================ */

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { RpcProvider, Account, type Call, shortString } from 'starknet';
import { dojoConfig } from './dojoConfig';
import { setContractAddresses } from './contractCalls';

// ---- Katana dev account (prefunded account — NOT sensitive, only for Slot/dev) ----
// Using same account as deployer — this only signs transactions.
// Player identity comes from the Controller wallet address (passed as contract param).
const KATANA_DEV_ACCOUNT = {
    address: '0x6677fe62ee39c7b07401f754138502bab7fac99d2d3c5d37df7d1c6fab10819',
    privateKey: '0x3e3979c1ed728490308054fe357a9f49cf67f80f9721f44cc57235129e090f4',
};

const USE_CONTROLLER = import.meta.env.VITE_USE_CONTROLLER === 'true';

// ---- Types ----
interface DojoContextType {
    account: Account | null;
    address: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    isPending: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    execute: (calls: Call | Call[]) => Promise<string>;
    provider: RpcProvider;
}

const DojoContext = createContext<DojoContextType | null>(null);

// ---- React Provider Component ----
export function DojoProvider({ children }: { children: React.ReactNode }) {
    const [account, setAccount] = useState<Account | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const provider = useMemo(() => new RpcProvider({ nodeUrl: dojoConfig.rpcUrl }), []);

    // Load manifest and set contract addresses on mount
    useEffect(() => {
        fetch('/manifest_dev.json')
            .then(res => res.json())
            .then(manifest => {
                if (manifest?.contracts) {
                    setContractAddresses(manifest);
                    console.log('✅ Contract addresses loaded from manifest');
                }
            })
            .catch(() => {
                console.warn('⚠️ No manifest_dev.json found — deploy contracts first.');
            });
    }, []);

    // Keep Controller instance alive across renders so probe()/reconnect works
    const controllerRef = useRef<any>(null);

    const connect = useCallback(async () => {
        setIsConnecting(true);
        try {
            if (USE_CONTROLLER) {
                console.log('🔌 Controller: Starting connection...');
                console.log('🔌 Controller: RPC URL =', dojoConfig.rpcUrl);

                const { default: Controller } = await import('@cartridge/controller');

                // Session policies — pre-approved actions for seamless UX
                const policies = {
                    contracts: {
                        '0x25dac7762fd1e14d05eacfe838a9bea0630f18bf3fc68021c17c9e83792ece3': {
                            name: 'Game Actions',
                            methods: [
                                { name: 'New Game', entrypoint: 'new_game' },
                                { name: 'Hatch Egg', entrypoint: 'hatch_egg' },
                                { name: 'Heal Creature', entrypoint: 'heal_creature' },
                                { name: 'Boost Creature', entrypoint: 'boost_creature' },
                                { name: 'Breed', entrypoint: 'breed' },
                                { name: 'Upgrade Building', entrypoint: 'upgrade_building' },
                            ],
                        },
                        '0x5d51f9fefc677e7b71df3f35bf03ed85f45bb0612f16ed78fc301562f847b62': {
                            name: 'Expedition Actions',
                            methods: [
                                { name: 'Start Expedition', entrypoint: 'start_expedition' },
                                { name: 'Resolve Expedition', entrypoint: 'resolve_expedition' },
                            ],
                        },
                    },
                };

                // Reuse existing Controller instance or create a new one
                if (!controllerRef.current) {
                    // Compute Slot Katana chain ID — matches how the Controller
                    // resolves api.cartridge.gg/x/rekkaimon-forge/katana internally
                    const slotChainId = shortString.encodeShortString('WP_REKKAIMON_FORGE');

                    controllerRef.current = new Controller({
                        policies,
                        // Register the Slot Katana chain so the Controller knows the RPC
                        chains: [{ rpcUrl: dojoConfig.rpcUrl }],
                        // CRITICAL: without this, Controller defaults to SN_MAIN (Mainnet)
                        defaultChainId: slotChainId,
                        // Slot project name — used by the Controller for profile/paymaster
                        slot: 'rekkaimon-forge',
                        namespace: 'cf',
                    });
                }

                const controller = controllerRef.current;

                console.log('🔌 Controller: Calling connect()...');
                const walletAccount = await controller.connect();
                console.log('🔌 Controller: connect() returned', walletAccount?.address);

                if (walletAccount) {
                    // HYBRID: Burner executes transactions, but the player identity
                    // is the Controller wallet address. Each Cartridge user gets their
                    // own game state because contractCalls pass this address as the
                    // `player` parameter to the contracts.
                    const burner = new Account({
                        provider,
                        address: KATANA_DEV_ACCOUNT.address,
                        signer: KATANA_DEV_ACCOUNT.privateKey,
                    });
                    setAccount(burner);
                    // Use CONTROLLER address as player identity (for Torii + contract calls)
                    setAddress(walletAccount.address);
                    console.log('🔌 Controller: Authenticated as', walletAccount.address);
                    console.log('🔌 Controller: Executing via burner', KATANA_DEV_ACCOUNT.address);
                    console.log('🔌 Controller: Player identity =', walletAccount.address);
                }
            } else {
                const burner = new Account({
                    provider,
                    address: KATANA_DEV_ACCOUNT.address,
                    signer: KATANA_DEV_ACCOUNT.privateKey,
                });
                setAccount(burner);
                setAddress(KATANA_DEV_ACCOUNT.address);
                console.log('🎮 Connected with Katana burner account');
            }
        } catch (error) {
            console.error('Connection failed:', error);
        } finally {
            setIsConnecting(false);
        }
    }, [provider]);

    // Track manual disconnect to prevent auto-reconnect
    const manuallyDisconnected = React.useRef(false);

    // Auto-connect burner account on mount (dev only)
    useEffect(() => {
        if (!USE_CONTROLLER && !account && !manuallyDisconnected.current) {
            connect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    const disconnect = useCallback(() => {
        manuallyDisconnected.current = true;
        controllerRef.current = null;
        setAccount(null);
        setAddress(null);
    }, []);

    const execute = useCallback(async (calls: Call | Call[]): Promise<string> => {
        if (!account) throw new Error('Not connected');
        setIsPending(true);
        try {
            const callArray = Array.isArray(calls) ? calls : [calls];

            console.log('🎮 Execute:', callArray.length, 'calls');
            console.log('🎮 Execute: Calls:', JSON.stringify(callArray, (_, v) => typeof v === 'bigint' ? v.toString() : v));

            // Explicit resource bounds for Katana (no-fee mode)
            const details = {
                resourceBounds: {
                    l2_gas: { max_amount: 100000n, max_price_per_unit: 100n },
                    l1_gas: { max_amount: 100000n, max_price_per_unit: 100000000000n },
                    l1_data_gas: { max_amount: 0n, max_price_per_unit: 0n },
                },
            } as any;

            let result;
            try {
                result = await account.execute(callArray, details);
                console.log('🎮 Execute: tx hash =', result.transaction_hash);
            } catch (execError: any) {
                console.error('🎮 Execute: account.execute() FAILED:', execError?.message || execError);
                throw execError;
            }

            const receipt = await provider.waitForTransaction(result.transaction_hash);
            console.log('🎮 Execute: receipt =', JSON.stringify(receipt, (_, v) => typeof v === 'bigint' ? v.toString() : v).slice(0, 500));

            // Check if transaction was reverted (Katana accepts but reverts on assert failure)
            const receiptAny = receipt as any;
            if (receiptAny.execution_status === 'REVERTED' || receiptAny.revert_reason) {
                const reason = receiptAny.revert_reason || 'Transaction reverted';
                const match = reason.match(/'([^']+)'/);
                console.error('🎮 Execute: REVERTED:', reason);
                throw new Error(match ? match[1] : reason);
            }

            console.log('🎮 Execute: ✅ SUCCESS');
            return result.transaction_hash;
        } finally {
            setIsPending(false);
        }
    }, [account, provider]);

    const value = useMemo(() => ({
        account,
        address,
        isConnected: !!account,
        isConnecting,
        isPending,
        connect,
        disconnect,
        execute,
        provider,
    }), [account, address, isConnecting, isPending, connect, disconnect, execute, provider]);

    return (
        <DojoContext.Provider value={value}>
            {children}
        </DojoContext.Provider>
    );
}

export function useDojo(): DojoContextType {
    const ctx = useContext(DojoContext);
    if (!ctx) throw new Error('useDojo must be used within DojoProvider');
    return ctx;
}
