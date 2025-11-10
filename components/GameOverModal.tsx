'use client';

import { Trophy, Play } from 'lucide-react';

interface GameOverModalProps {
  members: Array<{ seat: number; nickname: string }>;
  gameScores: Record<number, number>;
  matchScores: Record<number, number>;
  gameWinner: number;
  gameIndex: number;
  onNextGame: () => void;
  isWinner: boolean;
}

export function GameOverModal({
  members,
  gameScores,
  matchScores,
  gameWinner,
  gameIndex,
  onNextGame,
  isWinner,
}: GameOverModalProps) {
  const winner = members.find(m => m.seat === gameWinner);
  const sortedMembers = [...members].sort(
    (a, b) => (matchScores[b.seat] || 0) - (matchScores[a.seat] || 0)
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2 text-center">
          Game {gameIndex + 1} Over!
        </h2>
        <p className="text-green-400 text-center mb-6 font-semibold">
          {winner?.nickname} wins this game!
        </p>

        <div className="space-y-3 mb-6">
          {sortedMembers.map((member, idx) => (
            <div
              key={member.seat}
              className={`p-4 rounded-lg ${
                member.seat === gameWinner
                  ? 'bg-yellow-500/20 border border-yellow-500'
                  : 'bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium">
                  {idx === 0 && '🏆 '}{member.nickname}
                </span>
                <span className="text-white font-bold">
                  {matchScores[member.seat] || 0} pts
                </span>
              </div>
              <div className="text-xs text-gray-400">
                +{gameScores[member.seat] || 0} this game
              </div>
            </div>
          ))}
        </div>

        {isWinner ? (
          <>
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <p className="text-blue-300 text-sm text-center">
                🎯 You won! Click below to start the next game.
              </p>
            </div>
            <button
              onClick={onNextGame}
              className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Next Game
            </button>
          </>
        ) : (
          <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg text-center">
            <p className="text-gray-300">
              ⏳ Waiting for {members.find(m => m.seat === gameWinner)?.nickname} to start the next game...
            </p>
          </div>
        )}

        <p className="text-center text-gray-500 text-xs mt-4">
          Match continues to 365 points
        </p>
      </div>
    </div>
  );
}

