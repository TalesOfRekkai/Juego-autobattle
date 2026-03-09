/* ============================================
   DOJO PROVIDER — Dual-mode authentication
   
   LOCAL DEV:  Uses Katana burner account (no Controller needed)
   PRODUCTION: Uses Cartridge Controller (wallet auth)
   ============================================ */

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
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

    const connect = useCallback(async () => {
        setIsConnecting(true);
        try {
            if (USE_CONTROLLER) {
                const { default: ControllerProvider } = await import('@cartridge/controller');
                const controller = new ControllerProvider({
                    rpcUrl: dojoConfig.rpcUrl,
                });
                const walletAccount = await controller.connect();
                if (walletAccount) {
                    setAccount(walletAccount as any);
                    setAddress(walletAccount.address);
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

    const disconnect = useCallback(() => {
        setAccount(null);
        setAddress(null);
    }, []);

    const execute = useCallback(async (calls: Call | Call[]): Promise<string> => {
        if (!account) throw new Error('Not connected');
        setIsPending(true);
        try {
            const callArray = Array.isArray(calls) ? calls : [calls];
            const result = await account.execute(callArray);
            await provider.waitForTransaction(result.transaction_hash);
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
