import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import { useToastStore } from '../../store/toastStore';
import * as Data from '../../lib/data';
import * as Creatures from '../../lib/creatures';
import { useT } from '../../lib/i18n';
import type { Creature } from '../../types';

export default function EggHatchScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const t = useT();
    const { eggName, first, eggIndex } = (location.state as { eggName?: string; first?: boolean; eggIndex?: number }) || {};
    const hatchEgg = useGameStore(s => s.hatchEgg);
    const addToast = useToastStore(s => s.addToast);

    const [phase, setPhase] = useState<'idle' | 'hatching' | 'cracking' | 'revealed'>('idle');
    const [hatchedCreature, setHatchedCreature] = useState<Creature | null>(null);

    useEffect(() => {
        if (!eggName) {
            navigate('/');
        }
    }, [eggName, navigate]);

    if (!eggName) return null;

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
                    addToast(t.egg_error, 'warning');
                    setPhase('idle');
                    navigate('/hub');
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
                {first ? t.egg_first_title : t.egg_hatch_title}
            </div>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '12px' }}>
                {first ? t.egg_first_desc : t.egg_hatch_desc}
            </p>

            {phase !== 'revealed' && (
                <img
                    className={`egg-sprite ${phase === 'hatching' ? 'hatching' : ''} ${phase === 'cracking' ? 'cracking' : ''}`}
                    src={eggSprite}
                    alt={t.egg_of(eggName)}
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
                            {Data.getElementIcon(hatchedCreature.element)} {t.element_name[hatchedCreature.element] || Data.getElementName(hatchedCreature.element)}
                        </span>
                        <span className={`detail-tag tier-${hatchedCreature.tier}`}>{hatchedCreature.tier}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: 'var(--space-md)' }}>
                        {t.egg_joined(hatchedCreature.name)}
                    </p>
                    <button className="btn btn-primary btn-lg mt-lg" onClick={() => navigate('/hub')}>
                        {t.egg_continue}
                    </button>
                </div>
            )}
        </div>
    );
}
