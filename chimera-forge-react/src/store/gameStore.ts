/* ============================================
   GAME STORE — Re-export from Dojo-backed store
   
   This file acts as a compatibility shim so all existing 
   screen imports (`from '../../store/gameStore'`) keep working
   without changing 12+ files.
   ============================================ */

export { useGameStore } from './dojoGameStore';
