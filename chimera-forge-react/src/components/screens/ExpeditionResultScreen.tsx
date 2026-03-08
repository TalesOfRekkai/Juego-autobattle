import { useNavigate, useLocation } from 'react-router-dom';
import * as Creatures from '../../lib/creatures';
import * as Data from '../../lib/data';
import type { ExpeditionResult } from '../../types';
import TopBar from '../layout/TopBar';

export default function ExpeditionResultScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { results } = (location.state as { results?: ExpeditionResult }) || {};

    if (!results) { navigate('/hub'); return null; }
    const r = results.resources;

    return (
        <>
            <TopBar />
            <div className="screen">
                <div className="section-header">Resultado de Expedición</div>

                <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', marginBottom: 'var(--space-md)', color: 'var(--accent-success)' }}>
                        SUPERVIVIENTES ({results.survived.length})
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                        {results.survived.map(c => (
                            <div key={c.id} style={{ textAlign: 'center' }}>
                                <img src={Creatures.getSprite(c)} style={{ width: '50px', height: '50px', imageRendering: 'pixelated' }} />
                                <div style={{ fontSize: '8px', color: 'var(--text-primary)' }}>{c.name}</div>
                                <div style={{ fontSize: '8px', color: 'var(--accent-secondary)' }}>+{results.xpPerCreature} XP</div>
                            </div>
                        ))}
                    </div>
                </div>

                {results.fainted.length > 0 && (
                    <div className="card" style={{ marginBottom: 'var(--space-md)', borderColor: 'rgba(247,118,142,0.3)' }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', marginBottom: 'var(--space-md)', color: 'var(--accent-danger)' }}>
                            DEBILITADOS ({results.fainted.length})
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                            {results.fainted.map(c => (
                                <div key={c.id} style={{ textAlign: 'center', opacity: 0.5 }}>
                                    <img src={Creatures.getSprite(c)} style={{ width: '50px', height: '50px', imageRendering: 'pixelated', filter: 'grayscale(1)' }} />
                                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{c.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {results.evolutions.length > 0 && (
                    <div className="card" style={{ marginBottom: 'var(--space-md)', borderColor: 'var(--accent-secondary)', background: 'linear-gradient(135deg, rgba(224,175,104,0.1), transparent)' }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', marginBottom: 'var(--space-sm)', color: 'var(--accent-secondary)' }}>
                            ⭐ ¡EVOLUCIÓN!
                        </div>
                        {results.evolutions.map((e, i) => (
                            <div key={i} style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                                {e.name} ha evolucionado a Stage {e.newStage}!
                            </div>
                        ))}
                    </div>
                )}

                <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', marginBottom: 'var(--space-md)' }}>RECURSOS OBTENIDOS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                        {r.essence > 0 && <div className="resource-badge" style={{ justifyContent: 'flex-start' }}><span className="icon">🔮</span>+{r.essence} Esencia</div>}
                        {r.herbs > 0 && <div className="resource-badge" style={{ justifyContent: 'flex-start' }}><span className="icon">🌿</span>+{r.herbs} Hierbas</div>}
                        {r.eggFragments > 0 && <div className="resource-badge" style={{ justifyContent: 'flex-start' }}><span className="icon">🥚</span>+{r.eggFragments} Fragmentos</div>}
                        {r.crystals > 0 && <div className="resource-badge" style={{ justifyContent: 'flex-start' }}><span className="icon">⚡</span>+{r.crystals} Cristales</div>}
                    </div>
                </div>

                {results.foundEgg && (
                    <div className="card" style={{ marginBottom: 'var(--space-md)', borderColor: 'var(--accent-secondary)', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', marginBottom: 'var(--space-sm)', color: 'var(--accent-secondary)' }}>
                            🎉 ¡HUEVO ENCONTRADO!
                        </div>
                        <img src={Data.getEggSpritePath(results.foundEgg)}
                            style={{ width: '60px', height: '60px', imageRendering: 'pixelated', filter: 'drop-shadow(0 2px 8px rgba(224,175,104,0.4))' }} />
                        <div style={{ fontSize: '11px', marginTop: 'var(--space-sm)' }}>Huevo de {results.foundEgg}</div>
                    </div>
                )}

                <button className="btn btn-primary btn-lg btn-block mt-lg" onClick={() => navigate('/hub')}>
                    Volver al Hub
                </button>
            </div>
        </>
    );
}
