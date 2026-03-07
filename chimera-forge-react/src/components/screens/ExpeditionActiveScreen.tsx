import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import * as RoutesLib from '../../lib/routes';
import * as Data from '../../lib/data';
import * as Creatures from '../../lib/creatures';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';

function formatTime(ms: number) {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function ExpeditionActiveScreen() {
    const navigate = useNavigate();
    const expeditions = useGameStore(s => s.state.expeditions);
    const creatures = useGameStore(s => s.state.creatures);
    const resolveExpedition = useGameStore(s => s.resolveExpedition);
    const tickExpeditions = useGameStore(s => s.tickExpeditions);
    const getExpeditionTimeLeft = useGameStore(s => s.getExpeditionTimeLeft);
    const [, setTick] = useState(0);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        timerRef.current = window.setInterval(() => {
            tickExpeditions();
            setTick(t => t + 1);
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const active = expeditions.filter(e => !e.resolved);
    const completed = expeditions.filter(e => e.resolved);

    const getCreatureById = (id: number) => creatures.find(c => c.id === id);

    const handleResolve = (expId: number) => {
        const results = resolveExpedition(expId);
        if (results) navigate('/expedition-result', { state: { results } });
    };

    return (
        <>
            <TopBar />
            <div className="screen">
                <button className="back-btn" onClick={() => navigate('/hub')}>← Volver</button>
                <div className="section-header">Expediciones</div>

                {completed.map(exp => {
                    const route = RoutesLib.getRoute(exp.routeId)!;
                    return (
                        <div key={exp.id} className="expedition-panel" style={{ borderColor: 'var(--accent-success)', cursor: 'pointer' }}
                            onClick={() => handleResolve(exp.id)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                <span style={{ fontSize: '24px' }}>{route.icon}</span>
                                <div>
                                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px' }}>{route.name}</div>
                                    <div className="advantage-hint">✓ ¡Completada!</div>
                                </div>
                            </div>
                            <button className="btn btn-success btn-block">Recoger Recompensas</button>
                        </div>
                    );
                })}

                {active.map(exp => {
                    const route = RoutesLib.getRoute(exp.routeId)!;
                    const timeLeft = getExpeditionTimeLeft(exp);
                    const progress = 1 - timeLeft / exp.duration;
                    const team = exp.creatureIds.map(id => getCreatureById(id)).filter(Boolean);
                    return (
                        <div key={exp.id} className="expedition-panel">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                <span style={{ fontSize: '24px' }}>{route.icon}</span>
                                <div>
                                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px' }}>{route.name}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                        {Data.getElementIcon(route.element)} {route.element !== 'mixed' ? Data.ELEMENTS[route.element]?.name : 'Mixto'}
                                    </div>
                                </div>
                            </div>
                            <div className="expedition-timer">{formatTime(timeLeft)}</div>
                            <div className="expedition-progress">
                                <div className="expedition-progress__bar" style={{ width: `${progress * 100}%` }}></div>
                            </div>
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

                {active.length === 0 && completed.length === 0 && (
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
