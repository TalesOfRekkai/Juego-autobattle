import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useToastStore } from '../../store/toastStore';
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

export default function SelectTeamScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { routeId } = (location.state as any) || {};
    const addToast = useToastStore(s => s.addToast);
    const creatures = useGameStore(s => s.state.creatures);
    const startExpedition = useGameStore(s => s.startExpedition);
    const [selected, setSelected] = useState<number[]>([]);

    const available = useMemo(() => creatures.filter(c => !c.isOnExpedition), [creatures]);

    const route = RoutesLib.getRoute(routeId);
    if (!route) { navigate('/routes'); return null; }

    const toggleMember = (creatureId: number) => {
        setSelected(prev => {
            if (prev.includes(creatureId)) return prev.filter(id => id !== creatureId);
            if (prev.length >= 3) { addToast('Máximo 3 criaturas por expedición', 'warning'); return prev; }
            return [...prev, creatureId];
        });
    };

    const launch = () => {
        if (selected.length === 0) return;
        const success = startExpedition(routeId, [...selected]);
        if (success) {
            addToast('¡Expedición iniciada!', 'success');
            navigate('/routes');
        } else {
            addToast('Error al iniciar expedición', 'error');
        }
    };

    return (
        <>
            <TopBar />
            <div className="screen">
                <button className="back-btn" onClick={() => navigate('/routes')}>← Volver</button>
                <div className="section-header">{route.icon} {route.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                    Selecciona tu equipo para esta expedición (max 3).
                    {route.element !== 'mixed' && (
                        <span className="advantage-hint"> Ventaja: {Data.ELEMENTS[route.element]?.name}</span>
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
                                {hasAdvantage && <div className="advantage-hint">⚔ Ventaja</div>}
                                {c.currentHP < stats.hp && (
                                    <div style={{ fontSize: '9px', color: 'var(--accent-danger)' }}>HP: {c.currentHP}/{stats.hp}</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {available.length === 0 && (
                    <div className="empty-state"><span className="icon">😴</span>No tienes Rekaimon disponibles</div>
                )}

                <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                        Equipo: {selected.length}/3 · Duración: {formatTime(route.duration * 1000)}
                    </div>
                    <button className="btn btn-success btn-lg btn-block" disabled={selected.length === 0} onClick={launch}>
                        🚀 Enviar Expedición
                    </button>
                </div>
            </div>
            <NavBar />
        </>
    );
}
