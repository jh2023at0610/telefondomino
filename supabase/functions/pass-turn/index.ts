// Edge Function: pass-turn
// Allows a player to pass their turn when they cannot play

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  GameState,
  hasValidMoves,
  isTableBlocked,
  findBlockedWinner,
  calculateRoundBonus,
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
    const { room_id, user_id } = await req.json();

    if (!room_id || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing room_id or user_id' }),
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

    // 4. Verify player has no valid moves
    const playerHand = gameState.hands[playerSeat] || [];
    const canPlay = hasValidMoves(
      playerHand,
      gameState.open_ends.left,
      gameState.open_ends.right
    );

    if (canPlay) {
      return new Response(
        JSON.stringify({ success: false, error: 'You have valid moves available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Get player count for turn calculation
    const { data: members } = await supabaseAdmin
      .from('room_members')
      .select('seat')
      .eq('room_id', room_id)
      .order('seat');

    const playerCount = members?.length || 2;

    // 6. Check if table is blocked
    const stockEmpty = gameState.stock.length === 0;
    const tableBlocked = isTableBlocked(
      gameState.hands,
      gameState.open_ends.left,
      gameState.open_ends.right,
      stockEmpty
    );

    let roundFinished = false;
    let gameFinished = false;
    let winnerSeat = null;
    let newScores = { ...gameState.scores };

    if (tableBlocked) {
      // Table is blocked - find winner and calculate bonus
      roundFinished = true;
      winnerSeat = findBlockedWinner(gameState.hands);
      
      const bonus = calculateRoundBonus(gameState.hands, winnerSeat);
      newScores[winnerSeat] = (newScores[winnerSeat] || 0) + bonus;

      // Check if winner reached target score
      const { data: room } = await supabaseAdmin
        .from('rooms')
        .select('target_score')
        .eq('id', room_id)
        .single();

      if (room && newScores[winnerSeat] >= room.target_score) {
        gameFinished = true;
      }
    }

    // 7. Determine next turn
    const nextTurn = roundFinished ? playerSeat : (playerSeat + 1) % playerCount;

    // 8. Update game state
    const updatedState = {
      ...gameState,
      turn: nextTurn,
      scores: newScores,
      last_score: 0,
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

    // 9. Log the move
    await supabaseAdmin.from('moves').insert({
      room_id,
      round_index: gameState.round_index,
      seat: playerSeat,
      type: 'pass',
      payload: { table_blocked: tableBlocked },
    });

    // 10. Update room status if game finished
    if (gameFinished) {
      await supabaseAdmin
        .from('rooms')
        .update({ status: 'finished' })
        .eq('id', room_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        table_blocked: tableBlocked,
        round_finished: roundFinished,
        game_finished: gameFinished,
        winner_seat: winnerSeat,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pass-turn:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});



