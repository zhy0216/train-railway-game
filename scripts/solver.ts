import {
  type Cell,
  type TrackType,
  type Direction,
  TRACK_CONNECTIONS,
  OPPOSITE,
  DIR_DELTA,
  ALL_TRACK_TYPES,
} from "./types";

export interface SolveInput {
  grid: Cell[][];
  rows: number;
  cols: number;
  startDir: Direction;
  pieces: Partial<Record<TrackType, number>>;
  maxSolutions: number;
  fuel?: number;
}

export interface Solution {
  /** Map of "row,col" → TrackType for each placed piece on the path */
  placement: Map<string, TrackType>;
  pathLength: number;
  turnCount: number;
  piecesUsed: number;
}

/**
 * Find all valid solutions for the given level configuration.
 *
 * Strategy: simulate the train's path from S. At each step, if the next cell
 * is empty (0 or G), try placing each available piece type there and recurse.
 * This is efficient because we only explore cells the train actually visits,
 * not all empty cells on the grid.
 */
export function solve(input: SolveInput): Solution[] {
  const { grid, rows, cols, startDir, maxSolutions } = input;
  const maxFuel = input.fuel ?? 0;

  // Find S and E
  let startRow = -1, startCol = -1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "S") { startRow = r; startCol = c; }
    }
  }

  // Available pieces (mutable copy)
  const available: Record<string, number> = {};
  for (const [k, v] of Object.entries(input.pieces)) {
    available[k] = v!;
  }

  const solutions: Solution[] = [];
  const placement = new Map<string, TrackType>();
  const visited = new Set<string>();

  function simulate(
    row: number,
    col: number,
    dir: Direction,
    fuel: number,
    pathLen: number,
    turns: number,
    piecesUsed: number
  ): void {
    if (solutions.length >= maxSolutions) return;

    const [dr, dc] = DIR_DELTA[dir];
    const nr = row + dr;
    const nc = col + dc;

    // Out of bounds
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;

    // Reached end
    if (grid[nr][nc] === "E") {
      if (maxFuel > 0 && fuel - 1 < 0) return; // not enough fuel
      solutions.push({
        placement: new Map(placement),
        pathLength: pathLen + 1,
        turnCount: turns,
        piecesUsed,
      });
      return;
    }

    // Hit obstacle
    if (grid[nr][nc] === 1) return;

    // Check fuel
    let newFuel = fuel;
    if (maxFuel > 0) {
      newFuel = fuel - 1;
      if (newFuel < 0) return;
    }

    // Refuel at gas station (fuel is refilled after consuming 1)
    if (maxFuel > 0 && grid[nr][nc] === "G") {
      newFuel = maxFuel;
    }

    const key = `${nr},${nc}`;

    // Check if we already placed a track here (from a different branch that shares cells)
    const existingTrack = placement.get(key);
    if (existingTrack) {
      // Validate the existing track accepts entry from our direction
      const enterDir = OPPOSITE[dir];
      const conns = TRACK_CONNECTIONS[existingTrack];
      if (!conns.includes(enterDir)) return;

      const exitDir = existingTrack === "cross" ? dir : conns.find((d) => d !== enterDir);
      if (!exitDir) return;

      const visitKey = `${nr},${nc},${exitDir}`;
      if (visited.has(visitKey)) return;

      const isTurn = exitDir !== dir;
      visited.add(visitKey);
      simulate(nr, nc, exitDir, newFuel, pathLen + 1, turns + (isTurn ? 1 : 0), piecesUsed);
      visited.delete(visitKey);
      return;
    }

    // Try each available piece type
    const enterDir = OPPOSITE[dir];
    for (const trackType of ALL_TRACK_TYPES) {
      if ((available[trackType] ?? 0) <= 0) continue;

      const conns = TRACK_CONNECTIONS[trackType];
      if (!conns.includes(enterDir)) continue;

      const exitDir = trackType === "cross" ? dir : conns.find((d) => d !== enterDir);
      if (!exitDir) continue;

      const visitKey = `${nr},${nc},${exitDir}`;
      if (visited.has(visitKey)) continue;

      // Place the piece
      placement.set(key, trackType);
      available[trackType]--;
      visited.add(visitKey);

      simulate(nr, nc, exitDir, newFuel, pathLen + 1, turns + (exitDir !== dir ? 1 : 0), piecesUsed + 1);

      // Backtrack
      visited.delete(visitKey);
      available[trackType]++;
      placement.delete(key);

      if (solutions.length >= maxSolutions) return;
    }
  }

  visited.add(`${startRow},${startCol},${startDir}`);
  simulate(startRow, startCol, startDir, maxFuel, 1, 0, 0);

  return solutions;
}
