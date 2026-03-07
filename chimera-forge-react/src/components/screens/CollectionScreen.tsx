import { useGameStore } from '../../store/gameStore';
import * as Data from '../../lib/data';
import TopBar from '../layout/TopBar';
import NavBar from '../layout/NavBar';

export default function CollectionScreen() {
    const state = useGameStore(s => s.state);
    const allEntries = Data.getAllCreatureEntries();
    const discoveredKeys = state.discoveredKeys || [];

    const grouped: Record<string, typeof allEntries> = {};
    allEntries.forEach(entry => {
        if (!grouped[entry.name]) grouped[entry.name] = [];
        grouped[entry.name].push(entry);
    });

    const speciesNames = Object.keys(grouped);

    return (
        <>
            <TopBar />
            <div className="screen">
                <div className="section-header">📖 Bestiario</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                    Descubiertos: {discoveredKeys.length} / {allEntries.length} · Especies: {speciesNames.filter(n => discoveredKeys.some(k => k.startsWith(n + '_'))).length} / {speciesNames.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {speciesNames.map(name => {
                        const stages = grouped[name];
                        const anyFound = stages.some(s => discoveredKeys.includes(s.key));
                        const template = stages[0];
                        return (
                            <div key={name} className="card" style={anyFound ? {} : { opacity: 0.3, filter: 'grayscale(1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--text-primary)', flex: 1 }}>
                                        {anyFound ? name : '???'}
                                    </div>
                                    {anyFound && (
                                        <>
                                            <span className={`detail-tag tag-${template.element}`} style={{ fontSize: '8px' }}>
                                                {Data.getElementIcon(template.element)} {Data.getElementName(template.element)}
                                            </span>
                                            <span className={`detail-tag tier-${template.tier}`} style={{ fontSize: '8px' }}>{template.tier}</span>
                                        </>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                                    {stages.map(s => {
                                        const found = discoveredKeys.includes(s.key);
                                        return (
                                            <div key={s.key} style={{ textAlign: 'center', opacity: found ? 1 : 0.2 }}>
                                                <img
                                                    src={found ? Data.getSpritePath(s.name, s.stage) : ''}
                                                    style={{
                                                        width: '56px', height: '56px', imageRendering: 'pixelated',
                                                        ...(found ? { filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' } : { visibility: 'hidden' as const })
                                                    }}
                                                    alt={found ? `${s.name} S${s.stage}` : '?'}
                                                />
                                                <div style={{ fontSize: '8px', fontFamily: 'var(--font-pixel)', color: found ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                                                    S{s.stage}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <NavBar />
        </>
    );
}
