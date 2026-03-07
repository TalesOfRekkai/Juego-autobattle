/* ============================================
   UI.JS — Screen rendering, navigation, interactions
   ============================================ */

const UI = (() => {
    let currentScreen = null;
    let expeditionTimerInterval = null;

    // --- SCREEN ROUTER ---
    function showScreen(name, params = {}) {
        currentScreen = name;
        const container = document.getElementById('screen-container');
        container.innerHTML = '';
        if (expeditionTimerInterval) {
            clearInterval(expeditionTimerInterval);
            expeditionTimerInterval = null;
        }

        switch (name) {
            case 'title': renderTitle(container); break;
            case 'egg_hatch': renderEggHatch(container, params); break;
            case 'hub': renderHub(container); break;
            case 'routes': renderRoutes(container); break;
            case 'select_team': renderSelectTeam(container, params); break;
            case 'expedition_active': renderExpeditionActive(container); break;
            case 'expedition_result': renderExpeditionResult(container, params); break;
            case 'breeding': renderBreeding(container); break;
            case 'collection': renderCollection(container); break;
            case 'creature_detail': renderCreatureDetail(container, params); break;
            case 'eggs_inventory': renderEggsInventory(container); break;
            case 'settings': renderSettings(container); break;
        }
    }

    // --- TOAST ---
    function toast(message, type = 'info') {
        const tc = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.textContent = message;
        tc.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    // --- MODAL ---
    function showModal(contentHTML) {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        content.innerHTML = contentHTML;
        overlay.classList.remove('hidden');
        overlay.onclick = (e) => {
            if (e.target === overlay) hideModal();
        };
    }

    function hideModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }

    // --- HELPERS ---
    function resourceBar() {
        const s = Game.getState();
        const r = s.resources || {};
        return `
            <div class="top-bar">
                <div class="top-bar__title">CHIMERA FORGE</div>
                <div class="top-bar__resources">
                    <div class="resource-badge"><span class="icon">🔮</span>${r.essence || 0}</div>
                    <div class="resource-badge"><span class="icon">🌿</span>${r.herbs || 0}</div>
                    <div class="resource-badge"><span class="icon">🥚</span>${r.eggFragments || 0}</div>
                    <div class="resource-badge"><span class="icon">⚡</span>${r.crystals || 0}</div>
                </div>
            </div>
        `;
    }

    function navBar(active = 'hub') {
        const completed = Game.getCompletedExpeditions().length;
        const eggs = Game.getState().eggs.length;
        return `
            <div class="nav-bar">
                <button class="nav-btn ${active === 'hub' ? 'active' : ''}" onclick="UI.showScreen('hub')">
                    <span class="icon">🏠</span>HUB
                </button>
                <button class="nav-btn ${active === 'routes' ? 'active' : ''}" onclick="UI.showScreen('routes')">
                    <span class="icon">🗺️</span>RUTAS
                    ${completed > 0 ? '<span class="pulse-dot"></span>' : ''}
                </button>
                <button class="nav-btn ${active === 'eggs' ? 'active' : ''}" onclick="UI.showScreen('eggs_inventory')">
                    <span class="icon">🥚</span>HUEVOS
                    ${eggs > 0 ? `<span style="color:var(--accent-secondary)">(${eggs})</span>` : ''}
                </button>
                <button class="nav-btn ${active === 'breeding' ? 'active' : ''}" onclick="UI.showScreen('breeding')">
                    <span class="icon">🧬</span>CRIAR
                </button>
                <button class="nav-btn ${active === 'collection' ? 'active' : ''}" onclick="UI.showScreen('collection')">
                    <span class="icon">📖</span>BESTIA
                </button>
                <button class="nav-btn ${active === 'settings' ? 'active' : ''}" onclick="UI.showScreen('settings')">
                    <span class="icon">⚙️</span>AJUSTES
                </button>
            </div>
        `;
    }

    function creatureCardHTML(creature, extra = '') {
        const stats = Creatures.getStats(creature);
        const sprite = Creatures.getSprite(creature);
        const hpPct = Math.round((creature.currentHP / stats.hp) * 100);
        return `
            <div class="creature-card" data-element="${creature.element}" 
                 onclick="UI.showScreen('creature_detail', { id: ${creature.id} })" ${extra}>
                ${creature.isOnExpedition ? '<span class="expedition-badge">RUTA</span>' : ''}
                <span class="creature-card__tier tier-${creature.tier}">${creature.tier}</span>
                ${creature.hasBred ? '<span class="bred-badge">💍</span>' : ''}
                <img class="creature-card__sprite" src="${sprite}" alt="${creature.name}"
                     onerror="this.style.background='var(--bg-elevated)'; this.alt='?'">
                <img class="creature-card__preview" src="${sprite}" alt="${creature.name}">
                <div class="creature-card__name">${creature.name}</div>
                <div class="creature-card__level">Lv.${creature.level} · S${creature.stage}</div>
                <div class="creature-card__info">${Creatures.getElementIcon(creature.element)} ${Creatures.getElementName(creature.element)}</div>
                <div class="xp-bar-container" style="width:100%">
                    <div class="xp-bar-bg"><div class="xp-bar-fill" style="width:${Creatures.getXPProgress(creature) * 100}%"></div></div>
                </div>
                ${creature.currentHP < stats.hp ? `<div style="font-size:9px;color:var(--accent-danger);margin-top:2px">HP: ${creature.currentHP}/${stats.hp}</div>` : ''}
            </div>
        `;
    }

    function statBarsHTML(creature) {
        const stats = Creatures.getStats(creature);
        const max = Math.max(stats.hp, stats.atk, stats.def, stats.spd, 1);
        return `
            <div class="stat-row"><span class="stat-label">HP</span><div class="stat-bar-bg"><div class="stat-bar-fill hp" style="width:${(stats.hp / max) * 100}%"></div></div><span class="stat-value">${stats.hp}</span></div>
            <div class="stat-row"><span class="stat-label">ATK</span><div class="stat-bar-bg"><div class="stat-bar-fill atk" style="width:${(stats.atk / max) * 100}%"></div></div><span class="stat-value">${stats.atk}</span></div>
            <div class="stat-row"><span class="stat-label">DEF</span><div class="stat-bar-bg"><div class="stat-bar-fill def" style="width:${(stats.def / max) * 100}%"></div></div><span class="stat-value">${stats.def}</span></div>
            <div class="stat-row"><span class="stat-label">SPD</span><div class="stat-bar-bg"><div class="stat-bar-fill spd" style="width:${(stats.spd / max) * 100}%"></div></div><span class="stat-value">${stats.spd}</span></div>
        `;
    }

    function formatTime(ms) {
        const s = Math.ceil(ms / 1000);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    // --- TITLE SCREEN ---
    function renderTitle(container) {
        const slots = Game.getAllSlots();

        container.innerHTML = `
            <div class="screen title-screen" style="justify-content:flex-start;padding-top:60px">
                <div class="title-logo">
                    CHIMERA<br>FORGE
                    <span>REKAIMON</span>
                </div>
                <div class="title-subtitle">
                    Colecciona, cría y evoluciona criaturas elementales. Envíalas a expediciones para ganar recursos y descubrir nuevos huevos.
                </div>

                <div class="section-header" style="width:100%;max-width:400px">Partidas Guardadas</div>

                <div style="width:100%;max-width:400px;display:flex;flex-direction:column;gap:var(--space-sm)">
                    ${slots.map(slot => {
            if (slot.empty) {
                return `
                                <div class="card" style="cursor:pointer;text-align:center;padding:var(--space-lg)"
                                     onclick="UI._startNewGame(${slot.index})">
                                    <div style="font-size:24px;opacity:0.3;margin-bottom:var(--space-sm)">+</div>
                                    <div style="font-family:var(--font-pixel);font-size:9px;color:var(--text-muted)">
                                        Nueva Partida
                                    </div>
                                </div>
                            `;
            } else {
                const date = new Date(slot.lastSaved);
                const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                return `
                                <div class="card" style="cursor:pointer;display:flex;align-items:center;gap:var(--space-md)"
                                     onclick="UI._loadSlot(${slot.index})">
                                    <div style="flex:1">
                                        <div style="font-family:var(--font-pixel);font-size:10px;color:var(--text-primary);margin-bottom:4px">
                                            ${slot.name}
                                        </div>
                                        <div style="font-size:10px;color:var(--text-secondary);display:flex;gap:var(--space-md);flex-wrap:wrap">
                                            <span>🐾 ${slot.creatures} criaturas</span>
                                            <span>⭐ Lv.${slot.maxLevel}</span>
                                            <span>🗺️ ${slot.totalExpeditions} expediciones</span>
                                        </div>
                                        <div style="font-size:9px;color:var(--text-muted);margin-top:2px">
                                            Guardado: ${dateStr}
                                        </div>
                                    </div>
                                    <button class="btn btn-danger" style="font-size:7px;padding:4px 8px" 
                                            onclick="event.stopPropagation(); UI._deleteSlot(${slot.index})">
                                        🗑️
                                    </button>
                                </div>
                            `;
            }
        }).join('')}
                </div>
            </div>
        `;
    }

    function _startNewGame(slotIndex) {
        const eggName = Game.startNewGame(slotIndex);
        showScreen('egg_hatch', { eggName, first: true });
    }

    function _loadSlot(slotIndex) {
        const success = Game.loadSlot(slotIndex);
        if (success) {
            showScreen('hub');
        } else {
            toast('Error al cargar partida', 'error');
        }
    }

    function _deleteSlot(slotIndex) {
        if (confirm(`¿Borrar Partida ${slotIndex + 1}?`)) {
            Game.deleteSlot(slotIndex);
            showScreen('title');
        }
    }

    // --- EGG HATCH SCREEN ---
    function renderEggHatch(container, params) {
        const { eggName, first, eggIndex } = params;
        const eggSprite = Data.getEggSpritePath(eggName);

        container.innerHTML = `
            <div class="screen egg-container" id="egg-screen">
                <div class="section-header" style="margin:0">
                    ${first ? '¡Tu primer Rekaimon!' : '¡Eclosión de Huevo!'}
                </div>
                <p style="color:var(--text-secondary);text-align:center;font-size:12px;">
                    ${first ? 'Toca el huevo para eclosionar tu primer compañero.' : 'Toca el huevo para ver qué criatura sale.'}
                </p>
                <img class="egg-sprite" id="egg-img" src="${eggSprite}" alt="Huevo de ${eggName}"
                     onclick="UI._hatchEgg('${eggName}', ${first ? 'true' : 'false'}, ${eggIndex !== undefined ? eggIndex : -1})"
                     onerror="this.style.background='var(--bg-elevated)'">
                <div id="hatch-result" style="text-align:center"></div>
            </div>
        `;
    }

    function _hatchEgg(eggName, first, eggIndex) {
        const eggImg = document.getElementById('egg-img');
        if (!eggImg || eggImg.classList.contains('cracking')) return;

        eggImg.classList.add('hatching');

        setTimeout(() => {
            eggImg.classList.remove('hatching');
            eggImg.classList.add('cracking');

            let creature;
            if (first) {
                creature = Game.hatchEgg(0, true);
            } else {
                creature = Game.hatchEgg(eggIndex >= 0 ? eggIndex : 0, false);
            }

            setTimeout(() => {
                if (!creature) {
                    toast('Error al eclosionar', 'error');
                    return;
                }
                const resultDiv = document.getElementById('hatch-result');
                const sprite = Creatures.getSprite(creature);
                resultDiv.innerHTML = `
                    <img class="creature-card__sprite hatch-reveal" src="${sprite}" alt="${creature.name}"
                         style="width:100px;height:100px;margin-bottom:var(--space-md)">
                    <div class="detail-name" style="font-size:16px">${creature.name}</div>
                    <div class="detail-meta" style="justify-content:center;margin-top:var(--space-sm)">
                        <span class="detail-tag tag-${creature.element}">
                            ${Creatures.getElementIcon(creature.element)} ${Creatures.getElementName(creature.element)}
                        </span>
                        <span class="detail-tag tier-${creature.tier}">${creature.tier}</span>
                    </div>
                    <p style="color:var(--text-secondary);font-size:11px;margin-top:var(--space-md)">
                        ¡${creature.name} se ha unido a tu equipo!
                    </p>
                    <button class="btn btn-primary btn-lg mt-lg" onclick="UI.showScreen('hub')">
                        Continuar ➜
                    </button>
                `;
                eggImg.style.display = 'none';
            }, 800);
        }, 1500);
    }

    // --- HUB SCREEN ---
    function renderHub(container) {
        const s = Game.getState();
        const creatures = s.creatures;
        const active = Game.getActiveExpeditions();
        const completed = Game.getCompletedExpeditions();

        container.innerHTML = `
            ${resourceBar()}
            <div class="screen" id="hub-screen">
                ${completed.length > 0 ? `
                    <div class="card" style="background:linear-gradient(135deg, rgba(115,218,202,0.1), rgba(115,218,202,0.02));border-color:var(--accent-success);margin-bottom:var(--space-md);cursor:pointer"
                         onclick="UI.showScreen('expedition_active')">
                        <div style="display:flex;align-items:center;gap:var(--space-sm)">
                            <span class="pulse-dot"></span>
                            <span style="font-family:var(--font-pixel);font-size:9px;color:var(--accent-success)">
                                ${completed.length} expedición${completed.length > 1 ? 'es' : ''} completada${completed.length > 1 ? 's' : ''} — ¡Recoge tus recompensas!
                            </span>
                        </div>
                    </div>
                ` : ''}

                ${active.length > 0 ? `
                    <div class="card" style="margin-bottom:var(--space-md);cursor:pointer" onclick="UI.showScreen('expedition_active')">
                        <div style="display:flex;align-items:center;gap:var(--space-sm)">
                            <span style="font-size:18px">⏳</span>
                            <span style="font-size:11px;color:var(--text-secondary)">
                                ${active.length} expedición${active.length > 1 ? 'es' : ''} en curso
                            </span>
                        </div>
                    </div>
                ` : ''}

                <div class="section-header">Tus Rekaimon (${creatures.length})</div>

                ${creatures.length === 0 ? `
                    <div class="empty-state">
                        <span class="icon">🥚</span>
                        <p>Aún no tienes Rekaimon. ¡Eclosiona un huevo!</p>
                    </div>
                ` : `
                    <div class="creature-grid">
                        ${creatures.map(c => creatureCardHTML(c)).join('')}
                    </div>
                `}

                ${s.eggs.length > 0 ? `
                    <div class="section-header">Huevos (${s.eggs.length})</div>
                    <div class="creature-grid">
                        ${s.eggs.map((egg, i) => `
                            <div class="egg-card" onclick="UI._tryHatchEgg(${i})">
                                <img class="egg-card__sprite" src="${Data.getEggSpritePath(egg.name)}" alt="Huevo">
                                <div class="egg-card__name">Huevo de ${egg.name}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            ${navBar('hub')}
        `;
    }

    function _tryHatchEgg(index) {
        const s = Game.getState();
        const egg = s.eggs[index];
        if (!egg) return;

        const canAfford = Resources.canAfford(s.resources, { eggFragments: Resources.FRAGMENTS_PER_HATCH });
        if (!canAfford) {
            toast(`Necesitas ${Resources.FRAGMENTS_PER_HATCH} 🥚 fragmentos para eclosionar`, 'warning');
            return;
        }

        showScreen('egg_hatch', { eggName: egg.name, first: false, eggIndex: index });
    }

    // --- ROUTES SCREEN ---
    function renderRoutes(container) {
        const s = Game.getState();
        const routes = Routes.getAllRoutes();
        const active = Game.getActiveExpeditions();
        const completed = Game.getCompletedExpeditions();

        // Build map pins HTML
        const pinsHTML = routes.map(route => {
            const canAccess = Routes.canAccessRoute(route, s.creatures);
            const pos = route.mapPos || { x: 50, y: 50 };
            const req = route.requirement;
            let reqText = '';
            if (req) {
                reqText = canAccess
                    ? `<div class="map-tooltip__req ok">✓ Req: ${req.minCreatures}× Lv${req.minLevel}+</div>`
                    : `<div class="map-tooltip__req locked">🔒 Req: ${req.minCreatures}× Lv${req.minLevel}+</div>`;
            }
            const elemName = route.element !== 'mixed' ? (Data.ELEMENTS[route.element]?.name || route.element) : 'Mixto';
            // Tooltip opens to the right by default, flip for pins on the right side
            const tooltipClass = pos.x > 60 ? 'map-tooltip--left' : '';
            return `
                <button class="map-pin ${canAccess ? '' : 'locked'}" 
                        data-element="${route.element}"
                        style="left:${pos.x}%;top:${pos.y}%"
                        ${canAccess ? `onclick="UI.showScreen('select_team', { routeId: '${route.id}' })"` : ''}>
                    <div class="map-pin__icon">${route.icon}</div>
                    <div class="map-tooltip ${tooltipClass}">
                        <div class="map-tooltip__name">${route.name}</div>
                        <div class="map-tooltip__stars">${route.stars}</div>
                        <div class="map-tooltip__meta">
                            <span>${Creatures.getElementIcon(route.element)} ${elemName}</span>
                            <span>⏱ ${formatTime(route.duration * 1000)}</span>
                        </div>
                        <div class="map-tooltip__desc">${route.description}</div>
                        ${reqText}
                    </div>
                </button>
            `;
        }).join('');

        // Build expeditions drawer
        let expHtml = '';
        if (completed.length > 0 || active.length > 0) {
            expHtml += '<div class="map-expeditions">';

            completed.forEach(exp => {
                const route = Routes.getRoute(exp.routeId);
                expHtml += `
                    <div class="map-exp-item map-exp-item--completed" onclick="UI._resolveExpedition(${exp.id})">
                        <span class="map-exp-item__icon">${route.icon}</span>
                        <div class="map-exp-item__info">
                            <div class="map-exp-item__name">${route.name}</div>
                            <div class="map-exp-item__status">✓ ¡Completada! Toca para recoger</div>
                        </div>
                    </div>
                `;
            });

            active.forEach(exp => {
                const route = Routes.getRoute(exp.routeId);
                const timeLeft = Game.getExpeditionTimeLeft(exp);
                expHtml += `
                    <div class="map-exp-item" onclick="UI.showScreen('expedition_active')">
                        <span class="map-exp-item__icon">${route.icon}</span>
                        <div class="map-exp-item__info">
                            <div class="map-exp-item__name">${route.name}</div>
                            <div class="map-exp-item__status" id="map-timer-${exp.id}">⏳ ${formatTime(timeLeft)}</div>
                        </div>
                    </div>
                `;
            });

            expHtml += '</div>';
        }

        container.innerHTML = `
            ${resourceBar()}
            <div class="map-screen">
                <div class="map-container">
                    <img class="world-map" src="Assets def/MAPANEW2.jpg" alt="Mapa del Mundo - Chimera Forge">
                    ${pinsHTML}
                </div>
                ${expHtml}
            </div>
            ${navBar('routes')}
        `;

        // Update active timers with targeted DOM updates (no flicker)
        if (active.length > 0) {
            expeditionTimerInterval = setInterval(() => {
                if (currentScreen !== 'routes') return;
                // Check for newly completed expeditions
                const newCompleted = Game.getCompletedExpeditions();
                if (newCompleted.length !== completed.length) {
                    renderRoutes(container);
                    return;
                }
                // Only update timer DOM elements
                Game.getActiveExpeditions().forEach(exp => {
                    const timerEl = document.getElementById(`map-timer-${exp.id}`);
                    if (timerEl) {
                        const timeLeft = Game.getExpeditionTimeLeft(exp);
                        timerEl.textContent = `⏳ ${formatTime(timeLeft)}`;
                    }
                });
            }, 1000);
        }
    }

    // --- TEAM SELECTION ---
    function renderSelectTeam(container, params) {
        const route = Routes.getRoute(params.routeId);
        if (!route) { showScreen('routes'); return; }

        const available = Game.getAvailableCreatures();
        const selected = params.selected || [];

        container.innerHTML = `
            ${resourceBar()}
            <div class="screen">
                <button class="back-btn" onclick="UI.showScreen('routes')">← Volver</button>

                <div class="section-header">${route.icon} ${route.name}</div>
                <div style="font-size:11px;color:var(--text-secondary);margin-bottom:var(--space-md)">
                    Selecciona tu equipo para esta expedición (max 3). 
                    ${route.element !== 'mixed' ? `<span class="advantage-hint">Ventaja: ${Data.ELEMENTS[route.element]?.name}</span>` : ''}
                </div>

                <div class="creature-grid" id="team-grid">
                    ${available.map(c => {
            const isSelected = selected.includes(c.id);
            const hasAdvantage = route.element !== 'mixed' && Data.hasElementAdvantage(c.element, route.element);
            const stats = Creatures.getStats(c);
            return `
                            <div class="creature-card ${isSelected ? 'selected' : ''}" data-element="${c.element}"
                                 onclick="UI._toggleTeamMember(${c.id}, '${params.routeId}')"
                                 id="team-card-${c.id}">
                                <img class="creature-card__sprite" src="${Creatures.getSprite(c)}" alt="${c.name}">
                                <div class="creature-card__name">${c.name}</div>
                                <div class="creature-card__level">Lv.${c.level}</div>
                                ${hasAdvantage ? '<div class="advantage-hint">⚔ Ventaja</div>' : ''}
                                ${c.currentHP < stats.hp ? `<div style="font-size:9px;color:var(--accent-danger)">HP: ${c.currentHP}/${stats.hp}</div>` : ''}
                            </div>
                        `;
        }).join('')}
                </div>

                ${available.length === 0 ? '<div class="empty-state"><span class="icon">😴</span>No tienes Rekaimon disponibles</div>' : ''}

                <div style="margin-top:var(--space-lg);text-align:center">
                    <div style="font-size:10px;color:var(--text-muted);margin-bottom:var(--space-sm)">
                        Equipo: ${selected.length}/3 · Duración: ${formatTime(route.duration * 1000)}
                    </div>
                    <button class="btn btn-success btn-lg btn-block" 
                            ${selected.length === 0 ? 'disabled' : ''}
                            onclick="UI._launchExpedition('${params.routeId}')">
                        🚀 Enviar Expedición
                    </button>
                </div>
            </div>
            ${navBar('routes')}
        `;

        // Store selected in a temp
        UI._teamSelected = selected;
        UI._teamRouteId = params.routeId;
    }

    let _teamSelected = [];
    let _teamRouteId = null;

    function _toggleTeamMember(creatureId, routeId) {
        const idx = _teamSelected.indexOf(creatureId);
        if (idx >= 0) {
            _teamSelected.splice(idx, 1);
        } else {
            if (_teamSelected.length >= 3) {
                toast('Máximo 3 criaturas por expedición', 'warning');
                return;
            }
            _teamSelected.push(creatureId);
        }
        showScreen('select_team', { routeId, selected: _teamSelected });
    }

    function _launchExpedition(routeId) {
        if (_teamSelected.length === 0) return;
        const success = Game.startExpedition(routeId, [..._teamSelected]);
        if (success) {
            toast('¡Expedición iniciada!', 'success');
            _teamSelected = [];
            showScreen('routes');
        } else {
            toast('Error al iniciar expedición', 'error');
        }
    }

    // --- EXPEDITION ACTIVE ---
    function renderExpeditionActive(container) {
        const active = Game.getActiveExpeditions();
        const completed = Game.getCompletedExpeditions();

        container.innerHTML = `
            ${resourceBar()}
            <div class="screen">
                <button class="back-btn" onclick="UI.showScreen('hub')">← Volver</button>
                <div class="section-header">Expediciones</div>

                ${completed.map(exp => {
            const route = Routes.getRoute(exp.routeId);
            return `
                        <div class="expedition-panel" style="border-color:var(--accent-success);cursor:pointer"
                             onclick="UI._resolveExpedition(${exp.id})">
                            <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm)">
                                <span style="font-size:24px">${route.icon}</span>
                                <div>
                                    <div style="font-family:var(--font-pixel);font-size:10px">${route.name}</div>
                                    <div class="advantage-hint">✓ ¡Completada!</div>
                                </div>
                            </div>
                            <button class="btn btn-success btn-block">Recoger Recompensas</button>
                        </div>
                    `;
        }).join('')}

                ${active.map(exp => {
            const route = Routes.getRoute(exp.routeId);
            const timeLeft = Game.getExpeditionTimeLeft(exp);
            const progress = 1 - timeLeft / exp.duration;
            const team = exp.creatureIds.map(id => Game.getCreatureById(id)).filter(Boolean);
            return `
                        <div class="expedition-panel">
                            <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm)">
                                <span style="font-size:24px">${route.icon}</span>
                                <div>
                                    <div style="font-family:var(--font-pixel);font-size:10px">${route.name}</div>
                                    <div style="font-size:10px;color:var(--text-secondary)">
                                        ${Creatures.getElementIcon(route.element)} ${route.element !== 'mixed' ? Data.ELEMENTS[route.element]?.name : 'Mixto'}
                                    </div>
                                </div>
                            </div>
                            <div class="expedition-timer" id="exp-timer-${exp.id}">${formatTime(timeLeft)}</div>
                            <div class="expedition-progress">
                                <div class="expedition-progress__bar" id="exp-bar-${exp.id}" style="width:${progress * 100}%"></div>
                            </div>
                            <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-sm);justify-content:center">
                                ${team.map(c => `
                                    <div style="text-align:center">
                                        <img src="${Creatures.getSprite(c)}" style="width:40px;height:40px;image-rendering:pixelated">
                                        <div style="font-size:8px;color:var(--text-muted)">${c.name}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
        }).join('')}

                ${active.length === 0 && completed.length === 0 ? `
                    <div class="empty-state">
                        <span class="icon">🗺️</span>
                        <p>No hay expediciones activas. ¡Envía a tus Rekaimon a explorar!</p>
                        <button class="btn btn-primary mt-md" onclick="UI.showScreen('routes')">Ver Rutas</button>
                    </div>
                ` : ''}
            </div>
            ${navBar('routes')}
        `;

        if (active.length > 0) {
            expeditionTimerInterval = setInterval(() => {
                if (currentScreen !== 'expedition_active') return;
                // Check for newly completed expeditions
                const newCompleted = Game.getCompletedExpeditions();
                if (newCompleted.length !== completed.length) {
                    renderExpeditionActive(container);
                    return;
                }
                // Only update timer and progress DOM elements
                Game.getActiveExpeditions().forEach(exp => {
                    const timerEl = document.getElementById(`exp-timer-${exp.id}`);
                    const barEl = document.getElementById(`exp-bar-${exp.id}`);
                    if (timerEl && barEl) {
                        const timeLeft = Game.getExpeditionTimeLeft(exp);
                        timerEl.textContent = formatTime(timeLeft);
                        barEl.style.width = `${((1 - timeLeft / exp.duration) * 100)}%`;
                    }
                });
            }, 1000);
        }
    }

    function _resolveExpedition(expId) {
        const results = Game.resolveExpedition(expId);
        if (results) {
            showScreen('expedition_result', { results });
        }
    }

    // --- EXPEDITION RESULT ---
    function renderExpeditionResult(container, params) {
        const { results } = params;
        const r = results.resources;

        container.innerHTML = `
            ${resourceBar()}
            <div class="screen">
                <div class="section-header">Resultado de Expedición</div>

                <div class="card" style="margin-bottom:var(--space-md)">
                    <div style="font-family:var(--font-pixel);font-size:10px;margin-bottom:var(--space-md);color:var(--accent-success)">
                        SUPERVIVIENTES (${results.survived.length})
                    </div>
                    <div style="display:flex;gap:var(--space-md);flex-wrap:wrap">
                        ${results.survived.map(c => `
                            <div style="text-align:center">
                                <img src="${Creatures.getSprite(c)}" style="width:50px;height:50px;image-rendering:pixelated">
                                <div style="font-size:8px;color:var(--text-primary)">${c.name}</div>
                                <div style="font-size:8px;color:var(--accent-secondary)">+${results.xpPerCreature} XP</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${results.fainted.length > 0 ? `
                    <div class="card" style="margin-bottom:var(--space-md);border-color:rgba(247,118,142,0.3)">
                        <div style="font-family:var(--font-pixel);font-size:10px;margin-bottom:var(--space-md);color:var(--accent-danger)">
                            DEBILITADOS (${results.fainted.length})
                        </div>
                        <div style="display:flex;gap:var(--space-md);flex-wrap:wrap">
                            ${results.fainted.map(c => `
                                <div style="text-align:center;opacity:0.5">
                                    <img src="${Creatures.getSprite(c)}" style="width:50px;height:50px;image-rendering:pixelated;filter:grayscale(1)">
                                    <div style="font-size:8px;color:var(--text-muted)">${c.name}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${results.evolutions.length > 0 ? `
                    <div class="card" style="margin-bottom:var(--space-md);border-color:var(--accent-secondary);background:linear-gradient(135deg, rgba(224,175,104,0.1), transparent)">
                        <div style="font-family:var(--font-pixel);font-size:10px;margin-bottom:var(--space-sm);color:var(--accent-secondary)">
                            ⭐ ¡EVOLUCIÓN!
                        </div>
                        ${results.evolutions.map(e => `
                            <div style="font-size:12px;color:var(--text-primary)">
                                ${e.name} ha evolucionado a Stage ${e.newStage}!
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div class="card" style="margin-bottom:var(--space-md)">
                    <div style="font-family:var(--font-pixel);font-size:10px;margin-bottom:var(--space-md)">RECURSOS OBTENIDOS</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-sm)">
                        ${r.essence > 0 ? `<div class="resource-badge" style="justify-content:flex-start"><span class="icon">🔮</span>+${r.essence} Esencia</div>` : ''}
                        ${r.herbs > 0 ? `<div class="resource-badge" style="justify-content:flex-start"><span class="icon">🌿</span>+${r.herbs} Hierbas</div>` : ''}
                        ${r.eggFragments > 0 ? `<div class="resource-badge" style="justify-content:flex-start"><span class="icon">🥚</span>+${r.eggFragments} Fragmentos</div>` : ''}
                        ${r.crystals > 0 ? `<div class="resource-badge" style="justify-content:flex-start"><span class="icon">⚡</span>+${r.crystals} Cristales</div>` : ''}
                    </div>
                </div>

                ${results.foundEgg ? `
                    <div class="card" style="margin-bottom:var(--space-md);border-color:var(--accent-secondary);text-align:center">
                        <div style="font-family:var(--font-pixel);font-size:10px;margin-bottom:var(--space-sm);color:var(--accent-secondary)">
                            🎉 ¡HUEVO ENCONTRADO!
                        </div>
                        <img src="${Data.getEggSpritePath(results.foundEgg)}" 
                             style="width:60px;height:60px;image-rendering:pixelated;filter:drop-shadow(0 2px 8px rgba(224,175,104,0.4))">
                        <div style="font-size:11px;margin-top:var(--space-sm)">Huevo de ${results.foundEgg}</div>
                    </div>
                ` : ''}

                <button class="btn btn-primary btn-lg btn-block mt-lg" onclick="UI.showScreen('hub')">
                    Volver al Hub
                </button>
            </div>
        `;
    }

    // --- BREEDING SCREEN ---
    function renderBreeding(container) {
        const s = Game.getState();

        container.innerHTML = `
            ${resourceBar()}
            <div class="screen" id="breeding-screen">
                <div class="section-header">🧬 Sala de Cría</div>
                <p style="font-size:11px;color:var(--text-secondary);margin-bottom:var(--space-md)">
                    Selecciona dos Rekaimon para fusionar. Cada criatura solo puede criar <strong>una vez</strong>. Nivel mínimo: ${Breeding.MIN_BREED_LEVEL}.
                </p>

                <div class="breeding-slots" id="breed-slots">
                    <div class="breeding-slot" id="breed-slot-a" onclick="UI._openBreedSelect('a')">
                        <span style="font-size:36px;opacity:0.3">?</span>
                        <span style="font-size:8px;color:var(--text-muted);margin-top:var(--space-sm)">Padre A</span>
                    </div>
                    <div class="breeding-plus">+</div>
                    <div class="breeding-slot" id="breed-slot-b" onclick="UI._openBreedSelect('b')">
                        <span style="font-size:36px;opacity:0.3">?</span>
                        <span style="font-size:8px;color:var(--text-muted);margin-top:var(--space-sm)">Padre B</span>
                    </div>
                </div>

                <div id="breed-preview" style="text-align:center;margin:var(--space-md) 0"></div>
                <div id="breed-action" style="text-align:center"></div>
            </div>
            ${navBar('breeding')}
        `;

        UI._breedA = null;
        UI._breedB = null;
    }

    let _breedA = null;
    let _breedB = null;

    function _openBreedSelect(slot) {
        const available = Game.getAvailableCreatures().filter(c => {
            if (slot === 'a' && _breedB && c.id === _breedB.id) return false;
            if (slot === 'b' && _breedA && c.id === _breedA.id) return false;
            return true;
        });

        const breedable = available.filter(c => Creatures.canBreed(c));
        const nonBreedable = available.filter(c => !Creatures.canBreed(c));

        let html = `
            <div style="font-family:var(--font-pixel);font-size:10px;margin-bottom:var(--space-md)">
                Seleccionar Padre ${slot.toUpperCase()}
            </div>
            <div class="creature-grid">
                ${breedable.map(c => `
                    <div class="creature-card" data-element="${c.element}" 
                         onclick="UI._selectBreedCreature('${slot}', ${c.id})" style="cursor:pointer">
                        <img class="creature-card__sprite" src="${Creatures.getSprite(c)}" alt="${c.name}">
                        <div class="creature-card__name">${c.name}</div>
                        <div class="creature-card__level">Lv.${c.level}</div>
                    </div>
                `).join('')}
            </div>
            ${nonBreedable.length > 0 ? `
                <div style="font-size:10px;color:var(--text-muted);margin-top:var(--space-md)">
                    No disponibles:
                </div>
                <div class="creature-grid" style="opacity:0.4;margin-top:var(--space-sm)">
                    ${nonBreedable.map(c => `
                        <div class="creature-card" data-element="${c.element}">
                            <img class="creature-card__sprite" src="${Creatures.getSprite(c)}" alt="${c.name}">
                            <div class="creature-card__name">${c.name}</div>
                            <div class="creature-card__level">Lv.${c.level}</div>
                            <div style="font-size:8px;color:var(--accent-danger)">
                                ${c.hasBred ? 'Ya crió' : c.level < 5 ? `Necesita Lv${Breeding.MIN_BREED_LEVEL}` : 'No disponible'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;

        showModal(html);
    }

    function _selectBreedCreature(slot, creatureId) {
        const creature = Game.getCreatureById(creatureId);
        if (!creature) return;

        if (slot === 'a') _breedA = creature;
        else _breedB = creature;

        hideModal();
        _updateBreedingUI();
    }

    function _updateBreedingUI() {
        // Update slots
        ['a', 'b'].forEach(slot => {
            const c = slot === 'a' ? _breedA : _breedB;
            const el = document.getElementById(`breed-slot-${slot}`);
            if (!el) return;
            if (c) {
                el.className = 'breeding-slot filled';
                el.innerHTML = `
                    <img src="${Creatures.getSprite(c)}" style="width:60px;height:60px;image-rendering:pixelated">
                    <div style="font-family:var(--font-pixel);font-size:7px;margin-top:4px">${c.name}</div>
                    <div style="font-size:9px;color:var(--text-secondary)">Lv.${c.level}</div>
                `;
            }
        });

        // Preview
        const previewDiv = document.getElementById('breed-preview');
        const actionDiv = document.getElementById('breed-action');
        if (!previewDiv || !actionDiv) return;

        if (_breedA && _breedB) {
            const check = Breeding.canBreed(_breedA, _breedB);
            const preview = Breeding.getPreview(_breedA, _breedB);

            if (preview) {
                previewDiv.innerHTML = `
                    <div style="font-family:var(--font-pixel);font-size:9px;color:var(--accent-secondary);margin-bottom:var(--space-sm)">RESULTADO</div>
                    <img src="${preview.sprite}" style="width:80px;height:80px;image-rendering:pixelated;
                         filter:drop-shadow(0 2px 10px rgba(157,124,216,0.4))">
                    <div style="font-family:var(--font-pixel);font-size:10px;margin-top:var(--space-sm)">${preview.name}</div>
                    <div style="display:flex;gap:var(--space-sm);justify-content:center;margin-top:var(--space-xs)">
                        <span class="detail-tag tag-${preview.element}">${Creatures.getElementIcon(preview.element)} ${Creatures.getElementName(preview.element)}</span>
                        <span class="detail-tag tier-${preview.tier}">${preview.tier}</span>
                    </div>
                `;
            } else {
                previewDiv.innerHTML = `
                    <div style="font-size:11px;color:var(--accent-danger)">Estos Rekaimon no son compatibles</div>
                `;
            }

            if (check.ok) {
                actionDiv.innerHTML = `
                    <button class="btn btn-gold btn-lg btn-block mt-md" onclick="UI._doBreed()">
                        🧬 ¡Fusionar!
                    </button>
                `;
            } else {
                actionDiv.innerHTML = `
                    <div style="font-size:11px;color:var(--accent-danger);margin-top:var(--space-md)">${check.reason}</div>
                `;
            }
        } else {
            previewDiv.innerHTML = '';
            actionDiv.innerHTML = '';
        }
    }

    function _doBreed() {
        if (!_breedA || !_breedB) return;
        const newCreature = Breeding.breed(_breedA, _breedB);
        if (!newCreature) {
            toast('Error en la fusión', 'error');
            return;
        }
        Game.addCreature(newCreature);
        toast(`¡${newCreature.name} ha nacido!`, 'success');

        showModal(`
            <div style="text-align:center">
                <div style="font-family:var(--font-pixel);font-size:12px;color:var(--accent-secondary);margin-bottom:var(--space-md)">
                    🧬 ¡Fusión Exitosa!
                </div>
                <img src="${Creatures.getSprite(newCreature)}" 
                     style="width:100px;height:100px;image-rendering:pixelated;filter:drop-shadow(0 4px 15px rgba(157,124,216,0.5))"
                     class="hatch-reveal">
                <div style="font-family:var(--font-pixel);font-size:14px;margin-top:var(--space-md)">${newCreature.name}</div>
                <div style="display:flex;gap:var(--space-sm);justify-content:center;margin-top:var(--space-sm)">
                    <span class="detail-tag tag-${newCreature.element}">${Creatures.getElementIcon(newCreature.element)} ${Creatures.getElementName(newCreature.element)}</span>
                    <span class="detail-tag tier-${newCreature.tier}">${newCreature.tier}</span>
                </div>
                <p style="font-size:11px;color:var(--text-secondary);margin-top:var(--space-md)">
                    Fusión de ${_breedA.name} + ${_breedB.name}
                </p>
                <button class="btn btn-primary mt-lg" onclick="UI.hideModal(); UI.showScreen('breeding')">Continuar</button>
            </div>
        `);
    }

    // --- COLLECTION / BESTIARY ---
    function renderCollection(container) {
        const s = Game.getState();
        const allEntries = Data.getAllCreatureEntries();
        const discoveredKeys = s.discoveredKeys || [];

        // Group entries by name
        const grouped = {};
        allEntries.forEach(entry => {
            if (!grouped[entry.name]) grouped[entry.name] = [];
            grouped[entry.name].push(entry);
        });

        const speciesNames = Object.keys(grouped);

        container.innerHTML = `
            ${resourceBar()}
            <div class="screen">
                <div class="section-header">📖 Bestiario</div>
                <div style="font-size:11px;color:var(--text-secondary);margin-bottom:var(--space-md)">
                    Descubiertos: ${discoveredKeys.length} / ${allEntries.length} · Especies: ${speciesNames.filter(n => discoveredKeys.some(k => k.startsWith(n + '_'))).length} / ${speciesNames.length}
                </div>
                <div style="display:flex;flex-direction:column;gap:var(--space-md)">
                    ${speciesNames.map(name => {
            const stages = grouped[name];
            const anyFound = stages.some(s => discoveredKeys.includes(s.key));
            const template = stages[0];
            return `
                        <div class="card" style="${anyFound ? '' : 'opacity:0.3;filter:grayscale(1)'}">
                            <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm)">
                                <div style="font-family:var(--font-pixel);font-size:9px;color:var(--text-primary);flex:1">
                                    ${anyFound ? name : '???'}
                                </div>
                                ${anyFound ? `
                                    <span class="detail-tag tag-${template.element}" style="font-size:8px">
                                        ${Creatures.getElementIcon(template.element)} ${Creatures.getElementName(template.element)}
                                    </span>
                                    <span class="detail-tag tier-${template.tier}" style="font-size:8px">${template.tier}</span>
                                ` : ''}
                            </div>
                            <div style="display:flex;gap:var(--space-md);justify-content:center">
                                ${stages.map(s => {
                const found = discoveredKeys.includes(s.key);
                return `
                                    <div style="text-align:center;opacity:${found ? 1 : 0.2}">
                                        <img src="${found ? Data.getSpritePath(s.name, s.stage) : ''}" 
                                             style="width:56px;height:56px;image-rendering:pixelated;${found ? 'filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4))' : 'visibility:hidden'}"
                                             alt="${found ? `${s.name} S${s.stage}` : '?'}">
                                        <div style="font-size:8px;font-family:var(--font-pixel);color:${found ? 'var(--text-secondary)' : 'var(--text-muted)'}">
                                            S${s.stage}
                                        </div>
                                    </div>
                                `;
            }).join('')}
                            </div>
                        </div>
                    `;
        }).join('')}
                </div>
            </div>
            ${navBar('collection')}
        `;
    }

    // --- SETTINGS SCREEN ---
    function renderSettings(container) {
        const slots = Game.getAllSlots();
        const activeSlotIdx = Game.getActiveSlot();

        container.innerHTML = `
            ${resourceBar()}
            <div class="screen">
                <div class="section-header">⚙️ Ajustes</div>

                <div style="font-family:var(--font-pixel);font-size:9px;margin-bottom:var(--space-sm);color:var(--text-secondary)">
                    PARTIDAS GUARDADAS
                </div>

                <div style="display:flex;flex-direction:column;gap:var(--space-sm);margin-bottom:var(--space-lg)">
                    ${slots.map(slot => {
            const isCurrent = slot.index === activeSlotIdx;
            if (slot.empty) {
                return `
                            <div class="card" style="cursor:pointer;text-align:center;padding:var(--space-md)" 
                                 onclick="UI._startNewGame(${slot.index})">
                                <div style="font-size:18px;opacity:0.3">+</div>
                                <div style="font-size:9px;color:var(--text-muted)">Nuevo en Slot ${slot.index + 1}</div>
                            </div>
                        `;
            }
            const date = new Date(slot.lastSaved);
            const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            return `
                        <div class="card" style="${isCurrent ? 'border-color:var(--accent-glow);box-shadow:0 0 12px rgba(157,124,216,0.2)' : 'cursor:pointer'}" 
                             ${!isCurrent ? `onclick="UI._switchSlot(${slot.index})"` : ''}>
                            <div style="display:flex;align-items:center;gap:var(--space-md)">
                                <div style="flex:1">
                                    <div style="display:flex;align-items:center;gap:var(--space-sm)">
                                        <span style="font-family:var(--font-pixel);font-size:10px">${slot.name}</span>
                                        ${isCurrent ? '<span style="font-size:8px;color:var(--accent-success);font-weight:700">● ACTIVA</span>' : ''}
                                    </div>
                                    <div style="font-size:10px;color:var(--text-secondary);display:flex;gap:var(--space-md);margin-top:4px">
                                        <span>🐾 ${slot.creatures}</span>
                                        <span>⭐ Lv.${slot.maxLevel}</span>
                                        <span>🗺️ ${slot.totalExpeditions}</span>
                                    </div>
                                    <div style="font-size:9px;color:var(--text-muted);margin-top:2px">${dateStr}</div>
                                </div>
                                <button class="btn btn-danger" style="font-size:7px;padding:4px 8px" 
                                        onclick="event.stopPropagation(); UI._deleteSlotFromSettings(${slot.index})">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `;
        }).join('')}
                </div>

                <button class="btn btn-secondary btn-block" onclick="UI.showScreen('title')">
                    🏠 Volver a Pantalla de Título
                </button>
            </div>
            ${navBar('settings')}
        `;
    }

    function _switchSlot(slotIndex) {
        if (confirm(`¿Cambiar a Partida ${slotIndex + 1}? Se guardará tu partida actual.`)) {
            Game.save();
            const success = Game.loadSlot(slotIndex);
            if (success) {
                toast(`Partida ${slotIndex + 1} cargada`, 'success');
                showScreen('hub');
            } else {
                toast('Error al cargar', 'error');
            }
        }
    }

    function _deleteSlotFromSettings(slotIndex) {
        const activeSlotIdx = Game.getActiveSlot();
        if (slotIndex === activeSlotIdx) {
            if (confirm('¿Borrar la partida ACTIVA? Volverás a la pantalla de título.')) {
                Game.deleteSlot(slotIndex);
                showScreen('title');
            }
        } else {
            if (confirm(`¿Borrar Partida ${slotIndex + 1}?`)) {
                Game.deleteSlot(slotIndex);
                showScreen('settings');
            }
        }
    }

    // --- CREATURE DETAIL ---
    function renderCreatureDetail(container, params) {
        const creature = Game.getCreatureById(params.id);
        if (!creature) { showScreen('hub'); return; }

        const stats = Creatures.getStats(creature);
        const xpProgress = Creatures.getXPProgress(creature);
        const nextLevelXP = Data.xpForLevel(creature.level + 1);

        container.innerHTML = `
            ${resourceBar()}
            <div class="screen">
                <button class="back-btn" onclick="UI.showScreen('hub')">← Volver</button>

                <div class="detail-header">
                    <img class="detail-sprite" src="${Creatures.getSprite(creature)}" alt="${creature.name}">
                    <div class="detail-info">
                        <div class="detail-name">${creature.name}</div>
                        <div class="detail-meta">
                            <span class="detail-tag tag-${creature.element}">
                                ${Creatures.getElementIcon(creature.element)} ${Creatures.getElementName(creature.element)}
                            </span>
                            <span class="detail-tag tier-${creature.tier}">${creature.tier}</span>
                        </div>
                        <div style="font-size:11px;color:var(--text-secondary)">
                            Nivel ${creature.level} · Stage ${creature.stage}/3
                        </div>
                        <div class="xp-bar-container">
                            <div class="xp-bar-label">XP: ${creature.xp} / ${nextLevelXP}</div>
                            <div class="xp-bar-bg"><div class="xp-bar-fill" style="width:${xpProgress * 100}%"></div></div>
                        </div>
                        <div style="font-size:10px;color:var(--text-muted);margin-top:4px">
                            HP: ${creature.currentHP} / ${stats.hp}
                            ${creature.hasBred ? ' · 💍 Ya crió' : ''}
                            ${creature.isOnExpedition ? ' · 🗺️ En expedición' : ''}
                        </div>
                    </div>
                </div>

                <div class="card" style="margin-bottom:var(--space-md)">
                    <div style="font-family:var(--font-pixel);font-size:9px;margin-bottom:var(--space-sm)">STATS</div>
                    ${statBarsHTML(creature)}
                    <div style="font-size:10px;color:var(--text-muted);margin-top:var(--space-sm)">
                        Poder total: ${Creatures.getPower(creature)}
                    </div>
                </div>

                <div class="card" style="margin-bottom:var(--space-md)">
                    <div style="font-family:var(--font-pixel);font-size:9px;margin-bottom:var(--space-sm)">RASGOS</div>
                    <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
                        ${creature.traits.map(t => `
                            <span style="font-size:10px;background:var(--bg-elevated);padding:2px 8px;border-radius:var(--radius-sm);color:var(--text-secondary)">
                                ${t.replace('_', ' ')}
                            </span>
                        `).join('')}
                    </div>
                </div>

                ${creature.parentA ? `
                    <div class="card" style="margin-bottom:var(--space-md)">
                        <div style="font-family:var(--font-pixel);font-size:9px;margin-bottom:var(--space-sm)">PADRES</div>
                        <div style="font-size:11px;color:var(--text-secondary)">
                            ${creature.parentA} × ${creature.parentB}
                        </div>
                    </div>
                ` : ''}

                <div style="font-family:var(--font-pixel);font-size:9px;margin-bottom:var(--space-sm)">EVOLUCIÓN</div>
                <div style="display:flex;gap:var(--space-md);margin-bottom:var(--space-lg);overflow-x:auto;padding-bottom:var(--space-sm)">
                    ${[1, 2, 3].map(s => {
            const isCurrentStage = creature.stage >= s;
            const requiredLevel = s === 1 ? 1 : Data.EVOLUTION_LEVELS[s];
            return `
                            <div style="text-align:center;flex-shrink:0;opacity:${isCurrentStage ? 1 : 0.3}">
                                <img src="${Data.getSpritePath(creature.name, s)}" 
                                     style="width:64px;height:64px;image-rendering:pixelated;
                                     ${isCurrentStage ? 'filter:drop-shadow(0 2px 8px rgba(157,124,216,0.3))' : 'filter:grayscale(1)'}">
                                <div style="font-size:8px;font-family:var(--font-pixel);margin-top:4px">
                                    Stage ${s}
                                </div>
                                <div style="font-size:9px;color:var(--text-muted)">Lv.${requiredLevel}+</div>
                            </div>
                        `;
        }).join('<div style="display:flex;align-items:center;color:var(--text-muted)">→</div>')}
                </div>

                <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
                    ${creature.currentHP < stats.hp ? `
                        <button class="btn btn-success" onclick="UI._healCreature(${creature.id})">
                            🌿 Curar (2 Hierbas)
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="UI._boostCreature(${creature.id})">
                        🔮 Entrenar (5 Esencia → +15 XP)
                    </button>
                </div>
            </div>
            ${navBar('hub')}
        `;
    }

    function _healCreature(id) {
        const success = Game.healCreature(id);
        if (success) {
            toast('¡Rekaimon curado!', 'success');
            showScreen('creature_detail', { id });
        } else {
            toast('No tienes suficientes hierbas', 'warning');
        }
    }

    function _boostCreature(id) {
        const success = Game.boostCreature(id);
        if (success) {
            toast('+15 XP de entrenamiento', 'success');
            showScreen('creature_detail', { id });
        } else {
            toast('No tienes suficiente esencia', 'warning');
        }
    }

    // --- EGGS INVENTORY ---
    function renderEggsInventory(container) {
        const s = Game.getState();
        const canHatch = Resources.canAfford(s.resources, { eggFragments: Resources.FRAGMENTS_PER_HATCH });

        container.innerHTML = `
            ${resourceBar()}
            <div class="screen">
                <div class="section-header">🥚 Huevos</div>
                <div style="font-size:11px;color:var(--text-secondary);margin-bottom:var(--space-md)">
                    Necesitas <strong>${Resources.FRAGMENTS_PER_HATCH} fragmentos</strong> para eclosionar un huevo.
                    Tienes: ${s.resources.eggFragments} fragmentos.
                </div>

                ${s.eggs.length > 0 ? `
                    <div class="creature-grid">
                        ${s.eggs.map((egg, i) => `
                            <div class="egg-card" onclick="UI._tryHatchEgg(${i})" 
                                 style="${canHatch ? '' : 'opacity:0.6'}">
                                <img class="egg-card__sprite" src="${Data.getEggSpritePath(egg.name)}" 
                                     alt="Huevo de ${egg.name}">
                                <div class="egg-card__name">Huevo de ${egg.name}</div>
                                ${canHatch ? '<div style="font-size:8px;color:var(--accent-success);margin-top:4px">¡Listo!</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <span class="icon">🥚</span>
                        <p>No tienes huevos. ¡Envía expediciones para encontrar!</p>
                        <button class="btn btn-primary mt-md" onclick="UI.showScreen('routes')">Ver Rutas</button>
                    </div>
                `}
            </div>
            ${navBar('eggs')}
        `;
    }

    // --- UPDATE BADGES ---
    function updateExpeditionBadges() {
        // Trigger a re-render if on hub/routes
        if (currentScreen === 'hub' || currentScreen === 'routes' || currentScreen === 'expedition_active') {
            showScreen(currentScreen);
        }
    }

    return {
        showScreen, toast, showModal, hideModal, updateExpeditionBadges,
        _startNewGame, _loadSlot, _deleteSlot, _switchSlot, _deleteSlotFromSettings,
        _hatchEgg, _tryHatchEgg,
        _toggleTeamMember, _launchExpedition, _resolveExpedition,
        _openBreedSelect, _selectBreedCreature, _doBreed,
        _healCreature, _boostCreature,
        _teamSelected, _teamRouteId, _breedA, _breedB,
    };
})();
