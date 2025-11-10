'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreatePlayerId } from '@/lib/firebase';
import { playMove as apiPlayMove, drawTile as apiDrawTile, passTurn as apiPassTurn } from '@/lib/api-client';
import {
  getRoom,
  getRoomMembers,
  getGameState,
  subscribeToGameState,
  subscribeToRoomMoves,
} from '@/lib/firestore-helpers';
import { useGameStore } from '@/store/game-store';
import { DominoTile } from '@/components/DominoTile';
import { DominoBoard } from '@/components/DominoBoard';
import { Toast } from '@/components/Toast';
import { ReconnectOverlay } from '@/components/ReconnectOverlay';
import { SideSelectionModal } from '@/components/SideSelectionModal';
import { GameOverModal } from '@/components/GameOverModal';
import { MatchWinnerModal } from '@/components/MatchWinnerModal';
import { VersionCheckModal } from '@/components/VersionCheckModal';
import { getValidPlacements, getValidPlacements4Way } from '@/lib/domino-utils';
import { sanitizeGameState } from '@/lib/firestore-schema';
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { Loader2, Trophy, ArrowLeft, Download } from 'lucide-react';
import type { Tile, PlayedTile } from '@/types/game';
import type { GameState } from '@/lib/firestore-schema';

interface Member {
  seat: number;
  nickname: string;
}

interface PublicState {
  myHand: Tile[];
  others: Array<{ seat: number; handCount: number }>;
  // 2-WAY & 4-WAY SUPPORT
  board: PlayedTile[]; // 2-way mode
  leftChain: PlayedTile[]; // 4-way mode
  rightChain: PlayedTile[]; // 4-way mode
  upChain: PlayedTile[]; // 4-way mode
  downChain: PlayedTile[]; // 4-way mode
  lockedDouble: Tile | null; // 4-way mode
  is4WayActive: boolean; // 4-way mode
  openEnds: { 
    left: number | null; 
    right: number | null; 
    up: number | null; // 4-WAY
    down: number | null; // 4-WAY
    leftIsDouble?: boolean; 
    rightIsDouble?: boolean;
    upIsDouble?: boolean; // 4-WAY
    downIsDouble?: boolean; // 4-WAY
  };
  gameScores: Record<number, number>;
  matchScores: Record<number, number>;
  lastScore: number;
  turn: number;
  gameIndex: number;
  finished: boolean;
  winnerSeat: number | null;
  stockCount: number;
}

