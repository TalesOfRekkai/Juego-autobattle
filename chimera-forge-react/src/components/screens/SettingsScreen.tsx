import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import { useDojo } from '../../dojo/dojoProvider';
import { useToastStore } from '../../store/toastStore';
import { useT, useI18n, type Language } from '../../lib/i18n';
import { useAudioStore } from '../../store/audioStore';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';

const USE_CONTROLLER = import.meta.env.VITE_USE_CONTROLLER === 'true';

export default function SettingsScreen() {
    const navigate = useNavigate();
    const addToast = useToastStore(s => s.addToast);
    const t = useT();
    const { lang, setLang } = useI18n();
    const { address, isConnected, disconnect, connect } = useDojo();
    const state = useGameStore(s => s.state);
    const { volume, muted, setVolume, toggleMute } = useAudioStore();

    const handleDisconnect = () => {
        console.log('🔴 Logging out...');
        disconnect();
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
        addToast(t.settings_logout, 'success');
        navigate('/');
    };

    const handleConnect = () => {
        connect();
    };

    return (
        <>
            <TopBar />
            <div className="screen">
                <div className="section-header">{t.settings_title}</div>

                {/* Language Section */}
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                    {t.settings_language}
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        {(['es', 'en'] as Language[]).map(l => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                style={{
                                    flex: 1,
                                    padding: 'var(--space-sm) var(--space-md)',
                                    background: lang === l
                                        ? 'linear-gradient(135deg, var(--accent-primary), #6341a0)'
                                        : 'var(--bg-elevated)',
                                    border: lang === l
                                        ? '1px solid var(--accent-glow)'
                                        : '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 'var(--radius-md)',
                                    color: lang === l ? 'white' : 'var(--text-secondary)',
                                    fontFamily: 'var(--font-ui)',
                                    fontSize: '13px',
                                    fontWeight: lang === l ? 600 : 400,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {l === 'es' ? '🇪🇸 Español' : '🇬🇧 English'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Audio Section */}
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                    🎵 {t.settings_audio}
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <button
                            onClick={toggleMute}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                padding: '4px',
                                filter: muted ? 'grayscale(1) opacity(0.5)' : 'none',
                                transition: 'all 0.2s ease',
                            }}
                            title={muted ? 'Unmute' : 'Mute'}
                        >
                            {muted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round(volume * 100)}
                            onChange={e => setVolume(Number(e.target.value) / 100)}
                            style={{
                                flex: 1,
                                height: '6px',
                                accentColor: 'var(--accent-primary)',
                                cursor: 'pointer',
                            }}
                        />
                        <span style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            minWidth: '36px',
                            textAlign: 'right',
                        }}>
                            {Math.round(volume * 100)}%
                        </span>
                    </div>
                </div>

                {/* Account Section */}
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                    {t.settings_account}
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <span style={{ fontSize: '24px' }}>
                                {USE_CONTROLLER ? '🎮' : '🔧'}
                            </span>
                            <div>
                                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--text-primary)' }}>
                                    {USE_CONTROLLER ? t.settings_cartridge : t.settings_katana_dev}
                                </div>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                    {USE_CONTROLLER ? t.settings_production : t.settings_local_account}
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
                            {isConnected ? t.settings_connected : t.settings_disconnected}
                        </span>
                    </div>

                    {/* Address */}
                    <div style={{
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-sm) var(--space-md)',
                        marginBottom: 'var(--space-md)',
                    }}>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginBottom: '2px' }}>{t.settings_address}</div>
                        <div style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                            wordBreak: 'break-all',
                        }}>
                            {address || '—'}
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
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{t.settings_creatures}</div>
                        </div>
                        <div style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{state.completedExpeditions || 0}</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{t.settings_expeditions}</div>
                        </div>
                        <div style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{state.eggs.length}</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{t.settings_eggs_label}</div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    {isConnected ? (
                        <button className="btn btn-danger btn-block" onClick={handleDisconnect}
                            style={{ fontSize: '10px', padding: '8px' }}>
                            {t.settings_logout}
                        </button>
                    ) : (
                        <button className="btn btn-primary btn-block" onClick={handleConnect}
                            style={{ fontSize: '10px', padding: '8px' }}>
                            {t.settings_connect}
                        </button>
                    )}
                </div>

                {/* Network Info */}
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                    {t.settings_network}
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                        <div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{t.settings_env}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-primary)' }}>
                                {USE_CONTROLLER ? t.settings_production_env : t.settings_development}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{t.settings_node}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-primary)' }}>
                                {USE_CONTROLLER ? 'Starknet' : t.settings_local}
                            </div>
                        </div>
                    </div>
                </div>

                <button className="btn btn-secondary btn-block" onClick={() => navigate('/hub')}
                    style={{ fontSize: '10px', padding: '8px' }}>
                    {t.settings_back}
                </button>
            </div>
            <NavBar />
        </>
    );
}
