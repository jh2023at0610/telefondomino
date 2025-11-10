# 🎲 Telefon Domino - Official Game Rules

Complete rule set as implemented in the game.

---

## 🏆 Match Structure

### Match vs Game
- **Match** = Competition to 365 points (may include multiple games)
- **Game** = Single round ending when a player finishes all tiles
- **First to 365 points wins the match!**

---

## 🎯 Starting a Match

### First Game - Starting Tile Priority

The **first game** of a match uses strict priority:

1. **[2-3]** - Highest priority
2. **[1-1]**
3. **[2-2]**
4. **[3-3]**
5. **[4-4]**
6. **[5-5]**
7. **[6-6]**
8. **[0-0]**
9. **Lowest point tile** (if none of above)

The player with the highest priority tile starts the first game.

### Subsequent Games

**Winner of previous game starts** the next game with **ANY tile they choose**.

---

## 💯 Scoring System

### Regular Scoring

After each move:
1. Calculate sum of open ends
2. **Doubles count twice!** 
   - Left end [3-3] = 6 points
   - Right end single 4 = 4 points
   - Sum = 10 → **Telefon!** Score 10 points
3. If sum is multiple of 5 (5, 10, 15, 20, 25...) = score those points

### Starting Tile Scoring

**NO starting tile scores** - with ONE exception:

**[5-5] Exception:**
- ✅ Can score 10 points IF:
  - NOT the first game of the match
  - Starter has < 300 match points
- ❌ Does NOT score IF:
  - First game of match (even if [5-5])
  - Starter has >= 300 points

### Game End Bonus

When a player finishes all tiles:

1. Sum opponents' remaining tiles
2. **Round UP to nearest 5**
   - 13 points → 15 bonus
   - 41 points → 45 bonus
   - 8 points → 10 bonus
3. **300-Point Cap:**
   - If winner >= 300: **NO bonus**
   - If winner + bonus > 300: **Cap at 300**
   - Example: 290 + 45 bonus = **300** (not 335)

---

## 🎮 Gameplay Rules

### Drawing from Bazar (Stock)

You can ONLY draw if:
- ✅ It's your turn
- ✅ You have NO valid moves
- ✅ Stock is not empty

**You cannot draw if you have a playable tile!**

### Passing Turn

You can ONLY pass if:
- ✅ It's your turn
- ✅ You have NO valid moves
- ✅ Stock is empty

### Blocked Game (Draw)

If **ALL players pass** (nobody can play and bazar is empty):

1. **Game is blocked** 🚫
2. **Winner = Player with LOWEST pip count** in hand
3. **Bonus = Sum of ALL opponents' remaining tiles**
4. Bonus **rounded UP to nearest 5**
5. Apply **300-point cap** rule

**Example:**
```
Stock: Empty
Player A: 7 pips (can't play)
Player B: 13 pips (can't play)
Player C: 9 pips (can't play)

Winner: Player A (lowest: 7 pips)
Raw bonus: 13 + 9 = 22 → Round up to 25
Player A match score: 250 + 25 = 275 points
```

### Placing Tiles

- Click a tile to play it
- If it fits multiple ends → **modal appears** to choose direction
- If it fits one end → automatically placed
- Tiles rotate automatically to show correct connections
- Doubles display vertically, others horizontally

---

## 🔀 4-WAY DOMINO SYSTEM

### What is 4-Way Mode?

The game starts in **2-WAY mode** (traditional left/right play). When the **FIRST double tile gets locked** (has tiles on BOTH sides), it activates **4-WAY mode** - you can now play on 4 directions!

### How It Activates

**Automatic Activation:**
1. Game starts normal (2-way: left ↔ right)
2. Any double tile appears on the board
3. **When tiles are played on BOTH sides of that double**:
   - 🔒 **DOUBLE LOCKS!**
   - 🔀 **4-WAY MODE ACTIVATES!**
   - Board splits into 4 chains: Left, Right, Up, Down

### Rules

**Only the FIRST locked double becomes 4-way:**
- ✅ First double locked → 4-way junction
- ❌ Other doubles locked later → stay 2-way (regular chain)

**Example:**
```
Game starts:
[tile]--[tile]--[3-3]--[tile]--[tile]  (2-way mode)
                 ↑
              DOUBLE APPEARS

After another tile plays on left:
[tile]--[3-3]--[tile]--[tile]  (2-way mode)
         ↑
    DOUBLE IS NOW LOCKED! (has tiles on both sides)
    
4-WAY MODE ACTIVATES:

         [tile] ← Up chain
           ↑
[tile]--[3-3]--[tile]  ← Left/Right chains
           ↓
        [tile] ← Down chain
```

