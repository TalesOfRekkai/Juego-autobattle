import { useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from './store/dojoGameStore';
import { DojoProvider, useDojo } from './dojo/dojoProvider';
import { dojoConfig } from './dojo/dojoConfig';
import ToastContainer from './components/layout/ToastContainer';
import TitleScreen from './components/screens/TitleScreen';
import EggHatchScreen from './components/screens/EggHatchScreen';
import HubScreen from './components/screens/HubScreen';
import RoutesScreen from './components/screens/RoutesScreen';
import SelectTeamScreen from './components/screens/SelectTeamScreen';
import ExpeditionActiveScreen from './components/screens/ExpeditionActiveScreen';
import ExpeditionResultScreen from './components/screens/ExpeditionResultScreen';
import BreedingScreen from './components/screens/BreedingScreen';
import CollectionScreen from './components/screens/CollectionScreen';
import CreatureDetailScreen from './components/screens/CreatureDetailScreen';
import EggsInventoryScreen from './components/screens/EggsInventoryScreen';
import SettingsScreen from './components/screens/SettingsScreen';

// ---- Torii helpers (inline to avoid hook dependency) ----
const ELEMENT_MAP: Record<number, string> = { 0: 'fire', 1: 'water', 2: 'earth', 3: 'air', 4: 'shadow', 5: 'light' };
const BODY_TYPE_MAP: Record<number, string> = { 0: 'quadruped', 1: 'serpentine', 2: 'avian', 3: 'biped', 4: 'insectoid', 5: 'amorphous' };

function fromFelt252(felt: string | bigint): string {
  const hex = typeof felt === 'string' ? felt : '0x' + felt.toString(16);
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  let str = '';
  for (let i = 0; i < cleanHex.length; i += 2) {
    const code = parseInt(cleanHex.slice(i, i + 2), 16);
    if (code === 0) break;
    str += String.fromCharCode(code);
  }
  return str;
}

/**
 * DojoSync — bridges DojoProvider context into Zustand store.
 * Uses getState() for Torii sync to avoid render loops.
 */
function DojoSync() {
  const { account, address, execute } = useDojo();
  const lastHashRef = useRef('');

  // Sync account + execute to Zustand (via hooks — these change infrequently)
  useEffect(() => {
    useGameStore.getState().setAccount(account, address);
  }, [account, address]);

  useEffect(() => {
    useGameStore.getState().setExecute(execute);
  }, [execute]);

  // Timeout fallback: if Torii doesn't respond in 5s, let the app load anyway
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!useGameStore.getState().onchainLoaded) {
        console.warn('Torii timeout — loading app with default state');
        useGameStore.setState({ onchainLoaded: true });
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  // Torii polling — uses getState().setState to avoid triggering re-renders
  const pollTorii = useCallback(async () => {
    if (!address) return;
    try {
      const resp = await fetch(`${dojoConfig.toriiUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `{
                        cfPlayerStateModels(where: { player: "${address}" }) {
                            edges { node { player game_started total_expeditions completed_expeditions tutorial_done missions_completed medals_earned }}
                        }
                        cfResourceInventoryModels(where: { player: "${address}" }) {
                            edges { node { essence herbs egg_fragments crystals }}
                        }
                        cfBuildingStateModels(where: { player: "${address}" }) {
                            edges { node { incubator training expeditions fusion herbalist mine }}
                        }
                        cfCreatureModelModels(where: { player: "${address}" }) {
                            edges { node { creature_id name_hash element body_type tier creature_type stage level xp current_hp has_bred is_on_expedition parent_a_hash parent_b_hash }}
                        }
                        cfEggModelModels(where: { player: "${address}" }) {
                            edges { node { egg_id name_hash exists }}
                        }
                        cfExpeditionModelModels(where: { player: "${address}" }) {
                            edges { node { expedition_id route_id creature_id_1 creature_id_2 creature_id_3 creature_count start_time duration resolved exists }}
                        }
                    }`,
        }),
      });
      const data = await resp.json();
      const hash = JSON.stringify(data);

      // Only update store when data actually changed
      if (hash === lastHashRef.current) return;
      lastHashRef.current = hash;

      const parsed = parseToriiData(data);
      useGameStore.getState().setState(parsed);
    } catch {
      // Torii unavailable — non-fatal, timeout fallback will handle it
    }
  }, [address]);

  useEffect(() => {
    if (!address) return;
    pollTorii();
    const id = setInterval(pollTorii, 3000);
    return () => clearInterval(id);
  }, [address, pollTorii]);

  return null;
}

function parseToriiData(data: any): any {
  const state: any = {
    phase: 'title',
    creatures: [],
    eggs: [],
    resources: { essence: 0, herbs: 0, eggFragments: 0, crystals: 0 },
    expeditions: [],
    discoveredNames: [],
    discoveredKeys: [],
    totalExpeditions: 0,
    completedExpeditions: 0,
    completedMissionIds: [],
    earnedMedals: [],
    tutorialDone: false,
    buildings: { incubator: 0, training: 0, expeditions: 0, fusion: 0, herbalist: 0, mine: 0 },
  };

  try {
    const playerEdges = data?.data?.cfPlayerStateModels?.edges;
    if (playerEdges?.length > 0) {
      const p = playerEdges[0].node;
      state.totalExpeditions = Number(p.total_expeditions || 0);
      state.completedExpeditions = Number(p.completed_expeditions || 0);
      state.tutorialDone = Boolean(p.tutorial_done);
    }

    const resEdges = data?.data?.cfResourceInventoryModels?.edges;
    if (resEdges?.length > 0) {
      const r = resEdges[0].node;
      state.resources = { essence: Number(r.essence || 0), herbs: Number(r.herbs || 0), eggFragments: Number(r.egg_fragments || 0), crystals: Number(r.crystals || 0) };
    }

    const buildEdges = data?.data?.cfBuildingStateModels?.edges;
    if (buildEdges?.length > 0) {
      const b = buildEdges[0].node;
      state.buildings = { incubator: Number(b.incubator || 0), training: Number(b.training || 0), expeditions: Number(b.expeditions || 0), fusion: Number(b.fusion || 0), herbalist: Number(b.herbalist || 0), mine: Number(b.mine || 0) };
    }

    const creatureEdges = data?.data?.cfCreatureModelModels?.edges;
    if (creatureEdges) {
      state.creatures = creatureEdges.map((e: any) => e.node).filter((c: any) => c.name_hash && c.name_hash !== '0x0').map((c: any) => ({
        id: Number(c.creature_id), name: fromFelt252(c.name_hash),
        element: ELEMENT_MAP[Number(c.element)] || 'fire', bodyType: BODY_TYPE_MAP[Number(c.body_type)] || 'quadruped',
        traits: [], type: Number(c.creature_type) === 0 ? 'base' : 'fusion',
        tier: Number(c.tier) === 0 ? 'common' : 'rare', stage: Number(c.stage), level: Number(c.level),
        xp: Number(c.xp), hasBred: Boolean(c.has_bred), isOnExpedition: Boolean(c.is_on_expedition),
        currentHP: Number(c.current_hp),
        parentA: c.parent_a_hash && c.parent_a_hash !== '0x0' ? fromFelt252(c.parent_a_hash) : null,
        parentB: c.parent_b_hash && c.parent_b_hash !== '0x0' ? fromFelt252(c.parent_b_hash) : null,
      }));
      const dNames = new Set<string>();
      const dKeys = new Set<string>();
      state.creatures.forEach((c: any) => { dNames.add(c.name); dKeys.add(`${c.name}_s${c.stage}`); });
      state.discoveredNames = Array.from(dNames);
      state.discoveredKeys = Array.from(dKeys);
    }

    const eggEdges = data?.data?.cfEggModelModels?.edges;
    if (eggEdges) {
      state.eggs = eggEdges.map((e: any) => e.node).filter((e: any) => e.exists).map((e: any) => ({
        name: fromFelt252(e.name_hash), id: Number(e.egg_id),
      }));
    }

    const expEdges = data?.data?.cfExpeditionModelModels?.edges;
    if (expEdges) {
      state.expeditions = expEdges.map((e: any) => e.node).filter((e: any) => e.exists && !e.resolved).map((e: any) => {
        const ids: number[] = [];
        const cnt = Number(e.creature_count || 0);
        if (cnt >= 1) ids.push(Number(e.creature_id_1));
        if (cnt >= 2) ids.push(Number(e.creature_id_2));
        if (cnt >= 3) ids.push(Number(e.creature_id_3));
        return { id: Number(e.expedition_id), routeId: fromFelt252(e.route_id), creatureIds: ids, startTime: Number(e.start_time) * 1000, duration: Number(e.duration) * 1000, resolved: Boolean(e.resolved) };
      });
    }

    if (playerEdges?.length > 0 && playerEdges[0].node.game_started) {
      state.phase = state.eggs.length > 0 && state.creatures.length === 0 ? 'egg_hatch' : 'hub';
    }
  } catch (err) {
    console.warn('Error parsing Torii data:', err);
  }

  return state;
}

function AppContent() {
  const initData = useGameStore(s => s.initData);
  const dataLoaded = useGameStore(s => s.dataLoaded);
  const onchainLoaded = useGameStore(s => s.onchainLoaded);

  useEffect(() => {
    initData();
  }, [initData]);

  if (!dataLoaded || !onchainLoaded) {
    return (
      <div id="app">
        <div id="screen-container">
          <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="title-logo">CHIMERA<br />FORGE</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-md)' }}>
              {!dataLoaded ? 'Cargando datos...' : 'Conectando con blockchain...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="app">
      <div id="screen-container">
        <Routes>
          <Route path="/" element={<TitleScreen />} />
          <Route path="/hatch" element={<EggHatchScreen />} />
          <Route path="/hub" element={<HubScreen />} />
          <Route path="/routes" element={<RoutesScreen />} />
          <Route path="/select-team" element={<SelectTeamScreen />} />
          <Route path="/expeditions" element={<ExpeditionActiveScreen />} />
          <Route path="/expedition-result" element={<ExpeditionResultScreen />} />
          <Route path="/breeding" element={<BreedingScreen />} />
          <Route path="/collection" element={<CollectionScreen />} />
          <Route path="/creature/:id" element={<CreatureDetailScreen />} />
          <Route path="/eggs" element={<EggsInventoryScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <DojoProvider>
      <BrowserRouter>
        <DojoSync />
        <AppContent />
      </BrowserRouter>
    </DojoProvider>
  );
}
