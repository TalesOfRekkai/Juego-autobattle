import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from './store/dojoGameStore';
import { DojoProvider, useDojo } from './dojo/dojoProvider';
import { useOnchainState } from './dojo/useOnchainState';
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

/** Syncs DojoProvider connection state → Zustand store */
function DojoSync() {
  const { account, address, execute } = useDojo();
  const setAccount = useGameStore(s => s.setAccount);
  const setExecute = useGameStore(s => s.setExecute);
  const setState = useGameStore(s => s.setState);

  // Sync account/address
  useEffect(() => {
    setAccount(account, address);
  }, [account, address, setAccount]);

  // Sync execute function
  useEffect(() => {
    setExecute(execute);
  }, [execute, setExecute]);

  // Sync onchain state → Zustand store
  const { state: onchainState, loading } = useOnchainState(address, dojoConfig.toriiUrl);
  useEffect(() => {
    if (!loading) {
      setState(onchainState);
    }
  }, [onchainState, loading, setState]);

  return null;
}

function AppContent() {
  const initData = useGameStore(s => s.initData);
  const dataLoaded = useGameStore(s => s.dataLoaded);

  useEffect(() => {
    initData();
  }, [initData]);

  if (!dataLoaded) {
    return (
      <div id="app">
        <div id="screen-container">
          <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="title-logo">CHIMERA<br />FORGE</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-md)' }}>Cargando...</div>
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
