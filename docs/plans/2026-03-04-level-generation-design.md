# Level Generation System Design

Date: 2026-03-04

## Goal

Extract level data from hardcoded `levels.js` into individual JSON files. Build a CSP-based level generation script that produces higher-difficulty puzzles with longer paths, clever obstacle layouts, and precise piece allocation. Max grid size: 16x16.

## Project Structure

```
train-railway-game/
├── src/
│   ├── index.html
│   ├── game.js
│   ├── styles.css
│   └── sound.js
├── levels/
│   ├── chapters.json
│   ├── chapter1/
│   │   ├── level-01.json
│   │   └── ...
│   └── ...
├── scripts/
│   ├── generate.ts        # Level generation CLI
│   ├── solver.ts           # Backtracking CSP solver
│   ├── difficulty.ts       # Difficulty scoring
│   └── build-levels.ts     # JSON → levels.js bundler
├── dist/                   # Build output
├── package.json
└── bunfig.toml
```

## Level JSON Format

```json
{
  "id": "3-1",
  "rows": 8,
  "cols": 8,
  "grid": [[0, 0, 1, ...], ["S", 0, ...], ...],
  "startDir": "right",
  "pieces": { "straight-h": 3, "turn-rd": 2, "cross": 1 },
  "stars": [8, 11],
  "fuel": null,
  "metadata": {
    "difficulty": "hard",
    "difficultyScore": 7.2,
    "solutionCount": 1,
    "optimalPieceCount": 8,
    "pathLength": 15,
    "turnCount": 6,
    "generatedBy": "csp-solver-v1",
    "generatedAt": "2026-03-04T12:00:00Z",
    "seed": 42
  }
}
```

## Generation Algorithm: CSP + Backtracking

### Flow

1. Input parameters (grid size, target difficulty, piece type constraints)
2. Randomly place S and E (minimum Manhattan distance enforced)
3. Randomly place obstacles (density based on difficulty)
4. Allocate track piece set (based on empty cells and difficulty)
5. Backtracking solver: try all legal placements
6. Count solutions:
   - 0 solutions → discard, regenerate
   - 1 solution → high quality (unique solution)
   - 2-3 solutions → acceptable
   - 4+ solutions → too easy, discard or add obstacles
7. Score difficulty
8. Output qualifying level JSON

### Solver Optimization for 16x16 Grids

- **A* reachability check**: After placing a piece, quickly verify S→E is still reachable
- **Partition pruning**: If obstacles split the grid into disconnected regions with S and E separated, prune immediately
- **Incremental validation**: Only check local connectivity changes per placement, not full grid scan
- **Early termination**: Stop counting at 4+ solutions (already classified as too easy)
- **Parallel generation**: Use Bun Workers for multi-threaded search on large grids

### Piece Allocation Strategy

The solver receives a specific set of track pieces. The generation script controls difficulty through:

- **Exact pieces**: Give exactly the pieces needed for the solution (hardest)
- **Distractor pieces**: Add 1-3 extra pieces of similar-but-wrong types (e.g., `turn-lu` when solution needs `turn-rd`)
- **Surplus pieces**: Give extra correct pieces (easiest)

## Difficulty System

| Difficulty | Grid Range | Obstacle Density | Solution Count | Surplus Pieces | Fuel |
|-----------|-----------|-----------------|---------------|---------------|------|
| easy | 5x5~6x6 | 5~10% | 1~5 | 2~3 | no |
| medium | 7x7~10x10 | 10~20% | 1~3 | 1~2 | optional |
| hard | 10x10~13x13 | 15~25% | 1~2 | 0~1 | optional |
| extreme | 13x13~16x16 | 20~30% | 1 | 0 | yes |

### Difficulty Score Formula

```
difficulty = pathLength × 0.3
           + turnCount × 0.2
           + obstacleProximity × 0.2
           + piecePrecision × 0.3
```

- `obstacleProximity`: How close obstacles are to the solution path (forces tight maneuvering)
- `piecePrecision`: How close the given pieces are to the minimum needed (fewer surplus = harder)

### Star Rating

- 3 stars = complete with optimal (minimum) piece count
- 2 stars = complete with 1-2 extra pieces used
- 1 star = complete regardless of piece count
- `stars` field auto-calculated by generation script from optimal solution path length

## CLI Interface

```bash
# Generate levels
bun run scripts/generate.ts \
  --rows 8 --cols 8 \
  --difficulty medium \
  --count 10 \
  --fuel false \
  --output levels/chapter3/

# Build levels.js from all JSON files
bun run scripts/build-levels.ts

# Difficulty presets:
#   easy:    5x5~6x6
#   medium:  7x7~10x10
#   hard:    10x10~13x13
#   extreme: 13x13~16x16
```

## Game Rendering Adaptation

- `cellSize` must be dynamically calculated: `Math.min(canvasWidth / cols, canvasHeight / rows)`
- Ensure track icons remain legible at small cell sizes (16x16 grid)
- Current hard-coded 5x9 assumptions in `game.js` need to be parameterized

## Build Pipeline

`build-levels.ts`:
1. Read `chapters.json` and all level JSON files
2. Validate each level's format
3. Merge and output `dist/levels.js` (exports `LEVELS` and `CHAPTERS` constants)
4. Copy other source files to `dist/`

## Existing Levels

The current 20 hand-crafted levels (4 chapters) will be preserved by converting them to JSON format and keeping them as chapter 1-4. Generated levels will form new chapters.
