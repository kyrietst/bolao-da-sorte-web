-- Migration: Create Games Table
-- Description: Create a new games table to properly support the games-within-tickets structure
-- This addresses the critical issue where tickets were storing multiple games as nested arrays

-- Create the games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  game_number INTEGER NOT NULL,
  numbers INTEGER[] NOT NULL CHECK (array_length(numbers, 1) = 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ticket_id, game_number)
);

-- Add performance index for ticket lookups
CREATE INDEX IF NOT EXISTS idx_games_ticket_id ON games(ticket_id);

-- Add index for game number sorting
CREATE INDEX IF NOT EXISTS idx_games_ticket_game_number ON games(ticket_id, game_number);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE games IS 'Individual lottery games within tickets. Each ticket can have multiple games (sets of 6 numbers).';
COMMENT ON COLUMN games.ticket_id IS 'Reference to the parent ticket';
COMMENT ON COLUMN games.game_number IS 'Sequential number of the game within the ticket (1, 2, 3, etc.)';
COMMENT ON COLUMN games.numbers IS 'Array of 6 lottery numbers for this game';