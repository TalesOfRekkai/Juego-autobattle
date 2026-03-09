import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import { useDojo } from '../../dojo/dojoProvider';

export default function TitleScreen() {
    const navigate = useNavigate();
    const { isConnected, isConnecting, connect, address } = useDojo();
    const state = useGameStore(s => s.state);
    const isPending = useGameStore(s => s.isPending);
    const startNewGameOnchain = useGameStore(s => s.startNewGameOnchain);

    const hasEggs = state.eggs.length > 0;
    const hasCreatures = state.creatures.length > 0;
    const hasGameStarted = state.phase !== 'title' && (hasCreatures || hasEggs);

    const handleConnect = async () => {
        // Reset onchainLoaded so loading screen shows while Torii syncs the real data
        useGameStore.setState({ onchainLoaded: false });
        await connect();
    };

    const handleNewGame = async () => {
        const result = await startNewGameOnchain();
        if (result === 'existing') {
            // Game already exists — go straight to hub
            navigate('/hub');
        } else if (result) {
            // New game created — wait for Torii to index, then go to hatch
            setTimeout(() => navigate('/hatch', { state: { first: true } }), 1500);
        }
    };

    const handleContinue = () => {
        if (hasEggs && !hasCreatures) {
            // Pass first egg's name so EggHatchScreen doesn't redirect back
            const firstEgg = state.eggs[0];
            navigate('/hatch', { state: { eggName: firstEgg.name, first: false, eggIndex: 0 } });
        } else {
            navigate('/hub');
        }
    };

    return (
        <div className="screen title-screen" style={{ justifyContent: 'flex-start', paddingTop: '60px' }}>
            <div className="title-logo">
                CHIMERA<br />FORGE
                <span>REKAIMON</span>
            </div>
            <div className="title-subtitle">
                Colecciona, cría y evoluciona criaturas elementales. Envíalas a expediciones para ganar recursos y descubrir nuevos huevos.
            </div>

            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                {!isConnected ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                            Conecta tu wallet para jugar onchain
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleConnect}
                            disabled={isConnecting}
                            style={{ width: '100%', padding: 'var(--space-md)' }}
                        >
                            {isConnecting ? '⏳ Conectando...' : '🔗 Conectar Wallet'}
                        </button>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                            Powered by Cartridge Controller
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-sm)' }}>
                            <div style={{ fontSize: '9px', color: 'var(--accent-secondary)', fontFamily: 'var(--font-pixel)' }}>
                                ✅ Wallet Conectada
                            </div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                                {address?.slice(0, 10)}...{address?.slice(-8)}
                            </div>
                        </div>

                        {hasGameStarted ? (
                            <button
                                className="btn btn-primary"
                                onClick={() => handleContinue()}
                                style={{ width: '100%', padding: 'var(--space-md)', cursor: 'pointer' }}
                            >
                                ▶️ Continuar Partida
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={() => handleNewGame()}
                                disabled={isPending}
                                style={{ width: '100%', padding: 'var(--space-md)' }}
                            >
                                {isPending ? '⏳ Creando partida...' : '🎮 Nueva Partida'}
                            </button>
                        )}

                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center' }}>
                            🐾 {state.creatures.length} criaturas · 🥚 {state.eggs.length} huevos · 🗺️ {state.totalExpeditions} expediciones
                        </div>
                    </>
                )}
            </div>

            <div style={{ marginTop: 'auto', paddingBottom: 'var(--space-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                    ⛓️ Onchain · Starknet · Dojo Engine
                </div>
            </div>
        </div>
    );
}
