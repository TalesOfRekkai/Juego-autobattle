import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useToastStore } from '../../store/toastStore';
import * as Data from '../../lib/data';
import * as Creatures from '../../lib/creatures';
import type { Creature } from '../../types';

export default function EggHatchScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { eggName, first, eggIndex } = (location.state as { eggName?: string; first?: boolean; eggIndex?: number }) || {};
    const hatchEgg = useGameStore(s => s.hatchEgg);
    const addToast = useToastStore(s => s.addToast);

    const [phase, setPhase] = useState<'idle' | 'hatching' | 'cracking' | 'revealed'>('idle');
    const [hatchedCreature, setHatchedCreature] = useState<Creature | null>(null);

    if (!eggName) { navigate('/'); return null; }

    const eggSprite = Data.getEggSpritePath(eggName);

    const handleHatch = () => {
        if (phase !== 'idle') return;
        setPhase('hatching');

        setTimeout(() => {
            setPhase('cracking');

            let creature;
            if (first) {
                creature = hatchEgg(0, true);
            } else {
                const safeEggIndex = typeof eggIndex === 'number' && eggIndex >= 0 ? eggIndex : 0;
                creature = hatchEgg(safeEggIndex, false);
            }

            setTimeout(() => {
                if (!creature) {
                    addToast('No se pudo completar la eclosión. Inténtalo de nuevo.', 'warning');
                    setPhase('idle');
                    if (!first) {
                        navigate('/hub');
                    }
                    return;
                }
                setHatchedCreature(creature);
                setPhase('revealed');
            }, 800);
        }, 1500);
    };

    return (
        <div className="screen egg-container">
            <div className="section-header" style={{ margin: 0 }}>
                {first ? '¡Tu primer Rekaimon!' : '¡Eclosión de Huevo!'}
            </div>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '12px' }}>
                {first ? 'Toca el huevo para eclosionar tu primer compañero.' : 'Toca el huevo para ver qué criatura sale.'}
            </p>

            {phase !== 'revealed' && (
                <img
                    className={`egg-sprite ${phase === 'hatching' ? 'hatching' : ''} ${phase === 'cracking' ? 'cracking' : ''}`}
                    src={eggSprite}
                    alt={`Huevo de ${eggName}`}
                    onClick={handleHatch}
                    onError={e => { (e.target as HTMLImageElement).style.background = 'var(--bg-elevated)'; }}
                />
            )}

            {phase === 'revealed' && hatchedCreature && (
                <div style={{ textAlign: 'center' }}>
                    <img
                        className="creature-card__sprite hatch-reveal"
                        src={Creatures.getSprite(hatchedCreature)}
                        alt={hatchedCreature.name}
                        style={{ width: '100px', height: '100px', marginBottom: 'var(--space-md)' }}
                    />
                    <div className="detail-name" style={{ fontSize: '16px' }}>{hatchedCreature.name}</div>
                    <div className="detail-meta" style={{ justifyContent: 'center', marginTop: 'var(--space-sm)' }}>
                        <span className={`detail-tag tag-${hatchedCreature.element}`}>
                            {Data.getElementIcon(hatchedCreature.element)} {Data.getElementName(hatchedCreature.element)}
                        </span>
                        <span className={`detail-tag tier-${hatchedCreature.tier}`}>{hatchedCreature.tier}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: 'var(--space-md)' }}>
                        ¡{hatchedCreature.name} se ha unido a tu equipo!
                    </p>
                    <button className="btn btn-primary btn-lg mt-lg" onClick={() => navigate('/hub')}>
                        Continuar ➜
                    </button>
                </div>
            )}
        </div>
    );
}
