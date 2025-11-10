// Firestore Helper Functions
// Common operations for reading/writing to Firestore

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  DocumentReference,
  CollectionReference,
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, serverTimestamp } from './firestore-schema';
import { deserializeGameState } from './firestore-converters';
import type { Room, RoomMember, GameState, Move } from './firestore-schema';

// ============================================
// ROOMS
// ============================================

export async function createRoom(code: string, targetScore: number = 365): Promise<string> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, code);
  
  const room: any = {
    code,
    status: 'lobby',
    targetScore, // Default 365 for match
    currentGameIndex: 0,
    lastGameWinner: null,
    matchScores: {}, // Will be initialized when game starts
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(roomRef, room);
  return code;
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (!roomSnap.exists()) return null;
  
  return { id: roomSnap.id, ...roomSnap.data() } as Room;
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  return getRoom(code); // In Firestore, we use code as the document ID
}

export async function updateRoom(roomId: string, updates: Partial<Room>): Promise<void> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
  await updateDoc(roomRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void
): Unsubscribe {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
  
  return onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: snapshot.id, ...snapshot.data() } as Room);
  });
}

// ============================================
// ROOM MEMBERS
// ============================================

export async function addRoomMember(
  roomId: string,
  userId: string,
  nickname: string,
  seat: number
): Promise<void> {
  const memberRef = doc(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.MEMBERS, userId);
  
  const member: any = {
    userId,
    nickname,
    seat,
    ready: false,
    connected: true,
    joinedAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  };
  
  await setDoc(memberRef, member);
}

export async function getRoomMembers(roomId: string): Promise<RoomMember[]> {
  const membersRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.MEMBERS);
  const q = query(membersRef, orderBy('seat'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as RoomMember[];
}

export async function updateRoomMember(
  roomId: string,
  userId: string,
  updates: Partial<RoomMember>
): Promise<void> {
  const memberRef = doc(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.MEMBERS, userId);
  await updateDoc(memberRef, {
    ...updates,
    lastSeen: serverTimestamp(),
  });
}

export function subscribeToRoomMembers(
  roomId: string,
  callback: (members: RoomMember[]) => void
): Unsubscribe {
  const membersRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.MEMBERS);
  const q = query(membersRef, orderBy('seat'));
  
  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RoomMember[];
    callback(members);
  });
}

// ============================================
// GAME STATE
// ============================================

export async function createGameState(state: Partial<GameState>): Promise<void> {
  const stateRef = doc(db, COLLECTIONS.GAME_STATES, state.roomId!);
  
  await setDoc(stateRef, {
    ...state,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getGameState(roomId: string): Promise<GameState | null> {
  const stateRef = doc(db, COLLECTIONS.GAME_STATES, roomId);
  // Force fresh read from server (no cache)
  const stateSnap = await getDoc(stateRef);
  
  if (!stateSnap.exists()) return null;
  
  const rawData = stateSnap.data();
  console.log('📡 getGameState - RAW Firestore data:', {
    is4WayActive: rawData.is4WayActive,
    leftChainLen: rawData.leftChain?.length || 0,
    rightChainLen: rawData.rightChain?.length || 0,
    upChainLen: rawData.upChain?.length || 0,
    downChainLen: rawData.downChain?.length || 0,
  });
  
  const deserialized = deserializeGameState(rawData);
  
  console.log('📡 getGameState - After deserialization:', {
    is4WayActive: deserialized.is4WayActive,
    leftChainLen: deserialized.leftChain?.length || 0,
    rightChainLen: deserialized.rightChain?.length || 0,
    upChainLen: deserialized.upChain?.length || 0,
    downChainLen: deserialized.downChain?.length || 0,
  });
  
  return { id: stateSnap.id, ...deserialized } as GameState;
}

export async function updateGameState(
  roomId: string,
  updates: Partial<GameState>
): Promise<void> {
  const stateRef = doc(db, COLLECTIONS.GAME_STATES, roomId);
  await updateDoc(stateRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToGameState(
  roomId: string,
  callback: (state: GameState | null) => void
): Unsubscribe {
  const stateRef = doc(db, COLLECTIONS.GAME_STATES, roomId);
  
  return onSnapshot(stateRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    const rawData = snapshot.data();
    console.log('📡 subscribeToGameState - RAW snapshot data:', {
      is4WayActive: rawData.is4WayActive,
      boardRaw: rawData.board?.length || 0,
      leftChainRaw: rawData.leftChain?.length || 0,
      rightChainRaw: rawData.rightChain?.length || 0,
      upChainRaw: rawData.upChain?.length || 0,
      downChainRaw: rawData.downChain?.length || 0,
      lockedDoubleRaw: rawData.lockedDouble,
    });
    
    // 🔍 DEEP: Log actual raw chain data
    if (rawData.is4WayActive) {
      console.log('🔍 RAW 4-WAY CHAINS:', {
        leftChain: rawData.leftChain,
        rightChain: rawData.rightChain,
        upChain: rawData.upChain,
        downChain: rawData.downChain,
      });
    }
    
    const deserialized = deserializeGameState(rawData);
    
    console.log('📡 subscribeToGameState - After deserialization:', {
      is4WayActive: deserialized.is4WayActive,
      boardLen: deserialized.board?.length || 0,
      leftChainLen: deserialized.leftChain?.length || 0,
      rightChainLen: deserialized.rightChain?.length || 0,
      upChainLen: deserialized.upChain?.length || 0,
      downChainLen: deserialized.downChain?.length || 0,
      lockedDouble: deserialized.lockedDouble,
    });
    
    // 🔍 DEEP: Log actual deserialized chain data
    if (deserialized.is4WayActive) {
      console.log('🔍 DESERIALIZED 4-WAY CHAINS:', {
        leftChain: deserialized.leftChain,
        rightChain: deserialized.rightChain,
        upChain: deserialized.upChain,
        downChain: deserialized.downChain,
      });
    }
    
    callback({ id: snapshot.id, ...deserialized } as GameState);
  });
}

// ============================================
// MOVES
// ============================================

export async function addMove(move: Partial<Move>): Promise<string> {
  const movesRef = collection(db, COLLECTIONS.MOVES);
  const moveDoc = doc(movesRef);
  
  await setDoc(moveDoc, {
    ...move,
    createdAt: serverTimestamp(),
  });
  
  return moveDoc.id;
}

export async function getRoomMoves(
  roomId: string,
  roundIndex?: number
): Promise<Move[]> {
  const movesRef = collection(db, COLLECTIONS.MOVES);
  
  const constraints: QueryConstraint[] = [
    where('roomId', '==', roomId),
    orderBy('createdAt', 'desc'),
  ];
  
  if (roundIndex !== undefined) {
    constraints.splice(1, 0, where('roundIndex', '==', roundIndex));
  }
  
  const q = query(movesRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Move[];
}

export function subscribeToRoomMoves(
  roomId: string,
  callback: (moves: Move[]) => void
): Unsubscribe {
  const movesRef = collection(db, COLLECTIONS.MOVES);
  // Simplified query without orderBy to avoid index requirement
  const q = query(
    movesRef,
    where('roomId', '==', roomId),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    // Sort client-side instead
    const moves = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // Descending order
      }) as Move[];
    callback(moves);
  });
}

