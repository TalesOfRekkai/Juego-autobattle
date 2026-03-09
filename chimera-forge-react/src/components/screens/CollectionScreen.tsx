import { useState } from 'react';
import { useGameStore } from '../../store/dojoGameStore';
import * as Data from '../../lib/data';
import * as Missions from '../../lib/missions';
import { useT } from '../../lib/i18n';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';

export default function CollectionScreen() {
    const state = useGameStore(s => s.state);
    const t = useT();
    const [showAllMissions, setShowAllMissions] = useState(true);
    const [showBestiary, setShowBestiary] = useState(true);
    const allEntries = Data.getAllCreatureEntries();
    const discoveredKeys = state.discoveredKeys || [];
    const missionProgress = Missions.getMissionsWithProgress(state);
    const completedMissions = missionProgress.filter(m => m.completed).length;

    const grouped: Record<string, typeof allEntries> = {};
    allEntries.forEach(entry => {
        if (!grouped[entry.name]) grouped[entry.name] = [];
        grouped[entry.name].push(entry);
    });

    const speciesNames = Object.keys(grouped);
    const discoveredSpecies = speciesNames.filter(n => discoveredKeys.some(k => k.startsWith(n + '_'))).length;

    return (
        <>
            <TopBar />
            <div className="screen">
                <div className="card" style={{ marginBottom: 'var(--space-md)', cursor: 'pointer' }} onClick={() => setShowAllMissions(v => !v)}>
                    <div className="section-header" style={{ marginBottom: 'var(--space-sm)' }}>
                        🎯 {t.collection_challenges} <span style={{ color: 'var(--text-muted)' }}>{showAllMissions ? '▾' : '▸'}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: showAllMissions ? 'var(--space-sm)' : 0 }}>
                        {t.collection_completed}: {completedMissions} / {missionProgress.length} · {t.collection_medals}: {state.earnedMedals.length}
                    </div>
                    {showAllMissions && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                            {missionProgress.map(mission => (
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
                                            {mission.completed ? '✓ ' : ''}{t.mission_title[mission.id] || mission.title}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)' }}>{t.mission_desc[mission.id] || mission.description}</div>
                                    </div>
                                    <div style={{ flexShrink: 0, color: mission.completed ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                                        {mission.progress} / {mission.target}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                    <div className="section-header" style={{ marginBottom: showBestiary ? 'var(--space-sm)' : 0, cursor: 'pointer' }}
                        onClick={() => setShowBestiary(v => !v)}>
                        📘 {t.collection_bestiary} <span style={{ color: 'var(--text-muted)' }}>{showBestiary ? '▾' : '▸'}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)', marginBottom: showBestiary ? 'var(--space-md)' : 0 }}>
                        {t.collection_species}: {discoveredSpecies} / {speciesNames.length} · {t.collection_entries}: {discoveredKeys.length} / {allEntries.length}
                    </div>
                    {showBestiary && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {speciesNames.map(name => {
                                const stages = grouped[name];
                                const anyFound = stages.some(s => discoveredKeys.includes(s.key));
                                const template = stages[0];
                                return (
                                    <div key={name} className="card" style={anyFound ? {} : { opacity: 0.4 }}>
                                        {anyFound ? (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--text-primary)', flex: 1 }}>
                                                        {name}
                                                    </div>
                                                    <span className={`detail-tag tag-${template.element}`} style={{ fontSize: '8px' }}>
                                                        {Data.getElementIcon(template.element)} {Data.getElementName(template.element)}
                                                    </span>
                                                    <span className={`detail-tag tier-${template.tier}`} style={{ fontSize: '8px' }}>{template.tier}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', alignItems: 'center', overflowX: 'auto', paddingBottom: 'var(--space-xs)' }}>
                                                    {stages.map((s, i) => {
                                                        const found = discoveredKeys.includes(s.key);
                                                        const requiredLevel = s.stage === 1 ? 1 : Data.EVOLUTION_LEVELS[s.stage];
                                                        return (
                                                            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                                                {i > 0 && <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>→</div>}
                                                                <div style={{ textAlign: 'center', flexShrink: 0, opacity: found ? 1 : 0.3 }}>
                                                                    <img
                                                                        src={Data.getSpritePath(s.name, s.stage)}
                                                                        style={{
                                                                            width: '64px', height: '64px', imageRendering: 'pixelated',
                                                                            filter: found
                                                                                ? 'drop-shadow(0 2px 8px rgba(157,124,216,0.3))'
                                                                                : 'grayscale(1) brightness(0.4)',
                                                                        }}
                                                                        alt={found ? `${s.name} S${s.stage}` : '?'}
                                                                    />
                                                                    <div style={{ fontSize: '8px', fontFamily: 'var(--font-pixel)', marginTop: '4px', color: found ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                                                                        Stage {s.stage}
                                                                    </div>
                                                                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                                                        Lv.{requiredLevel}+
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0' }}>
                                                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '18px', color: 'var(--text-muted)', letterSpacing: '4px' }}>
                                                    ???
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <NavBar />
        </>
    );
}
