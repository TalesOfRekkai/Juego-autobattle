/* ============================================
   DOJO PROVIDER — Cartridge Controller integration
   
   Uses ControllerProvider from @cartridge/controller directly.
   Uses `any` for account type to avoid version conflicts between
   @cartridge/controller's internal starknet and our starknet dep.
   ============================================ */

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { RpcProvider, type Call } from 'starknet';
import ControllerProvider from '@cartridge/controller';
import { dojoConfig } from './dojoConfig';
import { setContractAddresses } from './contractCalls';

// ---- Types ----
// Using `any` for account to avoid WalletAccount type conflicts between
// @cartridge/controller's bundled starknet and our direct starknet dependency
interface DojoContextType {
    account: any;
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

// ---- Controller Provider (iframe-based auth) ----
const controller = new ControllerProvider({
    rpcUrl: dojoConfig.rpcUrl,
});

// ---- React Provider Component ----
export function DojoProvider({ children }: { children: React.ReactNode }) {
    const [account, setAccount] = useState<any>(null);
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
                }
            })
            .catch(() => {
                console.warn('No manifest_dev.json found — deploy contracts first.');
            });
    }, []);

    // Check for existing session on mount
    useEffect(() => {
        controller.probe().then(walletAccount => {
            if (walletAccount) {
                setAccount(walletAccount);
                setAddress(walletAccount.address);
            }
        }).catch(() => { });
    }, []);

    const connect = useCallback(async () => {
        setIsConnecting(true);
        try {
            const walletAccount = await controller.connect();
            if (walletAccount) {
                setAccount(walletAccount);
                setAddress(walletAccount.address);
            }
        } catch (error) {
            console.error('Connection failed:', error);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(async () => {
        await controller.disconnect();
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
