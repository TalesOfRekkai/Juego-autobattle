import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import { useDojo } from '../../dojo/dojoProvider';
import { useToastStore } from '../../store/toastStore';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';

const USE_CONTROLLER = import.meta.env.VITE_USE_CONTROLLER === 'true';

export default function SettingsScreen() {
    const navigate = useNavigate();
    const addToast = useToastStore(s => s.addToast);
    const { address, isConnected, disconnect, connect } = useDojo();
    const state = useGameStore(s => s.state);

    const shortAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : 'No conectado';

    const handleDisconnect = () => {
        if (confirm('¿Cerrar sesión? Tus datos están guardados en la blockchain.')) {
            disconnect();
            // Reset store state — data is safe on-chain, will reload on reconnect
            useGameStore.setState({
                onchainLoaded: false,
                state: {
                    ...useGameStore.getState().state,
                    phase: 'title',
                    creatures: [],
                    eggs: [],
                    expeditions: [],
                    resources: { essence: 0, herbs: 0, eggFragments: 0, crystals: 0 },
                },
            });
            addToast('Sesión cerrada', 'success');
            navigate('/');
        }
    };

    const handleConnect = () => {
        connect();
    };

    return (
        <>
            <TopBar />
            <div className="screen">
                <div className="section-header">⚙️ Ajustes</div>

                {/* Account Section */}
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                    CUENTA
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    {/* Connection type badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <span style={{ fontSize: '24px' }}>
                                {USE_CONTROLLER ? '🎮' : '🔧'}
                            </span>
                            <div>
                                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--text-primary)' }}>
                                    {USE_CONTROLLER ? 'Cartridge Controller' : 'Katana (Dev)'}
                                </div>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                    {USE_CONTROLLER ? 'Wallet conectado' : 'Cuenta local de desarrollo'}
                                </div>
                            </div>
                        </div>
                        <span style={{
                            fontSize: '8px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: isConnected
                                ? 'rgba(158,206,106,0.15)'
                                : 'rgba(247,118,142,0.15)',
                            color: isConnected
                                ? 'var(--accent-success)'
                                : 'var(--accent-danger)',
                        }}>
                            {isConnected ? '● Conectado' : '○ Desconectado'}
                        </span>
                    </div>

                    {/* Address */}
                    <div style={{
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-sm) var(--space-md)',
                        marginBottom: 'var(--space-md)',
                    }}>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginBottom: '2px' }}>DIRECCIÓN</div>
                        <div style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                            wordBreak: 'break-all',
                        }}>
                            {address || 'No disponible'}
                        </div>
                    </div>

                    {/* Game stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 'var(--space-sm)',
                        marginBottom: 'var(--space-md)',
                    }}>
                        <div style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{state.creatures.length}</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Criaturas</div>
                        </div>
                        <div style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{state.completedExpeditions || 0}</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Expediciones</div>
                        </div>
                        <div style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{state.eggs.length}</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Huevos</div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    {isConnected ? (
                        <button className="btn btn-danger btn-block" onClick={handleDisconnect}
                            style={{ fontSize: '10px', padding: '8px' }}>
                            🚪 Cerrar Sesión
                        </button>
                    ) : (
                        <button className="btn btn-primary btn-block" onClick={handleConnect}
                            style={{ fontSize: '10px', padding: '8px' }}>
                            🔗 Conectar {USE_CONTROLLER ? 'Cartridge' : 'Cuenta'}
                        </button>
                    )}
                </div>

                {/* Network Info */}
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                    RED
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                        <div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>MODO</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-primary)' }}>
                                {USE_CONTROLLER ? 'Producción' : 'Desarrollo'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>RED</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-primary)' }}>
                                {USE_CONTROLLER ? 'Starknet' : 'Katana Local'}
                            </div>
                        </div>
                    </div>
                </div>

                <button className="btn btn-secondary btn-block" onClick={() => navigate('/hub')}
                    style={{ fontSize: '10px', padding: '8px' }}>
                    ← Volver al Hub
                </button>
            </div>
            <NavBar />
        </>
    );
}
