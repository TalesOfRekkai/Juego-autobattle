/* ============================================
   DOJO CONFIG — Connection settings for Dojo world
   ============================================ */

export const dojoConfig = {
    // World contract address — filled after sozo migrate
    worldAddress: import.meta.env.VITE_WORLD_ADDRESS || '0x0',
    // Torii indexer URL
    toriiUrl: import.meta.env.VITE_TORII_URL || 'http://localhost:8080',
    // Katana RPC URL (local dev) or Slot/Sepolia RPC
    rpcUrl: import.meta.env.VITE_RPC_URL || 'http://localhost:5050',
    // Cartridge Slot RPC (for production)
    cartridgeRpc: import.meta.env.VITE_CARTRIDGE_RPC || '',
    // Namespace used in dojo_dev.toml
    namespace: 'cf',
};
