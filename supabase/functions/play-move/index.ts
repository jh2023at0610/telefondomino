// Edge Function: play-move
// Validates and processes a player's move

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  canPlayTile,
  getNewEndValue,
  calculateScore,
  hasTile,
  removeTileFromHand,
  calculateRoundBonus,
  GameState,
  Tile,
} from '../_shared/game-logic.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { room_id, user_id, tile, side } = await req.json();

    if (!room_id || !user_id || !tile || !side) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get player's seat
    const { data: member, error: memberError } = await supabaseAdmin
      .from('room_members')
      .select('seat')
      .eq('room_id', room_id)
      .eq('user_id', user_id)
      .single();

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ success: false, error: 'Player not found in room' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const playerSeat = member.seat;

    // 2. Get current game state
    const { data: state, error: stateError } = await supabaseAdmin
      .from('game_states')
      .select('*')
      .eq('room_id', room_id)
      .single();

    if (stateError || !state) {
      return new Response(
        JSON.stringify({ success: false, error: 'Game state not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const gameState: GameState = state as any;

    // 3. Verify it's the player's turn
    if (gameState.turn !== playerSeat) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not your turn' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Verify tile is in player's hand
    const playerHand = gameState.hands[playerSeat] || [];
    if (!hasTile(playerHand, tile as Tile)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tile not in your hand' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Verify tile can be played on the selected side
    const targetEnd = side === 'left' ? gameState.open_ends.left : gameState.open_ends.right;
    
    if (targetEnd === null || !canPlayTile(tile as Tile, targetEnd)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid move - tile does not match' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Update board
    const newEndValue = getNewEndValue(tile as Tile, targetEnd);
    const playedTile = {
      tile: tile as Tile,
      placement: side,
      timestamp: Date.now(),
    };

    const newBoard = side === 'left' 
      ? [playedTile, ...gameState.board]
      : [...gameState.board, playedTile];

    // 7. Update open ends
    const newOpenEnds = {
      left: side === 'left' ? newEndValue : gameState.open_ends.left!,
      right: side === 'right' ? newEndValue : gameState.open_ends.right!,
    };

    // 8. Calculate score
    const score = calculateScore(newOpenEnds.left, newOpenEnds.right);

    // 9. Update player's hand
    const newHand = removeTileFromHand(playerHand, tile as Tile);
    const newHands = { ...gameState.hands, [playerSeat]: newHand };

    // 10. Update scores if points earned
    let newScores = { ...gameState.scores };
    if (score > 0) {
      newScores[playerSeat] = (newScores[playerSeat] || 0) + score;
    }

    // 11. Check if player finished (no tiles left)
    let roundFinished = false;
    let gameFinished = false;
    let winnerSeat = null;

    if (newHand.length === 0) {
      // Player finished - calculate round bonus
      roundFinished = true;
      winnerSeat = playerSeat;
      
      const bonus = calculateRoundBonus(newHands, playerSeat);
      newScores[playerSeat] += bonus;

      // Check if player reached target score
      const { data: room } = await supabaseAdmin
        .from('rooms')
        .select('target_score')
        .eq('id', room_id)
        .single();

      if (room && newScores[playerSeat] >= room.target_score) {
        gameFinished = true;
      }
    }

    // 12. Determine next turn
    const { data: members } = await supabaseAdmin
      .from('room_members')
      .select('seat')
      .eq('room_id', room_id)
      .order('seat');

    const playerCount = members?.length || 2;
    const nextTurn = (playerSeat + 1) % playerCount;

    // 13. Update game state
    const updatedState = {
      ...gameState,
      board: newBoard,
      open_ends: newOpenEnds,
      hands: newHands,
      scores: newScores,
      last_score: score,
      turn: roundFinished ? playerSeat : nextTurn,
      finished: gameFinished,
      winner_seat: winnerSeat,
    };

    const { error: updateError } = await supabaseAdmin
      .from('game_states')
      .update(updatedState)
      .eq('room_id', room_id);

    if (updateError) {
      console.error('Error updating game state:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update game state' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 14. Log the move
    await supabaseAdmin.from('moves').insert({
      room_id,
      round_index: gameState.round_index,
      seat: playerSeat,
      type: 'play',
      payload: { tile, side, score },
    });

    // 15. Update room status if game finished
    if (gameFinished) {
      await supabaseAdmin
        .from('rooms')
        .update({ status: 'finished' })
        .eq('id', room_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        score,
        round_finished: roundFinished,
        game_finished: gameFinished,
        winner_seat: winnerSeat,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in play-move:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});



