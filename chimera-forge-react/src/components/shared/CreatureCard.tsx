import type { Creature } from '../../types';
import * as Creatures from '../../lib/creatures';
import { getElementIcon, getElementName } from '../../lib/data';
import { useNavigate } from 'react-router-dom';

interface CreatureCardProps {
    creature: Creature;
    onClick?: () => void;
    selected?: boolean;
    showAdvantage?: boolean;
}

export default function CreatureCard({ creature, onClick, selected, showAdvantage }: CreatureCardProps) {
    const navigate = useNavigate();
    const stats = Creatures.getStats(creature);
    const sprite = Creatures.getSprite(creature);
    const xpProgress = Creatures.getXPProgress(creature);

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(`/creature/${creature.id}`);
        }
    };

    return (
        <div
            className={`creature-card ${selected ? 'selected' : ''}`}
            data-element={creature.element}
            onClick={handleClick}
        >
            {creature.isOnExpedition && <span className="expedition-badge">RUTA</span>}
            <span className={`creature-card__tier tier-${creature.tier}`}>{creature.tier}</span>
            {creature.hasBred && <span className="bred-badge">💍</span>}
            <img className="creature-card__sprite" src={sprite} alt={creature.name}
                onError={e => { (e.target as HTMLImageElement).style.background = 'var(--bg-elevated)'; }} />
            <img className="creature-card__preview" src={sprite} alt={creature.name} />
            <div className="creature-card__name">{creature.name}</div>
            <div className="creature-card__level">Lv.{creature.level} · S{creature.stage}</div>
            <div className="creature-card__info">
                {getElementIcon(creature.element)} {getElementName(creature.element)}
            </div>
            <div className="xp-bar-container" style={{ width: '100%' }}>
                <div className="xp-bar-bg">
                    <div className="xp-bar-fill" style={{ width: `${xpProgress * 100}%` }}></div>
                </div>
            </div>
            {creature.currentHP < stats.hp && (
                <div style={{ fontSize: '9px', color: 'var(--accent-danger)', marginTop: '2px' }}>
                    HP: {creature.currentHP}/{stats.hp}
                </div>
            )}
            {showAdvantage && <div className="advantage-hint">⚔ Ventaja</div>}
        </div>
    );
}
