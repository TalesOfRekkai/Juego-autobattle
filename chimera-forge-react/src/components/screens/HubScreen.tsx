import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useToastStore } from '../../store/toastStore';
import * as Data from '../../lib/data';
import * as Resources from '../../lib/resources';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';
import CreatureCard from '../shared/CreatureCard';

export default function HubScreen() {
    const navigate = useNavigate();
    const addToast = useToastStore(s => s.addToast);
    const state = useGameStore(s => s.state);
    const expeditions = state.expeditions;
    const creatures = state.creatures;
    const eggs = state.eggs;

    const active = expeditions.filter(e => !e.resolved);
    const completed = expeditions.filter(e => e.resolved);

    const tryHatchEgg = (index: number) => {
        const egg = eggs[index];
        if (!egg) return;
        const canAfford = Resources.canAfford(state.resources, { eggFragments: Resources.FRAGMENTS_PER_HATCH });
        if (!canAfford) {
            addToast(`Necesitas ${Resources.FRAGMENTS_PER_HATCH} 🥚 fragmentos para eclosionar`, 'warning');
            return;
        }
        navigate('/hatch', { state: { eggName: egg.name, first: false, eggIndex: index } });
    };

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
            </div>
            <NavBar />
        </>
    );
}
