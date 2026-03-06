import { describe, test, expect } from "bun:test";
import { generateBoard, assignPieces, generateLevel } from "./generator";

describe("generateBoard", () => {
  test("creates a grid with S and E", () => {
    const board = generateBoard({ rows: 6, cols: 6, obstacleDensity: 0.1, seed: 42 });
    let hasS = false, hasE = false;
    for (const row of board.grid) {
      for (const cell of row) {
        if (cell === "S") hasS = true;
        if (cell === "E") hasE = true;
      }
    }
    expect(hasS).toBe(true);
    expect(hasE).toBe(true);
    expect(board.grid.length).toBe(6);
    expect(board.grid[0].length).toBe(6);
  });

  test("S and E have minimum Manhattan distance", () => {
    const board = generateBoard({ rows: 8, cols: 8, obstacleDensity: 0.15, seed: 123 });
    let sr = -1, sc = -1, er = -1, ec = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board.grid[r][c] === "S") { sr = r; sc = c; }
        if (board.grid[r][c] === "E") { er = r; ec = c; }
      }
    }
    const dist = Math.abs(sr - er) + Math.abs(sc - ec);
    expect(dist).toBeGreaterThanOrEqual(4);
  });

  test("obstacles do not block S or E", () => {
    for (let seed = 0; seed < 20; seed++) {
      const board = generateBoard({ rows: 7, cols: 7, obstacleDensity: 0.2, seed });
      let sr = -1, sc = -1;
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (board.grid[r][c] === "S") { sr = r; sc = c; }
        }
      }
      // S should have at least one non-obstacle neighbor
      let hasOpenNeighbor = false;
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const nr = sr + dr, nc = sc + dc;
        if (nr >= 0 && nr < 7 && nc >= 0 && nc < 7 && board.grid[nr][nc] !== 1) {
          hasOpenNeighbor = true;
        }
      }
      expect(hasOpenNeighbor).toBe(true);
    }
  });
});

describe("generateLevel", () => {
  test("generates a solvable easy level", () => {
    const level = generateLevel({
      difficulty: "easy",
      seed: 42,
      maxAttempts: 200,
    });
    expect(level).not.toBeNull();
    if (level) {
      expect(level.metadata.solutionCount).toBeGreaterThanOrEqual(1);
      expect(level.rows).toBeGreaterThanOrEqual(5);
      expect(level.rows).toBeLessThanOrEqual(6);
    }
  });

  test("generates a solvable medium level", () => {
    const level = generateLevel({
      difficulty: "medium",
      seed: 99,
      maxAttempts: 500,
    });
    expect(level).not.toBeNull();
    if (level) {
      expect(level.metadata.solutionCount).toBeGreaterThanOrEqual(1);
    }
  });
});
