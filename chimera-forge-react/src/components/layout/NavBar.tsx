import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../../store/dojoGameStore';
import { useT } from '../../lib/i18n';

export default function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const t = useT();
    const expeditions = useGameStore(s => s.state.expeditions);
    const eggs = useGameStore(s => s.state.eggs);

    const completed = expeditions.filter(e => e.resolved).length;
    const eggCount = eggs.length;

    const active = location.pathname;

    const tabs: { path: string; icon?: string; img?: string; label: string; badge?: boolean; count?: number }[] = [
        { path: '/hub', img: '/Assets def/HUB.png', label: t.nav_hub },
        { path: '/routes', img: '/Assets def/ROUTES.png', label: t.nav_routes, badge: completed > 0 },
        { path: '/eggs', img: '/Assets def/EGGS.png', label: t.nav_eggs, count: eggCount > 0 ? eggCount : undefined },
        { path: '/breeding', img: '/Assets def/BREED.png', label: t.nav_breed },
        { path: '/collection', img: '/Assets def/PROGRESS.png', label: t.nav_progress },
        { path: '/settings', img: '/Assets def/settings.png', label: t.nav_settings },
    ];

    return (
        <div className="nav-bar">
            {tabs.map(tab => (
                <button
                    key={tab.path}
                    className={`nav-btn ${active === tab.path ? 'active' : ''}`}
                    onClick={() => navigate(tab.path)}
                >
                    {tab.img ? (
                        <img
                            src={tab.img}
                            alt={tab.label}
                            className="nav-icon"
                        />
                    ) : (
                        <span className="icon">{tab.icon}</span>
                    )}
                    {tab.label}
                    {tab.badge && <span className="pulse-dot"></span>}
                    {tab.count && <span style={{ color: 'var(--accent-secondary)' }}>({tab.count})</span>}
                </button>
            ))}
        </div>
    );
}
