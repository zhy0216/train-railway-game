import {
  type Cell,
  type TrackType,
  type Direction,
  type Difficulty,
  type LevelData,
  DIFFICULTY_PRESETS,
  ALL_TRACK_TYPES,
  DIR_DELTA,
} from "./types";
import { solve, type Solution } from "./solver";
import {
  scoreDifficulty,
  calculateStars,
  calcObstacleProximity,
} from "./difficulty";

/** Seeded PRNG (mulberry32) */
function createRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BoardConfig {
  rows: number;
  cols: number;
  obstacleDensity: number;
  seed: number;
  fuel?: number;
  gasStations?: number;
}

export interface Board {
  grid: Cell[][];
  startDir: Direction;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export function generateBoard(config: BoardConfig): Board {
  const { rows, cols, obstacleDensity, seed } = config;
  const rng = createRng(seed);

  // Initialize empty grid
  const grid: Cell[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  // Place S and E with minimum Manhattan distance (at least rows/2 + cols/2 / 2)
  const minDist = Math.max(4, Math.floor((rows + cols) / 3));
  let sr: number, sc: number, er: number, ec: number;

  // Keep S and E away from edges (1 cell border)
  do {
    sr = 1 + Math.floor(rng() * (rows - 2));
    sc = 1 + Math.floor(rng() * (cols - 2));
    er = 1 + Math.floor(rng() * (rows - 2));
    ec = 1 + Math.floor(rng() * (cols - 2));
  } while (
    (sr === er && sc === ec) ||
    Math.abs(sr - er) + Math.abs(sc - ec) < minDist
  );

  grid[sr][sc] = "S";
  grid[er][ec] = "E";

  // Determine start direction based on S→E general direction
  let startDir: Direction;
  const dr = er - sr;
  const dc = ec - sc;
  if (Math.abs(dc) >= Math.abs(dr)) {
    startDir = dc > 0 ? "right" : "left";
  } else {
    startDir = dr > 0 ? "down" : "up";
  }

  // Place gas stations if fuel mode
  if (config.fuel && config.gasStations) {
    let placed = 0;
    let attempts = 0;
    while (placed < config.gasStations && attempts < 200) {
      const gr = 1 + Math.floor(rng() * (rows - 2));
      const gc = 1 + Math.floor(rng() * (cols - 2));
      if (grid[gr][gc] === 0) {
        grid[gr][gc] = "G";
        placed++;
      }
      attempts++;
    }
  }

  // Place obstacles
  const totalCells = rows * cols;
  const targetObstacles = Math.floor(totalCells * obstacleDensity);
  let obstaclesPlaced = 0;
  let attempts = 0;

  while (obstaclesPlaced < targetObstacles && attempts < targetObstacles * 10) {
    const r = Math.floor(rng() * rows);
    const c = Math.floor(rng() * cols);
    if (grid[r][c] !== 0) { attempts++; continue; }

    // Don't place adjacent to S (need at least one exit)
    if (Math.abs(r - sr) + Math.abs(c - sc) <= 1) { attempts++; continue; }
    // Don't place adjacent to E
    if (Math.abs(r - er) + Math.abs(c - ec) <= 1) { attempts++; continue; }

    grid[r][c] = 1;
    obstaclesPlaced++;
    attempts++;
  }

  // Verify S has open neighbor in startDir
  const [ddr, ddc] = DIR_DELTA[startDir];
  const frontR = sr + ddr;
  const frontC = sc + ddc;
  if (frontR >= 0 && frontR < rows && frontC >= 0 && frontC < cols) {
    if (grid[frontR][frontC] === 1) {
      grid[frontR][frontC] = 0; // Clear obstacle in front of start
    }
  }

  return { grid, startDir, startRow: sr, startCol: sc, endRow: er, endCol: ec };
}

/**
 * Given a solution, determine which pieces were used and add surplus/distractor pieces.
 */
export function assignPieces(
  solution: Solution,
  surplusCount: number,
  rng: () => number
): Partial<Record<TrackType, number>> {
  // Count pieces in the solution
  const needed: Record<string, number> = {};
  for (const type of solution.placement.values()) {
    needed[type] = (needed[type] ?? 0) + 1;
  }

  // Start with exactly the needed pieces
  const result: Partial<Record<TrackType, number>> = { ...needed };

  // Add surplus/distractor pieces
  for (let i = 0; i < surplusCount; i++) {
    // Pick a random track type (prefer "similar but wrong" types)
    const idx = Math.floor(rng() * ALL_TRACK_TYPES.length);
    const type = ALL_TRACK_TYPES[idx];
    result[type] = (result[type] ?? 0) + 1;
  }

  return result;
}

export interface GenerateLevelConfig {
  difficulty: Difficulty;
  seed: number;
  maxAttempts?: number;
  rows?: number;
  cols?: number;
  fuel?: boolean;
}

export function generateLevel(config: GenerateLevelConfig): LevelData | null {
  const preset = DIFFICULTY_PRESETS[config.difficulty];
  const maxAttempts = config.maxAttempts ?? 100;
  const rng = createRng(config.seed);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const attemptSeed = config.seed * 1000 + attempt;

    // Pick grid size
    const rows = config.rows ?? (preset.gridRange.minRows +
      Math.floor(createRng(attemptSeed)() * (preset.gridRange.maxRows - preset.gridRange.minRows + 1)));
    const cols = config.cols ?? (preset.gridRange.minCols +
      Math.floor(createRng(attemptSeed + 1)() * (preset.gridRange.maxCols - preset.gridRange.minCols + 1)));

    // Pick obstacle density
    const density = preset.obstacleDensity.min +
      createRng(attemptSeed + 2)() * (preset.obstacleDensity.max - preset.obstacleDensity.min);

    // Fuel config
    const useFuel = config.fuel ?? preset.fuel;
    const fuelAmount = useFuel ? Math.floor(rows * cols * 0.3) : undefined;
    const gasStations = useFuel ? Math.max(1, Math.floor((rows + cols) / 6)) : undefined;

    // Generate board
    const board = generateBoard({
      rows, cols,
      obstacleDensity: density,
      seed: attemptSeed,
      fuel: fuelAmount,
      gasStations,
    });

    // Give generous pieces first to find any solution
    const generousPieces: Partial<Record<TrackType, number>> = {};
    const maxPieces = rows * cols;
    for (const t of ALL_TRACK_TYPES) {
      generousPieces[t] = maxPieces;
    }

    // Find solutions with generous pieces (to find the optimal path)
    const generousSolutions = solve({
      grid: board.grid,
      rows, cols,
      startDir: board.startDir,
      pieces: generousPieces,
      maxSolutions: 1,
      fuel: fuelAmount,
    });

    if (generousSolutions.length === 0) continue; // No path possible

    // Use the first solution as reference for piece assignment
    const refSolution = generousSolutions[0];
    const surplusCount = preset.surplusPieces.min +
      Math.floor(createRng(attemptSeed + 3)() * (preset.surplusPieces.max - preset.surplusPieces.min + 1));
    const pieces = assignPieces(refSolution, surplusCount, createRng(attemptSeed + 4));

    // Now solve with the actual pieces to count solutions
    const solutions = solve({
      grid: board.grid,
      rows, cols,
      startDir: board.startDir,
      pieces,
      maxSolutions: preset.maxSolutions + 1,
      fuel: fuelAmount,
    });

    if (solutions.length === 0) continue;
    if (solutions.length > preset.maxSolutions) continue;

    // Find optimal solution (fewest pieces used)
    const optimal = solutions.reduce((best, s) =>
      s.piecesUsed < best.piecesUsed ? s : best
    );

    // Calculate difficulty score
    const pathCells: [number, number][] = Array.from(optimal.placement.keys())
      .map(k => k.split(",").map(Number) as [number, number]);
    const obstacleProx = calcObstacleProximity(board.grid, rows, cols, pathCells);

    const totalPieces = Object.values(pieces).reduce((a, b) => a + (b ?? 0), 0);
    const piecePrecision = optimal.piecesUsed / totalPieces;

    const diffScore = scoreDifficulty({
      pathLength: optimal.pathLength,
      turnCount: optimal.turnCount,
      obstacleProximity: obstacleProx,
      piecePrecision,
    });

    const [s3, s2] = calculateStars(optimal.piecesUsed, totalPieces);

    return {
      id: "",
      rows,
      cols,
      grid: board.grid,
      startDir: board.startDir,
      pieces,
      stars: [s3, s2],
      fuel: fuelAmount ?? null,
      metadata: {
        difficulty: config.difficulty,
        difficultyScore: Math.round(diffScore * 10) / 10,
        solutionCount: solutions.length,
        optimalPieceCount: optimal.piecesUsed,
        pathLength: optimal.pathLength,
        turnCount: optimal.turnCount,
        generatedBy: "csp-solver-v1",
        generatedAt: new Date().toISOString(),
        seed: attemptSeed,
      },
    };
  }

  return null; // Failed to generate after maxAttempts
}
