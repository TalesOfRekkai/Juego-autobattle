import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import * as RoutesLib from '../../lib/routes';
import * as Data from '../../lib/data';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';

function formatTime(ms: number) {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function RoutesScreen() {
    const navigate = useNavigate();
    const state = useGameStore(s => s.state);
    const getExpeditionTimeLeft = useGameStore(s => s.getExpeditionTimeLeft);
    const resolveExpedition = useGameStore(s => s.resolveExpedition);
    const tickExpeditions = useGameStore(s => s.tickExpeditions);
    const routes = RoutesLib.getAllRoutes();

    const expeditions = state.expeditions;
    const active = expeditions.filter(e => !e.resolved);
    const completed = expeditions.filter(e => e.resolved);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (active.length > 0) {
            timerRef.current = window.setInterval(() => {
                tickExpeditions();
                // Update timer DOM directly for performance
                const store = useGameStore.getState();
                store.state.expeditions.filter(e => !e.resolved).forEach(exp => {
                    const el = document.getElementById(`map-timer-${exp.id}`);
                    if (el) {
                        el.textContent = `⏳ ${formatTime(store.getExpeditionTimeLeft(exp))}`;
                    }
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [active.length]);

    const handleResolve = (expId: number) => {
        const results = resolveExpedition(expId);
        if (results) navigate('/expedition-result', { state: { results } });
    };

    return (
        <>
            <TopBar />
            <div className="map-screen">
                <div className="map-container">
                    <img className="world-map" src="/Assets def/MAPANEW2.jpg" alt="Mapa del Mundo" />
                    {routes.map(route => {
                        const canAccess = RoutesLib.canAccessRoute(route, state.creatures);
                        const pos = route.mapPos;
                        const req = route.requirement;
                        const elemName = route.element !== 'mixed' ? (Data.ELEMENTS[route.element]?.name || route.element) : 'Mixto';
                        const tooltipClass = pos.x > 60 ? 'map-tooltip--left' : '';
                        return (
                            <button key={route.id}
                                className={`map-pin ${canAccess ? '' : 'locked'}`}
                                data-element={route.element}
                                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                onClick={() => canAccess && navigate('/select-team', { state: { routeId: route.id } })}
                            >
                                <div className="map-pin__icon">{route.icon}</div>
                                <div className={`map-tooltip ${tooltipClass}`}>
                                    <div className="map-tooltip__name">{route.name}</div>
                                    <div className="map-tooltip__stars">{route.stars}</div>
                                    <div className="map-tooltip__meta">
                                        <span>{Data.getElementIcon(route.element)} {elemName}</span>
                                        <span>⏱ {formatTime(route.duration * 1000)}</span>
                                    </div>
                                    <div className="map-tooltip__desc">{route.description}</div>
                                    {req && (
                                        <div className={`map-tooltip__req ${canAccess ? 'ok' : 'locked'}`}>
                                            {canAccess ? '✓' : '🔒'} Req: {req.minCreatures}× Lv{req.minLevel}+
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {(completed.length > 0 || active.length > 0) && (
                    <div className="map-expeditions">
                        {completed.map(exp => {
                            const route = RoutesLib.getRoute(exp.routeId)!;
                            return (
                                <div key={exp.id} className="map-exp-item map-exp-item--completed" onClick={() => handleResolve(exp.id)}>
                                    <span className="map-exp-item__icon">{route.icon}</span>
                                    <div className="map-exp-item__info">
                                        <div className="map-exp-item__name">{route.name}</div>
                                        <div className="map-exp-item__status">✓ ¡Completada! Toca para recoger</div>
                                    </div>
                                </div>
                            );
                        })}
                        {active.map(exp => {
                            const route = RoutesLib.getRoute(exp.routeId)!;
                            return (
                                <div key={exp.id} className="map-exp-item" onClick={() => navigate('/expeditions')}>
                                    <span className="map-exp-item__icon">{route.icon}</span>
                                    <div className="map-exp-item__info">
                                        <div className="map-exp-item__name">{route.name}</div>
                                        <div className="map-exp-item__status" id={`map-timer-${exp.id}`}>
                                            ⏳ {formatTime(getExpeditionTimeLeft(exp))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <NavBar />
        </>
    );
}
