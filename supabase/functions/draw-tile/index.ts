// Edge Function: draw-tile
// Allows a player to draw a tile from the stock

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { GameState, Tile } from '../_shared/game-logic.ts';

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

    // 4. Check if stock has tiles
    if (gameState.stock.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Stock is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Draw tile from stock
    const drawnTile = gameState.stock[0];
    const newStock = gameState.stock.slice(1);

    // 6. Add tile to player's hand
    const newHand = [...(gameState.hands[playerSeat] || []), drawnTile];
    const newHands = { ...gameState.hands, [playerSeat]: newHand };

    // 7. Update game state (turn stays the same - player can now try to play)
    const updatedState = {
      ...gameState,
      stock: newStock,
      hands: newHands,
      last_score: 0,
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

    // 8. Log the move
    await supabaseAdmin.from('moves').insert({
      room_id,
      round_index: gameState.round_index,
      seat: playerSeat,
      type: 'draw',
      payload: { tile: drawnTile },
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        tile: drawnTile,
        stock_remaining: newStock.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in draw-tile:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});



