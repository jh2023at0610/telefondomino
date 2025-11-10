'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreatePlayerId, generateRoomCode, updateNickname } from '@/lib/firebase';
import { createRoom, addRoomMember, getRoomByCode } from '@/lib/firestore-helpers';
import { Gamepad2, Users, Sparkles } from 'lucide-react';
import { VersionCheckModal } from '@/components/VersionCheckModal';
import { useVersionCheck } from '@/hooks/useVersionCheck';

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVersionModal, setShowVersionModal] = useState(false);
  
  // Version check - prompt for refresh when new version is available
  useVersionCheck(() => {
    console.log('🔄 New version detected on home page - showing modal');
    setShowVersionModal(true);
  });

  useEffect(() => {
    // Load existing nickname
    const { nickname: savedNickname } = getOrCreatePlayerId();
    setNickname(savedNickname);
  }, []);

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update nickname in localStorage
      updateNickname(nickname);
      const { userId } = getOrCreatePlayerId();

      // Generate unique room code
      const code = generateRoomCode();

      // Create room in Firestore (365 points for match)
      const roomId = await createRoom(code, 365);

      // Join the room as first player (seat 0)
      await addRoomMember(roomId, userId, nickname, 0);

      // Navigate to room lobby
      router.push(`/room/${code}`);
    } catch (err: any) {
      console.error('Error creating room:', err);
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update nickname in localStorage
      updateNickname(nickname);
      const { userId } = getOrCreatePlayerId();

      // Find room by code
      const room = await getRoomByCode(roomCode.toUpperCase());

      if (!room) {
        setError('Room not found');
        setLoading(false);
        return;
      }

      if (room.status !== 'lobby') {
        setError('Game already started');
        setLoading(false);
        return;
      }

      // Get current members
      const { getRoomMembers } = await import('@/lib/firestore-helpers');
      const members = await getRoomMembers(room.id);

      // Check if user already in room
      const existingMember = members.find(m => m.userId === userId);

      if (existingMember) {
        // Already in room, just navigate
        router.push(`/room/${roomCode.toUpperCase()}`);
        return;
      }

      if (members.length >= 4) {
        setError('Room is full (max 4 players)');
        setLoading(false);
        return;
      }

      // Assign next available seat
      const nextSeat = members.length;

      // Join the room
      await addRoomMember(room.id, userId, nickname, nextSeat);

      // Navigate to room lobby
      router.push(`/room/${roomCode.toUpperCase()}`);
    } catch (err: any) {
      console.error('Error joining room:', err);
      setError(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Telefon Domino
          </h1>
          <p className="text-gray-400">
            Play the classic domino game online with friends
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl">
          {/* Nickname Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full mb-4 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-5 h-5" />
            {loading ? 'Creating...' : 'Create New Room'}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-800/50 text-gray-400">or</span>
            </div>
          </div>

          {/* Join Room */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={loading}
              className="w-full px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-600 hover:border-gray-500"
            >
              <Users className="w-5 h-5" />
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-gray-500 text-sm">
          <p>2-4 players • First to 365 points wins the match</p>
        </div>
      </div>
      
      {/* Version Check Modal */}
      {showVersionModal && (
        <VersionCheckModal
          onDismiss={() => {
            console.log('⏭️ User dismissed version modal');
            setShowVersionModal(false);
          }}
        />
      )}
    </div>
  );
}



