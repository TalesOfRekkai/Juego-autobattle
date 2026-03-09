import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/dojoGameStore';
import * as BreedingLib from '../../lib/breeding';
import * as Creatures from '../../lib/creatures';
import * as Data from '../../lib/data';
import { getEffectiveBreedMinLevel } from '../../lib/buildings';
import type { Creature } from '../../types';
import { useT } from '../../lib/i18n';
import Modal from '../layout/Modal';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';

export default function BreedingScreen() {
    const allCreatures = useGameStore(s => s.state.creatures);
    const buildings = useGameStore(s => s.state.buildings);
    const breedOnchain = useGameStore(s => s.breedOnchain);
    const isPending = useGameStore(s => s.isPending);
    const minBreedLevel = getEffectiveBreedMinLevel(buildings);
    const t = useT();

    const [breedA, setBreedA] = useState<Creature | null>(null);
    const [breedB, setBreedB] = useState<Creature | null>(null);
    const [selectingSlot, setSelectingSlot] = useState<'a' | 'b' | null>(null);
    const [fusionResult, setFusionResult] = useState<Creature | null>(null);

    const available = useMemo(() => allCreatures.filter(c => !c.isOnExpedition), [allCreatures]);

    const openSelect = (slot: 'a' | 'b') => setSelectingSlot(slot);

    const selectCreature = (creature: Creature) => {
        if (selectingSlot === 'a') setBreedA(creature);
        else setBreedB(creature);
        setSelectingSlot(null);
    };

    const preview = BreedingLib.getPreview(breedA, breedB);
    const check = breedA && breedB ? BreedingLib.canBreed(breedA, breedB, buildings) : null;

    const doBreed = async () => {
        if (!breedA || !breedB || !preview) return;
        const success = await breedOnchain(breedA.id, breedB.id);
        if (success) {
            setFusionResult({
                id: 0, name: preview.name, element: preview.element,
                bodyType: 'quadruped', traits: [], type: 'fusion',
                tier: preview.tier, stage: 1, level: 1, xp: 0,
                hasBred: false, isOnExpedition: false, currentHP: 100,
                parentA: breedA.name, parentB: breedB.name,
            });
        }
    };

    const filteredForSlot = available.filter(c => {
        if (selectingSlot === 'a' && breedB && c.id === breedB.id) return false;
        if (selectingSlot === 'b' && breedA && c.id === breedA.id) return false;
        return true;
    });

    const breedable = filteredForSlot.filter(c => Creatures.canBreed(c, minBreedLevel));
    const nonBreedable = filteredForSlot.filter(c => !Creatures.canBreed(c, minBreedLevel));

    return (
        <>
            <TopBar />
            <div className="screen">
                <div className="section-header">{t.breed_room}</div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                    {t.breed_desc(minBreedLevel)}
                </p>

                <div className="breeding-slots">
                    <div className={`breeding-slot ${breedA ? 'filled' : ''}`} onClick={() => openSelect('a')}>
                        {breedA ? (
                            <>
                                <img src={Creatures.getSprite(breedA)} style={{ width: '60px', height: '60px', imageRendering: 'pixelated' }} />
                                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', marginTop: '4px' }}>{breedA.name}</div>
                                <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Lv.{breedA.level}</div>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: '36px', opacity: 0.3 }}>?</span>
                                <span style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>{t.breed_parent_a}</span>
                            </>
                        )}
                    </div>
                    <div className="breeding-plus">+</div>
                    <div className={`breeding-slot ${breedB ? 'filled' : ''}`} onClick={() => openSelect('b')}>
                        {breedB ? (
                            <>
                                <img src={Creatures.getSprite(breedB)} style={{ width: '60px', height: '60px', imageRendering: 'pixelated' }} />
                                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', marginTop: '4px' }}>{breedB.name}</div>
                                <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Lv.{breedB.level}</div>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: '36px', opacity: 0.3 }}>?</span>
                                <span style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>{t.breed_parent_b}</span>
                            </>
                        )}
                    </div>
                </div>

                {breedA && breedB && preview && (
                    <div style={{ textAlign: 'center', margin: 'var(--space-md) 0' }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--accent-secondary)', marginBottom: 'var(--space-sm)' }}>{t.breed_result_label}</div>
                        <img src={preview.sprite} style={{ width: '80px', height: '80px', imageRendering: 'pixelated', filter: 'drop-shadow(0 2px 10px rgba(157,124,216,0.4))' }} />
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', marginTop: 'var(--space-sm)' }}>{preview.name}</div>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', marginTop: 'var(--space-xs)' }}>
                            <span className={`detail-tag tag-${preview.element}`}>{Data.getElementIcon(preview.element)} {t.element_name[preview.element] || Data.getElementName(preview.element)}</span>
                            <span className={`detail-tag tier-${preview.tier}`}>{preview.tier}</span>
                        </div>
                    </div>
                )}

                {breedA && breedB && !preview && (
                    <div style={{ textAlign: 'center', margin: 'var(--space-md) 0', fontSize: '11px', color: 'var(--accent-danger)' }}>
                        {t.breed_incompatible}
                    </div>
                )}

                {check?.ok && (
                    <div style={{ textAlign: 'center' }}>
                        <button className="btn btn-gold btn-lg btn-block mt-md" onClick={doBreed} disabled={isPending}>
                            {isPending ? t.breed_fusing : t.breed_fuse_btn}
                        </button>
                    </div>
                )}
                {check && !check.ok && (
                    <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--accent-danger)', marginTop: 'var(--space-md)' }}>{check.reason}</div>
                )}
            </div>

            <Modal isOpen={selectingSlot !== null} onClose={() => setSelectingSlot(null)}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', marginBottom: 'var(--space-md)' }}>
                    {selectingSlot === 'a' ? t.breed_parent_a : t.breed_parent_b}
                </div>
                <div className="creature-grid">
                    {breedable.map(c => (
                        <div key={c.id} className="creature-card" data-element={c.element} onClick={() => selectCreature(c)} style={{ cursor: 'pointer' }}>
                            <img className="creature-card__sprite" src={Creatures.getSprite(c)} alt={c.name} />
                            <div className="creature-card__name">{c.name}</div>
                            <div className="creature-card__level">Lv.{c.level}</div>
                        </div>
                    ))}
                </div>
                {nonBreedable.length > 0 && (
                    <>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 'var(--space-md)' }}>{t.breed_not_available}</div>
                        <div className="creature-grid" style={{ opacity: 0.4, marginTop: 'var(--space-sm)' }}>
                            {nonBreedable.map(c => (
                                <div key={c.id} className="creature-card" data-element={c.element}>
                                    <img className="creature-card__sprite" src={Creatures.getSprite(c)} alt={c.name} />
                                    <div className="creature-card__name">{c.name}</div>
                                    <div className="creature-card__level">Lv.{c.level}</div>
                                    <div style={{ fontSize: '8px', color: 'var(--accent-danger)' }}>
                                        {c.hasBred ? t.breed_already_bred : c.level < minBreedLevel ? t.breed_needs_level(minBreedLevel) : t.breed_unavailable}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Modal>

            <Modal isOpen={fusionResult !== null} onClose={() => { setFusionResult(null); setBreedA(null); setBreedB(null); }}>
                {fusionResult && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '12px', color: 'var(--accent-secondary)', marginBottom: 'var(--space-md)' }}>
                            {t.breed_success}
                        </div>
                        <img src={Creatures.getSprite(fusionResult)} className="hatch-reveal"
                            style={{ width: '100px', height: '100px', imageRendering: 'pixelated', filter: 'drop-shadow(0 4px 15px rgba(157,124,216,0.5))' }} />
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '14px', marginTop: 'var(--space-md)' }}>{fusionResult.name}</div>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', marginTop: 'var(--space-sm)' }}>
                            <span className={`detail-tag tag-${fusionResult.element}`}>{Data.getElementIcon(fusionResult.element)} {t.element_name[fusionResult.element] || Data.getElementName(fusionResult.element)}</span>
                            <span className={`detail-tag tier-${fusionResult.tier}`}>{fusionResult.tier}</span>
                        </div>
                        <button className="btn btn-primary mt-lg" onClick={() => { setFusionResult(null); setBreedA(null); setBreedB(null); }}>{t.breed_continue}</button>
                    </div>
                )}
            </Modal>

            <NavBar />
        </>
    );
}
