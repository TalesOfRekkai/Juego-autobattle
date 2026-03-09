import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import { useToastStore } from '../../store/toastStore';
import * as Data from '../../lib/data';
import * as Resources from '../../lib/resources';
import { BUILDING_DEFS, getEffectiveHatchFragmentCost, type BuildingsState } from '../../lib/buildings';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';
import CreatureCard from '../shared/CreatureCard';
import { useT } from '../../lib/i18n';

// Map building IDs to their image file prefixes
const BUILDING_IMAGE_PREFIX: Record<string, string> = {
    incubator: 'Incubadora',
    training: 'CampoEntrenamiento',
    expeditions: 'TorreEntrenamiento',
    fusion: 'Fusion',
    herbalist: 'Hervolario',
    mine: 'Cristalario',
};

function getBuildingImage(buildingId: string, level: number): string {
    const prefix = BUILDING_IMAGE_PREFIX[buildingId] || 'Incubadora';
    const imgLevel = Math.max(1, Math.min(level, 3)); // clamp to 1-3
    return `/Assets def/${prefix}${imgLevel}.png`;
}

export default function HubScreen() {
    const navigate = useNavigate();
    const addToast = useToastStore(s => s.addToast);
    const t = useT();
    const state = useGameStore(s => s.state);
    const upgradeBuilding = useGameStore(s => s.upgradeBuilding);
    const expeditions = state.expeditions;
    const creatures = state.creatures;
    const eggs = state.eggs;
    const buildings = state.buildings;

    const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

    const active = expeditions.filter(e => !e.resolved);
    const completed = expeditions.filter(e => e.resolved);

    const tryHatchEgg = (index: number) => {
        const egg = eggs[index];
        if (!egg) return;
        const fragmentCost = getEffectiveHatchFragmentCost(buildings);
        if (fragmentCost > 0 && !Resources.canAfford(state.resources, { eggFragments: fragmentCost })) {
            addToast(t.hub_need_fragments(fragmentCost), 'warning');
            return;
        }
        navigate('/hatch', { state: { eggName: egg.name, first: false, eggIndex: index } });
    };

    const handleUpgrade = (buildingId: string) => {
        const success = upgradeBuilding(buildingId);
        if (success) {
            addToast(t.hub_building_upgraded, 'success');
        } else {
            addToast(t.hub_not_enough_resources, 'warning');
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
                                {t.hub_expedition_done(completed.length)}
                            </span>
                        </div>
                    </div>
                )}

                {active.length > 0 && (
                    <div className="card" style={{ marginBottom: 'var(--space-md)', cursor: 'pointer' }} onClick={() => navigate('/expeditions')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <span style={{ fontSize: '18px' }}>⏳</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {t.hub_expedition_active(active.length)}
                            </span>
                        </div>
                    </div>
                )}

                <div className="section-header">{t.hub_creatures_title(creatures.length)}</div>

                {creatures.length === 0 ? (
                    <div className="empty-state">
                        <span className="icon">🥚</span>
                        <p>{t.hub_no_creatures}</p>
                    </div>
                ) : (
                    <div className="creature-grid">
                        {creatures.map(c => <CreatureCard key={c.id} creature={c} />)}
                    </div>
                )}

                {eggs.length > 0 && (
                    <>
                        <div className="section-header">{t.hub_eggs_title(eggs.length)}</div>
                        <div className="creature-grid">
                            {eggs.map((egg, i) => (
                                <div key={egg.id} className="egg-card" onClick={() => tryHatchEgg(i)}>
                                    <img className="egg-card__sprite" src={Data.getEggSpritePath(egg.name)} alt="Huevo" />
                                    <div className="egg-card__name">{t.hub_egg_name(egg.name)}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* === BUILDINGS SECTION === */}
                <div className="section-header">{t.hub_buildings}</div>
                <div className="building-grid">
                    {BUILDING_DEFS.map(def => {
                        const level = buildings[def.id as keyof BuildingsState] ?? 0;
                        const isLocked = level === 0;
                        const isMaxLevel = level >= 3;
                        return (
                            <button key={def.id} className={`building-card ${isLocked ? 'building-card--locked' : ''} ${isMaxLevel ? 'building-card--max' : ''}`}
                                onClick={() => setSelectedBuilding(def.id)}>
                                <img
                                    src={getBuildingImage(def.id, isLocked ? 1 : level)}
                                    alt={def.name}
                                    style={{
                                        width: '140px',
                                        height: '140px',
                                        imageRendering: 'pixelated',
                                        objectFit: 'contain',
                                        filter: isLocked ? 'brightness(0.3) grayscale(0.8)' : 'none',
                                        transition: 'filter 0.3s ease',
                                    }}
                                />
                                <div className="building-card__name">{t.building_name[def.id] || def.name}</div>
                                <div className="building-card__level">
                                    {isMaxLevel ? (
                                        <span style={{ color: 'var(--accent-secondary)' }}>{t.common_max}</span>
                                    ) : isLocked ? (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '7px' }}>{t.hub_not_built}</span>
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
                            <img
                                src={getBuildingImage(selectedDef.id, selectedLevel === 0 ? 1 : selectedLevel)}
                                alt={selectedDef.name}
                                style={{
                                    width: '200px',
                                    height: '200px',
                                    imageRendering: 'pixelated',
                                    objectFit: 'contain',
                                    filter: selectedLevel === 0 ? 'brightness(0.4) grayscale(0.6)' : 'drop-shadow(0 4px 12px rgba(157,124,216,0.4))',
                                    marginBottom: 'var(--space-sm)',
                                }}
                            />
                            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '14px', color: 'var(--text-bright)', marginBottom: 'var(--space-xs)' }}>
                                {t.building_name[selectedDef.id] || selectedDef.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {t.building_desc[selectedDef.id] || selectedDef.description}
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
                                                {isUnlocked ? '✓' : ''} {t.hub_level(lvlNum)}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                                            {t.building_level[`${selectedDef.id}_${lvlNum}`] || lvl.description}
                                        </div>
                                        {!isUnlocked && (
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-md)' }}>
                                                {cost.essence && <span>🔮 {cost.essence}</span>}
                                                {cost.crystals && <span>⚡ {cost.crystals}</span>}
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
                                {selectedLevel === 0 ? t.hub_build : t.hub_upgrade(selectedLevel + 1)}
                            </button>
                        ) : (
                            <div style={{ textAlign: 'center', fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--accent-secondary)' }}>
                                {t.hub_max_level}
                            </div>
                        )}

                        <button className="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-sm)' }}
                            onClick={() => setSelectedBuilding(null)}>
                            {t.hub_close}
                        </button>
                    </div>
                </div>
            )}

            <NavBar />
        </>
    );
}
