import { describe, test, expect } from "bun:test";
import { scoreDifficulty, calculateStars } from "./difficulty";

describe("scoreDifficulty", () => {
  test("short easy path scores low", () => {
    const score = scoreDifficulty({
      pathLength: 3,
      turnCount: 0,
      obstacleProximity: 0,
      piecePrecision: 0.5,
    });
    expect(score).toBeLessThan(3);
  });

  test("long winding path with exact pieces scores high", () => {
    const score = scoreDifficulty({
      pathLength: 20,
      turnCount: 8,
      obstacleProximity: 0.8,
      piecePrecision: 1.0,
    });
    expect(score).toBeGreaterThan(7);
  });
});

describe("calculateStars", () => {
  test("optimal count gets 3 stars", () => {
    expect(calculateStars(5, 5)).toEqual([5, 7]);
  });

  test("larger optimal count scales thresholds", () => {
    const [s3, s2] = calculateStars(12, 12);
    expect(s3).toBe(12);
    expect(s2).toBeGreaterThan(12);
  });
});
