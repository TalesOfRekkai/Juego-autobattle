import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';

export default function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const expeditions = useGameStore(s => s.state.expeditions);
    const eggs = useGameStore(s => s.state.eggs);

    const completed = expeditions.filter(e => e.resolved).length;
    const eggCount = eggs.length;

    const active = location.pathname;

    const tabs = [
        { path: '/hub', icon: '🏠', label: 'HUB' },
        { path: '/routes', icon: '🗺️', label: 'RUTAS', badge: completed > 0 },
        { path: '/eggs', icon: '🥚', label: 'HUEVOS', count: eggCount > 0 ? eggCount : undefined },
        { path: '/breeding', icon: '🧬', label: 'CRIAR' },
        { path: '/collection', icon: '📖', label: 'BESTIA' },
        { path: '/settings', icon: '⚙️', label: 'AJUSTES' },
    ];

    return (
        <div className="nav-bar">
            {tabs.map(tab => (
                <button
                    key={tab.path}
                    className={`nav-btn ${active === tab.path ? 'active' : ''}`}
                    onClick={() => navigate(tab.path)}
                >
                    <span className="icon">{tab.icon}</span>
                    {tab.label}
                    {tab.badge && <span className="pulse-dot"></span>}
                    {tab.count && <span style={{ color: 'var(--accent-secondary)' }}>({tab.count})</span>}
                </button>
            ))}
        </div>
    );
}
