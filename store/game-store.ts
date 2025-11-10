import { create } from 'zustand';
import { PublicState, Player } from '@/types/game';

interface GameStore {
  // Player info
  userId: string;
  nickname: string;
  mySeat: number | null;
  
  // Current room
  roomId: string | null;
  roomCode: string | null;
  roomStatus: 'lobby' | 'running' | 'finished';
  
  // Players in room
  players: Player[];
  
  // Game state
  gameState: PublicState | null;
  
  // Connection status
  isConnected: boolean;
  isReconnecting: boolean;
  
  // Toast messages
  toastMessage: string | null;
  
  // Actions
  setPlayerInfo: (userId: string, nickname: string) => void;
  setMySeat: (seat: number | null) => void;
  setRoom: (roomId: string, roomCode: string, status: 'lobby' | 'running' | 'finished') => void;
  setPlayers: (players: Player[]) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  setGameState: (state: PublicState | null) => void;
  setConnectionStatus: (connected: boolean, reconnecting?: boolean) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  reset: () => void;
}

const initialState = {
  userId: '',
  nickname: '',
  mySeat: null,
  roomId: null,
  roomCode: null,
  roomStatus: 'lobby' as const,
  players: [],
  gameState: null,
  isConnected: true,
  isReconnecting: false,
  toastMessage: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setPlayerInfo: (userId, nickname) => 
    set({ userId, nickname }),

  setMySeat: (seat) => 
    set({ mySeat: seat }),

  setRoom: (roomId, roomCode, status) => 
    set({ roomId, roomCode, roomStatus: status }),

  setPlayers: (players) => 
    set({ players }),

  updatePlayer: (playerId, updates) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p
      ),
    })),

  setGameState: (gameState) => 
    set({ gameState }),

  setConnectionStatus: (connected, reconnecting = false) =>
    set({ isConnected: connected, isReconnecting: reconnecting }),

  showToast: (message) => 
    set({ toastMessage: message }),

  clearToast: () => 
    set({ toastMessage: null }),

  reset: () => 
    set(initialState),
}));



