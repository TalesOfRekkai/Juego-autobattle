import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useToastStore } from '../../store/toastStore';
import * as Data from '../../lib/data';
import * as Missions from '../../lib/missions';
import * as Resources from '../../lib/resources';
import { BUILDING_DEFS, getEffectiveHatchFragmentCost, type BuildingsState } from '../../lib/buildings';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';
import CreatureCard from '../shared/CreatureCard';

export default function HubScreen() {
    const navigate = useNavigate();
    const addToast = useToastStore(s => s.addToast);
    const state = useGameStore(s => s.state);
    const upgradeBuilding = useGameStore(s => s.upgradeBuilding);
    const expeditions = state.expeditions;
    const creatures = state.creatures;
    const eggs = state.eggs;
    const buildings = state.buildings;

    const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

    const active = expeditions.filter(e => !e.resolved);
    const completed = expeditions.filter(e => e.resolved);
    const missionProgress = Missions.getMissionsWithProgress(state);
    const completedMissions = missionProgress.filter(m => m.completed).length;
    const visibleMissions = [...missionProgress]
        .sort((a, b) => Number(a.completed) - Number(b.completed))
        .slice(0, 4);

    const tryHatchEgg = (index: number) => {
        const egg = eggs[index];
        if (!egg) return;
        const fragmentCost = getEffectiveHatchFragmentCost(buildings);
        if (fragmentCost > 0 && !Resources.canAfford(state.resources, { eggFragments: fragmentCost })) {
            addToast(`Necesitas ${fragmentCost} 🥚 fragmentos para eclosionar`, 'warning');
            return;
        }
        navigate('/hatch', { state: { eggName: egg.name, first: false, eggIndex: index } });
    };

    const handleUpgrade = (buildingId: string) => {
        const success = upgradeBuilding(buildingId);
        if (success) {
            addToast('¡Edificio mejorado!', 'success');
        } else {
            addToast('No tienes suficientes recursos', 'warning');
        }
    };

    const selectedDef = BUILDING_DEFS.find(b => b.id === selectedBuilding);
    const selectedLevel = selectedBuilding ? (buildings[selectedBuilding as keyof BuildingsState] ?? 0) : 0;

    return (
        <>
            <TopBar />
            <div className="screen" id="hub-screen">
                {completed.length > 0 && (
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(115,218,202,0.1), rgba(115,218,202,0.02))', borderColor: 'var(--accent-success)', marginBottom: 'var(--space-md)', cursor: 'pointer' }}
                        onClick={() => navigate('/expeditions')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <span className="pulse-dot"></span>
                            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--accent-success)' }}>
                                {completed.length} expedición{completed.length > 1 ? 'es' : ''} completada{completed.length > 1 ? 's' : ''} — ¡Recoge tus recompensas!
                            </span>
                        </div>
                    </div>
                )}

                {active.length > 0 && (
                    <div className="card" style={{ marginBottom: 'var(--space-md)', cursor: 'pointer' }} onClick={() => navigate('/expeditions')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <span style={{ fontSize: '18px' }}>⏳</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {active.length} expedición{active.length > 1 ? 'es' : ''} en curso
                            </span>
                        </div>
                    </div>
                )}

                <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                    <div className="section-header" style={{ marginBottom: 'var(--space-sm)' }}>🎯 Objetivos</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                        Completadas: {completedMissions} / {missionProgress.length}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        {visibleMissions.map(mission => (
                            <div key={mission.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 'var(--space-sm)',
                                fontSize: '10px',
                                padding: '6px 8px',
                                borderRadius: 'var(--radius-sm)',
                                background: mission.completed ? 'rgba(115,218,202,0.08)' : 'var(--bg-elevated)',
                                border: mission.completed ? '1px solid rgba(115,218,202,0.25)' : '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: mission.completed ? 'var(--accent-success)' : 'var(--text-primary)' }}>
                                        {mission.completed ? '✓ ' : ''}{mission.title}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)' }}>{mission.description}</div>
                                </div>
                                <div style={{ flexShrink: 0, color: mission.completed ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                                    {mission.progress} / {mission.target}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section-header">Tus Rekaimon ({creatures.length})</div>

                {creatures.length === 0 ? (
                    <div className="empty-state">
                        <span className="icon">🥚</span>
                        <p>Aún no tienes Rekaimon. ¡Eclosiona un huevo!</p>
                    </div>
                ) : (
                    <div className="creature-grid">
                        {creatures.map(c => <CreatureCard key={c.id} creature={c} />)}
                    </div>
                )}

                {eggs.length > 0 && (
                    <>
                        <div className="section-header">Huevos ({eggs.length})</div>
                        <div className="creature-grid">
                            {eggs.map((egg, i) => (
                                <div key={egg.id} className="egg-card" onClick={() => tryHatchEgg(i)}>
                                    <img className="egg-card__sprite" src={Data.getEggSpritePath(egg.name)} alt="Huevo" />
                                    <div className="egg-card__name">Huevo de {egg.name}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* === BUILDINGS SECTION === */}
                <div className="section-header">🏗️ Edificios</div>
                <div className="building-grid">
                    {BUILDING_DEFS.map(def => {
                        const level = buildings[def.id as keyof BuildingsState] ?? 0;
                        const isLocked = level === 0;
                        const isMaxLevel = level >= 3;
                        return (
                            <button key={def.id} className={`building-card ${isLocked ? 'building-card--locked' : ''} ${isMaxLevel ? 'building-card--max' : ''}`}
                                onClick={() => setSelectedBuilding(def.id)}>
                                <div className="building-card__icon">{isLocked ? '🔒' : def.icon}</div>
                                <div className="building-card__name">{def.name}</div>
                                <div className="building-card__level">
                                    {isMaxLevel ? (
                                        <span style={{ color: 'var(--accent-secondary)' }}>MAX</span>
                                    ) : isLocked ? (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '7px' }}>Sin construir</span>
                                    ) : (
                                        <>
                                            {[1, 2, 3].map(i => (
                                                <span key={i} className={`building-card__pip ${i <= level ? 'active' : ''}`} />
                                            ))}
                                        </>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Building detail modal */}
            {selectedDef && (
                <div className="modal-overlay" onClick={() => setSelectedBuilding(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                            <div style={{ fontSize: '48px', marginBottom: 'var(--space-sm)' }}>{selectedDef.icon}</div>
                            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '14px', color: 'var(--text-bright)', marginBottom: 'var(--space-xs)' }}>
                                {selectedDef.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {selectedDef.description}
                            </div>
                        </div>

                        {/* Level progression */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                            {selectedDef.levels.map((lvl, i) => {
                                const lvlNum = i + 1;
                                const isUnlocked = selectedLevel >= lvlNum;
                                const isCurrent = selectedLevel === i; // can upgrade to this level
                                const cost = lvl.cost;
                                return (
                                    <div key={i} className="card" style={{
                                        opacity: isUnlocked ? 1 : (isCurrent ? 0.9 : 0.4),
                                        borderColor: isUnlocked ? 'var(--accent-success)' : (isCurrent ? 'var(--accent-primary)' : 'transparent'),
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: isUnlocked ? 'var(--accent-success)' : 'var(--text-primary)' }}>
                                                {isUnlocked ? '✓' : ''} Nivel {lvlNum}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                                            {lvl.description}
                                        </div>
                                        {!isUnlocked && (
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-md)' }}>
                                                {cost.essence && <span>✨ {cost.essence}</span>}
                                                {cost.crystals && <span>💎 {cost.crystals}</span>}
                                                {cost.herbs && <span>🌿 {cost.herbs}</span>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Upgrade button */}
                        {selectedLevel < 3 ? (
                            <button className="btn btn-primary btn-block btn-lg" onClick={() => handleUpgrade(selectedDef.id)}>
                                {selectedLevel === 0 ? '🔨 Construir' : `🔨 Mejorar a Nivel ${selectedLevel + 1}`}
                            </button>
                        ) : (
                            <div style={{ textAlign: 'center', fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--accent-secondary)' }}>
                                ⭐ Nivel máximo alcanzado
                            </div>
                        )}

                        <button className="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-sm)' }}
                            onClick={() => setSelectedBuilding(null)}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            <NavBar />
        </>
    );
}
