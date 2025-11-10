// API Client for calling Next.js API Routes
// Replaces Firebase Cloud Functions

export async function callApiRoute<T = any>(
  endpoint: string,
  data: any
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'API request failed');
    }

    return result as T;
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Specific API calls
export async function startGame(
  roomId: string, 
  userId: string, 
  chosenStartingTile?: [number, number]
) {
  return callApiRoute('/api/start-game', { 
    roomId, 
    userId, 
    chosenStartingTile 
  });
}

export async function playMove(
  roomId: string,
  userId: string,
  tile: [number, number],
  side: 'left' | 'right' | 'up' | 'down'
) {
  return callApiRoute('/api/play-move', { roomId, userId, tile, side });
}

export async function drawTile(roomId: string, userId: string) {
  return callApiRoute('/api/draw-tile', { roomId, userId });
}

export async function passTurn(roomId: string, userId: string) {
  return callApiRoute('/api/pass-turn', { roomId, userId });
}

