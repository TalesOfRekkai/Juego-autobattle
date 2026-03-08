import type { GameState } from '../types';

export interface MissionDef {
    id: string;
    title: string;
    description: string;
    target: number;
    medalId: string;
    getProgress: (state: GameState) => number;
}

export interface MissionProgress extends MissionDef {
    progress: number;
    completed: boolean;
}

export const MISSION_DEFS: MissionDef[] = [
    {
        id: 'first_steps',
        title: 'Primeros pasos',
        description: 'Completa 3 expediciones',
        target: 3,
        medalId: 'medal_first_steps',
        getProgress: (state) => state.completedExpeditions,
    },
    {
        id: 'seasoned_explorer',
        title: 'Explorador tenaz',
        description: 'Completa 10 expediciones',
        target: 10,
        medalId: 'medal_seasoned_explorer',
        getProgress: (state) => state.completedExpeditions,
    },
    {
        id: 'rookie_bestiary',
        title: 'Bestiario novato',
        description: 'Descubre 5 especies',
        target: 5,
        medalId: 'medal_rookie_bestiary',
        getProgress: (state) => state.discoveredNames.length,
    },
    {
        id: 'bestiary_hunter',
        title: 'Cazador de especies',
        description: 'Descubre 10 especies',
        target: 10,
        medalId: 'medal_bestiary_hunter',
        getProgress: (state) => state.discoveredNames.length,
    },
    {
        id: 'first_fusion',
        title: 'Primera fusión',
        description: 'Crea 1 Rekaimon de fusión',
        target: 1,
        medalId: 'medal_first_fusion',
        getProgress: (state) => state.creatures.filter(c => c.type === 'fusion').length,
    },
    {
        id: 'chimera_smith',
        title: 'Forjador quimérico',
        description: 'Crea 3 Rekaimon de fusión',
        target: 3,
        medalId: 'medal_chimera_smith',
        getProgress: (state) => state.creatures.filter(c => c.type === 'fusion').length,
    },
    {
        id: 'final_form',
        title: 'Forma definitiva',
        description: 'Consigue un Rekaimon en Stage 3',
        target: 1,
        medalId: 'medal_final_form',
        getProgress: (state) => (state.creatures.some(c => c.stage >= 3) ? 1 : 0),
    },
    {
        id: 'growing_team',
        title: 'Equipo en crecimiento',
        description: 'Consigue 6 Rekaimon',
        target: 6,
        medalId: 'medal_growing_team',
        getProgress: (state) => state.creatures.length,
    },
];

export function getAllMissions(): MissionDef[] {
    return MISSION_DEFS;
}

export function getMissionProgress(mission: MissionDef, state: GameState): number {
    return Math.max(0, Math.min(mission.target, mission.getProgress(state)));
}

export function isMissionCompleted(mission: MissionDef, state: GameState): boolean {
    return mission.getProgress(state) >= mission.target;
}

export function getMissionsWithProgress(state: GameState): MissionProgress[] {
    return MISSION_DEFS.map(mission => ({
        ...mission,
        progress: getMissionProgress(mission, state),
        completed: isMissionCompleted(mission, state),
    }));
}

export function getNewlyCompletedMissions(state: GameState, completedMissionIds: string[]): MissionDef[] {
    return MISSION_DEFS.filter(mission =>
        !completedMissionIds.includes(mission.id) && isMissionCompleted(mission, state)
    );
}
