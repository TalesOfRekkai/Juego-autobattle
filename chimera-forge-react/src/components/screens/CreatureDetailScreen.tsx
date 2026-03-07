import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useToastStore } from '../../store/toastStore';
import * as Creatures from '../../lib/creatures';
import * as Data from '../../lib/data';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';
import StatBars from '../shared/StatBars';

export default function CreatureDetailScreen() {
    const navigate = useNavigate();
    const { id } = useParams();
    const addToast = useToastStore(s => s.addToast);
    const getCreatureById = useGameStore(s => s.getCreatureById);
    const healCreature = useGameStore(s => s.healCreature);
    const boostCreature = useGameStore(s => s.boostCreature);

    const creature = getCreatureById(Number(id));
    if (!creature) { navigate('/hub'); return null; }

    const stats = Creatures.getStats(creature);
    const xpProgress = Creatures.getXPProgress(creature);
    const nextLevelXP = Data.xpForLevel(creature.level + 1);

    const handleHeal = () => {
        const success = healCreature(creature.id);
        if (success) addToast('¡Rekaimon curado!', 'success');
        else addToast('No tienes suficientes hierbas', 'warning');
    };

    const handleBoost = () => {
        const success = boostCreature(creature.id);
        if (success) addToast('+15 XP de entrenamiento', 'success');
        else addToast('No tienes suficiente esencia', 'warning');
    };

    return (
        <>
            <TopBar />
            <div className="screen">
                <button className="back-btn" onClick={() => navigate('/hub')}>← Volver</button>

                <div className="detail-header">
                    <img className="detail-sprite" src={Creatures.getSprite(creature)} alt={creature.name} />
                    <div className="detail-info">
                        <div className="detail-name">{creature.name}</div>
                        <div className="detail-meta">
                            <span className={`detail-tag tag-${creature.element}`}>
                                {Data.getElementIcon(creature.element)} {Data.getElementName(creature.element)}
                            </span>
                            <span className={`detail-tag tier-${creature.tier}`}>{creature.tier}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Nivel {creature.level} · Stage {creature.stage}/3
                        </div>
                        <div className="xp-bar-container">
                            <div className="xp-bar-label">XP: {creature.xp} / {nextLevelXP}</div>
                            <div className="xp-bar-bg"><div className="xp-bar-fill" style={{ width: `${xpProgress * 100}%` }}></div></div>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            HP: {creature.currentHP} / {stats.hp}
                            {creature.hasBred && ' · 💍 Ya crió'}
                            {creature.isOnExpedition && ' · 🗺️ En expedición'}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)' }}>STATS</div>
                    <StatBars creature={creature} />
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                        Poder total: {Creatures.getPower(creature)}
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)' }}>RASGOS</div>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                        {creature.traits.map(t => (
                            <span key={t} style={{ fontSize: '10px', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
                                {t.replace('_', ' ')}
                            </span>
                        ))}
                    </div>
                </div>

                {creature.parentA && (
                    <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)' }}>PADRES</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {creature.parentA} × {creature.parentB}
                        </div>
                    </div>
                )}

                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', marginBottom: 'var(--space-sm)' }}>EVOLUCIÓN</div>
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
                    {creature.currentHP < stats.hp && (
                        <button className="btn btn-success" onClick={handleHeal}>🌿 Curar (2 Hierbas)</button>
                    )}
                    <button className="btn btn-secondary" onClick={handleBoost}>🔮 Entrenar (5 Esencia → +15 XP)</button>
                </div>
            </div>
            <NavBar />
        </>
    );
}
