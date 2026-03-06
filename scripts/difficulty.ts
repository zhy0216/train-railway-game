export interface DifficultyInput {
  pathLength: number;
  turnCount: number;
  obstacleProximity: number; // 0-1: how close obstacles are to the path
  piecePrecision: number;    // 0-1: 1 = exact pieces, 0 = many surplus
}

/**
 * Score difficulty on a 0-10 scale.
 * Formula: pathLength×0.3 + turnCount×0.2 + obstacleProximity×0.2 + piecePrecision×0.3
 * Each factor is normalized to 0-10 before weighting.
 */
export function scoreDifficulty(input: DifficultyInput): number {
  const { pathLength, turnCount, obstacleProximity, piecePrecision } = input;

  // Normalize pathLength: 2=0, 30+=10
  const normPath = Math.min(10, Math.max(0, (pathLength - 2) / 2.8));

  // Normalize turnCount: 0=0, 12+=10
  const normTurns = Math.min(10, Math.max(0, turnCount / 1.2));

  // obstacleProximity and piecePrecision are already 0-1, scale to 0-10
  const normObstacle = obstacleProximity * 10;
  const normPrecision = piecePrecision * 10;

  return normPath * 0.3 + normTurns * 0.2 + normObstacle * 0.2 + normPrecision * 0.3;
}

/**
 * Calculate star thresholds based on optimal piece count.
 * Returns [3-star-max, 2-star-max].
 * 3 stars = use exactly optimal count.
 * 2 stars = use up to optimal + ceil(optimal * 0.3).
 */
export function calculateStars(
  optimalPieceCount: number,
  totalPiecesGiven: number
): [number, number] {
  const s3 = optimalPieceCount;
  const s2 = optimalPieceCount + Math.max(1, Math.ceil(optimalPieceCount * 0.3));
  return [s3, s2];
}

/**
 * Calculate obstacle proximity: fraction of path-adjacent cells that are obstacles.
 */
export function calcObstacleProximity(
  grid: (0 | 1 | "S" | "E" | "G")[][],
  rows: number,
  cols: number,
  pathCells: [number, number][]
): number {
  if (pathCells.length === 0) return 0;

  let adjacentCount = 0;
  let obstacleAdjacentCount = 0;
  const pathSet = new Set(pathCells.map(([r, c]) => `${r},${c}`));

  for (const [pr, pc] of pathCells) {
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nr = pr + dr;
      const nc = pc + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (pathSet.has(`${nr},${nc}`)) continue;
      adjacentCount++;
      if (grid[nr][nc] === 1) obstacleAdjacentCount++;
    }
  }

  return adjacentCount === 0 ? 0 : obstacleAdjacentCount / adjacentCount;
}
