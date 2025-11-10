'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreatePlayerId } from '@/lib/firebase';
import { startGame } from '@/lib/api-client';
import {
  getRoom,
  getRoomMembers,
  updateRoomMember,
  subscribeToRoom,
  subscribeToRoomMembers,
} from '@/lib/firestore-helpers';
import { useGameStore } from '@/store/game-store';
import { Copy, Check, Users, Crown, Loader2 } from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  nickname: string;
  seat: number;
  ready: boolean;
  connected: boolean;
}

export default function RoomLobby({ params }: { params: { code: string } }) {
  const roomCode = params.code.toUpperCase();
  const router = useRouter();
  
  const { userId, setPlayerInfo, setMySeat, setRoom } = useGameStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<string>('lobby');
  const [isHost, setIsHost] = useState(false);
  const [myReady, setMyReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get player info
    const { userId: id, nickname } = getOrCreatePlayerId();
    setPlayerInfo(id, nickname);

    initializeRoom();

    return () => {
      // Cleanup handled by Firestore unsubscribe
    };
  }, []);

  const initializeRoom = async () => {
    try {
      const { userId } = getOrCreatePlayerId();

      // Get room
      const room = await getRoom(roomCode);

      if (!room) {
        setError('Room not found');
        setLoading(false);
        return;
      }

      setRoomId(room.id);
      setRoomStatus(room.status);
      setRoom(room.id, room.code, room.status);

      // If game already started, redirect to game
      if (room.status === 'running') {
        router.push(`/play/${roomCode}`);
        return;
      }

      // Get members
      const memberList = await getRoomMembers(room.id);

      if (memberList) {
        setMembers(memberList as any);
        
        // Find my seat
        const me = memberList.find((m) => m.userId === userId);
        if (me) {
          setMySeat(me.seat);
          setMyReady(me.ready);
          setIsHost(me.seat === 0); // Seat 0 is host
        }
      }

      // Subscribe to realtime updates
      const unsubscribeRoom = subscribeToRoom(room.id, (updatedRoom) => {
        if (updatedRoom) {
          const newStatus = updatedRoom.status;
          setRoomStatus(newStatus);
          
          // Redirect to game if started
          if (newStatus === 'running') {
            router.push(`/play/${roomCode}`);
          }
        }
      });

      const unsubscribeMembers = subscribeToRoomMembers(room.id, (updatedMembers) => {
        setMembers(updatedMembers as any);
        
        // Update my ready status
        const me = updatedMembers.find((m) => m.userId === userId);
        if (me) {
          setMyReady(me.ready);
        }
      });

      setLoading(false);

      // Return cleanup function
      return () => {
        unsubscribeRoom();
        unsubscribeMembers();
      };
    } catch (err: any) {
      console.error('Error initializing room:', err);
      setError(err.message || 'Failed to load room');
      setLoading(false);
    }
  };

  const handleToggleReady = async () => {
    if (!roomId) return;

    try {
      const { userId } = getOrCreatePlayerId();
      const newReady = !myReady;

      await updateRoomMember(roomId, userId, { ready: newReady });

      setMyReady(newReady);
    } catch (err) {
      console.error('Error toggling ready:', err);
    }
  };

  const handleStartGame = async () => {
    if (!roomId || !isHost) return;

    // Check all players are ready
    const allReady = members.every((m) => m.ready);
    if (!allReady) {
      alert('All players must be ready before starting');
      return;
    }

    try {
      const { userId } = getOrCreatePlayerId();

      // Call startGame API Route
      const result = await startGame(roomId, userId);

      if (result.success) {
        // Game started - will redirect via realtime update
      } else {
        alert(result.error || 'Failed to start game');
      }
    } catch (err: any) {
      console.error('Error starting game:', err);
      alert(err.message || 'Failed to start game');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Game Lobby</h1>
          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-400">Room Code:</p>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-mono text-xl rounded-lg flex items-center gap-2 transition-colors"
            >
              {roomCode}
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">
              Players ({members.length}/4)
            </h2>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {member.seat === 0 && (
                    <Crown className="w-5 h-5 text-yellow-400" />
                  )}
                  <span className="text-white font-medium">{member.nickname}</span>
                  <span className="text-gray-500 text-sm">Seat {member.seat + 1}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {member.ready ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full border border-green-500/50">
                      Ready
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-700/50 text-gray-400 text-sm font-medium rounded-full border border-gray-600">
                      Not Ready
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 4 - members.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center justify-between p-4 bg-gray-900/30 rounded-lg border border-gray-700/50 border-dashed"
              >
                <span className="text-gray-600">Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {isHost ? (
            <>
              {/* Host Ready Toggle */}
              <button
                onClick={handleToggleReady}
                className={`flex-1 px-6 py-4 font-semibold rounded-lg transition-all duration-200 shadow-lg ${
                  myReady
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                }`}
              >
                {myReady ? 'Not Ready' : 'Ready'}
              </button>
              
              {/* Host Start Game Button */}
              <button
                onClick={handleStartGame}
                disabled={members.length < 2 || !members.every((m) => m.ready)}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50"
              >
                {members.length < 2
                  ? 'Need 2+ Players'
                  : !members.every((m) => m.ready)
                  ? 'Waiting for Ready'
                  : 'Start Game'}
              </button>
            </>
          ) : (
            <button
              onClick={handleToggleReady}
              className={`flex-1 px-6 py-4 font-semibold rounded-lg transition-all duration-200 shadow-lg ${
                myReady
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
              }`}
            >
              {myReady ? 'Not Ready' : 'Ready'}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="text-center text-gray-500 text-sm">
          <p>Share the room code with your friends to invite them</p>
        </div>
      </div>
    </div>
  );
}
