'use client';

import { Trophy, Home } from 'lucide-react';

interface MatchWinnerModalProps {
  members: Array<{ seat: number; nickname: string }>;
  matchScores: Record<number, number>;
  matchWinner: number;
  onExit: () => void;
}

export function MatchWinnerModal({
  members,
  matchScores,
  matchWinner,
  onExit,
}: MatchWinnerModalProps) {
  const winner = members.find(m => m.seat === matchWinner);
  const sortedMembers = [...members].sort(
    (a, b) => (matchScores[b.seat] || 0) - (matchScores[a.seat] || 0)
  );

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-lg w-full border-2 border-yellow-500 shadow-2xl">
        {/* Animated Trophy */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-yellow-400/20 blur-3xl animate-pulse"></div>
          <Trophy className="w-24 h-24 text-yellow-400 mx-auto relative animate-bounce" />
        </div>

        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          Match Winner!
        </h1>
        
        <p className="text-2xl text-white text-center mb-6 font-bold">
          🎉 {winner?.nickname} 🎉
        </p>

        <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
          <p className="text-center text-gray-400 text-sm mb-3">Final Standings</p>
          <div className="space-y-2">
            {sortedMembers.map((member, idx) => (
              <div
                key={member.seat}
                className={`p-3 rounded-lg flex items-center justify-between ${
                  member.seat === matchWinner
                    ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-500'
                    : 'bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono">{idx + 1}.</span>
                  <span className="text-white font-medium">
                    {member.seat === matchWinner && '👑 '}
                    {member.nickname}
                  </span>
                </div>
                <span className="text-white font-bold text-lg">
                  {matchScores[member.seat] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onExit}
          className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>

        <p className="text-center text-gray-500 text-xs mt-4">
          Thanks for playing Telefon Domino!
        </p>
      </div>
    </div>
  );
}



