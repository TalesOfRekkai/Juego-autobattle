import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import * as Creatures from '../../lib/creatures';
import * as Data from '../../lib/data';
import TopBar from '../layout/TopBar';

export default function ExpeditionResultScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { expeditionId } = (location.state as { expeditionId?: number }) || {};
    const results = useGameStore(s => s.lastExpeditionResult);
    const resolveExpedition = useGameStore(s => s.resolveExpedition);
    const resolvedRef = useRef(false);
    const [revealed, setRevealed] = useState(false);

    // Fire the resolve on mount (only once)
    useEffect(() => {
        if (expeditionId != null && !resolvedRef.current) {
            resolvedRef.current = true;
            resolveExpedition(expeditionId);
        }
    }, [expeditionId, resolveExpedition]);

    // When results arrive, wait a moment then reveal
    useEffect(() => {
        if (results && !revealed) {
            const timer = setTimeout(() => setRevealed(true), 800);
            return () => clearTimeout(timer);
        }
    }, [results, revealed]);

    // No expeditionId and no results — go back
    useEffect(() => {
        if (expeditionId == null && !results) {
            navigate('/hub');
        }
    }, [expeditionId, results, navigate]);

    // --- Opening animation ---
    if (!revealed) {
        return (
            <>
                <TopBar />
                <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <style>{`
                        @keyframes giftShake {
                            0%, 100% { transform: rotate(0deg) scale(1); }
                            10% { transform: rotate(-12deg) scale(1.05); }
                            20% { transform: rotate(12deg) scale(1.1); }
                            30% { transform: rotate(-15deg) scale(1.12); }
                            40% { transform: rotate(15deg) scale(1.15); }
                            50% { transform: rotate(-18deg) scale(1.18); }
                            60% { transform: rotate(18deg) scale(1.2); }
                            70% { transform: rotate(-12deg) scale(1.15); }
                            80% { transform: rotate(8deg) scale(1.1); }
                            90% { transform: rotate(-5deg) scale(1.05); }
                        }
                        @keyframes giftGlow {
                            0%, 100% { filter: drop-shadow(0 0 8px rgba(224,175,104,0.3)); }
                            50% { filter: drop-shadow(0 0 20px rgba(224,175,104,0.8)); }
                        }
                        @keyframes sparkle {
                            0%, 100% { opacity: 0; transform: scale(0); }
                            50% { opacity: 1; transform: scale(1); }
                        }
                        .gift-container {
                            position: relative;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 16px;
                        }
                        .gift-icon {
                            font-size: 80px;
                            animation: giftShake 0.8s ease-in-out infinite, giftGlow 1.5s ease-in-out infinite;
                        }
                        .sparkle {
                            position: absolute;
                            font-size: 20px;
                            animation: sparkle 1.2s ease-in-out infinite;
                        }
                    `}</style>
                    <div className="gift-container">
                        <span className="sparkle" style={{ top: '-10px', left: '-20px', animationDelay: '0s' }}>✨</span>
                        <span className="sparkle" style={{ top: '-15px', right: '-25px', animationDelay: '0.3s' }}>⭐</span>
                        <span className="sparkle" style={{ bottom: '40px', left: '-30px', animationDelay: '0.6s' }}>✨</span>
                        <span className="sparkle" style={{ bottom: '30px', right: '-20px', animationDelay: '0.9s' }}>💫</span>
                        <div className="gift-icon">🎁</div>
                        <div style={{
                            fontFamily: 'var(--font-pixel)',
                            fontSize: '12px',
                            color: 'var(--accent-secondary)',
                            textAlign: 'center',
                        }}>
                            Abriendo recompensas...
                        </div>
                        <div style={{
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            textAlign: 'center',
                        }}>
                            Procesando en blockchain
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // --- Results revealed ---
    const r = results!.resources;

    return (
        <>
            <TopBar />
            <div className="screen">
                <style>{`
                    @keyframes resultSlideIn {
                        0% { opacity: 0; transform: translateY(20px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                    .result-card {
                        animation: resultSlideIn 0.4s ease-out forwards;
                        opacity: 0;
                    }
                `}</style>
                <div className="section-header" style={{ animation: 'resultSlideIn 0.3s ease-out forwards' }}>
                    🏆 Resultado de Expedición
                </div>

                <div className="card result-card" style={{ marginBottom: 'var(--space-md)', animationDelay: '0.1s' }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', marginBottom: 'var(--space-md)', color: 'var(--accent-success)' }}>
                        SUPERVIVIENTES ({results!.survived.length})
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                        {results!.survived.map(c => (
                            <div key={c.id} style={{ textAlign: 'center' }}>
                                <img src={Creatures.getSprite(c)} style={{ width: '50px', height: '50px', imageRendering: 'pixelated' }} />
                                <div style={{ fontSize: '8px', color: 'var(--text-primary)' }}>{c.name}</div>
                                <div style={{ fontSize: '8px', color: 'var(--accent-secondary)' }}>+{results!.xpPerCreature} XP</div>
                            </div>
                        ))}
                    </div>
                </div>

                {results!.fainted.length > 0 && (
                    <div className="card result-card" style={{ marginBottom: 'var(--space-md)', borderColor: 'rgba(247,118,142,0.3)', animationDelay: '0.2s' }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', marginBottom: 'var(--space-md)', color: 'var(--accent-danger)' }}>
                            DEBILITADOS ({results!.fainted.length})
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                            {results!.fainted.map(c => (
                                <div key={c.id} style={{ textAlign: 'center', opacity: 0.5 }}>
                                    <img src={Creatures.getSprite(c)} style={{ width: '50px', height: '50px', imageRendering: 'pixelated', filter: 'grayscale(1)' }} />
                                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{c.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {results!.evolutions.length > 0 && (
                    <div className="card result-card" style={{ marginBottom: 'var(--space-md)', borderColor: 'var(--accent-secondary)', background: 'linear-gradient(135deg, rgba(224,175,104,0.1), transparent)', animationDelay: '0.3s' }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', marginBottom: 'var(--space-sm)', color: 'var(--accent-secondary)' }}>
                            ⭐ ¡EVOLUCIÓN!
                        </div>
                        {results!.evolutions.map((e, i) => (
                            <div key={i} style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                                {e.name} ha evolucionado a Stage {e.newStage}!
                            </div>
                        ))}
                    </div>
                )}

                <div className="card result-card" style={{ marginBottom: 'var(--space-md)', animationDelay: '0.4s' }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', marginBottom: 'var(--space-md)' }}>RECURSOS OBTENIDOS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                        {r.essence > 0 && <div className="resource-badge" style={{ justifyContent: 'flex-start' }}><span className="icon">🔮</span>+{r.essence} Esencia</div>}
                        {r.herbs > 0 && <div className="resource-badge" style={{ justifyContent: 'flex-start' }}><span className="icon">🌿</span>+{r.herbs} Hierbas</div>}
                        {r.eggFragments > 0 && <div className="resource-badge" style={{ justifyContent: 'flex-start' }}><span className="icon">🥚</span>+{r.eggFragments} Fragmentos</div>}
                        {r.crystals > 0 && <div className="resource-badge" style={{ justifyContent: 'flex-start' }}><span className="icon">⚡</span>+{r.crystals} Cristales</div>}
                        {r.essence === 0 && r.herbs === 0 && r.eggFragments === 0 && r.crystals === 0 && (
                            <div style={{ gridColumn: '1 / -1', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                Sin recursos esta vez
                            </div>
                        )}
                    </div>
                </div>

                {results!.foundEgg && (
                    <div className="card result-card" style={{ marginBottom: 'var(--space-md)', borderColor: 'var(--accent-secondary)', textAlign: 'center', animationDelay: '0.5s' }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', marginBottom: 'var(--space-sm)', color: 'var(--accent-secondary)' }}>
                            🎉 ¡HUEVO ENCONTRADO!
                        </div>
                        <img src={Data.getEggSpritePath(results!.foundEgg)}
                            style={{ width: '60px', height: '60px', imageRendering: 'pixelated', filter: 'drop-shadow(0 2px 8px rgba(224,175,104,0.4))' }} />
                        <div style={{ fontSize: '11px', marginTop: 'var(--space-sm)' }}>Huevo de {results!.foundEgg}</div>
                    </div>
                )}

                <button className="btn btn-primary btn-lg btn-block mt-lg result-card" style={{ animationDelay: '0.6s' }} onClick={() => navigate('/hub')}>
                    Volver al Hub
                </button>
            </div>
        </>
    );
}
