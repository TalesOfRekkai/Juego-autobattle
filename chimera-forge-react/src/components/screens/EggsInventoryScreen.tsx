import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import { useToastStore } from '../../store/toastStore';
import * as Data from '../../lib/data';
import * as Resources from '../../lib/resources';
import { getEffectiveHatchFragmentCost } from '../../lib/buildings';
import { useT } from '../../lib/i18n';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';

export default function EggsInventoryScreen() {
    const navigate = useNavigate();
    const t = useT();
    const addToast = useToastStore(s => s.addToast);
    const state = useGameStore(s => s.state);
    const fragmentCost = getEffectiveHatchFragmentCost(state.buildings);
    const canHatch = fragmentCost === 0 || Resources.canAfford(state.resources, { eggFragments: fragmentCost });

    const tryHatchEgg = (index: number) => {
        const egg = state.eggs[index];
        if (!egg) return;
        if (!canHatch) {
            addToast(t.eggs_need_fragments(fragmentCost), 'warning');
            return;
        }
        navigate('/hatch', { state: { eggName: egg.name, first: false, eggIndex: index } });
    };

    return (
        <>
            <TopBar />
            <div className="screen">
                <div className="section-header">{t.eggs_title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                    {t.eggs_cost_desc(fragmentCost)}{' '}
                    {t.eggs_you_have(state.resources.eggFragments)}
                </div>

                {state.eggs.length > 0 ? (
                    <div className="creature-grid">
                        {state.eggs.map((egg, i) => (
                            <div key={egg.id} className="egg-card" onClick={() => tryHatchEgg(i)}
                                style={canHatch ? {} : { opacity: 0.6 }}>
                                <img className="egg-card__sprite" src={Data.getEggSpritePath(egg.name)} alt={t.egg_of(egg.name)} />
                                <div className="egg-card__name">{t.egg_of(egg.name)}</div>
                                {canHatch && <div style={{ fontSize: '8px', color: 'var(--accent-success)', marginTop: '4px' }}>{t.eggs_ready}</div>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <span className="icon">🥚</span>
                        <p>{t.eggs_empty}</p>
                        <button className="btn btn-primary mt-md" onClick={() => navigate('/routes')}>{t.eggs_see_routes}</button>
                    </div>
                )}
            </div>
            <NavBar />
        </>
    );
}
