/* ============================================
   DOJO PROVIDER — Dual-mode authentication
   
   LOCAL DEV:  Uses Katana burner account (no Controller needed)
   PRODUCTION: Uses Cartridge Controller (wallet auth)
   ============================================ */

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { RpcProvider, Account, type Call } from 'starknet';
import { dojoConfig } from './dojoConfig';
import { setContractAddresses } from './contractCalls';

// ---- Katana dev account (first prefunded account — NOT sensitive, only for local dev) ----
const KATANA_DEV_ACCOUNT = {
    address: '0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec',
    privateKey: '0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912',
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
                    controllerRef.current = new Controller({
                        policies,
                        // Register the Slot Katana chain so the Controller knows the RPC
                        chains: [{ rpcUrl: dojoConfig.rpcUrl }],
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
                    // Use the Controller account DIRECTLY for execution.
                    // ControllerAccount.execute() delegates to the keychain iframe
                    // which handles session keys, account deploy, and paymaster internally.
                    setAccount(walletAccount as any);
                    setAddress(walletAccount.address);
                    console.log('🔌 Controller: Authenticated + executing as', walletAccount.address);
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

            let result;
            try {
                if (USE_CONTROLLER) {
                    // Controller handles gas estimation, paymaster, and signing internally
                    result = await account.execute(callArray);
                } else {
                    // Burner on local Katana needs explicit resource bounds (no-fee mode)
                    const details = {
                        resourceBounds: {
                            l2_gas: { max_amount: 100000n, max_price_per_unit: 100n },
                            l1_gas: { max_amount: 100000n, max_price_per_unit: 100000000000n },
                            l1_data_gas: { max_amount: 0n, max_price_per_unit: 0n },
                        },
                    } as any;
                    result = await account.execute(callArray, details);
                }
                console.log('🎮 Execute: tx hash =', result.transaction_hash);
            } catch (execError: any) {
                console.error('🎮 Execute: account.execute() FAILED:', execError?.message || execError);
                throw execError;
            }

            // Controller accounts handle receipts internally; for burner we check manually
            if (!USE_CONTROLLER) {
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
