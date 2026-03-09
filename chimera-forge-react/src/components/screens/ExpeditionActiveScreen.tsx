import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import * as RoutesLib from '../../lib/routes';
import * as Data from '../../lib/data';
import * as Creatures from '../../lib/creatures';
import { useT } from '../../lib/i18n';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';

function formatTime(ms: number) {
    if (ms <= 0) return '0:00';
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function getTimeLeft(exp: { startTime: number; duration: number }): number {
    const endTime = exp.startTime + exp.duration;
    return Math.max(0, endTime - Date.now());
}

export default function ExpeditionActiveScreen() {
    const navigate = useNavigate();
    const t = useT();
    const expeditions = useGameStore(s => s.state.expeditions);
    const creatures = useGameStore(s => s.state.creatures);
    const [, setTick] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setTick(tk => tk + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const unresolved = expeditions.filter(e => !e.resolved);
    const getCreatureById = (id: number) => creatures.find(c => c.id === id);

    const handleResolve = (expId: number) => {
        navigate('/expedition-result', { state: { expeditionId: expId } });
    };

    return (
        <>
            <TopBar />
            <div className="screen">
                <button className="back-btn" onClick={() => navigate('/hub')}>{t.common_back}</button>
                <div className="section-header">{t.exp_title}</div>

                {unresolved.map(exp => {
                    const route = RoutesLib.getRoute(exp.routeId);
                    const timeLeft = getTimeLeft(exp);
                    const isReady = timeLeft <= 0;
                    const progress = exp.duration > 0 ? 1 - timeLeft / exp.duration : 1;
                    const team = exp.creatureIds.map(id => getCreatureById(id)).filter(Boolean);
                    const routeName = t.route_name[exp.routeId] || route?.name || exp.routeId;
                    const elemName = route?.element && route.element !== 'mixed'
                        ? `${Data.getElementIcon(route.element)} ${t.element_name[route.element] || Data.ELEMENTS[route.element]?.name}`
                        : `🌀 ${t.routes_mixed}`;

                    return (
                        <div key={exp.id} className="expedition-panel"
                            style={{ borderColor: isReady ? 'var(--accent-success)' : undefined }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                <span style={{ fontSize: '24px' }}>{route?.icon || '🗺️'}</span>
                                <div>
                                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px' }}>
                                        {routeName}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                        {elemName}
                                    </div>
                                </div>
                            </div>

                            {isReady ? (
                                <>
                                    <div className="advantage-hint" style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
                                        {t.exp_completed_status}
                                    </div>
                                    <button
                                        className="btn btn-success btn-block"
                                        onClick={() => handleResolve(exp.id)}
                                    >
                                        {t.exp_claim}
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
                        <p>{t.exp_no_active_desc}</p>
                        <button className="btn btn-primary mt-md" onClick={() => navigate('/routes')}>{t.exp_see_routes}</button>
                    </div>
                )}
            </div>
            <NavBar />
        </>
    );
}
