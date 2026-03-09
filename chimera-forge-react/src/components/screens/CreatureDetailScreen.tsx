import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import { useToastStore } from '../../store/toastStore';
import * as Creatures from '../../lib/creatures';
import * as Data from '../../lib/data';
import { useT } from '../../lib/i18n';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';
import StatBars from '../shared/StatBars';

export default function CreatureDetailScreen() {
    const navigate = useNavigate();
    const { id } = useParams();
    const addToast = useToastStore(s => s.addToast);
    const t = useT();
    const getCreatureById = useGameStore(s => s.getCreatureById);
    const healCreature = useGameStore(s => s.healCreature);
    const boostCreature = useGameStore(s => s.boostCreature);
    const restCreature = useGameStore(s => s.restCreature);
    const getRestCooldown = useGameStore(s => s.getRestCooldown);

    const creature = getCreatureById(Number(id));
    const [restCooldown, setRestCooldown] = useState(0);

    // Update rest cooldown timer
    useEffect(() => {
        if (!creature) return;
        const update = () => setRestCooldown(getRestCooldown(creature.id));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [creature, getRestCooldown]);

    useEffect(() => {
        if (!creature) {
            navigate('/hub');
        }
    }, [creature, navigate]);

    if (!creature) return null;

    const stats = Creatures.getStats(creature);
    const xpProgress = Creatures.getXPProgress(creature);
    const nextLevelXP = Data.xpForLevel(creature.level + 1);
    const isHurt = creature.currentHP < stats.hp;
    const restCooldownHrs = Math.floor(restCooldown / 3600000);
    const restCooldownMin = Math.floor((restCooldown % 3600000) / 60000);
    const restCooldownSec = Math.floor((restCooldown % 60000) / 1000);

    const handleHeal = () => {
        const success = healCreature(creature.id);
        if (success) addToast(t.detail_healed, 'success');
        else addToast(t.detail_no_herbs, 'warning');
    };

    const handleBoost = () => {
        const success = boostCreature(creature.id);
        if (success) addToast(t.detail_trained, 'success');
        else addToast(t.detail_no_essence, 'warning');
    };

    const handleRest = () => {
        const success = restCreature(creature.id);
        if (success) addToast(t.detail_rested, 'success');
        else addToast(t.detail_rest_cooldown, 'warning');
    };

    return (
        <>
            <TopBar />
            <div className="screen">
                <button className="back-btn" onClick={() => navigate('/hub')}>{t.common_back}</button>

                <div className="detail-header">
                    <img className="detail-sprite" src={Creatures.getSprite(creature)} alt={creature.name} />
                    <div className="detail-info">
                        <div className="detail-name">{creature.name}</div>
                        <div className="detail-meta">
                            <span className={`detail-tag tag-${creature.element}`}>
                                {Data.getElementIcon(creature.element)} {t.element_name[creature.element] || Data.getElementName(creature.element)}
                            </span>
                            <span className={`detail-tag tier-${creature.tier}`}>{creature.tier}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {t.detail_level(creature.level)} · Stage {creature.stage}/3
                        </div>
                        <div className="xp-bar-container">
                            <div className="xp-bar-label">XP: {creature.xp} / {nextLevelXP}</div>
                            <div className="xp-bar-bg"><div className="xp-bar-fill" style={{ width: `${xpProgress * 100}%` }}></div></div>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            HP: {creature.currentHP} / {stats.hp}
                            {creature.hasBred && ` · 💍 ${t.detail_bred}`}
                            {creature.isOnExpedition && ` · ${t.detail_on_expedition}`}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)' }}>STATS</div>
                    <StatBars creature={creature} />
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                        {t.detail_total_power}: {Creatures.getPower(creature)}
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)' }}>{t.detail_traits}</div>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                        {creature.traits.map(tr => (
                            <span key={tr} style={{ fontSize: '10px', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
                                {tr.replace('_', ' ')}
                            </span>
                        ))}
                    </div>
                </div>

                {creature.parentA && (
                    <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)' }}>{t.detail_parents}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {creature.parentA} × {creature.parentB}
                        </div>
                    </div>
                )}

                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)' }}>{t.detail_evolution}</div>
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', overflowX: 'auto', paddingBottom: 'var(--space-sm)' }}>
                    {[1, 2, 3].map((s, i) => {
                        const isCurrentStage = creature.stage >= s;
                        const requiredLevel = s === 1 ? 1 : Data.EVOLUTION_LEVELS[s];
                        return (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                {i > 0 && <div style={{ color: 'var(--text-muted)' }}>→</div>}
                                <div style={{ textAlign: 'center', flexShrink: 0, opacity: isCurrentStage ? 1 : 0.3 }}>
                                    <img src={Data.getSpritePath(creature.name, s)}
                                        style={{ width: '64px', height: '64px', imageRendering: 'pixelated', filter: isCurrentStage ? 'drop-shadow(0 2px 8px rgba(157,124,216,0.3))' : 'grayscale(1)' }} />
                                    <div style={{ fontSize: '8px', fontFamily: 'var(--font-pixel)', marginTop: '4px' }}>Stage {s}</div>
                                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Lv.{requiredLevel}+</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    {isHurt && (
                        <button className="btn btn-success" onClick={handleHeal}>{t.detail_heal_cost}</button>
                    )}
                    {isHurt && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleRest}
                            disabled={restCooldown > 0}
                            style={{ opacity: restCooldown > 0 ? 0.5 : 1 }}
                        >
                            {restCooldown > 0
                                ? t.detail_resting(restCooldownHrs, restCooldownMin, restCooldownSec)
                                : t.detail_rest}
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={handleBoost}>{t.detail_train_cost}</button>
                </div>
            </div>
            <NavBar />
        </>
    );
}
