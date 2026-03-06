/** Grid cell values */
export type Cell = 0 | 1 | "S" | "E" | "G";

/** Track piece types */
export type TrackType =
  | "straight-h"
  | "straight-v"
  | "turn-rd"
  | "turn-ld"
  | "turn-ru"
  | "turn-lu"
  | "cross";

export type Direction = "left" | "right" | "up" | "down";

/** Which directions a track piece connects */
export const TRACK_CONNECTIONS: Record<TrackType, Direction[]> = {
  "straight-h": ["left", "right"],
  "straight-v": ["up", "down"],
  "turn-rd": ["right", "down"],
  "turn-ld": ["left", "down"],
  "turn-ru": ["right", "up"],
  "turn-lu": ["left", "up"],
  cross: ["left", "right", "up", "down"],
};

export const OPPOSITE: Record<Direction, Direction> = {
  left: "right",
  right: "left",
  up: "down",
  down: "up",
};

export const DIR_DELTA: Record<Direction, [number, number]> = {
  left: [0, -1],
  right: [0, 1],
  up: [-1, 0],
  down: [1, 0],
};

export const ALL_TRACK_TYPES: TrackType[] = [
  "straight-h",
  "straight-v",
  "turn-rd",
  "turn-ld",
  "turn-ru",
  "turn-lu",
  "cross",
];

export interface LevelData {
  id: string;
  rows: number;
  cols: number;
  grid: Cell[][];
  startDir: Direction;
  pieces: Partial<Record<TrackType, number>>;
  stars: [number, number];
  fuel: number | null;
  metadata: {
    difficulty: string;
    difficultyScore?: number;
    solutionCount?: number;
    optimalPieceCount?: number;
    pathLength?: number;
    turnCount?: number;
    generatedBy: string;
    generatedAt?: string;
    seed?: number;
  };
}

/** Difficulty preset names */
export type Difficulty = "easy" | "medium" | "hard" | "extreme";

/** Difficulty preset configuration */
export interface DifficultyPreset {
  gridRange: { minRows: number; maxRows: number; minCols: number; maxCols: number };
  obstacleDensity: { min: number; max: number }; // fraction of empty cells
  maxSolutions: number;
  surplusPieces: { min: number; max: number };
  fuel: boolean;
}

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyPreset> = {
  easy: {
    gridRange: { minRows: 5, maxRows: 6, minCols: 5, maxCols: 6 },
    obstacleDensity: { min: 0.05, max: 0.1 },
    maxSolutions: 5,
    surplusPieces: { min: 2, max: 3 },
    fuel: false,
  },
  medium: {
    gridRange: { minRows: 7, maxRows: 10, minCols: 7, maxCols: 10 },
    obstacleDensity: { min: 0.1, max: 0.2 },
    maxSolutions: 3,
    surplusPieces: { min: 1, max: 2 },
    fuel: false,
  },
  hard: {
    gridRange: { minRows: 10, maxRows: 13, minCols: 10, maxCols: 13 },
    obstacleDensity: { min: 0.15, max: 0.25 },
    maxSolutions: 2,
    surplusPieces: { min: 0, max: 1 },
    fuel: false,
  },
  extreme: {
    gridRange: { minRows: 13, maxRows: 16, minCols: 13, maxCols: 16 },
    obstacleDensity: { min: 0.2, max: 0.3 },
    maxSolutions: 1,
    surplusPieces: { min: 0, max: 0 },
    fuel: true,
  },
};
