import { describe, test, expect } from "bun:test";
import { solve } from "./solver";
import type { Cell, TrackType } from "./types";

describe("solver", () => {
  test("solves trivial 5x5 straight line (level 1-1)", () => {
    const grid: Cell[][] = [
      [0, 0, 0, 0, 0],
      [0, "S", 0, "E", 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    const pieces: Partial<Record<TrackType, number>> = { "straight-h": 2 };
    const { solutions: results } = solve({ grid, rows: 5, cols: 5, startDir: "right", pieces, maxSolutions: 10 });
    expect(results.length).toBe(1);
    // The only solution places straight-h at (1,2) and (1,3) — but (1,3) is E, so only (1,2)
    // Actually: S is at (1,1), E is at (1,3). Train goes right from S.
    // Next cell is (1,2) — needs straight-h. Then (1,3) is E. Done.
    // But we have 2 straight-h pieces. Only 1 is needed for the path.
    // The solver should find solutions where the path works, regardless of leftover pieces.
    expect(results[0].pathLength).toBeGreaterThanOrEqual(2); // S + track + E
  });

  test("solves L-shape (level 1-3)", () => {
    const grid: Cell[][] = [
      [0, 0, 0, 0, 0],
      [0, "S", 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, "E", 0],
      [0, 0, 0, 0, 0],
    ];
    const pieces: Partial<Record<TrackType, number>> = {
      "straight-h": 2,
      "straight-v": 2,
      "turn-ld": 1,
    };
    const { solutions: results } = solve({ grid, rows: 5, cols: 5, startDir: "right", pieces, maxSolutions: 10 });
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  test("returns 0 solutions for impossible layout", () => {
    const grid: Cell[][] = [
      [0, 0, 0, 0, 0],
      [0, "S", 1, "E", 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    // Only vertical pieces — can't go right past obstacle
    const pieces: Partial<Record<TrackType, number>> = { "straight-v": 3 };
    const { solutions: results } = solve({ grid, rows: 5, cols: 5, startDir: "right", pieces, maxSolutions: 10 });
    expect(results.length).toBe(0);
  });

  test("respects maxSolutions cap", () => {
    // A wide open grid with many pieces should have many solutions
    const grid: Cell[][] = [
      [0, 0, 0, 0, 0],
      [0, "S", 0, "E", 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    const pieces: Partial<Record<TrackType, number>> = {
      "straight-h": 5,
      "straight-v": 5,
      "turn-rd": 3,
      "turn-ld": 3,
      "turn-ru": 3,
      "turn-lu": 3,
    };
    const { solutions: results } = solve({ grid, rows: 5, cols: 5, startDir: "right", pieces, maxSolutions: 4 });
    expect(results.length).toBeLessThanOrEqual(4);
  });

  test("handles fuel and gas stations", () => {
    const grid: Cell[][] = [
      [0, 0, 0, 0, 0, 0],
      [0, "S", 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, "G", 0, "E", 0],
      [0, 0, 0, 0, 0, 0],
    ];
    const pieces: Partial<Record<TrackType, number>> = {
      "straight-h": 3,
      "straight-v": 2,
      "turn-ld": 1,
      "turn-ru": 1,
    };
    const { solutions: results } = solve({
      grid, rows: 5, cols: 6, startDir: "right", pieces, maxSolutions: 10, fuel: 8
    });
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});
