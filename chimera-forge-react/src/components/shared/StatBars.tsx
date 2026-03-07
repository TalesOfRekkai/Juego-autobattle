import type { Creature } from '../../types';
import * as Creatures from '../../lib/creatures';

interface StatBarsProps {
    creature: Creature;
}

export default function StatBars({ creature }: StatBarsProps) {
    const stats = Creatures.getStats(creature);
    const max = Math.max(stats.hp, stats.atk, stats.def, stats.spd, 1);

    return (
        <>
            <div className="stat-row"><span className="stat-label">HP</span><div className="stat-bar-bg"><div className="stat-bar-fill hp" style={{ width: `${(stats.hp / max) * 100}%` }}></div></div><span className="stat-value">{stats.hp}</span></div>
            <div className="stat-row"><span className="stat-label">ATK</span><div className="stat-bar-bg"><div className="stat-bar-fill atk" style={{ width: `${(stats.atk / max) * 100}%` }}></div></div><span className="stat-value">{stats.atk}</span></div>
            <div className="stat-row"><span className="stat-label">DEF</span><div className="stat-bar-bg"><div className="stat-bar-fill def" style={{ width: `${(stats.def / max) * 100}%` }}></div></div><span className="stat-value">{stats.def}</span></div>
            <div className="stat-row"><span className="stat-label">SPD</span><div className="stat-bar-bg"><div className="stat-bar-fill spd" style={{ width: `${(stats.spd / max) * 100}%` }}></div></div><span className="stat-value">{stats.spd}</span></div>
        </>
    );
}
