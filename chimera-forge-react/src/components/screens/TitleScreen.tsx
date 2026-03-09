import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import { useDojo } from '../../dojo/dojoProvider';
import { useT } from '../../lib/i18n';

export default function TitleScreen() {
    const navigate = useNavigate();
    const t = useT();
    const { isConnected, isConnecting, connect, address } = useDojo();
    const state = useGameStore(s => s.state);
    const isPending = useGameStore(s => s.isPending);
    const startNewGameOnchain = useGameStore(s => s.startNewGameOnchain);

    const hasEggs = state.eggs.length > 0;
    const hasCreatures = state.creatures.length > 0;
    const hasGameStarted = state.phase !== 'title' && (hasCreatures || hasEggs);

    const handleConnect = async () => {
        useGameStore.setState({ onchainLoaded: false });
        await connect();
    };

    const handleNewGame = async () => {
        console.log('🎯 handleNewGame: calling startNewGameOnchain...');
        const result = await startNewGameOnchain();
        console.log('🎯 handleNewGame: result =', result);
        if (result === 'existing') {
            console.log('🎯 handleNewGame: existing game, navigating to /hub');
            navigate('/hub');
        } else if (result) {
            console.log('🎯 handleNewGame: new game, navigating to /hatch');
            navigate('/hatch', { state: { first: true } });
        } else {
            console.log('🎯 handleNewGame: FAILED, not navigating');
        }
    };

    const handleContinue = () => {
        if (hasEggs && !hasCreatures) {
            const firstEgg = state.eggs[0];
            navigate('/hatch', { state: { eggName: firstEgg.name, first: false, eggIndex: 0 } });
        } else {
            navigate('/hub');
        }
    };

    return (
        <div className="screen title-screen" style={{ justifyContent: 'flex-start', paddingTop: '60px' }}>
            <div className="title-logo">
                REKKAIMON<br />FORGE
            </div>
            <div className="title-subtitle">
                {t.title_subtitle}
            </div>

            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                {!isConnected ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                            {t.title_connect_hint}
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleConnect}
                            disabled={isConnecting}
                            style={{ width: '100%', padding: 'var(--space-md)' }}
                        >
                            {isConnecting ? t.title_connecting : t.title_connect_btn}
                        </button>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                            {t.title_powered_by}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-sm)' }}>
                            <div style={{ fontSize: '9px', color: 'var(--accent-secondary)', fontFamily: 'var(--font-pixel)' }}>
                                {t.title_wallet_connected}
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
                                {t.title_continue}
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={() => handleNewGame()}
                                disabled={isPending}
                                style={{ width: '100%', padding: 'var(--space-md)' }}
                            >
                                {isPending ? t.title_creating : t.title_new_game}
                            </button>
                        )}

                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center' }}>
                            {t.title_stats(state.creatures.length, state.eggs.length, state.totalExpeditions)}
                        </div>
                    </>
                )}
            </div>

            <div style={{ marginTop: 'auto', paddingBottom: 'var(--space-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                    {t.title_onchain}
                </div>
            </div>
        </div>
    );
}
