import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';

export default function TitleScreen() {
    const navigate = useNavigate();
    const startNewGame = useGameStore(s => s.startNewGame);
    const loadSlot = useGameStore(s => s.loadSlot);
    const deleteSlot = useGameStore(s => s.deleteSlot);
    const getAllSlots = useGameStore(s => s.getAllSlots);

    const slots = useMemo(() => getAllSlots(), [getAllSlots]);

    const handleNewGame = (slotIndex: number) => {
        const eggName = startNewGame(slotIndex);
        navigate('/hatch', { state: { eggName, first: true } });
    };

    const handleLoad = (slotIndex: number) => {
        const success = loadSlot(slotIndex);
        if (success) navigate('/hub');
    };

    const handleDelete = (slotIndex: number) => {
        if (confirm(`¿Borrar Partida ${slotIndex + 1}?`)) {
            deleteSlot(slotIndex);
            navigate('/');
        }
    };

    return (
        <div className="screen title-screen" style={{ justifyContent: 'flex-start', paddingTop: '60px' }}>
            <div className="title-logo">
                CHIMERA<br />FORGE
                <span>REKAIMON</span>
            </div>
            <div className="title-subtitle">
                Colecciona, cría y evoluciona criaturas elementales. Envíalas a expediciones para ganar recursos y descubrir nuevos huevos.
            </div>

            <div className="section-header" style={{ width: '100%', maxWidth: '400px' }}>Partidas Guardadas</div>

            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {slots.map(slot => {
                    if (slot.empty) {
                        return (
                            <div key={slot.index} className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: 'var(--space-lg)' }}
                                onClick={() => handleNewGame(slot.index)}>
                                <div style={{ fontSize: '24px', opacity: 0.3, marginBottom: 'var(--space-sm)' }}>+</div>
                                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--text-muted)' }}>
                                    Nueva Partida
                                </div>
                            </div>
                        );
                    }
                    const date = new Date(slot.lastSaved || 0);
                    const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                    return (
                        <div key={slot.index} className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}
                            onClick={() => handleLoad(slot.index)}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    {slot.name}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                    <span>🐾 {slot.creatures} criaturas</span>
                                    <span>⭐ Lv.{slot.maxLevel}</span>
                                    <span>🗺️ {slot.totalExpeditions} expediciones</span>
                                </div>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Guardado: {dateStr}
                                </div>
                            </div>
                            <button className="btn btn-danger" style={{ fontSize: '7px', padding: '4px 8px' }}
                                onClick={e => { e.stopPropagation(); handleDelete(slot.index); }}>
                                🗑️
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