### Playing in 4-Way Mode

**All 4 directions work the same:**
- Play on **LEFT** - extends left chain
- Play on **RIGHT** - extends right chain
- Play on **UP** - extends up chain (from locked double)
- Play on **DOWN** - extends down chain (from locked double)

**Each chain extends like normal 2-way:**
- Match the end value
- Chain grows in that direction
- Can continue indefinitely

### 4-Way Scoring

**Sum ALL 4 open ends (with special rules):**

1. **Left & Right** - ALWAYS count
2. **Up** - Only counts if up chain has tiles
3. **Down** - Only counts if down chain has tiles
4. **Doubles count ×2** in ALL directions

**Example 1 - Up/Down Empty:**
```
Board: L=2, R=5, U=3 (no tiles), D=3 (no tiles)
Score: 2 + 5 = 7 (no score - not multiple of 5)
Up/Down don't count yet (no tiles played there)
```

**Example 2 - All 4 Active:**
```
Board: L=3, R=2, U=[4-4] (double), D=1

Count with doubles:
- Left: 3
- Right: 2
- Up: 4×2 = 8 (double!)
- Down: 1

Sum: 3 + 2 + 8 + 1 = 14 (no score)
```

**Example 3 - Telefon in 4-Way:**
```
Board: L=2, R=3, U=5, D=5

Sum: 2 + 3 + 5 + 5 = 15
✨ TELEFON! Score: 15 points
```

### 4-Way Visual Display

**Board Layout:**
```
Traditional cross pattern:

        [UP CHAIN]
            ↑
[LEFT]--[LOCKED]--[RIGHT]
            ↓
      [DOWN CHAIN]
```

**UI Indicators:**
- 🔒 **"4-WAY ACTIVE!"** badge
- Shows: L, R, U, D end values
- Up/Down only shown if they have tiles

### Strategic Tips

**Activating 4-Way:**
- Playing a double early can set up 4-way
- Once locked, offers more play opportunities
- But also more scoring combinations for opponents!

**Playing in 4-Way:**
- More options = harder to get blocked
- Watch all 4 ends for Telefon combos
- Doubles are even more valuable (count ×2)

---

## 🏁 Match Ending

### When Someone Reaches 365:

1. **Current game continues** to completion
2. After game ends, **highest total score wins**
3. Example:
   - Player A: 370 points
   - Player B: 368 points
   - **Winner: Player A** (highest score)

---

## 📊 Scoring Examples

### Example 1: Double Scoring
```
Board ends: [5-5] (double) | 3 (single)
Calculation: (5×2) + 3 = 10 + 3 = 13
Result: No score (not multiple of 5)
```

### Example 2: Both Ends Doubles
```
Board ends: [3-3] (double) | [2-2] (double)
Calculation: (3×2) + (2×2) = 6 + 4 = 10
Result: ✨ Telefon! Score 10 points
```

### Example 3: Bonus with Cap
```
Winner score: 295
Opponent tiles: 41 points
Bonus: Round up 41 → 45
Capped: 295 + 45 = 340, but cap at 300
Final bonus: 5 points (to reach 300)
```

### Example 4: [5-5] Starting Exception
```
Game 2 (not first game)
Starter match score: 280
Starting tile: [5-5]
Result: ✨ Scores 10 points! (280 → 290)
```

```
Game 2 (not first game)
Starter match score: 310
Starting tile: [5-5]
Result: No score (above 300 threshold)
```

---

## 🎯 Player Modes

### Individual Play (2-4 players)
- Each player for themselves
- Highest score wins

### Team Play (4 players only) - *Coming in Phase B*
- Team 1: Seats 1 + 3
- Team 2: Seats 2 + 4
- Team scores combined

---

## 🎲 Complete Turn Flow

**Your Turn:**
1. Check your tiles for valid moves
2. **Option A:** Play a tile (click it)
   - Choose side if both valid
3. **Option B:** No valid moves?
   - Draw from bazar (if available)
   - Pass turn (if bazar empty)

**After Move:**
- Check for Telefon (multiple of 5)
- Turn passes to next player
- Real-time sync across all devices

**Game Ends:**
- Player finishes last tile OR game is blocked
- Bonus calculated and applied
- Check if match reached 365
- If not → Next game starts (winner picks first tile)

---

## 🏆 Winning Strategy

1. **Score often** - Look for 5, 10, 15, 20, 25 combos
2. **Play doubles wisely** - They count twice!
3. **Track scores** - Know when you're near 300 (bonus cutoff)
4. **Finish fast** - Get the round bonus
5. **Reach 365 first** - But remember: game must finish!

---

**Good luck and have fun! 🎉**


