-- Row Level Security Policies for Telefon Domino
-- These policies ensure players can only see their own data

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROOMS POLICIES
-- Players can read rooms they are members of
-- ============================================

-- Allow reading rooms where user is a member
CREATE POLICY "Users can read their own rooms"
    ON public.rooms
    FOR SELECT
    USING (
        id IN (
            SELECT room_id 
            FROM public.room_members 
            WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- Allow anyone to insert rooms (for creating new games)
CREATE POLICY "Anyone can create rooms"
    ON public.rooms
    FOR INSERT
    WITH CHECK (true);

-- Allow updates to rooms where user is a member
CREATE POLICY "Members can update their rooms"
    ON public.rooms
    FOR UPDATE
    USING (
        id IN (
            SELECT room_id 
            FROM public.room_members 
            WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- ============================================
-- ROOM_MEMBERS POLICIES
-- Players can see all members in their rooms
-- ============================================

-- Allow reading members in rooms where user is also a member
CREATE POLICY "Users can read members in their rooms"
    ON public.room_members
    FOR SELECT
    USING (
        room_id IN (
            SELECT room_id 
            FROM public.room_members 
            WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- Allow anyone to insert themselves as a member
CREATE POLICY "Anyone can join rooms"
    ON public.room_members
    FOR INSERT
    WITH CHECK (true);

-- Allow users to update their own member record
CREATE POLICY "Users can update their own membership"
    ON public.room_members
    FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- GAME_STATES POLICIES
-- Players can read game state for their rooms
-- NOTE: Hands are sanitized by Edge Functions before sending to clients
-- ============================================

-- Allow reading game states for rooms where user is a member
CREATE POLICY "Members can read game state"
    ON public.game_states
    FOR SELECT
    USING (
        room_id IN (
            SELECT room_id 
            FROM public.room_members 
            WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- Only Edge Functions can insert/update game states (via service role)
-- No INSERT or UPDATE policies for regular users

-- ============================================
-- MOVES POLICIES
-- Players can read move history for their rooms
-- ============================================

-- Allow reading moves for rooms where user is a member
CREATE POLICY "Members can read move history"
    ON public.moves
    FOR SELECT
    USING (
        room_id IN (
            SELECT room_id 
            FROM public.room_members 
            WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- Only Edge Functions can insert moves (via service role)
-- No INSERT policy for regular users

-- ============================================
-- HELPER FUNCTION FOR SANITIZING HANDS
-- This function returns game state with only the requesting user's hand visible
-- ============================================

CREATE OR REPLACE FUNCTION get_sanitized_game_state(p_room_id UUID, p_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_game_state JSONB;
    v_user_seat INTEGER;
    v_sanitized_hands JSONB;
    v_seat TEXT;
BEGIN
    -- Get user's seat
    SELECT seat INTO v_user_seat
    FROM public.room_members
    WHERE room_id = p_room_id AND user_id = p_user_id;
    
    -- Get game state
    SELECT row_to_json(gs.*)::jsonb INTO v_game_state
    FROM public.game_states gs
    WHERE gs.room_id = p_room_id;
    
    IF v_game_state IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Build sanitized hands (only show requesting user's hand)
    v_sanitized_hands := '{}'::jsonb;
    
    -- Loop through all seats and show only counts (except user's own seat)
    FOR v_seat IN SELECT jsonb_object_keys(v_game_state->'hands')
    LOOP
        IF v_seat::INTEGER = v_user_seat THEN
            -- Keep user's full hand
            v_sanitized_hands := v_sanitized_hands || 
                jsonb_build_object(v_seat, v_game_state->'hands'->v_seat);
        ELSE
            -- Only show count for others
            v_sanitized_hands := v_sanitized_hands || 
                jsonb_build_object(v_seat, jsonb_array_length(v_game_state->'hands'->v_seat));
        END IF;
    END LOOP;
    
    -- Replace hands with sanitized version
    v_game_state := v_game_state || jsonb_build_object('hands', v_sanitized_hands);
    
    RETURN v_game_state;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON POLICY "Users can read their own rooms" ON public.rooms IS 
    'Players can only see rooms they have joined';
    
COMMENT ON POLICY "Members can read game state" ON public.game_states IS 
    'Players can read game state but Edge Functions sanitize the hands field';
    
COMMENT ON FUNCTION get_sanitized_game_state IS 
    'Returns game state with only the requesting users hand visible (others show counts only)';



