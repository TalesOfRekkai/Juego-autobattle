import { useGameStore } from '../../store/dojoGameStore';

export default function TopBar() {
    const resources = useGameStore(s => s.state.resources);
    const r = resources || {};

    return (
        <div className="top-bar">
            <div className="top-bar__title">REKKAIMON FORGE</div>
            <div className="top-bar__resources">
                <div className="resource-badge"><span className="icon">🔮</span>{r.essence || 0}</div>
                <div className="resource-badge"><span className="icon">🌿</span>{r.herbs || 0}</div>
                <div className="resource-badge"><span className="icon">🥚</span>{r.eggFragments || 0}</div>
                <div className="resource-badge"><span className="icon">⚡</span>{r.crystals || 0}</div>
            </div>
        </div>
    );
}