export default function GamePage({ params }: { params: { code: string } }) {
  const roomCode = params.code.toUpperCase();
  const router = useRouter();

  const { userId, mySeat, setMySeat, showToast, setConnectionStatus } = useGameStore();
  
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<PublicState | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [showSideSelection, setShowSideSelection] = useState(false);
  const [pendingTile, setPendingTile] = useState<Tile | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [matchFinished, setMatchFinished] = useState(false);
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [showVersionModal, setShowVersionModal] = useState(false);
  
  // Version check - prompt for refresh when new version is available
  useVersionCheck(() => {
    console.log('🔄 New version detected - showing modal');
    setShowVersionModal(true);
  });

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    try {
      const { userId: id } = getOrCreatePlayerId();

      // Get room
      const room = await getRoom(roomCode);

      if (!room) {
        showToast('Room not found');
        router.push('/');
        return;
      }

      setRoomId(room.id);
      
      // Check if match is finished (check both room status and if anyone reached 365)
      if (room.status === 'finished') {
        setMatchFinished(true);
      }
      
      // Also check match scores (in case room status hasn't updated yet)
      if (room.matchScores && Object.values(room.matchScores).some((score: any) => score >= 365)) {
        setMatchFinished(true);
      }

      // Get members
      const memberList = await getRoomMembers(room.id);

      if (memberList) {
        setMembers(memberList.map(m => ({ seat: m.seat, nickname: m.nickname })));
      }

      // Get my seat
      const me = memberList?.find((m) => m.userId === id);

      if (me) {
        setMySeat(me.seat);
      }

      // Load game state (WITH 4-WAY SUPPORT)
      const state = await getGameState(room.id);
      if (state && me) {
        console.log('📥 Initial state loaded:', {
          is4WayActive: state.is4WayActive,
          leftChainLen: state.leftChain?.length || 0,
          rightChainLen: state.rightChain?.length || 0,
          upChainLen: state.upChain?.length || 0,
          downChainLen: state.downChain?.length || 0,
          boardLen: state.board?.length || 0,
          lockedDouble: state.lockedDouble,
        });
        
        const sanitized = sanitizeGameState(state, me.seat);
        
        const initialState = {
          myHand: sanitized.myHand,
          others: sanitized.others,
          board: state.board || [],
          leftChain: state.leftChain || [],
          rightChain: state.rightChain || [],
          upChain: state.upChain || [],
          downChain: state.downChain || [],
          lockedDouble: state.lockedDouble || null,
          is4WayActive: state.is4WayActive || false,
          openEnds: state.openEnds,
          gameScores: state.gameScores || {},
          matchScores: state.matchScores || {},
          lastScore: state.lastScore,
          turn: state.turn,
          gameIndex: state.gameIndex || 0,
          finished: state.finished,
          winnerSeat: state.winnerSeat,
          stockCount: state.stock?.length || 0,
        };
        
        console.log('📥 Setting initial state:', {
          is4WayActive: initialState.is4WayActive,
          leftChainLen: initialState.leftChain.length,
          rightChainLen: initialState.rightChain.length,
          upChainLen: initialState.upChain.length,
          downChainLen: initialState.downChain.length,
        });
        
        setGameState(initialState);
      }

      // Subscribe to real-time updates
      const unsubscribeState = subscribeToGameState(room.id, (updatedState) => {
        if (updatedState && me) {
          // DEBUG: Log state updates
          console.log('🔄 State update received:', {
            is4WayActive: updatedState.is4WayActive,
            leftChainLen: updatedState.leftChain?.length || 0,
            rightChainLen: updatedState.rightChain?.length || 0,
            upChainLen: updatedState.upChain?.length || 0,
            downChainLen: updatedState.downChain?.length || 0,
            boardLen: updatedState.board?.length || 0,
            lockedDouble: updatedState.lockedDouble,
          });
          
          const sanitized = sanitizeGameState(updatedState, me.seat);
          
          const newState = {
            myHand: sanitized.myHand,
            others: sanitized.others,
            board: updatedState.board || [],
            leftChain: updatedState.leftChain || [],
            rightChain: updatedState.rightChain || [],
            upChain: updatedState.upChain || [],
            downChain: updatedState.downChain || [],
            lockedDouble: updatedState.lockedDouble || null,
            is4WayActive: updatedState.is4WayActive || false,
            openEnds: updatedState.openEnds,
            gameScores: updatedState.gameScores || {},
            matchScores: updatedState.matchScores || {},
            lastScore: updatedState.lastScore,
            turn: updatedState.turn,
            gameIndex: updatedState.gameIndex || 0,
            finished: updatedState.finished,
            winnerSeat: updatedState.winnerSeat,
            stockCount: updatedState.stock?.length || 0,
          };
          
          console.log('✅ Setting new state:', {
            is4WayActive: newState.is4WayActive,
            leftChainLen: newState.leftChain.length,
            rightChainLen: newState.rightChain.length,
            upChainLen: newState.upChain.length,
            downChainLen: newState.downChain.length,
          });
          
          // 🔍 DEEP DEBUG: Log actual chain contents
          if (newState.is4WayActive) {
            console.log('🔍 4-WAY CHAINS CONTENT:', {
              leftChain: newState.leftChain,
              rightChain: newState.rightChain,
              upChain: newState.upChain,
              downChain: newState.downChain,
            });
          }
          
          // Check if 4-way just activated (state transition)
          const was4Way = gameState?.is4WayActive || false;
          const now4Way = newState.is4WayActive;
          
          if (!was4Way && now4Way) {
            console.log('🔒🔒🔒 4-WAY JUST ACTIVATED! Forcing full re-render...');
            showToast('🔒 Double locked! 4-WAY MODE ACTIVATED!');
            setForceRenderKey(prev => prev + 1); // Force entire page re-render
          }
          
          // Force new object reference to trigger React re-render
          setGameState({...newState});
          
          // AUTO-PASS: If it's my turn, no valid moves, and bazar empty, automatically pass
          // 4-WAY: Check all 4 directions if active
          const boardHasTiles = updatedState.board.length > 0 || 
                                updatedState.leftChain?.length > 0 || 
                                updatedState.rightChain?.length > 0;
          
          if (updatedState.turn === me.seat && !updatedState.finished && boardHasTiles) {
            let hasValidMoves: boolean;
            
            if (updatedState.is4WayActive) {
              // 4-WAY MODE: Check all 4 directions
              hasValidMoves = sanitized.myHand.some((tile: any) => {
                const validPlacements = getValidPlacements4Way(
                  tile,
                  updatedState.openEnds.left,
                  updatedState.openEnds.right,
                  updatedState.openEnds.up,
                  updatedState.openEnds.down
                );
                return validPlacements.length > 0;
              });
            } else {
              // 2-WAY MODE: Check left/right only
              hasValidMoves = sanitized.myHand.some((tile: any) => {
                const validPlacements = getValidPlacements(
                  tile,
                  updatedState.openEnds.left!,
                  updatedState.openEnds.right!
                );
                return validPlacements.length > 0;
              });
            }
            
            const stockEmpty = (updatedState.stock?.length || 0) === 0;
            
            if (!hasValidMoves && stockEmpty && roomId) {
              console.log('🔄 Auto-passing turn (no moves, bazar empty)');
              setTimeout(() => {
                apiPassTurn(roomId!, userId).then((result) => {
                  if (result.success) {
                    if (result.tableBlocked && result.gameFinished) {
                      showToast(`🚫 Game blocked! Winner gets +${result.bonusAwarded} points`);
                    } else {
                      showToast('⏭️ No valid moves - turn passed automatically');
                    }
                  }
                }).catch(err => {
                  console.error('Auto-pass error:', err);
                });
              }, 1500);
            }
          }
        }
      });

      const unsubscribeMoves = subscribeToRoomMoves(room.id, (moves) => {
        if (moves.length > 0) {
          const latestMove = moves[0];
          if (latestMove.type === 'play' && latestMove.payload?.score > 0) {
            const player = memberList?.find((m) => m.seat === latestMove.seat);
            showToast(`${player?.nickname || 'Player'} scored ${latestMove.payload.score} points!`);
          }
        }
      });

      setConnectionStatus(true, false);
      setLoading(false);

      return () => {
        unsubscribeState();
        unsubscribeMoves();
      };
    } catch (err: any) {
      console.error('Error initializing game:', err);
      showToast('Failed to load game');
      setLoading(false);
    }
  };

  const handlePlayTile = async (tile: Tile) => {
    if (!roomId || !gameState || acting) return;

    if (gameState.turn !== mySeat) {
      showToast("It's not your turn!");
      return;
    }

    // Check if board is empty (first tile)
    const isEmptyBoard = gameState.board.length === 0 && 
                         gameState.leftChain.length === 0 && 
                         gameState.rightChain.length === 0;
    
    if (isEmptyBoard) {
      await executeMove(tile, 'left');
      return;
    }

    // Regular move - check valid placements (2-WAY or 4-WAY)
    let validPlacements: Array<'left' | 'right' | 'up' | 'down'>;
    
    if (gameState.is4WayActive) {
      // 4-WAY MODE: Check all 4 directions
      validPlacements = getValidPlacements4Way(
        tile,
        gameState.openEnds.left,
        gameState.openEnds.right,
        gameState.openEnds.up,
        gameState.openEnds.down
      );
    } else {
      // 2-WAY MODE: Check left/right only
      validPlacements = getValidPlacements(
        tile,
        gameState.openEnds.left!,
        gameState.openEnds.right!
      ) as Array<'left' | 'right' | 'up' | 'down'>;
    }

    if (validPlacements.length === 0) {
      showToast('This tile cannot be played!');
      return;
    }

    // If multiple placements available, show selection modal
    if (validPlacements.length > 1) {
      setPendingTile(tile);
      setShowSideSelection(true);
      return;
    }

    // Only one valid placement - play immediately
    await executeMove(tile, validPlacements[0]);
  };

  const executeMove = async (tile: Tile, side: 'left' | 'right' | 'up' | 'down') => {
    if (!roomId || acting) return;

    setActing(true);
    setShowSideSelection(false);
    setPendingTile(null);

    try {
      const { userId } = getOrCreatePlayerId();
      const result = await apiPlayMove(roomId, userId, tile, side);

      if (!result.success) {
        showToast(result.error || 'Invalid move');
      } else {
        setSelectedTile(null);
        
        // Check if 4-way just activated
        if (result.locked4Way) {
          showToast('🔒 Double locked! 4-WAY MODE ACTIVATED!');
        }
        
        if (result.score > 0) {
          showToast(`Telefon! You scored ${result.score} points!`);
        }
        
        if (result.matchFinished) {
          showToast('🏆 Match Over!');
        } else if (result.gameFinished) {
          showToast('🎉 Game won! Get ready for next game!');
        }
      }
    } catch (err: any) {
      console.error('Error playing tile:', err);
      showToast('Failed to play tile');
    } finally {
      setActing(false);
    }
  };

  const handleDrawTile = async () => {
    if (!roomId || !gameState || acting) return;

    if (gameState.turn !== mySeat) {
      showToast("It's not your turn!");
      return;
    }

    if (gameState.stockCount === 0) {
      showToast('Stock is empty!');
      return;
    }

    // Check if player has any valid moves
    const hasAnyValidMoves = gameState.myHand.some(tile => {
      const validPlacements = getValidPlacements(
        tile,
        gameState.openEnds.left!,
        gameState.openEnds.right!
      );
      return validPlacements.length > 0;
    });

    if (hasAnyValidMoves) {
      showToast('You must play a tile! You can only draw if you have no valid moves.');
      return;
    }

    setActing(true);

    try {
      const { userId } = getOrCreatePlayerId();

      const result = await apiDrawTile(roomId, userId);

      if (!result.success) {
        showToast(result.error || 'Failed to draw tile');
      } else {
        showToast('Drew a tile from the bazar');
      }
    } catch (err: any) {
      console.error('Error drawing tile:', err);
      showToast('Failed to draw tile');
    } finally {
      setActing(false);
    }
  };

  const handlePassTurn = async () => {
    if (!roomId || !gameState || acting) return;

    if (gameState.turn !== mySeat) {
      showToast("It's not your turn!");
      return;
    }

    setActing(true);

    try {
      const { userId } = getOrCreatePlayerId();

      const result = await apiPassTurn(roomId, userId);

      if (!result.success) {
        showToast(result.error || 'Failed to pass turn');
      } else {
        if (result.tableBlocked && result.gameFinished) {
          showToast(`🚫 Game blocked! Winner gets +${result.bonusAwarded} points`);
        } else if (result.tableBlocked) {
          showToast('🚫 Table is blocked!');
        } else {
          showToast('Turn passed');
        }
      }
    } catch (err: any) {
      console.error('Error passing turn:', err);
      showToast('Failed to pass turn');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Game not started</p>
          <button
            onClick={() => router.push(`/room/${roomCode}`)}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  const isMyTurn = gameState.turn === mySeat;
  const currentPlayer = members.find((m) => m.seat === gameState.turn);
  
  // Check if board is empty (first tile)
  const isEmptyBoard = gameState.board.length === 0 && 
                        gameState.leftChain.length === 0 && 
                        gameState.rightChain.length === 0;
  
  // Check if player has valid moves (4-WAY or 2-WAY)
  const hasValidMoves = isEmptyBoard 
    ? gameState.myHand.length > 0
    : gameState.is4WayActive
      ? gameState.myHand.some(tile => {
          const validPlacements = getValidPlacements4Way(
            tile,
            gameState.openEnds.left,
            gameState.openEnds.right,
            gameState.openEnds.up,
            gameState.openEnds.down
          );
          return validPlacements.length > 0;
        })
      : gameState.myHand.some(tile => {
          const validPlacements = getValidPlacements(
            tile,
            gameState.openEnds.left!,
            gameState.openEnds.right!
          );
          return validPlacements.length > 0;
        });

  return (
    <div key={`game-${forceRenderKey}`} className="min-h-screen p-4">
      <Toast />
      <ReconnectOverlay />
      
      {/* Side Selection Modal */}
      {showSideSelection && pendingTile && gameState && (
        <SideSelectionModal
          tile={pendingTile}
          validSides={gameState.is4WayActive 
            ? getValidPlacements4Way(
                pendingTile,
                gameState.openEnds.left,
                gameState.openEnds.right,
                gameState.openEnds.up,
                gameState.openEnds.down
              )
            : getValidPlacements(
                pendingTile,
                gameState.openEnds.left!,
                gameState.openEnds.right!
              ) as Array<'left' | 'right' | 'up' | 'down'>
          }
          openEnds={gameState.openEnds}
          onSelect={(side) => executeMove(pendingTile, side)}
          onCancel={() => {
            setShowSideSelection(false);
            setPendingTile(null);
          }}
        />
      )}


      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Leave Game
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">
              {isMyTurn ? "Your Turn!" : `${currentPlayer?.nickname || 'Player'}'s Turn`}
            </h2>
            <p className="text-sm text-gray-400">
              Room: {roomCode} • Game {(gameState.gameIndex || 0) + 1}
            </p>
            <p className="text-xs text-gray-500">
              Match to 365 points
            </p>
          </div>
          
          <div className="w-24"></div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {members.map((member) => (
            <div
              key={member.seat}
              className={`p-4 rounded-lg border ${
                gameState.turn === member.seat
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-gray-800/50 border-gray-700'
              }`}
            >
              <p className="text-sm text-gray-400">{member.nickname}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">
                  {gameState.matchScores[member.seat] || 0}
                </p>
                <p className="text-xs text-gray-500">
                  match
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-400">
                  +{gameState.gameScores[member.seat] || 0} this game
                </p>
                {mySeat !== member.seat && (
                  <p className="text-xs text-gray-500">
                    {gameState.others.find((o) => o.seat === member.seat)?.handCount || 0} tiles
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Board - Optimized for more tiles */}
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-xs text-gray-400">
              Board: {gameState.board.length} tiles
            </div>
            {gameState.lastScore > 0 && (
              <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                +{gameState.lastScore}
              </div>
            )}
          </div>

          {/* Board with wrap layout */}
          <DominoBoard 
            key={`board-${gameState.is4WayActive ? '4way' : '2way'}-${gameState.leftChain.length}-${gameState.rightChain.length}-${gameState.upChain.length}-${gameState.downChain.length}`}
            board={gameState.board}
            leftChain={gameState.leftChain}
            rightChain={gameState.rightChain}
            upChain={gameState.upChain}
            downChain={gameState.downChain}
            lockedDouble={gameState.lockedDouble}
            is4WayActive={gameState.is4WayActive}
          />

          {(gameState.board.length > 0 || gameState.is4WayActive) && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-2">
              {!gameState.is4WayActive ? (
                // 2-WAY MODE: Left + Right
                <>
                  <div>
                    Left: <span className="text-white font-bold">{gameState.openEnds.left}</span>
                    {gameState.openEnds.leftIsDouble && (
                      <span className="ml-0.5 text-yellow-400 text-[10px]">(×2)</span>
                    )}
                  </div>
                  <div>
                    Right: <span className="text-white font-bold">{gameState.openEnds.right}</span>
                    {gameState.openEnds.rightIsDouble && (
                      <span className="ml-0.5 text-yellow-400 text-[10px]">(×2)</span>
                    )}
                  </div>
                  <div>
                    Sum: <span className="text-white font-bold">
                      {((gameState.openEnds.leftIsDouble ? gameState.openEnds.left! * 2 : gameState.openEnds.left!) + 
                        (gameState.openEnds.rightIsDouble ? gameState.openEnds.right! * 2 : gameState.openEnds.right!))}
                    </span>
                    {((gameState.openEnds.leftIsDouble ? gameState.openEnds.left! * 2 : gameState.openEnds.left!) + 
                      (gameState.openEnds.rightIsDouble ? gameState.openEnds.right! * 2 : gameState.openEnds.right!)) % 5 === 0 && (
                      <span className="ml-1 text-green-400 text-xs">✨</span>
                    )}
                  </div>
                </>
              ) : (
                // 4-WAY MODE: All 4 directions
                <>
                  <div className="font-bold text-yellow-400">🔒 4-WAY ACTIVE!</div>
                  <div>
                    L: <span className="text-white font-bold">{gameState.openEnds.left}</span>
                    {gameState.openEnds.leftIsDouble && <span className="text-yellow-400 text-[10px]">(×2)</span>}
                  </div>
                  <div>
                    R: <span className="text-white font-bold">{gameState.openEnds.right}</span>
                    {gameState.openEnds.rightIsDouble && <span className="text-yellow-400 text-[10px]">(×2)</span>}
                  </div>
                  {gameState.upChain.length > 0 && (
                    <div>
                      U: <span className="text-white font-bold">{gameState.openEnds.up}</span>
                      {gameState.openEnds.upIsDouble && <span className="text-yellow-400 text-[10px]">(×2)</span>}
                    </div>
                  )}
                  {gameState.downChain.length > 0 && (
                    <div>
                      D: <span className="text-white font-bold">{gameState.openEnds.down}</span>
                      {gameState.openEnds.downIsDouble && <span className="text-yellow-400 text-[10px]">(×2)</span>}
                    </div>
                  )}
                </>
              )}
              <div>Stock: <span className="text-white font-bold">{gameState.stockCount}</span></div>
            </div>
          )}
        </div>

        {/* My Hand - Compact */}
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
          <h3 className="text-base font-semibold text-white mb-3">Your Hand ({gameState.myHand.length} tiles)</h3>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {gameState.myHand.length === 0 ? (
              <p className="text-gray-500 text-sm">No tiles in hand</p>
            ) : (
              gameState.myHand.map((tile, idx) => (
                <DominoTile
                  key={idx}
                  tile={tile}
                  onClick={() => isMyTurn && handlePlayTile(tile)}
                  disabled={!isMyTurn || acting}
                  highlighted={selectedTile === tile}
                  orientation="vertical"
                  size="md"
                />
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDrawTile}
              disabled={!isMyTurn || acting || gameState.stockCount === 0 || hasValidMoves}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              title={hasValidMoves ? "You must play a tile first!" : "Draw a tile from the bazar"}
            >
              <Download className="w-5 h-5" />
              Draw from Bazar ({gameState.stockCount})
            </button>

          </div>
          
          {/* Help Text */}
          {isMyTurn && (
            <div className="mt-3 text-sm text-gray-400 space-y-1">
              {isEmptyBoard ? (
                <p>🎯 <span className="text-blue-400 font-semibold">Pick ANY tile to start the game!</span> {gameState.gameIndex > 0 && <span className="text-yellow-400">(Hint: [5-5] scores 10 if you have {'<'} 300 points)</span>}</p>
              ) : hasValidMoves ? (
                <p>💡 Click a tile to play it</p>
              ) : gameState.stockCount > 0 ? (
                <p>💡 No valid moves - draw from bazar</p>
              ) : (
                <>
                  <p>💡 No valid moves and bazar is empty - turn will pass automatically</p>
                  <p className="text-xs text-yellow-400">⚠️ If all players pass, the game is blocked. Player with lowest pip count wins!</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Game Over (Match Continues) */}
        {gameState.finished && !matchFinished && gameState.winnerSeat !== null && (
          <GameOverModal
            members={members}
            gameScores={gameState.gameScores}
            matchScores={gameState.matchScores}
            gameWinner={gameState.winnerSeat!}
            gameIndex={gameState.gameIndex}
            onNextGame={async () => {
              if (!roomId) return;
              
              try {
                const { userId } = getOrCreatePlayerId();
                const { startGame } = await import('@/lib/api-client');
                
                // Start next game (deals tiles, winner's turn)
                const result = await startGame(roomId, userId);
                
                if (result.success) {
                  showToast('New game started! Pick your first tile!');
                  // Reload to see new game state
                  setTimeout(() => window.location.reload(), 500);
                } else {
                  showToast(result.error || 'Failed to start next game');
                }
              } catch (err: any) {
                console.error('Error starting next game:', err);
                showToast('Failed to start next game');
              }
            }}
            isWinner={gameState.winnerSeat === mySeat}
          />
        )}

        {/* Match Winner (Match Finished) */}
        {matchFinished && (
          <MatchWinnerModal
            members={members}
            matchScores={gameState.matchScores}
            matchWinner={gameState.winnerSeat!}
            onExit={() => router.push('/')}
          />
        )}
        
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
    </div>
  );
}
