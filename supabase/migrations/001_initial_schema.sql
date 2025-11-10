-- Telefon Domino Database Schema
-- This creates all tables for the multiplayer domino game

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ROOMS TABLE
-- Stores game room information
-- ============================================
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'running', 'finished')),
    target_score INTEGER NOT NULL DEFAULT 200,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster code lookups
CREATE INDEX idx_rooms_code ON public.rooms(code);
CREATE INDEX idx_rooms_status ON public.rooms(status);

-- ============================================
-- ROOM_MEMBERS TABLE
-- Tracks players in each room
-- ============================================
CREATE TABLE IF NOT EXISTS public.room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    seat INTEGER NOT NULL CHECK (seat >= 0 AND seat <= 3),
    ready BOOLEAN NOT NULL DEFAULT false,
    connected BOOLEAN NOT NULL DEFAULT true,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure each user can only join a room once
    UNIQUE(room_id, user_id),
    -- Ensure each seat is unique per room
    UNIQUE(room_id, seat)
);

-- Indexes for faster queries
CREATE INDEX idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX idx_room_members_user_id ON public.room_members(user_id);

-- ============================================
-- GAME_STATES TABLE
-- Stores the current state of each game
-- ============================================
CREATE TABLE IF NOT EXISTS public.game_states (
    room_id UUID PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_index INTEGER NOT NULL DEFAULT 0,
    turn INTEGER NOT NULL DEFAULT 0,
    board JSONB NOT NULL DEFAULT '[]'::jsonb,
    open_ends JSONB NOT NULL DEFAULT '{"left": null, "right": null}'::jsonb,
    stock JSONB NOT NULL DEFAULT '[]'::jsonb,
    hands JSONB NOT NULL DEFAULT '{}'::jsonb,
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_score INTEGER NOT NULL DEFAULT 0,
    finished BOOLEAN NOT NULL DEFAULT false,
    winner_seat INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster updates
CREATE INDEX idx_game_states_room_id ON public.game_states(room_id);

-- ============================================
-- MOVES TABLE
-- Logs all moves made during the game
-- ============================================
CREATE TABLE IF NOT EXISTS public.moves (
    id BIGSERIAL PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_index INTEGER NOT NULL,
    seat INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('play', 'draw', 'pass')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_moves_room_id ON public.moves(room_id);
CREATE INDEX idx_moves_round_index ON public.moves(room_id, round_index);
CREATE INDEX idx_moves_created_at ON public.moves(created_at);

-- ============================================
-- FUNCTIONS
-- Helper functions for the game
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on rooms
CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on game_states
CREATE TRIGGER update_game_states_updated_at 
    BEFORE UPDATE ON public.game_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- Document the schema
-- ============================================
COMMENT ON TABLE public.rooms IS 'Game rooms where players join and play';
COMMENT ON TABLE public.room_members IS 'Players who have joined each room';
COMMENT ON TABLE public.game_states IS 'Current state of active games';
COMMENT ON TABLE public.moves IS 'History of all moves made in games';

COMMENT ON COLUMN public.rooms.code IS 'Short alphanumeric code for joining (e.g., ABC123)';
COMMENT ON COLUMN public.rooms.status IS 'Current room status: lobby, running, or finished';
COMMENT ON COLUMN public.rooms.target_score IS 'Score needed to win the game (default 200)';

COMMENT ON COLUMN public.room_members.seat IS 'Player position (0-3) determines turn order';
COMMENT ON COLUMN public.room_members.ready IS 'Whether player is ready to start';
COMMENT ON COLUMN public.room_members.connected IS 'Real-time connection status';

COMMENT ON COLUMN public.game_states.board IS 'Array of played tiles with placement info';
COMMENT ON COLUMN public.game_states.open_ends IS 'Current left and right open ends';
COMMENT ON COLUMN public.game_states.stock IS 'Remaining tiles in bazar (face down)';
COMMENT ON COLUMN public.game_states.hands IS 'Per-seat arrays of tiles (hidden from other players)';
COMMENT ON COLUMN public.game_states.scores IS 'Per-seat cumulative scores';
COMMENT ON COLUMN public.game_states.last_score IS 'Points scored on the last move';



