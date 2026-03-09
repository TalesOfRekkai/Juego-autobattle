import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import { useToastStore } from '../../store/toastStore';
import * as RoutesLib from '../../lib/routes';
import * as Data from '../../lib/data';
import * as Creatures from '../../lib/creatures';
import { useT } from '../../lib/i18n';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';

function formatTime(ms: number) {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function SelectTeamScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const t = useT();
    const { routeId } = (location.state as { routeId?: string }) || {};
    const addToast = useToastStore(s => s.addToast);
    const creatures = useGameStore(s => s.state.creatures);
    const startExpedition = useGameStore(s => s.startExpedition);
    const [selected, setSelected] = useState<number[]>([]);

    const available = useMemo(() => creatures.filter(c => !c.isOnExpedition), [creatures]);

    const route = routeId ? RoutesLib.getRoute(routeId) : undefined;
    useEffect(() => {
        if (!route) {
            navigate('/routes');
        }
    }, [route, navigate]);

    if (!route) return null;

    const routeName = t.route_name[route.id] || route.name;

    const toggleMember = (creatureId: number) => {
        setSelected(prev => {
            if (prev.includes(creatureId)) return prev.filter(id => id !== creatureId);
            if (prev.length >= 3) { addToast(t.team_max_creatures, 'warning'); return prev; }
            return [...prev, creatureId];
        });
    };

    const launch = () => {
        if (selected.length === 0) return;
        const success = startExpedition(route.id, [...selected]);
        if (success) {
            addToast(t.team_started, 'success');
            navigate('/routes');
        } else {
            addToast(t.team_error, 'error');
        }
    };

    return (
        <>
            <TopBar />
            <div className="screen">
                <button className="back-btn" onClick={() => navigate('/routes')}>{t.common_back}</button>
                <div className="section-header">{route.icon} {routeName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                    {t.team_select_desc}
                    {route.element !== 'mixed' && (
                        <span className="advantage-hint"> {t.team_advantage}: {t.element_name[route.element] || Data.ELEMENTS[route.element]?.name}</span>
                    )}
                </div>

                <div className="creature-grid">
                    {available.map(c => {
                        const isSelected = selected.includes(c.id);
                        const hasAdvantage = route.element !== 'mixed' && Data.hasElementAdvantage(c.element, route.element);
                        const stats = Creatures.getStats(c);
                        return (
                            <div key={c.id}
                                className={`creature-card ${isSelected ? 'selected' : ''}`}
                                data-element={c.element}
                                onClick={() => toggleMember(c.id)}
                            >
                                <img className="creature-card__sprite" src={Creatures.getSprite(c)} alt={c.name} />
                                <div className="creature-card__name">{c.name}</div>
                                <div className="creature-card__level">Lv.{c.level}</div>
                                {hasAdvantage && <div className="advantage-hint">⚔ {t.team_advantage}</div>}
                                {c.currentHP < stats.hp && (
                                    <div style={{ fontSize: '9px', color: 'var(--accent-danger)' }}>HP: {c.currentHP}/{stats.hp}</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {available.length === 0 && (
                    <div className="empty-state"><span className="icon">😴</span>{t.team_no_available}</div>
                )}

                <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                        {t.team_count(selected.length)} · {t.team_duration}: {formatTime(route.duration * 1000)}
                    </div>
                    <button className="btn btn-success btn-lg btn-block" disabled={selected.length === 0} onClick={launch}>
                        {t.team_send}
                    </button>
                </div>
            </div>
            <NavBar />
        </>
    );
}
