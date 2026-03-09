import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import { useToastStore } from '../../store/toastStore';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';

export default function SettingsScreen() {
    const navigate = useNavigate();
    const addToast = useToastStore(s => s.addToast);
    const getAllSlots = useGameStore(s => s.getAllSlots);
    const activeSlot = useGameStore(s => s.activeSlot);
    const save = useGameStore(s => s.save);
    const loadSlot = useGameStore(s => s.loadSlot);
    const deleteSlot = useGameStore(s => s.deleteSlot);
    const startNewGame = useGameStore(s => s.startNewGame);

    const slots = useMemo(() => getAllSlots(), [getAllSlots]);

    const handleSwitch = (slotIndex: number) => {
        if (confirm(`¿Cambiar a Partida ${slotIndex + 1}? Se guardará tu partida actual.`)) {
            save();
            const success = loadSlot(slotIndex);
            if (success) {
                addToast(`Partida ${slotIndex + 1} cargada`, 'success');
                navigate('/hub');
            } else {
                addToast('Error al cargar', 'error');
            }
        }
    };

    const handleDelete = (slotIndex: number) => {
        if (slotIndex === activeSlot) {
            if (confirm('¿Borrar la partida ACTIVA? Volverás a la pantalla de título.')) {
                deleteSlot(slotIndex);
                navigate('/');
            }
        } else {
            if (confirm(`¿Borrar Partida ${slotIndex + 1}?`)) {
                deleteSlot(slotIndex);
            }
        }
    };

    const handleNewGame = (slotIndex: number) => {
        const eggName = startNewGame(slotIndex);
        navigate('/hatch', { state: { eggName, first: true } });
    };

    return (
        <>
            <TopBar />
            <div className="screen">
                <div className="section-header">⚙️ Ajustes</div>

                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                    PARTIDAS GUARDADAS
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                    {slots.map(slot => {
                        const isCurrent = slot.index === activeSlot;
                        if (slot.empty) {
                            return (
                                <div key={slot.index} className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: 'var(--space-md)' }}
                                    onClick={() => handleNewGame(slot.index)}>
                                    <div style={{ fontSize: '18px', opacity: 0.3 }}>+</div>
                                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Nuevo en Slot {slot.index + 1}</div>
                                </div>
                            );
                        }
                        const date = new Date(slot.lastSaved || 0);
                        const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                        return (
                            <div key={slot.index} className="card"
                                style={isCurrent ? { borderColor: 'var(--accent-glow)', boxShadow: '0 0 12px rgba(157,124,216,0.2)' } : { cursor: 'pointer' }}
                                onClick={() => !isCurrent && handleSwitch(slot.index)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px' }}>{slot.name}</span>
                                            {isCurrent && <span style={{ fontSize: '8px', color: 'var(--accent-success)', fontWeight: 700 }}>● ACTIVA</span>}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', gap: 'var(--space-md)', marginTop: '4px' }}>
                                            <span>🐾 {slot.creatures}</span>
                                            <span>⭐ Lv.{slot.maxLevel}</span>
                                            <span>🗺️ {slot.totalExpeditions}</span>
                                        </div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{dateStr}</div>
                                    </div>
                                    <button className="btn btn-danger" style={{ fontSize: '7px', padding: '4px 8px' }}
                                        onClick={e => { e.stopPropagation(); handleDelete(slot.index); }}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button className="btn btn-secondary btn-block" onClick={() => navigate('/')}>
                    🏠 Volver a Pantalla de Título
                </button>
            </div>
            <NavBar />
        </>
    );
}
