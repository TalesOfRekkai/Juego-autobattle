import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import * as RoutesLib from '../../lib/routes';
import * as Data from '../../lib/data';
import * as Creatures from '../../lib/creatures';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';

function formatTime(ms: number) {
    if (ms <= 0) return '0:00';
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** Calculate time left for an expedition */
function getTimeLeft(exp: { startTime: number; duration: number }): number {
    const endTime = exp.startTime + exp.duration;
    return Math.max(0, endTime - Date.now());
}

export default function ExpeditionActiveScreen() {
    const navigate = useNavigate();
    const expeditions = useGameStore(s => s.state.expeditions);
    const creatures = useGameStore(s => s.state.creatures);
    const resolveExpedition = useGameStore(s => s.resolveExpedition);
    const [, setTick] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setTick(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // All unresolved expeditions (active or ready to claim)
    const unresolved = expeditions.filter(e => !e.resolved);

    const getCreatureById = (id: number) => creatures.find(c => c.id === id);

    const handleResolve = (expId: number) => {
        resolveExpedition(expId);
        // Navigate to hub after resolving — rewards will be updated by Torii
        setTimeout(() => navigate('/hub'), 2000);
    };

    return (
        <>
            <TopBar />
            <div className="screen">
                <button className="back-btn" onClick={() => navigate('/hub')}>← Volver</button>
                <div className="section-header">Expediciones</div>

                {unresolved.map(exp => {
                    const route = RoutesLib.getRoute(exp.routeId);
                    const timeLeft = getTimeLeft(exp);
                    const isReady = timeLeft <= 0;
                    const progress = exp.duration > 0 ? 1 - timeLeft / exp.duration : 1;
                    const team = exp.creatureIds.map(id => getCreatureById(id)).filter(Boolean);

                    return (
                        <div key={exp.id} className="expedition-panel"
                            style={{ borderColor: isReady ? 'var(--accent-success)' : undefined }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                <span style={{ fontSize: '24px' }}>{route?.icon || '🗺️'}</span>
                                <div>
                                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px' }}>
                                        {route?.name || exp.routeId}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                        {route?.element && route.element !== 'mixed'
                                            ? `${Data.getElementIcon(route.element)} ${Data.ELEMENTS[route.element]?.name}`
                                            : '🌀 Mixto'}
                                    </div>
                                </div>
                            </div>

                            {isReady ? (
                                <>
                                    <div className="advantage-hint" style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
                                        ✓ ¡Expedición completada!
                                    </div>
                                    <button
                                        className="btn btn-success btn-block"
                                        onClick={() => handleResolve(exp.id)}
                                    >
                                        🎁 Recoger Recompensas
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="expedition-timer">{formatTime(timeLeft)}</div>
                                    <div className="expedition-progress">
                                        <div className="expedition-progress__bar" style={{ width: `${progress * 100}%` }}></div>
                                    </div>
                                </>
                            )}

                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', justifyContent: 'center' }}>
                                {team.map(c => c && (
                                    <div key={c.id} style={{ textAlign: 'center' }}>
                                        <img src={Creatures.getSprite(c)} style={{ width: '40px', height: '40px', imageRendering: 'pixelated' }} />
                                        <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{c.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {unresolved.length === 0 && (
                    <div className="empty-state">
                        <span className="icon">🗺️</span>
                        <p>No hay expediciones activas. ¡Envía a tus Rekaimon a explorar!</p>
                        <button className="btn btn-primary mt-md" onClick={() => navigate('/routes')}>Ver Rutas</button>
                    </div>
                )}
            </div>
            <NavBar />
        </>
    );
}
