// Edge Function: start-game
// Initializes a new game round with shuffled tiles

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  generateAllTiles,
  shuffleArray,
  findHighestDouble,
  removeTileFromHand,
  GameState,
} from '../_shared/game-logic.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
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

    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Verify room exists and is in lobby status
    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('id', room_id)
      .single();

    if (roomError || !room) {
      return new Response(
        JSON.stringify({ success: false, error: 'Room not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (room.status !== 'lobby') {
      return new Response(
        JSON.stringify({ success: false, error: 'Game already started' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get all players in the room
    const { data: members, error: membersError } = await supabaseAdmin
      .from('room_members')
      .select('*')
      .eq('room_id', room_id)
      .order('seat');

    if (membersError || !members || members.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Need at least 2 players' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check all players are ready
    const allReady = members.every(m => m.ready);
    if (!allReady) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not all players are ready' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const playerCount = members.length;

    // 4. Generate and shuffle all tiles
    const allTiles = generateAllTiles();
    const shuffled = shuffleArray(allTiles);

    // 5. Distribute tiles based on player count
    const tilesPerPlayer = playerCount === 2 ? 7 : 5;
    const hands: Record<number, any> = {};
    let tileIndex = 0;

    members.forEach((member) => {
      hands[member.seat] = shuffled.slice(tileIndex, tileIndex + tilesPerPlayer);
      tileIndex += tilesPerPlayer;
    });

    // Remaining tiles go to stock
    const stock = shuffled.slice(tileIndex);

    // 6. Determine starting player (highest double)
    let startingSeat = 0;
    let firstTile = null;

    // Check each player's hand for highest double
    let highestDoubleValue = -1;
    
    members.forEach((member) => {
      const result = findHighestDouble(hands[member.seat]);
      if (result && result.tile[0] > highestDoubleValue) {
        highestDoubleValue = result.tile[0];
        startingSeat = member.seat;
        firstTile = result.tile;
      }
    });

    // If no doubles, first player starts with any tile
    if (firstTile === null) {
      startingSeat = members[0].seat;
      firstTile = hands[startingSeat][0];
    }

    // Remove first tile from starting player's hand
    hands[startingSeat] = removeTileFromHand(hands[startingSeat], firstTile);

    // 7. Initialize board with first tile
    const board = [
      {
        tile: firstTile,
        placement: 'left',
        timestamp: Date.now(),
      },
    ];

    const openEnds = {
      left: firstTile[0],
      right: firstTile[1],
    };

    // 8. Initialize scores
    const scores: Record<number, number> = {};
    members.forEach((member) => {
      scores[member.seat] = 0;
    });

    // 9. Create initial game state
    const gameState: GameState = {
      room_id,
      round_index: 0,
      turn: (startingSeat + 1) % playerCount, // Next player after starting player
      board,
      open_ends: openEnds,
      stock,
      hands,
      scores,
      last_score: 0,
      finished: false,
      winner_seat: null,
    };

    // 10. Insert game state
    const { error: stateError } = await supabaseAdmin
      .from('game_states')
      .insert(gameState);

    if (stateError) {
      console.error('Error inserting game state:', stateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create game state' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 11. Update room status to running
    await supabaseAdmin
      .from('rooms')
      .update({ status: 'running' })
      .eq('id', room_id);

    // 12. Log the initial move
    await supabaseAdmin.from('moves').insert({
      room_id,
      round_index: 0,
      seat: startingSeat,
      type: 'play',
      payload: { tile: firstTile, placement: 'left' },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Game started successfully',
        starting_seat: startingSeat,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in start-game:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});



