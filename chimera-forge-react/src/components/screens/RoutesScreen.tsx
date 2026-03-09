import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import * as RoutesLib from '../../lib/routes';
import { MAP_DEFS } from '../../lib/routes';
import * as Data from '../../lib/data';
import { useT } from '../../lib/i18n';
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
    const t = useT();
    const state = useGameStore(s => s.state);
    const resolveExpedition = useGameStore(s => s.resolveExpedition);
    const routes = RoutesLib.getAllRoutes();

    const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

    const expeditions = state.expeditions;
    const ready = expeditions.filter(e => !e.resolved && (e.startTime + e.duration) <= Date.now());

    const selectedMap = MAP_DEFS.find(m => m.id === selectedMapId);
    const mapRoutes = selectedMapId ? routes.filter(r => r.mapId === selectedMapId) : [];

    const handleResolve = (expId: number) => {
        resolveExpedition(expId);
        navigate('/expeditions');
    };

    // Map gallery view
    if (!selectedMap) {
        return (
            <>
                <TopBar />
                <div className="screen">
                    <div className="section-header">{t.routes_world_maps}</div>

                    {ready.length > 0 && (
                        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(115,218,202,0.1), rgba(115,218,202,0.02))', borderColor: 'var(--accent-success)', marginBottom: 'var(--space-md)', cursor: 'pointer' }}
                            onClick={() => navigate('/expeditions')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <span className="pulse-dot"></span>
                                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--accent-success)' }}>
                                    {t.routes_ready(ready.length)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="map-gallery">
                        {MAP_DEFS.map(map => {
                            const mapRouteCount = routes.filter(r => r.mapId === map.id).length;
                            const activeOnMap = expeditions.filter(e => !e.resolved && routes.find(r => r.id === e.routeId)?.mapId === map.id).length;
                            return (
                                <button key={map.id} className="map-thumb-card"
                                    onClick={() => setSelectedMapId(map.id)}>
                                    <img src={map.image} alt={t.map_name[map.id] || map.name} className="map-thumb-img" />
                                    <div className="map-thumb-overlay">
                                        <div className="map-thumb-name">{t.map_name[map.id] || map.name}</div>
                                        <div className="map-thumb-stars">{map.difficulty}</div>
                                        <div className="map-thumb-meta">
                                            {t.routes_count(mapRouteCount)}
                                            {activeOnMap > 0 && <span style={{ color: 'var(--accent-success)' }}> · ⏳ {activeOnMap}</span>}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <NavBar />
            </>
        );
    }

    // Map detail view
    return (
        <>
            <TopBar />
            <div className="screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <button className="back-btn" onClick={() => setSelectedMapId(null)}>{t.common_back}</button>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '11px', color: 'var(--accent-glow)' }}>
                        {t.map_name[selectedMap.id] || selectedMap.name}
                    </div>
                </div>

                <div className="map-detail-container">
                    <div className="map-detail-wrapper">
                        <img className="map-detail-image" src={selectedMap.image} alt={t.map_name[selectedMap.id] || selectedMap.name} />
                        {mapRoutes.map(route => {
                            const canAccess = RoutesLib.canAccessRoute(route, state.creatures);
                            const pos = route.mapPos;
                            const req = route.requirement;
                            const elemName = t.element_name[route.element] || route.element;
                            const tooltipClass = pos.x > 60 ? 'map-tooltip--left' : '';
                            const routeModifierLabel = RoutesLib.getRouteModifierLabel(route.id);
                            return (
                                <button key={route.id}
                                    className={`map-pin ${canAccess ? '' : 'locked'}`}
                                    data-element={route.element}
                                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                    onClick={() => canAccess && navigate('/select-team', { state: { routeId: route.id } })}
                                >
                                    <div className="map-pin__icon">{route.icon}</div>
                                    <div className={`map-tooltip ${tooltipClass}`}>
                                        <div className="map-tooltip__name">{t.route_name[route.id] || route.name}</div>
                                        <div className="map-tooltip__stars">{route.stars}</div>
                                        <div className="map-tooltip__meta">
                                            <span>{Data.getElementIcon(route.element)} {elemName}</span>
                                            <span>⏱ {formatTime(route.duration * 1000)}</span>
                                        </div>
                                        {routeModifierLabel && (
                                            <div className="map-tooltip__modifier">{routeModifierLabel}</div>
                                        )}
                                        <div className="map-tooltip__desc">{t.route_desc[route.id] || route.description}</div>
                                        {req && (
                                            <div className={`map-tooltip__req ${canAccess ? 'ok' : 'locked'}`}>
                                                {canAccess ? '✓' : '🔒'} {t.routes_req}: {req.minCreatures}× Lv{req.minLevel}+
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Active expeditions on this map */}
                {expeditions.filter(e => routes.find(r => r.id === e.routeId)?.mapId === selectedMapId).length > 0 && (
                    <div style={{ width: '100%', maxWidth: '800px', marginTop: 'var(--space-md)' }}>
                        {expeditions.filter(e => routes.find(r => r.id === e.routeId)?.mapId === selectedMapId).map(exp => {
                            const route = RoutesLib.getRoute(exp.routeId)!;
                            const routeName = t.route_name[route.id] || route.name;
                            if (exp.resolved) {
                                return (
                                    <div key={exp.id} className="map-exp-item map-exp-item--completed" onClick={() => handleResolve(exp.id)}>
                                        <span className="map-exp-item__icon">{route.icon}</span>
                                        <div className="map-exp-item__info">
                                            <div className="map-exp-item__name">{routeName}</div>
                                            <div className="map-exp-item__status">{t.routes_completed_tap}</div>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div key={exp.id} className="map-exp-item" onClick={() => navigate('/expeditions')}>
                                    <span className="map-exp-item__icon">{route.icon}</span>
                                    <div className="map-exp-item__info">
                                        <div className="map-exp-item__name">{routeName}</div>
                                        <div className="map-exp-item__status">
                                            {(() => {
                                                const tl = Math.max(0, (exp.startTime + exp.duration) - Date.now());
                                                return tl <= 0 ? t.routes_ready_short : `⏳ ${formatTime(tl)}`;
                                            })()}
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
